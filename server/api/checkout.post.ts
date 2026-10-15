import { getSupabaseAdmin } from '~/server/utils/supabase'

type IncomingLine = { id: string; variantId?: string | null; quantity: number }
type CheckoutCustomer = {
  givenName: string
  familyName: string
  email: string
  streetAndNumber: string
  postalCode: string
  city: string
  country: 'SE'
}

type StripeCheckoutSession = {
  id: string
  url: string | null
  livemode: boolean
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = String(config.stripeSecretKey || '')

  // NEVER allow a live key through this test-only checkout implementation.
  if (!config.checkoutEnabled || !apiKey.startsWith('sk_test_')) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Norrli Pets Stripe test checkout is not connected yet. No real payments are accepted.'
    })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw createError({ statusCode: 503, statusMessage: 'Secure order storage is not configured.' })
  }

  const body = await readBody<{ lines?: IncomingLine[]; customer?: CheckoutCustomer }>(event)
  if (!Array.isArray(body?.lines) || body.lines.length < 1 || body.lines.length > 25) {
    throw createError({ statusCode: 400, statusMessage: 'Please check the items in your bag.' })
  }

  const customer = body.customer
  if (!customer || customer.country !== 'SE') {
    throw createError({ statusCode: 400, statusMessage: 'This test checkout supports Sweden only.' })
  }
  const required = ['givenName', 'familyName', 'email', 'streetAndNumber', 'postalCode', 'city'] as const
  for (const key of required) {
    if (typeof customer[key] !== 'string' || !customer[key].trim() || customer[key].length > 200) {
      throw createError({ statusCode: 400, statusMessage: 'Complete your delivery details before checkout.' })
    }
  }
  const email = customer.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a valid email address.' })
  }

  const productIds = [...new Set(body.lines.map(line => line.id))]
  const variantIds = [...new Set(body.lines.map(line => line.variantId).filter(Boolean) as string[])]
  const [{ data: products, error: productError }, { data: variants, error: variantError }] = await Promise.all([
    supabase.from('products')
      .select('id,name,price,active,supplier_id,supplier_sku,supplier_cost,stock_quantity')
      .in('id', productIds).eq('active', true),
    variantIds.length
      ? supabase.from('product_variants')
          .select('id,product_id,name,sku,price,supplier_sku,supplier_cost,stock_quantity,active')
          .in('id', variantIds).eq('active', true)
      : Promise.resolve({ data: [], error: null } as any)
  ])
  if (productError || variantError || !products || products.length !== productIds.length) {
    throw createError({ statusCode: 400, statusMessage: 'One or more products are unavailable.' })
  }
  const byId = new Map(products.map(product => [product.id, product]))
  const byVariant = new Map((variants || []).map((variant: any) => [variant.id, variant]))
  const quantityBySku = new Map<string, number>()

  const lines = body.lines.map(line => {
    const product: any = byId.get(line.id)
    const variant: any = line.variantId ? byVariant.get(line.variantId) : null
    if (!product || (line.variantId && (!variant || variant.product_id !== product.id))) {
      throw createError({ statusCode: 400, statusMessage: 'One selected product option is not available.' })
    }
    const quantity = Number(line.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid quantity in bag.' })
    }
    const skuKey = `${product.id}:${variant?.id || 'base'}`
    const newQuantity = (quantityBySku.get(skuKey) || 0) + quantity
    quantityBySku.set(skuKey, newQuantity)
    const available = variant?.stock_quantity ?? product.stock_quantity
    if (available != null && newQuantity > available) {
      throw createError({ statusCode: 400, statusMessage: `${product.name} exceeds available stock.` })
    }
    const unitAmount = Number(variant?.price ?? product.price)
    if (!Number.isSafeInteger(unitAmount) || unitAmount < 50 || unitAmount > 100000000) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid catalog price.' })
    }
    return { product, variant, quantity, unitAmount }
  })
  const amount = lines.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0)
  if (!Number.isSafeInteger(amount) || amount < 50 || amount > 100000000) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid order amount.' })
  }

  // All prices are fetched from Supabase, never trusted from the browser.
  // Shipping is 0 ONLY for sandbox transactions; live checkout must remain disabled
  // until supplier shipping, Swedish VAT and consumer policies are approved.
  const orderNumber = `NR-TEST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const fullName = `${customer.givenName.trim()} ${customer.familyName.trim()}`
  const { data: order, error: orderError } = await supabase.from('orders')
    .insert({
      order_number: orderNumber,
      email,
      customer_name: fullName,
      currency: 'sek',
      amount_total: amount,
      payment_provider: 'stripe_test',
      payment_status: 'unpaid',
      status: 'pending',
      shipping_address: {
        line1: customer.streetAndNumber.trim(),
        postal_code: customer.postalCode.trim(),
        city: customer.city.trim(),
        country: 'SE'
      }
    })
    .select('id')
    .single()
  if (orderError || !order) {
    throw createError({ statusCode: 503, statusMessage: 'Could not prepare your test order.' })
  }

  const { error: itemsError } = await supabase.from('order_items').insert(lines.map(({ product, variant, quantity, unitAmount }) => ({
    order_id: order.id,
    product_id: product.id,
    variant_id: variant?.id || null,
    variant_name: variant?.name || null,
    name: variant ? `${product.name} · ${variant.name}` : product.name,
    quantity,
    unit_amount: unitAmount,
    supplier_id: product.supplier_id || null,
    supplier_sku: variant?.supplier_sku || product.supplier_sku || null,
    supplier_cost: variant?.supplier_cost ?? product.supplier_cost ?? null
  })))
  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id)
    throw createError({ statusCode: 503, statusMessage: 'Could not prepare the test order items.' })
  }

  const siteUrl = String(config.public.siteUrl || 'https://norrlipets.se').replace(/\/$/, '')
  const params = new URLSearchParams({
    mode: 'payment',
    client_reference_id: orderNumber,
    customer_email: email,
    locale: 'sv',
    billing_address_collection: 'required',
    'shipping_address_collection[allowed_countries][0]': 'SE',
    success_url: `${siteUrl}/checkout/success?order=${encodeURIComponent(orderNumber)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout/cancel`,
    'metadata[orderNumber]': orderNumber,
    'metadata[sandboxOnly]': 'true',
    'payment_intent_data[metadata][orderNumber]': orderNumber
  })
  lines.forEach(({ product, variant, quantity, unitAmount }, index) => {
    params.set(`line_items[${index}][price_data][currency]`, 'sek')
    params.set(`line_items[${index}][price_data][unit_amount]`, String(unitAmount))
    params.set(`line_items[${index}][price_data][product_data][name]`,
      variant ? `${product.name} · ${variant.name}` : product.name)
    params.set(`line_items[${index}][quantity]`, String(quantity))
  })

  let session: StripeCheckoutSession
  try {
    session = await $fetch<StripeCheckoutSession>('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': orderNumber
      },
      body: params.toString()
    })
  } catch {
    await supabase.from('orders').update({ status: 'checkout_failed' }).eq('id', order.id)
    throw createError({ statusCode: 502, statusMessage: 'Stripe test checkout could not be created. Please try again.' })
  }

  if (!session?.id?.startsWith('cs_test_') || session.livemode !== false || !session.url?.startsWith('https://checkout.stripe.com/')) {
    throw createError({ statusCode: 502, statusMessage: 'Unexpected Stripe checkout response. No charge was made.' })
  }

  const { error: updateError } = await supabase.from('orders')
    .update({ stripe_checkout_session_id: session.id, provider_checkout_url: session.url })
    .eq('id', order.id)
  if (updateError) {
    throw createError({ statusCode: 503, statusMessage: 'Could not save the checkout session.' })
  }

  return { url: session.url, orderNumber, sandbox: true }
})

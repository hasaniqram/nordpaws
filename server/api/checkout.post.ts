import { getSupabasePublic } from '~/server/utils/supabase'

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

const toMoney = (ore: number) => (ore / 100).toFixed(2)

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.checkoutEnabled || !config.mollieApiKey) {
    throw createError({ statusCode: 503, statusMessage: 'Checkout is not live yet. The Norrli Pets Mollie account still needs to be connected.' })
  }

  const body = await readBody<{ lines?: IncomingLine[]; customer?: CheckoutCustomer }>(event)
  if (!body.lines?.length) throw createError({ statusCode: 400, statusMessage: 'Your bag is empty.' })

  const customer = body.customer
  if (!customer) throw createError({ statusCode: 400, statusMessage: 'Customer details are required.' })

  const required = ['givenName','familyName','email','streetAndNumber','postalCode','city'] as const
  for (const key of required) {
    if (!String(customer[key] || '').trim()) {
      throw createError({ statusCode: 400, statusMessage: 'Complete your delivery details before checkout.' })
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a valid email address.' })
  }

  const supabase = getSupabasePublic()
  if (!supabase) throw createError({ statusCode: 503, statusMessage: 'Product catalog is temporarily unavailable.' })

  const productIds = [...new Set(body.lines.map((line) => line.id))]
  const variantIds = [...new Set(body.lines.map((line) => line.variantId).filter(Boolean) as string[])]

  const [{ data: dbProducts, error: productError }, { data: dbVariants, error: variantError }] = await Promise.all([
    supabase
      .from('products')
      .select('id,name,price,active,supplier_id,supplier_sku,supplier_cost')
      .in('id', productIds)
      .eq('active', true),
    variantIds.length
      ? supabase
          .from('product_variants')
          .select('id,product_id,name,sku,price,supplier_sku,supplier_cost,stock_quantity,active')
          .in('id', variantIds)
          .eq('active', true)
      : Promise.resolve({ data: [], error: null } as any)
  ])

  if (productError || !dbProducts || dbProducts.length !== productIds.length || variantError) {
    throw createError({ statusCode: 400, statusMessage: 'One or more products are no longer available.' })
  }

  const productsById = new Map(dbProducts.map((product) => [product.id, product]))
  const variantsById = new Map((dbVariants || []).map((variant:any) => [variant.id, variant]))

  const normalizedLines = body.lines.map((line) => {
    const product:any = productsById.get(line.id)
    if (!product) throw createError({ statusCode: 400, statusMessage: 'One product is no longer available.' })

    const quantity = Math.max(1, Math.min(10, Number(line.quantity) || 1))
    const variant:any = line.variantId ? variantsById.get(line.variantId) : null

    if (line.variantId && (!variant || variant.product_id !== product.id)) {
      throw createError({ statusCode: 400, statusMessage: 'One selected product option is no longer available.' })
    }
    if (variant?.stock_quantity != null && quantity > variant.stock_quantity) {
      throw createError({ statusCode: 400, statusMessage: `${product.name} · ${variant.name} does not have enough stock.` })
    }

    const unitAmount = variant?.price ?? product.price
    return { product, variant, quantity, unitAmount }
  })

  const totalOre = normalizedLines.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0)
  const orderNumber = `NR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const siteUrl = config.public.siteUrl.replace(/\/$/, '')

  const mollieLines = normalizedLines.map(({ product, variant, quantity, unitAmount }) => ({
    type: 'physical',
    description: variant ? `${product.name} · ${variant.name}` : product.name,
    quantity,
    sku: variant?.sku || variant?.supplier_sku || product.supplier_sku || product.id,
    unitPrice: { currency: 'SEK', value: toMoney(unitAmount) },
    totalAmount: { currency: 'SEK', value: toMoney(unitAmount * quantity) }
  }))

  const payment = await $fetch<any>('https://api.mollie.com/v2/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.mollieApiKey}`,
      'Content-Type': 'application/json'
    },
    body: {
      amount: { currency: 'SEK', value: toMoney(totalOre) },
      description: `Norrli Pets ${orderNumber}`,
      redirectUrl: `${siteUrl}/checkout/success?order=${encodeURIComponent(orderNumber)}`,
      cancelUrl: `${siteUrl}/checkout/cancel`,
      webhookUrl: `${siteUrl}/api/mollie/webhook`,
      locale: 'sv_SE',
      restrictPaymentMethodsToCountry: 'SE',
      method: ['swish', 'klarna', 'creditcard', 'applepay'],
      billingAddress: {
        givenName: customer.givenName.trim(),
        familyName: customer.familyName.trim(),
        streetAndNumber: customer.streetAndNumber.trim(),
        postalCode: customer.postalCode.trim(),
        city: customer.city.trim(),
        country: 'SE',
        email: customer.email.trim().toLowerCase()
      },
      shippingAddress: {
        givenName: customer.givenName.trim(),
        familyName: customer.familyName.trim(),
        streetAndNumber: customer.streetAndNumber.trim(),
        postalCode: customer.postalCode.trim(),
        city: customer.city.trim(),
        country: 'SE',
        email: customer.email.trim().toLowerCase()
      },
      lines: mollieLines,
      metadata: {
        orderNumber,
        email: customer.email.trim().toLowerCase(),
        items: normalizedLines.map(({ product, variant, quantity, unitAmount }) => ({
          id: product.id,
          variantId: variant?.id || null,
          variantName: variant?.name || null,
          name: variant ? `${product.name} · ${variant.name}` : product.name,
          quantity,
          unitAmount,
          supplierId: product.supplier_id || null,
          supplierSku: variant?.supplier_sku || product.supplier_sku || null,
          supplierCost: variant?.supplier_cost ?? product.supplier_cost ?? null
        }))
      }
    }
  })

  const url = payment?._links?.checkout?.href
  if (!url) throw createError({ statusCode: 502, statusMessage: 'Payment checkout could not be created.' })

  return { url, orderNumber }
})

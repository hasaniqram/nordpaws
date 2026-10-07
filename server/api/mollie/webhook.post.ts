import { getSupabaseAdmin } from '~/server/utils/supabase'
import { sendOrderConfirmation } from '~/server/utils/email'

const toOre = (value: string | number | undefined) => {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.mollieApiKey) {
    throw createError({ statusCode: 503, statusMessage: 'Mollie webhook is not configured.' })
  }

  const body = await readBody<any>(event)
  const paymentId = typeof body === 'string'
    ? new URLSearchParams(body).get('id')
    : body?.id

  if (!paymentId || !String(paymentId).startsWith('tr_')) {
    throw createError({ statusCode: 400, statusMessage: 'Missing or invalid Mollie payment id.' })
  }

  const payment = await $fetch<any>(`https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Bearer ${config.mollieApiKey}`,
      Accept: 'application/json'
    }
  })

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw createError({ statusCode: 503, statusMessage: 'Server database credentials are not configured.' })
  }

  const metadata = payment.metadata || {}
  const orderNumber = metadata.orderNumber || `NP-${String(payment.id).slice(-8).toUpperCase()}`
  const email = payment.billingAddress?.email || metadata.email || null
  const amountTotal = toOre(payment.amount?.value)
  const paymentStatus = String(payment.status || 'unknown')

  const { data: existing } = await supabase
    .from('orders')
    .select('id,payment_status')
    .eq('provider_payment_id', payment.id)
    .maybeSingle()

  let orderId = existing?.id

  const orderPayload = {
    order_number: orderNumber,
    payment_provider: 'mollie',
    provider_payment_id: payment.id,
    provider_checkout_url: payment._links?.checkout?.href || null,
    email,
    customer_name: payment.billingAddress
      ? [payment.billingAddress.givenName, payment.billingAddress.familyName].filter(Boolean).join(' ')
      : null,
    amount_total: amountTotal,
    currency: String(payment.amount?.currency || 'SEK').toLowerCase(),
    payment_status: paymentStatus,
    status: paymentStatus === 'paid' ? 'paid' : paymentStatus,
    shipping_address: payment.shippingAddress || payment.billingAddress || null
  }

  if (existing) {
    const { error } = await supabase.from('orders').update(orderPayload).eq('id', existing.id)
    if (error) throw createError({ statusCode: 500, statusMessage: 'Could not update order.' })
  } else {
    const { data: inserted, error } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select('id')
      .single()

    if (error || !inserted) throw createError({ statusCode: 500, statusMessage: 'Could not create order.' })
    orderId = inserted.id

    const items = Array.isArray(metadata.items) ? metadata.items : []
    if (items.length) {
      await supabase.from('order_items').insert(items.map((item: any) => ({
        order_id: orderId,
        product_id: String(item.id || ''),
        name: String(item.name || 'Product'),
        quantity: Math.max(1, Number(item.quantity) || 1),
        unit_amount: Math.max(0, Number(item.unitAmount) || 0)
      })))
    }
  }

  if (paymentStatus === 'paid' && existing?.payment_status !== 'paid' && email) {
    try {
      await sendOrderConfirmation({ to: email, orderNumber, total: amountTotal })
    } catch {
      // Payment processing must not fail if the email provider is temporarily unavailable.
    }
  }

  return { received: true }
})

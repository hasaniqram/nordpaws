import { createHmac, timingSafeEqual } from 'node:crypto'
import { getSupabaseAdmin } from '~/server/utils/supabase'

type CheckoutSession = {
  id: string
  livemode?: boolean
  payment_status?: string
  amount_total?: number
  currency?: string
  client_reference_id?: string
  payment_intent?: string | { id: string } | null
  customer_details?: { email?: string | null }
}

function isValidStripeSignature(payload: string, signatureHeader: string, secret: string): boolean {
  const pairs = signatureHeader.split(',').map(part => part.trim().split('='))
  const timestamp = pairs.find(([key]) => key === 't')?.[1]
  const signatures = pairs.filter(([key]) => key === 'v1').map(([, value]) => value)
  if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length < 1) return false

  // Reject events older than five minutes to reduce replay risk.
  const sentAt = Number(timestamp)
  if (!Number.isSafeInteger(sentAt) || Math.abs(Date.now() / 1000 - sentAt) > 300) return false
  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest()
  return signatures.some(value => {
    if (!value || !/^[0-9a-f]{64}$/i.test(value)) return false
    const incoming = Buffer.from(value, 'hex')
    return incoming.length === expected.length && timingSafeEqual(expected, incoming)
  })
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const signingSecret = String(config.stripeWebhookSecret || '')
  if (!signingSecret.startsWith('whsec_')) {
    throw createError({ statusCode: 503, statusMessage: 'Stripe webhook not configured.' })
  }

  // Stripe signs the ORIGINAL request bytes. Never verify JSON after parsing it.
  const raw = await readRawBody(event)
  const sig = getHeader(event, 'stripe-signature') || ''
  if (!raw || !isValidStripeSignature(raw, sig, signingSecret)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid Stripe webhook signature.' })
  }

  let message: { type: string; data?: { object?: CheckoutSession } }
  try {
    message = JSON.parse(raw)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Malformed webhook payload.' })
  }

  if (![
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'checkout.session.expired'
  ].includes(message.type)) return { received: true }

  const session = message.data?.object
  if (!session?.id?.startsWith('cs_test_') || session.livemode !== false) {
    // This endpoint explicitly handles SANDBOX payments only.
    throw createError({ statusCode: 400, statusMessage: 'Only test-mode payments are accepted.' })
  }
  const orderNumber = session.client_reference_id
  if (!orderNumber?.startsWith('NR-TEST-')) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown sandbox order.' })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw createError({ statusCode: 503, statusMessage: 'Order database is not configured.' })
  }

  const { data: order, error: lookupError } = await supabase.from('orders')
    .select('id,order_number,stripe_checkout_session_id,amount_total,currency,payment_status,payment_provider')
    .eq('order_number', orderNumber)
    .maybeSingle()
  if (lookupError || !order) {
    throw createError({ statusCode: 503, statusMessage: 'Cannot locate sandbox order.' })
  }
  if (order.payment_provider !== 'stripe_test' || order.stripe_checkout_session_id !== session.id) {
    throw createError({ statusCode: 400, statusMessage: 'Checkout session does not match order.' })
  }
  if (order.amount_total !== session.amount_total || order.currency !== session.currency?.toLowerCase()) {
    throw createError({ statusCode: 400, statusMessage: 'Payment amount does not match order.' })
  }

  const isPaid = session.payment_status === 'paid' &&
    ['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(message.type)

  // Never overwrite a paid order with a later failed or expired webhook.
  if (order.payment_status === 'paid') return { received: true }
  const nextStatus = isPaid ? 'paid' : (
    message.type === 'checkout.session.expired' ? 'expired'
      : message.type === 'checkout.session.async_payment_failed' ? 'failed' : 'unpaid'
  )

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent : session.payment_intent?.id || null

  const { error: updateError } = await supabase.from('orders')
    .update({
      payment_status: nextStatus,
      status: isPaid ? 'test_paid' : nextStatus,
      provider_payment_id: paymentIntentId || null
    })
    .eq('id', order.id)
    .neq('payment_status', 'paid')
  if (updateError) {
    throw createError({ statusCode: 503, statusMessage: 'Cannot update sandbox order.' })
  }

  // Sandbox order emails/fulfillment are deliberately NOT triggered.
  return { received: true }
})

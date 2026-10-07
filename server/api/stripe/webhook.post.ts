import Stripe from 'stripe'
import { getSupabaseAdmin } from '~/server/utils/supabase'
import { sendOrderConfirmation } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.stripeSecretKey || !config.stripeWebhookSecret) throw createError({ statusCode: 503, statusMessage: 'Stripe webhook is not configured.' })
  const signature = getHeader(event, 'stripe-signature')
  if (!signature) throw createError({ statusCode: 400, statusMessage: 'Missing Stripe signature.' })
  const raw = await readRawBody(event)
  if (!raw) throw createError({ statusCode: 400, statusMessage: 'Missing request body.' })

  const stripe = new Stripe(config.stripeSecretKey)
  let stripeEvent: Stripe.Event
  try { stripeEvent = stripe.webhooks.constructEvent(raw, signature, config.stripeWebhookSecret) }
  catch { throw createError({ statusCode: 400, statusMessage: 'Invalid Stripe signature.' }) }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const orderNumber = `NP-${session.id.slice(-8).toUpperCase()}`
    const supabase = getSupabaseAdmin()
    if (supabase) {
      await supabase.from('orders').upsert({
        stripe_checkout_session_id: session.id,
        order_number: orderNumber,
        email: session.customer_details?.email,
        amount_total: session.amount_total ?? 0,
        currency: session.currency ?? 'sek',
        payment_status: session.payment_status,
        status: 'paid'
      }, { onConflict: 'stripe_checkout_session_id' })
    }
    if (session.customer_details?.email) await sendOrderConfirmation({ to: session.customer_details.email, orderNumber, total: session.amount_total ?? 0 })
  }

  return { received: true }
})

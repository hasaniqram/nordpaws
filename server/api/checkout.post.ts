import Stripe from 'stripe'
import { products } from '~/data/products'

type IncomingLine = { id: string; quantity: number }

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.checkoutEnabled || !config.stripeSecretKey) {
    throw createError({ statusCode: 503, statusMessage: 'Checkout is not live yet. The dedicated NORDPAWS payment account still needs to be connected.' })
  }

  const body = await readBody<{ lines?: IncomingLine[] }>(event)
  if (!body.lines?.length) throw createError({ statusCode: 400, statusMessage: 'Your bag is empty.' })

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  for (const line of body.lines) {
    const product = products.find((item) => item.id === line.id)
    if (!product) throw createError({ statusCode: 400, statusMessage: 'One product is no longer available.' })
    const quantity = Math.max(1, Math.min(10, Number(line.quantity) || 1))
    lineItems.push({
      quantity,
      price_data: {
        currency: 'sek',
        unit_amount: product.price,
        product_data: { name: product.name, description: product.subtitle }
      }
    })
  }

  const stripe = new Stripe(config.stripeSecretKey)
  const siteUrl = config.public.siteUrl
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/cart`,
    billing_address_collection: 'auto',
    shipping_address_collection: { allowed_countries: ['SE', 'DK', 'FI', 'DE'] },
    allow_promotion_codes: true,
    phone_number_collection: { enabled: true }
  })

  return { url: session.url }
})

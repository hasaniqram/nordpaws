import { getSupabasePublic } from '~/server/utils/supabase'

type IncomingLine = { id: string; quantity: number }
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

  const ids = [...new Set(body.lines.map((line) => line.id))]
  const { data: dbProducts, error } = await supabase
    .from('products')
    .select('id,name,price,active')
    .in('id', ids)
    .eq('active', true)

  if (error || !dbProducts || dbProducts.length !== ids.length) {
    throw createError({ statusCode: 400, statusMessage: 'One or more products are no longer available.' })
  }

  const byId = new Map(dbProducts.map((product) => [product.id, product]))
  const normalizedLines = body.lines.map((line) => {
    const product = byId.get(line.id)
    if (!product) throw createError({ statusCode: 400, statusMessage: 'One product is no longer available.' })
    const quantity = Math.max(1, Math.min(10, Number(line.quantity) || 1))
    return { product, quantity }
  })

  const totalOre = normalizedLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  const orderNumber = `NR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const siteUrl = config.public.siteUrl.replace(/\/$/, '')

  const mollieLines = normalizedLines.map(({ product, quantity }) => ({
    type: 'physical',
    description: product.name,
    quantity,
    sku: product.id,
    unitPrice: { currency: 'SEK', value: toMoney(product.price) },
    totalAmount: { currency: 'SEK', value: toMoney(product.price * quantity) }
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
        items: normalizedLines.map(({ product, quantity }) => ({
          id: product.id,
          name: product.name,
          quantity,
          unitAmount: product.price
        }))
      }
    }
  })

  const url = payment?._links?.checkout?.href
  if (!url) throw createError({ statusCode: 502, statusMessage: 'Payment checkout could not be created.' })

  return { url, orderNumber }
})

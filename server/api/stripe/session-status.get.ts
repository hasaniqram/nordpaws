export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = String(config.stripeSecretKey || '')
  const query = getQuery(event)
  const sessionId = typeof query.session_id === 'string' ? query.session_id : ''
  const order = typeof query.order === 'string' ? query.order : ''

  if (!/^cs_test_[a-zA-Z0-9_]+$/.test(sessionId) || !/^NR-TEST-[A-F0-9]{8}$/.test(order)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid test checkout reference.' })
  }
  if (!apiKey.startsWith('sk_test_')) {
    throw createError({ statusCode: 503, statusMessage: 'Stripe test account is not configured.' })
  }

  let session: {
    id: string
    livemode: boolean
    client_reference_id: string | null
    payment_status: string
    status: string
  }
  try {
    session = await $fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Unable to verify the test payment.' })
  }

  if (session.livemode !== false || session.client_reference_id !== order) {
    throw createError({ statusCode: 404, statusMessage: 'Test checkout not found.' })
  }
  setHeader(event, 'Cache-Control', 'no-store')
  return { paid: session.payment_status === 'paid', status: session.status, sandbox: true }
})

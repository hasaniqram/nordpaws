import { getSupabaseAdmin } from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const config = useRuntimeConfig()
  const stripeKey = String(config.stripeSecretKey || '')
  const signingSecret = String(config.stripeWebhookSecret || '')

  let stripeConnected = false
  let stripeAccountMatches = false
  if (stripeKey.startsWith('sk_test_')) {
    try {
      const account = await $fetch<{id: string}>('https://api.stripe.com/v1/account', {
        headers: { Authorization: `Bearer ${stripeKey}` }
      })
      stripeConnected = !!account.id
      stripeAccountMatches = account.id === 'acct_1UQeMxPpdQ56sXpI'
    } catch { /* test key unavailable */ }
  }

  let databaseConnected = false
  try {
    const client = getSupabaseAdmin()
    if (client) {
      const result = await client.from('products').select('id', {head:true, count:'exact'})
      databaseConnected = !result.error
    }
  } catch { /* secret key unavailable */ }

  return {
    sandboxOnly: stripeKey.startsWith('sk_test_'),
    stripeConnected,
    stripeAccountMatches,
    webhookConfigured: signingSecret.startsWith('whsec_'),
    databaseConnected,
    checkoutEnabled: !!config.checkoutEnabled
  }
})

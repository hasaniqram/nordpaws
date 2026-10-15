import { getSupabaseAdmin } from '~/server/utils/supabase'
import { extractBearerToken, verifiedCustomerEmail, findVerifiedCustomerOrders } from '~/server/utils/customerOrders.mjs'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Authorization')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')

  const token = extractBearerToken(getHeader(event, 'authorization'))
  // Authentication happens before any database access or access to service-role credentials.
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Logga in för att se dina beställningar.' })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw createError({ statusCode: 503, statusMessage: 'Orderhistorik är inte konfigurerad ännu.' })
  }

  // Verify against Supabase Auth on each request; never trust JWT claims or email sent by the client.
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !verifiedCustomerEmail(data?.user)) {
    throw createError({ statusCode: 401, statusMessage: 'En verifierad e-postadress krävs.' })
  }

  try {
    return { orders: await findVerifiedCustomerOrders(supabase, data.user) }
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Det gick inte att hämta orderhistoriken.' })
  }
})

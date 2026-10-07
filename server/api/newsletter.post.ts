import { getSupabasePublic } from '~/server/utils/supabase'
import { enforceRateLimit } from '~/server/utils/rateLimit'

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, 'newsletter', 5)
  const body = await readBody<{ email?: string; locale?: string }>(event)
  const email = String(body.email || '').trim().toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a valid email address.' })
  }

  const supabase = getSupabasePublic()
  if (!supabase) throw createError({ statusCode: 503, statusMessage: 'Newsletter signup is temporarily unavailable.' })

  const { error } = await supabase.from('newsletter_subscribers').insert({
    email,
    locale: body.locale === 'sv' ? 'sv' : 'en',
    status: 'active',
    source: 'website'
  })

  if (error && error.code !== '23505') {
    throw createError({ statusCode: 500, statusMessage: 'We could not save your signup.' })
  }

  return { ok: true, alreadySubscribed: error?.code === '23505' }
})

import { getSupabasePublic } from '~/server/utils/supabase'
import { enforceRateLimit } from '~/server/utils/rateLimit'

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, 'contact', 4)
  const body = await readBody<{ name?: string; email?: string; message?: string }>(event)

  const name = String(body.name || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const message = String(body.message || '').trim()

  if (name.length < 2 || name.length > 100) throw createError({ statusCode: 400, statusMessage: 'Enter your name.' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw createError({ statusCode: 400, statusMessage: 'Enter a valid email address.' })
  if (message.length < 10 || message.length > 4000) throw createError({ statusCode: 400, statusMessage: 'Message must be between 10 and 4000 characters.' })

  const supabase = getSupabasePublic()
  if (!supabase) throw createError({ statusCode: 503, statusMessage: 'Contact form is temporarily unavailable.' })

  const { error } = await supabase.from('contact_messages').insert({ name, email, message, status: 'new' })
  if (error) throw createError({ statusCode: 500, statusMessage: 'We could not send your message.' })

  return { ok: true }
})

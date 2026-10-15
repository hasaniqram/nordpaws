import { getSupabasePublic } from '~/server/utils/supabase'
import { enforceRateLimit } from '~/server/utils/rateLimit'
import { prepareSupportMessage } from '~/server/utils/supportMessage.mjs'

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, 'contact', 4)
  const body = await readBody<{
    name?:string;email?:string;message?:string;topic?:string;orderReference?:string
  }>(event)

  let data
  try {
    data = prepareSupportMessage(body)
  } catch (error:any) {
    throw createError({ statusCode:400,statusMessage:error?.message||'Kontrollera uppgifterna.' })
  }

  const supabase = getSupabasePublic()
  if (!supabase) throw createError({ statusCode:503,statusMessage:'Kontaktformuläret är tillfälligt otillgängligt.' })

  // No outbound email, no ticket ID, and no SLA is asserted.
  // topic / reference are included in the message for compatibility with the existing schema.
  const { error } = await supabase.from('contact_messages').insert({
    name:data.name,email:data.email,message:data.message,status:'new'
  })
  if (error) throw createError({ statusCode:503,statusMessage:'Det gick inte att spara ditt meddelande. Försök igen senare.' })

  return { ok:true }
})

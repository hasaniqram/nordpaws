import { getSupabaseAdmin } from '~/server/utils/supabase'
import { timingSafeEqual } from 'node:crypto'

// Brevo transactional callback. Configure a bearer-authenticated webhook in Brevo.
// Never accept events when the shared secret is unset.
export default defineEventHandler(async event=>{
 setHeader(event,'Cache-Control','no-store')
 const expected=String(useRuntimeConfig().brevoWebhookToken||'')
 const supplied=/^Bearer (.{16,512})$/i.exec(getHeader(event,'authorization')||'')?.[1]||''
 if(!expected||expected.length<24||supplied.length!==expected.length||
    !timingSafeEqual(Buffer.from(supplied),Buffer.from(expected)))
  throw createError({statusCode:401,statusMessage:'Unauthorized'})
 const payload=await readBody<{event?:string;email?:string;'message-id'?:string;ts_event?:number}>(event)
 const type=String(payload?.event||'')
 const messageId=String(payload?.['message-id']||'')
 const email=String(payload?.email||'').trim().toLowerCase()
 const accepted=['delivered','hard_bounce','soft_bounce','invalid_email','blocked','error','spam']
 if(!accepted.includes(type)||!messageId||messageId.length>300||!email||email.length>254)
  throw createError({statusCode:400,statusMessage:'Invalid provider event'})
 const db=getSupabaseAdmin()
 if(!db)throw createError({statusCode:503,statusMessage:'Storage unavailable'})
 const {data:attempt,error:lookupError}=await db.from('reminder_delivery_attempts')
  .select('id,delivery_event,recipient').eq('provider_message_id',messageId).maybeSingle()
 if(lookupError)throw createError({statusCode:503,statusMessage:'Lookup unavailable'})
 if(!attempt||attempt.recipient!==email)return {accepted:true,matched:false}
 // A recorded negative outcome cannot be reset to delivered by a later callback.
 const negative=['hard_bounce','soft_bounce','invalid_email','blocked','error','spam']
 if(negative.includes(attempt.delivery_event||'')&&type==='delivered')return {accepted:true,matched:true}
 const {error:writeError}=await db.from('reminder_delivery_attempts')
  .update({delivery_event:type,delivery_event_at:new Date().toISOString()})
  .eq('id',attempt.id)
 if(writeError)throw createError({statusCode:503,statusMessage:'Unable to save event'})
 return {accepted:true,matched:true}
})

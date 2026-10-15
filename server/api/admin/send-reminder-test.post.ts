import { getSupabaseAdmin } from '~/server/utils/supabase'

// Explicit, administrator-initiated test only. Never called by a scheduler.
export default defineEventHandler(async event=>{
 setHeader(event,'Cache-Control','private, no-store')
 const token=/^Bearer ([A-Za-z0-9._~-]{1,4096})$/i.exec(getHeader(event,'authorization')||'')?.[1]
 if(!token)throw createError({statusCode:401,statusMessage:'Sign in required'})
 const db=getSupabaseAdmin();if(!db)throw createError({statusCode:503,statusMessage:'Admin database unavailable'})
 const {data:{user},error:authError}=await db.auth.getUser(token)
 if(authError||!user||user.is_anonymous||!user.email_confirmed_at||!user.email)
  throw createError({statusCode:401,statusMessage:'Verified administrator required'})
 const {data:admin,error:adminError}=await db.from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
 if(adminError||!admin)throw createError({statusCode:403,statusMessage:'Not authorized'})
 const {data:pref,error:prefError}=await db.from('review_reminder_preferences')
  .select('email,verified').eq('admin_id',user.id).maybeSingle()
 if(prefError||!pref?.verified||pref.email.trim().toLowerCase()!==user.email.toLowerCase())
  throw createError({statusCode:422,statusMessage:'Verify your administrator email first'})
 const body=await readBody<{deliveryKey?:string;confirm?:boolean}>(event)
 if(!body||body.confirm!==true||typeof body.deliveryKey!=='string'||body.deliveryKey.length>350)
  throw createError({statusCode:400,statusMessage:'Confirm a reserved test explicitly'})
 const cfg=useRuntimeConfig()
 const apiKey=String(cfg.brevoApiKey||'')
 const fromEmail=String(cfg.brevoSenderEmail||'')
 if(!apiKey||!/^\S+@\S+\.\S+$/.test(fromEmail))
  throw createError({statusCode:503,statusMessage:'Brevo sender configuration is incomplete. No email sent.'})
 const {data:reserved,error:lookupError}=await db.from('reminder_delivery_attempts')
  .select('id,status,recipient,delivery_key').eq('admin_id',user.id)
  .eq('delivery_key',body.deliveryKey).maybeSingle()
 if(lookupError||!reserved||reserved.status!=='reserved'||reserved.recipient!==user.email.toLowerCase())
  throw createError({statusCode:409,statusMessage:'A valid unsent reservation is required'})
 // Atomic claim: concurrent requests can only claim an unclaimed reservation once.
 const {data:claimed,error:claimError}=await db.from('reminder_delivery_attempts')
  .update({claimed_at:new Date().toISOString(),updated_at:new Date().toISOString()})
  .eq('id',reserved.id).eq('admin_id',user.id).eq('status','reserved').is('claimed_at',null)
  .select('id').maybeSingle()
 if(claimError||!claimed)throw createError({statusCode:409,statusMessage:'Test already claimed or unavailable'})
 try{
  const response=await fetch('https://api.brevo.com/v3/smtp/email',{
   method:'POST',
   headers:{'api-key':apiKey,'content-type':'application/json','accept':'application/json'},
   body:JSON.stringify({
    sender:{name:'Norrli Pets',email:fromEmail},
    to:[{email:user.email}],
    subject:'Norrli Pets — admin reminder delivery test',
    textContent:'This is a manually requested Norrli Pets administrator reminder delivery test. No supplier or customer message was sent.'
   })
  })
  const payload=await response.json().catch(()=>({})) as {messageId?:string}
  if(!response.ok||!payload.messageId)throw new Error('provider_rejected')
  await db.from('reminder_delivery_attempts').update({status:'sent',provider_message_id:payload.messageId,updated_at:new Date().toISOString()}).eq('id',claimed.id)
  return {sent:true,message:'Test accepted by the email provider. Check your inbox and delivery logs.'}
 }catch{
  await db.from('reminder_delivery_attempts').update({status:'failed',error_code:'provider_failure_or_unknown',updated_at:new Date().toISOString()}).eq('id',claimed.id)
  throw createError({statusCode:502,statusMessage:'Delivery was not confirmed; this reservation cannot be retried.'})
 }
})

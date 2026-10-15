import { getSupabaseAdmin } from '~/server/utils/supabase'
import { reminderKey } from '~/utils/reminderDeliveryPolicy.mjs'

// Reserve an administrator-only reminder test idempotently; does NOT send email.
export default defineEventHandler(async event => {
 setHeader(event,'Cache-Control','private, no-store')
 const token=/^Bearer ([A-Za-z0-9._~-]{1,4096})$/i.exec(getHeader(event,'authorization')||'')?.[1]
 if(!token)throw createError({statusCode:401,statusMessage:'Sign in required'})
 const db=getSupabaseAdmin()
 if(!db)throw createError({statusCode:503,statusMessage:'Secure database unavailable'})
 const {data:{user},error:authError}=await db.auth.getUser(token)
 if(authError||!user||user.is_anonymous||!user.email_confirmed_at||!user.email)
  throw createError({statusCode:401,statusMessage:'Verified administrator required'})
 const {data:admin}=await db.from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
 if(!admin)throw createError({statusCode:403,statusMessage:'Admin access required'})
 const {data:pref,error:prefError}=await db.from('review_reminder_preferences')
  .select('email,verified,advance_days').eq('admin_id',user.id).maybeSingle()
 if(prefError||!pref||!pref.verified||pref.email.trim().toLowerCase()!==user.email.toLowerCase())
  throw createError({statusCode:422,statusMessage:'Confirm your administrator recipient email first'})
 const body=await readBody<{productId?:string}>(event)
 if(!body||typeof body.productId!=='string'||body.productId.length>160)
  throw createError({statusCode:400,statusMessage:'Choose a valid product'})
 const {data:review}=await db.from('product_evidence_reviews')
  .select('product_id,review_due_on').eq('product_id',body.productId).maybeSingle()
 if(!review?.review_due_on)throw createError({statusCode:404,statusMessage:'No scheduled review for that product'})
 const key=reminderKey(user.id,review.product_id,review.review_due_on,pref.advance_days)
 if(!key)throw createError({statusCode:422,statusMessage:'Invalid reminder configuration'})
 const {error:insertError}=await db.from('reminder_delivery_attempts')
  .insert({admin_id:user.id,delivery_key:key,recipient:user.email.toLowerCase(),status:'reserved'})
 if(insertError){
  if(insertError.code==='23505')return {reserved:false,duplicate:true,sent:false,message:'A test reservation already exists for this review.'}
  throw createError({statusCode:503,statusMessage:'Could not reserve delivery test'})
 }
 return {reserved:true,duplicate:false,sent:false,deliveryKey:key,message:'Test reservation recorded. No email sent.'}
})

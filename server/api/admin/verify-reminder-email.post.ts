import { getSupabaseAdmin } from '~/server/utils/supabase'

// Verify ownership of the recipient using the administrator's already confirmed login email.
// No emails are sent here, and this cannot enable scheduled delivery.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const bearer=getHeader(event,'authorization')||''
  const token=/^Bearer ([A-Za-z0-9._~-]{1,4096})$/i.exec(bearer)?.[1]
  if(!token)throw createError({statusCode:401,statusMessage:'Admin sign-in required'})
  const db=getSupabaseAdmin()
  if(!db)throw createError({statusCode:503,statusMessage:'Verification service not configured'})
  const {data:{user},error:authError}=await db.auth.getUser(token)
  if(authError||!user||user.is_anonymous||!user.email_confirmed_at||!user.email)
    throw createError({statusCode:401,statusMessage:'Confirmed email sign-in required'})
  const {data:admin,error:adminError}=await db.from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
  if(adminError||!admin)throw createError({statusCode:403,statusMessage:'Admin access denied'})
  const {data:pref,error:prefError}=await db.from('review_reminder_preferences')
    .select('email,verified').eq('admin_id',user.id).maybeSingle()
  if(prefError||!pref)throw createError({statusCode:404,statusMessage:'Save reminder preferences first'})
  if(pref.email.trim().toLowerCase()!==user.email.trim().toLowerCase())
    throw createError({statusCode:422,statusMessage:'For verification, the recipient must match your confirmed admin sign-in email'})
  const {data:updated,error:writeError}=await db.from('review_reminder_preferences').update({
    verified:true,enabled:false,updated_at:new Date().toISOString()
  }).eq('admin_id',user.id).eq('email',pref.email).select('verified,enabled').maybeSingle()
  if(writeError||!updated)throw createError({statusCode:503,statusMessage:'Unable to save verification'})
  return {verified:updated.verified,enabled:false,delivery:'disabled'}
})

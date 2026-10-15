import { getSupabaseAdmin } from '~/server/utils/supabase'
export default defineEventHandler(async event=>{
 setHeader(event,'Cache-Control','private, no-store')
 const token=/^Bearer ([A-Za-z0-9._~-]{1,4096})$/i.exec(getHeader(event,'authorization')||'')?.[1]
 if(!token)throw createError({statusCode:401,statusMessage:'Admin sign-in required'})
 const db=getSupabaseAdmin()
 if(!db)throw createError({statusCode:503,statusMessage:'Admin database unavailable'})
 const {data:{user},error:authError}=await db.auth.getUser(token)
 if(authError||!user||user.is_anonymous||!user.email_confirmed_at)
  throw createError({statusCode:401,statusMessage:'Verified sign-in required'})
 const {data:admin,error:adminError}=await db.from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
 if(adminError||!admin)throw createError({statusCode:403,statusMessage:'Admin access denied'})
 const cfg=useRuntimeConfig()
 return {
  providerConfigured:Boolean(String(cfg.brevoApiKey||'').trim()),
  senderConfigured:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(cfg.brevoSenderEmail||'')),
  senderDomainConfirmed:false,
  automaticRemindersEnabled:false
 }
})

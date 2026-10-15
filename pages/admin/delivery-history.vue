<script setup lang="ts">
import { ArrowLeft, RefreshCw, ShieldCheck, MailCheck, History } from 'lucide-vue-next'
type Attempt={id:string;recipient:string;status:string;provider_message_id:string|null;error_code:string|null;created_at:string;claimed_at:string|null;updated_at:string}
const loading=ref(true),authorized=ref(false),error=ref(''),attempts=ref<Attempt[]>([])
const config=ref<{providerConfigured:boolean;senderConfigured:boolean;senderDomainConfirmed:boolean;automaticRemindersEnabled:boolean}|null>(null)
const load=async()=>{
 loading.value=true;error.value=''
 try{
 const client=useSupabaseBrowser();if(!client)throw new Error('Admin connection unavailable')
 const {data:{session}}=await client.auth.getSession()
 if(!session?.access_token){await navigateTo('/admin/login');return}
 const {data:{user}}=await client.auth.getUser()
 if(!user){await navigateTo('/admin/login');return}
 const {data:admin,error:adminError}=await client.from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
 if(adminError||!admin){authorized.value=false;return}
 authorized.value=true
 const [a,c]=await Promise.all([
 client.from('reminder_delivery_attempts').select('id,recipient,status,provider_message_id,error_code,created_at,claimed_at,updated_at').order('created_at',{ascending:false}).limit(100),
 $fetch<{providerConfigured:boolean;senderConfigured:boolean;senderDomainConfirmed:boolean;automaticRemindersEnabled:boolean}>('/api/admin/reminder-provider-status',{headers:{Authorization:'Bearer '+session.access_token}})
 ])
 if(a.error)throw a.error
 attempts.value=a.data||[];config.value=c
 }catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to load delivery audit'}
 finally{loading.value=false}
}
const totals=computed(()=>({sent:attempts.value.filter(x=>x.status==='sent').length,failed:attempts.value.filter(x=>x.status==='failed').length,reserved:attempts.value.filter(x=>x.status==='reserved').length}))
onMounted(load)
useSeoMeta({title:'Email delivery audit — Norrli Pets',robots:'noindex,nofollow'})
</script>
<template>
<main class="admin-shell nr-delivery"><header class="admin-topbar"><NorrliLogo compact/><div class="admin-top-actions"><NuxtLink to="/admin/reminders" class="btn btn-secondary compact"><ArrowLeft :size="16"/> Reminders</NuxtLink><button type="button" class="btn btn-secondary compact" @click="load"><RefreshCw :size="16"/> Refresh</button></div></header>
<section v-if="loading" class="admin-center" role="status">Loading delivery history…</section>
<section v-else-if="!authorized" class="admin-center"><h1>Administrator access required</h1></section>
<template v-else><div class="nr-delivery-heading"><span class="eyebrow"><History :size="16"/> PRIVATE DELIVERY AUDIT</span><h1>Reminder delivery history</h1><p>Review test reservations and provider acceptance without exposing API keys. Provider acceptance is not the same as confirmed inbox delivery.</p></div>
<p v-if="error" class="admin-feedback error" role="alert">{{error}}</p>
<div class="nr-delivery-notice"><ShieldCheck :size="20"/> Scheduled reminders remain disabled. This page is read-only and does not send messages.</div>
<div class="nr-delivery-cards"><div><small>Provider accepted</small><strong>{{totals.sent}}</strong></div><div><small>Failed or uncertain</small><strong>{{totals.failed}}</strong></div><div><small>Reserved</small><strong>{{totals.reserved}}</strong></div></div>
<section class="nr-delivery-section"><h2><MailCheck :size="20"/> Configuration readiness</h2><p>Brevo API key: <strong>{{config?.providerConfigured?'Configured':'Not configured'}}</strong></p><p>Sender address: <strong>{{config?.senderConfigured?'Configured':'Not configured'}}</strong></p><p>Sender domain verification: <strong>{{config?.senderDomainConfirmed?'Confirmed':'Not independently verified'}}</strong></p><p>Automatic reminders: <strong>Disabled</strong></p></section>
<section class="nr-delivery-section"><h2>Recent delivery attempts</h2><p v-if="!attempts.length">No test delivery reservations yet.</p><div v-else class="nr-table-wrap"><table><thead><tr><th>Date</th><th>Recipient</th><th>Status</th><th>Provider message ID</th><th>Error</th></tr></thead><tbody><tr v-for="attempt in attempts" :key="attempt.id"><td>{{new Date(attempt.created_at).toLocaleString('sv-SE')}}</td><td>{{attempt.recipient}}</td><td>{{attempt.status==='sent'?'Provider accepted':attempt.status==='failed'?'Failed / unknown':'Reserved'}}</td><td>{{attempt.provider_message_id||'—'}}</td><td>{{attempt.error_code||'—'}}</td></tr></tbody></table></div></section></template></main>
</template>
<style scoped>
.nr-delivery-heading{margin:38px 34px 20px;max-width:900px}.nr-delivery-heading h1{font:500 clamp(34px,4vw,50px)/1.1 Georgia,serif;color:#1f4934;margin:12px 0}.nr-delivery-heading p{color:#667968;line-height:1.65}.nr-delivery-notice{display:flex;gap:12px;align-items:center;margin:0 34px 20px;padding:17px;border-radius:15px;border:1px solid #d3e3cb;background:#eaf1e6;color:#325942;font-size:13px}.nr-delivery-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 34px 20px}.nr-delivery-cards>div,.nr-delivery-section{padding:22px;background:#fff;border:1px solid #dce6d8;border-radius:18px}.nr-delivery-cards small{display:block;color:#67806f}.nr-delivery-cards strong{font-size:31px;color:#214b34}.nr-delivery-section{margin:0 34px 18px}.nr-delivery-section h2{display:flex;gap:9px;align-items:center;font:500 27px Georgia,serif;color:#214b34}.nr-delivery-section p{font-size:13px}.nr-table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:12px}th,td{padding:13px 9px;border-bottom:1px solid #edf0eb;white-space:nowrap}th{color:#4a6955}@media(max-width:650px){.nr-delivery-heading,.nr-delivery-notice,.nr-delivery-cards,.nr-delivery-section{margin-left:16px;margin-right:16px}.nr-delivery-cards{grid-template-columns:1fr 1fr}.nr-delivery-section{padding:14px}}
</style>
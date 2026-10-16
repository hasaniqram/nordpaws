<script setup lang="ts">
import { ArrowLeft, RefreshCw, MailCheck, ShieldCheck, AlertTriangle } from 'lucide-vue-next'
const loading=ref(true),authorized=ref(false),error=ref('')
const status=ref<{providerConfigured:boolean;senderConfigured:boolean;senderDomainConfirmed:boolean;automaticRemindersEnabled:boolean}|null>(null)
const overdue=ref(0),supplierExpired=ref(0),stockStale=ref(0)
const load=async()=>{
 loading.value=true;error.value=''
 try{
 const c=useSupabaseBrowser();if(!c)throw Error('Database unavailable')
 const {data:{session}}=await c.auth.getSession()
 if(!session?.access_token){await navigateTo('/admin/login');return}
 const {data:{user}}=await c.auth.getUser()
 if(!user){await navigateTo('/admin/login');return}
 const {data:admin}=await c.from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
 if(!admin){authorized.value=false;return}authorized.value=true
 const [provider,reviews,suppliers,items]=await Promise.all([
 $fetch<{providerConfigured:boolean;senderConfigured:boolean;senderDomainConfirmed:boolean;automaticRemindersEnabled:boolean}>('/api/admin/reminder-provider-status',{headers:{Authorization:'Bearer '+session.access_token}}),
 c.from('product_evidence_reviews').select('review_due_on'),
 c.from('supplier_compliance_records').select('expires_on'),
 c.from('supplier_catalog_items').select('verified_at')
 ])
 if(reviews.error||suppliers.error||items.error)throw reviews.error||suppliers.error||items.error
 status.value=provider;const today=new Date().toISOString().slice(0,10)
 overdue.value=(reviews.data||[]).filter(x=>!!x.review_due_on&&x.review_due_on<today).length
 supplierExpired.value=(suppliers.data||[]).filter(x=>!!x.expires_on&&x.expires_on<today).length
 stockStale.value=(items.data||[]).filter(x=>!x.verified_at||Date.now()-Date.parse(x.verified_at)>30*86400000).length
 }catch(e:any){error.value=e?.message||'Unable to load checks'}finally{loading.value=false}
}
onMounted(load)
useSeoMeta({title:'Operations notifications & launch QA',robots:'noindex,nofollow'})
</script>
<template><main class="admin-shell"><header class="admin-topbar"><NorrliLogo compact/><div class="admin-top-actions"><NuxtLink to="/admin" class="btn btn-secondary compact"><ArrowLeft :size="16"/> Admin</NuxtLink><button class="btn btn-secondary compact" @click="load"><RefreshCw :size="16"/> Refresh</button></div></header>
<section v-if="loading" class="admin-center">Checking operations…</section><section v-else-if="!authorized" class="admin-center">Administrator access required.</section>
<section v-else class="qa-wrap"><h1><ShieldCheck :size="30"/> Email, operations & launch QA</h1><p>Read-only pre-launch health checks. There is no scheduled email worker and this page sends no messages.</p><p v-if="error" role="alert">{{error}}</p>
<div class="qa-grid"><article><MailCheck :size="21"/><h2>Brevo readiness</h2><p>API configured: <strong>{{status?.providerConfigured?'Yes':'No'}}</strong></p><p>Sender configured: <strong>{{status?.senderConfigured?'Yes':'No'}}</strong></p><p>Domain independently verified: <strong>{{status?.senderDomainConfirmed?'Yes':'Not yet'}}</strong></p><p>Automated emails: <strong>Disabled</strong></p><NuxtLink to="/admin/reminders">Manual admin email tests →</NuxtLink></article>
<article><AlertTriangle :size="21"/><h2>Operational alerts</h2><p>Overdue product research reviews: <strong>{{overdue}}</strong></p><p>Expired supplier evidence: <strong>{{supplierExpired}}</strong></p><p>Stale supplier stock records: <strong>{{stockStale}}</strong></p><NuxtLink to="/admin/review-calendar">Review calendar →</NuxtLink></article>
<article><ShieldCheck :size="21"/><h2>Pre-launch checks</h2><ul><li>New product activation requires server-side evidence review</li><li>Live payments remain disabled</li><li>Email delivery and domain validation require real provider confirmation</li><li>Browser, accessibility and checkout sandbox acceptance tests remain required</li></ul><NuxtLink to="/admin/launch-gate">Product launch gate →</NuxtLink></article></div>
</section></main></template>
<style scoped>.qa-wrap{padding:36px;max-width:1050px;margin:auto}.qa-wrap h1{display:flex;align-items:center;gap:12px;font:500 clamp(29px,4vw,44px) Georgia,serif;color:#204c35}.qa-wrap>p{color:#627968}.qa-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:20px}.qa-grid article{padding:25px;background:#fff;border:1px solid #d8e6d6;border-radius:18px}.qa-grid h2{font:500 25px Georgia,serif;color:#254e35}.qa-grid p,.qa-grid li{font-size:13px;line-height:1.8}.qa-grid a{color:#275a43;text-decoration:underline;font-weight:700;font-size:13px}@media(max-width:650px){.qa-wrap{padding:16px}.qa-grid{grid-template-columns:1fr}}</style>
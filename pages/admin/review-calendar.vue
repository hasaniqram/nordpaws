<script setup lang="ts">
import { ArrowLeft, RefreshCw, CalendarClock, ShieldCheck, AlertTriangle, Download } from 'lucide-vue-next'
type Product={id:string;name:string;slug:string}
type Review={product_id:string;review_due_on:string|null;reviewed_on:string|null;decision:string;decision_note:string}
const loading=ref(true),authorized=ref(false),error=ref(''),products=ref<Product[]>([]),reviews=ref<Review[]>([])
const horizon=ref(30)
const dateKey=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Stockholm'})
const dayDifference=(date:string)=>Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(dateKey()+'T12:00:00Z'))/86400000)
const rows=computed(()=>reviews.value.map(r=>{
 const product=products.value.find(p=>p.id===r.product_id)
 const days=r.review_due_on?dayDifference(r.review_due_on):null
 return {...r,name:product?.name||'Unknown product',days,urgency:days===null?'unscheduled':days<0?'overdue':days<=horizon.value?'upcoming':'later'}
}).sort((a,b)=>(a.days??99999)-(b.days??99999)))
const urgent=computed(()=>rows.value.filter(r=>r.urgency==='overdue'||r.urgency==='upcoming'))
const counts=computed(()=>({overdue:rows.value.filter(r=>r.urgency==='overdue').length,upcoming:rows.value.filter(r=>r.urgency==='upcoming').length,unscheduled:rows.value.filter(r=>r.urgency==='unscheduled').length}))
const csvCell=(x:unknown)=>{const v=String(x??'');return '"'+(/^[=+@\-\t\r]/.test(v)?"'"+v:v).replaceAll('"','""')+'"'}
const exportCsv=()=>{
 const lines=[['Product','Due date','Days remaining','Research decision'],...urgent.value.map(r=>[r.name,r.review_due_on,r.days,r.decision])]
 const csv='\uFEFF'+lines.map(r=>r.map(csvCell).join(',')).join('\r\n')
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}))
 const a=document.createElement('a');a.href=url;a.download='norrli-review-deadlines.csv';a.click()
 window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}
const load=async()=>{
 loading.value=true;error.value=''
 try{
  const client=useSupabaseBrowser();if(!client)throw new Error('Admin connection unavailable')
  const {data:{user},error:authError}=await client.auth.getUser()
  if(authError||!user){await navigateTo('/admin/login');return}
  const {data:admin,error:adminError}=await client.from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
  if(adminError||!admin){authorized.value=false;return}
  authorized.value=true
  const [p,r]=await Promise.all([client.from('products').select('id,name,slug').order('name'),client.from('product_evidence_reviews').select('product_id,review_due_on,reviewed_on,decision,decision_note')])
  if(p.error||r.error)throw p.error||r.error
  products.value=p.data||[];reviews.value=r.data||[]
 }catch(e:any){error.value=e?.message||'Could not load review deadlines'}
 finally{loading.value=false}
}
onMounted(load)
useSeoMeta({title:'Supplier review calendar',robots:'noindex,nofollow'})
</script>
<template>
<main class="admin-shell nr-calendar">
<header class="admin-topbar"><NorrliLogo compact/><div class="admin-top-actions"><NuxtLink to="/admin/readiness" class="btn btn-secondary compact"><ArrowLeft :size="16"/> Readiness</NuxtLink><button class="btn btn-secondary compact" type="button" @click="load"><RefreshCw :size="16"/> Refresh</button></div></header>
<section v-if="loading" class="admin-center" role="status">Loading private deadlines…</section>
<section v-else-if="!authorized" class="admin-center admin-denied"><h1>Admin access required</h1><NuxtLink class="btn btn-primary" to="/admin/login">Sign in</NuxtLink></section>
<template v-else>
<div class="nr-calendar-heading"><span class="eyebrow"><CalendarClock :size="16"/> PHASE 3.4 · PRIVATE REVIEW PLANNER</span><h1>Supplier review deadlines</h1><p>Monitor upcoming and overdue product research reviews in one place. Dates come from your saved evidence records; no automatic supplier contact or product activation occurs.</p></div>
<div class="nr-calendar-safety"><ShieldCheck :size="18"/> Admin-only planning. No emails are sent automatically by this dashboard. Export your current review queue when needed.</div>
<p v-if="error" role="alert" class="admin-feedback error">{{error}}</p>
<div class="nr-calendar-stats"><div><small>Overdue</small><strong>{{counts.overdue}}</strong></div><div><small>Coming due</small><strong>{{counts.upcoming}}</strong></div><div><small>No review date</small><strong>{{counts.unscheduled}}</strong></div></div>
<div class="nr-calendar-toolbar"><label>Planning window<select v-model.number="horizon"><option :value="7">Next 7 days</option><option :value="30">Next 30 days</option><option :value="60">Next 60 days</option><option :value="90">Next 90 days</option></select></label><button type="button" class="btn btn-secondary compact" :disabled="!urgent.length" @click="exportCsv"><Download :size="16"/> Export due reviews</button></div>
<section class="nr-calendar-panel" aria-label="Due product reviews"><h2>Reviews requiring attention</h2><p v-if="!urgent.length">No reviews are overdue or due within the selected window.</p><ul v-else><li v-for="review in urgent" :key="review.product_id"><div><strong>{{review.name}}</strong><small>Decision: {{review.decision.replaceAll('_',' ')}} · Due {{review.review_due_on}}</small></div><span :class="review.urgency">{{review.days!<0?Math.abs(review.days!)+' days overdue':review.days===0?'Due today':review.days+' days left'}}</span></li></ul></section>
<section class="nr-calendar-panel"><h2>Reviews without deadlines</h2><p v-if="!counts.unscheduled">Every saved review has a follow-up date.</p><ul v-else><li v-for="review in rows.filter(r=>r.urgency==='unscheduled')" :key="review.product_id"><strong>{{review.name}}</strong><span>Set a review date in Supplier Readiness</span></li></ul></section>
<NuxtLink to="/admin/readiness" class="nr-calendar-link">Edit review dates and evidence →</NuxtLink>
</template></main>
</template>
<style scoped>
.nr-calendar-heading{padding:38px 34px 20px;max-width:900px}.nr-calendar-heading h1{font:500 clamp(34px,4vw,52px)/1.1 Georgia,serif;color:#1f4935;margin:10px 0}.nr-calendar-heading p{color:#64776a;line-height:1.65}.nr-calendar-safety{display:flex;align-items:center;gap:12px;background:#e8f1e4;color:#27553c;margin:0 34px 22px;padding:17px;border:1px solid #d0e1cb;border-radius:14px;font-size:13px}.nr-calendar-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 34px 20px}.nr-calendar-stats>div,.nr-calendar-panel{background:#fff;border:1px solid #dce7d8;border-radius:18px;padding:22px}.nr-calendar-stats small{display:block;color:#667e6e}.nr-calendar-stats strong{font-size:32px;color:#204c35}.nr-calendar-toolbar{display:flex;gap:18px;flex-wrap:wrap;align-items:center;margin:0 34px 21px}.nr-calendar-toolbar label{font-weight:750;font-size:12px}.nr-calendar-toolbar select{padding:10px;border:1px solid #bbd0b9;border-radius:9px;margin-left:9px}.nr-calendar-panel{margin:0 34px 17px}.nr-calendar-panel h2{font:500 27px Georgia,serif;margin:0 0 14px;color:#214c37}.nr-calendar-panel ul{padding:0;list-style:none}.nr-calendar-panel li{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 0;border-bottom:1px solid #edf2ea}.nr-calendar-panel li div{display:grid;gap:6px}.nr-calendar-panel li small{font-size:11px;color:#62796b}.nr-calendar-panel li span{font-size:12px;color:#58745d}.nr-calendar-panel li span.overdue{color:#a44734;font-weight:800}.nr-calendar-link{display:inline-block;margin:6px 34px 40px;color:#245e3e;text-decoration:underline;font-weight:800}.nr-calendar button:focus-visible,.nr-calendar a:focus-visible,.nr-calendar select:focus-visible{outline:3px solid #257047;outline-offset:3px}@media(max-width:600px){.nr-calendar-heading{padding:27px 16px}.nr-calendar-safety,.nr-calendar-stats,.nr-calendar-toolbar,.nr-calendar-panel{margin-left:16px;margin-right:16px}.nr-calendar-stats{grid-template-columns:1fr 1fr}.nr-calendar-panel{padding:15px}.nr-calendar-panel li{align-items:start;flex-direction:column}.nr-calendar-link{margin-left:16px}}
</style>
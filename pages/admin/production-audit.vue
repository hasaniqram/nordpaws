<script setup lang="ts">
import {ArrowLeft,ShieldAlert,ShieldCheck,RefreshCw} from 'lucide-vue-next'
const loading=ref(true),authorized=ref(false),error=ref('')
const verify=async()=>{
 loading.value=true;authorized.value=false;error.value=''
 try{
  const c=useSupabaseBrowser();if(!c)throw Error('Authentication unavailable')
  const {data:{session}}=await c.auth.getSession()
  if(!session?.access_token){await navigateTo('/admin/login');return}
  const {data:{user}}=await c.auth.getUser()
  if(!user){await navigateTo('/admin/login');return}
  const {data:admin,error:authError}=await c.from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
  if(authError)throw authError
  authorized.value=!!admin
 }catch(e:any){error.value=e?.message||'Unable to verify access'}finally{loading.value=false}
}
onMounted(verify)
const items=[
 {priority:'P0',topic:'Access controls',status:'Needs verification',detail:'Verify direct URL access, role checks, RLS and API authorization on all admin, supplier, order and refund screens.'},
 {priority:'P0',topic:'Checkout safety',status:'Protected in code',detail:'Checkout configuration is disabled and checkout API requires test-only Stripe keys. Still test staging and production environment values.'},
 {priority:'P0',topic:'Product launch and safety',status:'Needs evidence',detail:'Verify GPSR obligations, product sourcing, claims, supplier documents, stock freshness, and legal publication before activating listings.'},
 {priority:'P0',topic:'Customer and payment journeys',status:'Not launched',detail:'Complete end-to-end test checkout, webhooks, cancellation and refunds before enabling actual transactions.'},
 {priority:'P1',topic:'Mobile and accessibility',status:'Browser audit required',detail:'Test keyboard navigation, focus, assistive technology, image gallery, cart, consent choices, and small screens.'},
 {priority:'P1',topic:'Performance',status:'Measurement required',detail:'Record real LCP, INP and CLS from PageSpeed Insights / Lighthouse on production pages.'},
 {priority:'P1',topic:'Fulfillment and returns',status:'Simulation only',detail:'Confirm carrier agreements, delivery estimates, return address and support procedures with providers.'},
 {priority:'P1',topic:'Privacy and marketing',status:'Inactive',detail:'Review consent records and privacy policy, verify email sender and unsubscribes before any outbound campaigns.'},
 {priority:'P2',topic:'Search and product advertising',status:'Publication blocked',detail:'Verify Search Console ownership and legal eligibility. Merchant product feed remains unavailable.'}
]
useSeoMeta({title:'Production readiness audit',robots:'noindex,nofollow'})
</script>
<template><main class="admin-shell"><header class="admin-topbar"><NorrliLogo compact/><NuxtLink to="/admin" class="btn btn-secondary compact"><ArrowLeft :size="16"/> Dashboard</NuxtLink></header>
<section v-if="loading" class="p8-status" role="status">Verifying administrator access…</section>
<section v-else-if="!authorized" class="p8-status" role="alert">Administrator access required. {{error}}</section>
<section v-else class="p8-wrap"><span class="eyebrow"><ShieldAlert :size="16"/> PHASE 8 · RELEASE AUDIT</span><h1>Production readiness review</h1><p>This is a risk register, not a certification of launch readiness. All tasks requiring live testing or supplier evidence remain unverified until completed.</p><div class="p8-alert"><ShieldCheck :size="20"/> No payment activation, marketing sends, product listing changes or carrier operations are performed by this audit.</div>
<div class="p8-grid"><article v-for="item in items" :key="item.topic"><div class="p8-head"><span>{{item.priority}}</span><small>{{item.status}}</small></div><h2>{{item.topic}}</h2><p>{{item.detail}}</p></article></div>
<div class="p8-footer"><strong>Release gate: NOT APPROVED</strong><p>Resolve every P0 concern and document functional, security, product-compliance and legal review evidence before revisiting commercial launch.</p><NuxtLink to="/admin/commerce-acceptance">Continue commerce acceptance checklist</NuxtLink></div></section>
</main></template>
<style scoped>.p8-status{max-width:900px;margin:45px auto;padding:20px}.p8-wrap{max-width:1150px;margin:35px auto 65px;padding:0 20px}.p8-wrap h1{font:500 clamp(31px,4vw,49px)/1.1 Georgia,serif;color:#234b35}.p8-wrap>p{line-height:1.7;color:#5a705f}.p8-alert{display:flex;gap:10px;padding:16px;background:#ebf2e9;border:1px solid #cadcc9;border-radius:14px;margin:22px 0}.p8-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.p8-grid article{background:#fff;border:1px solid #d9e4d7;padding:22px;border-radius:16px}.p8-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.p8-head span{font-weight:900;color:#a35237}.p8-head small{font-size:11px;color:#637e68}.p8-grid h2{font:500 23px Georgia,serif;color:#254e38}.p8-grid p,.p8-footer p{font-size:13px;line-height:1.7;color:#607566}.p8-footer{margin-top:22px;padding:22px;border:1px solid #d7e1d2;border-radius:14px}.p8-footer strong{color:#9a4939}.p8-footer a{color:#245b3a;text-decoration:underline;min-height:44px;display:inline-flex;align-items:center}@media(max-width:850px){.p8-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:540px){.p8-grid{grid-template-columns:1fr}}</style>
<script setup lang="ts">
import { ArrowLeft, RefreshCw, Bell, ShieldCheck, Mail, ClipboardList } from 'lucide-vue-next'
type Pref={admin_id:string;email:string;enabled:boolean;verified:boolean;advance_days:number}
type Log={id:number;kind:string;details:string;created_at:string}
type Review={product_id:string;review_due_on:string|null}
const loading=ref(true),authorized=ref(false),error=ref(''),feedback=ref(''),saving=ref(false),adminId=ref('')
const pref=reactive<Pref>({admin_id:'',email:'',enabled:false,verified:false,advance_days:7})
const logs=ref<Log[]>([]),reviews=ref<Review[]>([])
const pendingDeliveryKey=ref('')
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Stockholm'})
const offset=(s:string)=>Math.round((Date.parse(s+'T12:00:00Z')-Date.parse(today()+'T12:00:00Z'))/86400000)
const relevant=computed(()=>reviews.value.filter(r=>r.review_due_on&&offset(r.review_due_on)<=pref.advance_days).sort((a,b)=>offset(a.review_due_on!)-offset(b.review_due_on!)))
const load=async()=>{
 loading.value=true;error.value=''
 try{
 const c=useSupabaseBrowser();if(!c)throw Error('Admin authentication unavailable')
 const {data:{user}}=await c.auth.getUser();if(!user){await navigateTo('/admin/login');return}
 const {data:admin}=await c.from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
 if(!admin){authorized.value=false;return}
 authorized.value=true;adminId.value=user.id
 const [p,l,r]=await Promise.all([
 c.from('review_reminder_preferences').select('*').eq('admin_id',user.id).maybeSingle(),
 c.from('review_reminder_log').select('id,kind,details,created_at').order('created_at',{ascending:false}).limit(20),
 c.from('product_evidence_reviews').select('product_id,review_due_on')
 ])
 if(p.error||l.error||r.error)throw p.error||l.error||r.error
 Object.assign(pref,p.data||{admin_id:user.id,email:user.email||'',enabled:false,verified:false,advance_days:7})
 logs.value=l.data||[];reviews.value=r.data||[]
 }catch(e:any){error.value=e?.message||'Unable to load reminder preferences'}
 finally{loading.value=false}
}
const save=async()=>{
 if(!authorized.value||saving.value)return
 if(![1,3,7,14,30].includes(pref.advance_days)){feedback.value='Select a valid reminder interval.';return}
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pref.email)||pref.email.length>254){feedback.value='Enter a valid recipient email.';return}
 saving.value=true;feedback.value=''
 try{
 const c=useSupabaseBrowser()!
 const {error:e}=await c.from('review_reminder_preferences').upsert({admin_id:adminId.value,email:pref.email.trim().toLowerCase(),advance_days:pref.advance_days,enabled:false,verified:false,updated_at:new Date().toISOString()},{onConflict:'admin_id'})
 if(e)throw e
 feedback.value='Preferences saved. Email delivery remains disabled pending verification.'
 await load()
 }catch(e:any){feedback.value=e?.message||'Could not save preferences'}finally{saving.value=false}
}
const verifyRecipient=async()=>{
 const c=useSupabaseBrowser();if(!c||!authorized.value||saving.value)return
 saving.value=true;feedback.value=''
 try{
  const {data:{session}}=await c.auth.getSession()
  if(!session?.access_token)throw new Error('Please sign in again')
  const result=await $fetch<{verified:boolean}>('/api/admin/verify-reminder-email',{method:'POST',headers:{Authorization:'Bearer '+session.access_token}})
  await load()
  feedback.value=result.verified?'Admin login email verified. Sending remains disabled.':'Verification incomplete.'
 }catch(e:any){feedback.value=e?.data?.statusMessage||e?.message||'Email verification failed'}finally{saving.value=false}
}
const reserveTest=async()=>{
 const item=relevant.value[0],client=useSupabaseBrowser()
 if(!item||!client||saving.value)return
 saving.value=true;feedback.value=''
 try{
  const {data:{session}}=await client.auth.getSession()
  if(!session?.access_token)throw new Error('Sign in again')
  const result=await $fetch<{message:string;deliveryKey?:string}>('/api/admin/reserve-reminder-test',{method:'POST',headers:{Authorization:'Bearer '+session.access_token},body:{productId:item.product_id}})
  pendingDeliveryKey.value=result.deliveryKey||''
  feedback.value=result.message
 }catch(e:any){feedback.value=e?.data?.statusMessage||e?.message||'Could not reserve test'}
 finally{saving.value=false}
}
const sendTest=async()=>{
 const client=useSupabaseBrowser();if(!client||!pendingDeliveryKey.value||saving.value)return
 if(!window.confirm('Send one test email to your verified administrator login email?'))return
 saving.value=true;feedback.value=''
 try{
  const {data:{session}}=await client.auth.getSession()
  if(!session?.access_token)throw new Error('Sign in again')
  const result=await $fetch<{message:string}>('/api/admin/send-reminder-test',{method:'POST',headers:{Authorization:'Bearer '+session.access_token},body:{deliveryKey:pendingDeliveryKey.value,confirm:true}})
  pendingDeliveryKey.value='';feedback.value=result.message
 }catch(e:any){pendingDeliveryKey.value='';feedback.value=e?.data?.statusMessage||e?.message||'Test delivery could not be confirmed'}
 finally{saving.value=false}
}
const preview=async()=>{
 const c=useSupabaseBrowser();if(!c||!authorized.value||saving.value)return
 saving.value=true;feedback.value=''
 try{
 const message='Preview generated: '+relevant.value.length+' reviews due within '+pref.advance_days+' days. No email sent.'
 const {error:e}=await c.from('review_reminder_log').insert({admin_id:adminId.value,kind:'preview',details:message,product_id:null,due_on:null})
 if(e)throw e
 await load();feedback.value=message
 }catch(e:any){feedback.value=e?.message||'Could not record preview'}finally{saving.value=false}
}
onMounted(load)
useSeoMeta({title:'Review reminders — Norrli Pets',robots:'noindex,nofollow'})
</script>
<template>
<main class="admin-shell rr-shell">
<header class="admin-topbar"><NorrliLogo compact/><div class="admin-top-actions"><NuxtLink to="/admin/review-calendar" class="btn btn-secondary compact"><ArrowLeft :size="16"/> Review calendar</NuxtLink><button type="button" class="btn btn-secondary compact" @click="load"><RefreshCw :size="16"/> Refresh</button></div></header>
<section v-if="loading" class="admin-center" role="status">Loading reminder settings…</section>
<section v-else-if="!authorized" class="admin-center admin-denied"><h1>Administrator access required</h1><NuxtLink to="/admin/login" class="btn btn-primary">Sign in</NuxtLink></section>
<template v-else>
<div class="rr-heading"><span class="eyebrow"><Bell :size="16"/> PRIVATE REMINDER CONTROL</span><h1>Supplier review reminders</h1><p>Prepare your deadline notifications safely. Automatic sending is locked until recipient verification and server delivery checks are implemented.</p></div>
<div class="rr-notice"><ShieldCheck :size="20"/><span><strong>Email sending is OFF.</strong> A saved recipient address is not considered verified. Previewing a reminder creates a private log entry and sends nothing.</span></div>
<p v-if="error" class="admin-feedback error" role="alert">{{error}}</p>
<p v-if="feedback" class="admin-feedback" role="status">{{feedback}}</p>
<div class="rr-grid">
<section class="rr-card"><h2><Mail :size="20"/> Preferences</h2><form @submit.prevent="save"><label>Recipient email<input v-model.trim="pref.email" type="email" maxlength="254" required autocomplete="email"/></label><label>Remind ahead of deadline<select v-model.number="pref.advance_days"><option :value="1">1 day</option><option :value="3">3 days</option><option :value="7">7 days</option><option :value="14">14 days</option><option :value="30">30 days</option></select></label><p>Recipient ownership: <strong>{{pref.verified?'Confirmed admin email':'Not verified'}}</strong></p><p>Delivery status: <strong>Disabled — sending is not configured</strong></p><button type="submit" class="btn btn-primary compact" :disabled="saving">{{saving?'Saving…':'Save preferences'}}</button><button type="button" class="btn btn-secondary compact" :disabled="saving || pref.verified" @click="verifyRecipient">Verify using confirmed admin email</button><small>This verifies only your existing confirmed sign-in email. To use another address, a separate opt-in verification flow is required.</small></form></section>
<section class="rr-card"><h2><ClipboardList :size="20"/> Reminder preview</h2><p><strong>{{relevant.length}}</strong> saved reviews are overdue or due within {{pref.advance_days}} days.</p><p>Preview includes only the number of due records. No supplier details are emailed.</p><button type="button" class="btn btn-secondary compact" :disabled="saving" @click="preview">Create safe preview log</button><button type="button" class="btn btn-secondary compact" :disabled="saving || !pref.verified || !relevant.length" @click="reserveTest">Reserve duplicate-safe test (no email)</button><button type="button" class="btn btn-primary compact" :disabled="saving || !pendingDeliveryKey" @click="sendTest">Confirm &amp; send one admin test email</button></section>
<section class="rr-card rr-full"><h2>Delivery audit</h2><p>Inspect provider-accepted test messages, failures and reserved attempts without sending mail.</p><NuxtLink to="/admin/delivery-history" class="btn btn-secondary compact">View delivery history</NuxtLink></section><section class="rr-card rr-full"><h2>Recent reminder activity</h2><p v-if="!logs.length">No reminder previews recorded yet.</p><ul v-else><li v-for="item in logs" :key="item.id"><strong>{{item.kind}}</strong><span>{{new Date(item.created_at).toLocaleString('sv-SE')}}</span><small>{{item.details}}</small></li></ul></section>
</div>
</template>
</main>
</template>
<style scoped>
.rr-heading{margin:36px 34px 20px;max-width:840px}.rr-heading h1{font:500 clamp(34px,4vw,51px)/1.1 Georgia,serif;color:#214b36;margin:12px 0}.rr-heading p{color:#657768;line-height:1.7}.rr-notice{margin:0 34px 23px;padding:17px;background:#e5f0e1;border:1px solid #cbdfc5;border-radius:14px;color:#2d563e;display:flex;gap:14px;font-size:13px;line-height:1.6}.rr-notice svg{flex:none}.rr-grid{margin:0 34px;display:grid;grid-template-columns:1fr 1fr;gap:17px}.rr-card{background:white;border:1px solid #dce9d8;border-radius:20px;padding:23px;min-width:0}.rr-card h2{display:flex;align-items:center;gap:9px;font:500 24px Georgia,serif;color:#204b35}.rr-card p{font-size:13px;color:#607466;line-height:1.6}.rr-card form{display:grid;gap:15px}.rr-card label{display:grid;gap:6px;font-weight:750;font-size:12px;color:#345942}.rr-card input,.rr-card select{width:100%;border-radius:10px;border:1px solid #c9d9c5;padding:12px;color:#214b36;background:#f8faf6;min-width:0}.rr-card button{justify-self:start}.rr-full{grid-column:1/-1}.rr-card ul{padding:0;list-style:none}.rr-card li{display:grid;grid-template-columns:120px 1fr;gap:8px;border-top:1px solid #edf0eb;padding:13px 0;font-size:12px}.rr-card li small{grid-column:1/-1;color:#687c6d}.rr-shell button:focus-visible,.rr-shell a:focus-visible,.rr-shell input:focus-visible,.rr-shell select:focus-visible{outline:3px solid #2c7d4d;outline-offset:3px}@media(max-width:700px){.rr-heading,.rr-notice,.rr-grid{margin-left:16px;margin-right:16px}.rr-grid{grid-template-columns:1fr}.rr-full{grid-column:1}.rr-card{padding:17px}}
</style>
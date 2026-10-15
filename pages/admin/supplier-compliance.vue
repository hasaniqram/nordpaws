<script setup lang="ts">
import { ArrowLeft, RefreshCw, ShieldCheck, FileCheck2 } from 'lucide-vue-next'
type Lead={id:string;name:string;status:string;shipping_to_sweden:boolean|null;country:string|null;website_url:string|null}
type RecordRow={supplier_id:string;document_url:string|null;document_kind:string;reference_number:string;expires_on:string|null;verified_on:string|null;reviewer_notes:string;stage:string}
const loading=ref(true),authorized=ref(false),error=ref(''),feedback=ref(''),saving=ref('')
const leads=ref<Lead[]>([])
const records=reactive<Record<string,RecordRow>>({})
const due=(id:string)=>{const date=records[id]?.expires_on;return !!date&&date<new Date().toISOString().slice(0,10)}
const researchReady=(l:Lead)=>Boolean(l.shipping_to_sweden===true&&records[l.id]?.document_url&&records[l.id]?.verified_on&&!due(l.id))
const load=async()=>{
 loading.value=true;error.value=''
 try{
 const c=useSupabaseBrowser();if(!c)throw Error('Admin database unavailable')
 const {data:{user},error:ae}=await c.auth.getUser()
 if(ae||!user){await navigateTo('/admin/login');return}
 const {data:admin,error:adminError}=await c.from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
 if(adminError||!admin){authorized.value=false;return}
 authorized.value=true
 const [l,r]=await Promise.all([c.from('supplier_leads').select('id,name,status,shipping_to_sweden,country,website_url').order('name'),c.from('supplier_compliance_records').select('*')])
 if(l.error||r.error)throw l.error||r.error
 leads.value=l.data||[]
 const saved=new Map((r.data||[]).map((x:any)=>[x.supplier_id,x]))
 for(const lead of leads.value){const row=saved.get(lead.id) as RecordRow|undefined;records[lead.id]=row?{...row}:{supplier_id:lead.id,document_url:null,document_kind:'other',reference_number:'',expires_on:null,verified_on:null,reviewer_notes:'',stage:'collecting'}}
 }catch(e:any){error.value=e?.message||'Unable to load compliance records'}
 finally{loading.value=false}
}
const save=async(l:Lead)=>{
 const c=useSupabaseBrowser(),r=records[l.id]
 if(!c||!authorized.value||!r||saving.value)return
 if(r.document_url&&!/^https:\/\//.test(r.document_url)){feedback.value='Evidence link must start with https://';return}
 if(r.stage==='research_complete'&&!researchReady(l)){feedback.value='Evidence URL, verification date, Sweden delivery and valid expiry are required for research completion.';return}
 saving.value=l.id;feedback.value=''
 try{
 const {error:e}=await c.from('supplier_compliance_records').upsert({...r,updated_at:new Date().toISOString()},{onConflict:'supplier_id'})
 if(e)throw e
 feedback.value='Private supplier research record saved. No public product status changed.'
 await load()
 }catch(e:any){feedback.value=e?.message||'Save failed'}finally{saving.value=''}
}
onMounted(load)
useSeoMeta({title:'Supplier onboarding & compliance',robots:'noindex,nofollow'})
</script>
<template>
<main class="admin-shell sc-shell">
<header class="admin-topbar"><NorrliLogo compact/><div class="admin-top-actions"><NuxtLink to="/admin" class="btn btn-secondary compact"><ArrowLeft :size="16"/> Dashboard</NuxtLink><button type="button" class="btn btn-secondary compact" @click="load"><RefreshCw :size="16"/> Refresh</button></div></header>
<section v-if="loading" class="admin-center" role="status">Loading suppliers…</section>
<section v-else-if="!authorized" class="admin-center">Administrator access required.</section>
<template v-else>
<div class="sc-heading"><span class="eyebrow"><FileCheck2 :size="16"/> PHASE 4.2 · PRIVATE SUPPLIER REVIEW</span><h1>Supplier onboarding & compliance</h1><p>Manage a supplier's document references, verification dates and research decisions. Research completion is not regulatory certification, procurement approval or permission to sell.</p></div>
<div class="sc-note"><ShieldCheck :size="20"/> Internal-only records. No product activation, inventory adjustment, supplier messaging or payment activation.</div>
<p v-if="error" role="alert" class="admin-feedback error">{{error}}</p><p v-if="feedback" role="status" class="admin-feedback">{{feedback}}</p>
<div class="sc-summary"><div><small>Supplier leads</small><strong>{{leads.length}}</strong></div><div><small>Research complete</small><strong>{{leads.filter(l=>records[l.id]?.stage==='research_complete').length}}</strong></div><div><small>Expired documents</small><strong>{{leads.filter(l=>due(l.id)).length}}</strong></div></div>
<section class="sc-grid" aria-label="Supplier compliance reviews">
<article v-for="lead in leads" :key="lead.id" class="sc-card">
<h2>{{lead.name}}</h2><p>Country: {{lead.country||'Not recorded'}} · Delivery to Sweden: {{lead.shipping_to_sweden===true?'Recorded yes':'Not confirmed'}}</p>
<p v-if="due(lead.id)" class="sc-warn">Document has expired. Reverify before completion.</p>
<form v-if="records[lead.id]" @submit.prevent="save(lead)">
<label>Document type<select v-model="records[lead.id].document_kind"><option value="agreement">Supplier agreement</option><option value="business_registration">Business registration</option><option value="product_compliance">Product compliance evidence</option><option value="insurance">Insurance</option><option value="other">Other document</option></select></label>
<label>Evidence document URL (HTTPS)<input v-model.trim="records[lead.id].document_url" type="url" maxlength="1000" placeholder="https://…"/></label>
<label>Document reference<input v-model.trim="records[lead.id].reference_number" maxlength="160"/></label>
<div class="sc-dates"><label>Verified on<input v-model="records[lead.id].verified_on" type="date"/></label><label>Expires on<input v-model="records[lead.id].expires_on" type="date"/></label></div>
<label>Review notes<textarea v-model="records[lead.id].reviewer_notes" maxlength="3000" rows="3"/></label>
<label>Research stage<select v-model="records[lead.id].stage"><option value="collecting">Collecting documents</option><option value="review_required">Review required</option><option value="research_complete" :disabled="!researchReady(lead)">Research complete (internal)</option><option value="rejected">Not suitable</option></select></label>
<button class="btn btn-primary compact" type="submit" :disabled="!!saving||(records[lead.id].stage==='research_complete'&&!researchReady(lead))">{{saving===lead.id?'Saving…':'Save supplier review'}}</button>
</form></article></section>
<p v-if="!leads.length" class="sc-empty">No supplier leads yet. Add them using the existing sourcing tools.</p>
</template></main>
</template>
<style scoped>
.sc-heading{margin:35px 34px 18px;max-width:900px}.sc-heading h1{font:500 clamp(34px,4vw,52px)/1.1 Georgia,serif;color:#214b35;margin:11px 0}.sc-heading p{color:#5f7767;line-height:1.6}.sc-note{display:flex;gap:12px;margin:0 34px 22px;padding:16px;border:1px solid #d2e2ce;background:#e9f1e6;border-radius:14px;color:#31583d;font-size:13px}.sc-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 34px 20px}.sc-summary>div,.sc-card{padding:22px;border-radius:18px;background:#fff;border:1px solid #dce8d7}.sc-summary small{display:block;color:#647967}.sc-summary strong{font-size:30px;color:#204d35}.sc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:0 34px 40px}.sc-card h2{font:500 26px Georgia,serif;color:#234c34;margin:0}.sc-card p{font-size:12px;color:#677c6c}.sc-card .sc-warn{color:#9a452e;font-weight:800}.sc-card form{display:grid;gap:12px;margin-top:18px}.sc-card label{font-size:12px;font-weight:800;color:#345f42;display:grid;gap:5px}.sc-card input,.sc-card select,.sc-card textarea{width:100%;min-width:0;border:1px solid #c5d6c4;border-radius:9px;background:#f9fbf8;padding:10px;color:#234b35}.sc-dates{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sc-card button{justify-self:start}.sc-empty{margin:20px 34px}@media(max-width:850px){.sc-grid{grid-template-columns:1fr}}@media(max-width:580px){.sc-heading,.sc-note,.sc-summary,.sc-grid{margin-left:16px;margin-right:16px}.sc-summary{grid-template-columns:1fr 1fr}.sc-dates{grid-template-columns:1fr}}
</style>
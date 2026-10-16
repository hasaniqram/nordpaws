<script setup lang="ts">
import { ArrowLeft, RefreshCw, ShieldCheck, ClipboardCheck } from 'lucide-vue-next'
type Product={id:string;name:string;active:boolean;category:string}
type RecordRow={product_id:string;manufacturer_name:string;manufacturer_postal_address:string;manufacturer_email:string;manufacturer_eu_based:boolean|null;eu_responsible_person_name:string;eu_responsible_person_address:string;eu_responsible_person_email:string;product_identifier:string;safety_warnings_sv:string;risk_assessment:string;safety_evidence_url:string|null;checks:Record<string,boolean>;applicable_rules_notes:string;reviewed_on:string|null;review_due_on:string|null;decision:string;decision_note:string}
type Audit={id:number;product_id:string;actor_id:string|null;changed_at:string;old_record:any;new_record:any}
const checks=[{key:'identification',label:'Product image, type and identifier reviewed'},{key:'warnings',label:'Swedish-language warnings assessed for listing and packaging'},{key:'risk',label:'Product safety hazards and foreseeable misuse assessed'},{key:'traceability',label:'Supplier, batch or traceability evidence reviewed'},{key:'sector',label:'Additional product-specific EU requirements checked'},{key:'safety_gate',label:'Safety Gate / recall concerns checked'}]
const loading=ref(true),authorized=ref(false),error=ref(''),feedback=ref(''),saving=ref('')
const products=ref<Product[]>([]),records=reactive<Record<string,RecordRow>>({}),audit=ref<Audit[]>([])
const isOverdue=(r:RecordRow)=>!!r.review_due_on&&r.review_due_on<new Date().toISOString().slice(0,10)
const gaps=(r:RecordRow)=>{
 const missing:string[]=[]
 if(!r.manufacturer_name||!r.manufacturer_postal_address||!r.manufacturer_email)missing.push('Manufacturer identification and contact details')
 if(r.manufacturer_eu_based===null)missing.push('Manufacturer EU establishment must be assessed')
 if(r.manufacturer_eu_based===false&&(!r.eu_responsible_person_name||!r.eu_responsible_person_address||!r.eu_responsible_person_email))missing.push('EU responsible person identification')
 if(!r.product_identifier)missing.push('Product identification')
 if(!r.risk_assessment.trim())missing.push('Written risk assessment')
 if(!r.applicable_rules_notes.trim())missing.push('Product-specific legislation applicability notes')
 if(!r.safety_evidence_url)missing.push('Evidence reference')
 if(!r.reviewed_on||!r.review_due_on||isOverdue(r))missing.push('Valid review date and next review')
 for(const c of checks)if(r.checks?.[c.key]!==true)missing.push(c.label)
 return missing
}
const histories=(id:string)=>audit.value.filter(a=>a.product_id===id).slice(0,5)
const load=async()=>{
 loading.value=true;error.value=''
 try{
 const c=useSupabaseBrowser();if(!c)throw Error('Admin connection unavailable')
 const {data:{user},error:authErr}=await c.auth.getUser()
 if(authErr||!user){await navigateTo('/admin/login');return}
 const {data:admin,error:adminErr}=await c.from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
 if(adminErr||!admin){authorized.value=false;return}
 authorized.value=true
 const [p,r,a]=await Promise.all([c.from('products').select('id,name,active,category').order('name'),c.from('product_safety_reviews').select('*'),c.from('product_safety_audit').select('id,product_id,actor_id,changed_at,old_record,new_record').order('changed_at',{ascending:false}).limit(500)])
 if(p.error||r.error||a.error)throw p.error||r.error||a.error
 products.value=p.data||[];audit.value=a.data||[]
 const saved=new Map((r.data||[]).map((x:any)=>[x.product_id,x]))
 for(const p of products.value){const row=saved.get(p.id) as RecordRow|undefined;records[p.id]=row?{...row,checks:row.checks||{}}:{product_id:p.id,manufacturer_name:'',manufacturer_postal_address:'',manufacturer_email:'',manufacturer_eu_based:null,eu_responsible_person_name:'',eu_responsible_person_address:'',eu_responsible_person_email:'',product_identifier:'',safety_warnings_sv:'',risk_assessment:'',safety_evidence_url:null,checks:{},applicable_rules_notes:'',reviewed_on:null,review_due_on:null,decision:'pending',decision_note:''}}
 }catch(e:any){error.value=e?.message||'Unable to load safety reviews'}
 finally{loading.value=false}
}
const save=async(id:string)=>{
 const c=useSupabaseBrowser(),r=records[id];if(!c||!r||!authorized.value||saving.value)return
 if(r.safety_evidence_url&&!/^https:\/\//.test(r.safety_evidence_url)){feedback.value='Evidence URL must use HTTPS';return}
 if(r.decision==='research_complete'&&gaps(r).length){feedback.value='Resolve checklist gaps before marking research complete';return}
 saving.value=id;feedback.value=''
 try{const {error:e}=await c.from('product_safety_reviews').upsert({...r,updated_at:new Date().toISOString()},{onConflict:'product_id'})
 if(e)throw e
 await load();feedback.value='Internal safety review saved with audit history. No product activation or payments changed.'
 }catch(e:any){feedback.value=e?.message||'Could not save review'}finally{saving.value=''}
}
onMounted(load)
useSeoMeta({title:'Product compliance & safety',robots:'noindex,nofollow'})
</script>
<template>
<main class="admin-shell ps-shell"><header class="admin-topbar"><NorrliLogo compact/><div class="admin-top-actions"><NuxtLink to="/admin" class="btn btn-secondary compact"><ArrowLeft :size="16"/> Dashboard</NuxtLink><button type="button" class="btn btn-secondary compact" @click="load"><RefreshCw :size="16"/> Refresh</button></div></header>
<section v-if="loading" class="admin-center" role="status">Loading private product safety reviews…</section><section v-else-if="!authorized" class="admin-center">Administrator access required.</section>
<template v-else><div class="ps-heading"><span class="eyebrow"><ClipboardCheck :size="16"/> PHASE 4.3 · INTERNAL PRODUCT SAFETY</span><h1>Product compliance & safety center</h1><p>Record evidence against GPSR-oriented checks and any additional product-specific rules. Checklists do not constitute certification, legal advice or a sale authorization.</p></div>
<div class="ps-note"><ShieldCheck :size="19"/> This system does not change public product status, inventory, checkout or payments. Safety evidence must be independently verified.</div>
<p v-if="error" class="admin-feedback error" role="alert">{{error}}</p><p v-if="feedback" class="admin-feedback" role="status">{{feedback}}</p>
<section class="ps-grid"><article v-for="p in products" :key="p.id" class="ps-card"><h2>{{p.name}}</h2><p>{{p.category}} · {{p.active?'Catalog active':'Catalog inactive'}}</p>
<form v-if="records[p.id]" @submit.prevent="save(p.id)">
<label>Manufacturer name<input v-model.trim="records[p.id].manufacturer_name" maxlength="250"/></label>
<label>Manufacturer postal address<textarea v-model.trim="records[p.id].manufacturer_postal_address" rows="2" maxlength="600"/></label>
<label>Manufacturer email<input v-model.trim="records[p.id].manufacturer_email" type="email" maxlength="254"/></label>
<label>Manufacturer established in EU?<select v-model="records[p.id].manufacturer_eu_based"><option :value="null">Not assessed</option><option :value="true">Yes</option><option :value="false">No</option></select></label>
<template v-if="records[p.id].manufacturer_eu_based===false"><label>EU responsible person name<input v-model.trim="records[p.id].eu_responsible_person_name" maxlength="250"/></label><label>EU responsible person postal address<textarea v-model.trim="records[p.id].eu_responsible_person_address" maxlength="600" rows="2"/></label><label>EU responsible person email<input v-model.trim="records[p.id].eu_responsible_person_email" type="email" maxlength="254"/></label></template>
<label>Model / batch / product identifier<input v-model.trim="records[p.id].product_identifier" maxlength="250"/></label>
<label>Swedish safety warnings / instructions decision<textarea v-model="records[p.id].safety_warnings_sv" maxlength="3000" rows="3" placeholder="Document warnings, or why none are required"/></label>
<label>Risk assessment<textarea v-model="records[p.id].risk_assessment" maxlength="5000" rows="3"/></label>
<label>Applicable sector legislation and standards<textarea v-model="records[p.id].applicable_rules_notes" maxlength="3000" rows="3" placeholder="Assess GPSR applicability and additional category-specific rules"/></label>
<label>Supporting evidence link (HTTPS)<input v-model.trim="records[p.id].safety_evidence_url" type="url" maxlength="1000"/></label>
<fieldset><legend>Internal review checks</legend><label v-for="check in checks" :key="check.key" class="ps-check"><input v-model="records[p.id].checks[check.key]" type="checkbox"/> {{check.label}}</label></fieldset>
<div class="ps-dates"><label>Reviewed on<input v-model="records[p.id].reviewed_on" type="date"/></label><label>Next review<input v-model="records[p.id].review_due_on" type="date"/></label></div>
<label>Internal decision<select v-model="records[p.id].decision"><option value="pending">Pending</option><option value="needs_work">Needs more evidence</option><option value="research_complete" :disabled="gaps(records[p.id]).length>0">Research complete (not certified)</option></select></label>
<label>Reviewer decision notes<textarea v-model="records[p.id].decision_note" rows="2" maxlength="2000"/></label>
<div v-if="gaps(records[p.id]).length" class="ps-gaps"><strong>Outstanding evidence</strong><ul><li v-for="gap in gaps(records[p.id])" :key="gap">{{gap}}</li></ul></div>
<button type="submit" class="btn btn-primary compact" :disabled="!!saving||(records[p.id].decision==='research_complete'&&gaps(records[p.id]).length>0)">{{saving===p.id?'Saving…':'Save safety review'}}</button></form>
<details class="ps-history"><summary>Recent review history ({{histories(p.id).length}})</summary><p v-if="!histories(p.id).length">No recorded changes</p><ul v-else><li v-for="h in histories(p.id)" :key="h.id">{{new Date(h.changed_at).toLocaleString('sv-SE')}} · {{h.old_record?.decision||'New'}} → {{h.new_record?.decision||'Pending'}} · {{h.actor_id||'Unknown actor'}}</li></ul></details>
</article></section></template></main>
</template>
<style scoped>
.ps-heading{margin:35px 34px 19px;max-width:900px}.ps-heading h1{font:500 clamp(33px,4vw,50px)/1.1 Georgia,serif;color:#214b35;margin:10px 0}.ps-heading p{color:#66806b;line-height:1.65}.ps-note{display:flex;gap:12px;background:#e8f1e6;border:1px solid #d1e2ca;border-radius:13px;color:#35583d;padding:17px;margin:0 34px 22px;font-size:13px}.ps-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin:0 34px 40px}.ps-card{background:white;border:1px solid #dce8d8;border-radius:18px;padding:23px;min-width:0}.ps-card h2{font:500 26px Georgia,serif;color:#214b35;margin:0}.ps-card>p{font-size:12px;color:#668071}.ps-card form{display:grid;gap:13px;margin-top:18px}.ps-card label{display:grid;gap:5px;font-weight:750;font-size:12px;color:#355b43}.ps-card input,.ps-card textarea,.ps-card select{width:100%;min-width:0;border:1px solid #c9d9c8;border-radius:8px;background:#fbfcf9;color:#244c35;padding:10px}.ps-card fieldset{border:1px solid #dce8d7;border-radius:12px}.ps-card legend{font-size:13px;font-weight:800}.ps-card .ps-check{display:flex;align-items:start;gap:8px;margin:10px 0;font-weight:500}.ps-check input{width:auto}.ps-dates{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ps-gaps{background:#fbf2e6;border-radius:12px;padding:12px;font-size:12px;color:#7b573c}.ps-gaps ul{line-height:1.6}.ps-card button{justify-self:start}.ps-history{margin-top:18px;font-size:12px;color:#4b674d}.ps-history summary{cursor:pointer;font-weight:800}.ps-history li{margin-top:8px;overflow-wrap:anywhere}@media(max-width:860px){.ps-grid{grid-template-columns:1fr}}@media(max-width:580px){.ps-heading,.ps-note,.ps-grid{margin-left:16px;margin-right:16px}.ps-dates{grid-template-columns:1fr}}
</style>
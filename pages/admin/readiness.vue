<script setup lang="ts">
import { ArrowLeft, RefreshCw, ShieldCheck, AlertTriangle, ClipboardCheck } from 'lucide-vue-next'
import { scoreQuote, type LeadSnapshot, type ProductSnapshot } from '~/utils/sourcingInsights'
import { formatSek, type SupplierQuote } from '~/utils/profitability'
type Stock={product_id:string|null;stock_status:string;verified_at:string|null;supplier_lead_id:string}
const loading=ref(true),authorized=ref(false),error=ref('')
const products=ref<ProductSnapshot[]>([]),leads=ref<LeadSnapshot[]>([]),quotes=ref<SupplierQuote[]>([]),stock=ref<Stock[]>([])
const target=ref(25)
type Review={product_id:string;evidence_url:string|null;evidence_notes:string;reviewed_on:string|null;review_due_on:string|null;decision:'pending'|'needs_work'|'research_approved';decision_note:string}
const reviews=reactive<Record<string,Review>>({})
const saving=ref(''),feedback=ref('')
type Audit={id:number;product_id:string;actor_id:string|null;changed_at:string;action:string;old_record:any;new_record:any}
const audit=ref<Audit[]>([])
const historyFor=(id:string)=>audit.value.filter(item=>item.product_id===id).slice(0,8)
const reviewExpiry=(id:string)=>{const date=reviews[id]?.review_due_on;if(!date)return 'No follow-up scheduled';const today=new Date().toISOString().slice(0,10);return date<today?'Review overdue':date===today?'Review due today':'Next review: '+date}
const reviewExpired=(id:string)=>!!reviews[id]?.review_due_on&&reviews[id].review_due_on!<new Date().toISOString().slice(0,10)
const saveReview=async(id:string)=>{
 const client=useSupabaseBrowser(),r=reviews[id]
 if(!client||!authorized.value||!r||saving.value)return
 if(r.evidence_url && !/^https:\/\//i.test(r.evidence_url)){feedback.value='Evidence links must use HTTPS.';return}
 if(r.decision==='research_approved' && (reviewExpired(id)||!report.value.find(x=>x.product.id===id)?.ready)){feedback.value='Refresh overdue evidence or resolve checklist blockers before approval.';return}
 if(r.evidence_notes.length>4000||r.decision_note.length>2000){feedback.value='Review note exceeds the limit.';return}
 saving.value=id;feedback.value=''
 try{
  const {error:dbError}=await client.from('product_evidence_reviews').upsert({...r,updated_at:new Date().toISOString()},{onConflict:'product_id'})
  if(dbError)throw dbError
  await load()
  feedback.value='Private research review and audit history saved. Public catalog unchanged.'
 }catch(e:any){feedback.value=e?.message||'Unable to save review.'}
 finally{saving.value=''}
}
const supplier=(id:string)=>leads.value.find(s=>s.id===id)
const report=computed(()=>products.value.map(product=>{
 const choices=quotes.value.filter(q=>q.product_id===product.id).map(quote=>({quote,insight:scoreQuote(quote,supplier(quote.supplier_lead_id),product,target.value)}))
 .sort((a,b)=>b.insight.points-a.insight.points)
 const best=choices[0]
 const checked=stock.value.filter(s=>s.product_id===product.id&&s.verified_at&&['in_stock','low_stock'].includes(s.stock_status))
 const fresh=checked.some(s=>Date.now()-Date.parse(s.verified_at!)<=30*86400000 && s.supplier_lead_id===best?.quote.supplier_lead_id)
 const blockers=[...(best?.insight.blockers??['No supplier quote available'])]
 if(!fresh)blockers.push('No matching supplier stock verification within 30 days')
 if(!product.material?.trim())blockers.push('Material information not documented')
 if(!product.supplier_product_url?.trim())blockers.push('Supplier product URL not documented')
 if(!best?.insight.result.complete)blockers.push('Profit calculation incomplete')
 if((best?.insight.result.marginPct??-Infinity)<target.value)blockers.push('Estimated margin below target')
 return {product,best,blockers,ready:!blockers.length}
}))
const totals=computed(()=>({total:report.value.length,reviewable:report.value.filter(r=>r.ready).length,blocked:report.value.filter(r=>!r.ready).length}))
const load=async()=>{
 loading.value=true;error.value=''
 try{
  const client=useSupabaseBrowser()
  if(!client)throw new Error('Supabase admin connection unavailable')
  const {data:{user},error:authError}=await client.auth.getUser()
  if(authError||!user){await navigateTo('/admin/login');return}
  const {data:admin,error:adminError}=await client.from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
  if(adminError||!admin){authorized.value=false;return}
  authorized.value=true
  const [p,l,q,s,r,a]=await Promise.all([
   client.from('products').select('id,name,slug,price,active,material,supplier_sku,supplier_product_url').order('name'),
   client.from('supplier_leads').select('id,name,status,shipping_to_sweden'),
   client.from('supplier_quotes').select('*'),
   client.from('supplier_catalog_items').select('product_id,stock_status,verified_at,supplier_lead_id'),
   client.from('product_evidence_reviews').select('*'),
   client.from('product_evidence_audit').select('id,product_id,actor_id,changed_at,action,old_record,new_record').order('changed_at',{ascending:false}).limit(500)
  ])
  if(p.error||l.error||q.error||s.error||r.error||a.error)throw p.error||l.error||q.error||s.error||r.error||a.error
  products.value=(p.data||[]) as ProductSnapshot[];leads.value=(l.data||[]) as LeadSnapshot[]
  quotes.value=(q.data||[]) as SupplierQuote[];stock.value=(s.data||[]) as Stock[];audit.value=(a.data||[]) as Audit[]
  const stored=new Map((r.data||[]).map((item:any)=>[item.product_id,item]))
  for(const product of products.value){const row=stored.get(product.id) as Review|undefined;reviews[product.id]=row?{product_id:row.product_id,evidence_url:row.evidence_url,evidence_notes:row.evidence_notes,reviewed_on:row.reviewed_on,review_due_on:row.review_due_on,decision:row.decision,decision_note:row.decision_note}:{product_id:product.id,evidence_url:null,evidence_notes:'',reviewed_on:null,review_due_on:null,decision:'pending',decision_note:''}}
 }catch(e:any){error.value=e?.message||'Unable to load supplier evidence'}
 finally{loading.value=false}
}
onMounted(load)
useSeoMeta({title:'Supplier evidence readiness',robots:'noindex,nofollow'})
</script>
<template>
 <main class="admin-shell nr-ready">
  <header class="admin-topbar"><NorrliLogo compact/><div class="admin-top-actions"><NuxtLink to="/admin" class="btn btn-secondary compact"><ArrowLeft :size="16"/> Dashboard</NuxtLink><button class="btn btn-secondary compact" type="button" @click="load"><RefreshCw :size="16"/> Refresh</button></div></header>
  <section v-if="loading" class="admin-center" role="status">Loading supplier evidence…</section>
  <section v-else-if="!authorized" class="admin-center admin-denied"><h1>Admin access required</h1><NuxtLink to="/admin/login" class="btn btn-primary">Sign in</NuxtLink></section>
  <template v-else>
   <div class="nr-ready-heading"><span class="eyebrow"><ClipboardCheck :size="16"/> PRIVATE PRODUCT REVIEW</span><h1>Supplier verification & product readiness</h1><p>Review evidence gaps before considering a product for launch. A complete checklist is a research milestone, not a safety certification or permission to sell.</p></div>
   <div class="nr-ready-safety"><ShieldCheck :size="21"/><span>Read-only research dashboard. No product activation, supplier approval, inventory changes, purchase orders, checkout or payment activation.</span></div>
   <p v-if="error" role="alert" class="admin-feedback error">{{error}}</p>
   <p v-if="feedback" class="admin-feedback" role="status">{{feedback}}</p>
   <div class="nr-ready-summary"><div><small>Products</small><strong>{{totals.total}}</strong></div><div><small>Research checklist complete</small><strong>{{totals.reviewable}}</strong></div><div><small>Evidence gaps</small><strong>{{totals.blocked}}</strong></div></div>
   <div class="nr-ready-toolbar"><label>Target contribution margin (%) <input v-model.number="target" type="number" min="0" max="90"/></label><NuxtLink to="/admin/quotes">Supplier quotations →</NuxtLink><NuxtLink to="/admin/catalog">Stock verification →</NuxtLink></div>
   <p v-if="!Number.isFinite(target)||target<0||target>90" role="alert" class="admin-feedback error">Target margin must be between 0 and 90 percent.</p>
   <section v-else class="nr-ready-grid" aria-label="Product evidence reviews">
    <article v-for="entry in report" :key="entry.product.id" class="nr-ready-card">
     <div class="nr-ready-card-top"><h2>{{entry.product.name}}</h2><span :class="entry.ready?'complete':'blocked'">{{entry.ready?'Research complete':'Needs evidence'}}</span></div>
     <p>Preferred comparison: {{entry.best?.quote.label||'No quotation'}} · {{supplier(entry.best?.quote.supplier_lead_id||'')?.name||'No supplier'}}</p>
     <div class="nr-ready-metrics"><span>Evidence score <strong>{{entry.best?.insight.points??0}} / 100</strong></span><span>Estimated contribution <strong>{{formatSek(entry.best?.insight.result.profit)}}</strong></span><span>Estimated margin <strong>{{entry.best?.insight.result.marginPct==null?'—':entry.best.insight.result.marginPct+'%'}}</strong></span></div>
     <div v-if="entry.blockers.length"><h3><AlertTriangle :size="16"/> Items to verify</h3><ul><li v-for="blocker in entry.blockers" :key="blocker">{{blocker}}</li></ul></div>
     <p v-else class="nr-ready-ok">Documented research checks passed. Independent product safety, legal and supplier checks are still required.</p>
     <form v-if="reviews[entry.product.id]" class="nr-review-form" @submit.prevent="saveReview(entry.product.id)">
       <h3>Private evidence & decision</h3><p :class="reviewExpired(entry.product.id)?'nr-review-overdue':'nr-review-status'" role="status">{{reviewExpiry(entry.product.id)}}</p>
       <label>Evidence URL (HTTPS)<input v-model.trim="reviews[entry.product.id].evidence_url" type="url" maxlength="1000" placeholder="https://…"/></label>
       <label>Evidence notes<textarea v-model="reviews[entry.product.id].evidence_notes" maxlength="4000" rows="3"/></label>
       <div class="nr-review-dates"><label>Reviewed on<input v-model="reviews[entry.product.id].reviewed_on" type="date"/></label><label>Review again by<input v-model="reviews[entry.product.id].review_due_on" type="date"/></label></div>
       <label>Research decision<select v-model="reviews[entry.product.id].decision"><option value="pending">Pending review</option><option value="needs_work">Needs more evidence</option><option value="research_approved" :disabled="!entry.ready||reviewExpired(entry.product.id)">Research evidence complete</option></select></label>
       <label>Decision rationale<textarea v-model="reviews[entry.product.id].decision_note" maxlength="2000" rows="2"/></label>
       <p v-if="reviews[entry.product.id].decision==='research_approved'&&(!entry.ready||reviewExpired(entry.product.id))" role="alert">Evidence checklist no longer passes. Change the decision before saving.</p>
       <button class="btn btn-primary compact" type="submit" :disabled="!!saving || (reviews[entry.product.id].decision==='research_approved'&&!entry.ready)">{{saving===entry.product.id?'Saving…':'Save research review'}}</button>
     </form>
     <details class="nr-review-history"><summary>Review audit history ({{historyFor(entry.product.id).length}} recent)</summary><div v-if="!historyFor(entry.product.id).length">No recorded changes yet.</div><ol v-else><li v-for="event in historyFor(entry.product.id)" :key="event.id"><strong>{{event.action==='insert'?'Created':'Updated'}} · {{new Date(event.changed_at).toLocaleString('sv-SE')}}</strong><small>Actor: {{event.actor_id||'Unknown'}} · Decision: {{event.old_record?.decision||'—'}} → {{event.new_record?.decision||'—'}}</small></li></ol></details>
    </article>
   </section>
  </template>
 </main>
</template>
<style scoped>
.nr-ready-heading{padding:38px 34px 16px;max-width:980px}.nr-ready-heading h1{font:500 clamp(34px,4vw,52px)/1.1 Georgia,serif;color:#214a36;letter-spacing:-.045em;margin:12px 0}.nr-ready-heading p{color:#66776b;line-height:1.65}.nr-ready-safety{display:flex;gap:12px;align-items:center;margin:0 34px 20px;padding:17px;background:#e9f1e6;border:1px solid #d3e5d0;border-radius:15px;font-size:13px;color:#27543b}.nr-ready-safety svg{flex:none}.nr-ready-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 34px 20px}.nr-ready-summary>div{padding:18px;background:white;border-radius:15px;border:1px solid #e0e8dc}.nr-ready-summary small{display:block;color:#607365}.nr-ready-summary strong{font-size:29px;color:#234b37}.nr-ready-toolbar{display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin:0 34px 22px}.nr-ready-toolbar label{font-size:12px;font-weight:700}.nr-ready-toolbar input{margin-left:8px;width:70px;border:1px solid #c5d6c2;border-radius:9px;padding:10px}.nr-ready-toolbar a{font-size:12px;font-weight:750;color:#245a40;text-decoration:underline}.nr-ready-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin:0 34px}.nr-ready-card{background:#fff;border:1px solid #dce8d9;border-radius:20px;padding:23px;min-width:0}.nr-ready-card-top{display:flex;justify-content:space-between;align-items:start;gap:12px}.nr-ready-card h2{font:500 25px Georgia,serif;color:#1e4b35;margin:0}.nr-ready-card-top span{font-size:11px;border-radius:99px;padding:7px 10px;white-space:nowrap;background:#f8eadd;color:#885335}.nr-ready-card-top .complete{background:#e5f2e5;color:#245b38}.nr-ready-card>p{font-size:12px;color:#5f7667}.nr-ready-metrics{display:grid;gap:8px;margin:16px 0}.nr-ready-metrics span{display:flex;justify-content:space-between;gap:12px;font-size:12px;padding:8px 0;border-bottom:1px solid #edf0eb}.nr-ready-card h3{display:flex;gap:8px;align-items:center;font-size:13px;color:#825037}.nr-ready-card ul{padding-left:20px;color:#68594a;font-size:12px;line-height:1.75}.nr-ready-ok{color:#285c40!important}@media(max-width:850px){.nr-ready-grid{grid-template-columns:1fr}}@media(max-width:580px){.nr-ready-heading{padding:24px 16px}.nr-ready-safety,.nr-ready-summary,.nr-ready-toolbar,.nr-ready-grid{margin-left:16px;margin-right:16px}.nr-ready-summary{grid-template-columns:1fr 1fr}.nr-ready-card{padding:17px}.nr-ready-card-top{flex-wrap:wrap}}
.nr-review-form{display:grid;gap:12px;margin-top:20px;border-top:1px solid #e3ebe1;padding-top:16px}.nr-review-form label{display:grid;gap:5px;font-size:12px;font-weight:750;color:#315641}.nr-review-form input,.nr-review-form textarea,.nr-review-form select{width:100%;min-width:0;border:1px solid #cddccd;background:#fafbf8;color:#244631;border-radius:9px;padding:10px;font:inherit}.nr-review-dates{display:grid;grid-template-columns:1fr 1fr;gap:10px}.nr-review-form button{justify-self:start}.nr-review-form input:focus-visible,.nr-review-form textarea:focus-visible,.nr-review-form select:focus-visible{outline:3px solid #327c52;outline-offset:2px}@media(max-width:580px){.nr-review-dates{grid-template-columns:1fr}}.nr-review-status{font-size:12px;color:#37684b}.nr-review-overdue{font-size:12px;color:#993b2e;font-weight:800}.nr-review-history{margin-top:18px;border-top:1px solid #e5ede2;padding-top:12px;color:#3a5c46;font-size:12px}.nr-review-history summary{cursor:pointer;font-weight:800}.nr-review-history li{margin:12px 0}.nr-review-history small{display:block;color:#6c7f70;margin-top:4px;overflow-wrap:anywhere}</style>
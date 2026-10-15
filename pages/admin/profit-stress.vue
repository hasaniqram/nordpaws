<script setup lang="ts">
import { ArrowLeft, RefreshCw, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-vue-next'
import { calculateQuote, formatSek, type SupplierQuote } from '~/utils/profitability'

type Product = {id:string; name:string; price:number}
type Supplier = {id:string; name:string}
const loading=ref(true),authorized=ref(false),error=ref('')
const products=ref<Product[]>([]),suppliers=ref<Supplier[]>([]),quotes=ref<SupplierQuote[]>([])
const chosen=ref(''),costRise=ref(10),fxRise=ref(5),adIncrease=ref(25),targetMargin=ref(25)
const productFor=(id:string)=>products.value.find(p=>p.id===id)
const supplierFor=(id:string)=>suppliers.value.find(s=>s.id===id)?.name||'Unknown supplier'
const validBound=(value:number,min:number,max:number)=>Number.isFinite(value)&&value>=min&&value<=max
const inputValid=computed(()=>validBound(costRise.value,0,200)&&validBound(fxRise.value,0,100)&&validBound(adIncrease.value,0,10000)&&validBound(targetMargin.value,0,90))
const current=computed(()=>quotes.value.find(q=>q.id===chosen.value))
const scenarios=computed(()=>{
 const q=current.value,p=q&&productFor(q.product_id)
 if(!q||!p||!inputValid.value)return []
 const price=p.price/100
 const cases=[
  {key:'base',name:'Baseline',details:'Saved quotation, unchanged',quote:q},
  {key:'supplier',name:'Supplier cost pressure',details:`Supplier unit cost +${costRise.value}% and FX +${fxRise.value}%`,
   quote:{...q,unit_cost:q.unit_cost==null?null:q.unit_cost*(1+costRise.value/100),fx_to_sek:q.fx_to_sek*(1+fxRise.value/100)}},
  {key:'marketing',name:'Acquisition pressure',details:`Additional SEK ${adIncrease.value} advertising per order`,
   quote:{...q,ad_cost_per_order_sek:(q.ad_cost_per_order_sek??0)+adIncrease.value}}
 ]
 return cases.map(c=>({...c,result:calculateQuote(c.quote,price,targetMargin.value)}))
})
const load=async()=>{
 const client=useSupabaseBrowser()
 loading.value=true;error.value=''
 try{
  if(!client)throw new Error('Admin login is not configured.')
  const {data:identity,error:authError}=await client.auth.getUser()
  if(authError||!identity.user){await navigateTo('/admin/login');return}
  const {data:admin,error:adminError}=await client.from('admins').select('user_id').eq('user_id',identity.user.id).maybeSingle()
  if(adminError||!admin){authorized.value=false;return}
  authorized.value=true
  const [p,s,q]=await Promise.all([
   client.from('products').select('id,name,price').order('name'),
   client.from('supplier_leads').select('id,name').order('name'),
   client.from('supplier_quotes').select('*').order('created_at',{ascending:false})
  ])
  if(p.error||s.error||q.error)throw p.error||s.error||q.error
  products.value=(p.data||[]) as Product[]
  suppliers.value=(s.data||[]) as Supplier[]
  quotes.value=(q.data||[]) as SupplierQuote[]
  if(!quotes.value.some(q=>q.id===chosen.value))chosen.value=quotes.value[0]?.id||''
 }catch(e:any){error.value=e?.message||'Could not load profitability data.'}
 finally{loading.value=false}
}
onMounted(load)
useSeoMeta({title:'Profit stress test — Norrli Pets',robots:'noindex,nofollow'})
</script>

<template>
 <main class="admin-shell norrli-stress-shell">
  <header class="admin-topbar"><NorrliLogo compact/><div class="admin-top-actions"><NuxtLink class="btn btn-secondary compact" to="/admin/quotes"><ArrowLeft :size="16"/> Supplier quotes</NuxtLink><button type="button" class="btn btn-secondary compact" @click="load"><RefreshCw :size="16"/> Refresh</button></div></header>
  <section v-if="loading" class="admin-center" role="status">Loading private profitability workspace…</section>
  <section v-else-if="!authorized" class="admin-center admin-denied"><h1>Admin access required</h1><NuxtLink to="/admin/login" class="btn btn-primary">Sign in</NuxtLink></section>
  <template v-else>
   <div class="norrli-stress-heading"><span class="eyebrow"><TrendingUp :size="16"/> PHASE 3.1 · PRIVATE FINANCIAL PLANNING</span><h1>Profitability stress test</h1><p>Explore supplier-cost, exchange-rate and advertising shocks before selecting launch products. All scenarios are read-only calculations.</p></div>
   <div class="norrli-stress-notice"><ShieldCheck :size="21"/><p><strong>No public changes or payments.</strong> This page does not update the catalog, save supplier quotes, create orders or enable checkout. Estimates rely on your entered assumptions, not verified tax or supplier data.</p></div>
   <div v-if="error" class="admin-feedback error" role="alert">{{error}}</div>
   <div v-if="!quotes.length" class="pm-card norrli-stress-empty"><h2>No supplier quotations available</h2><p>Add a supplier quotation before modeling profit scenarios.</p><NuxtLink to="/admin/quotes" class="btn btn-primary">Open supplier quotations</NuxtLink></div>
   <template v-else>
    <section class="norrli-stress-controls" aria-label="Scenario assumptions">
     <label class="norrli-stress-main">Supplier quotation<select v-model="chosen"><option v-for="q in quotes" :key="q.id" :value="q.id">{{productFor(q.product_id)?.name||'Product'}} · {{supplierFor(q.supplier_lead_id)}} · {{q.label}}</option></select></label>
     <label>Supplier price increase (%)<input v-model.number="costRise" type="number" min="0" max="200" step="1"/></label>
     <label>Exchange-rate increase (%)<input v-model.number="fxRise" type="number" min="0" max="100" step="1"/></label>
     <label>Additional advertising (SEK/order)<input v-model.number="adIncrease" type="number" min="0" max="10000" step="1"/></label>
     <label>Target contribution margin (%)<input v-model.number="targetMargin" type="number" min="0" max="90" step="1"/></label>
    </section>
    <p v-if="!inputValid" class="admin-feedback error" role="alert">Enter nonnegative values within the stated limits before modeling scenarios.</p>
    <section v-else class="norrli-stress-results" aria-label="Profit comparison">
     <article v-for="scenario in scenarios" :key="scenario.key" class="norrli-stress-result">
      <small>{{scenario.name}}</small><h2>{{scenario.result.complete?formatSek(scenario.result.profit):'Incomplete quote'}}</h2>
      <p>{{scenario.details}}</p>
      <dl><div><dt>Contribution margin</dt><dd>{{scenario.result.marginPct==null?'—':scenario.result.marginPct+'%'}}</dd></div><div><dt>Estimated cost per order</dt><dd>{{formatSek(scenario.result.totalCost)}}</dd></div><div><dt>Target selling price / unit*</dt><dd>{{formatSek(scenario.result.targetUnitPrice)}}</dd></div><div><dt>Break-even selling price / unit*</dt><dd>{{formatSek(scenario.result.breakEvenUnitPrice)}}</dd></div></dl>
      <p v-if="scenario.result.missing.length" class="norrli-stress-warning"><AlertTriangle :size="16"/> Missing: {{scenario.result.missing.join(', ')}}</p>
      <p v-else-if="scenario.result.marginPct!==null&&scenario.result.marginPct<targetMargin" class="norrli-stress-warning"><AlertTriangle :size="16"/> Below selected contribution target</p>
     </article>
    </section>
    <p class="norrli-stress-footnote">*Illustrative price inclusive of assumed VAT; see each quote for its VAT and cost assumptions. Missing optional charges may be treated as zero. Supplier quotes and taxes must be verified independently.</p>
    <div class="norrli-stress-links"><NuxtLink to="/admin/quotes">Edit supplier quotations →</NuxtLink><NuxtLink to="/admin/decisions">Review product decisions →</NuxtLink><NuxtLink to="/admin/catalog">Review stock evidence →</NuxtLink></div>
   </template>
  </template>
 </main>
</template>
<style scoped>
.norrli-stress-shell{color:#203e30}.norrli-stress-heading{padding:42px 34px 20px;max-width:950px}.norrli-stress-heading h1{font:500 clamp(33px,4vw,54px)/1.08 Georgia,serif;letter-spacing:-.045em;margin:10px 0;color:#1a4833}.norrli-stress-heading p{color:#65766a;line-height:1.65}.norrli-stress-notice{display:flex;gap:12px;align-items:start;background:#e7f0e3;border:1px solid #d0e1cc;border-radius:15px;margin:0 34px 20px;padding:17px 20px}.norrli-stress-notice svg{flex:none}.norrli-stress-notice p{margin:0;font-size:13px;line-height:1.6}.norrli-stress-controls{margin:0 34px 22px;padding:22px;border:1px solid #dbe5d8;border-radius:19px;background:white;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.norrli-stress-controls label{display:grid;gap:8px;font-size:12px;font-weight:750}.norrli-stress-main{grid-column:1/-1}.norrli-stress-controls input,.norrli-stress-controls select{min-width:0;width:100%;border:1px solid #cbdccc;border-radius:11px;padding:12px;background:#fafbf8;color:#1b4933}.norrli-stress-results{margin:0 34px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.norrli-stress-result{background:#fff;border:1px solid #dbe5d8;border-radius:19px;padding:23px;min-width:0}.norrli-stress-result>small{font-weight:800;color:#547860}.norrli-stress-result h2{font:500 clamp(24px,2.3vw,36px)/1.16 Georgia,serif;color:#1c4d36;margin:10px 0}.norrli-stress-result>p{font-size:12px;color:#627569}.norrli-stress-result dl{margin:20px 0 0}.norrli-stress-result dl>div{display:flex;justify-content:space-between;gap:10px;border-top:1px solid #ecf1e9;padding:11px 0;font-size:12px}.norrli-stress-result dt{color:#6a7d70}.norrli-stress-result dd{font-weight:800;text-align:right;margin:0}.norrli-stress-warning{display:flex;gap:7px;align-items:start;color:#8d4c30!important}.norrli-stress-footnote{margin:19px 34px;font-size:12px;color:#647969;line-height:1.65}.norrli-stress-links{display:flex;flex-wrap:wrap;gap:18px;margin:20px 34px}.norrli-stress-links a{color:#245b3d;text-decoration:underline;text-underline-offset:3px;font-weight:750;font-size:13px}.norrli-stress-empty{margin:0 34px}.norrli-stress-shell input:focus-visible,.norrli-stress-shell select:focus-visible,.norrli-stress-shell a:focus-visible,.norrli-stress-shell button:focus-visible{outline:3px solid #31764a;outline-offset:2px}@media(max-width:1000px){.norrli-stress-results{grid-template-columns:1fr}.norrli-stress-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.norrli-stress-heading{padding:28px 16px 20px}.norrli-stress-notice,.norrli-stress-controls,.norrli-stress-results,.norrli-stress-footnote,.norrli-stress-links{margin-left:16px;margin-right:16px}.norrli-stress-controls{grid-template-columns:1fr;padding:15px}.norrli-stress-result{padding:17px}.norrli-stress-shell .admin-topbar{height:auto;min-height:76px;gap:12px;flex-wrap:wrap;padding-block:13px}}
</style>
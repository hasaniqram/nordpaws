<script setup lang="ts">
import { ArrowLeft, RefreshCw, ShieldCheck, AlertTriangle, ClipboardCheck } from 'lucide-vue-next'
import { scoreQuote, type LeadSnapshot, type ProductSnapshot } from '~/utils/sourcingInsights'
import { formatSek, type SupplierQuote } from '~/utils/profitability'
type Stock={product_id:string|null;stock_status:string;verified_at:string|null;supplier_lead_id:string}
const loading=ref(true),authorized=ref(false),error=ref('')
const products=ref<ProductSnapshot[]>([]),leads=ref<LeadSnapshot[]>([]),quotes=ref<SupplierQuote[]>([]),stock=ref<Stock[]>([])
const target=ref(25)
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
  const [p,l,q,s]=await Promise.all([
   client.from('products').select('id,name,slug,price,active,material,supplier_sku,supplier_product_url').order('name'),
   client.from('supplier_leads').select('id,name,status,shipping_to_sweden'),
   client.from('supplier_quotes').select('*'),
   client.from('supplier_catalog_items').select('product_id,stock_status,verified_at,supplier_lead_id')
  ])
  if(p.error||l.error||q.error||s.error)throw p.error||l.error||q.error||s.error
  products.value=(p.data||[]) as ProductSnapshot[];leads.value=(l.data||[]) as LeadSnapshot[]
  quotes.value=(q.data||[]) as SupplierQuote[];stock.value=(s.data||[]) as Stock[]
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
    </article>
   </section>
  </template>
 </main>
</template>
<style scoped>
.nr-ready-heading{padding:38px 34px 16px;max-width:980px}.nr-ready-heading h1{font:500 clamp(34px,4vw,52px)/1.1 Georgia,serif;color:#214a36;letter-spacing:-.045em;margin:12px 0}.nr-ready-heading p{color:#66776b;line-height:1.65}.nr-ready-safety{display:flex;gap:12px;align-items:center;margin:0 34px 20px;padding:17px;background:#e9f1e6;border:1px solid #d3e5d0;border-radius:15px;font-size:13px;color:#27543b}.nr-ready-safety svg{flex:none}.nr-ready-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 34px 20px}.nr-ready-summary>div{padding:18px;background:white;border-radius:15px;border:1px solid #e0e8dc}.nr-ready-summary small{display:block;color:#607365}.nr-ready-summary strong{font-size:29px;color:#234b37}.nr-ready-toolbar{display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin:0 34px 22px}.nr-ready-toolbar label{font-size:12px;font-weight:700}.nr-ready-toolbar input{margin-left:8px;width:70px;border:1px solid #c5d6c2;border-radius:9px;padding:10px}.nr-ready-toolbar a{font-size:12px;font-weight:750;color:#245a40;text-decoration:underline}.nr-ready-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin:0 34px}.nr-ready-card{background:#fff;border:1px solid #dce8d9;border-radius:20px;padding:23px;min-width:0}.nr-ready-card-top{display:flex;justify-content:space-between;align-items:start;gap:12px}.nr-ready-card h2{font:500 25px Georgia,serif;color:#1e4b35;margin:0}.nr-ready-card-top span{font-size:11px;border-radius:99px;padding:7px 10px;white-space:nowrap;background:#f8eadd;color:#885335}.nr-ready-card-top .complete{background:#e5f2e5;color:#245b38}.nr-ready-card>p{font-size:12px;color:#5f7667}.nr-ready-metrics{display:grid;gap:8px;margin:16px 0}.nr-ready-metrics span{display:flex;justify-content:space-between;gap:12px;font-size:12px;padding:8px 0;border-bottom:1px solid #edf0eb}.nr-ready-card h3{display:flex;gap:8px;align-items:center;font-size:13px;color:#825037}.nr-ready-card ul{padding-left:20px;color:#68594a;font-size:12px;line-height:1.75}.nr-ready-ok{color:#285c40!important}@media(max-width:850px){.nr-ready-grid{grid-template-columns:1fr}}@media(max-width:580px){.nr-ready-heading{padding:24px 16px}.nr-ready-safety,.nr-ready-summary,.nr-ready-toolbar,.nr-ready-grid{margin-left:16px;margin-right:16px}.nr-ready-summary{grid-template-columns:1fr 1fr}.nr-ready-card{padding:17px}.nr-ready-card-top{flex-wrap:wrap}}
</style>
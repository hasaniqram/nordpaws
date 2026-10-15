<script setup lang="ts">
import { ArrowLeft, RefreshCw, ShieldAlert, ClipboardCheck } from 'lucide-vue-next'
import { checkOperationalReadiness } from '~/utils/operationalReadiness.mjs'
type Product={id:string;name:string;active:boolean;price:number}
type Review={product_id:string;decision:string;review_due_on:string|null}
type Stock={product_id:string|null;stock_status:string;verified_at:string|null}
const loading=ref(true),authorized=ref(false),error=ref('')
const products=ref<Product[]>([]),reviews=ref<Review[]>([]),stock=ref<Stock[]>([])
const report=computed(()=>products.value.map(p=>({product:p,...checkOperationalReadiness(p,reviews.value.find(r=>r.product_id===p.id),stock.value.filter(s=>s.product_id===p.id))})))
 .sort((a,b)=>Number(b.publiclyActiveWithGaps)-Number(a.publiclyActiveWithGaps)||b.blockers.length-a.blockers.length)
const risk=computed(()=>report.value.filter(r=>r.publiclyActiveWithGaps).length)
const load=async()=>{
 loading.value=true;error.value=''
 try{
 const c=useSupabaseBrowser();if(!c)throw Error('Administrator connection unavailable')
 const {data:{user},error:e}=await c.auth.getUser()
 if(e||!user){await navigateTo('/admin/login');return}
 const {data:admin,error:ae}=await c.from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
 if(ae||!admin){authorized.value=false;return}
 authorized.value=true
 const [p,r,s]=await Promise.all([
  c.from('products').select('id,name,active,price').order('name'),
  c.from('product_evidence_reviews').select('product_id,decision,review_due_on'),
  c.from('supplier_catalog_items').select('product_id,stock_status,verified_at')
 ])
 if(p.error||r.error||s.error)throw p.error||r.error||s.error
 products.value=p.data||[];reviews.value=r.data||[];stock.value=s.data||[]
 }catch(e:any){error.value=e?.message||'Unable to load operational risks'}
 finally{loading.value=false}
}
onMounted(load)
useSeoMeta({title:'Phase 4 operations audit',robots:'noindex,nofollow'})
</script>
<template>
<main class="admin-shell nr-phase4">
<header class="admin-topbar"><NorrliLogo compact/><div class="admin-top-actions"><NuxtLink to="/admin" class="btn btn-secondary compact"><ArrowLeft :size="16"/> Dashboard</NuxtLink><button type="button" class="btn btn-secondary compact" @click="load"><RefreshCw :size="16"/> Refresh</button></div></header>
<section v-if="loading" class="admin-center" role="status">Checking operational evidence…</section>
<section v-else-if="!authorized" class="admin-center">Administrator access required.</section>
<template v-else>
<div class="nr-p4-heading"><span class="eyebrow"><ClipboardCheck :size="16"/> PHASE 4 · PRIVATE OPERATIONS</span><h1>Operational readiness audit</h1><p>Cross-check product activity, research approvals, review expiry and supplier stock evidence. This is an advisory report, not a product safety certification or an automated publishing gate.</p></div>
<p v-if="error" class="admin-feedback error" role="alert">{{error}}</p>
<div class="nr-p4-summary"><div><small>Catalog products</small><strong>{{report.length}}</strong></div><div><small>Active with evidence gaps</small><strong>{{risk}}</strong></div><div><small>Evidence checklist complete</small><strong>{{report.filter(r=>r.operationallyReady).length}}</strong></div></div>
<div class="nr-p4-notice"><ShieldAlert :size="20"/> No product status, inventory, orders or payments are changed by this dashboard. Review any active items with evidence gaps manually.</div>
<section class="nr-p4-list"><h2>Product verification queue</h2><p v-if="!report.length">No products found.</p><article v-for="item in report" :key="item.product.id"><div><h3>{{item.product.name}}</h3><small>{{item.product.active?'Catalog active':'Catalog inactive'}} · {{item.operationallyReady?'Documented checks complete':'Evidence gaps present'}}</small></div><span v-if="item.publiclyActiveWithGaps" class="nr-p4-risk">Active with gaps</span><ul v-if="item.blockers.length"><li v-for="reason in item.blockers" :key="reason">{{reason}}</li></ul><p v-else>Research date, available supplier stock and positive price documented. Additional compliance checks still required.</p></article></section>
<div class="nr-p4-links"><NuxtLink to="/admin/readiness">Review approvals →</NuxtLink><NuxtLink to="/admin/catalog">Verify supplier inventory →</NuxtLink><NuxtLink to="/admin/quotes">Check profitability →</NuxtLink></div>
</template></main>
</template>
<style scoped>
.nr-p4-heading{margin:36px 34px 20px;max-width:870px}.nr-p4-heading h1{font:500 clamp(32px,4vw,50px)/1.1 Georgia,serif;color:#214b35;margin:12px 0}.nr-p4-heading p{color:#667b6a;line-height:1.7}.nr-p4-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 34px 20px}.nr-p4-summary>div,.nr-p4-list{border:1px solid #dce8d9;background:white;border-radius:18px;padding:21px}.nr-p4-summary small{display:block;color:#607667}.nr-p4-summary strong{font-size:31px;color:#224d37}.nr-p4-notice{display:flex;gap:12px;margin:0 34px 20px;padding:17px;border:1px solid #ead6bc;background:#fbf4e8;color:#745632;border-radius:13px;font-size:13px}.nr-p4-list{margin:0 34px}.nr-p4-list h2{font:500 27px Georgia,serif;color:#214b35}.nr-p4-list article{border-top:1px solid #e7eee6;padding:18px 0}.nr-p4-list article h3{margin:0;color:#285139}.nr-p4-list article small{color:#6f8174}.nr-p4-list article ul{font-size:13px;color:#845b41;line-height:1.8}.nr-p4-list article p{font-size:13px;color:#487153}.nr-p4-risk{display:inline-block;margin-top:8px;background:#f7e3d2;color:#8c4c2b;padding:5px 9px;border-radius:99px;font-size:12px}.nr-p4-links{display:flex;gap:22px;flex-wrap:wrap;margin:20px 34px 40px;font-size:13px;font-weight:750;color:#275a40}.nr-p4-links a{text-decoration:underline}@media(max-width:630px){.nr-p4-heading,.nr-p4-summary,.nr-p4-notice,.nr-p4-list,.nr-p4-links{margin-left:16px;margin-right:16px}.nr-p4-summary{grid-template-columns:1fr 1fr}}
</style>
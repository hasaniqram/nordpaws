<script setup lang="ts">
import { ArrowLeft, RefreshCw, ShieldCheck, TrendingUp } from 'lucide-vue-next'
import { detectInventoryChange } from '~/utils/inventoryChangeMonitor.mjs'
type Item={id:string;product_id:string|null;supplier_lead_id:string;title:string;stock_status:string;stock_quantity:number|null;unit_cost:number|null;currency:string;verified_at:string|null;source_type:string;last_imported_at:string|null;updated_at:string}
type Product={id:string;name:string;stock_status:string;stock_quantity:number|null;price:number}
type Quote={id:string;product_id:string;supplier_lead_id:string;status:string;unit_cost:number|null;currency:string;fx_to_sek:number}
type Decision={item_id:string;decision:string;notes:string;reviewed_by:string|null;reviewed_at:string|null}
const loading=ref(true),authorized=ref(false),error=ref(''),feedback=ref(''),saving=ref('')
const items=ref<Item[]>([]),products=ref<Product[]>([]),quotes=ref<Quote[]>([]),currentUser=ref('')
const decisions=reactive<Record<string,Decision>>({})
const alertOnly=ref(true)
const evaluated=computed(()=>items.value.map(item=>{
 const product=products.value.find(p=>p.id===item.product_id)
 const quote=quotes.value.find(q=>q.product_id===item.product_id&&q.supplier_lead_id===item.supplier_lead_id&&q.status==='supplier_confirmed')
 return {item,product,change:detectInventoryChange(item,product,quote)}
}).filter(x=>!alertOnly.value||x.change.requiresReview))
const summary=computed(()=>({total:items.value.length,warnings:evaluated.value.filter(e=>e.change.requiresReview).length,imports:items.value.filter(i=>i.source_type==='csv').length}))
const load=async()=>{
 loading.value=true;error.value=''
 try{
 const c=useSupabaseBrowser();if(!c)throw Error('Private catalog unavailable')
 const {data:{user},error:authError}=await c.auth.getUser()
 if(authError||!user){await navigateTo('/admin/login');return}
 const {data:admin,error:adminError}=await c.from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
 if(adminError||!admin){authorized.value=false;return}
 authorized.value=true;currentUser.value=user.id
 const [i,p,q,d]=await Promise.all([
 c.from('supplier_catalog_items').select('id,product_id,supplier_lead_id,title,stock_status,stock_quantity,unit_cost,currency,verified_at,source_type,last_imported_at,updated_at').order('updated_at',{ascending:false}).limit(1000),
 c.from('products').select('id,name,stock_status,stock_quantity,price'),
 c.from('supplier_quotes').select('id,product_id,supplier_lead_id,status,unit_cost,currency,fx_to_sek'),
 c.from('inventory_change_reviews').select('*')
 ])
 if(i.error||p.error||q.error||d.error)throw i.error||p.error||q.error||d.error
 items.value=i.data||[];products.value=p.data||[];quotes.value=q.data||[]
 const saved=new Map((d.data||[]).map((x:any)=>[x.item_id,x]))
 for(const item of items.value)decisions[item.id]=(saved.get(item.id) as Decision)||{item_id:item.id,decision:'pending',notes:'',reviewed_by:null,reviewed_at:null}
 }catch(e:any){error.value=e?.message||'Unable to load inventory monitor'}
 finally{loading.value=false}
}
const save=async(id:string)=>{
 const c=useSupabaseBrowser(),review=decisions[id]
 if(!c||!authorized.value||!review||saving.value)return
 saving.value=id;feedback.value=''
 try{
 const {error:e}=await c.from('inventory_change_reviews').upsert({...review,reviewed_by:currentUser.value,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'item_id'})
 if(e)throw e
 feedback.value='Internal review saved. Product prices and stock remain unchanged.'
 await load()
 }catch(e:any){feedback.value=e?.message||'Unable to save review'}
 finally{saving.value=''}
}
onMounted(load)
useSeoMeta({title:'Inventory & cost monitoring',robots:'noindex,nofollow'})
</script>
<template>
<main class="admin-shell im-shell"><header class="admin-topbar"><NorrliLogo compact/><div class="admin-top-actions"><NuxtLink to="/admin" class="btn btn-secondary compact"><ArrowLeft :size="16"/> Dashboard</NuxtLink><button type="button" class="btn btn-secondary compact" @click="load"><RefreshCw :size="16"/> Refresh</button></div></header>
<section v-if="loading" class="admin-center" role="status">Comparing supplier information…</section>
<section v-else-if="!authorized" class="admin-center">Administrator access required.</section>
<template v-else><div class="im-heading"><span class="eyebrow"><TrendingUp :size="16"/> PHASE 4.4 · PRIVATE OPERATIONS</span><h1>Inventory & supplier price monitor</h1><p>Compare supplier catalog entries with storefront stock and confirmed quotations. Cost pressure is an early warning, not a calculated net profit margin.</p></div>
<div class="im-note"><ShieldCheck :size="20"/> Read-only comparison of product data. Saving a review records an internal decision only; it cannot publish products, synchronize prices, change inventory or activate payments.</div>
<p v-if="error" class="admin-feedback error" role="alert">{{error}}</p><p v-if="feedback" class="admin-feedback" role="status">{{feedback}}</p>
<div class="im-summary"><div><small>Catalog entries</small><strong>{{summary.total}}</strong></div><div><small>Flagged entries shown</small><strong>{{summary.warnings}}</strong></div><div><small>CSV-origin entries</small><strong>{{summary.imports}}</strong></div></div>
<div class="im-options"><label><input v-model="alertOnly" type="checkbox"/> Show discrepancies only</label><NuxtLink to="/admin/catalog">Supplier CSV imports and verification history →</NuxtLink><NuxtLink to="/admin/quotes">Profitability scenarios →</NuxtLink></div>
<section class="im-grid" aria-label="Supplier inventory comparisons"><article v-for="entry in evaluated" :key="entry.item.id" class="im-card">
<h2>{{entry.item.title}}</h2><p>Storefront product: {{entry.product?.name||'Unmapped'}} · {{entry.item.currency}}</p>
<div class="im-stats"><span>Supplier stock: <strong>{{entry.item.stock_status}} / {{entry.item.stock_quantity??'Unknown'}}</strong></span><span>Storefront stock: <strong>{{entry.product?.stock_status||'—'}} / {{entry.product?.stock_quantity??'Unknown'}}</strong></span><span>Unit cost: <strong>{{entry.item.unit_cost??'Unknown'}} {{entry.item.currency}}</strong></span><span>Quote cost difference: <strong>{{entry.change.changePct==null?'Not comparable':entry.change.changePct.toFixed(1)+'%'}}</strong></span><span>Wholesale / retail: <strong>{{entry.change.costRatio==null?'Not comparable':entry.change.costRatio.toFixed(1)+'%'}}</strong></span><span>Feed source: <strong>{{entry.item.source_type}} · {{entry.item.last_imported_at?new Date(entry.item.last_imported_at).toLocaleDateString('sv-SE'):'Not imported'}}</strong></span></div>
<ul v-if="entry.change.warnings.length" class="im-warnings"><li v-for="warning in entry.change.warnings" :key="warning">{{warning}}</li></ul><p v-else>No comparison discrepancies detected in currently available fields.</p>
<form v-if="decisions[entry.item.id]" @submit.prevent="save(entry.item.id)"><label>Admin review<select v-model="decisions[entry.item.id].decision"><option value="pending">Pending</option><option value="reviewed">Reviewed — no catalog update</option><option value="dismissed">Dismissed — no catalog update</option></select></label><label>Rationale<textarea v-model="decisions[entry.item.id].notes" maxlength="2000" rows="2"/></label><button type="submit" class="btn btn-primary compact" :disabled="!!saving">{{saving===entry.item.id?'Saving…':'Save internal review'}}</button></form>
</article></section>
<p v-if="!evaluated.length" class="im-empty">No entries match the selected filter.</p></template></main>
</template>
<style scoped>
.im-heading{margin:36px 34px 19px;max-width:950px}.im-heading h1{font:500 clamp(34px,4vw,52px)/1.1 Georgia,serif;color:#254c38;margin:12px 0}.im-heading p{color:#627767;line-height:1.7}.im-note{display:flex;gap:12px;margin:0 34px 20px;padding:16px;background:#e8f1e6;border:1px solid #d3e5cd;border-radius:14px;color:#305d40;font-size:13px}.im-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 34px 20px}.im-summary>div,.im-card{background:white;border:1px solid #dce8da;border-radius:18px;padding:20px}.im-summary small{display:block;color:#68806b}.im-summary strong{font-size:30px;color:#234c36}.im-options{display:flex;flex-wrap:wrap;gap:18px;margin:0 34px 22px;font-size:13px}.im-options a{text-decoration:underline;color:#275a40}.im-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin:0 34px 35px}.im-card h2{font:500 25px Georgia,serif;color:#224d36;margin:0}.im-card p{font-size:12px;color:#627c67}.im-stats{display:grid;gap:5px;margin:12px 0}.im-stats span{display:flex;justify-content:space-between;gap:10px;font-size:12px;border-bottom:1px solid #edf1eb;padding:6px 0}.im-warnings{font-size:12px;color:#a35131;line-height:1.75}.im-card form{display:grid;gap:12px;margin-top:16px}.im-card label{display:grid;gap:6px;font-size:12px;font-weight:750}.im-card select,.im-card textarea{width:100%;padding:10px;border:1px solid #cbdaca;border-radius:10px}.im-card button{justify-self:start}.im-empty{margin:20px 34px}@media(max-width:850px){.im-grid{grid-template-columns:1fr}}@media(max-width:580px){.im-heading,.im-note,.im-summary,.im-options,.im-grid{margin-left:16px;margin-right:16px}.im-summary{grid-template-columns:1fr 1fr}}
</style>
<script setup lang="ts">
import { ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-vue-next'
type Product={id:string;name:string;active:boolean}
type Review={product_id:string;decision:string;review_due_on?:string|null}
type Supplier={supplier_id:string;stage:string;verified_on:string|null;expires_on:string|null}
type Stock={product_id:string|null;supplier_lead_id:string;stock_status:string;verified_at:string|null}
type Launch={product_id:string;decision:string;notes:string;reviewed_at:string|null}
const products=ref<Product[]>([]),research=ref<Review[]>([]),safety=ref<Review[]>([]),suppliers=ref<Supplier[]>([]),stock=ref<Stock[]>([]),launch=reactive<Record<string,Launch>>({})
const loading=ref(true),authorized=ref(false),saving=ref(''),error=ref(''),feedback=ref('')
const validDate=(s?:string|null)=>!!s&&s>=new Date().toISOString().slice(0,10)
const reasons=(p:Product)=>{
 const messages:string[]=[]
 const r=research.value.find(x=>x.product_id===p.id)
 const s=safety.value.find(x=>x.product_id===p.id)
 if(!r||r.decision!=='research_approved'||!validDate(r.review_due_on))messages.push('Valid research approval missing or expired')
 if(!s||s.decision!=='research_complete'||!validDate(s.review_due_on))messages.push('Valid product-safety research missing or expired')
 const inventory=stock.value.filter(x=>x.product_id===p.id)
 if(!inventory.some(x=>['in_stock','low_stock'].includes(x.stock_status)&&!!x.verified_at&&Date.now()-Date.parse(x.verified_at)<=30*86400000&&Date.now()>=Date.parse(x.verified_at)))messages.push('Verified available stock within 30 days missing')
 if(!inventory.some(x=>suppliers.value.some(y=>y.supplier_id===x.supplier_lead_id&&y.stage==='research_complete'&&!!y.verified_on&&(!y.expires_on||validDate(y.expires_on)))))messages.push('Supplier compliance research incomplete')
 return messages
}
const load=async()=>{
 loading.value=true;error.value=''
 try{const c=useSupabaseBrowser();if(!c)throw Error('Admin database not configured')
 const {data:{user}}=await c.auth.getUser();if(!user){await navigateTo('/admin/login');return}
 const {data:admin,error:ae}=await c.from('admins').select('user_id').eq('user_id',user.id).maybeSingle();if(ae||!admin){authorized.value=false;return}
 authorized.value=true
 const names=['products','product_evidence_reviews','product_safety_reviews','supplier_compliance_records','supplier_catalog_items','product_launch_reviews'] as const
 const fields=['id,name,active','product_id,decision,review_due_on','product_id,decision,review_due_on','supplier_id,stage,verified_on,expires_on','product_id,supplier_lead_id,stock_status,verified_at','product_id,decision,notes,reviewed_at']
 const data=await Promise.all(names.map((table,i)=>c.from(table).select(fields[i])))
 if(data.some(x=>x.error))throw data.find(x=>x.error)?.error
 products.value=(data[0].data||[]) as unknown as Product[]
 research.value=(data[1].data||[]) as unknown as Review[]
 safety.value=(data[2].data||[]) as unknown as Review[]
 suppliers.value=(data[3].data||[]) as unknown as Supplier[]
 stock.value=(data[4].data||[]) as unknown as Stock[]
 for(const v of (data[5].data||[]) as unknown as Launch[])launch[v.product_id]={...v}
 for(const p of products.value)if(!launch[p.id])launch[p.id]={product_id:p.id,decision:'pending',notes:'',reviewed_at:null}
 }catch(e:any){error.value=e?.message||'Unable to load launch checks'}finally{loading.value=false}
}
const save=async(p:Product)=>{
 const c=useSupabaseBrowser(),r=launch[p.id];if(!c||!authorized.value||!r||saving.value)return
 if(r.decision==='approved_for_future_launch'&&reasons(p).length){feedback.value='Approval blocked: complete every prerequisite first.';return}
 const {data:{user}}=await c.auth.getUser()
 if(!user)return
 saving.value=p.id;feedback.value=''
 try{const {error:e}=await c.from('product_launch_reviews').upsert({...r,reviewed_by:user.id,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'product_id'})
 if(e)throw e;feedback.value='Internal launch review saved; no products activated or payments enabled.';await load()
 }catch(e:any){feedback.value=e?.message||'Save failed'}finally{saving.value=''}
}
onMounted(load)
useSeoMeta({title:'Product launch gate',robots:'noindex,nofollow'})
</script>
<template><main class="admin-shell"><header class="admin-topbar"><NorrliLogo compact/><div class="admin-top-actions"><NuxtLink to="/admin" class="btn btn-secondary compact"><ArrowLeft :size="16"/> Admin</NuxtLink><button class="btn btn-secondary compact" @click="load"><RefreshCw :size="16"/> Refresh</button></div></header>
<section v-if="loading" class="admin-center">Checking product readiness…</section><section v-else-if="!authorized" class="admin-center">Admin access required.</section>
<section v-else class="lg-wrap"><h1><ShieldCheck :size="30"/> Product Launch Approval Gate</h1><p>All research, supplier, inventory and product-safety prerequisites must be present before any new product activation. An internal future-launch approval is not an order or payment authorization.</p><p v-if="error" role="alert">{{error}}</p><p v-if="feedback" role="status">{{feedback}}</p>
<article v-for="p in products" :key="p.id" class="lg-card"><h2>{{p.name}}</h2><p>Existing storefront status: {{p.active?'Active (unchanged)':'Inactive'}}</p>
<ul v-if="reasons(p).length"><li v-for="reason in reasons(p)" :key="reason">{{reason}}</li></ul><p v-else>All tracked prerequisites currently present; final independent compliance review remains necessary.</p>
<form @submit.prevent="save(p)"><label>Internal review decision<select v-model="launch[p.id].decision"><option value="pending">Pending</option><option value="blocked">Blocked</option><option value="approved_for_future_launch" :disabled="reasons(p).length>0">Approved for future launch (does not activate)</option></select></label><label>Review notes<textarea v-model="launch[p.id].notes" maxlength="2000" rows="2"/></label><button class="btn btn-primary compact" type="submit" :disabled="!!saving||(launch[p.id].decision==='approved_for_future_launch'&&reasons(p).length>0)">Save internal review</button></form></article>
</section></main></template>
<style scoped>.lg-wrap{padding:35px;max-width:1000px;margin:auto}.lg-wrap h1{display:flex;gap:10px;align-items:center;color:#28583b;font:500 37px Georgia,serif}.lg-wrap>p{color:#617867;line-height:1.7}.lg-card{background:white;padding:22px;border:1px solid #d9e6d8;border-radius:16px;margin:18px 0}.lg-card h2{font:500 25px Georgia,serif;color:#28583b}.lg-card li{font-size:13px;color:#9d4a32;line-height:1.7}.lg-card form{display:grid;gap:12px}.lg-card label{display:grid;gap:6px;font-size:13px;font-weight:750}.lg-card select,.lg-card textarea{padding:10px;border:1px solid #ceddca;border-radius:8px;width:100%}.lg-card button{justify-self:start}@media(max-width:600px){.lg-wrap{padding:16px}}</style>
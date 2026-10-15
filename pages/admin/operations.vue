<script setup lang="ts">
import {
  ArrowLeft, RefreshCw, ShoppingBag, PackageCheck, Truck, Clock3,
  ShieldAlert, Search, ExternalLink, ClipboardCheck, FileSpreadsheet,
  BarChart3, ArrowRight, LockKeyhole, CheckCircle2, Save, PackageSearch
} from 'lucide-vue-next'
import { calculateQuote, formatSek, type SupplierQuote } from '~/utils/profitability'

type Order = {
  id:string; order_number:string; created_at:string; payment_status:string|null
  payment_provider:string|null; amount_total:number; fulfillment_status:string
  supplier_status:string|null; supplier_order_reference:string|null; tracking_number:string|null
  carrier:string|null; shipped_at:string|null
}
type Supplier = {id:string;name:string;status:string;shipping_to_sweden:boolean|null}
type CatalogItem = {id:string;product_id:string|null;stock_status:string;verified_at:string|null;title:string}
type Product = {id:string;name:string;price:number;active:boolean;stock_status:string;stock_quantity:number|null;supplier_id:string|null}
type FulfillmentDraft = {targetStatus:string;supplierOrderReference:string;carrier:string;trackingNumber:string}
const steps=['unfulfilled','supplier_ordered','processing','shipped','delivered'] as const
const loading=ref(true),authorized=ref(false),error=ref(''),message=ref(''),savingId=ref('')
const orders=ref<Order[]>([]),suppliers=ref<Supplier[]>([]),products=ref<Product[]>([])
const catalog=ref<CatalogItem[]>([]),quotes=ref<SupplierQuote[]>([])
const drafts=reactive<Record<string,FulfillmentDraft>>({})
const search=ref(''),queueFilter=ref('all')
const section=ref<'orders'|'suppliers'|'shipping'>('orders')
const displayStatus=(status:string|null)=>({
  unfulfilled:'Awaiting supplier',supplier_ordered:'Supplier ordered',processing:'Processing',
  shipped:'Shipped',delivered:'Delivered',cancelled:'Cancelled',refunded:'Refunded'
} as Record<string,string>)[status||'']||status||'Unfulfilled'
const money=(ore:number)=>formatSek(ore/100)
const dateText=(d:string)=>new Intl.DateTimeFormat('sv-SE',{dateStyle:'medium'}).format(new Date(d))
const isActionable=(o:Order)=>o.payment_status==='paid'&&o.payment_provider==='mollie'&&!o.order_number.startsWith('NR-TEST-')
  &&steps.includes((o.fulfillment_status||'unfulfilled') as typeof steps[number])
const nextStep=(o:Order)=>{
  if(!isActionable(o))return null
  const ix=steps.indexOf((o.fulfillment_status||'unfulfilled') as typeof steps[number])
  return ix>=0 && ix<steps.length-1?steps[ix+1]:null
}
const shippedCount=computed(()=>orders.value.filter(o=>isActionable(o)&&o.fulfillment_status==='shipped').length)
const waitingCount=computed(()=>orders.value.filter(o=>isActionable(o)&&(o.fulfillment_status||'unfulfilled')==='unfulfilled').length)
const inProgressCount=computed(()=>orders.value.filter(o=>isActionable(o)&&['supplier_ordered','processing'].includes(o.fulfillment_status)).length)
const blockedCount=computed(()=>orders.value.filter(o=>!isActionable(o)).length)
const eligibleQuotes=computed(()=>quotes.value.filter(q=>q.status==='supplier_confirmed'
  && suppliers.value.find(s=>s.id===q.supplier_lead_id)?.shipping_to_sweden===true))
const uncheckedStock=computed(()=>catalog.value.filter(c=>{
  if(!c.verified_at)return true
  return (Date.now()-new Date(c.verified_at).getTime())>30*24*3600*1000
}).length)
const stockWarnings=computed(()=>products.value.filter(p=>['low_stock','out_of_stock','unknown'].includes(p.stock_status)||p.stock_quantity===0))
const filteredOrders=computed(()=>orders.value.filter(o=>{
  if(queueFilter.value==='actionable'&&!nextStep(o))return false
  if(queueFilter.value==='blocked'&&isActionable(o))return false
  if(queueFilter.value==='shipped'&&o.fulfillment_status!=='shipped')return false
  const q=search.value.toLowerCase().trim()
  return !q||o.order_number.toLowerCase().includes(q)
}))
const draftFor=(o:Order)=>drafts[o.id]||{
  targetStatus:nextStep(o)||'',
  supplierOrderReference:o.supplier_order_reference||'',
  carrier:o.carrier||'',trackingNumber:o.tracking_number||''
}
const readyToSave=(o:Order)=>{
  const d=draftFor(o)
  if(!nextStep(o)||d.targetStatus!==nextStep(o)||!d.supplierOrderReference.trim())return false
  if(['shipped','delivered'].includes(d.targetStatus)&&(!d.carrier.trim()||!d.trackingNumber.trim()))return false
  return true
}
const priceFor=(productId:string)=>products.value.find(p=>p.id===productId)?.price||0
const quoteMargin=(q:SupplierQuote)=>{
  const result=calculateQuote(q,priceFor(q.product_id)/100)
  return result.complete?result.marginPct:null
}
const quoteShipping=(q:SupplierQuote)=>{
  if(q.shipping_per_order==null || !(Number(q.fx_to_sek)>0))return 'Not entered'
  return formatSek(Number(q.shipping_per_order)*Number(q.fx_to_sek))
}
const quoteForSupplier=(id:string)=>quotes.value.filter(q=>q.supplier_lead_id===id)
const deliveryQuoteLabel=(quote:SupplierQuote)=>{
  const min=quote.delivery_min_days, max=quote.delivery_max_days
  return min!=null && max!=null ? String(min)+'–'+String(max)+' days (unverified)' : 'Not documented'
}
const marginQuoteLabel=(quote:SupplierQuote)=>{
  const margin=quoteMargin(quote)
  return margin==null ? 'Incomplete quote' : String(margin)+'% (illustration)'
}
const load=async()=>{
  const client=useSupabaseBrowser()
  if(!client){error.value='Supabase browser access is not configured.';loading.value=false;return}
  loading.value=true;error.value='';message.value=''
  try{
    const {data:identity,error:authError}=await client.auth.getUser()
    if(authError||!identity.user){await navigateTo('/admin/login');return}
    const {data:admin,error:adminError}=await client.from('admins').select('user_id')
      .eq('user_id',identity.user.id).maybeSingle()
    if(adminError||!admin){authorized.value=false;return}
    authorized.value=true
    const [o,s,p,c,q]=await Promise.all([
      client.from('orders').select('id,order_number,created_at,payment_status,payment_provider,amount_total,fulfillment_status,supplier_status,supplier_order_reference,tracking_number,carrier,shipped_at').order('created_at',{ascending:false}).limit(100),
      client.from('supplier_leads').select('id,name,status,shipping_to_sweden').order('name'),
      client.from('products').select('id,name,price,active,stock_status,stock_quantity,supplier_id').order('sort_order'),
      client.from('supplier_catalog_items').select('id,product_id,stock_status,verified_at,title').limit(500),
      client.from('supplier_quotes').select('*').order('updated_at',{ascending:false}).limit(200)
    ])
    if(o.error||s.error||p.error||c.error||q.error)throw o.error||s.error||p.error||c.error||q.error
    orders.value=(o.data||[]) as Order[]
    suppliers.value=(s.data||[]) as Supplier[]
    products.value=(p.data||[]) as Product[]
    catalog.value=(c.data||[]) as CatalogItem[]
    quotes.value=(q.data||[]) as SupplierQuote[]
    for(const order of orders.value){
      drafts[order.id]={
        targetStatus:nextStep(order)||'',
        supplierOrderReference:order.supplier_order_reference||'',
        carrier:order.carrier||'',trackingNumber:order.tracking_number||''
      }
    }
  }catch(e:any){error.value=e?.message||'Unable to load the operations workspace.'}
  finally{loading.value=false}
}
const saveFulfillment=async(order:Order)=>{
  const d=draftFor(order)
  if(!readyToSave(order))return
  if(!window.confirm('Record '+displayStatus(d.targetStatus)+' for '+order.order_number+'? Only confirm actions actually completed.'))return
  const client=useSupabaseBrowser()
  if(!client)return
  savingId.value=order.id;error.value='';message.value=''
  try{
    const {data:{session}}=await client.auth.getSession()
    if(!session?.access_token)throw new Error('Sign in again to update fulfillment.')
    await $fetch('/api/admin/fulfillment',{method:'POST',headers:{Authorization:'Bearer '+session.access_token},
      body:{
        orderId:order.id,expectedStatus:order.fulfillment_status||'unfulfilled',
        targetStatus:d.targetStatus,
        supplierOrderReference:d.supplierOrderReference,carrier:d.carrier,trackingNumber:d.trackingNumber
      }
    })
    await load()
    message.value='Fulfillment progress recorded for '+order.order_number+'. No notification or purchase was sent.'
  }catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to record fulfillment.'}
  finally{savingId.value=''}
}
onMounted(load)
useSeoMeta({title:'Operations workspace',robots:'noindex,nofollow'})
</script>

<template>
  <main class="phase4-shell">
    <header class="phase4-topbar">
      <div class="phase4-top-brand"><NorrliLogo compact /><span>OPERATIONS · PRIVATE</span></div>
      <div class="phase4-quick-links">
        <NuxtLink to="/admin"><ArrowLeft :size="16" /> Admin dashboard</NuxtLink>
        <NuxtLink to="/admin/quotes">Supplier quotes</NuxtLink>
        <NuxtLink to="/admin/catalog">Stock lab</NuxtLink>
        <button type="button" :disabled="loading" @click="load"><RefreshCw :size="16" /> Refresh</button>
      </div>
    </header>
    <section v-if="loading" class="phase4-state" role="status">Loading private operations data…</section>
    <section v-else-if="!authorized" class="phase4-state">
      <LockKeyhole :size="35" /><h1>Administrator access required</h1>
      <p>Only approved Norrli Pets administrators can access order and supplier records.</p>
      <NuxtLink to="/admin/login">Admin sign-in</NuxtLink>
    </section>
    <template v-else>
      <section class="phase4-heading">
        <div><span class="eyebrow">NORRLI PETS · PHASE 4</span><h1>Operations command center</h1>
          <p>Order readiness, supplier evidence and shipping assumptions in one workspace.</p></div>
        <div class="phase4-prelaunch"><ShieldAlert :size="23"/><div><strong>Pre-launch mode</strong>
          <small>Live checkout disabled. Do not dispatch sandbox orders.</small></div></div>
      </section>
      <div class="phase4-kpis">
        <div><span>Paid orders awaiting supplier</span><strong>{{ waitingCount }}</strong><small>Excludes all test / unpaid orders</small></div>
        <div><span>Supplier / processing</span><strong>{{ inProgressCount }}</strong><small>Paid Mollie orders only</small></div>
        <div><span>Shipped</span><strong>{{ shippedCount }}</strong><small>Actual recorded dispatches only</small></div>
        <div><span>Blocked from fulfillment</span><strong>{{ blockedCount }}</strong><small>Test, unpaid or ineligible</small></div>
        <div><span>Stock checks needed</span><strong>{{ uncheckedStock }}</strong><small>Unverified or older than 30 days</small></div>
      </div>
      <p v-if="error" class="phase4-alert error" role="alert">{{ error }}</p>
      <p v-if="message" class="phase4-alert success" role="status">{{ message }}</p>
      <nav class="phase4-tabs" aria-label="Operations sections">
        <button type="button" :class="{active:section==='orders'}" @click="section='orders'"><ShoppingBag :size="17" /> Fulfillment queue</button>
        <button type="button" :class="{active:section==='suppliers'}" @click="section='suppliers'"><PackageSearch :size="17" /> Supplier readiness</button>
        <button type="button" :class="{active:section==='shipping'}" @click="section='shipping'"><Truck :size="17" /> Shipping & cost review</button>
      </nav>

      <section v-if="section==='orders'" class="phase4-panel">
        <div class="phase4-section-head"><div><h2>Fulfillment queue</h2>
          <p>Update only paid, non-test orders. This records internal progress; it never orders stock or emails customers.</p></div>
          <div class="phase4-filters">
            <label><Search :size="16" /><input v-model="search" type="search" placeholder="Find order number" aria-label="Find order by reference"/></label>
            <select v-model="queueFilter" aria-label="Filter fulfillment queue">
              <option value="all">All records</option><option value="actionable">Ready for next step</option>
              <option value="blocked">Not eligible</option><option value="shipped">Shipped</option>
            </select>
          </div>
        </div>
        <div v-if="!filteredOrders.length" class="phase4-empty">No orders match your filters.</div>
        <div v-else class="phase4-order-list">
          <article v-for="order in filteredOrders" :key="order.id" class="phase4-order">
            <div class="phase4-order-heading">
              <div><strong>{{ order.order_number }}</strong><small>{{ dateText(order.created_at) }} · {{ money(order.amount_total) }}</small></div>
              <div class="phase4-tags">
                <span>{{ displayStatus(order.fulfillment_status) }}</span>
                <span :class="isActionable(order)?'eligible':'blocked'">{{ isActionable(order)?'Paid Mollie':'Not eligible for dispatch' }}</span>
              </div>
            </div>
            <p v-if="!isActionable(order)" class="phase4-inline-warning">
              <ShieldAlert :size="15" /> This is a sandbox, unpaid, refunded or otherwise ineligible order. Fulfillment is locked.
            </p>
            <template v-else-if="nextStep(order)">
              <div class="phase4-order-edit">
                <label>Next stage<input :value="displayStatus(nextStep(order))" readonly /></label>
                <label>Supplier order reference<input v-model.trim="drafts[order.id].supplierOrderReference" maxlength="160" placeholder="Confirmed reference"/></label>
                <label>Carrier<input v-model.trim="drafts[order.id].carrier" maxlength="120" placeholder="Actual carrier (when known)"/></label>
                <label>Tracking<input v-model.trim="drafts[order.id].trackingNumber" maxlength="160" placeholder="Actual tracking (when known)"/></label>
              </div>
              <div class="phase4-order-bottom">
                <p>Do not advance until the supplier or carrier confirms the corresponding real-world step.</p>
                <button type="button" :disabled="!readyToSave(order)||!!savingId" @click="saveFulfillment(order)">
                  <Save :size="16" /> {{ savingId===order.id?'Saving…':'Record next stage' }}
                </button>
              </div>
            </template>
            <p v-else class="phase4-done"><CheckCircle2 :size="16"/> This fulfillment workflow is complete.</p>
          </article>
        </div>
      </section>

      <section v-else-if="section==='suppliers'" class="phase4-panel">
        <div class="phase4-section-head"><div><h2>Supplier & stock readiness</h2>
          <p>Quote confirmation means an admin recorded evidence; it does not establish a signed agreement or guaranteed availability.</p></div>
          <NuxtLink class="phase4-primary-link" to="/admin/launch">Review supplier leads <ArrowRight :size="16"/></NuxtLink>
        </div>
        <div class="phase4-readiness-stats">
          <div><strong>{{ suppliers.length }}</strong><span>Supplier leads</span></div>
          <div><strong>{{ suppliers.filter(s=>s.shipping_to_sweden===true).length }}</strong><span>Sweden shipping recorded</span></div>
          <div><strong>{{ eligibleQuotes.length }}</strong><span>Confirmed quotes with shipping evidence</span></div>
          <div><strong>{{ stockWarnings.length }}</strong><span>Product stock warnings</span></div>
        </div>
        <div class="phase4-supplier-grid">
          <article v-for="supplier in suppliers" :key="supplier.id" class="phase4-supplier">
            <div class="phase4-supplier-head"><h3>{{ supplier.name }}</h3>
              <span :class="supplier.shipping_to_sweden===true?'eligible':'blocked'">{{ supplier.shipping_to_sweden===true?'SE shipping recorded':'SE shipping unconfirmed' }}</span>
            </div>
            <p>Lead stage: {{ supplier.status }} · Quotes: {{ quoteForSupplier(supplier.id).length }}</p>
            <p>Supplier-confirmed quotations: {{ quoteForSupplier(supplier.id).filter(q=>q.status==='supplier_confirmed').length }}</p>
            <NuxtLink to="/admin/quotes">Inspect quotations <ArrowRight :size="15" /></NuxtLink>
          </article>
          <div v-if="!suppliers.length" class="phase4-empty">No supplier leads recorded. Add them in the launch workspace.</div>
        </div>
        <div class="phase4-warnings" v-if="stockWarnings.length">
          <h3><ShieldAlert :size="18" /> Product stock requires review</h3>
          <p v-for="product in stockWarnings.slice(0,15)" :key="product.id">{{ product.name }} — {{ product.stock_status || 'unknown' }} ({{ product.stock_quantity ?? 'quantity unknown' }})</p>
          <NuxtLink to="/admin/catalog">Open stock verification lab <ArrowRight :size="16" /></NuxtLink>
        </div>
      </section>

      <section v-else class="phase4-panel">
        <div class="phase4-section-head"><div><h2>Shipping and contribution review</h2>
          <p>Existing supplier quotations only. Costs below are modeled estimates, not approved checkout shipping prices.</p></div>
          <NuxtLink class="phase4-primary-link" to="/admin/quotes"><BarChart3 :size="16" /> Detailed profitability planner</NuxtLink>
        </div>
        <div class="phase4-shipping-note"><Clock3 :size="22" /><div><strong>Customer delivery rates remain unconfirmed</strong>
          <p>Shipping commitments, VAT treatment, contracts and carrier SLAs require independent verification before checkout can open.</p></div></div>
        <div class="phase4-table-wrap">
          <table class="phase4-table">
            <thead><tr><th>Quotation</th><th>Supplier</th><th>Evidence</th><th>Supplier shipping estimate</th><th>Delivery estimate</th><th>Modeled contribution margin</th></tr></thead>
            <tbody>
              <tr v-for="quote in quotes" :key="quote.id">
                <td><strong>{{ quote.label }}</strong><small>{{ quote.currency }} · {{ quote.supplier_sku||'SKU missing' }}</small></td>
                <td>{{ suppliers.find(s=>s.id===quote.supplier_lead_id)?.name||'Unknown' }}</td>
                <td>{{ quote.status==='supplier_confirmed'?'Confirmed (admin entry)':quote.status }}</td>
                <td>{{ quoteShipping(quote) }}<small>SEK estimate from recorded FX</small></td>
                <td>{{ deliveryQuoteLabel(quote) }}</td>
                <td>{{ marginQuoteLabel(quote) }}</td>
              </tr>
              <tr v-if="!quotes.length"><td colspan="6">No saved quotations. Create a sourcing scenario first.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="phase4-action-links">
          <NuxtLink to="/admin/quotes"><FileSpreadsheet :size="17" /> Edit cost models</NuxtLink>
          <NuxtLink to="/admin/decisions"><ClipboardCheck :size="17" /> Product decision board</NuxtLink>
          <NuxtLink to="/admin/catalog"><PackageCheck :size="17" /> Inventory validation</NuxtLink>
        </div>
      </section>
    </template>
  </main>
</template>

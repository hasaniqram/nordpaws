<script setup lang="ts">
import {
  ArrowLeft, RefreshCw, PackageSearch, Truck, Mail, ShieldAlert, ShieldCheck,
  FileSpreadsheet, Download, Upload, Search, LockKeyhole, ArrowRight, ClipboardList,
  CheckCircle2, AlertTriangle, Copy
} from 'lucide-vue-next'
import {parseCatalogCsv,catalogTemplate,type CatalogCsvRow} from '~/utils/supplierCatalogCsv'
import {calculateQuote,formatSek,type SupplierQuote} from '~/utils/profitability'
import {compareSupplierFeed,stockSyncAlerts,shippingEvidence,localEmailPreview} from '~/utils/integrationLab.mjs'

type Supplier={id:string;name:string;status:string;shipping_to_sweden:boolean|null}
type Product={id:string;name:string;slug:string;price:number;supplier_sku:string|null}
type Stock={id:string;supplier_lead_id:string;product_id:string|null;supplier_sku:string;title:string;
 stock_status:string;stock_quantity:number|null;unit_cost:number|null;currency:string;verified_at:string|null;
 lead_time_days:number|null;source_url:string|null}
type CompareRow={sku:string;title:string;action:string;changedFields:string[];requiresVerification:boolean;warnings:string[];
 productId:string|null;suggestedProduct:{id:string;name:string}|null;prior:Record<string,unknown>|null;
 proposed:Record<string,unknown>}
type CompareResult={rows:CompareRow[];summary:{total:number;new:number;changed:number;unchanged:number;needsVerification:number;warnings:number};writeEnabled:false}
type AlertRow={id:string;sku:string;title:string;verifiedDaysAgo:number|null;alerts:string[]}
type Evidence={estimateSEK:number|null;deliveryRange:string|null;reviewReady:boolean;reasons:string[];customerShippingApproved:false}
type DemoEmail={to:string;subject:string;body:string;sent:false}
type Tab='feed'|'stock'|'shipping'|'email'
const tab=ref<Tab>('feed')
const loading=ref(true),authorized=ref(false),error=ref(''),message=ref('')
const suppliers=ref<Supplier[]>([]),products=ref<Product[]>([]),catalog=ref<Stock[]>([]),quotes=ref<SupplierQuote[]>([])
const selectedSupplier=ref(''),supplierSearch=ref('')
const importRows=ref<CatalogCsvRow[]>([]),fileName=ref(''),csvWarnings=ref<string[]>([]),fileError=ref('')
const selectedQuote=ref(''),emailKind=ref('confirmation')
const selectedQuoteRow=computed(()=>quotes.value.find(q=>q.id===selectedQuote.value))
const selectedProduct=computed(()=>products.value.find(p=>p.id===selectedQuoteRow.value?.product_id))
const quoteSupplier=computed(()=>suppliers.value.find(s=>s.id===selectedQuoteRow.value?.supplier_lead_id))
const shipping=computed<Evidence|null>(()=>selectedQuoteRow.value
 ? shippingEvidence(selectedQuoteRow.value,quoteSupplier.value,selectedProduct.value?.price??0)
 : null)
const margin=computed(()=>selectedQuoteRow.value&&selectedProduct.value
 ? calculateQuote(selectedQuoteRow.value,selectedProduct.value.price/100)
 : null)
const alerts=computed<AlertRow[]>(()=>stockSyncAlerts(catalog.value))
const filteredAlerts=computed(()=>alerts.value.filter(a=>{
 const q=supplierSearch.value.toLowerCase().trim()
 return !q||a.title.toLowerCase().includes(q)||a.sku.toLowerCase().includes(q)
}))
const diff=computed<CompareResult|null>(()=>{
 if(!selectedSupplier.value||!importRows.value.length)return null
 try{return compareSupplierFeed(importRows.value,catalog.value,selectedSupplier.value,products.value)}
 catch(e:any){return null}
})
const emailPreview=computed<DemoEmail>(()=>localEmailPreview(emailKind.value))
const load=async()=>{
 const client=useSupabaseBrowser()
 if(!client){error.value='Supabase client not configured.';loading.value=false;return}
 loading.value=true;error.value='';message.value=''
 try{
  const {data:identity,error:authError}=await client.auth.getUser()
  if(authError||!identity.user){await navigateTo('/admin/login');return}
  const {data:role,error:roleError}=await client.from('admins').select('user_id')
    .eq('user_id',identity.user.id).maybeSingle()
  if(roleError||!role){authorized.value=false;return}
  authorized.value=true
  const [s,p,c,q]=await Promise.all([
   client.from('supplier_leads').select('id,name,status,shipping_to_sweden').order('name').limit(200),
   client.from('products').select('id,name,slug,price,supplier_sku').order('name').limit(300),
   client.from('supplier_catalog_items')
     .select('id,supplier_lead_id,product_id,supplier_sku,title,stock_status,stock_quantity,unit_cost,currency,verified_at,lead_time_days,source_url')
     .order('updated_at',{ascending:false}).limit(1000),
   client.from('supplier_quotes').select('*').order('updated_at',{ascending:false}).limit(300)
  ])
  if(s.error||p.error||c.error||q.error)throw s.error||p.error||c.error||q.error
  suppliers.value=(s.data||[]) as Supplier[]
  products.value=(p.data||[]) as Product[]
  catalog.value=(c.data||[]) as Stock[]
  quotes.value=(q.data||[]) as SupplierQuote[]
  if(!suppliers.value.find(x=>x.id===selectedSupplier.value))selectedSupplier.value=suppliers.value[0]?.id||''
  if(!quotes.value.find(x=>x.id===selectedQuote.value))selectedQuote.value=quotes.value[0]?.id||''
 }catch(e:any){error.value=e?.message||'Unable to load integrations workspace.'}
 finally{loading.value=false}
}
const onCsvFile=async(event:Event)=>{
 importRows.value=[];csvWarnings.value=[];fileError.value='';fileName.value=''
 const field=event.target as HTMLInputElement
 const file=field.files?.[0]
 if(!file)return
 fileName.value=file.name
 try{
  if(file.size>250000)throw new Error('CSV file must be smaller than 250 KB.')
  const result=parseCatalogCsv(await file.text())
  importRows.value=result.rows;csvWarnings.value=result.warnings
  // Important: no API requests, DB inserts, upserts or writes occur here.
  if(!selectedSupplier.value)throw new Error('Select a supplier before comparing the CSV.')
 }catch(e:any){fileError.value=e?.message||'Unable to parse CSV.';importRows.value=[]}
 field.value=''
}
const downloadCsvTemplate=()=>{
 if(!import.meta.client)return
 const blob=new Blob(['\uFEFF'+catalogTemplate],{type:'text/csv;charset=utf-8'})
 const url=URL.createObjectURL(blob)
 const anchor=document.createElement('a');anchor.href=url;anchor.download='norrli-supplier-feed-template.csv'
 anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}
const exportReview=()=>{
 if(!import.meta.client||!diff.value)return
 const safe={
  supplier:suppliers.value.find(s=>s.id===selectedSupplier.value)?.name||'unknown',
  filename:fileName.value,createdAt:new Date().toISOString(),reviewOnly:true,
  warning:'Review report only. No inventory or storefront records were updated.',
  summary:diff.value.summary,rows:diff.value.rows
 }
 const url=URL.createObjectURL(new Blob([JSON.stringify(safe,null,2)],{type:'application/json'}))
 const anchor=document.createElement('a');anchor.href=url;anchor.download='norrli-supplier-review.json'
 anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}
const copyEmail=async()=>{
 try{await navigator.clipboard.writeText(emailPreview.value.subject+'\n\n'+emailPreview.value.body)
  message.value='Copied DEMO preview to clipboard. No email was sent.'
 }catch{message.value='Clipboard not available. You can select the preview text instead.'}
}
const priceFor=(q:SupplierQuote)=>formatSek((products.value.find(p=>p.id===q.product_id)?.price||0)/100)
const namedSupplier=(q:SupplierQuote)=>suppliers.value.find(s=>s.id===q.supplier_lead_id)?.name||'Unknown supplier'
onMounted(load)
useSeoMeta({title:'Supplier integration lab',robots:'noindex,nofollow'})
</script>

<template>
  <main class="phase4-shell phase6-shell">
    <header class="phase4-topbar">
      <div class="phase4-top-brand"><NorrliLogo compact/><span>SUPPLIER INTEGRATIONS · PRIVATE</span></div>
      <div class="phase4-quick-links">
        <NuxtLink to="/admin/operations"><ArrowLeft :size="16"/> Operations</NuxtLink>
        <NuxtLink to="/admin/catalog">Stock lab</NuxtLink>
        <NuxtLink to="/admin/quotes">Supplier quotes</NuxtLink>
        <button type="button" :disabled="loading" @click="load"><RefreshCw :size="16"/> Refresh</button>
      </div>
    </header>
    <section v-if="loading" class="phase4-state" role="status">Loading private supplier review data…</section>
    <section v-else-if="!authorized" class="phase4-state">
      <LockKeyhole :size="35"/><h1>Admin sign-in required</h1>
      <p>Supplier pricing and stock reports are private research data.</p>
      <NuxtLink to="/admin/login">Admin sign-in</NuxtLink>
    </section>
    <template v-else>
      <section class="phase4-heading">
        <div><span class="eyebrow"><ShieldCheck :size="16"/> PHASE 6 · REVIEW FIRST</span>
          <h1>Supplier integration center</h1>
          <p>Evaluate supplier feeds, stock risk, shipping assumptions and local email templates — before taking action.</p></div>
        <div class="phase4-prelaunch"><ShieldAlert :size="22"/><div><strong>Preview-only operations</strong>
          <small>No supplier orders, inventory writes, customer emails or checkout changes.</small></div></div>
      </section>
      <p v-if="error" class="phase4-alert error" role="alert">{{ error }}</p>
      <p v-if="message" class="phase4-alert success" role="status">{{ message }}</p>
      <div class="phase4-kpis phase6-kpis">
        <div><span>Supplier leads</span><strong>{{ suppliers.length }}</strong><small>Existing research records</small></div>
        <div><span>Supplier SKUs</span><strong>{{ catalog.length }}</strong><small>Private catalog only</small></div>
        <div><span>Stock review alerts</span><strong>{{ alerts.length }}</strong><small>Missing, stale or unmapped data</small></div>
        <div><span>Saved quotations</span><strong>{{ quotes.length }}</strong><small>Planning calculations only</small></div>
      </div>
      <nav class="phase4-tabs" aria-label="Integration center sections">
        <button type="button" :class="{active:tab==='feed'}" @click="tab='feed'"><Upload :size="16"/> Feed preview</button>
        <button type="button" :class="{active:tab==='stock'}" @click="tab='stock'"><PackageSearch :size="16"/> Stock review</button>
        <button type="button" :class="{active:tab==='shipping'}" @click="tab='shipping'"><Truck :size="16"/> Shipping model</button>
        <button type="button" :class="{active:tab==='email'}" @click="tab='email'"><Mail :size="16"/> Email sandbox</button>
      </nav>

      <section v-if="tab==='feed'" class="phase4-panel">
        <div class="phase4-section-head"><div><h2>Supplier feed comparison</h2>
          <p>Upload a supplier CSV locally to see which SKUs would be new or changed. All matching stays in your browser.</p></div>
          <button type="button" class="phase6-action" @click="downloadCsvTemplate"><Download :size="16"/> CSV template</button>
        </div>
        <div class="phase6-controls">
          <label>Supplier to compare
            <select v-model="selectedSupplier"><option disabled value="">Select supplier</option>
              <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">{{ supplier.name }}</option>
            </select>
          </label>
          <label>CSV source file (max 100 products / 250 KB)
            <input type="file" accept=".csv,text/csv,text/plain" @change="onCsvFile"/>
          </label>
        </div>
        <p class="phase6-info"><ShieldCheck :size="18"/> CSV review does not change catalog records or product stock. Manual review and verification are required for any later update.</p>
        <p v-if="fileError" class="phase4-alert error" role="alert">{{ fileError }}</p>
        <p v-for="warning in csvWarnings" :key="warning" class="phase6-note">{{ warning }}</p>
        <template v-if="diff">
          <div class="phase6-summary">
            <div><strong>{{ diff.summary.total }}</strong><span>Reviewed rows</span></div>
            <div><strong>{{ diff.summary.new }}</strong><span>New SKU proposals</span></div>
            <div><strong>{{ diff.summary.changed }}</strong><span>Change proposals</span></div>
            <div><strong>{{ diff.summary.needsVerification }}</strong><span>Verification required</span></div>
          </div>
          <div class="phase6-report-head"><strong>{{ fileName }} — local comparison</strong>
            <button type="button" class="phase6-action" @click="exportReview"><Download :size="15"/> Export JSON review</button>
          </div>
          <div class="phase4-table-wrap"><table class="phase4-table phase6-table">
            <thead><tr><th>Supplier SKU</th><th>Change</th><th>Existing mapping</th><th>Proposed stock</th><th>Review notes</th></tr></thead>
            <tbody><tr v-for="row in diff.rows" :key="row.sku">
              <td><strong>{{ row.sku }}</strong><small>{{ row.title }}</small></td>
              <td>{{ row.action==='review_new'?'New proposal':row.action==='review_change'?'Changes to review':'No changes' }}
                <small v-if="row.changedFields.length">Fields: {{ row.changedFields.join(', ') }}</small>
              </td>
              <td>{{ row.productId||row.suggestedProduct?.name||'Unmapped' }}<small v-if="row.suggestedProduct">Suggestion only — not linked</small></td>
              <td>{{ row.proposed.stock_status }} · {{ row.proposed.stock_quantity??'unknown' }}
                <small v-if="row.requiresVerification">Requires new verification</small></td>
              <td><p v-for="warning in row.warnings" :key="warning" class="phase6-row-warning">{{ warning }}</p>
                <span v-if="!row.warnings.length">No additional flags</span></td>
            </tr></tbody>
          </table></div>
          <div class="phase6-footer"><span><ShieldAlert :size="16"/> No upload, import or sync has been performed.</span>
            <NuxtLink to="/admin/catalog">Open existing manual stock lab <ArrowRight :size="16"/></NuxtLink>
          </div>
        </template>
        <div v-else class="phase4-empty">Select a supplier and CSV file to preview changes. No changes will be applied.</div>
      </section>

      <section v-else-if="tab==='stock'" class="phase4-panel">
        <div class="phase4-section-head"><div><h2>Inventory synchronization preparation</h2>
          <p>Review supplier stock evidence before designing an automated import. This view does not run scheduled syncs.</p></div>
          <NuxtLink to="/admin/catalog" class="phase4-primary-link">Open stock lab <ArrowRight :size="16"/></NuxtLink></div>
        <div class="phase6-controls"><label>Search alerts
          <div class="phase6-search"><Search :size="16"/><input v-model="supplierSearch" type="search" placeholder="Supplier SKU or product" /></div>
        </label></div>
        <div v-if="!filteredAlerts.length" class="phase4-empty">No stock alerts match this search.</div>
        <div v-else class="phase6-alert-list">
          <article v-for="alert in filteredAlerts" :key="alert.id">
            <div><strong>{{ alert.title }}</strong><small>{{ alert.sku }} · {{ alert.verifiedDaysAgo==null?'Never verified':alert.verifiedDaysAgo+' days since verification' }}</small></div>
            <ul><li v-for="flag in alert.alerts" :key="flag">{{ flag }}</li></ul>
          </article>
        </div>
        <p class="phase6-info"><ShieldAlert :size="17"/> Automated supplier polling, stock updates and storefront publication are not enabled.</p>
      </section>

      <section v-else-if="tab==='shipping'" class="phase4-panel">
        <div class="phase4-section-head"><div><h2>Shipping and contribution scenarios</h2>
          <p>Model actual saved supplier quotations. Estimates do not approve delivery prices or guarantee shipping times.</p></div>
          <NuxtLink to="/admin/quotes" class="phase4-primary-link">Edit profitability planner <ArrowRight :size="16"/></NuxtLink>
        </div>
        <div class="phase6-controls"><label>Saved quotation
          <select v-model="selectedQuote"><option disabled value="">Choose quotation</option>
            <option v-for="q in quotes" :key="q.id" :value="q.id">{{ q.label }} — {{ namedSupplier(q) }}</option>
          </select></label>
        </div>
        <template v-if="selectedQuoteRow&&shipping">
          <div class="phase6-summary">
            <div><strong>{{ priceFor(selectedQuoteRow) }}</strong><span>Catalog price, incl. VAT</span></div>
            <div><strong>{{ shipping.estimateSEK==null?'Not entered':formatSek(shipping.estimateSEK) }}</strong><span>Supplier shipping per order</span></div>
            <div><strong>{{ margin?.complete?formatSek(margin.profit):'Incomplete' }}</strong><span>Illustrative contribution</span></div>
            <div><strong>{{ margin?.complete&&margin.marginPct!=null?margin.marginPct+'%':'Unknown' }}</strong><span>Modeled contribution margin</span></div>
          </div>
          <div class="phase6-shipping-card"><h3>{{ selectedQuoteRow.label }} — {{ namedSupplier(selectedQuoteRow) }}</h3>
            <p>Supplier currency: {{ selectedQuoteRow.currency }} · Assumed FX to SEK: {{ selectedQuoteRow.fx_to_sek }}</p>
            <p>Supplier delivery range: {{ shipping.deliveryRange||'Not recorded' }}</p>
            <p>Customer shipping rate: <strong>Not approved — keep checkout disabled.</strong></p>
            <h4>{{ shipping.reviewReady?'Evidence fields complete; requires human verification':'Missing evidence' }}</h4>
            <ul v-if="shipping.reasons.length"><li v-for="reason in shipping.reasons" :key="reason">{{ reason }}</li></ul>
            <p v-else>Internal inputs are complete; source documents, taxes and delivery terms still require independent review.</p>
            <p v-if="margin&&!margin.complete">Margin calculation blocked: {{ margin.missing.join(', ') }}</p>
          </div>
        </template>
        <div v-else class="phase4-empty">Select a saved quotation to review the planning assumptions.</div>
      </section>

      <section v-else class="phase4-panel">
        <div class="phase4-section-head"><div><h2>Customer email sandbox</h2>
          <p>Preview branded transactional email copy using fictitious data. These previews never call Brevo or another sending service.</p></div>
          <span class="phase6-demo"><ShieldCheck :size="16"/> NEVER SENT</span>
        </div>
        <div class="phase6-controls"><label>Message template
          <select v-model="emailKind"><option value="confirmation">Order confirmation</option>
            <option value="dispatch">Dispatch update</option><option value="delivery">Delivery status</option>
          </select></label>
        </div>
        <div class="phase6-email">
          <div><strong>To</strong><span>{{ emailPreview.to }} (fictional, not deliverable)</span></div>
          <div><strong>Subject</strong><span>{{ emailPreview.subject }}</span></div>
          <pre>{{ emailPreview.body }}</pre>
          <button type="button" class="phase6-action" @click="copyEmail"><Copy :size="16"/> Copy demo text</button>
          <p><ShieldAlert :size="17"/> No recipients, live order data, API credentials or email-send requests are used here.</p>
        </div>
      </section>
    </template>
  </main>
</template>

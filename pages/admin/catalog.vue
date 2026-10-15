<script setup lang="ts">
import {
  ArrowLeft, RefreshCw, PackageSearch, Truck, Search, ClipboardCheck,
  Upload, Download, Plus, Save, LockKeyhole, AlertTriangle, CheckCircle2,
  Clock3, History, X, FileSpreadsheet, ShieldCheck, Link2
} from 'lucide-vue-next'
import { catalogTemplate, parseCatalogCsv, type CatalogCsvRow } from '~/utils/supplierCatalogCsv'

type StockStatus='unknown'|'in_stock'|'low_stock'|'out_of_stock'|'backorder'|'discontinued'
type Currency='SEK'|'EUR'|'USD'|'GBP'|'DKK'|'NOK'
type Item={
  id:string; supplier_lead_id:string;product_id:string|null; supplier_sku:string;title:string
  stock_status:StockStatus;stock_quantity:number|null;unit_cost:number|null
  currency:Currency;lead_time_days:number|null;source_url:string|null
  notes:string;source_type:'manual'|'csv';last_imported_at:string|null
  verified_at:string|null;updated_at:string;created_at:string
}
type Check={
  id:string;checked_at:string;stock_status:StockStatus;stock_quantity:number|null
  unit_cost:number|null;currency:Currency;notes:string
}
type Supplier={id:string;name:string;status:string}
type Product={id:string;name:string;slug:string}
const statusNames:Record<StockStatus,string>={
  unknown:'Unknown',in_stock:'In stock',low_stock:'Low stock',
  out_of_stock:'Out of stock',backorder:'Backorder',discontinued:'Discontinued'
}
const currencies:Currency[]=['SEK','EUR','USD','GBP','DKK','NOK']
const loading=ref(true),authorized=ref(false),error=ref(''),feedback=ref(''),saving=ref(false)
const suppliers=ref<Supplier[]>([]),products=ref<Product[]>([]),items=ref<Item[]>([])
const filterSupplier=ref('all'),filterStock=ref('all'),filterProduct=ref('all'),search=ref('')
const onlyUnchecked=ref(false),selectedPanel=ref<'records'|'import'>('records')
const editing=ref<Item|null>(null),original=ref<Item|null>(null),showNew=ref(false)
const stockNote=ref(''),history=ref<Check[]>([]),historyLoading=ref(false),historyItemId=ref('')
const importSupplier=ref(''),importRows=ref<CatalogCsvRow[]>([]),importWarnings=ref<string[]>([])
const importError=ref(''),importFilename=ref('')
const newItem=reactive({
 supplier_lead_id:'',product_id:'',supplier_sku:'',title:'',stock_status:'unknown' as StockStatus,
 stock_quantity:null as number|null,unit_cost:null as number|null,
 currency:'SEK' as Currency,lead_time_days:null as number|null,
 source_url:'',notes:''
})
const nameForSupplier=(id:string)=>suppliers.value.find(s=>s.id===id)?.name||'Unknown supplier'
const nameForProduct=(id:string|null)=>products.value.find(p=>p.id===id)?.name||'Not linked to a product'
const formatDate=(value:string|null)=>{
  if(!value)return 'Not verified'
  const date=new Date(value)
  return Number.isNaN(date.getTime())?'Unknown':new Intl.DateTimeFormat('sv-SE',{dateStyle:'medium'}).format(date)
}
const daysSince=(s:string|null)=>{
  if(!s)return null
  const n=Math.floor((Date.now()-new Date(s).getTime())/86400000)
  return Number.isFinite(n)?Math.max(0,n):null
}
const isStale=(item:Item)=>daysSince(item.verified_at)===null || (daysSince(item.verified_at)??0)>30
const filtered=computed(()=>items.value.filter(item=>{
  if(filterSupplier.value!=='all'&&item.supplier_lead_id!==filterSupplier.value)return false
  if(filterStock.value!=='all'&&item.stock_status!==filterStock.value)return false
  if(filterProduct.value==='unmapped'&&item.product_id!==null)return false
  if(filterProduct.value!=='all'&&filterProduct.value!=='unmapped'&&item.product_id!==filterProduct.value)return false
  if(onlyUnchecked.value&&!isStale(item))return false
  return !search.value.trim()||
    `${item.title} ${item.supplier_sku} ${nameForSupplier(item.supplier_lead_id)}`.toLowerCase().includes(search.value.trim().toLowerCase())
}).sort((a,b)=>{
  if(isStale(a)!==isStale(b))return isStale(a)?-1:1
  return a.title.localeCompare(b.title)
}))
const stats=computed(()=>({
  total:items.value.length,
  mapped:items.value.filter(item=>!!item.product_id).length,
  current:items.value.filter(item=>!isStale(item)).length,
  needsCheck:items.value.filter(isStale).length,
  out:items.value.filter(item=>['out_of_stock','discontinued'].includes(item.stock_status)).length
}))
const emptyNumeric=(value:unknown)=>value===null||value===undefined||value===''
const optionalNumber=(value:unknown)=>emptyNumeric(value)?null:Number(value)
const validated=(x:Item)=>{
  if(!x.supplier_lead_id||!x.supplier_sku.trim()||!x.title.trim())return 'Supplier, SKU and title are required.'
  if(x.supplier_sku.trim().length>120||x.title.trim().length>250)return 'SKU or product title exceeds the size limit.'
  if(!emptyNumeric(x.unit_cost)&&(!Number.isFinite(Number(x.unit_cost))||Number(x.unit_cost)<0||Number(x.unit_cost)>9999999999))return 'Unit cost must be nonnegative.'
  if(!emptyNumeric(x.stock_quantity)&&(!Number.isInteger(Number(x.stock_quantity))||Number(x.stock_quantity)<0||Number(x.stock_quantity)>10000000))return 'Stock quantity must be an integer within the allowed range.'
  if(!emptyNumeric(x.lead_time_days)&&(!Number.isInteger(Number(x.lead_time_days))||Number(x.lead_time_days)<0||Number(x.lead_time_days)>365))return 'Lead time must be 0–365 days.'
  if(x.source_url?.trim()){
    try{const url=new URL(x.source_url);if(!['https:','http:'].includes(url.protocol))return 'Use a valid HTTP(S) source URL.'}
    catch{return 'Use a valid HTTP(S) source URL.'}
  }
  return ''
}
const load=async()=>{
  const client=useSupabaseBrowser()
  if(!client)return
  loading.value=true;error.value=''
  try{
    const {data:user,error:authError}=await client.auth.getUser()
    if(authError||!user.user){await navigateTo('/admin/login');return}
    const {data:admin,error:adminError}=await client.from('admins').select('user_id')
      .eq('user_id',user.user.id).maybeSingle()
    if(adminError||!admin){authorized.value=false;return}
    authorized.value=true
    const [s,p,c]=await Promise.all([
      client.from('supplier_leads').select('id,name,status').order('name'),
      client.from('products').select('id,name,slug').order('name'),
      client.from('supplier_catalog_items').select('*').order('updated_at',{ascending:false}).limit(1000)
    ])
    if(s.error||p.error||c.error)throw s.error||p.error||c.error
    suppliers.value=(s.data||[]) as Supplier[]
    products.value=(p.data||[]) as Product[]
    items.value=(c.data||[]) as Item[]
    if(!importSupplier.value)importSupplier.value=suppliers.value[0]?.id||''
    if(!newItem.supplier_lead_id)newItem.supplier_lead_id=suppliers.value[0]?.id||''
  }catch(e:any){error.value=e?.message||'Unable to load catalog workspace.'}
  finally{loading.value=false}
}
const openEdit=(item:Item)=>{editing.value={...item};original.value={...item};stockNote.value='';feedback.value=''}
const closeEdit=()=>{editing.value=null;original.value=null;stockNote.value='';historyItemId.value=''}
const saveEdit=async()=>{
  const client=useSupabaseBrowser(),e=editing.value,o=original.value
  if(!client||!e||!o||!authorized.value)return
  const err=validated(e);if(err){feedback.value=err;return}
  saving.value=true;feedback.value=''
  try{
    const changed=optionalNumber(e.unit_cost)!==optionalNumber(o.unit_cost)||
      e.stock_status!==o.stock_status||optionalNumber(e.stock_quantity)!==optionalNumber(o.stock_quantity)||
      e.currency!==o.currency
    const payload={
      product_id:e.product_id||null,supplier_sku:e.supplier_sku.trim(),title:e.title.trim(),
      stock_status:e.stock_status,stock_quantity:optionalNumber(e.stock_quantity),
      unit_cost:optionalNumber(e.unit_cost),
      currency:e.currency,lead_time_days:optionalNumber(e.lead_time_days),
      source_url:e.source_url?.trim()||null,notes:e.notes.trim(),
      source_type:'manual',verified_at:changed?null:e.verified_at,updated_at:new Date().toISOString()
    }
    const {error:dbError}=await client.from('supplier_catalog_items').update(payload)
      .eq('id',e.id)
    if(dbError)throw dbError
    feedback.value='SKU saved. Stock/cost changes require a new verification.'
    closeEdit();await load()
  }catch(ex:any){feedback.value=ex?.message||'Unable to save item.'}
  finally{saving.value=false}
}
const addManual=async()=>{
  const client=useSupabaseBrowser()
  if(!client||!authorized.value)return
  const draft:Item={
    ...newItem,id:'',product_id:newItem.product_id||null,
    source_url:newItem.source_url||null,source_type:'manual',last_imported_at:null,
    verified_at:null,updated_at:'',created_at:''
  }
  const err=validated(draft);if(err){feedback.value=err;return}
  saving.value=true;feedback.value=''
  try{
    const {error:dbError}=await client.from('supplier_catalog_items').insert({
      supplier_lead_id:newItem.supplier_lead_id,product_id:newItem.product_id||null,
      supplier_sku:newItem.supplier_sku.trim(),title:newItem.title.trim(),
      stock_status:newItem.stock_status,stock_quantity:optionalNumber(newItem.stock_quantity),
      unit_cost:optionalNumber(newItem.unit_cost),currency:newItem.currency,
      lead_time_days:optionalNumber(newItem.lead_time_days),source_url:newItem.source_url.trim()||null,
      notes:newItem.notes.trim(),source_type:'manual'
    })
    if(dbError)throw dbError
    Object.assign(newItem,{
      supplier_lead_id:newItem.supplier_lead_id,product_id:'',supplier_sku:'',title:'',
      stock_status:'unknown',stock_quantity:null,unit_cost:null,currency:'SEK',
      lead_time_days:null,source_url:'',notes:''
    })
    showNew.value=false
    await load();feedback.value='Supplier SKU added to the private research catalog.'
  }catch(e:any){feedback.value=e?.message||'Unable to add SKU.'}
  finally{saving.value=false}
}
const recordCheck=async(item:Item)=>{
  const client=useSupabaseBrowser()
  if(!client||!authorized.value)return
  if(stockNote.value.length>2000){feedback.value='Stock check note exceeds 2,000 characters.';return}
  saving.value=true;feedback.value=''
  try{
    const {error:dbError}=await client.rpc('confirm_supplier_stock_check',{
      p_item_id:item.id,p_status:item.stock_status,
      p_quantity:item.stock_quantity,p_unit_cost:item.unit_cost,p_note:stockNote.value.trim()
    })
    if(dbError)throw dbError
    await load()
    feedback.value='Stock check saved with a timestamp and immutable history.'
    closeEdit()
  }catch(e:any){feedback.value=e?.message||'Stock verification failed.'}
  finally{saving.value=false}
}
const fetchHistory=async(id:string)=>{
  const client=useSupabaseBrowser()
  if(!client)return
  if(historyItemId.value===id){historyItemId.value='';return}
  historyItemId.value=id;historyLoading.value=true;history.value=[]
  const {data,error:dbError}=await client.from('supplier_stock_checks')
    .select('id,checked_at,stock_status,stock_quantity,unit_cost,currency,notes')
    .eq('catalog_item_id',id).order('checked_at',{ascending:false}).limit(12)
  if(dbError)feedback.value=dbError.message
  else history.value=(data||[]) as Check[]
  historyLoading.value=false
}
const onFile=async(event:Event)=>{
  importRows.value=[];importWarnings.value=[];importError.value='';importFilename.value=''
  const el=event.target as HTMLInputElement, file=el.files?.[0]
  if(!file)return
  importFilename.value=file.name
  if(file.size>250000){importError.value='File exceeds 250 KB. Split it into smaller batches.';el.value='';return}
  try{
    const text=await file.text(), result=parseCatalogCsv(text)
    importRows.value=result.rows;importWarnings.value=result.warnings
  }catch(e:any){importError.value=e?.message||'Unable to read CSV.'}
  el.value=''
}
const downloadTemplate=()=>{
  const url=URL.createObjectURL(new Blob(['\uFEFF'+catalogTemplate],{type:'text/csv;charset=utf-8'}))
  const a=document.createElement('a');a.href=url;a.download='norrli-supplier-catalog-template.csv';a.click()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}
const importCatalog=async()=>{
  const client=useSupabaseBrowser()
  if(!client||!authorized.value||!importSupplier.value||!importRows.value.length)return
  if(!window.confirm(`Import ${importRows.value.length} SKU rows? Existing matching SKUs for this supplier will be updated. Product mappings and notes will be preserved; changed stock or prices lose prior verification.`))return
  saving.value=true;feedback.value='';importError.value=''
  try{
    const current=new Map(items.value.filter(i=>i.supplier_lead_id===importSupplier.value)
      .map(i=>[i.supplier_sku,i]))
    const now=new Date().toISOString()
    const rows=importRows.value.map(row=>{
      const previous=current.get(row.sku)
      const status=row.stock_status??previous?.stock_status??'unknown'
      const quantity=row.stock_quantity??previous?.stock_quantity??null
      const unitCost=row.unit_cost??previous?.unit_cost??null
      const currency=row.currency??previous?.currency??'SEK'
      const changed=Boolean(previous) && (
        status!==previous!.stock_status||
        quantity!==previous!.stock_quantity||
        unitCost!==previous!.unit_cost||currency!==previous!.currency
      )
      return {
        supplier_lead_id:importSupplier.value,supplier_sku:row.sku,title:row.title,
        product_id:previous?.product_id??null,stock_status:status,stock_quantity:quantity,
        unit_cost:unitCost,currency,lead_time_days:row.lead_time_days??previous?.lead_time_days??null,
        source_url:row.source_url??previous?.source_url??null,
        notes:previous?.notes??'',source_type:'csv',
        last_imported_at:now,verified_at:changed?null:previous?.verified_at??null,
        updated_at:now
      }
    })
    const {error:dbError}=await client.from('supplier_catalog_items').upsert(rows,{
      onConflict:'supplier_lead_id,supplier_sku'
    })
    if(dbError)throw dbError
    importRows.value=[];importWarnings.value=[];importFilename.value=''
    await load()
    feedback.value=`Imported ${rows.length} supplier SKU records. Please verify stock before treating it as confirmed.`
    selectedPanel.value='records'
  }catch(e:any){importError.value=e?.message||'Catalog import failed.'}
  finally{saving.value=false}
}
onMounted(load)
useSeoMeta({
  title:'Supplier catalog & stock research',
  description:'Private supplier SKU and stock research area',
  robots:'noindex,nofollow'
})
</script>
<template>
  <main class="admin-shell catalog-shell">
    <header class="admin-topbar">
      <NorrliLogo compact />
      <div class="admin-top-actions">
        <NuxtLink to="/admin/decisions" class="btn btn-secondary compact"><ArrowLeft :size="15"/>Decision Board</NuxtLink>
        <button class="icon-btn" title="Refresh research catalog" aria-label="Refresh research catalog" @click="load"><RefreshCw :size="18"/></button>
      </div>
    </header>
    <section v-if="loading" class="admin-center">Loading private supplier research catalog…</section>
    <section v-else-if="!authorized" class="admin-center admin-denied">
      <LockKeyhole :size="34"/><h1>Admin access required</h1>
      <NuxtLink to="/admin/login" class="btn btn-primary">Admin sign in</NuxtLink>
    </section>
    <template v-else>
      <div class="catalog-heading">
        <div><span class="eyebrow"><PackageSearch :size="16"/> Private sourcing workspace</span>
          <h1>Catalog & Stock Lab</h1>
          <p>Organize supplier SKUs, import CSV catalogs and track research snapshots without changing the public product catalog.</p>
        </div>
        <div class="catalog-top-actions">
          <button class="btn btn-secondary compact" @click="selectedPanel=selectedPanel==='import'?'records':'import'"><Upload :size="16"/>CSV import</button>
          <button class="btn btn-primary compact" @click="selectedPanel='records';showNew=!showNew"><Plus :size="16"/>Add supplier SKU</button>
        </div>
      </div>
      <div class="quote-safety">
        <ShieldCheck :size="19"/>
        <div><strong>Private records only — not a live supplier API integration.</strong>
          <p>Imported or manually entered quantities are supplier-reported research data until explicitly checked. Supplier prices, stock and lead times never update your public store or create orders.</p></div>
      </div>
      <div class="catalog-metrics">
        <div><small>Tracked SKUs</small><strong>{{stats.total}}</strong></div>
        <div><small>Mapped to products</small><strong>{{stats.mapped}}</strong></div>
        <div><small>Checked within 30 days</small><strong>{{stats.current}}</strong></div>
        <div><small>Unverified or outdated</small><strong>{{stats.needsCheck}}</strong></div>
        <div><small>Out/discontinued</small><strong>{{stats.out}}</strong></div>
      </div>
      <p v-if="feedback" class="launch-feedback" role="status">{{feedback}}</p>
      <p v-if="error" class="launch-feedback error" role="alert">{{error}}</p>

      <section v-if="selectedPanel==='import'" class="catalog-panel catalog-import">
        <div class="catalog-section-head">
          <div><h2><FileSpreadsheet :size="20"/> CSV Catalog Import</h2>
            <p>Prepare a supplier CSV export or fill the template. Validate the rows before any changes are saved.</p>
          </div>
          <button class="btn btn-secondary compact" @click="downloadTemplate"><Download :size="15"/>Download template</button>
        </div>
        <div class="catalog-import-fields">
          <label>Import into supplier
            <select v-model="importSupplier">
              <option v-for="s in suppliers" :key="s.id" :value="s.id">{{s.name}}</option>
            </select>
          </label>
          <label>Choose a CSV file (up to 250 KB / 100 rows)
            <input type="file" accept=".csv,text/csv,text/plain" @change="onFile"/>
          </label>
        </div>
        <p class="catalog-import-hint">Required columns: <code>sku,title</code>. Optional: <code>unit_cost,currency,stock_status,stock_quantity,lead_time_days,source_url</code>. Comma- and semicolon-separated CSV are supported. Prices are stored in the supplier currency and are not converted automatically.</p>
        <p v-if="importError" class="catalog-import-error" role="alert"><AlertTriangle :size="16"/>{{importError}}</p>
        <template v-if="importRows.length">
          <div class="catalog-import-summary"><strong>{{importRows.length}} valid rows</strong><span>{{importFilename}} · previewing first 10</span></div>
          <p v-for="warning in importWarnings" :key="warning" class="catalog-import-warning">{{warning}}</p>
          <div class="admin-table-wrap">
            <table class="catalog-import-table"><thead><tr><th>SKU</th><th>Title</th><th>Supplier cost</th><th>Stock</th><th>Qty</th><th>Lead time</th></tr></thead>
              <tbody><tr v-for="row in importRows.slice(0,10)" :key="row.sku">
                <td><strong>{{row.sku}}</strong></td><td>{{row.title}}</td>
                <td>{{row.unit_cost==null?'—':((row.currency||'SEK')+' '+row.unit_cost)}}</td>
                <td>{{row.stock_status?statusNames[row.stock_status]:'Not supplied'}}</td>
                <td>{{row.stock_quantity??'—'}}</td><td>{{row.lead_time_days??'—'}}</td>
              </tr></tbody>
            </table>
          </div>
          <div class="catalog-import-foot">
            <p>Existing matching supplier SKUs will be updated; product mappings, notes and unrelated records are preserved. Changes to cost or stock clear prior verification.</p>
            <button class="btn btn-primary" :disabled="saving||!importSupplier" @click="importCatalog">
              <Upload :size="16"/>{{saving?'Importing…':`Import ${importRows.length} records`}}
            </button>
          </div>
        </template>
      </section>

      <section v-else>
        <form v-if="showNew" class="catalog-panel catalog-new" @submit.prevent="addManual">
          <div class="catalog-section-head"><h2>Add supplier catalog record</h2>
            <button type="button" class="icon-btn" @click="showNew=false" aria-label="Close form"><X :size="18"/></button>
          </div>
          <div class="catalog-form-grid">
            <label>Supplier<select v-model="newItem.supplier_lead_id"><option v-for="s in suppliers" :key="s.id" :value="s.id">{{s.name}}</option></select></label>
            <label>Optional Norrli product mapping<select v-model="newItem.product_id"><option value="">Unmapped</option><option v-for="p in products" :key="p.id" :value="p.id">{{p.name}}</option></select></label>
            <label>Supplier SKU<input v-model="newItem.supplier_sku" required maxlength="120"/></label>
            <label>Supplier product title<input v-model="newItem.title" required maxlength="250"/></label>
            <label>Status<select v-model="newItem.stock_status"><option v-for="(label,value) in statusNames" :key="value" :value="value">{{label}}</option></select></label>
            <label>Available quantity<input v-model.number="newItem.stock_quantity" type="number" min="0" step="1" placeholder="Unknown"/></label>
            <label>Unit wholesale cost<input v-model.number="newItem.unit_cost" type="number" min="0" step="0.01" placeholder="Unknown"/></label>
            <label>Currency<select v-model="newItem.currency"><option v-for="c in currencies" :key="c">{{c}}</option></select></label>
            <label>Lead time (days)<input v-model.number="newItem.lead_time_days" type="number" min="0" max="365" step="1" placeholder="Unknown"/></label>
            <label class="catalog-wide">Source URL<input v-model="newItem.source_url" type="url" placeholder="https://"/></label>
            <label class="catalog-wide">Private notes<textarea v-model="newItem.notes" rows="2" maxlength="4000"/></label>
          </div>
          <div class="catalog-form-actions"><button class="btn btn-primary" :disabled="saving" type="submit"><Save :size="16"/>Save SKU record</button></div>
        </form>
        <div class="catalog-panel catalog-filterbar">
          <label><Search :size="15"/> Search SKU or title<input v-model="search" type="search" placeholder="Find supplier product"/></label>
          <label>Supplier<select v-model="filterSupplier"><option value="all">All suppliers</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">{{s.name}}</option>
          </select></label>
          <label>Stock<select v-model="filterStock"><option value="all">Any status</option>
            <option v-for="(label,value) in statusNames" :key="value" :value="value">{{label}}</option>
          </select></label>
          <label>Mapping<select v-model="filterProduct"><option value="all">All mappings</option><option value="unmapped">Unmapped</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{p.name}}</option>
          </select></label>
          <label class="catalog-only-stale"><input v-model="onlyUnchecked" type="checkbox"/> Needs verification</label>
        </div>

        <div v-if="!filtered.length" class="catalog-panel catalog-empty">
          <PackageSearch :size="34"/>
          <h2>{{items.length?'No records match these filters':'No supplier SKUs recorded yet'}}</h2>
          <p>{{items.length?'Adjust the filters to display supplier catalog records.':'Add a SKU manually, or import a supplier catalog CSV to begin tracking.'}}</p>
        </div>
        <div v-else class="catalog-grid">
          <article v-for="item in filtered" :key="item.id" class="catalog-record">
            <div class="catalog-record-top"><div>
              <span class="eyebrow">{{nameForSupplier(item.supplier_lead_id)}}</span>
              <h3>{{item.title}}</h3><small>SKU {{item.supplier_sku}}</small>
            </div><span :class="['catalog-stock',item.stock_status]">{{statusNames[item.stock_status]}}</span></div>
            <div class="catalog-detail-grid">
              <div><small>Supplier cost</small><strong>{{item.unit_cost==null?'Unknown':item.currency+' '+item.unit_cost}}</strong></div>
              <div><small>Reported quantity</small><strong>{{item.stock_quantity??'Unknown'}}</strong></div>
              <div><small>Lead time</small><strong>{{item.lead_time_days==null?'Unknown':item.lead_time_days+' days'}}</strong></div>
              <div><small>Store concept mapping</small><strong>{{nameForProduct(item.product_id)}}</strong></div>
            </div>
            <div class="catalog-verification" :class="{outdated:isStale(item)}">
              <Clock3 :size="15"/>
              <div><strong>{{isStale(item)?'Unverified or outdated':'Checked recently'}}</strong>
                <span>Last manual verification: {{formatDate(item.verified_at)}}</span>
                <span v-if="item.last_imported_at">CSV imported: {{formatDate(item.last_imported_at)}}</span>
              </div>
            </div>
            <div class="catalog-record-actions">
              <button class="btn btn-primary compact" @click="openEdit(item)"><ClipboardCheck :size="15"/>Edit / verify</button>
              <button class="btn btn-secondary compact" @click="fetchHistory(item.id)"><History :size="15"/>History</button>
              <a v-if="item.source_url?.startsWith('https://')||item.source_url?.startsWith('http://')"
                :href="item.source_url" target="_blank" rel="noopener noreferrer" class="catalog-source"><Link2 :size="14"/>Source</a>
            </div>
            <div v-if="historyItemId===item.id" class="catalog-history">
              <strong>Latest stock checks</strong>
              <p v-if="historyLoading">Loading history…</p>
              <p v-else-if="!history.length">No verified stock checks yet.</p>
              <div v-for="check in history" :key="check.id">
                <span>{{formatDate(check.checked_at)}}</span>
                <strong>{{statusNames[check.stock_status]}} · {{check.stock_quantity??'?'}} units</strong>
                <small>{{check.unit_cost==null?'Price not recorded':check.currency+' '+check.unit_cost}}</small>
                <p v-if="check.notes">{{check.notes}}</p>
              </div>
            </div>
          </article>
        </div>
      </section>
      <div v-if="editing" class="catalog-editor-overlay" @click.self="closeEdit">
        <section class="catalog-editor" role="dialog" aria-modal="true" aria-label="Edit supplier catalog record">
          <div class="catalog-section-head"><div><h2>Edit supplier SKU</h2>
            <p>{{nameForSupplier(editing.supplier_lead_id)}} · {{editing.supplier_sku}}</p></div>
            <button class="icon-btn" title="Close editor" aria-label="Close editor" @click="closeEdit"><X :size="20"/></button>
          </div>
          <div class="catalog-form-grid">
            <label>Mapped Norrli product<select v-model="editing.product_id"><option :value="null">Unmapped</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{p.name}}</option></select></label>
            <label>Supplier SKU<input v-model="editing.supplier_sku" maxlength="120"/></label>
            <label class="catalog-wide">Supplier title<input v-model="editing.title" maxlength="250"/></label>
            <label>Stock status<select v-model="editing.stock_status"><option v-for="(label,value) in statusNames" :key="value" :value="value">{{label}}</option></select></label>
            <label>Quantity<input v-model.number="editing.stock_quantity" type="number" min="0" step="1"/></label>
            <label>Wholesale unit cost<input v-model.number="editing.unit_cost" type="number" min="0" step="0.01"/></label>
            <label>Currency<select v-model="editing.currency"><option v-for="c in currencies" :key="c">{{c}}</option></select></label>
            <label>Lead time days<input v-model.number="editing.lead_time_days" type="number" min="0" max="365"/></label>
            <label class="catalog-wide">Source URL<input v-model="editing.source_url" type="url" placeholder="https://"/></label>
            <label class="catalog-wide">Research notes<textarea v-model="editing.notes" rows="2" maxlength="4000"/></label>
          </div>
          <div class="catalog-editor-actions">
            <button class="btn btn-primary" :disabled="saving" @click="saveEdit"><Save :size="15"/>Save changes</button>
            <p>Saving changed prices or stock clears previous verification. Verify the saved record separately.</p>
          </div>
          <div class="catalog-confirm-check">
            <h3><CheckCircle2 :size="18"/>Record an explicit stock check</h3>
            <p>This confirms the last saved stock status, quantity and cost. Save any edits first.</p>
            <label>Verification note (optional)<textarea v-model="stockNote" rows="2" maxlength="2000" placeholder="Where and when you confirmed the information…"/></label>
            <button class="btn btn-secondary compact" :disabled="saving" @click="recordCheck(original!)">
              <CheckCircle2 :size="15"/>Record verified snapshot
            </button>
          </div>
        </section>
      </div>
    </template>
  </main>
</template>

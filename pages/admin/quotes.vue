<script setup lang="ts">
import {
  ArrowLeft, RefreshCw, Plus, Save, Trash2, Copy, Scale, TrendingUp,
  AlertTriangle, FileSpreadsheet, LockKeyhole, CheckCircle2, ExternalLink
} from 'lucide-vue-next'
import {
  blankQuote, calculateQuote, formatSek,
  type SupplierQuote, type QuoteStatus, type QuoteCurrency
} from '~/utils/profitability'

type Supplier = {
  id:string; name:string; status:string; shipping_to_sweden:boolean|null
}
type Product = {
  id:string; name:string; slug:string; price:number; active:boolean
}
const loading = ref(true)
const authorized = ref(false)
const errorMessage = ref('')
const feedback = ref('')
const saving = ref(false)
const suppliers = ref<Supplier[]>([])
const products = ref<Product[]>([])
const quotes = ref<SupplierQuote[]>([])
const filterProductId = ref('')
const editor = ref<SupplierQuote | null>(null)
const targetMargin = ref(25)
const compareQuantity = ref(1)
const view = ref<'compare'|'edit'>('compare')

const currencies:QuoteCurrency[] = ['SEK','EUR','USD','GBP','DKK','NOK']
const statuses:Record<QuoteStatus,string> = {
  draft:'Draft (estimate)', requested:'Quote requested',
  received:'Quote received',supplier_confirmed:'Confirmed by supplier',
  rejected:'Not suitable'
}
const money = (value:number|null|undefined) => formatSek(value)
const nameForSupplier = (id:string) => suppliers.value.find(s=>s.id===id)?.name || 'Unknown supplier'
const nameForProduct = (id:string) => products.value.find(p=>p.id===id)?.name || 'Unknown product'
const supplierOf = (id:string) => suppliers.value.find(s=>s.id===id)
const priceFor = (id:string) => (products.value.find(p=>p.id===id)?.price || 0)/100
const resultFor = (quote:SupplierQuote) => calculateQuote(quote,priceFor(quote.product_id),targetMargin.value)
const filteredQuotes = computed(() => quotes.value.filter(q=> !filterProductId.value || q.product_id===filterProductId.value)
  .sort((a,b) => {
    const x=resultFor(a),y=resultFor(b)
    return (y.complete ? 1 : 0) - (x.complete ? 1 : 0) ||
      (y.marginPct ?? -999) - (x.marginPct ?? -999) ||
      a.label.localeCompare(b.label)
  }))
const modeled = computed(()=>filteredQuotes.value.filter(q=>resultFor(q).complete))
const best = computed(()=>modeled.value[0]||null)
const averageMargin = computed(()=>{
  const nums = modeled.value.map(q=>resultFor(q).marginPct).filter((v):v is number=>v!=null)
  return nums.length ? Math.round(nums.reduce((a,b)=>a+b,0)/nums.length*10)/10 : null
})
const currentResult = computed(()=>editor.value ? resultFor(editor.value) : null)
const validationMessage = computed(()=>{
  const q=editor.value
  if(!q)return ''
  if(!q.supplier_lead_id || !q.product_id)return 'Choose a supplier and product.'
  if(!q.label.trim())return 'Enter a quote label.'
  if(!Number.isFinite(Number(q.fx_to_sek)) || Number(q.fx_to_sek)<=0) return 'Enter a positive currency conversion rate.'
  if(!Number.isInteger(Number(q.units_per_order)) || Number(q.units_per_order)<1) return 'Enter a valid number of units.'
  const checks: (keyof SupplierQuote)[]=['unit_cost','shipping_per_order','packaging_per_order','extra_supplier_fee_per_order',
    'duty_per_order_sek','other_cost_per_order_sek','customer_shipping_sek','price_override_sek',
    'payment_fee_pct','payment_fixed_sek','returns_reserve_pct','ad_cost_per_order_sek',
    'overhead_per_order_sek','vat_assumption_pct']
  for(const key of checks){
    const value=q[key]
    if(value==null || value==='') continue
    if(!Number.isFinite(Number(value)) || Number(value)<0)return 'Cost and percentage inputs cannot be negative.'
  }
  if(Number(q.vat_assumption_pct)>100 || Number(q.returns_reserve_pct)>100 ||
     Number(q.payment_fee_pct)>100)return 'Rates must be between 0 and 100%.'
  if(q.delivery_min_days!=null && q.delivery_max_days!=null &&
     Number(q.delivery_max_days)<Number(q.delivery_min_days)) return 'Maximum delivery days cannot be below minimum.'
  return ''
})

const load = async () => {
  const supabase = useSupabaseBrowser()
  if(!supabase)return
  loading.value=true; errorMessage.value=''
  try{
    const {data:session,error:userError}=await supabase.auth.getUser()
    if(userError || !session.user){await navigateTo('/admin/login');return}
    const {data:admin,error:adminError}=await supabase.from('admins')
      .select('user_id').eq('user_id',session.user.id).maybeSingle()
    if(adminError || !admin){ authorized.value=false;return }
    authorized.value=true
    const [ss,pp,qq]=await Promise.all([
      supabase.from('supplier_leads').select('id,name,status,shipping_to_sweden').order('name'),
      supabase.from('products').select('id,name,slug,price,active').order('sort_order'),
      supabase.from('supplier_quotes').select('*').order('created_at',{ascending:false})
    ])
    if(ss.error||pp.error||qq.error)throw ss.error||pp.error||qq.error
    suppliers.value=(ss.data||[]) as Supplier[]
    products.value=(pp.data||[]) as Product[]
    quotes.value=(qq.data||[]) as SupplierQuote[]
    if(editor.value?.id){
      const newest=quotes.value.find(x=>x.id===editor.value?.id)
      if(newest)editor.value={...newest}
    }
  }catch(e:any){errorMessage.value=e?.message||'Unable to open sourcing data.'}
  finally{loading.value=false}
}

const newQuote = () => {
  if(!suppliers.value.length || !products.value.length){
    feedback.value='Create a supplier prospect and product first.'
    return
  }
  const draft=blankQuote(suppliers.value[0].id, filterProductId.value||products.value[0].id)
  editor.value={...draft,id:'',created_at:'',updated_at:''}
  view.value='edit'
  feedback.value=''
}
const editQuote = (quote:SupplierQuote) => {
  editor.value={...quote}
  view.value='edit'
  feedback.value=''
}
const copyQuote = (quote:SupplierQuote) => {
  editor.value={...quote,id:'',label:`${quote.label} — alternative`,status:'draft',created_at:'',updated_at:''}
  view.value='edit';feedback.value='Alternative scenario copied. Save it to keep both versions.'
}
const nullableFields: (keyof SupplierQuote)[]=[
  'source_url','quote_reference','supplier_sku','unit_cost','shipping_per_order',
  'packaging_per_order','extra_supplier_fee_per_order','duty_per_order_sek',
  'other_cost_per_order_sek','price_override_sek','payment_fee_pct','payment_fixed_sek',
  'returns_reserve_pct','ad_cost_per_order_sek','overhead_per_order_sek',
  'min_order_units','delivery_min_days','delivery_max_days'
]
const numericFields: (keyof SupplierQuote)[]=[
  'unit_cost','shipping_per_order','packaging_per_order','extra_supplier_fee_per_order',
  'duty_per_order_sek','other_cost_per_order_sek','price_override_sek',
  'payment_fee_pct','payment_fixed_sek','returns_reserve_pct','ad_cost_per_order_sek',
  'overhead_per_order_sek','min_order_units','delivery_min_days','delivery_max_days'
]
const save = async () => {
  const supabase=useSupabaseBrowser(),q=editor.value
  if(!supabase||!q||!authorized.value||validationMessage.value)return
  saving.value=true;feedback.value=''
  try{
    const {id,created_at,updated_at,...row}=q
    const payload:any={...row,label:q.label.trim(),evidence_notes:q.evidence_notes.trim(),updated_at:new Date().toISOString()}
    for(const field of nullableFields){
      if(payload[field]==='')payload[field]=null
    }
    for(const field of numericFields){
      if(payload[field]!=null)payload[field]=Number(payload[field])
    }
    payload.currency=q.currency
    payload.fx_to_sek=Number(q.fx_to_sek)
    payload.customer_shipping_sek=Number(q.customer_shipping_sek)
    payload.units_per_order=Number(q.units_per_order)
    payload.vat_assumption_pct=Number(q.vat_assumption_pct)
    if(q.currency==='SEK')payload.fx_to_sek=1

    const response=id
      ?await supabase.from('supplier_quotes').update(payload).eq('id',id).select().single()
      :await supabase.from('supplier_quotes').insert(payload).select().single()
    if(response.error)throw response.error
    editor.value=response.data as SupplierQuote
    await load()
    feedback.value='Quotation saved privately.'
  }catch(e:any){feedback.value=e?.message||'Could not save quotation.'}
  finally{saving.value=false}
}
const remove = async () => {
  const supabase=useSupabaseBrowser(),q=editor.value
  if(!supabase||!q?.id||!authorized.value)return
  if(!window.confirm('Delete this saved quote? This cannot be undone.'))return
  saving.value=true
  const {error}=await supabase.from('supplier_quotes').delete().eq('id',q.id)
  if(error)feedback.value=error.message
  else{editor.value=null;view.value='compare';await load();feedback.value='Quotation removed.'}
  saving.value=false
}
const csvSafe=(value:unknown)=>{
  const str=String(value??'')
  const safe=/^[=+@\-\t\r]/.test(str)?"'"+str:str
  return '"'+safe.replaceAll('"','""')+'"'
}
const exportCsv=()=>{
  const headers=['Supplier','Product','Reference','Status','Currency','FX to SEK','Units',
    'Unit cost','Supplier shipping','Gross sales SEK','Net sales ex assumed VAT SEK',
    'Product cost SEK','Landed shipping SEK','Payment fees SEK','Returns reserve SEK',
    'Other costs SEK','Estimated contribution SEK','Margin %','Break-even unit price incl assumed VAT SEK',
    'Target unit price incl assumed VAT SEK','Delivery min days','Delivery max days','Missing information','Notes']
  const rows=filteredQuotes.value.map(q=>{
    const r=resultFor(q)
    return [nameForSupplier(q.supplier_lead_id),nameForProduct(q.product_id),
      q.quote_reference||q.label,q.status,q.currency,q.fx_to_sek,q.units_per_order,
      q.unit_cost??'',q.shipping_per_order??'',r.grossRevenue,r.revenueExVat,
      r.productCost,r.supplierShipping,r.paymentFees,r.returnReserve,r.otherCosts,
      r.profit??'',r.marginPct??'',r.breakEvenUnitPrice??'',r.targetUnitPrice??'',
      q.delivery_min_days??'',q.delivery_max_days??'',r.missing.join('; '),
      q.evidence_notes]
  })
  const content='\uFEFF'+[headers,...rows].map(row=>row.map(csvSafe).join(',')).join('\r\n')
  const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8;'}))
  const a=document.createElement('a')
  a.href=url;a.download='norrli-supplier-profitability.csv';a.click()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}
onMounted(load)
useSeoMeta({title:'Supplier quotes and profitability',robots:'noindex,nofollow'})
</script>

<template>
  <main class="admin-shell quotes-shell">
    <header class="admin-topbar">
      <NorrliLogo/>
      <div class="admin-top-actions">
        <NuxtLink to="/admin/launch" class="btn btn-secondary compact"><ArrowLeft :size="15"/>Launch workspace</NuxtLink>
        <button class="icon-btn" title="Refresh" aria-label="Refresh quotations" @click="load"><RefreshCw :size="18"/></button>
      </div>
    </header>
    <section v-if="loading" class="admin-center">Loading supplier quotation scenarios…</section>
    <section v-else-if="!authorized" class="admin-center admin-denied">
      <LockKeyhole :size="34"/>
      <h1>Private workspace</h1>
      <p>Please sign in as an authorized Norrli Pets administrator.</p>
      <NuxtLink to="/admin/login" class="btn btn-primary">Admin sign in</NuxtLink>
    </section>

    <template v-else>
      <div class="quotes-heading">
        <div>
          <span class="eyebrow"><Scale :size="16"/> Private research · pre-launch</span>
          <h1>Supplier profitability lab</h1>
          <p>Compare competing quotes, delivery costs and SEK profitability before deciding which concepts could become real products.</p>
        </div>
        <div class="quotes-heading-actions">
          <button class="btn btn-secondary compact" :disabled="!quotes.length" @click="exportCsv"><FileSpreadsheet :size="17"/>Export CSV</button>
          <button class="btn btn-primary compact" @click="newQuote"><Plus :size="17"/>New quotation</button>
        </div>
      </div>
      <div class="quote-safety">
        <AlertTriangle :size="20"/>
        <div><strong>Planning only — no supplier prices are assumed or verified.</strong>
          <p>All values must come from an actual quotation or be labeled as a scenario. The VAT field is a simplified modeling assumption, not a Swedish VAT determination. Currency rates must be entered manually. No invoices, supplier orders or real payments are created here.</p>
        </div>
      </div>
      <div class="quote-metrics">
        <div><small>Saved scenarios</small><strong>{{quotes.length}}</strong><span>Admin-only quotations</span></div>
        <div><small>Complete input sets</small><strong>{{modeled.length}}</strong><span>For selected product filter</span></div>
        <div><small>Highest modeled margin</small><strong>{{best && resultFor(best).marginPct!=null ? resultFor(best).marginPct+'%' : '—'}}</strong><span>{{best ? nameForSupplier(best.supplier_lead_id) : 'No complete scenarios'}}</span></div>
        <div><small>Average modeled margin</small><strong>{{averageMargin==null?'—':averageMargin+'%'}}</strong><span>Assumption-based estimates</span></div>
      </div>

      <div class="quote-toolbar">
        <div class="quote-filter">
          <label for="product-quote-filter">Compare product</label>
          <select id="product-quote-filter" v-model="filterProductId">
            <option value="">All products</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{p.name}}</option>
          </select>
        </div>
        <div class="quote-filter">
          <label for="target-margin">Target contribution margin (%)</label>
          <input id="target-margin" v-model.number="targetMargin" type="number" min="0" max="75" step="5"/>
        </div>
        <div class="quote-view-toggle">
          <button :class="{active:view==='compare'}" @click="view='compare'">Compare quotes</button>
          <button :class="{active:view==='edit'}" @click="editor ? view='edit' : newQuote()">Edit scenario</button>
        </div>
      </div>
      <p v-if="errorMessage" class="launch-feedback error">{{errorMessage}}</p>
      <p v-if="feedback" class="launch-feedback" role="status">{{feedback}}</p>

      <section v-if="view==='compare'" class="quotes-compare-panel">
        <div class="quotes-subhead"><div><h2>Side-by-side comparison</h2><p>Ranked by projected contribution margin when essential costs are entered. Quotes with different quantities are not directly comparable.</p></div></div>
        <div v-if="!filteredQuotes.length" class="quotes-empty">
          <Scale :size="35"/>
          <h3>No quotations saved yet</h3>
          <p>Start by choosing one of your five supplier prospects and a product. Enter a supplier quote or a clearly marked hypothetical cost scenario.</p>
          <button class="btn btn-primary" @click="newQuote"><Plus :size="16"/>Create first quote</button>
        </div>
        <div v-else class="admin-table-wrap">
          <table class="quote-compare-table">
            <thead>
              <tr><th>Supplier & product</th><th>Stage</th><th>Units</th><th>Quote cost / unit</th><th>Supplier delivery</th><th>Estimated profit / order</th><th>Margin</th><th>Break-even selling price / unit</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="q in filteredQuotes" :key="q.id">
                <td><strong>{{nameForSupplier(q.supplier_lead_id)}}</strong><small>{{nameForProduct(q.product_id)}} · {{q.label}}</small><small v-if="supplierOf(q.supplier_lead_id)?.shipping_to_sweden!==true" class="quote-warning">Sweden shipping unconfirmed</small></td>
                <td><span class="quote-stage">{{statuses[q.status]}}</span><small v-if="q.status==='supplier_confirmed'">As recorded by admin</small></td>
                <td>{{q.units_per_order}}</td>
                <td>{{q.unit_cost==null?'Missing':(q.currency+' '+q.unit_cost)}}</td>
                <td><template v-if="q.delivery_min_days!=null">{{q.delivery_min_days}}–{{q.delivery_max_days??'?'}} days</template><span v-else>Unconfirmed</span></td>
                <td><strong :class="{ 'quote-negative': (resultFor(q).profit??0)<0 }">{{money(resultFor(q).profit)}}</strong><small v-if="!resultFor(q).complete">{{resultFor(q).missing.length}} essential inputs missing</small></td>
                <td><strong :class="{'quote-negative':(resultFor(q).marginPct??0)<0}">{{resultFor(q).marginPct==null?'—':resultFor(q).marginPct+'%'}}</strong></td>
                <td>{{money(resultFor(q).breakEvenUnitPrice)}}</td>
                <td><div class="quote-actions"><button class="btn btn-secondary compact" @click="editQuote(q)">Edit</button><button title="Duplicate for alternative assumptions" class="icon-btn" @click="copyQuote(q)"><Copy :size="16"/></button></div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="quote-compare-hint"><AlertTriangle :size="16"/> Modeled margin = estimated contribution ÷ revenue excluding assumed VAT; it is not net income after corporate/personal taxes. VAT recoverability, tax jurisdiction, currency volatility, supplier suitability and compliance need separate review.</div>
      </section>

      <section v-else-if="editor" class="quotes-edit-layout">
        <div class="quotes-editor">
          <div class="quotes-editor-head">
            <div><span class="eyebrow">Scenario editor</span><h2>{{editor.id?'Edit saved quotation':'New quotation scenario'}}</h2></div>
            <span class="quote-stage">{{statuses[editor.status]}}</span>
          </div>
          <div class="quotes-form-section">
            <h3>1. Supplier, product & evidence</h3>
            <div class="quotes-form-grid">
              <label>Supplier prospect<select v-model="editor.supplier_lead_id"><option v-for="s in suppliers" :key="s.id" :value="s.id">{{s.name}}</option></select></label>
              <label>Product concept<select v-model="editor.product_id"><option v-for="p in products" :key="p.id" :value="p.id">{{p.name}}</option></select></label>
              <label>Scenario name<input v-model="editor.label" maxlength="120" placeholder="EU warehouse quote A"/></label>
              <label>Evidence status<select v-model="editor.status"><option v-for="(name,key) in statuses" :key="key" :value="key">{{name}}</option></select></label>
              <label>Supplier SKU<input v-model="editor.supplier_sku" placeholder="If provided"/></label>
              <label>Quote reference<input v-model="editor.quote_reference" placeholder="Email/quote number"/></label>
              <label class="quote-wide">Evidence / catalog URL<input v-model="editor.source_url" type="url" placeholder="https://supplier.example/quotation"/></label>
            </div>
          </div>
          <div class="quotes-form-section">
            <h3>2. Supplier costs <small>Enter these amounts in the supplier's currency</small></h3>
            <div class="quotes-form-grid">
              <label>Supplier currency<select v-model="editor.currency"><option v-for="currency in currencies" :key="currency">{{currency}}</option></select></label>
              <label>1 {{editor.currency}} equals SEK<input v-model.number="editor.fx_to_sek" type="number" :disabled="editor.currency==='SEK'" min="0.000001" step="0.000001" required/></label>
              <label>Wholesale unit cost ({{editor.currency}})<input v-model.number="editor.unit_cost" type="number" min="0" step="0.01" placeholder="Required"/></label>
              <label>Shipping for this customer order ({{editor.currency}})<input v-model.number="editor.shipping_per_order" type="number" min="0" step="0.01" placeholder="Required"/></label>
              <label>Packaging / handling ({{editor.currency}})<input v-model.number="editor.packaging_per_order" type="number" min="0" step="0.01" placeholder="Optional"/></label>
              <label>Supplier surcharges ({{editor.currency}})<input v-model.number="editor.extra_supplier_fee_per_order" type="number" min="0" step="0.01" placeholder="Optional"/></label>
              <label>Supplier minimum order units<input v-model.number="editor.min_order_units" type="number" min="1" step="1" placeholder="Unknown"/></label>
              <label>Delivery minimum days<input v-model.number="editor.delivery_min_days" type="number" min="0" step="1" placeholder="Unknown"/></label>
              <label>Delivery maximum days<input v-model.number="editor.delivery_max_days" type="number" min="0" step="1" placeholder="Unknown"/></label>
            </div>
            <p v-if="editor.currency!=='SEK' && editor.fx_to_sek===1" class="quote-note warning"><AlertTriangle :size="15"/> FX rate is still 1. Enter a documented SEK conversion before trusting the estimate.</p>
          </div>
          <div class="quotes-form-section">
            <h3>3. Selling-price scenario <small>SEK, including assumed VAT</small></h3>
            <div class="quotes-form-grid">
              <label>Customer selling price per unit (SEK)<input v-model.number="editor.price_override_sek" type="number" min="0" step="0.01" :placeholder="'Catalog: '+priceFor(editor.product_id).toFixed(2)"/></label>
              <label>Units per customer order<input v-model.number="editor.units_per_order" type="number" min="1" step="1"/></label>
              <label>Customer shipping charged / order (SEK)<input v-model.number="editor.customer_shipping_sek" type="number" min="0" step="0.01"/></label>
              <label>VAT assumption (%)<input v-model.number="editor.vat_assumption_pct" type="number" min="0" max="100" step="0.5"/></label>
              <label>Import/duty cost / order (SEK)<input v-model.number="editor.duty_per_order_sek" type="number" min="0" step="0.01" placeholder="Optional"/></label>
              <label>Other landed expenses / order (SEK)<input v-model.number="editor.other_cost_per_order_sek" type="number" min="0" step="0.01" placeholder="Optional"/></label>
            </div>
          </div>
          <div class="quotes-form-section">
            <h3>4. Processing & business costs <small>SEK per order unless a %</small></h3>
            <div class="quotes-form-grid">
              <label>Payment fee (%)<input v-model.number="editor.payment_fee_pct" type="number" min="0" max="100" step="0.01" placeholder="Required"/></label>
              <label>Payment fixed fee (SEK)<input v-model.number="editor.payment_fixed_sek" type="number" min="0" step="0.01" placeholder="Required"/></label>
              <label>Returns/refunds reserve (%)<input v-model.number="editor.returns_reserve_pct" type="number" min="0" max="100" step="0.01" placeholder="Required"/></label>
              <label>Advertising cost / order (SEK)<input v-model.number="editor.ad_cost_per_order_sek" type="number" min="0" step="0.01" placeholder="Optional"/></label>
              <label>Platform/overhead / order (SEK)<input v-model.number="editor.overhead_per_order_sek" type="number" min="0" step="0.01" placeholder="Optional"/></label>
            </div>
          </div>
          <div class="quotes-form-section">
            <h3>5. Research notes</h3>
            <textarea v-model="editor.evidence_notes" class="quote-notes" rows="4" maxlength="5000" placeholder="Email confirmation, shipping conditions, returns address, product safety information, sample availability, photos, questions…"/>
          </div>
          <p v-if="validationMessage" class="launch-feedback error">{{validationMessage}}</p>
          <div class="quote-editor-actions">
            <button class="btn btn-primary" :disabled="saving||!!validationMessage" @click="save"><Save :size="17"/>{{saving?'Saving…':'Save quotation'}}</button>
            <button v-if="editor.id" class="btn btn-secondary compact quote-danger" :disabled="saving" @click="remove"><Trash2 :size="15"/>Delete</button>
            <button class="btn btn-secondary compact" @click="view='compare'">Back to comparison</button>
          </div>
        </div>
        <aside class="quote-live-aside">
          <div class="quote-result-box">
            <span class="eyebrow"><TrendingUp :size="16"/> Live scenario estimate</span>
            <h3>{{nameForProduct(editor.product_id)}}</h3>
            <p>{{nameForSupplier(editor.supplier_lead_id)}} · {{editor.units_per_order}} unit(s)</p>
            <div v-if="currentResult">
              <div v-if="!currentResult.complete" class="quote-missing">
                <strong><AlertTriangle :size="16"/> Missing essential inputs</strong>
                <ul><li v-for="miss in currentResult.missing" :key="miss">{{miss}}</li></ul>
                <p>Margins appear once these inputs are provided. Explicitly enter 0 only when the cost is truly zero.</p>
              </div>
              <div v-else class="quote-profit-highlight" :class="{negative:(currentResult.profit??0)<0}">
                <small>Estimated contribution per customer order</small>
                <strong>{{money(currentResult.profit)}}</strong>
                <span>{{currentResult.marginPct}}% margin excluding modeled VAT</span>
              </div>
              <div class="quote-result-lines">
                <div><span>Customer pays (incl. VAT)</span><strong>{{money(currentResult.grossRevenue)}}</strong></div>
                <div><span>Estimated VAT portion*</span><span>{{money(currentResult.vatIllustration)}}</span></div>
                <div><span>Revenue excl. modeled VAT</span><strong>{{money(currentResult.revenueExVat)}}</strong></div>
                <hr/>
                <div><span>Supplier products</span><span>−{{money(currentResult.productCost)}}</span></div>
                <div><span>Supplier delivery</span><span>−{{money(currentResult.supplierShipping)}}</span></div>
                <div><span>Packing/supplier extras</span><span>−{{money(currentResult.supplierHandling)}}</span></div>
                <div><span>Payment processing</span><span>−{{money(currentResult.paymentFees)}}</span></div>
                <div><span>Return reserve</span><span>−{{money(currentResult.returnReserve)}}</span></div>
                <div><span>Other/ad/overhead</span><span>−{{money(currentResult.otherCosts)}}</span></div>
                <hr/>
                <div><strong>Total modeled costs</strong><strong>{{money(currentResult.totalCost)}}</strong></div>
                <div><strong>Contribution</strong><strong>{{money(currentResult.profit)}}</strong></div>
              </div>
              <div class="quote-break-even">
                <div><span>Break-even price per unit**</span><strong>{{money(currentResult.breakEvenUnitPrice)}}</strong></div>
                <div><span>Price for {{targetMargin}}% target margin**</span><strong>{{money(currentResult.targetUnitPrice)}}</strong></div>
              </div>
              <div v-if="currentResult.assumedZero.length" class="quote-assumptions"><strong>Excluded because blank (assumed zero):</strong> {{currentResult.assumedZero.join(', ')}}.</div>
              <p class="quote-footnote">* Simplified VAT assumption, not a determination of applicable tax. ** Prices include the assumed VAT rate and keep order quantity/shipping charges unchanged. Calculations exclude taxes on business profits, foreign VAT handling and any unentered costs.</p>
            </div>
          </div>
        </aside>
      </section>
    </template>
  </main>
</template>

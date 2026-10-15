<script setup lang="ts">
import { ArrowLeft, RefreshCw, ClipboardCheck, Scale, Save, LockKeyhole, Search, AlertTriangle, FileSpreadsheet, ShieldCheck, PackageSearch, ArrowUpRight } from 'lucide-vue-next'
import { formatSek, type SupplierQuote } from '~/utils/profitability'
import { scoreQuote, type LeadSnapshot, type ProductSnapshot } from '~/utils/sourcingInsights'

type StoreProduct = ProductSnapshot & { category:string }
type Stage = 'research'|'compare'|'shortlisted'|'on_hold'|'discarded'
type Decision = {
  product_id:string; preferred_quote_id:string|null; stage:Stage; shortlist_rank:number|null
  decision_notes:string; open_questions:string
}
const stageLabels:Record<Stage,string> = {
  research:'Research', compare:'Comparing suppliers',
  shortlisted:'Research shortlist', on_hold:'On hold', discarded:'Not proceeding'
}
const loading=ref(true), authorized=ref(false), error=ref(''), feedback=ref(''), saving=ref('')
const suppliers=ref<LeadSnapshot[]>([]), products=ref<StoreProduct[]>([]), quotes=ref<SupplierQuote[]>([])
const drafts=reactive<Record<string,Decision>>({})
const filterStage=ref('all'), filterCategory=ref('all'), search=ref('')
const sortMode=ref<'score'|'margin'>('score'), targetMargin=ref(25), expanded=ref('')

const leadFor=(id:string)=>suppliers.value.find(s=>s.id===id)
const productFor=(id:string)=>products.value.find(p=>p.id===id)
const insightFor=(q:SupplierQuote)=>scoreQuote(q,leadFor(q.supplier_lead_id),productFor(q.product_id),targetMargin.value)
const quotesFor=(id:string)=>quotes.value.filter(q=>q.product_id===id).sort((a,b)=>{
  const ai=insightFor(a),bi=insightFor(b)
  if(sortMode.value==='score')return bi.points-ai.points || (bi.result.marginPct??-999)-(ai.result.marginPct??-999)
  return (bi.result.marginPct??-999)-(ai.result.marginPct??-999)||bi.points-ai.points
})
const preferred=(id:string)=>quotes.value.find(q=>q.id===drafts[id]?.preferred_quote_id && q.product_id===id)||null
const categories=computed(()=>[...new Set(products.value.map(p=>p.category))].sort())
const filtered=computed(()=>products.value.filter(p=>{
  const d=drafts[p.id]
  return d && (filterStage.value==='all'||d.stage===filterStage.value) &&
    (filterCategory.value==='all'||p.category===filterCategory.value) &&
    (!search.value.trim()||(`${p.name} ${p.category} ${p.slug}`).toLowerCase().includes(search.value.trim().toLowerCase()))
}).sort((a,b)=>{
  const da=drafts[a.id],db=drafts[b.id]
  if(da.stage==='shortlisted'&&db.stage!=='shortlisted')return -1
  if(db.stage==='shortlisted'&&da.stage!=='shortlisted')return 1
  return (da.shortlist_rank??99)-(db.shortlist_rank??99)||a.name.localeCompare(b.name)
}))
const stats=computed(()=>({
  products:products.value.length, quoted:products.value.filter(p=>quotesFor(p.id).length>0).length,
  shortlisted:products.value.filter(p=>drafts[p.id]?.stage==='shortlisted').length,
  preferred:products.value.filter(p=>!!drafts[p.id]?.preferred_quote_id).length
}))
const pct=(value:number|null|undefined)=>value==null?'—':`${value}%`
const load=async()=>{
  const client=useSupabaseBrowser()
  if(!client)return
  loading.value=true;error.value=''
  try{
    const {data:identity,error:authError}=await client.auth.getUser()
    if(authError||!identity.user){await navigateTo('/admin/login');return}
    const {data:admin,error:adminError}=await client.from('admins')
      .select('user_id').eq('user_id',identity.user.id).maybeSingle()
    if(adminError||!admin){authorized.value=false;return}
    authorized.value=true
    const [p,s,q,d]=await Promise.all([
      client.from('products').select('id,name,slug,price,active,material,supplier_sku,supplier_product_url,category').order('sort_order'),
      client.from('supplier_leads').select('id,name,status,shipping_to_sweden').order('name'),
      client.from('supplier_quotes').select('*').order('created_at',{ascending:false}),
      client.from('product_sourcing_decisions').select('*')
    ])
    const err=p.error||s.error||q.error||d.error
    if(err)throw err
    products.value=(p.data||[]) as StoreProduct[]
    suppliers.value=(s.data||[]) as LeadSnapshot[]
    quotes.value=(q.data||[]) as SupplierQuote[]
    const saved=new Map((d.data||[]).map((row:any)=>[row.product_id,row]))
    for(const p of products.value){
      const row=saved.get(p.id)
      drafts[p.id]=row ? {
        product_id:p.id,preferred_quote_id:row.preferred_quote_id,stage:row.stage,
        shortlist_rank:row.shortlist_rank,decision_notes:row.decision_notes,open_questions:row.open_questions
      } : {
        product_id:p.id,preferred_quote_id:null,stage:'research',shortlist_rank:null,
        decision_notes:'',open_questions:''
      }
    }
  }catch(e:any){error.value=e?.message||'Could not load sourcing decisions.'}
  finally{loading.value=false}
}
const save=async(productId:string)=>{
  const client=useSupabaseBrowser(),d=drafts[productId]
  if(!client||!authorized.value||!d)return
  if(d.preferred_quote_id&&!quotesFor(productId).some(q=>q.id===d.preferred_quote_id)){
    feedback.value='The selected quotation belongs to a different product.';return
  }
  if(d.shortlist_rank!=null&&(!Number.isInteger(Number(d.shortlist_rank))||Number(d.shortlist_rank)<1||Number(d.shortlist_rank)>10)){
    feedback.value='Priority rank must be between 1 and 10.';return
  }
  saving.value=productId;feedback.value=''
  try{
    const {error:dbError}=await client.from('product_sourcing_decisions').upsert({
      product_id:productId,stage:d.stage,preferred_quote_id:d.preferred_quote_id||null,
      shortlist_rank:d.shortlist_rank===null?null:Number(d.shortlist_rank),
      decision_notes:d.decision_notes.trim(),open_questions:d.open_questions.trim(),
      updated_at:new Date().toISOString()
    },{onConflict:'product_id'})
    if(dbError)throw dbError
    feedback.value=`Saved decision for ${productFor(productId)?.name||'product'}.`
  }catch(e:any){feedback.value=e?.message||'Could not save.'}
  finally{saving.value=''}
}
const selectTop=(id:string)=>{
  const candidate=quotesFor(id)[0]
  if(candidate)drafts[id].preferred_quote_id=candidate.id
}
const csvCell=(value:unknown)=>{
  const str=String(value??'')
  const safe=/^[=+@\-\t\r]/.test(str)?"'"+str:str
  return '"'+safe.replaceAll('"','""')+'"'
}
const exportCsv=()=>{
  const headers=['Product','Category','Stage','Rank','Preferred supplier','Quote','Evidence score',
    'Estimated contribution SEK','Estimated margin %','Missing evidence','Research notes','Open questions']
  const data=filtered.value.map(p=>{
    const d=drafts[p.id],q=preferred(p.id),ins=q?insightFor(q):null
    return [p.name,p.category,stageLabels[d.stage],d.shortlist_rank??'',
      q?leadFor(q.supplier_lead_id)?.name??'':'',q?.label??'',
      ins?.points??'',ins?.result.profit??'',ins?.result.marginPct??'',
      ins?.blockers.join('; ')||'No preferred quotation',
      d.decision_notes,d.open_questions]
  })
  const csv='\uFEFF'+[headers,...data].map(row=>row.map(csvCell).join(',')).join('\r\n')
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}))
  const a=document.createElement('a');a.href=url;a.download='norrli-product-decisions.csv';a.click()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}
onMounted(load)
useSeoMeta({title:'Product sourcing decision board',robots:'noindex,nofollow'})
</script>

<template>
  <main class="admin-shell decision-shell">
    <header class="admin-topbar">
      <NorrliLogo/>
      <div class="admin-top-actions">
        <NuxtLink to="/admin/insights" class="btn btn-secondary compact"><ArrowLeft :size="15"/>Insights</NuxtLink>
        <button class="icon-btn" title="Refresh decisions" aria-label="Refresh decisions" @click="load"><RefreshCw :size="18"/></button>
      </div>
    </header>
    <section v-if="loading" class="admin-center">Loading private product decisions…</section>
    <section v-else-if="!authorized" class="admin-center admin-denied">
      <LockKeyhole :size="34"/>
      <h1>Admin access required</h1>
      <NuxtLink to="/admin/login" class="btn btn-primary">Sign in</NuxtLink>
    </section>
    <template v-else>
      <section class="decision-heading">
        <span class="eyebrow"><ClipboardCheck :size="16"/> Private research workspace</span>
        <div class="decision-heading-row">
          <div>
            <h1>Product Decision Board</h1>
            <p>Compare quotations per product, shortlist research candidates, and save your reasoning. Nothing here initiates a purchase or changes the public catalog.</p>
          </div>
          <button class="btn btn-secondary compact" @click="exportCsv"><FileSpreadsheet :size="15"/>Export decisions</button>
        </div>
      </section>
      <section class="decision-stats">
        <div><small>Product concepts</small><strong>{{stats.products}}</strong></div>
        <div><small>With quotations</small><strong>{{stats.quoted}}</strong></div>
        <div><small>Preferred quote selected</small><strong>{{stats.preferred}}</strong></div>
        <div><small>Shortlisted for research</small><strong>{{stats.shortlisted}}</strong></div>
      </section>
      <div class="quote-safety">
        <ShieldCheck :size="19"/>
        <div><strong>Research decisions only; no supplier approval or launch authorization.</strong>
          <p>Scores measure entered documentation. Supplier availability, costs, product compliance and shipping require independent confirmation. Live payments and products are not affected by this board.</p>
        </div>
      </div>
      <div class="decision-toolbar">
        <label><Search :size="15"/> Find product <input v-model="search" type="search" placeholder="Name or category"/></label>
        <label>Research stage
          <select v-model="filterStage"><option value="all">All stages</option>
            <option v-for="(name,key) in stageLabels" :key="key" :value="key">{{name}}</option>
          </select>
        </label>
        <label>Category <select v-model="filterCategory"><option value="all">All</option>
          <option v-for="category in categories" :key="category" :value="category">{{category}}</option>
        </select></label>
        <label>Quote ranking
          <select v-model="sortMode"><option value="score">Documentation score</option><option value="margin">Modeled margin</option></select>
        </label>
        <label>Target margin (%) <input v-model.number="targetMargin" type="number" min="0" max="75" step="5"/></label>
      </div>
      <p v-if="feedback" class="launch-feedback" role="status">{{feedback}}</p>
      <p v-if="error" class="launch-feedback error" role="alert">{{error}}</p>
      <section class="decision-board">
        <article v-for="product in filtered" :key="product.id" class="decision-product">
          <div class="decision-product-head">
            <div><span class="eyebrow">{{product.category}}</span><h2>{{product.name}}</h2>
              <p>Indicative catalog price: <strong>{{formatSek(product.price/100)}}</strong></p>
            </div>
            <span class="decision-count">{{quotesFor(product.id).length}} scenarios</span>
          </div>
          <div class="decision-form">
            <label>Research stage <select v-model="drafts[product.id].stage">
              <option v-for="(name,key) in stageLabels" :key="key" :value="key">{{name}}</option>
            </select></label>
            <label>Priority rank (1–10) <input v-model.number="drafts[product.id].shortlist_rank" type="number" min="1" max="10" placeholder="Optional"/></label>
            <label class="decision-wide">Preferred quotation for further research
              <select v-model="drafts[product.id].preferred_quote_id">
                <option :value="null">No preferred quotation</option>
                <option v-for="q in quotesFor(product.id)" :key="q.id" :value="q.id">
                  {{leadFor(q.supplier_lead_id)?.name||'Supplier'}} — {{q.label}}
                </option>
              </select>
            </label>
          </div>
          <div class="decision-quote-summary">
            <div v-if="preferred(product.id)">
              <div class="decision-quote-summary-head">
                <strong>{{leadFor(preferred(product.id)!.supplier_lead_id)?.name}}</strong>
                <span>{{insightFor(preferred(product.id)!).points}}/100 research score</span>
              </div>
              <div class="decision-quote-figures">
                <div><small>Modeled contribution/order</small><strong>{{formatSek(insightFor(preferred(product.id)!).result.profit)}}</strong></div>
                <div><small>Modeled margin</small><strong>{{pct(insightFor(preferred(product.id)!).result.marginPct)}}</strong></div>
                <div><small>Delivery estimate</small><strong>{{preferred(product.id)!.delivery_min_days??'—'}}–{{preferred(product.id)!.delivery_max_days??'—'}} days</strong></div>
              </div>
              <p v-if="insightFor(preferred(product.id)!).blockers.length" class="decision-issues">
                <AlertTriangle :size="14"/> {{insightFor(preferred(product.id)!).blockers.slice(0,3).join(' · ')}}
              </p>
              <p v-else class="decision-caution">Recorded quote fields have no scoring blockers. Additional verification may still be needed.</p>
            </div>
            <div v-else class="decision-placeholder"><PackageSearch :size="20"/>
              <span>{{quotesFor(product.id).length?'Choose a quotation to see its evidence and costs.':'No supplier quotation recorded yet.'}}</span>
            </div>
          </div>
          <div class="decision-compare-actions">
            <button v-if="quotesFor(product.id).length" class="btn btn-secondary compact" @click="selectTop(product.id)">Select highest-ranked scenario</button>
            <button v-if="quotesFor(product.id).length" class="btn btn-secondary compact" @click="expanded=expanded===product.id?'':product.id">
              <Scale :size="14"/> {{expanded===product.id?'Hide comparison':'Compare quotations'}}
            </button>
            <NuxtLink to="/admin/quotes" class="text-link">Manage quotes <ArrowUpRight :size="14"/></NuxtLink>
          </div>
          <div v-if="expanded===product.id" class="decision-comparison">
            <div v-for="q in quotesFor(product.id)" :key="q.id" class="decision-comparison-row">
              <div><strong>{{leadFor(q.supplier_lead_id)?.name}}</strong>
                <small>{{q.label}} · {{q.status.replaceAll('_',' ')}} · {{q.units_per_order}} units</small>
                <small v-if="!insightFor(q).result.complete" class="quote-negative">{{insightFor(q).result.missing.length}} essential fields missing</small>
              </div>
              <span>{{insightFor(q).points}}/100</span>
              <strong>{{formatSek(insightFor(q).result.profit)}}</strong>
              <strong>{{pct(insightFor(q).result.marginPct)}}</strong>
              <button class="btn btn-secondary compact" @click="drafts[product.id].preferred_quote_id=q.id">Choose</button>
            </div>
          </div>
          <div class="decision-notes">
            <label>Reasons to consider this concept
              <textarea v-model="drafts[product.id].decision_notes" rows="2" maxlength="4000" placeholder="Research notes and tradeoffs…"/>
            </label>
            <label>Open questions
              <textarea v-model="drafts[product.id].open_questions" rows="2" maxlength="4000" placeholder="Delivery, sample, genuine photos, safety evidence…"/>
            </label>
          </div>
          <div class="decision-foot">
            <span>Private planning only</span>
            <button class="btn btn-primary compact" :disabled="saving===product.id" @click="save(product.id)">
              <Save :size="14"/>{{saving===product.id?'Saving…':'Save decision'}}
            </button>
          </div>
        </article>
        <div v-if="!filtered.length" class="decision-empty">
          <Search :size="30"/><h3>No products match the filters.</h3>
          <button class="btn btn-secondary compact" @click="search='';filterStage='all';filterCategory='all'">Reset filters</button>
        </div>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import {
  ArrowLeft, RefreshCw, Scale, BarChart3, ShieldCheck, AlertTriangle,
  LockKeyhole, ClipboardCheck, TrendingUp, ArrowUpRight, PackageSearch, Timer
} from 'lucide-vue-next'
import { formatSek, type SupplierQuote } from '~/utils/profitability'
import {
  scoreQuote, stressScenarios,
  type LeadSnapshot, type ProductSnapshot
} from '~/utils/sourcingInsights'

const loading = ref(true)
const authorized = ref(false)
const errorMessage = ref('')
const suppliers = ref<LeadSnapshot[]>([])
const products = ref<ProductSnapshot[]>([])
const quotes = ref<SupplierQuote[]>([])
const productFilter = ref('')
const selectedQuoteId = ref('')
const targetMargin = ref(25)
const sortMode = ref<'evidence'|'margin'>('evidence')

const leadFor = (id:string) => suppliers.value.find(s=>s.id===id)
const productFor = (id:string) => products.value.find(p=>p.id===id)
const insightFor = (q:SupplierQuote) =>
  scoreQuote(q,leadFor(q.supplier_lead_id),productFor(q.product_id),targetMargin.value)
const filtered = computed(()=>quotes.value.filter(q=>!productFilter.value||q.product_id===productFilter.value)
  .sort((a,b)=>{
    const x=insightFor(a),y=insightFor(b)
    if(sortMode.value==='evidence')return y.points-x.points||(y.result.marginPct??-999)-(x.result.marginPct??-999)
    return (y.result.marginPct??-999)-(x.result.marginPct??-999)||y.points-x.points
  }))
const documented = computed(()=>filtered.value.filter(q=>insightFor(q).result.complete))
const maxProfitAbs = computed(()=>Math.max(1,...documented.value.map(q=>Math.abs(insightFor(q).result.profit??0))))
const barWidth = (amount:number|null)=>`${Math.max(2,Math.round(100*Math.abs(amount??0)/maxProfitAbs.value))}%`
const selected = computed(()=>quotes.value.find(q=>q.id===selectedQuoteId.value)||null)
const selectedInsight = computed(()=>selected.value?insightFor(selected.value):null)
const stressTests = computed(()=>{
  if(!selected.value)return []
  return stressScenarios(selected.value,(productFor(selected.value.product_id)?.price??0)/100,targetMargin.value)
})
const stressMax = computed(()=>Math.max(1,...stressTests.value.map(s=>Math.abs(s.result.profit??0))))
const stressWidth = (n:number|null)=>`${Math.max(2,Math.round(100*Math.abs(n??0)/stressMax.value))}%`
const quoteTitle = (q:SupplierQuote) => `${leadFor(q.supplier_lead_id)?.name||'Unknown supplier'} / ${productFor(q.product_id)?.name||'Unknown product'}`
const byProduct = computed(()=>products.value.map(product=>{
  const related=quotes.value.filter(q=>q.product_id===product.id)
    .sort((a,b)=>insightFor(b).points-insightFor(a).points||
      (insightFor(b).result.marginPct??-999)-(insightFor(a).result.marginPct??-999))
  const highest=related[0]||null
  return {
    product, count:related.length,
    highest, score:highest?insightFor(highest).points:0,
    blockers:highest?insightFor(highest).blockers:['No supplier quotation recorded'],
    margin:highest?insightFor(highest).result.marginPct:null
  }
}).sort((a,b)=>b.score-a.score||a.product.name.localeCompare(b.product.name)))
const pendingFollowups = computed(()=>suppliers.value
  .map(s=>({...s,quotes:quotes.value.filter(q=>q.supplier_lead_id===s.id)}))
  .filter(s=>s.status!=='not_suitable'&&s.status!=='contracted'&&(
    s.quotes.length===0||s.quotes.some(q=>q.status==='requested'||q.status==='draft'||q.status==='received')
  )))
const stats = computed(()=>({
  all:filtered.value.length,
  complete:documented.value.length,
  supplierConfirmed:filtered.value.filter(q=>q.status==='supplier_confirmed').length,
  fullEvidence:filtered.value.filter(q=>insightFor(q).blockers.length===0).length
}))
watch(filtered,(items)=>{
  if(!items.some(q=>q.id===selectedQuoteId.value))selectedQuoteId.value=items[0]?.id||''
},{immediate:true})
const load = async ()=>{
  const supabase=useSupabaseBrowser()
  if(!supabase)return
  loading.value=true;errorMessage.value=''
  try{
    const {data:user,error:userError}=await supabase.auth.getUser()
    if(userError||!user.user){await navigateTo('/admin/login');return}
    const {data:admin,error:adminError}=await supabase.from('admins')
      .select('user_id').eq('user_id',user.user.id).maybeSingle()
    if(adminError||!admin){authorized.value=false;return}
    authorized.value=true
    const [s,p,q]=await Promise.all([
      supabase.from('supplier_leads').select('id,name,status,shipping_to_sweden').order('name'),
      supabase.from('products').select('id,name,slug,price,active,material,supplier_sku,supplier_product_url').order('sort_order'),
      supabase.from('supplier_quotes').select('*').order('updated_at',{ascending:false})
    ])
    if(s.error||p.error||q.error)throw s.error||p.error||q.error
    suppliers.value=(s.data||[]) as LeadSnapshot[]
    products.value=(p.data||[]) as ProductSnapshot[]
    quotes.value=(q.data||[]) as SupplierQuote[]
    if(!selectedQuoteId.value||!quotes.value.find(q=>q.id===selectedQuoteId.value))
      selectedQuoteId.value=quotes.value[0]?.id||''
  }catch(e:any){errorMessage.value=e?.message||'Could not load sourcing insights.'}
  finally{loading.value=false}
}
onMounted(load)
useSeoMeta({
  title:'Supplier insights & scenario risks',
  description:'Private supplier comparison, documentation readiness and risk analysis for Norrli Pets',
  robots:'noindex,nofollow'
})
</script>

<template>
  <main class="admin-shell insight-shell">
    <header class="admin-topbar">
      <NorrliLogo/>
      <div class="admin-top-actions">
        <NuxtLink to="/admin/quotes" class="btn btn-secondary compact"><ArrowLeft :size="16"/>Quote planner</NuxtLink>
        <button class="icon-btn" title="Refresh insights" aria-label="Refresh insights" @click="load"><RefreshCw :size="18"/></button>
      </div>
    </header>
    <section v-if="loading" class="admin-center">Preparing supplier insights…</section>
    <section v-else-if="!authorized" class="admin-center admin-denied">
      <LockKeyhole :size="34"/>
      <h1>Admin access required</h1>
      <NuxtLink to="/admin/login" class="btn btn-primary">Sign in</NuxtLink>
    </section>
    <template v-else>
      <section class="insight-heading">
        <span class="eyebrow"><BarChart3 :size="17"/> Norrli Pets / private research</span>
        <div class="insight-heading-row">
          <div><h1>Supplier insights</h1><p>Compare modeled profit, track evidence gaps and stress-test cost assumptions. Your scoring reflects research completeness, not supplier certification.</p></div>
          <div class="admin-top-actions">
            <NuxtLink to="/admin/decisions" class="btn btn-secondary compact"><ClipboardCheck :size="16"/>Product Decision Board</NuxtLink>
            <NuxtLink to="/admin/quotes" class="btn btn-primary compact"><Scale :size="16"/>Manage quotations</NuxtLink>
          </div>
        </div>
      </section>
      <div class="quote-safety">
        <ShieldCheck :size="19"/>
        <div><strong>Pre-launch only. No suppliers, products or margins are independently verified.</strong>
          <p>Scores are transparent documentation-completeness indicators. Missing legal business registration, actual product safety evidence, and confirmed fulfillment remain separate launch blockers. No payments or supplier orders are activated.</p></div>
      </div>

      <section class="insight-controls">
        <label>Compare product
          <select v-model="productFilter">
            <option value="">All product scenarios (not directly comparable)</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{p.name}}</option>
          </select>
        </label>
        <label>Sort scenarios
          <select v-model="sortMode">
            <option value="evidence">Documentation completeness</option>
            <option value="margin">Modeled margin</option>
          </select>
        </label>
        <label>Target contribution margin
          <input v-model.number="targetMargin" type="number" min="0" max="75" step="5"/>
        </label>
      </section>
      <div class="insight-kpis">
        <div><span>Saved scenarios</span><strong>{{stats.all}}</strong></div>
        <div><span>Complete essential cost inputs</span><strong>{{stats.complete}}</strong></div>
        <div><span>Marked supplier-confirmed</span><strong>{{stats.supplierConfirmed}}</strong></div>
        <div><span>Without scored evidence blockers</span><strong>{{stats.fullEvidence}}</strong></div>
      </div>
      <p v-if="errorMessage" class="launch-feedback error" role="alert">{{errorMessage}}</p>

      <section class="insight-grid">
        <div class="insight-panel insight-chart">
          <div class="insight-panel-head">
            <h2><TrendingUp :size="19"/> Modeled contribution per order</h2>
            <p>SEK, after entered costs and assumed VAT, not final net income. Red indicates loss.</p>
          </div>
          <div v-if="documented.length" class="insight-bars">
            <div v-for="q in documented.slice(0,12)" :key="q.id" class="insight-bar-row">
              <div class="insight-bar-label"><strong>{{leadFor(q.supplier_lead_id)?.name}}</strong><small>{{productFor(q.product_id)?.name}} · {{q.units_per_order}} units</small></div>
              <div class="insight-bar-track">
                <div :class="['insight-bar-fill',{negative:(insightFor(q).result.profit??0)<0}]"
                     :style="{width:barWidth(insightFor(q).result.profit)}"/>
              </div>
              <strong :class="{ 'quote-negative': (insightFor(q).result.profit??0)<0 }">{{formatSek(insightFor(q).result.profit)}}</strong>
            </div>
          </div>
          <div v-else class="insight-empty">
            <BarChart3 :size="32"/>
            <h3>No complete quotation scenarios yet</h3>
            <p>Enter unit cost, supplier shipping, payment processing, and return reserve in the quote planner to see the comparison chart.</p>
            <NuxtLink to="/admin/quotes" class="btn btn-secondary compact">Open quote planner</NuxtLink>
          </div>
          <p v-if="documented.length && !productFilter" class="insight-panel-foot">Select a single product above for a meaningful supplier-to-supplier comparison. Only the first 12 complete scenarios are displayed.</p>
        </div>

        <div class="insight-panel">
          <div class="insight-panel-head">
            <h2><ClipboardCheck :size="19"/> Research readiness by product</h2>
            <p>Highest-scoring saved quotation for each product. 0–100 represents documented inputs, not safety or permission to launch.</p>
          </div>
          <div class="insight-score-rows">
            <div v-for="entry in byProduct" :key="entry.product.id" class="insight-score-row">
              <div class="insight-score-title"><strong>{{entry.product.name}}</strong><span>{{entry.score}}/100</span></div>
              <div class="insight-score-track"><div :style="{width:entry.score+'%'}"/></div>
              <small>{{entry.count}} quotation(s) · {{entry.blockers[0]||'Scored fields documented; additional checks remain'}}</small>
            </div>
          </div>
          <p class="insight-panel-foot">Scores: core costs 20, supplier confirmation 15, Sweden shipping 15, evidence reference 10, delivery window 10, SKU 10, extra costs 10, MOQ 5, target margin 5.</p>
        </div>
      </section>

      <section class="insight-grid">
        <div class="insight-panel">
          <div class="insight-panel-head">
            <h2><Scale :size="19"/> What-if cost stress test</h2>
            <p>Change scenarios virtually without editing or saving the underlying quote.</p>
          </div>
          <div class="insight-select-row">
            <label>Quote to test
              <select v-model="selectedQuoteId">
                <option v-if="!filtered.length" value="">No saved quotation</option>
                <option v-for="q in filtered" :key="q.id" :value="q.id">{{quoteTitle(q)}} — {{q.label}}</option>
              </select>
            </label>
          </div>
          <template v-if="selected && selectedInsight?.result.complete">
            <div class="insight-bars insight-stress-bars">
              <div v-for="test in stressTests" :key="test.id" class="insight-bar-row" :title="test.explanation">
                <div class="insight-bar-label"><strong>{{test.label}}</strong><small>{{test.explanation}}</small></div>
                <div class="insight-bar-track"><div :class="['insight-bar-fill',{negative:(test.result.profit??0)<0}]"
                     :style="{width:stressWidth(test.result.profit)}"/></div>
                <strong :class="{ 'quote-negative':(test.result.profit??0)<0 }">{{formatSek(test.result.profit)}}</strong>
              </div>
            </div>
            <div class="insight-stress-summary">
              <span>Baseline margin: <strong>{{selectedInsight.result.marginPct}}%</strong></span>
              <span>Target: <strong>{{targetMargin}}%</strong></span>
            </div>
          </template>
          <div v-else class="insight-empty compact">
            <AlertTriangle :size="26"/>
            <p>Choose a quotation with all essential pricing inputs completed to run the sensitivity scenarios.</p>
          </div>
        </div>
        <div class="insight-panel">
          <div class="insight-panel-head">
            <h2><ShieldCheck :size="19"/> Quotation evidence checklist</h2>
            <p>Why a quotation is or is not well documented.</p>
          </div>
          <template v-if="selectedInsight">
            <div class="insight-evidence-score">
              <strong>{{selectedInsight.points}}/100</strong><span>{{selectedInsight.evidenceLabel}}</span>
            </div>
            <ul class="insight-checklist">
              <li v-for="check in selectedInsight.checks" :key="check.label" :class="{passed:check.passed}">
                <span>{{check.passed?'✓':'○'}}</span>
                <span>{{check.label}}</span>
                <strong>{{check.passed?'+':''}}{{check.passed?check.points:0}}/{{check.points}}</strong>
              </li>
            </ul>
            <div v-if="selectedInsight.blockers.length" class="insight-blocker">
              <strong><AlertTriangle :size="15"/> Outstanding evidence</strong>
              <p>{{selectedInsight.blockers.join(' · ')}}</p>
            </div>
          </template>
          <div v-else class="insight-empty compact"><p>No quote selected.</p></div>
        </div>
      </section>

      <section class="insight-panel insight-followup">
        <div class="insight-panel-head">
          <h2><Timer :size="19"/> Supplier research follow-up queue</h2>
          <p>Manual tracking only. This page never sends emails or contacts suppliers automatically.</p>
        </div>
        <div v-if="!pendingFollowups.length" class="insight-empty compact"><p>No supplier prospects currently need follow-up in this view.</p></div>
        <div v-else class="insight-followup-list">
          <div v-for="s in pendingFollowups" :key="s.id">
            <div><strong>{{s.name}}</strong><small>{{s.quotes.length}} quotations · Stage: {{s.status.replaceAll('_',' ')}}</small></div>
            <span v-if="s.quotes.length===0">Request written unit prices, delivery costs and EU safety documentation</span>
            <span v-else>Verify SKU, Sweden delivery, quote evidence and costs before making a decision</span>
          </div>
        </div>
        <div class="insight-bottom-action">
          <NuxtLink to="/admin/launch" class="btn btn-secondary compact"><PackageSearch :size="15"/>Manage supplier prospects</NuxtLink>
          <NuxtLink to="/admin/quotes" class="btn btn-primary compact">Add quotation <ArrowUpRight :size="15"/></NuxtLink>
        </div>
      </section>
    </template>
  </main>
</template>

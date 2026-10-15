<script setup lang="ts">
import { ArrowLeft, RefreshCw, LockKeyhole, ShieldCheck, ShieldAlert, ClipboardCheck, PackageCheck, ArrowRight } from 'lucide-vue-next'
import {evaluateLaunchReadiness,previewFulfillment} from '~/utils/launchReadiness.mjs'

type Order = {id:string;order_number:string;payment_status:string|null;payment_provider:string|null;fulfillment_status:string|null;shipped_at:string|null}
const authorized=ref(false),loading=ref(true),error=ref('')
const tasks=ref<any[]>([]),leads=ref<any[]>([]),quotes=ref<any[]>([]),products=ref<any[]>([])
const stock=ref<any[]>([]),images=ref<any[]>([]),orders=ref<Order[]>([])
const selectedId=ref(''),target=ref('supplier_ordered')
const draft=reactive({supplierOrderReference:'',carrier:'',trackingNumber:''})
const load=async()=>{
  const client=useSupabaseBrowser()
  if(!client){error.value='Supabase browser configuration is not available.';loading.value=false;return}
  loading.value=true;error.value='';authorized.value=false
  try{
    const {data:user,error:authError}=await client.auth.getUser()
    if(authError||!user.user){await navigateTo('/admin/login');return}
    const {data:admin,error:roleError}=await client.from('admins').select('user_id').eq('user_id',user.user.id).maybeSingle()
    if(roleError||!admin){return}
    authorized.value=true
    const [t,l,q,p,s,i,o]=await Promise.all([
      client.from('prelaunch_tasks').select('code,title,priority,status').limit(300),
      client.from('supplier_leads').select('id,name,status,shipping_to_sweden').limit(200),
      client.from('supplier_quotes').select('supplier_lead_id,product_id,status,unit_cost,shipping_per_order,payment_fee_pct,delivery_min_days,delivery_max_days').limit(300),
      client.from('products').select('id,name,active,material,stock_status,supplier_sku').limit(300),
      client.from('supplier_catalog_items').select('id,verified_at').limit(500),
      client.from('product_images').select('product_id,is_concept').limit(500),
      client.from('orders').select('id,order_number,payment_status,payment_provider,fulfillment_status,shipped_at').order('created_at',{ascending:false}).limit(100)
    ])
    const issue=[t,l,q,p,s,i,o].find(x=>x.error)?.error
    if(issue)throw issue
    tasks.value=t.data||[];leads.value=l.data||[];quotes.value=q.data||[]
    products.value=p.data||[];stock.value=s.data||[];images.value=i.data||[];orders.value=(o.data||[]) as Order[]
  }catch(e:any){error.value=e?.message||'Could not load verified preparation records.'}
  finally{loading.value=false}
}
const report=computed(()=>evaluateLaunchReadiness({
  tasks:tasks.value,leads:leads.value,quotes:quotes.value,products:products.value,
  stock:stock.value,images:images.value,orders:orders.value
}))
const selectedOrder=computed(()=>orders.value.find(o=>o.id===selectedId.value))
const assessment=computed(()=>selectedOrder.value?previewFulfillment(selectedOrder.value,target.value,draft):null)
watch(selectedOrder,order=>{
  const steps=['unfulfilled','supplier_ordered','processing','shipped','delivered']
  const current=steps.indexOf(order?.fulfillment_status||'unfulfilled')
  target.value=steps[current+1]||''
})
onMounted(load)
useSeoMeta({title:'Launch verification',robots:'noindex,nofollow'})
</script>
<template>
  <main class="phase4-shell phase5-shell">
    <header class="phase4-topbar">
      <div class="phase4-top-brand"><NorrliLogo compact /><span>LAUNCH VERIFICATION · PRIVATE</span></div>
      <div class="phase4-quick-links">
        <NuxtLink to="/admin/operations"><ArrowLeft :size="16"/> Operations</NuxtLink>
        <NuxtLink to="/admin/launch">Launch checklist</NuxtLink>
        <button type="button" :disabled="loading" @click="load"><RefreshCw :size="16"/> Refresh</button>
      </div>
    </header>
    <section v-if="loading" class="phase4-state" role="status">Checking pre-launch evidence…</section>
    <section v-else-if="!authorized" class="phase4-state">
      <LockKeyhole :size="35"/><h1>Administrator access required</h1>
      <p>Verification records are available to authorized Norrli Pets administrators only.</p>
      <NuxtLink to="/admin/login">Admin sign-in</NuxtLink>
    </section>
    <template v-else>
      <div class="phase4-heading"><div>
        <span class="eyebrow"><ShieldCheck :size="16"/> PHASE 5 · READ ONLY</span>
        <h1>Launch readiness & safe testing</h1>
        <p>Evidence gaps, supplier checks and a simulated fulfillment decision. No database changes.</p>
      </div>
      <div class="phase4-prelaunch"><ShieldAlert :size="22"/><div>
        <strong>Not a launch approval</strong><small>Checkout remains disabled. Human review required.</small>
      </div></div></div>
      <p v-if="error" class="phase4-alert error" role="alert">{{ error }}</p>
      <section class="phase5-report phase4-panel">
        <div class="phase4-section-head"><div><h2>Recorded readiness</h2>
          <p>{{ report.passed }} of {{ report.total }} preparation checks have supporting data. This is not permission to launch.</p></div>
          <NuxtLink to="/admin/launch" class="phase4-primary-link">Edit launch checklist <ArrowRight :size="16"/></NuxtLink></div>
        <div class="phase5-checks">
          <article v-for="check in report.checks" :key="check.id" class="phase5-check">
            <div :class="['phase5-indicator',{passed:check.passed}]">
              <ShieldCheck v-if="check.passed" :size="20"/><ShieldAlert v-else :size="20"/>
            </div>
            <div><strong>{{ check.label }}</strong><p>{{ check.detail }}</p></div>
            <span :class="['phase5-status',{passed:check.passed}]">{{ check.passed?'Evidence recorded':'Needs review' }}</span>
          </article>
        </div>
        <p class="phase5-caution">{{ report.caution }}</p>
      </section>
      <section class="phase4-panel phase5-dryrun">
        <div class="phase4-section-head"><div><h2>Fulfillment dry run</h2>
          <p>Preview the restrictions against an existing order without writing to the database or sending notifications.</p></div>
          <span class="phase5-readonly"><ClipboardCheck :size="17"/> Simulation only</span>
        </div>
        <div class="phase5-form">
          <label>Select a stored order
            <select v-model="selectedId">
              <option value="">Choose an order</option>
              <option v-for="order in orders" :key="order.id" :value="order.id">{{ order.order_number }} · {{ order.payment_status||'unpaid' }}</option>
            </select>
          </label>
          <template v-if="selectedOrder">
            <label>Current stage<input :value="selectedOrder.fulfillment_status||'unfulfilled'" readonly/></label>
            <label>Proposed next stage<input :value="target||'No next stage'" readonly/></label>
            <label>Supplier reference (simulation)<input v-model="draft.supplierOrderReference" maxlength="160" placeholder="Only enter a real recorded reference"/></label>
            <label>Carrier (simulation)<input v-model="draft.carrier" maxlength="120" placeholder="Carrier name"/></label>
            <label>Tracking (simulation)<input v-model="draft.trackingNumber" maxlength="160" placeholder="Tracking reference"/></label>
          </template>
        </div>
        <div v-if="assessment" class="phase5-result">
          <strong>{{ assessment.allowed?'Policy checks passed — no action taken':'Blocked by fulfillment policy' }}</strong>
          <p v-if="assessment.allowed">A real update would still require a separate authorized operation and confirmation.</p>
          <p v-for="reason in assessment.errors" :key="reason">{{ reason }}</p>
          <small>Dry run only. No order, supplier or customer data was changed.</small>
        </div>
        <p v-else class="phase4-empty">Choose an order to inspect its next-stage policy without changing anything.</p>
      </section>
      <div class="phase5-links"><NuxtLink to="/admin/operations"><PackageCheck :size="17"/> Back to operations</NuxtLink>
      <NuxtLink to="/admin/quotes">Review supplier quotations <ArrowRight :size="16"/></NuxtLink></div>
    </template>
  </main>
</template>

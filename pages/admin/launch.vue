<script setup lang="ts">
import {
  ArrowLeft, CheckCircle2, CircleDashed, Clock3, ShieldCheck, Truck,
  Save, RefreshCw, Plus, ExternalLink, LockKeyhole, PackageSearch, Scale
} from 'lucide-vue-next'

type Status = 'not_started' | 'in_progress' | 'blocked' | 'ready'
type Task = {
  id: string; code: string; category: string; title: string; description: string
  status: Status; priority: number; notes: string; updated_at: string
}
type LeadStatus = 'researching' | 'contacted' | 'awaiting_reply' | 'replied' |
  'shortlisted' | 'not_suitable' | 'contracted'
type Lead = {
  id: string; name: string; contact_email: string | null; website_url: string | null
  country: string | null; status: LeadStatus; shipping_to_sweden: boolean | null
  integration_format: string | null; notes: string; updated_at: string
}
type ProductAudit = {
  id: string; slug: string; name: string; supplier_id: string | null
  supplier_cost: number | null; stock_status: string | null
  supplier_sku: string | null; material: string | null
  delivery_min_days: number | null; delivery_max_days: number | null
  supplier_product_url: string | null
}
type ImageAudit = { product_id: string; is_concept: boolean }

const loading = ref(true)
const authorized = ref(false)
const loadError = ref('')
const feedback = ref('')
const savingId = ref('')
const tab = ref<'checklist' | 'suppliers' | 'products'>('checklist')
const tasks = ref<Task[]>([])
const leads = ref<Lead[]>([])
const products = ref<ProductAudit[]>([])
const images = ref<ImageAudit[]>([])
const showNewLead = ref(false)
const newLead = reactive({
  name: '', contact_email: '', website_url: '', country: '',
  notes: '', status: 'researching' as LeadStatus
})

const statusNames: Record<Status, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  blocked: 'Waiting',
  ready: 'Ready'
}
const leadStatusNames: Record<LeadStatus, string> = {
  researching: 'Researching',
  contacted: 'Contacted',
  awaiting_reply: 'Awaiting reply',
  replied: 'Replied',
  shortlisted: 'Shortlisted',
  not_suitable: 'Not suitable',
  contracted: 'Contracted'
}
const finished = computed(() => tasks.value.filter(task => task.status === 'ready').length)
const percentage = computed(() => tasks.value.length
  ? Math.round(finished.value / tasks.value.length * 100) : 0)
const categories = computed(() => [...new Set(tasks.value.map(task => task.category))])
const tasksFor = (category: string) =>
  tasks.value.filter(task => task.category === category)
    .sort((a,b) => a.priority - b.priority || a.title.localeCompare(b.title))
const realPhoto = (id: string) => images.value.some(image => image.product_id === id && !image.is_concept)
const productScore = (p: ProductAudit) => [
  Boolean(p.supplier_id),
  p.supplier_cost != null,
  Boolean(p.supplier_sku && p.supplier_product_url),
  realPhoto(p.id),
  Boolean(p.material),
  p.delivery_min_days != null && p.delivery_max_days != null
].filter(Boolean).length
const productChecks = (p: ProductAudit) => [
  { label: 'Supplier assigned (not necessarily approved)', ok: Boolean(p.supplier_id) },
  { label: 'Wholesale cost entered', ok: p.supplier_cost != null },
  { label: 'Supplier SKU and source URL', ok: Boolean(p.supplier_sku && p.supplier_product_url) },
  { label: 'Actual product photo (not an AI concept)', ok: realPhoto(p.id) },
  { label: 'Material specified', ok: Boolean(p.material) },
  { label: 'Delivery estimate entered', ok: p.delivery_min_days != null && p.delivery_max_days != null }
]

const load = async () => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  loading.value = true
  loadError.value = ''
  try {
    const { data: identity, error: identityError } = await supabase.auth.getUser()
    if (identityError || !identity.user) { await navigateTo('/admin/login'); return }
    const { data: adminRow, error: adminError } = await supabase
      .from('admins').select('user_id').eq('user_id', identity.user.id).maybeSingle()
    if (adminError || !adminRow) { authorized.value = false; return }
    authorized.value = true
    const [taskResult, leadResult, productResult, imageResult] = await Promise.all([
      supabase.from('prelaunch_tasks').select('*').order('priority').order('title'),
      supabase.from('supplier_leads').select('*').order('name'),
      supabase.from('products')
        .select('id,slug,name,supplier_id,supplier_cost,stock_status,supplier_sku,material,delivery_min_days,delivery_max_days,supplier_product_url')
        .order('sort_order'),
      supabase.from('product_images').select('product_id,is_concept')
    ])
    const error = taskResult.error || leadResult.error || productResult.error || imageResult.error
    if (error) throw error
    tasks.value = (taskResult.data || []) as Task[]
    leads.value = (leadResult.data || []) as Lead[]
    products.value = (productResult.data || []) as ProductAudit[]
    images.value = (imageResult.data || []) as ImageAudit[]
  } catch (error:any) {
    loadError.value = error?.message || 'Unable to load the planning workspace.'
  } finally { loading.value = false }
}

const saveTask = async (task:Task) => {
  const supabase = useSupabaseBrowser()
  if (!supabase || !authorized.value) return
  savingId.value = task.id; feedback.value = ''
  try {
    const { error } = await supabase.from('prelaunch_tasks').update({
      status: task.status, notes: task.notes.trim(), updated_at: new Date().toISOString()
    }).eq('id', task.id)
    if (error) throw error
    feedback.value = `Saved: ${task.title}`
  } catch (error:any) { feedback.value = error.message || 'Could not save task.' }
  finally { savingId.value = '' }
}

const saveLead = async (lead:Lead) => {
  const supabase = useSupabaseBrowser()
  if (!supabase || !authorized.value) return
  savingId.value = lead.id; feedback.value = ''
  try {
    const { error } = await supabase.from('supplier_leads').update({
      name: lead.name.trim(),
      contact_email: lead.contact_email?.trim() || null,
      website_url: lead.website_url?.trim() || null,
      country: lead.country?.trim() || null,
      status: lead.status, shipping_to_sweden: lead.shipping_to_sweden,
      integration_format: lead.integration_format?.trim() || null,
      notes: lead.notes.trim(), updated_at: new Date().toISOString()
    }).eq('id', lead.id)
    if (error) throw error
    feedback.value = `Saved: ${lead.name}`
  } catch (error:any) { feedback.value = error.message || 'Could not save supplier.' }
  finally { savingId.value = '' }
}

const addLead = async () => {
  const supabase = useSupabaseBrowser()
  if (!supabase || !authorized.value || !newLead.name.trim()) return
  savingId.value = 'new'; feedback.value = ''
  try {
    const { error } = await supabase.from('supplier_leads').insert({
      name:newLead.name.trim(), contact_email:newLead.contact_email.trim() || null,
      website_url:newLead.website_url.trim() || null,
      country:newLead.country.trim() || null, status:newLead.status,
      notes:newLead.notes.trim()
    })
    if (error) throw error
    Object.assign(newLead,{name:'',contact_email:'',website_url:'',country:'',notes:'',status:'researching'})
    showNewLead.value = false
    await load()
    feedback.value = 'Supplier prospect added'
  } catch (error:any) { feedback.value = error.message || 'Could not add prospect.' }
  finally { savingId.value = '' }
}

useSeoMeta({
  title:'Pre-launch workspace',
  description:'Private Norrli Pets research and launch preparation workspace',
  robots:'noindex,nofollow'
})
onMounted(load)
</script>

<template>
  <main class="admin-shell launch-shell">
    <header class="admin-topbar">
      <NorrliLogo />
      <div class="admin-top-actions">
        <NuxtLink to="/admin" class="btn btn-secondary compact"><ArrowLeft :size="15"/> Admin</NuxtLink>
        <button type="button" class="icon-btn" title="Refresh" aria-label="Refresh workspace" @click="load"><RefreshCw :size="18"/></button>
      </div>
    </header>

    <section v-if="loading" class="admin-center">Loading private pre-launch workspace…</section>
    <section v-else-if="!authorized" class="admin-center admin-denied">
      <LockKeyhole :size="36" />
      <h1>Admin access required.</h1>
      <p>This workspace is private and is not available to storefront visitors.</p>
      <NuxtLink to="/admin/login" class="btn btn-primary">Admin sign in</NuxtLink>
    </section>

    <template v-else>
      <div class="launch-top">
        <div>
          <span class="eyebrow"><ShieldCheck :size="15"/> Private planning area</span>
          <h1>Launch workspace</h1>
          <p>Develop the store, review prospective suppliers, and document what needs checking before opening for sales.</p>
          <NuxtLink to="/admin/quotes" class="btn btn-primary compact" style="margin-top:16px"><Scale :size="16"/> Supplier comparison & profitability</NuxtLink>
          <NuxtLink to="/admin/insights" class="btn btn-secondary compact" style="margin-top:16px;margin-left:8px">Supplier insights & risk analysis</NuxtLink>
          <NuxtLink to="/admin/catalog" class="btn btn-secondary compact" style="margin-top:16px;margin-left:8px">Catalog & Stock Lab</NuxtLink>
        </div>
        <div class="launch-lock"><LockKeyhole :size="18"/><strong>PRE-LAUNCH</strong><small>No real orders enabled</small></div>
      </div>

      <div class="launch-progress">
        <div class="launch-progress-copy">
          <span>Launch readiness</span>
          <strong>{{ finished }} of {{ tasks.length }} requirements ready</strong>
          <p>Planning progress is not legal, supplier, or Stripe approval.</p>
        </div>
        <div class="launch-progress-meter" role="progressbar" :aria-valuenow="percentage" aria-valuemin="0" aria-valuemax="100">
          <div :style="{ width: percentage + '%' }" />
        </div>
        <strong class="launch-progress-percent">{{ percentage }}%</strong>
      </div>

      <div class="launch-stats">
        <div><ShieldCheck :size="18"/><strong>{{ tasks.filter(t => t.status === 'blocked').length }}</strong><span>Waiting on decisions</span></div>
        <div><Truck :size="18"/><strong>{{ leads.length }}</strong><span>Supplier prospects</span></div>
        <div><PackageSearch :size="18"/><strong>{{ products.length }}</strong><span>Products to validate</span></div>
        <div><CheckCircle2 :size="18"/><strong>{{ finished }}</strong><span>Ready requirements</span></div>
      </div>

      <div class="launch-notice">
        <ShieldCheck :size="20"/>
        <p>This is a private development workspace. The store is not registered for trading and real customer payments are disabled. Check with the relevant benefits authority before relying on any type of business-preparation work as permitted.</p>
      </div>

      <nav class="launch-tabs" aria-label="Launch workspace sections">
        <button :class="{active:tab==='checklist'}" @click="tab='checklist'"><Clock3 :size="17"/>Readiness checklist</button>
        <button :class="{active:tab==='suppliers'}" @click="tab='suppliers'"><Truck :size="17"/>Supplier research</button>
        <button :class="{active:tab==='products'}" @click="tab='products'"><PackageSearch :size="17"/>Product audit</button>
      </nav>

      <p v-if="feedback" class="launch-feedback" role="status">{{ feedback }}</p>
      <p v-if="loadError" class="launch-feedback error" role="alert">{{ loadError }}</p>

      <section v-if="tab==='checklist'" class="launch-sections">
        <div v-for="category in categories" :key="category" class="launch-category">
          <h2>{{ category }}</h2>
          <article v-for="task in tasksFor(category)" :key="task.id" class="launch-task">
            <div class="launch-task-main">
              <CheckCircle2 v-if="task.status==='ready'" :size="22" class="launch-icon-ready"/>
              <CircleDashed v-else :size="22" class="launch-icon-pending"/>
              <div>
                <strong>{{ task.title }}</strong>
                <p>{{ task.description }}</p>
                <small v-if="task.priority===1">Priority: essential before launch</small>
              </div>
            </div>
            <div class="launch-task-controls">
              <label>Status
                <select v-model="task.status">
                  <option v-for="(label,value) in statusNames" :key="value" :value="value">{{ label }}</option>
                </select>
              </label>
              <label>Private notes
                <textarea v-model="task.notes" rows="2" placeholder="Record progress or outstanding questions" maxlength="3000"/>
              </label>
              <button class="btn btn-primary compact" :disabled="savingId===task.id" @click="saveTask(task)">
                <Save :size="14"/>{{ savingId===task.id ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section v-else-if="tab==='suppliers'" class="launch-category">
        <div class="launch-section-head">
          <div><h2>Supplier research pipeline</h2><p>Tracking enquiries is not an approved supplier relationship. Mark terms confirmed only when independently documented.</p><NuxtLink to="/admin/quotes" class="text-link" style="margin-top:10px">Compare quotations and margins <ExternalLink :size="14"/></NuxtLink></div>
          <button class="btn btn-secondary compact" @click="showNewLead=!showNewLead"><Plus :size="15"/> Add prospect</button>
        </div>
        <form v-if="showNewLead" class="launch-lead-create" @submit.prevent="addLead">
          <label>Name<input v-model="newLead.name" required maxlength="160"/></label>
          <label>Email<input v-model="newLead.contact_email" type="email"/></label>
          <label>Website<input v-model="newLead.website_url" type="url"/></label>
          <label>Country<input v-model="newLead.country"/></label>
          <label class="launch-wide">Notes<textarea v-model="newLead.notes" rows="2"/></label>
          <button class="btn btn-primary compact" type="submit">Save prospect</button>
        </form>
        <div class="launch-leads">
          <article v-for="lead in leads" :key="lead.id" class="launch-lead-card">
            <div class="launch-lead-head"><div><h3>{{ lead.name }}</h3><small>{{ lead.country || 'Country not confirmed' }}</small></div><span class="launch-stage">{{ leadStatusNames[lead.status] }}</span></div>
            <div class="launch-lead-details">
              <label>Pipeline stage
                <select v-model="lead.status">
                  <option v-for="(label,value) in leadStatusNames" :key="value" :value="value">{{ label }}</option>
                </select>
              </label>
              <label>Sweden shipping
                <select v-model="lead.shipping_to_sweden">
                  <option :value="null">Not confirmed</option>
                  <option :value="true">Confirmed yes</option>
                  <option :value="false">Confirmed no</option>
                </select>
              </label>
              <label>Email<input v-model="lead.contact_email" type="email"/></label>
              <label>Country<input v-model="lead.country" placeholder="Not confirmed"/></label>
              <label>Website<input v-model="lead.website_url" type="url" placeholder="https://"/></label>
              <label>Catalog/API method<input v-model="lead.integration_format" placeholder="Not confirmed"/></label>
              <label class="launch-wide">Notes / verification evidence
                <textarea v-model="lead.notes" rows="3" maxlength="4000" placeholder="Pricing, returns, licensed images, written confirmation…"/>
              </label>
            </div>
            <div class="launch-lead-foot">
              <a v-if="lead.website_url" :href="lead.website_url" target="_blank" rel="noopener noreferrer">Supplier site <ExternalLink :size="13"/></a>
              <button class="btn btn-primary compact" :disabled="savingId===lead.id" @click="saveLead(lead)"><Save :size="14"/>{{ savingId===lead.id?'Saving…':'Save changes' }}</button>
            </div>
          </article>
        </div>
      </section>

      <section v-else class="launch-category">
        <div class="launch-section-head">
          <div><h2>Product validation</h2><p>These checks are an internal inventory of missing information, not a guarantee of product safety.</p></div>
        </div>
        <div class="launch-audit">
          <article v-for="p in products" :key="p.id" class="launch-audit-card">
            <div class="launch-audit-head"><div><h3>{{ p.name }}</h3><small>{{ p.slug }}</small></div><span>{{ productScore(p) }}/6 checks</span></div>
            <div class="launch-audit-meter"><div :style="{width:Math.round(productScore(p)/6*100)+'%'}"/></div>
            <ul>
              <li v-for="item in productChecks(p)" :key="item.label" :class="{done:item.ok}">
                <CheckCircle2 v-if="item.ok" :size="15"/><CircleDashed v-else :size="15"/> {{ item.label }}
              </li>
            </ul>
            <NuxtLink class="btn btn-secondary compact" :to="`/admin/products/${p.id}`">Edit product <ExternalLink :size="13"/></NuxtLink>
          </article>
        </div>
      </section>
    </template>
  </main>
</template>

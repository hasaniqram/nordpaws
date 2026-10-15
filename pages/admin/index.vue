<script setup lang="ts">
import {
  LogOut, Package, ShoppingBag, Mail, UsersRound, RefreshCw,
  Truck, Plus, Save, ExternalLink
} from 'lucide-vue-next'

type Supplier = {
  id:string
  name:string
  website_url:string|null
  contact_email:string|null
  country:string|null
  warehouse_location:string|null
  default_shipping_days:number|null
  active:boolean
  notes:string|null
}

type AdminProduct = {
  id:string
  slug:string
  name:string
  category:string
  price:number
  priceSEK:number
  active:boolean
  sort_order:number
  supplier_id:string|null
  supplier_sku:string|null
  supplier_cost:number|null
  supplierCostSEK:number|null
  stock_status:string
  stock_quantity:number|null
  lead_time_days:number|null
}

type AdminOrder = {
  id:string
  order_number:string
  email:string|null
  customer_name:string|null
  amount_total:number
  currency:string
  payment_status:string|null
  fulfillment_status:string
  supplier_status:string
  supplier_order_reference:string|null
  tracking_number:string|null
  carrier:string|null
  supplier_ordered_at:string|null
  processing_at:string|null
  shipped_at:string|null
  delivered_at:string|null
  created_at:string
}

type OrderItem = {
  id:string
  order_id:string
  quantity:number
  unit_amount:number
  supplier_cost:number|null
}

const loading = ref(true)
const authorized = ref(false)
const userId = ref('')
const products = ref<AdminProduct[]>([])
const suppliers = ref<Supplier[]>([])
const orders = ref<AdminOrder[]>([])
const orderItems = ref<OrderItem[]>([])
const contacts = ref<any[]>([])
const newsletter = ref<any[]>([])
const tab = ref<'products'|'suppliers'|'orders'|'messages'|'newsletter'>('products')
const feedback = ref('')
const feedbackType = ref<'success'|'error'>('success')
const showNewProduct = ref(false)
const showNewSupplier = ref(false)

const newProduct = reactive({
  name:'',
  slug:'',
  category:'Dogs',
  priceSEK:0,
  supplier_id:'',
  supplier_sku:'',
  supplierCostSEK:0,
  stock_status:'unknown',
  stock_quantity:null as number|null,
  lead_time_days:null as number|null,
  active:false
})

const newSupplier = reactive({
  name:'',
  website_url:'',
  contact_email:'',
  country:'',
  warehouse_location:'',
  default_shipping_days:null as number|null,
  notes:'',
  active:true
})

const formatSEK = (ore:number|null|undefined) => new Intl.NumberFormat('sv-SE', {
  style:'currency', currency:'SEK', maximumFractionDigits:2
}).format((ore || 0) / 100)

const marginOre = (product:AdminProduct) =>
  product.supplierCostSEK == null ? null : Math.round((product.priceSEK - product.supplierCostSEK) * 100)

const marginPct = (product:AdminProduct) => {
  if (product.supplierCostSEK == null || product.priceSEK <= 0) return null
  return Math.round(((product.priceSEK - product.supplierCostSEK) / product.priceSEK) * 100)
}

const supplierName = (id:string|null) => suppliers.value.find(s => s.id === id)?.name || 'No supplier'

const orderMargin = (orderId:string) => {
  const items = orderItems.value.filter(i => i.order_id === orderId)
  if (!items.length || items.some(i => i.supplier_cost == null)) return null
  return items.reduce((sum, item) => sum + ((item.unit_amount - (item.supplier_cost || 0)) * item.quantity), 0)
}

const averageMargin = computed(() => {
  const values = products.value
    .filter(p => p.active && p.supplierCostSEK != null && p.priceSEK > 0)
    .map(p => ((p.priceSEK - (p.supplierCostSEK || 0)) / p.priceSEK) * 100)
  if (!values.length) return null
  return Math.round(values.reduce((a,b) => a+b,0) / values.length)
})

const setFeedback = (message:string, type:'success'|'error'='success') => {
  feedback.value = message
  feedbackType.value = type
  window.setTimeout(() => { if (feedback.value === message) feedback.value = '' }, 3500)
}

const load = async () => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  loading.value = true
  feedback.value = ''

  const { data:userData } = await supabase.auth.getUser()
  if (!userData.user) {
    await navigateTo('/admin/login')
    return
  }

  userId.value = userData.user.id
  const { data:adminRow } = await supabase.from('admins').select('user_id').eq('user_id', userData.user.id).maybeSingle()
  if (!adminRow) {
    authorized.value = false
    loading.value = false
    return
  }

  authorized.value = true

  const [productResult, supplierResult, orderResult, itemResult, contactResult, newsletterResult] = await Promise.all([
    supabase.from('products').select('id,slug,name,category,price,active,sort_order,supplier_id,supplier_sku,supplier_cost,stock_status,stock_quantity,lead_time_days').order('sort_order'),
    supabase.from('suppliers').select('*').order('name'),
    supabase.from('orders').select('*').order('created_at',{ascending:false}).limit(100),
    supabase.from('order_items').select('id,order_id,quantity,unit_amount,supplier_cost').limit(1000),
    supabase.from('contact_messages').select('*').order('created_at',{ascending:false}).limit(100),
    supabase.from('newsletter_subscribers').select('*').order('created_at',{ascending:false}).limit(100)
  ])

  products.value = (productResult.data || []).map((p:any) => ({
    ...p,
    priceSEK:Number((p.price / 100).toFixed(2)),
    supplierCostSEK:p.supplier_cost == null ? null : Number((p.supplier_cost / 100).toFixed(2))
  }))
  suppliers.value = supplierResult.data || []
  orders.value = orderResult.data || []
  orderItems.value = itemResult.data || []
  contacts.value = contactResult.data || []
  newsletter.value = newsletterResult.data || []
  loading.value = false
}

const saveProduct = async (product:AdminProduct) => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  const { error } = await supabase.from('products').update({
    name:product.name.trim(),
    price:Math.round(Number(product.priceSEK) * 100),
    supplier_id:product.supplier_id || null,
    supplier_sku:product.supplier_sku?.trim() || null,
    supplier_cost:product.supplierCostSEK == null ? null : Math.round(Number(product.supplierCostSEK) * 100),
    stock_status:product.stock_status,
    stock_quantity:product.stock_quantity,
    lead_time_days:product.lead_time_days,
    active:product.active,
    sort_order:Number(product.sort_order)
  }).eq('id',product.id)

  if (error) return setFeedback(error.message,'error')
  setFeedback(`${product.name} saved`)
}

const createProduct = async () => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  const slug = newProduct.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
  if (!newProduct.name.trim() || !slug || newProduct.priceSEK <= 0) {
    return setFeedback('Name, slug and selling price are required.','error')
  }

  const id = `nr-${slug}`
  const { error } = await supabase.from('products').insert({
    id,
    slug,
    name:newProduct.name.trim(),
    subtitle:'',
    description:'',
    category:newProduct.category,
    price:Math.round(newProduct.priceSEK * 100),
    supplier_id:newProduct.supplier_id || null,
    supplier_sku:newProduct.supplier_sku.trim() || null,
    supplier_cost:newProduct.supplierCostSEK > 0 ? Math.round(newProduct.supplierCostSEK * 100) : null,
    stock_status:newProduct.stock_status,
    stock_quantity:newProduct.stock_quantity,
    lead_time_days:newProduct.lead_time_days,
    active:newProduct.active,
    sort_order:products.value.length + 1,
    emoji:'🐾',
    gradient:'linear-gradient(135deg,#ece8df,#d8d3c8)',
    features:[]
  })

  if (error) return setFeedback(error.message,'error')
  Object.assign(newProduct,{name:'',slug:'',category:'Dogs',priceSEK:0,supplier_id:'',supplier_sku:'',supplierCostSEK:0,stock_status:'unknown',stock_quantity:null,lead_time_days:null,active:false})
  showNewProduct.value = false
  await load()
  setFeedback('Product created')
}

const saveSupplier = async (supplier:Supplier) => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  const { error } = await supabase.from('suppliers').update({
    name:supplier.name.trim(),
    website_url:supplier.website_url?.trim() || null,
    contact_email:supplier.contact_email?.trim() || null,
    country:supplier.country?.trim() || null,
    warehouse_location:supplier.warehouse_location?.trim() || null,
    default_shipping_days:supplier.default_shipping_days,
    active:supplier.active,
    notes:supplier.notes?.trim() || null,
    updated_at:new Date().toISOString()
  }).eq('id',supplier.id)
  if (error) return setFeedback(error.message,'error')
  setFeedback(`${supplier.name} saved`)
}

const createSupplier = async () => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  if (!newSupplier.name.trim()) return setFeedback('Supplier name is required.','error')

  const { error } = await supabase.from('suppliers').insert({
    name:newSupplier.name.trim(),
    website_url:newSupplier.website_url.trim() || null,
    contact_email:newSupplier.contact_email.trim() || null,
    country:newSupplier.country.trim() || null,
    warehouse_location:newSupplier.warehouse_location.trim() || null,
    default_shipping_days:newSupplier.default_shipping_days,
    active:newSupplier.active,
    notes:newSupplier.notes.trim() || null
  })
  if (error) return setFeedback(error.message,'error')
  Object.assign(newSupplier,{name:'',website_url:'',contact_email:'',country:'',warehouse_location:'',default_shipping_days:null,notes:'',active:true})
  showNewSupplier.value = false
  await load()
  setFeedback('Supplier created')
}

const saveOrder = async (order:AdminOrder) => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return

  const now = new Date().toISOString()
  const patch:any = {
    fulfillment_status:order.fulfillment_status,
    supplier_order_reference:order.supplier_order_reference?.trim() || null,
    tracking_number:order.tracking_number?.trim() || null,
    carrier:order.carrier?.trim() || null,
    updated_at:now
  }

  if (order.fulfillment_status === 'supplier_ordered') {
    patch.supplier_status = 'ordered'
    patch.supplier_ordered_at = order.supplier_ordered_at || now
  }
  if (order.fulfillment_status === 'processing') {
    patch.supplier_status = 'accepted'
    patch.supplier_ordered_at = order.supplier_ordered_at || now
    patch.processing_at = order.processing_at || now
  }
  if (order.fulfillment_status === 'shipped') {
    patch.supplier_status = 'shipped'
    patch.shipped_at = order.shipped_at || now
  }
  if (order.fulfillment_status === 'delivered') {
    patch.supplier_status = 'delivered'
    patch.delivered_at = order.delivered_at || now
  }
  if (order.fulfillment_status === 'cancelled') patch.supplier_status = 'cancelled'

  const { error } = await supabase.from('orders').update(patch).eq('id',order.id)
  if (error) return setFeedback(error.message,'error')
  Object.assign(order,patch)
  setFeedback(`${order.order_number} updated`)
}

const signOut = async () => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  await supabase.auth.signOut()
  await navigateTo('/admin/login')
}

onMounted(load)
useSeoMeta({title:'Admin dashboard',robots:'noindex,nofollow'})
</script>

<template>
  <main class="admin-shell">
    <header class="admin-topbar">
      <NorrliLogo />
      <div class="admin-top-actions">
        <button class="icon-btn" title="Refresh" @click="load"><RefreshCw :size="18"/></button>
        <button class="btn btn-secondary" @click="signOut"><LogOut :size="16"/>Sign out</button>
      </div>
    </header>

    <section v-if="loading" class="admin-center">Loading dashboard…</section>

    <section v-else-if="!authorized" class="admin-center admin-denied">
      <span class="eyebrow">Authenticated</span>
      <h1>Admin access not granted yet.</h1>
      <p>Your account is valid, but it is not in the Norrli Pets admin allow-list.</p>
      <div class="user-id"><span>User ID</span><code>{{ userId }}</code></div>
      <p class="muted">This ID can be promoted in the Supabase <strong>admins</strong> table.</p>
    </section>

    <template v-else>
      <section class="admin-heading">
        <div>
          <span class="eyebrow">Dropshipping operations</span>
          <h1>Norrli Pets Admin</h1>
          <p>Products, suppliers, margins, fulfillment and customer communication.</p>
        </div>
        <div class="admin-stats admin-stats-five">
          <div><strong>{{ products.length }}</strong><span>Products</span></div>
          <div><strong>{{ suppliers.filter(s=>s.active).length }}</strong><span>Suppliers</span></div>
          <div><strong>{{ orders.length }}</strong><span>Orders</span></div>
          <div><strong>{{ averageMargin == null ? '—' : averageMargin + '%' }}</strong><span>Avg margin</span></div>
          <div><strong>{{ newsletter.length }}</strong><span>Subscribers</span></div>
        </div>
      </section>

      <nav class="admin-tabs">
        <button :class="{active:tab==='products'}" @click="tab='products'"><Package :size="17"/>Products</button>
        <button :class="{active:tab==='suppliers'}" @click="tab='suppliers'"><Truck :size="17"/>Suppliers</button>
        <button :class="{active:tab==='orders'}" @click="tab='orders'"><ShoppingBag :size="17"/>Orders</button>
        <button :class="{active:tab==='messages'}" @click="tab='messages'"><Mail :size="17"/>Messages</button>
        <button :class="{active:tab==='newsletter'}" @click="tab='newsletter'"><UsersRound :size="17"/>Newsletter</button>
      </nav>

      <p v-if="feedback" :class="['admin-feedback','admin-page-feedback',feedbackType]">{{ feedback }}</p>

      <section v-if="tab==='products'" class="admin-panel">
        <div class="admin-panel-head">
          <div><h2>Product operations</h2><p>Manage supplier cost, selling price, stock and margin.</p></div>
          <button class="btn btn-primary compact" @click="showNewProduct=!showNewProduct"><Plus :size="16"/>Add product</button>
        </div>

        <form v-if="showNewProduct" class="admin-create-grid" @submit.prevent="createProduct">
          <label>Name<input v-model="newProduct.name" required></label>
          <label>Slug<input v-model="newProduct.slug" placeholder="cleanroll"></label>
          <label>Category<select v-model="newProduct.category"><option>Dogs</option><option>Cats</option><option>Travel</option><option>Clean Home</option></select></label>
          <label>Selling price (SEK)<input v-model.number="newProduct.priceSEK" type="number" min="0" step="0.01" required></label>
          <label>Supplier<select v-model="newProduct.supplier_id"><option value="">No supplier</option><option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option></select></label>
          <label>Supplier SKU<input v-model="newProduct.supplier_sku"></label>
          <label>Supplier cost (SEK)<input v-model.number="newProduct.supplierCostSEK" type="number" min="0" step="0.01"></label>
          <label>Stock<select v-model="newProduct.stock_status"><option value="unknown">Unknown</option><option value="in_stock">In stock</option><option value="low_stock">Low stock</option><option value="out_of_stock">Out of stock</option><option value="discontinued">Discontinued</option></select></label>
          <label>Qty<input v-model.number="newProduct.stock_quantity" type="number" min="0"></label>
          <label>Lead time (days)<input v-model.number="newProduct.lead_time_days" type="number" min="0"></label>
          <label class="check-label"><input v-model="newProduct.active" type="checkbox">Publish immediately</label>
          <div class="admin-create-actions"><button class="btn btn-primary" type="submit"><Save :size="16"/>Create product</button></div>
        </form>

        <div class="admin-table-wrap">
          <table class="admin-table admin-product-table">
            <thead><tr><th>Product</th><th>Supplier</th><th>Cost</th><th>Price</th><th>Margin</th><th>Stock</th><th>Lead</th><th>Live</th><th></th></tr></thead>
            <tbody>
              <tr v-for="product in products" :key="product.id">
                <td>
                  <input v-model="product.name" class="admin-input">
                  <small>{{ product.slug }}</small>
                </td>
                <td>
                  <select v-model="product.supplier_id" class="admin-input select-input">
                    <option :value="null">No supplier</option>
                    <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                  <input v-model="product.supplier_sku" class="admin-input mini-field" placeholder="Supplier SKU">
                </td>
                <td><input v-model.number="product.supplierCostSEK" type="number" min="0" step="0.01" class="admin-input money-input"></td>
                <td><input v-model.number="product.priceSEK" type="number" min="0" step="0.01" class="admin-input money-input"></td>
                <td>
                  <div v-if="marginOre(product)!=null" class="margin-cell">
                    <strong>{{ formatSEK(marginOre(product)) }}</strong>
                    <span>{{ marginPct(product) }}%</span>
                  </div>
                  <span v-else class="muted">—</span>
                </td>
                <td>
                  <select v-model="product.stock_status" class="admin-input select-input">
                    <option value="unknown">Unknown</option><option value="in_stock">In stock</option><option value="low_stock">Low stock</option><option value="out_of_stock">Out</option><option value="discontinued">Discontinued</option>
                  </select>
                  <input v-model.number="product.stock_quantity" type="number" min="0" class="admin-input mini-field" placeholder="Qty">
                </td>
                <td><input v-model.number="product.lead_time_days" type="number" min="0" class="admin-input tiny-input"> days</td>
                <td><input v-model="product.active" type="checkbox"></td>
                <td><button class="btn btn-secondary compact" @click="saveProduct(product)"><Save :size="15"/>Save</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="tab==='suppliers'" class="admin-panel">
        <div class="admin-panel-head">
          <div><h2>Suppliers</h2><p>Keep sourcing, warehouse and lead-time data in one place.</p></div>
          <button class="btn btn-primary compact" @click="showNewSupplier=!showNewSupplier"><Plus :size="16"/>Add supplier</button>
        </div>

        <form v-if="showNewSupplier" class="admin-create-grid supplier-create" @submit.prevent="createSupplier">
          <label>Name<input v-model="newSupplier.name" required></label>
          <label>Website<input v-model="newSupplier.website_url" type="url" placeholder="https://"></label>
          <label>Email<input v-model="newSupplier.contact_email" type="email"></label>
          <label>Country<input v-model="newSupplier.country" placeholder="China / Sweden / EU"></label>
          <label>Warehouse<input v-model="newSupplier.warehouse_location" placeholder="Shenzhen / EU warehouse"></label>
          <label>Default shipping days<input v-model.number="newSupplier.default_shipping_days" type="number" min="0"></label>
          <label class="wide-field">Notes<textarea v-model="newSupplier.notes" rows="3"></textarea></label>
          <label class="check-label"><input v-model="newSupplier.active" type="checkbox">Active supplier</label>
          <div class="admin-create-actions"><button class="btn btn-primary" type="submit"><Save :size="16"/>Create supplier</button></div>
        </form>

        <div v-if="!suppliers.length" class="admin-empty">No suppliers yet. Add your first supplier and then assign products to it.</div>
        <div v-else class="supplier-grid">
          <article v-for="supplier in suppliers" :key="supplier.id" class="supplier-card">
            <div class="supplier-card-head">
              <input v-model="supplier.name" class="supplier-name-input">
              <span :class="['status-pill',supplier.active?'good':'muted-pill']">{{ supplier.active ? 'Active' : 'Paused' }}</span>
            </div>
            <div class="supplier-fields">
              <label>Website<input v-model="supplier.website_url" type="url"></label>
              <label>Email<input v-model="supplier.contact_email" type="email"></label>
              <label>Country<input v-model="supplier.country"></label>
              <label>Warehouse<input v-model="supplier.warehouse_location"></label>
              <label>Shipping days<input v-model.number="supplier.default_shipping_days" type="number" min="0"></label>
              <label class="wide-field">Notes<textarea v-model="supplier.notes" rows="2"></textarea></label>
            </div>
            <div class="supplier-actions">
              <a v-if="supplier.website_url" :href="supplier.website_url" target="_blank" rel="noreferrer" class="text-link"><ExternalLink :size="15"/>Open supplier</a>
              <label class="check-label"><input v-model="supplier.active" type="checkbox">Active</label>
              <button class="btn btn-secondary compact" @click="saveSupplier(supplier)"><Save :size="15"/>Save</button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="tab==='orders'" class="admin-panel">
        <div class="admin-panel-head">
          <div><h2>Order fulfillment</h2><p>Paid → Supplier Ordered → Processing → Shipped → Delivered</p></div>
        </div>
        <div v-if="!orders.length" class="admin-empty">No orders yet. Paid Mollie orders will appear here automatically.</div>
        <div v-else class="orders-grid">
          <article v-for="order in orders" :key="order.id" class="order-card">
            <div class="order-card-head">
              <div><strong>{{ order.order_number }}</strong><span>{{ order.customer_name || order.email || 'Customer' }}</span></div>
              <div class="order-amount"><strong>{{ formatSEK(order.amount_total) }}</strong><span>{{ order.payment_status }}</span></div>
            </div>
            <div class="order-fields">
              <label>Fulfillment
                <select v-model="order.fulfillment_status">
                  <option value="unfulfilled">Paid / Unfulfilled</option>
                  <option value="supplier_ordered">Supplier Ordered</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </label>
              <label>Supplier order ref<input v-model="order.supplier_order_reference" placeholder="Supplier order #"></label>
              <label>Carrier<input v-model="order.carrier" placeholder="PostNord / DHL"></label>
              <label>Tracking<input v-model="order.tracking_number" placeholder="Tracking number"></label>
            </div>
            <div class="order-foot">
              <div>
                <span>Supplier: {{ order.supplier_status || 'pending' }}</span>
                <span v-if="orderMargin(order.id)!=null">Gross margin: <strong>{{ formatSEK(orderMargin(order.id)) }}</strong></span>
              </div>
              <button class="btn btn-primary compact" @click="saveOrder(order)"><Save :size="15"/>Update order</button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="tab==='messages'" class="admin-panel">
        <div v-if="!contacts.length" class="admin-empty">No messages yet.</div>
        <article v-for="message in contacts" :key="message.id" class="admin-message">
          <div class="admin-message-head"><strong>{{ message.name }}</strong><span>{{ message.email }}</span></div>
          <p>{{ message.message }}</p><small>{{ new Date(message.created_at).toLocaleString() }}</small>
        </article>
      </section>

      <section v-if="tab==='newsletter'" class="admin-panel">
        <div v-if="!newsletter.length" class="admin-empty">No subscribers yet.</div>
        <article v-for="person in newsletter" :key="person.id" class="admin-list-row">
          <div><strong>{{ person.email }}</strong><span>{{ person.status }}</span></div>
          <small>{{ new Date(person.created_at).toLocaleDateString() }}</small>
        </article>
      </section>
    </template>
  </main>
</template>

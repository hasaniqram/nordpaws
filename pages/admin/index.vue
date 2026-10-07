<script setup lang="ts">
import { LogOut, Package, ShoppingBag, Mail, UsersRound, RefreshCw } from 'lucide-vue-next'

type AdminProduct = {
  id:string
  slug:string
  name:string
  category:string
  price:number
  active:boolean
  sort_order:number
}

const loading = ref(true)
const authorized = ref(false)
const userId = ref('')
const products = ref<AdminProduct[]>([])
const orders = ref<any[]>([])
const contacts = ref<any[]>([])
const newsletter = ref<any[]>([])
const tab = ref<'products'|'orders'|'messages'|'newsletter'>('products')
const feedback = ref('')

const load = async () => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  loading.value = true
  feedback.value = ''

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    await navigateTo('/admin/login')
    return
  }

  userId.value = userData.user.id
  const { data: adminRow } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userData.user.id)
    .maybeSingle()

  if (!adminRow) {
    authorized.value = false
    loading.value = false
    return
  }

  authorized.value = true

  const [productResult, orderResult, contactResult, newsletterResult] = await Promise.all([
    supabase.from('products').select('id,slug,name,category,price,active,sort_order').order('sort_order'),
    supabase.from('orders').select('*').order('created_at', { ascending:false }).limit(100),
    supabase.from('contact_messages').select('*').order('created_at', { ascending:false }).limit(100),
    supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending:false }).limit(100)
  ])

  products.value = productResult.data || []
  orders.value = orderResult.data || []
  contacts.value = contactResult.data || []
  newsletter.value = newsletterResult.data || []
  loading.value = false
}

const saveProduct = async (product: AdminProduct) => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  const { error } = await supabase.from('products').update({
    name: product.name,
    price: Math.round(Number(product.price)),
    active: product.active,
    sort_order: Number(product.sort_order)
  }).eq('id', product.id)

  feedback.value = error ? error.message : `${product.name} saved`
}

const signOut = async () => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  await supabase.auth.signOut()
  await navigateTo('/admin/login')
}

onMounted(load)
useSeoMeta({ title: 'Admin dashboard', robots: 'noindex,nofollow' })
</script>

<template>
  <main class="admin-shell">
    <header class="admin-topbar">
      <NuxtLink to="/" class="brand"><span class="brand-mark">N</span><span>NORDPAWS</span></NuxtLink>
      <div class="admin-top-actions">
        <button class="icon-btn" title="Refresh" @click="load"><RefreshCw :size="18"/></button>
        <button class="btn btn-secondary" @click="signOut"><LogOut :size="16"/>Sign out</button>
      </div>
    </header>

    <section v-if="loading" class="admin-center">Loading dashboard…</section>

    <section v-else-if="!authorized" class="admin-center admin-denied">
      <span class="eyebrow">Authenticated</span>
      <h1>Admin access not granted yet.</h1>
      <p>Your account is valid, but it is not in the NORDPAWS admin allow-list.</p>
      <div class="user-id"><span>User ID</span><code>{{ userId }}</code></div>
      <p class="muted">This ID can be promoted in the Supabase <strong>admins</strong> table.</p>
    </section>

    <template v-else>
      <section class="admin-heading">
        <div>
          <span class="eyebrow">Operations</span>
          <h1>NORDPAWS Admin</h1>
          <p>Catalog, orders, customer messages and subscribers.</p>
        </div>
        <div class="admin-stats">
          <div><strong>{{ products.length }}</strong><span>Products</span></div>
          <div><strong>{{ orders.length }}</strong><span>Orders</span></div>
          <div><strong>{{ contacts.length }}</strong><span>Messages</span></div>
          <div><strong>{{ newsletter.length }}</strong><span>Subscribers</span></div>
        </div>
      </section>

      <nav class="admin-tabs">
        <button :class="{active:tab==='products'}" @click="tab='products'"><Package :size="17"/>Products</button>
        <button :class="{active:tab==='orders'}" @click="tab='orders'"><ShoppingBag :size="17"/>Orders</button>
        <button :class="{active:tab==='messages'}" @click="tab='messages'"><Mail :size="17"/>Messages</button>
        <button :class="{active:tab==='newsletter'}" @click="tab='newsletter'"><UsersRound :size="17"/>Newsletter</button>
      </nav>

      <p v-if="feedback" class="admin-feedback success admin-page-feedback">{{ feedback }}</p>

      <section v-if="tab==='products'" class="admin-panel">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Product</th><th>Category</th><th>Price (öre)</th><th>Order</th><th>Live</th><th></th></tr></thead>
            <tbody>
              <tr v-for="product in products" :key="product.id">
                <td><input v-model="product.name" class="admin-input"></td>
                <td>{{ product.category }}</td>
                <td><input v-model.number="product.price" type="number" min="0" class="admin-input small-input"></td>
                <td><input v-model.number="product.sort_order" type="number" min="0" class="admin-input tiny-input"></td>
                <td><input v-model="product.active" type="checkbox"></td>
                <td><button class="btn btn-secondary compact" @click="saveProduct(product)">Save</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="tab==='orders'" class="admin-panel">
        <div v-if="!orders.length" class="admin-empty">No orders yet. Orders will appear here after Stripe checkout is activated.</div>
        <article v-for="order in orders" :key="order.id" class="admin-list-row">
          <div><strong>{{ order.order_number }}</strong><span>{{ order.email || 'No email' }}</span></div>
          <div><strong>{{ (order.amount_total/100).toFixed(2) }} {{ order.currency?.toUpperCase() }}</strong><span>{{ order.fulfillment_status }}</span></div>
        </article>
      </section>

      <section v-if="tab==='messages'" class="admin-panel">
        <div v-if="!contacts.length" class="admin-empty">No messages yet.</div>
        <article v-for="message in contacts" :key="message.id" class="admin-message">
          <div class="admin-message-head"><strong>{{ message.name }}</strong><span>{{ message.email }}</span></div>
          <p>{{ message.message }}</p>
          <small>{{ new Date(message.created_at).toLocaleString() }}</small>
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

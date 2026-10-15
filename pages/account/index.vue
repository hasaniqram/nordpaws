<script setup lang="ts">
import { UserRound, Mail, LogOut, Package, ShieldCheck, Truck, ArrowRight, LockKeyhole } from 'lucide-vue-next'
import type { User } from '@supabase/supabase-js'
import { formatSEK } from '~/data/products'

type OrderItem = { name: string; variantName: string | null; quantity: number; unitAmount: number }
type CustomerOrder = {
  orderNumber: string
  createdAt: string
  amountTotal: number
  currency: string
  paymentStatus: string | null
  paymentProvider: string | null
  status: string
  fulfillmentStatus: string | null
  carrier: string | null
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
  sandbox: boolean
  items: OrderItem[]
}

const config = useRuntimeConfig()
const authConfigured = computed(() => Boolean(config.public.supabaseUrl && config.public.supabasePublishableKey))
const email = ref('')
const otp = ref('')
const sentTo = ref('')
const signedUser = ref<User | null>(null)
const orders = ref<CustomerOrder[]>([])
const loading = ref(false)
const ordersLoading = ref(false)
const authenticated = ref(false)
const feedback = ref('')
const feedbackType = ref<'info' | 'error'>('info')
let unsubscribe: (() => void) | null = null

const setError = (message: string) => {
  feedbackType.value = 'error'
  feedback.value = message
}
const refreshOrders = async () => {
  const client = useSupabaseBrowser()
  if (!client || !signedUser.value?.email_confirmed_at) return
  ordersLoading.value = true
  try {
    const { data: { session } } = await client.auth.getSession()
    if (!session?.access_token) throw new Error('Din session har löpt ut. Logga in igen.')
    const result = await $fetch<{ orders: CustomerOrder[] }>('/api/account/orders', {
      headers: { Authorization: 'Bearer ' + session.access_token }
    })
    orders.value = result.orders
  } catch (err: any) {
    orders.value = []
    setError(err?.data?.statusMessage || err?.message || 'Orderhistoriken kunde inte läsas just nu.')
  } finally {
    ordersLoading.value = false
  }
}
const refreshUser = async () => {
  const client = useSupabaseBrowser()
  if (!client) return
  const { data, error } = await client.auth.getUser()
  signedUser.value = error ? null : data.user
  authenticated.value = !!signedUser.value?.email_confirmed_at && !signedUser.value?.is_anonymous
  if (authenticated.value) await refreshOrders()
  else orders.value = []
}
const sendLink = async () => {
  const client = useSupabaseBrowser()
  if (!client || loading.value) return
  const address = email.value.trim().toLowerCase()
  if (!address) return
  loading.value = true
  feedback.value = ''
  try {
    const { error } = await client.auth.signInWithOtp({
      email: address,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin + '/account'
      }
    })
    if (error) throw error
    sentTo.value = address
    feedbackType.value = 'info'
    feedback.value = 'Kontrollera din inkorg. Vi har skickat en säker inloggningslänk. Om din e-postmall innehåller en kod kan du ange den nedan.'
  } catch (err: any) {
    setError(err?.message || 'Det gick inte att skicka inloggningslänken.')
  } finally {
    loading.value = false
  }
}
const verifyCode = async () => {
  const client = useSupabaseBrowser()
  if (!client || !sentTo.value || !otp.value.trim() || loading.value) return
  loading.value = true
  feedback.value = ''
  try {
    const { error } = await client.auth.verifyOtp({ email: sentTo.value, token: otp.value.trim(), type: 'email' })
    if (error) throw error
    otp.value = ''
    await refreshUser()
  } catch (err: any) {
    setError(err?.message || 'Koden kunde inte verifieras.')
  } finally {
    loading.value = false
  }
}
const signOut = async () => {
  const client = useSupabaseBrowser()
  if (client) await client.auth.signOut()
  signedUser.value = null
  authenticated.value = false
  orders.value = []
  sentTo.value = ''
  feedback.value = ''
}
const displayDate = (date: string | null) => date
  ? new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(new Date(date)) : 'Ej angivet'
const paymentLabel = (order: CustomerOrder) => order.sandbox
  ? 'Testbeställning – inga riktiga pengar'
  : ({ paid: 'Betald', unpaid: 'Inväntar betalning', failed: 'Betalning misslyckades', pending: 'Inväntar betalning' } as Record<string, string>)[order.paymentStatus || '']
    || 'Betalningsstatus: ' + (order.paymentStatus || 'okänd')
const fulfillmentLabel = (order: CustomerOrder) => {
  if (order.sandbox) return 'Ingen leverans – test'
  if (order.deliveredAt) return 'Levererad'
  if (order.shippedAt) return 'Skickad'
  const status = order.fulfillmentStatus || order.status
  return status === 'pending' ? 'Ej skickad' : status === 'processing' ? 'Behandlas' : 'Status: ' + (status || 'ej tillgänglig')
}

onMounted(async () => {
  if (!authConfigured.value) return
  const client = useSupabaseBrowser()
  if (!client) return
  const { data } = client.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      // Defer API calls outside the Supabase auth event callback.
      window.setTimeout(() => { void refreshUser() }, 0)
    }
  })
  unsubscribe = () => data.subscription.unsubscribe()
  await refreshUser()
})
onBeforeUnmount(() => { unsubscribe?.() })
useSeoMeta({ title: 'Mitt konto', robots: 'noindex,nofollow', description: 'Hantera ditt Norrli Pets-konto och se dina beställningar.' })
</script>

<template>
  <main class="container page-shell norrli-account-page">
    <span class="eyebrow"><UserRound :size="16" aria-hidden="true" /> MITT NORRLI PETS</span>
    <div class="norrli-account-intro">
      <h1>Välkommen till ditt konto</h1>
      <p>Logga in säkert via e-post för att se dina beställningar. Vi visar endast beställningar kopplade till din verifierade e-postadress.</p>
    </div>

    <div v-if="!authConfigured" class="norrli-account-panel" role="status">
      <LockKeyhole :size="30" aria-hidden="true" />
      <h2>Kundkonton förbereds</h2>
      <p>Inloggning är ännu inte aktiverad i den här miljön. Du kan fortfarande utforska kollektionen.</p>
      <NuxtLink to="/shop" class="nordic-pill-button">Utforska sortimentet <ArrowRight :size="17" /></NuxtLink>
    </div>

    <section v-else-if="!authenticated" class="norrli-account-panel" aria-label="Logga in">
      <div class="norrli-panel-icon"><Mail :size="28" aria-hidden="true" /></div>
      <h2>Logga in med e-post</h2>
      <p>Vi skickar en engångslänk till din inkorg. Du behöver inte skapa ett lösenord.</p>
      <form class="norrli-account-form" @submit.prevent="sendLink">
        <label for="norrli-account-email">E-postadress</label>
        <input id="norrli-account-email" v-model="email" type="email" required maxlength="254" autocomplete="email" placeholder="namn@exempel.se" />
        <button type="submit" class="nordic-pill-button" :disabled="loading">
          {{ loading ? 'Skickar…' : 'Skicka inloggningslänk' }} <ArrowRight :size="17" aria-hidden="true" />
        </button>
      </form>
      <form v-if="sentTo" class="norrli-account-form norrli-otp-form" @submit.prevent="verifyCode">
        <label for="norrli-account-otp">Engångskod (om den visas i mejlet)</label>
        <input id="norrli-account-otp" v-model="otp" inputmode="numeric" autocomplete="one-time-code"
          maxlength="12" placeholder="Kod från mejlet" />
        <button class="norrli-secondary-action" type="submit" :disabled="loading || !otp.trim()">Verifiera kod</button>
      </form>
      <p class="norrli-account-note"><ShieldCheck :size="17" aria-hidden="true" /> Dina beställningar visas inte förrän e-postadressen verifierats.</p>
    </section>

    <template v-else>
      <section class="norrli-account-profile">
        <div>
          <span class="eyebrow">INLOGGAD</span>
          <h2>{{ signedUser?.email }}</h2>
          <p><ShieldCheck :size="17" aria-hidden="true" /> Verifierad e-postadress</p>
        </div>
        <button type="button" class="norrli-secondary-action" @click="signOut"><LogOut :size="16" aria-hidden="true" /> Logga ut</button>
      </section>
      <section class="norrli-order-section" aria-label="Mina beställningar">
        <div class="norrli-order-section-title">
          <div><span class="eyebrow">ORDERHISTORIK</span><h2>Mina beställningar</h2></div>
          <button type="button" class="norrli-secondary-action" :disabled="ordersLoading" @click="refreshOrders">Uppdatera</button>
        </div>
        <p v-if="ordersLoading" role="status">Hämtar dina beställningar…</p>
        <div v-else-if="orders.length" class="norrli-order-list">
          <article v-for="order in orders" :key="order.orderNumber" class="norrli-order-card">
            <div class="norrli-order-top">
              <div>
                <span class="norrli-order-label">BESTÄLLNING</span>
                <h3>{{ order.orderNumber }}</h3>
                <p>{{ displayDate(order.createdAt) }} · {{ formatSEK(order.amountTotal) }}</p>
              </div>
              <span :class="['norrli-order-tag', { 'is-sandbox': order.sandbox }]">{{ paymentLabel(order) }}</span>
            </div>
            <div class="norrli-order-fulfillment">
              <Package :size="20" aria-hidden="true" />
              <div><strong>{{ fulfillmentLabel(order) }}</strong>
                <p v-if="order.sandbox">Den här beställningen är enbart ett betalsystemstest. Ingen vara skickas.</p>
                <p v-else-if="order.carrier || order.trackingNumber">
                  <Truck :size="14" aria-hidden="true" /> {{ order.carrier || 'Transportör ej angiven' }}
                  <span v-if="order.trackingNumber"> · Kollinummer: {{ order.trackingNumber }}</span>
                </p>
                <p v-else>Spårningsuppgifter visas här när de har registrerats.</p>
              </div>
            </div>
            <details v-if="order.items.length" class="norrli-order-items">
              <summary>Visa {{ order.items.length }} orderrader</summary>
              <div v-for="(item, index) in order.items" :key="index">
                <span>{{ item.quantity }} × {{ item.name }}</span>
                <strong>{{ formatSEK(item.quantity * item.unitAmount) }}</strong>
              </div>
            </details>
          </article>
        </div>
        <div v-else class="norrli-account-empty">
          <Package :size="35" aria-hidden="true" />
          <h3>Inga beställningar hittades</h3>
          <p>Beställningar visas här när de finns registrerade på din verifierade e-postadress.</p>
          <NuxtLink to="/shop" class="nordic-pill-button">Upptäck kollektionen <ArrowRight :size="16" /></NuxtLink>
        </div>
      </section>
    </template>
    <p v-if="feedback" :class="['norrli-account-message', feedbackType]" role="status">{{ feedback }}</p>
    <div class="norrli-account-help">
      <NuxtLink to="/delivery">Leveransinformation <ArrowRight :size="15" /></NuxtLink>
      <NuxtLink to="/contact">Kontakta kundservice <ArrowRight :size="15" /></NuxtLink>
    </div>
  </main>
</template>

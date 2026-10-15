<script setup lang="ts">
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-vue-next'
import { formatSEK } from '~/data/products'

const { lines, subtotal, setQuantity, remove, hydrate } = useCart()
const loading = ref(false)
const config = useRuntimeConfig()
const stripeTestReady = computed(() => !!config.public.checkoutEnabled)
const error = ref('')
const showDetails = ref(false)
const customer = reactive({
  givenName: '',
  familyName: '',
  email: '',
  streetAndNumber: '',
  postalCode: '',
  city: ''
})

onMounted(hydrate)

const checkout = async () => {
  error.value = ''
  if (!stripeTestReady.value) {
    error.value = 'Stripe sandbox checkout is being connected. Real payments are unavailable.'
    return
  }
  if (!showDetails.value) {
    showDetails.value = true
    return
  }

  loading.value = true
  try {
    const result = await $fetch<{ url?: string; orderNumber?: string }>('/api/checkout', {
      method: 'POST',
      body: {
        lines: lines.value,
        customer: { ...customer, country: 'SE' }
      }
    })

    if (result.url) await navigateTo(result.url, { external: true })
    else error.value = 'Stripe test checkout is not available yet.'
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.data?.message || 'Checkout is being configured.'
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Your bag' })
</script>

<template>
  <main class="container page-shell cart-page">
    <NuxtLink to="/shop" class="text-link"><ArrowLeft :size="16"/>Continue shopping</NuxtLink>
    <h1>Your bag</h1>

    <div v-if="!lines.length" class="empty-state">
      <div>🐾</div><h2>Your bag is empty.</h2><p>Start with one of our everyday essentials.</p>
      <NuxtLink to="/shop" class="btn btn-primary">Shop the collection</NuxtLink>
    </div>

    <div v-else class="cart-grid">
      <section>
        <div class="cart-lines">
          <article v-for="line in lines" :key="line.key" class="cart-line">
            <div class="cart-thumb"><img v-if="line.image" :src="line.image" :alt="line.name"><span v-else>{{ line.emoji }}</span></div>
            <div class="cart-meta">
              <NuxtLink :to="`/products/${line.slug}`"><h3>{{ line.name }}</h3></NuxtLink>
              <p v-if="line.variantName" class="cart-variant">{{ line.variantName }}</p><p>{{ formatSEK(line.price) }}</p>
              <div class="quantity small">
                <button @click="setQuantity(line.key,line.quantity-1)"><Minus :size="15"/></button>
                <span>{{ line.quantity }}</span>
                <button @click="setQuantity(line.key,line.quantity+1)"><Plus :size="15"/></button>
              </div>
            </div>
            <strong>{{ formatSEK(line.price * line.quantity) }}</strong>
            <button class="trash" @click="remove(line.key)" aria-label="Remove item"><Trash2 :size="18"/></button>
          </article>
        </div>

        <form v-if="showDetails" class="checkout-details" @submit.prevent="checkout">
          <div>
            <span class="eyebrow">Delivery details</span>
            <h2>Where should we send it?</h2>
            <p>Sweden launch checkout. These details also enable Klarna where available.</p>
          </div>
          <div class="checkout-fields">
            <label>First name<input v-model="customer.givenName" required autocomplete="given-name"></label>
            <label>Last name<input v-model="customer.familyName" required autocomplete="family-name"></label>
            <label class="wide">Email<input v-model="customer.email" required type="email" autocomplete="email"></label>
            <label class="wide">Street and number<input v-model="customer.streetAndNumber" required autocomplete="street-address"></label>
            <label>Postal code<input v-model="customer.postalCode" required autocomplete="postal-code"></label>
            <label>City<input v-model="customer.city" required autocomplete="address-level2"></label>
          </div>
          <p class="checkout-country">Country: Sweden</p>
        </form>
      </section>

      <aside class="order-summary">
        <h2>Order summary</h2>
        <p class="checkout-country"><strong>Stripe sandbox — test payments only</strong></p>
        <div class="summary-row"><span>Subtotal</span><strong>{{ formatSEK(subtotal) }}</strong></div>
        <div class="summary-row"><span>Shipping</span><span>Pending supplier confirmation — test checkout only</span></div>
        <div class="summary-total"><span>Items total</span><strong>{{ formatSEK(subtotal) }}</strong></div>

        <button class="btn btn-primary checkout-btn" :disabled="loading || !stripeTestReady" @click="checkout">
          {{ loading ? 'Preparing…' : (!stripeTestReady ? 'Test checkout coming soon' : (showDetails ? 'Continue to Stripe test payment' : 'Try test checkout')) }}
        </button>

        <p class="checkout-note">Payment provider: Stripe sandbox. No real charges or deliveries. Live checkout remains blocked pending Swedish business verification, verified suppliers, VAT and shipping rules.</p>
        <p v-if="error" class="checkout-error">{{ error }}</p>
      </aside>
    </div>
  </main>
</template>

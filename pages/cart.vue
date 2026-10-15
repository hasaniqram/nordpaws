<script setup lang="ts">
import { ArrowLeft, Minus, Plus, Trash2, Truck, ShieldCheck, Info, ArrowRight } from 'lucide-vue-next'
import { formatSEK } from '~/data/products'
import { deliveryReadiness, formatSwedishPostcode } from '~/utils/deliveryReadiness'

const { lines, subtotal, setQuantity, remove, hydrate } = useCart()
const loading = ref(false)
const config = useRuntimeConfig()
const testCheckoutEnabled = computed(() => Boolean(config.public.checkoutEnabled))
const error = ref('')
const showDetails = ref(false)
const checkoutForm = ref<HTMLFormElement | null>(null)
const customer = reactive({
  givenName: '', familyName: '', email: '',
  streetAndNumber: '', postalCode: '', city: ''
})

onMounted(hydrate)

const checkout = async () => {
  error.value = ''
  if (!testCheckoutEnabled.value) {
    error.value = 'Beställningar är inte öppna ännu. Ingen betalning tas emot.'
    return
  }
  if (!showDetails.value) {
    showDetails.value = true
    return
  }
  if (!checkoutForm.value?.reportValidity()) return
  const normalizedPostcode = formatSwedishPostcode(customer.postalCode)
  if (!normalizedPostcode) {
    error.value = 'Ange ett giltigt svenskt postnummer med fem siffror.'
    return
  }

  loading.value = true
  try {
    // This existing endpoint accepts only Stripe test keys server-side.
    const result = await $fetch<{ url?: string; orderNumber?: string }>('/api/checkout', {
      method: 'POST',
      body: {
        lines: lines.value,
        customer: {
          ...customer,
          postalCode: normalizedPostcode,
          country: 'SE'
        }
      }
    })
    if (result.url) await navigateTo(result.url, { external: true })
    else error.value = 'Testbetalningen är inte tillgänglig just nu.'
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.data?.message || 'Checkout är inte tillgängligt just nu.'
  } finally {
    loading.value = false
  }
}
useSeoMeta({ title: 'Varukorg', robots: 'noindex,nofollow' })
</script>

<template>
  <main class="container page-shell cart-page norrli-cart-page">
    <NuxtLink to="/shop" class="text-link"><ArrowLeft :size="16" aria-hidden="true" /> Tillbaka till kollektionen</NuxtLink>
    <span class="eyebrow">NORRLI PETS · DIN VARUKORG</span>
    <h1>Din varukorg</h1>
    <p class="norrli-cart-intro">Spara dina favoriter inför lanseringen. Produkter, priser och leveransvillkor är preliminära.</p>

    <div v-if="!lines.length" class="empty-state">
      <div>🐾</div>
      <h2>Din varukorg är tom</h2>
      <p>Upptäck våra produktidéer och kom tillbaka när du hittat något du gillar.</p>
      <NuxtLink to="/shop" class="btn btn-primary">Utforska kollektionen</NuxtLink>
    </div>

    <div v-else class="cart-grid">
      <section>
        <div class="cart-lines">
          <article v-for="line in lines" :key="line.key" class="cart-line">
            <div class="cart-thumb">
              <img v-if="line.image" :src="line.image" :alt="line.name" />
              <span v-else>{{ line.emoji }}</span>
            </div>
            <div class="cart-meta">
              <NuxtLink :to="`/products/${line.slug}`"><h3>{{ line.name }}</h3></NuxtLink>
              <p v-if="line.variantName" class="cart-variant">{{ line.variantName }}</p>
              <p>{{ formatSEK(line.price) }}</p>
              <div class="quantity small">
                <button type="button" :aria-label="`Minska antal ${line.name}`" @click="setQuantity(line.key, line.quantity - 1)"><Minus :size="15" /></button>
                <span :aria-label="`Antal: ${line.quantity}`">{{ line.quantity }}</span>
                <button type="button" :aria-label="`Öka antal ${line.name}`" @click="setQuantity(line.key, line.quantity + 1)"><Plus :size="15" /></button>
              </div>
            </div>
            <strong>{{ formatSEK(line.price * line.quantity) }}</strong>
            <button class="trash" type="button" :aria-label="`Ta bort ${line.name}`" @click="remove(line.key)"><Trash2 :size="18" /></button>
          </article>
        </div>

        <div v-if="!testCheckoutEnabled" class="norrli-checkout-readiness">
          <Info :size="23" aria-hidden="true" />
          <div>
            <h2>Kassan öppnar senare</h2>
            <p>Vi förbereder betalningar och leveranslösningar. Du kan inte slutföra en beställning eller betala i nuläget.</p>
            <NuxtLink to="/delivery">Se vår leveransinformation <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
          </div>
        </div>

        <form v-if="showDetails && testCheckoutEnabled" ref="checkoutForm" class="checkout-details norrli-checkout-form" @submit.prevent="checkout">
          <div>
            <span class="eyebrow">ENDAST TESTKASSA</span>
            <h2>Leveransuppgifter</h2>
            <p>Detta är en testbetalning. Inga riktiga pengar eller varor byter ägare.</p>
          </div>
          <div class="checkout-fields">
            <label>Förnamn<input v-model.trim="customer.givenName" required maxlength="100" autocomplete="given-name"></label>
            <label>Efternamn<input v-model.trim="customer.familyName" required maxlength="100" autocomplete="family-name"></label>
            <label class="wide">E-post<input v-model.trim="customer.email" required maxlength="254" type="email" autocomplete="email"></label>
            <label class="wide">Gatuadress<input v-model.trim="customer.streetAndNumber" required maxlength="200" autocomplete="street-address"></label>
            <label>Postnummer<input v-model.trim="customer.postalCode" required maxlength="7" inputmode="numeric" autocomplete="postal-code" placeholder="123 45"></label>
            <label>Ort<input v-model.trim="customer.city" required maxlength="100" autocomplete="address-level2"></label>
          </div>
          <p class="checkout-country">Land: {{ deliveryReadiness.countryName }}</p>
        </form>
      </section>

      <aside class="order-summary norrli-order-summary">
        <h2>Sammanfattning</h2>
        <p class="norrli-checkout-state"><ShieldCheck :size="16" aria-hidden="true" />
          {{ testCheckoutEnabled ? 'Stripe testkassa – inga riktiga betalningar' : 'Förhandsvisning – inga betalningar' }}
        </p>
        <div class="summary-row"><span>Preliminär varusumma</span><strong>{{ formatSEK(subtotal) }}</strong></div>
        <div class="summary-row"><span>Frakt</span><span>Inte fastställd</span></div>
        <div class="summary-total"><span>Varusumma före frakt</span><strong>{{ formatSEK(subtotal) }}</strong></div>
        <button type="button" class="btn btn-primary checkout-btn" :disabled="loading || !testCheckoutEnabled" @click="checkout">
          {{ loading ? 'Förbereder…' : !testCheckoutEnabled ? 'Beställningar är inte öppna' : showDetails ? 'Fortsätt till Stripe testbetalning' : 'Testa kassan' }}
        </button>
        <p class="checkout-note">{{ testCheckoutEnabled ? 'Enbart Stripe sandbox. Inga riktiga avgifter eller leveranser.' : 'Frakt, moms och leveranstider bekräftas före lansering. Summan är inte ett köpåtagande.' }}</p>
        <p v-if="error" class="checkout-error" role="alert">{{ error }}</p>
        <div class="norrli-cart-links">
          <NuxtLink to="/delivery"><Truck :size="16" aria-hidden="true" /> Leveransinformation</NuxtLink>
          <NuxtLink to="/account">Mitt konto <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
        </div>
      </aside>
    </div>
  </main>
</template>

<script setup lang="ts">
import { Clock3, CheckCircle2, AlertCircle } from 'lucide-vue-next'

const route = useRoute()
const { clear } = useCart()
const order = computed(() => typeof route.query.order === 'string' ? route.query.order : '')
const sessionId = computed(() => typeof route.query.session_id === 'string' ? route.query.session_id : '')
const state = ref<'loading' | 'paid' | 'pending' | 'error'>('loading')

onMounted(async () => {
  if (!order.value || !sessionId.value) {
    state.value = 'pending'
    return
  }
  try {
    const result = await $fetch<{ paid: boolean; sandbox: boolean }>('/api/stripe/session-status', {
      query: { session_id: sessionId.value, order: order.value }
    })
    if (result.paid && result.sandbox) {
      state.value = 'paid'
      clear()
    } else {
      state.value = 'pending'
    }
  } catch {
    state.value = 'error'
  }
})

useSeoMeta({
  title: 'Stripe test payment status',
  robots: 'noindex,nofollow'
})
</script>

<template>
  <main class="container centered-page">
    <CheckCircle2 v-if="state === 'paid'" :size="54" aria-hidden="true" />
    <AlertCircle v-else-if="state === 'error'" :size="54" aria-hidden="true" />
    <Clock3 v-else :size="54" aria-hidden="true" />

    <span class="eyebrow">Norrli Pets · Stripe sandbox</span>
    <h1 v-if="state === 'paid'">Your test payment succeeded.</h1>
    <h1 v-else-if="state === 'loading'">Checking your test payment…</h1>
    <h1 v-else-if="state === 'error'">We couldn't verify this test payment.</h1>
    <h1 v-else>Payment not yet confirmed.</h1>

    <p v-if="state === 'paid'">
      Stripe confirms this sandbox payment. No real money moved and no product will be shipped.
      <span v-if="order"> Reference: <strong>{{ order }}</strong>.</span>
    </p>
    <p v-else>
      Your bag remains saved. Please check the test payment in your Stripe sandbox
      before trying checkout again.
      <span v-if="order"> Reference: <strong>{{ order }}</strong>.</span>
    </p>
    <NuxtLink to="/shop" class="btn btn-primary">Back to shop</NuxtLink>
  </main>
</template>

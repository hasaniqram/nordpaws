<script setup lang="ts">
import { Clock3 } from 'lucide-vue-next'

const route = useRoute()
const order = computed(() => typeof route.query.order === 'string' ? route.query.order : '')
useSeoMeta({
  title: 'Payment confirmation pending',
  description: 'Your Norrli Pets payment is being verified.'
})
</script>

<template>
  <main class="container centered-page">
    <Clock3 :size="54" aria-hidden="true" />
    <span class="eyebrow">Awaiting payment verification</span>
    <h1>We’re checking your payment.</h1>
    <p>
      Returning from Mollie does not necessarily mean the payment succeeded.
      We will confirm the order after Mollie reports a successful payment.
      <span v-if="order"> Your reference is <strong>{{ order }}</strong>.</span>
    </p>
    <p>
      Please wait for your order confirmation before attempting payment again.
      Your shopping bag has been preserved until we can verify your order.
    </p>
    <NuxtLink to="/shop" class="btn btn-primary">Back to shop</NuxtLink>
  </main>
</template>

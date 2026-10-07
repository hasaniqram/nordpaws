<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next'
const { clear } = useCart()
const route = useRoute()
const order = computed(() => typeof route.query.order === 'string' ? route.query.order : '')
onMounted(clear)
useSeoMeta({ title: 'Payment received' })
</script>

<template>
  <main class="container centered-page">
    <CheckCircle2 :size="54"/>
    <span class="eyebrow">Payment submitted</span>
    <h1>Thank you.</h1>
    <p>Your payment is being confirmed. <span v-if="order">Reference: <strong>{{ order }}</strong>.</span> Once confirmed, your order is saved and the confirmation email is sent automatically.</p>
    <NuxtLink to="/shop" class="btn btn-primary">Back to shop</NuxtLink>
  </main>
</template>

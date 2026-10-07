<script setup lang="ts">
import { CheckCircle2 } from 'lucide-vue-next'
const { clear } = useCart()
onMounted(clear)
useSeoMeta({ title: 'Order confirmed' })
</script>
<template><main class="container centered-page"><CheckCircle2 :size="54"/><span class="eyebrow">Order confirmed</span><h1>Thank you.</h1><p>Your order is being prepared. When live payments are enabled, an order confirmation will be sent automatically by email.</p><NuxtLink to="/shop" class="btn btn-primary">Back to shop</NuxtLink></main></template>

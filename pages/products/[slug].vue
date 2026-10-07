<script setup lang="ts">
import { Check, Minus, Plus, ShieldCheck, Truck } from 'lucide-vue-next'
import { formatSEK, type Product } from '~/data/products'

const route = useRoute()
const { data: catalog } = await useFetch<{ products: Product[]; source: string }>('/api/products')
const product = (catalog.value?.products || []).find((p) => p.slug === route.params.slug)

if (!product) throw createError({ statusCode: 404, statusMessage: 'Product not found' })

const quantity = ref(1)
const { add } = useCart()
const added = ref(false)
const addToCart = () => {
  add(product, quantity.value)
  added.value = true
  setTimeout(() => added.value = false, 1200)
}

useSeoMeta({ title: product.name, description: product.description })
</script>

<template>
  <main class="container product-page">
    <div class="product-detail-art" :style="{ background: product.gradient }"><span v-if="product.badge" class="badge">{{ product.badge }}</span><span class="detail-emoji">{{ product.emoji }}</span><span class="art-caption">NORDPAWS / {{ product.category.toUpperCase() }}</span></div>
    <div class="product-detail-copy">
      <span class="eyebrow">{{ product.category }}</span><h1>{{ product.name }}</h1><p class="subtitle">{{ product.subtitle }}</p>
      <div class="detail-price"><strong>{{ formatSEK(product.price) }}</strong><del v-if="product.compareAt">{{ formatSEK(product.compareAt) }}</del></div>
      <p class="description">{{ product.description }}</p>
      <ul class="feature-list"><li v-for="feature in product.features" :key="feature"><Check :size="17"/>{{ feature }}</li></ul>
      <div class="buy-row"><div class="quantity"><button @click="quantity=Math.max(1,quantity-1)"><Minus :size="17"/></button><span>{{ quantity }}</span><button @click="quantity=Math.min(10,quantity+1)"><Plus :size="17"/></button></div><button class="btn btn-primary buy-btn" @click="addToCart">{{ added ? 'Added to bag' : 'Add to bag' }}</button></div>
      <div class="purchase-notes"><div><Truck :size="20"/><span><strong>Sweden delivery</strong>Tracked delivery options at checkout.</span></div><div><ShieldCheck :size="20"/><span><strong>Secure payment</strong>Mollie checkout with Swedish payment methods when enabled.</span></div></div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ArrowRight, ShoppingBag } from 'lucide-vue-next'
import { formatSEK, type Product } from '~/data/products'
const props = defineProps<{ product: Product }>()
const { add } = useCart()
const added = ref(false)
const quickAdd = () => {
  add(props.product)
  added.value = true
  setTimeout(() => added.value = false, 1000)
}
</script>

<template>
  <article class="product-card">
    <NuxtLink :to="`/products/${product.slug}`" class="product-art" :style="{ background: product.gradient }">
      <span v-if="product.badge" class="badge">{{ product.badge }}</span>
      <span class="product-emoji" aria-hidden="true">{{ product.emoji }}</span>
    </NuxtLink>
    <div class="product-info">
      <div>
        <NuxtLink :to="`/products/${product.slug}`"><h3>{{ product.name }}</h3></NuxtLink>
        <p>{{ product.subtitle }}</p>
      </div>
      <div class="price-row"><strong>{{ formatSEK(product.price) }}</strong><del v-if="product.compareAt">{{ formatSEK(product.compareAt) }}</del></div>
      <button class="btn btn-secondary product-add" @click="quickAdd"><ShoppingBag :size="17"/>{{ added ? 'Added' : 'Add to bag' }}</button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ShoppingBag } from 'lucide-vue-next'
import { formatSEK, type Product } from '~/data/products'

const props = defineProps<{ product: Product }>()
const { add } = useCart()
const config = useRuntimeConfig()
const previewOnly = computed(() => !config.public.checkoutEnabled)
const added = ref(false)
const imageFailed = ref(false)

const quickAdd = () => {
  if (previewOnly.value) return navigateTo(`/products/${props.product.slug}`)
  if (props.product.variants?.length) {
    return navigateTo(`/products/${props.product.slug}`)
  }
  add(props.product)
  added.value = true
  setTimeout(() => added.value = false, 1000)
}
</script>

<template>
  <article class="product-card">
    <NuxtLink :to="`/products/${product.slug}`" class="product-art" :style="{ background: product.gradient }">
      <span v-if="product.badge" class="badge">{{ product.badge }}</span>
      <img v-if="product.primaryImage && !imageFailed" class="product-card-image" :src="product.primaryImage" :alt="product.name" loading="lazy" decoding="async" width="640" height="640" @error="imageFailed = true">
      <span v-else class="product-emoji" aria-hidden="true">{{ product.emoji }}</span>
      <span v-if="product.primaryImage && product.primaryIsConcept" class="catalog-concept-label">Concept image</span>
    </NuxtLink>
    <div class="product-info">
      <div>
        <NuxtLink :to="`/products/${product.slug}`"><h3>{{ product.name }}</h3></NuxtLink>
        <p>{{ product.subtitle }}</p>
      </div>
      <div class="price-row">
        <strong>{{ formatSEK(product.price) }}</strong>
        <del v-if="product.compareAt && !previewOnly">{{ formatSEK(product.compareAt) }}</del>
      </div>
      <span v-if="previewOnly" class="product-preview-caption">Indicative price · concept product</span>
      <button class="btn btn-secondary product-add" @click="quickAdd">
        <ShoppingBag :size="17"/>
        {{ previewOnly ? 'View concept details' : (product.variants?.length ? 'Choose options' : (added ? 'Added' : 'Add to bag')) }}
      </button>
    </div>
  </article>
</template>

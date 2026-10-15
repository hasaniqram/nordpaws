<script setup lang="ts">
import { ShoppingBag, Heart, ArrowRight } from 'lucide-vue-next'
import { formatSEK, type Product } from '~/data/products'

const props = defineProps<{ product: Product }>()
const { add } = useCart()
const { has, toggle, load } = useNorrliFavorites()
const config = useRuntimeConfig()
const previewOnly = computed(() => !config.public.checkoutEnabled)
const added = ref(false)
const imageFailed = ref(false)
onMounted(load)

const quickAdd = () => {
  if (previewOnly.value || props.product.variants?.length) {
    return navigateTo(`/products/${props.product.slug}`)
  }
  add(props.product)
  added.value = true
  window.setTimeout(() => added.value = false, 1100)
}
</script>

<template>
  <article class="product-card nordic-product-card">
    <div class="product-art nordic-product-art" :style="{ background: product.gradient }">
      <NuxtLink :to="`/products/${product.slug}`" class="nordic-art-link" :aria-label="`Visa ${product.name}`">
        <img v-if="product.primaryImage && !imageFailed" class="product-card-image"
          :src="product.primaryImage" :alt="product.name" loading="lazy"
          decoding="async" width="640" height="640" @error="imageFailed=true"/>
        <span v-else class="product-emoji" aria-hidden="true">{{ product.emoji }}</span>
      </NuxtLink>
      <button class="nordic-favorite-button" type="button" :aria-label="has(product.slug) ? 'Ta bort från favoriter' : 'Spara som favorit'"
        :aria-pressed="has(product.slug)" @click="toggle(product.slug)">
        <Heart :size="19" :fill="has(product.slug) ? 'currentColor' : 'none'"/>
      </button>
      <span v-if="product.primaryIsConcept" class="nordic-concept-flag">Konceptbild</span>
    </div>
    <div class="product-info nordic-product-info">
      <span class="nordic-product-type">{{ product.category === 'Clean Home' ? 'Hem & rengöring' : product.category === 'Travel' ? 'Resa & utflykt' : product.category === 'Dogs' ? 'Hund' : 'Katt' }}</span>
      <NuxtLink :to="`/products/${product.slug}`"><h3>{{ product.name }}</h3></NuxtLink>
      <p>{{ product.subtitle }}</p>
      <div class="price-row">
        <strong>{{ formatSEK(product.price) }}</strong>
        <del v-if="product.compareAt && !previewOnly">{{ formatSEK(product.compareAt) }}</del>
      </div>
      <span v-if="previewOnly" class="nordic-price-caption">Preliminärt pris · Produktidé</span>
      <button class="btn btn-primary product-add nordic-product-button" @click="quickAdd">
        <ArrowRight v-if="previewOnly" :size="16"/>
        <ShoppingBag v-else :size="16"/>
        {{ previewOnly ? 'Upptäck produkten' : product.variants?.length ? 'Välj alternativ' : added ? 'Tillagd' : 'Lägg i varukorg' }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { Check, Minus, Plus, ShieldCheck, Truck } from 'lucide-vue-next'
import { formatSEK, type Product, type ProductVariant } from '~/data/products'

const route = useRoute()
const config = useRuntimeConfig()
const previewOnly = computed(() => !config.public.checkoutEnabled)
const { data: catalog } = await useFetch<{ products: Product[]; source: string }>('/api/products')
const product = (catalog.value?.products || []).find((p) => p.slug === route.params.slug)

if (!product) throw createError({ statusCode: 404, statusMessage: 'Product not found' })

const quantity = ref(1)
const { add } = useCart()
const added = ref(false)
const selectedVariantId = ref(product.variants?.[0]?.id || '')
const selectedImage = ref(product.primaryImage || product.images?.[0]?.publicUrl || '')
const imageFailed = ref(false)
watch(selectedImage, () => { imageFailed.value = false })
const selectedImageIsConcept = computed(() => product.images?.find(image => image.publicUrl === selectedImage.value)?.isConcept ?? product.primaryIsConcept ?? false)

const selectedVariant = computed<ProductVariant | null>(() =>
  product.variants?.find((variant) => variant.id === selectedVariantId.value) || null
)

const displayPrice = computed(() => selectedVariant.value?.price ?? product.price)
const outOfStock = computed(() =>
  selectedVariant.value?.stockQuantity != null && selectedVariant.value.stockQuantity <= 0
)

const addToCart = () => {
  if (previewOnly.value) return
  if (product.variants?.length && !selectedVariant.value) return
  if (outOfStock.value) return
  add(product, quantity.value, selectedVariant.value)
  added.value = true
  setTimeout(() => added.value = false, 1200)
}

useSeoMeta({ title: product.name, description: product.description })
</script>

<template>
  <main class="container product-page">
    <section class="product-gallery">
      <div class="product-detail-art" :style="{ background: product.gradient }">
        <span v-if="product.badge" class="badge">{{ product.badge }}</span>
        <img v-if="selectedImage && !imageFailed" class="detail-product-image" :src="selectedImage" :alt="product.name" decoding="async" width="768" height="768" @error="imageFailed = true">
        <span v-else class="detail-emoji">{{ product.emoji }}</span>
        <span class="art-caption">Norrli Pets / {{ product.category.toUpperCase() }}</span>
      </div>
      <p v-if="selectedImageIsConcept" class="product-concept-note">Illustrative AI concept image. Final product appearance and specifications will be confirmed after supplier selection.</p>
      <div v-if="product.images?.length" class="product-thumbs">
        <button
          v-for="image in product.images"
          :key="image.id"
          :class="['product-thumb-btn',{active:selectedImage===image.publicUrl}]"
          @click="selectedImage=image.publicUrl"
        >
          <img :src="image.publicUrl" :alt="image.altText || product.name" loading="lazy" width="80" height="80">
        </button>
      </div>
    </section>

    <div class="product-detail-copy">
      <span class="eyebrow">{{ product.category }}</span>
      <h1>{{ product.name }}</h1>
      <p class="subtitle">{{ product.subtitle }}</p>
      <div class="detail-price">
        <strong>{{ formatSEK(displayPrice) }}</strong>
        <del v-if="product.compareAt && !selectedVariant?.price && !previewOnly">{{ formatSEK(product.compareAt) }}</del>
      </div>
      <p v-if="previewOnly" class="product-concept-note">Preview only. Indicative price and product details are subject to confirmation with an actual supplier. Orders are not being accepted.</p>
      <p class="description">{{ product.description }}</p>

      <div v-if="product.variants?.length" class="variant-picker">
        <label>Choose option</label>
        <div class="variant-options">
          <button
            v-for="variant in product.variants"
            :key="variant.id"
            :class="['variant-option',{active:selectedVariantId===variant.id}]"
            :disabled="variant.stockQuantity === 0"
            @click="selectedVariantId=variant.id"
          >
            <span>{{ variant.name }}</span>
            <small v-if="variant.price && variant.price !== product.price">{{ formatSEK(variant.price) }}</small>
            <small v-if="variant.stockQuantity === 0">Sold out</small>
          </button>
        </div>
      </div>

      <ul class="feature-list">
        <li v-for="feature in product.features" :key="feature"><Check :size="17"/>{{ feature }}</li>
      </ul>

      <dl v-if="product.material || product.dimensions || product.weightGrams" class="product-specs">
        <div v-if="product.material"><dt>Material</dt><dd>{{ product.material }}</dd></div>
        <div v-if="product.dimensions"><dt>Dimensions</dt><dd>{{ product.dimensions }}</dd></div>
        <div v-if="product.weightGrams"><dt>Weight</dt><dd>{{ product.weightGrams }} g</dd></div>
      </dl>

      <div v-if="!previewOnly" class="buy-row">
        <div class="quantity">
          <button @click="quantity=Math.max(1,quantity-1)"><Minus :size="17"/></button>
          <span>{{ quantity }}</span>
          <button @click="quantity=Math.min(10,quantity+1)"><Plus :size="17"/></button>
        </div>
        <button class="btn btn-primary buy-btn" :disabled="outOfStock" @click="addToCart">
          {{ outOfStock ? 'Sold out' : (added ? 'Added to bag' : 'Add to bag') }}
        </button>
      </div>

      <div v-if="!previewOnly" class="purchase-notes">
        <div>
          <Truck :size="20"/>
          <span>
            <strong>Sweden delivery</strong>
            <template v-if="product.deliveryMinDays && product.deliveryMaxDays">
              Estimated {{ product.deliveryMinDays }}–{{ product.deliveryMaxDays }} business days.
            </template>
            <template v-else>Tracked delivery options at checkout.</template>
          </span>
        </div>
        <div><ShieldCheck :size="20"/><span><strong>Secure payment</strong>Stripe checkout when the store is legally and operationally ready.</span></div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { Heart, ArrowLeft, ArrowRight, Trash2 } from 'lucide-vue-next'
import type { Product } from '~/data/products'
import { recommendFromFavorites } from '~/utils/privacyRecommendations.mjs'
const { favorites, load, clear } = useNorrliFavorites()
const { data: catalog, status } = await useFetch<{ products: Product[]; source: string }>('/api/products')
const saved = computed(() => (catalog.value?.products || [])
  .filter(p => favorites.value.includes(p.slug))
  .sort((a,b) => favorites.value.indexOf(b.slug) - favorites.value.indexOf(a.slug)))
const recommended = computed(() => recommendFromFavorites(catalog.value?.products||[], favorites.value,4))
onMounted(load)
const confirmClear = () => {
  if (import.meta.client && window.confirm('Vill du verkligen ta bort alla dina sparade favoriter?')) clear()
}
useSeoMeta({ title: 'Mina favoriter', description: 'Dina sparade produktidéer hos Norrli Pets.' })
</script>

<template>
  <main class="container page-shell nordic-favorites-page norrli-favorites">
    <span class="eyebrow"><Heart :size="16" aria-hidden="true" /> MIN NORRLI-LISTA</span>
    <div class="norrli-favorites-heading">
      <div>
        <h1>Mina favoriter</h1>
        <p>Spara dina favoriter och kom tillbaka när du vill. Listan lagras endast i den här webbläsaren.</p>
      </div>
      <div v-if="saved.length" class="norrli-favorites-heading-actions">
        <span class="norrli-saved-count">{{ saved.length }} sparade</span>
        <button type="button" class="norrli-remove-all" @click="confirmClear">
          <Trash2 :size="16" aria-hidden="true" /> Rensa listan
        </button>
      </div>
    </div>
    <div v-if="status === 'pending'" class="catalog-state" role="status">Laddar favoriter…</div>
    <div v-else-if="status === 'error'" class="catalog-state" role="alert">Favoriterna kunde inte laddas just nu.</div>
    <template v-else-if="saved.length">
      <div class="nordic-featured-grid norrli-saved-grid">
        <ProductCard v-for="product in saved" :key="product.id" :product="product" />
      </div>
      <section v-if="recommended.length" class="norrli-private-recommendations" aria-labelledby="norrli-for-you"><span class="eyebrow">UTVALT EFTER DINA FAVORITER</span><h2 id="norrli-for-you">Fler idéer att upptäcka</h2><p>Förslagen baseras bara på favoriter som sparats i din webbläsare. Ingen personlig spårning används.</p><div class="nordic-featured-grid norrli-saved-grid"><ProductCard v-for="product in recommended" :key="product.id" :product="product"/></div></section>
      <NuxtLink to="/shop" class="norrli-keep-exploring">Utforska fler produktidéer <ArrowRight :size="17" aria-hidden="true" /></NuxtLink>
    </template>
    <div v-else class="nordic-favorites-empty">
      <Heart :size="38" aria-hidden="true" />
      <h2>Din favoritlista är tom</h2>
      <p>Tryck på hjärtat vid en produkt för att spara den här.</p>
      <NuxtLink to="/shop" class="nordic-pill-button"><ArrowLeft :size="16" aria-hidden="true" /> Utforska kollektionen</NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
import { Heart, ArrowLeft } from 'lucide-vue-next'
import type { Product } from '~/data/products'
const {favorites,load}=useNorrliFavorites()
const {data:catalog,status}=await useFetch<{products:Product[];source:string}>('/api/products')
const saved=computed(()=>(catalog.value?.products||[]).filter(p=>favorites.value.includes(p.slug)))
onMounted(load)
useSeoMeta({title:'Mina favoriter',description:'Sparade produktidéer hos Norrli Pets.'})
</script>
<template>
  <main class="container page-shell nordic-favorites-page">
    <span class="eyebrow"><Heart :size="16"/> MIN NORRLI-LISTA</span>
    <h1>Mina favoriter</h1>
    <p>Spara de produktidéer du gillar och hitta dem enkelt igen på den här enheten.</p>
    <div v-if="status==='pending'" class="catalog-state">Laddar favoriter…</div>
    <div v-else-if="saved.length" class="nordic-featured-grid">
      <ProductCard v-for="product in saved" :key="product.id" :product="product"/>
    </div>
    <div v-else class="nordic-favorites-empty">
      <Heart :size="38"/>
      <h2>Din favoritlista är tom</h2>
      <p>Tryck på hjärtat vid en produkt för att spara den här.</p>
      <NuxtLink to="/shop" class="nordic-pill-button"><ArrowLeft :size="16"/> Utforska kollektionen</NuxtLink>
    </div>
  </main>
</template>

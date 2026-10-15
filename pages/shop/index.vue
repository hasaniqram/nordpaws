<script setup lang="ts">
import { Search, SlidersHorizontal } from 'lucide-vue-next'
import type { Product } from '~/data/products'

const route = useRoute()
const category = computed(() => typeof route.query.category === 'string' ? route.query.category : '')
const categories = ['All', 'Dogs', 'Cats', 'Travel', 'Clean Home']
const labelFor = (value: string) => ({ All:'Alla', Dogs:'Hund', Cats:'Katt', Travel:'Promenad & resa', 'Clean Home':'Hemmet' }[value] || value)
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
watch(() => route.query.q, value => { search.value = typeof value === 'string' ? value : '' })
const sort = ref('featured')

const { data: catalog, status } = await useFetch<{ products: Product[]; source: string }>('/api/products')

const visible = computed(() => {
  let list = [...(catalog.value?.products || [])]
  if (category.value) list = list.filter((p) => p.category === category.value)
  const query = search.value.trim().toLowerCase()
  if (query) {
    list = list.filter((p) =>
      [p.name, p.subtitle, p.description, p.category].some((field) => field.toLowerCase().includes(query))
    )
  }
  if (sort.value === 'price-asc') list.sort((a, b) => a.price - b.price)
  if (sort.value === 'price-desc') list.sort((a, b) => b.price - a.price)
  if (sort.value === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
  return list
})

const setCategory = (value: string) => navigateTo(value === 'All' ? '/shop' : `/shop?category=${encodeURIComponent(value)}`)
useSeoMeta({ title: 'Alla produktidéer', description:'Utforska vår nordiskt inspirerade kollektion för hund och katt.' })
</script>

<template>
  <main class="container page-shell">
    <div class="shop-title norrli-shop-intro"><div><span class="eyebrow">NORRLI PETS · KOLLEKTION</span><h1>Hitta dina favoriter</h1><p>Skandinavisk inspiration för livet med hund och katt. Här hittar du våra produktidéer.</p></div><span v-if="status !== 'pending'" class="norrli-shop-count" aria-live="polite">{{ visible.length }} produktidéer</span></div>

    <div class="shop-toolbar">
      <label class="search-box"><Search :size="18"/><input v-model="search" type="search" placeholder="Sök produkter" aria-label="Sök produkter"></label>
      <label class="sort-box"><SlidersHorizontal :size="17"/><select v-model="sort" aria-label="Sortera produkter"><option value="featured">Utvalda</option><option value="price-asc">Pris: lägst först</option><option value="price-desc">Pris: högst först</option><option value="name">Namn</option></select></label>
    </div>

    <div class="filter-row"><button v-for="item in categories" :key="item" :class="['filter-chip', { active: (item === 'All' && !category) || item === category }]" @click="setCategory(item)">{{ labelFor(item) }}</button></div>

    <div v-if="status === 'pending'" class="catalog-state">Laddar kollektionen…</div>
    <div v-else-if="visible.length" class="product-grid"><ProductCard v-for="product in visible" :key="product.id" :product="product"/></div>
    <div v-else class="catalog-state norrli-shop-empty"><p>Inga produkter matchar din sökning.</p><NuxtLink to="/shop">Visa alla produkter</NuxtLink></div>
  </main>
</template>

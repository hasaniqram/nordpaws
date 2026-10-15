<script setup lang="ts">
import { Search, SlidersHorizontal, Heart, X, ArrowRight } from 'lucide-vue-next'
import type { Product } from '~/data/products'

const route = useRoute()
const { favorites, load } = useNorrliFavorites()
onMounted(load)

const categories = ['All', 'Dogs', 'Cats', 'Travel', 'Clean Home'] as const
const labels: Record<string, string> = {
  All: 'Alla', Dogs: 'Hund', Cats: 'Katt', Travel: 'Promenad & resa', 'Clean Home': 'Hem & rengöring'
}
const category = computed(() => {
  const value = typeof route.query.category === 'string' ? route.query.category : ''
  return categories.includes(value as typeof categories[number]) ? value : ''
})
const query = computed(() => typeof route.query.q === 'string' ? route.query.q.trim() : '')
const search = ref(query.value)
watch(query, value => { search.value = value })

const sort = computed(() => {
  const value = route.query.sort
  return value === 'price-asc' || value === 'price-desc' || value === 'name' ? value : 'featured'
})
const price = computed(() => {
  const value = route.query.price
  return value === 'under-250' || value === '250-400' || value === 'over-400' ? value : 'all'
})
const favoritesOnly = computed(() => route.query.fav === '1')

const { data: catalog, status } = await useFetch<{ products: Product[]; source: string }>('/api/products')

const normalized = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('sv-SE')
const visible = computed(() => {
  let list = [...(catalog.value?.products || [])]
  if (category.value) list = list.filter(p => p.category === category.value)
  if (favoritesOnly.value) list = list.filter(p => favorites.value.includes(p.slug))
  if (price.value === 'under-250') list = list.filter(p => p.price < 25000)
  if (price.value === '250-400') list = list.filter(p => p.price >= 25000 && p.price <= 40000)
  if (price.value === 'over-400') list = list.filter(p => p.price > 40000)
  const term = normalized(query.value)
  if (term) {
    list = list.filter(p => normalized([
      p.name, p.subtitle, p.description, labels[p.category] || p.category,
      ...(p.features || []), p.material || ''
    ].join(' ')).includes(term))
  }
  if (sort.value === 'price-asc') list.sort((a,b) => a.price - b.price)
  if (sort.value === 'price-desc') list.sort((a,b) => b.price - a.price)
  if (sort.value === 'name') list.sort((a,b) => a.name.localeCompare(b.name, 'sv'))
  return list
})
const activeFilters = computed(() => Boolean(category.value || query.value || price.value !== 'all' || favoritesOnly.value || sort.value !== 'featured'))
const updateFilters = (patch: Record<string, string | undefined>) => {
  const next: Record<string, string> = {}
  for (const key of ['category', 'q', 'sort', 'price', 'fav']) {
    const value = route.query[key]
    if (typeof value === 'string' && value) next[key] = value
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value) next[key] = value
    else delete next[key]
  }
  return navigateTo({ path: '/shop', query: next })
}
const applySearch = () => updateFilters({q: search.value.trim().slice(0, 120) || undefined})
const clearSearch = () => {
  search.value = ''
  return updateFilters({q: undefined})
}
const resetFilters = () => {
  search.value = ''
  return navigateTo('/shop')
}
const setCategory = (value: string) => updateFilters({category: value === 'All' ? undefined : value})
const setSort = (event: Event) => updateFilters({
  sort: (event.target as HTMLSelectElement).value === 'featured' ? undefined : (event.target as HTMLSelectElement).value
})
const setPrice = (event: Event) => updateFilters({
  price: (event.target as HTMLSelectElement).value === 'all' ? undefined : (event.target as HTMLSelectElement).value
})

useSeoMeta({
  title: 'Alla produktidéer',
  description: 'Filtrera och upptäck nordiskt inspirerade produktidéer för hund och katt hos Norrli Pets.'
})
</script>

<template>
  <main class="container page-shell norrli-collection">
    <div class="shop-title norrli-shop-intro">
      <div>
        <span class="eyebrow">NORRLI PETS · KOLLEKTION</span>
        <h1>Hitta dina favoriter</h1>
        <p>Omsorgsfullt utvalda idéer för vardagen med hund och katt. Utforska, jämför och spara till senare.</p>
      </div>
      <span v-if="status !== 'pending'" class="norrli-shop-count" aria-live="polite">
        {{ visible.length }} {{ visible.length === 1 ? 'produktidé' : 'produktidéer' }}
      </span>
    </div>

    <section class="norrli-discovery" aria-label="Filtrera kollektionen">
      <div class="norrli-discovery-primary">
        <form class="norrli-search" role="search" @submit.prevent="applySearch">
          <Search :size="19" aria-hidden="true" />
          <input v-model="search" maxlength="120" type="search" placeholder="Sök bland alla produktidéer…"
            aria-label="Sök produktidéer" autocomplete="off" />
          <button v-if="query || search" type="button" aria-label="Rensa sökning" class="norrli-search-clear"
            @click="clearSearch"><X :size="16" aria-hidden="true" /></button>
          <button type="submit" class="norrli-search-submit">Sök <ArrowRight :size="16" aria-hidden="true" /></button>
        </form>
        <div class="norrli-selects">
          <label class="norrli-select">
            <span>Pris</span>
            <select :value="price" aria-label="Filtrera efter pris" @change="setPrice">
              <option value="all">Alla priser</option>
              <option value="under-250">Under 250 kr</option>
              <option value="250-400">250–400 kr</option>
              <option value="over-400">Över 400 kr</option>
            </select>
          </label>
          <label class="norrli-select">
            <SlidersHorizontal :size="17" aria-hidden="true" />
            <span>Sortera</span>
            <select :value="sort" aria-label="Sortera produktidéer" @change="setSort">
              <option value="featured">Utvalda</option>
              <option value="price-asc">Pris: lägst först</option>
              <option value="price-desc">Pris: högst först</option>
              <option value="name">Namn A–Ö</option>
            </select>
          </label>
        </div>
      </div>

      <div class="norrli-discovery-secondary">
        <div class="norrli-filter-chips" role="group" aria-label="Välj kategori">
          <button v-for="item in categories" :key="item" type="button" class="filter-chip"
            :class="{ active: (item === 'All' && !category) || item === category }"
            :aria-pressed="(item === 'All' && !category) || item === category"
            @click="setCategory(item)">{{ labels[item] }}</button>
        </div>
        <div class="norrli-filter-actions">
          <button type="button" class="norrli-favorites-filter" :aria-pressed="favoritesOnly"
            @click="updateFilters({fav: favoritesOnly ? undefined : '1'})">
            <Heart :size="16" :fill="favoritesOnly ? 'currentColor' : 'none'" aria-hidden="true" />
            Endast favoriter
          </button>
          <button v-if="activeFilters" type="button" class="norrli-reset" @click="resetFilters">
            <X :size="15" aria-hidden="true" /> Rensa filter
          </button>
        </div>
      </div>
    </section>

    <div v-if="status === 'pending'" class="catalog-state" role="status">Laddar kollektionen…</div>
    <div v-else-if="status === 'error'" class="catalog-state" role="alert">
      Sortimentet kunde inte laddas just nu. Försök igen senare.
    </div>
    <div v-else-if="visible.length" class="product-grid norrli-collection-grid" aria-live="polite">
      <ProductCard v-for="product in visible" :key="product.id" :product="product" />
    </div>
    <div v-else class="catalog-state norrli-shop-empty">
      <Search :size="31" aria-hidden="true" />
      <h2>Vi hittade inga matchningar</h2>
      <p>{{ favoritesOnly ? 'Inga sparade favoriter matchar dessa filter.' : 'Prova ett annat sökord eller välj en annan kategori.' }}</p>
      <button type="button" class="norrli-clear-all" @click="resetFilters">Visa hela kollektionen <ArrowRight :size="17" aria-hidden="true" /></button>
    </div>
    <p class="norrli-collection-note">Priser och produktbilder är preliminära tills sortiment och leverantörer har bekräftats.</p>
  </main>
</template>

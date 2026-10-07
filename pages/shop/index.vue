<script setup lang="ts">
import { Search, SlidersHorizontal } from 'lucide-vue-next'
import type { Product } from '~/data/products'

const route = useRoute()
const category = computed(() => typeof route.query.category === 'string' ? route.query.category : '')
const categories = ['All', 'Dogs', 'Cats', 'Travel', 'Clean Home']
const search = ref('')
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
useSeoMeta({ title: 'Shop' })
</script>

<template>
  <main class="container page-shell">
    <div class="shop-title"><span class="eyebrow">NORDPAWS collection</span><h1>Shop essentials</h1><p>Useful, considered products for life with dogs and cats.</p></div>

    <div class="shop-toolbar">
      <label class="search-box"><Search :size="18"/><input v-model="search" type="search" placeholder="Search products" aria-label="Search products"></label>
      <label class="sort-box"><SlidersHorizontal :size="17"/><select v-model="sort" aria-label="Sort products"><option value="featured">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name</option></select></label>
    </div>

    <div class="filter-row"><button v-for="item in categories" :key="item" :class="['filter-chip', { active: (item === 'All' && !category) || item === category }]" @click="setCategory(item)">{{ item }}</button></div>

    <div v-if="status === 'pending'" class="catalog-state">Loading the collection…</div>
    <div v-else-if="visible.length" class="product-grid"><ProductCard v-for="product in visible" :key="product.id" :product="product"/></div>
    <div v-else class="catalog-state">No products match your search.</div>
  </main>
</template>

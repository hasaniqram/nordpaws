<script setup lang="ts">
import { products } from '~/data/products'
const route = useRoute()
const category = computed(() => typeof route.query.category === 'string' ? route.query.category : '')
const categories = ['All', 'Dogs', 'Cats', 'Travel', 'Clean Home']
const visible = computed(() => !category.value ? products : products.filter((p) => p.category === category.value))
const setCategory = (value: string) => navigateTo(value === 'All' ? '/shop' : `/shop?category=${encodeURIComponent(value)}`)
useSeoMeta({ title: 'Shop' })
</script>

<template>
  <main class="container page-shell">
    <div class="shop-title"><span class="eyebrow">NORDPAWS collection</span><h1>Shop essentials</h1><p>Useful, considered products for life with dogs and cats.</p></div>
    <div class="filter-row"><button v-for="item in categories" :key="item" :class="['filter-chip', { active: (item === 'All' && !category) || item === category }]" @click="setCategory(item)">{{ item }}</button></div>
    <div class="product-grid"><ProductCard v-for="product in visible" :key="product.id" :product="product"/></div>
  </main>
</template>

<script setup lang="ts">
import { Menu, ShoppingBag, X, Heart, Search, UserRound, Leaf, TreePine, ArrowRight } from 'lucide-vue-next'
const open = ref(false)
const search = ref('')
const config = useRuntimeConfig()
const previewOnly = computed(() => !config.public.checkoutEnabled)
const { count } = useCart()
const { favorites, load } = useNorrliFavorites()
onMounted(load)
const categories = [
  { label: 'Hund', href: '/shop?category=Dogs' },
  { label: 'Katt', href: '/shop?category=Cats' },
  { label: 'Pälsvård', href: '/shop?q=groom' },
  { label: 'Promenad & Resa', href: '/shop?category=Travel' },
  { label: 'Hemmet', href: '/shop?category=Clean%20Home' },
  { label: 'Mat & Hälsa', href: '/shop?q=feeding' },
  { label: 'Nyheter', href: '/shop' },
  { label: 'Inspiration', href: '/about' }
]
const submitSearch = () => {
  open.value = false
  const q = search.value.trim()
  return navigateTo(q ? '/shop?q=' + encodeURIComponent(q) : '/shop')
}
</script>

<template>
  <div class="nordic-site-header">
    <div class="nordic-topline">
      <div class="container nordic-topline-inner">
        <span><TreePine :size="14" /> Inspiration från den nordiska naturen</span>
        <span class="nordic-topline-center"><Leaf :size="14"/> Omsorgsfullt utvalda produktidéer för hund och katt</span>
        <span v-if="previewOnly">Butiken är under utveckling</span>
        <span v-else>Välkommen till Norrli Pets</span>
      </div>
    </div>
    <div class="nordic-header-main container">
      <NorrliLogo />
      <form class="nordic-header-search" role="search" @submit.prevent="submitSearch">
        <Search :size="20" aria-hidden="true" />
        <input v-model="search" aria-label="Sök produkter" type="search" placeholder="Sök produkter, inspiration eller tillbehör…" autocomplete="off" />
        <button type="submit" aria-label="Sök"><ArrowRight :size="19"/></button>
      </form>
      <div class="nordic-header-actions">
        <NuxtLink to="/about" class="nordic-header-action nordic-desktop-action" aria-label="Om Norrli Pets">
          <UserRound :size="22"/><span>Om oss</span>
        </NuxtLink>
        <NuxtLink to="/favorites" class="nordic-header-action" aria-label="Favoriter">
          <Heart :size="22"/><span>Favoriter</span>
          <small v-if="favorites.length">{{favorites.length}}</small>
        </NuxtLink>
        <NuxtLink v-if="!previewOnly" to="/cart" class="nordic-header-action" aria-label="Varukorg">
          <ShoppingBag :size="22"/><span>Varukorg</span><small v-if="count">{{count}}</small>
        </NuxtLink>
        <button class="nordic-menu-toggle" :aria-expanded="open" aria-label="Visa meny" @click="open=!open">
          <X v-if="open" :size="24"/><Menu v-else :size="24"/>
        </button>
      </div>
    </div>
    <nav class="nordic-category-nav" aria-label="Produktkategorier">
      <div class="container nordic-category-links">
        <NuxtLink v-for="link in categories" :key="link.label" :to="link.href">{{link.label}}</NuxtLink>
      </div>
    </nav>
    <nav v-if="open" class="nordic-mobile-nav" aria-label="Mobil navigering">
      <form role="search" class="nordic-mobile-search" @submit.prevent="submitSearch">
        <Search :size="18"/><input v-model="search" aria-label="Sök produkter" placeholder="Sök i sortimentet…"/>
        <button aria-label="Sök" type="submit"><ArrowRight :size="18"/></button>
      </form>
      <NuxtLink v-for="link in categories" :key="link.label" :to="link.href" @click="open=false">{{link.label}} <ArrowRight :size="15"/></NuxtLink>
      <NuxtLink to="/contact" @click="open=false">Kontakta oss <ArrowRight :size="15"/></NuxtLink>
    </nav>
  </div>
</template>

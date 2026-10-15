<script setup lang="ts">
import { Menu, ShoppingBag, X, Heart, Search, Leaf, TreePine, ArrowRight, ChevronRight } from 'lucide-vue-next'

const route = useRoute()
const open = ref(false)
const search = ref('')
const config = useRuntimeConfig()
const previewOnly = computed(() => !config.public.checkoutEnabled)
const { count } = useCart()
const { favorites, load } = useNorrliFavorites()

const categories = [
  { label: 'Hund', href: '/shop?category=Dogs' },
  { label: 'Katt', href: '/shop?category=Cats' },
  { label: 'Pälsvård', href: '/shop?q=groom' },
  { label: 'Promenad & resa', href: '/shop?category=Travel' },
  { label: 'Hem & rengöring', href: '/shop?category=Clean%20Home' },
  { label: 'Mat & hälsa', href: '/shop?q=feeding' }
]
const extraLinks = [
  { label: 'Hela kollektionen', href: '/shop' },
  { label: 'Vår berättelse', href: '/about' },
  { label: 'Kontakt', href: '/contact' }
]

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') open.value = false
}
onMounted(() => {
  load()
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
watch(() => route.fullPath, () => { open.value = false })

const submitSearch = () => {
  open.value = false
  const q = search.value.trim()
  return navigateTo({ path: '/shop', query: q ? { q } : {} })
}
</script>

<template>
  <header class="nordic-site-header">
    <div class="nordic-topline">
      <div class="container nordic-topline-inner">
        <span><TreePine :size="14" aria-hidden="true" /> Inspirerat av den nordiska naturen</span>
        <span class="nordic-topline-center"><Leaf :size="14" aria-hidden="true" /> Omsorgsfulla idéer för hund och katt</span>
        <span>{{ previewOnly ? 'Sortimentet visas som förhandsvisning' : 'Välkommen till Norrli Pets' }}</span>
      </div>
    </div>

    <div class="nordic-header-main container">
      <!-- Keep the approved raster wordmark: do not reconstruct its lettering with CSS fonts. -->
      <NorrliLogo layout="stacked" />
      <form class="nordic-header-search" role="search" @submit.prevent="submitSearch">
        <Search :size="19" aria-hidden="true" />
        <input v-model="search" aria-label="Sök produkter" type="search"
          placeholder="Vad letar du efter till din vän?" autocomplete="off" />
        <button type="submit" aria-label="Sök produkter"><ArrowRight :size="19" aria-hidden="true" /></button>
      </form>
      <div class="nordic-header-actions">
        <NuxtLink to="/favorites" class="nordic-header-action" aria-label="Mina favoriter">
          <Heart :size="23" aria-hidden="true" /><span>Favoriter</span>
          <small v-if="favorites.length" aria-label="Antal favoriter">{{ favorites.length }}</small>
        </NuxtLink>
        <NuxtLink v-if="!previewOnly" to="/cart" class="nordic-header-action" aria-label="Varukorg">
          <ShoppingBag :size="23" aria-hidden="true" /><span>Varukorg</span>
          <small v-if="count" aria-label="Antal produkter">{{ count }}</small>
        </NuxtLink>
        <button class="nordic-menu-toggle" type="button"
          :aria-label="open ? 'Stäng menyn' : 'Öppna menyn'"
          :aria-expanded="open" aria-controls="norrli-mobile-nav" @click="open = !open">
          <X v-if="open" :size="25" aria-hidden="true" />
          <Menu v-else :size="25" aria-hidden="true" />
        </button>
      </div>
    </div>

    <nav class="nordic-category-nav" aria-label="Produktkategorier">
      <div class="container nordic-category-links">
        <NuxtLink to="/shop">Alla produkter</NuxtLink>
        <NuxtLink v-for="link in categories" :key="link.label" :to="link.href">{{ link.label }}</NuxtLink>
        <NuxtLink to="/about">Om Norrli</NuxtLink>
      </div>
    </nav>

    <nav id="norrli-mobile-nav" v-show="open" class="nordic-mobile-nav" aria-label="Mobil navigering">
      <div class="nordic-mobile-nav-inner container">
        <form role="search" class="nordic-mobile-search" @submit.prevent="submitSearch">
          <Search :size="18" aria-hidden="true" />
          <input v-model="search" type="search" aria-label="Sök produkter"
            placeholder="Sök bland produktidéer…" autocomplete="off" />
          <button aria-label="Sök" type="submit"><ArrowRight :size="18" aria-hidden="true" /></button>
        </form>
        <span class="nordic-mobile-nav-heading">HANDLA EFTER KATEGORI</span>
        <div class="nordic-mobile-links">
          <NuxtLink v-for="link in categories" :key="link.label" :to="link.href"
            @click="open = false">{{ link.label }} <ChevronRight :size="17" aria-hidden="true" /></NuxtLink>
        </div>
        <span class="nordic-mobile-nav-heading">MER FRÅN NORRLI PETS</span>
        <div class="nordic-mobile-links nordic-mobile-links-secondary">
          <NuxtLink v-for="link in extraLinks" :key="link.label" :to="link.href"
            @click="open = false">{{ link.label }} <ChevronRight :size="17" aria-hidden="true" /></NuxtLink>
          <NuxtLink to="/favorites" @click="open = false">Mina favoriter <Heart :size="17" aria-hidden="true" /></NuxtLink>
          <NuxtLink v-if="!previewOnly" to="/cart" @click="open = false">Varukorg <ShoppingBag :size="17" aria-hidden="true" /></NuxtLink>
        </div>
        <p class="nordic-mobile-footnote">Nära naturen, nära varandra.</p>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { Search, SlidersHorizontal, Heart, X, ArrowRight, GitCompareArrows, Sparkles, Check, ChevronRight } from 'lucide-vue-next'
import { COLLECTION_NEEDS, NEED_LABELS, filterStorefront, suggestProducts } from '~/utils/storefrontDiscovery.mjs'
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
const need = computed(() => typeof route.query.need==='string' && Object.hasOwn(NEED_LABELS,route.query.need)?route.query.need:'')
const selectedSlugs=ref<string[]>([])
const suggestionsOpen=ref(false)
const compareLimit=3
const toggleCompare=(slug:string)=>{
 if(selectedSlugs.value.includes(slug))selectedSlugs.value=selectedSlugs.value.filter(x=>x!==slug)
 else if(selectedSlugs.value.length<compareLimit)selectedSlugs.value=[...selectedSlugs.value,slug]
}
const comparisonLink=computed(()=>({path:'/compare',query:{items:selectedSlugs.value.join(',')}}))
const suggestions=computed(()=>suggestProducts(catalog.value?.products||[],search.value,5))
const showSuggestions=computed(()=>suggestionsOpen.value && search.value.trim().length>=2 && suggestions.value.length>0)
const onSearchFocusOut=(event:FocusEvent)=>{
 const wrapper=event.currentTarget as HTMLElement|null
 const destination=event.relatedTarget as Node|null
 if(!wrapper||!destination||!wrapper.contains(destination))suggestionsOpen.value=false
}

const { data: catalog, status } = await useFetch<{ products: Product[]; source: string }>('/api/products')

const visible = computed<Product[]>(() => filterStorefront(catalog.value?.products||[],{
 category:category.value,need:need.value,query:query.value,sort:sort.value,price:price.value,
 favoritesOnly:favoritesOnly.value,favorites:favorites.value
}))
const activeFilters = computed(() => Boolean(category.value || need.value || query.value || price.value !== 'all' || favoritesOnly.value || sort.value !== 'featured'))
const updateFilters = (patch: Record<string, string | undefined>) => {
  const next: Record<string, string> = {}
  for (const key of ['category', 'need', 'q', 'sort', 'price', 'fav']) {
    const value = route.query[key]
    if (typeof value === 'string' && value) next[key] = value
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value) next[key] = value
    else delete next[key]
  }
  return navigateTo({ path: '/shop', query: next })
}
const applySearch = () => { suggestionsOpen.value=false; return updateFilters({q: search.value.trim().slice(0, 120) || undefined}) }
const clearSearch = () => {
  search.value = ''
  return updateFilters({q: undefined})
}
const resetFilters = () => {
  search.value = ''
  return navigateTo('/shop')
}
const setCategory = (value: string) => updateFilters({category: value === 'All' ? undefined : value,need:undefined})
const setNeed = (value: string) => updateFilters({need:need.value===value?undefined:value,category:undefined})
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

    <section class="norrli-premium-needs" aria-labelledby="norrli-shop-needs">
      <div class="norrli-premium-needs-intro">
        <span class="nordic-overline"><Sparkles :size="15" aria-hidden="true"/> INSPIRATION EFTER BEHOV</span>
        <h2 id="norrli-shop-needs">Vad vill ni göra enklare?</h2>
      </div>
      <div class="norrli-premium-needs-scroll">
        <button v-for="(collection,i) in COLLECTION_NEEDS" :key="collection.id"
          class="norrli-premium-need-tile" :class="['need-'+collection.theme,{active:need===collection.id}]"
          type="button" :aria-pressed="need===collection.id" @click="setNeed(collection.id)">
          <span class="norrli-premium-need-number">0{{i+1}}</span>
          <span class="norrli-premium-need-title">{{collection.title}}</span>
          <span class="norrli-premium-need-subtitle">{{collection.description}}</span>
          <span class="norrli-premium-need-arrow"><Check v-if="need===collection.id" :size="17" aria-hidden="true"/><ArrowRight v-else :size="17" aria-hidden="true"/></span>
        </button>
      </div>
    </section>

    <section class="norrli-discovery" aria-label="Filtrera kollektionen">
      <div class="norrli-discovery-primary">
        <div class="norrli-premium-search-wrap" @focusout="onSearchFocusOut">
        <form class="norrli-search" role="search" @submit.prevent="applySearch">
          <Search :size="19" aria-hidden="true" />
          <input v-model="search" maxlength="120" type="search" placeholder="Sök på svenska: päls, tassar, resa…"
            aria-label="Sök produktidéer" autocomplete="off" :aria-expanded="showSuggestions" :aria-controls="showSuggestions ? 'norrli-search-suggestions' : undefined"
            @focus="suggestionsOpen=true" @keydown.esc="suggestionsOpen=false" />
          <button v-if="query || search" type="button" aria-label="Rensa sökning" class="norrli-search-clear"
            @click="clearSearch"><X :size="16" aria-hidden="true" /></button>
          <button type="submit" class="norrli-search-submit">Sök <ArrowRight :size="16" aria-hidden="true" /></button>
        </form>
        <div v-if="showSuggestions" id="norrli-search-suggestions" class="norrli-premium-suggestions" aria-label="Produktförslag">
          <span class="norrli-premium-suggestions-title">PRODUKTFÖRSLAG</span>
          <NuxtLink v-for="item in suggestions" :key="item.id" :to="'/products/'+item.slug" @mousedown.prevent>
            <span aria-hidden="true">{{item.emoji}}</span><strong>{{item.name}}</strong><ChevronRight :size="16" aria-hidden="true"/>
          </NuxtLink>
        </div>
        </div>
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

      <div v-if="need" class="norrli-premium-current-need" role="status">
        <Sparkles :size="15" aria-hidden="true"/> Visar: <strong>{{NEED_LABELS[need]}}</strong>
        <button type="button" @click="setNeed(need)">Ta bort inriktning <X :size="14" aria-hidden="true"/></button>
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
      <div v-for="product in visible" :key="product.id" class="norrli-premium-product-cell">
        <ProductCard :product="product"/>
        <button type="button" class="norrli-premium-compare-toggle"
          :class="{active:selectedSlugs.includes(product.slug)}"
          :aria-pressed="selectedSlugs.includes(product.slug)"
          :disabled="!selectedSlugs.includes(product.slug)&&selectedSlugs.length>=compareLimit"
          :aria-label="(selectedSlugs.includes(product.slug)?'Ta bort från jämförelse: ':'Lägg till i jämförelse: ')+product.name"
          @click="toggleCompare(product.slug)">
          <Check v-if="selectedSlugs.includes(product.slug)" :size="16" aria-hidden="true"/>
          <GitCompareArrows v-else :size="16" aria-hidden="true"/>
          {{selectedSlugs.includes(product.slug)?'Vald för jämförelse':'Jämför produkt'}}
        </button>
      </div>
    </div>
    <div v-else class="catalog-state norrli-shop-empty">
      <Search :size="31" aria-hidden="true" />
      <h2>Vi hittade inga matchningar</h2>
      <p>{{ favoritesOnly ? 'Inga sparade favoriter matchar dessa filter.' : 'Prova ett annat sökord eller välj en annan kategori.' }}</p>
      <button type="button" class="norrli-clear-all" @click="resetFilters">Visa hela kollektionen <ArrowRight :size="17" aria-hidden="true" /></button>
    </div>
    <aside v-if="selectedSlugs.length" class="norrli-premium-compare-bar" aria-label="Valda produkter för jämförelse" role="region">
      <span><GitCompareArrows :size="20" aria-hidden="true"/>
        <strong>{{selectedSlugs.length}} av {{compareLimit}} produkter valda</strong>
        <small>{{selectedSlugs.length<2?'Välj minst två produkter för jämförelse.':'Jämför informationen sida vid sida.'}}</small>
      </span>
      <div>
        <button type="button" class="norrli-premium-compare-clear" @click="selectedSlugs=[]">Rensa</button>
        <NuxtLink v-if="selectedSlugs.length>=2" :to="comparisonLink" class="norrli-premium-button">
          Jämför nu <ArrowRight :size="17" aria-hidden="true"/>
        </NuxtLink>
      </div>
    </aside>
    <p class="norrli-collection-note">Priser och produktbilder är preliminära tills sortiment och leverantörer har bekräftats.</p>
  </main>
</template>

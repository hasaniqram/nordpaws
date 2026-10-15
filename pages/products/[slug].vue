<script setup lang="ts">
import {
  Check, Minus, Plus, ShoppingBag, Heart, ArrowRight, ArrowLeft,
  Leaf, ShieldCheck, PackageSearch, ChevronRight, Sparkles, PawPrint,
  Truck, Home
} from 'lucide-vue-next'
import { formatSEK, type Product, type ProductVariant } from '~/data/products'

const route=useRoute()
const config=useRuntimeConfig()
const previewOnly=computed(()=>!config.public.checkoutEnabled)
const {data:catalog}=await useFetch<{products:Product[];source:string}>('/api/products')
const product=(catalog.value?.products||[]).find(p=>p.slug===route.params.slug)
if(!product)throw createError({statusCode:404,statusMessage:'Produkten hittades inte'})
const {add}=useCart()
const {has,toggle,load}=useNorrliFavorites()
onMounted(load)
const quantity=ref(1),added=ref(false),imageFailed=ref(false)
const selectedVariantId=ref(product.variants?.[0]?.id||'')
const selectedImage=ref(product.primaryImage||product.images?.[0]?.publicUrl||'')
watch(selectedImage,()=>{imageFailed.value=false})
const selectedImageIsConcept=computed(()=>
  product.images?.find(image=>image.publicUrl===selectedImage.value)?.isConcept
  ??product.primaryIsConcept??false
)
const selectedVariant=computed<ProductVariant|null>(()=>
  product.variants?.find(v=>v.id===selectedVariantId.value)||null
)
const displayPrice=computed(()=>selectedVariant.value?.price??product.price)
const outOfStock=computed(()=>
  selectedVariant.value?.stockQuantity!=null && selectedVariant.value.stockQuantity<=0
)
const categoryNames:Record<string,string>={
  Dogs:'Hund',Cats:'Katt',Travel:'Promenad & resa','Clean Home':'Hem & rengöring'
}
const categoryName=computed(()=>categoryNames[product.category]||product.category)
const categoryHref=computed(()=>'/shop?category='+encodeURIComponent(product.category))
const related=computed(()=>(catalog.value?.products||[]).filter(p=>p.id!==product.id)
  .sort((a,b)=>Number(b.category===product.category)-Number(a.category===product.category))
  .slice(0,4))
const swedishCopy:Record<string,{intro:string;benefits:string[]}>={
  cleanroll:{intro:'Ett enklare sätt att ta hand om päls i vardagen. En stilren produktidé för soffan, hemmet och bilen.',benefits:['Återanvändbar konstruktion','Passar vardagens små städstunder','Utan klistriga påfyllningsrullar']},
  'paw-cleaner':{intro:'När promenaden har varit lite för lerig. En praktisk idé för att rengöra tassar innan ni går in.',benefits:['Mjuk rengöring för tassarna','Smidig att ta med','Enkel att skölja ur']},
  'fold-bowl':{intro:'För äventyret utanför hemmet. Hopfällbara skålar som tar liten plats när ni är på väg.',benefits:['Två hopfällbara skålar','Lätta att packa och bära','För mat och vatten på utflykten']},
  'car-seat-cover':{intro:'En omtänksam reseidé för hundägare. Skydda bilens baksäte under vardagens resor och helgens äventyr.',benefits:['Utformad för baksätet','Enkel montering som produktidé','För resor med hund']},
  'slow-feeder':{intro:'Gör måltiden till en lugnare stund. En matskål med struktur för ett långsammare ätande.',benefits:['Strukturerad skålform','För mer varierade måltidsrutiner','Tänkt för daglig användning']},
  'grooming-brush':{intro:'En mjuk stund tillsammans. En borste med en nedtonad form och fokus på regelbunden pälsvård.',benefits:['Rundade borstpiggar','Bekvämt grepp som produktidé','För pälsvård hemma']}
}
const localized=swedishCopy[product.slug]??{
  intro:product.description,
  benefits:product.features
}
const addToCart=()=>{
  if(previewOnly.value||outOfStock.value)return
  if(product.variants?.length&&!selectedVariant.value)return
  add(product,quantity.value,selectedVariant.value)
  added.value=true
  if(import.meta.client)window.setTimeout(()=>{added.value=false},1200)
}
useSeoMeta({
  title:product.name+' · Norrli Pets',
  description:localized.intro,
  ogTitle:product.name+' · Norrli Pets',
  ogDescription:localized.intro
})
</script>

<template>
  <main class="nordic-detail-main">
    <div class="container nordic-crumbs" aria-label="Brödsmulenavigering">
      <NuxtLink to="/"><Home :size="14"/> Start</NuxtLink>
      <ChevronRight :size="13"/>
      <NuxtLink to="/shop">Kollektionen</NuxtLink>
      <ChevronRight :size="13"/>
      <NuxtLink :to="categoryHref">{{categoryName}}</NuxtLink>
      <ChevronRight :size="13"/>
      <span aria-current="page">{{product.name}}</span>
    </div>

    <section class="container nordic-detail-grid">
      <div class="nordic-detail-gallery">
        <div class="nordic-detail-photo" :style="{background:product.gradient}">
          <span class="nordic-detail-photo-tag"><Leaf :size="14"/> NORRLI PETS COLLECTION</span>
          <img v-if="selectedImage&&!imageFailed" :src="selectedImage" :alt="product.name"
            width="850" height="850" decoding="async" fetchpriority="high" @error="imageFailed=true"/>
          <span v-else class="nordic-detail-emoji">{{product.emoji}}</span>
          <button class="nordic-detail-heart" type="button"
            :aria-label="has(product.slug)?'Ta bort favorit':'Lägg till favorit'"
            :aria-pressed="has(product.slug)" @click="toggle(product.slug)">
            <Heart :size="22" :fill="has(product.slug)?'currentColor':'none'"/>
          </button>
          <span v-if="selectedImageIsConcept" class="nordic-detail-concept">Illustrativ konceptbild</span>
        </div>
        <div v-if="product.images?.length>1" class="nordic-detail-thumbs" aria-label="Produktbilder">
          <button v-for="image in product.images" :key="image.id" type="button"
            :class="{active:selectedImage===image.publicUrl}"
            :aria-label="'Visa bild: '+(image.altText||product.name)"
            :aria-pressed="selectedImage===image.publicUrl"
            @click="selectedImage=image.publicUrl">
            <img :src="image.publicUrl" :alt="image.altText||product.name" loading="lazy" width="100" height="100"/>
          </button>
        </div>
        <p class="nordic-detail-picture-note">
          <ShieldCheck :size="15"/>
          Produktbilderna är illustrativa tills slutligt sortiment och utseende har bekräftats.
        </p>
      </div>

      <div class="nordic-detail-info">
        <span class="nordic-overline"><PawPrint :size="15"/> {{categoryName}}</span>
        <h1>{{product.name}}</h1>
        <p class="nordic-detail-subtitle">{{localized.intro}}</p>
        <div class="nordic-detail-price-row">
          <strong>{{formatSEK(displayPrice)}}</strong>
          <span v-if="previewOnly" class="nordic-detail-estimate">Preliminärt pris</span>
          <del v-else-if="product.compareAt&&!selectedVariant?.price">{{formatSEK(product.compareAt)}}</del>
        </div>
        <div v-if="previewOnly" class="nordic-detail-preview-status">
          <Sparkles :size="20"/>
          <span><strong>En förhandstitt på vår kollektion</strong>
            Vi utvecklar vårt sortiment. Produktinformation och pris kan komma att ändras.
            Beställningar är inte öppna ännu.
          </span>
        </div>

        <div v-if="product.variants?.length" class="nordic-detail-variants">
          <strong>Välj alternativ</strong>
          <div class="nordic-detail-option-row">
            <button v-for="variant in product.variants" :key="variant.id" type="button"
              :class="{active:selectedVariantId===variant.id}"
              :disabled="!previewOnly&&variant.stockQuantity===0"
              @click="selectedVariantId=variant.id">
              <span>{{variant.name}}</span>
              <small v-if="variant.price&&variant.price!==product.price">{{formatSEK(variant.price)}}</small>
            </button>
          </div>
        </div>

        <div class="nordic-detail-highlights">
          <h2>Därför tycker vi om idén</h2>
          <ul>
            <li v-for="benefit in localized.benefits" :key="benefit"><Check :size="16"/> {{benefit}}</li>
          </ul>
        </div>

        <NuxtLink v-if="previewOnly" to="/shop" class="nordic-detail-main-action">
          Utforska fler produktidéer <ArrowRight :size="19"/>
        </NuxtLink>
        <div v-else class="nordic-detail-buy-controls">
          <div class="nordic-detail-quantity">
            <button type="button" aria-label="Minska antal" @click="quantity=Math.max(1,quantity-1)"><Minus :size="17"/></button>
            <span aria-live="polite">{{quantity}}</span>
            <button type="button" aria-label="Öka antal" @click="quantity=Math.min(10,quantity+1)"><Plus :size="17"/></button>
          </div>
          <button class="nordic-detail-main-action" type="button" :disabled="outOfStock" @click="addToCart">
            <ShoppingBag :size="18"/>{{outOfStock?'Slut i lager':added?'Tillagd i varukorgen':'Lägg i varukorgen'}}
          </button>
        </div>

        <div class="nordic-detail-values">
          <div><Leaf :size="23"/><span><strong>Nordiskt inspirerad form</strong><small>Enkelhet och omtanke i fokus</small></span></div>
          <div><PawPrint :size="23"/><span><strong>För livet med husdjur</strong><small>Produktidéer för vardag och äventyr</small></span></div>
        </div>
      </div>
    </section>

    <section class="container nordic-detail-information">
      <div class="nordic-detail-information-heading">
        <span class="nordic-overline">VÅR KOLLEKTION</span><h2>En närmare titt</h2>
      </div>
      <div class="nordic-detail-accordions">
        <details open>
          <summary>Om produktidén <Plus :size="18"/></summary>
          <p>{{localized.intro}}</p>
          <p>De slutliga produktuppgifterna fastställs när motsvarande leverantörsprodukt har verifierats.</p>
        </details>
        <details>
          <summary>Material & specifikationer <Plus :size="18"/></summary>
          <dl v-if="product.material||product.dimensions||product.weightGrams">
            <div v-if="product.material"><dt>Material (uppgift under granskning)</dt><dd>{{product.material}}</dd></div>
            <div v-if="product.dimensions"><dt>Mått (uppgift under granskning)</dt><dd>{{product.dimensions}}</dd></div>
            <div v-if="product.weightGrams"><dt>Vikt (uppgift under granskning)</dt><dd>{{product.weightGrams}} g</dd></div>
          </dl>
          <p v-else>Vi samlar in material-, mått- och viktuppgifter från leverantörer. Informationen publiceras när den har bekräftats.</p>
        </details>
        <details>
          <summary>Leverans & tillgänglighet <Plus :size="18"/></summary>
          <p>Leveransvillkor och produkttillgänglighet är under utveckling. Aktuella uppgifter kommer att publiceras före försäljningsstart.</p>
          <NuxtLink to="/legal/shipping" class="text-link">Läs mer <ArrowRight :size="15"/></NuxtLink>
        </details>
        <details>
          <summary>Frågor om produkten <Plus :size="18"/></summary>
          <p>Har du en fråga eller vill du veta mer om den här produktidén? Hör gärna av dig.</p>
          <NuxtLink to="/contact" class="text-link">Kontakta oss <ArrowRight :size="15"/></NuxtLink>
        </details>
      </div>
    </section>

    <section v-if="related.length" class="container nordic-detail-related">
      <div class="nordic-section-heading">
        <div><span class="nordic-overline">MER ATT UPPTÄCKA</span><h2>Du kanske också gillar</h2></div>
        <NuxtLink to="/shop" class="nordic-all-link">Se hela kollektionen <ArrowRight :size="16"/></NuxtLink>
      </div>
      <div class="nordic-detail-related-grid">
        <ProductCard v-for="item in related" :key="item.id" :product="item"/>
      </div>
      <NuxtLink to="/shop" class="nordic-detail-back"><ArrowLeft :size="17"/> Tillbaka till kollektionen</NuxtLink>
    </section>
  </main>
</template>

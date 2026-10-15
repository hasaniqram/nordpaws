<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check, CircleHelp, Leaf, ShieldCheck, X } from 'lucide-vue-next'
import { formatSEK, type Product } from '~/data/products'
import { getComparison } from '~/utils/storefrontDiscovery.mjs'

const route=useRoute()
const config=useRuntimeConfig()
const previewOnly=computed(()=>!config.public.checkoutEnabled)
const {data:catalog,status}=await useFetch<{products:Product[];source:string}>('/api/products')
const selection=computed(()=>typeof route.query.items==='string'?route.query.items:'')
const failedImages=ref<string[]>([])
const products=computed<Product[]>(()=>getComparison(catalog.value?.products||[],selection.value,3))
const label=(category:string)=>({
 'Dogs':'Hund','Cats':'Katt','Travel':'Promenad & resa','Clean Home':'Hem & rengöring'
}[category]||category)
const removeProduct=(slug:string)=>{
 const remaining=products.value.filter(p=>p.slug!==slug).map(p=>p.slug)
 return navigateTo({path:'/compare',query:remaining.length?{items:remaining.join(',')}:{}})
}
const fields: {key:string;label:string;value:(p:Product)=>string}[]=[
 {key:'category',label:'Kategori',value:p=>label(p.category)},
 {key:'subtitle',label:'Beskrivning',value:p=>p.subtitle||'Ännu inte angivet'},
 {key:'price',label:'Preliminärt pris',value:p=>formatSEK(p.price)},
 {key:'material',label:'Material',value:p=>p.material||'Behöver verifieras'},
 {key:'dimensions',label:'Mått',value:p=>p.dimensions||'Behöver verifieras'},
 {key:'weight',label:'Vikt',value:p=>p.weightGrams!=null?p.weightGrams+' g':'Behöver verifieras'},
 {key:'status',label:'Produktstatus',value:p=>'Produktidé under granskning'},
 {key:'shipping',label:'Leverans',value:p=>'Fastställs före försäljningsstart'}
]
useSeoMeta({title:'Jämför produktidéer',description:'Jämför preliminära uppgifter och egenskaper för utvalda produktidéer hos Norrli Pets.',robots:'noindex,follow'})
</script>
<template>
 <main class="container norrli-premium-compare">
  <nav class="norrli-premium-crumb" aria-label="Brödsmulor">
   <NuxtLink to="/shop"><ArrowLeft :size="16" aria-hidden="true"/> Till kollektionen</NuxtLink>
   <span aria-hidden="true">/</span><span aria-current="page">Produktjämförelse</span>
  </nav>
  <div class="norrli-compare-heading">
   <span class="nordic-overline"><Leaf :size="16" aria-hidden="true"/> VÄLJ MED OMTANKE</span>
   <h1>Jämför i lugn och ro.</h1>
   <p>Se detaljerna sida vid sida och utforska vad som passar din vardag. All information är preliminär tills slutligt sortiment har verifierats.</p>
  </div>
  <div v-if="status==='pending'" class="catalog-state" role="status">Laddar produktjämförelsen…</div>
  <div v-else-if="status==='error'" class="catalog-state" role="alert">Vi kunde inte ladda produkterna just nu. Försök igen senare.</div>
  <section v-else-if="products.length" aria-label="Jämför produkter" class="norrli-compare-surface">
   <div class="norrli-compare-overflow" tabindex="0" role="region" aria-label="Jämförelsetabell, rulla vågrätt vid behov">
    <table class="norrli-compare-table">
     <caption class="norrli-visually-hidden">Jämförelse mellan {{ products.map(p=>p.name).join(', ') }}</caption>
     <thead>
      <tr>
       <th scope="col" class="norrli-compare-label-col">Egenskap</th>
       <th v-for="p in products" :key="p.id" scope="col">
        <div class="norrli-compare-product">
         <NuxtLink :to="'/products/'+p.slug" class="norrli-compare-art" :style="{background:p.gradient}" :aria-label="'Se '+p.name">
          <img v-if="p.primaryImage&&!failedImages.includes(p.slug)" :src="p.primaryImage" :alt="p.name" loading="lazy" width="190" height="190" @error="failedImages.push(p.slug)"/>
          <span v-else aria-hidden="true">{{p.emoji}}</span>
         </NuxtLink>
         <NuxtLink :to="'/products/'+p.slug" class="norrli-compare-product-title">{{p.name}}</NuxtLink>
         <button type="button" class="norrli-compare-remove" :aria-label="'Ta bort '+p.name+' från jämförelsen'" @click="removeProduct(p.slug)"><X :size="14" aria-hidden="true"/> Ta bort</button>
        </div>
       </th>
      </tr>
     </thead>
     <tbody>
      <tr v-for="field in fields" :key="field.key">
       <th scope="row">{{field.label}}</th>
       <td v-for="p in products" :key="p.id">{{field.value(p)}}</td>
      </tr>
     </tbody>
    </table>
   </div>
   <p class="norrli-compare-scroll-hint">På mindre skärmar kan tabellen rullas åt sidan.</p>
  </section>
  <section v-else class="norrli-compare-empty">
   <CircleHelp :size="32" aria-hidden="true"/>
   <h2>Inga produkter valda ännu</h2>
   <p>Gå till kollektionen och välj två eller tre produkter för att jämföra dem.</p>
   <NuxtLink to="/shop" class="norrli-premium-button">Utforska produktidéer <ArrowRight :size="17" aria-hidden="true"/></NuxtLink>
  </section>
  <aside class="norrli-compare-disclaimer" role="note">
   <ShieldCheck :size="21" aria-hidden="true"/>
   <p><strong>{{previewOnly?'Förhandsvisning – inga köp öppna ännu.':'Information under granskning.'}}</strong>
    Produktbilder, priser, material, specifikationer och lageruppgifter kan ändras. Jämförelsen utgör inte en bekräftelse på leverans, säkerhet eller tillgänglighet.</p>
  </aside>
  <NuxtLink to="/shop" class="norrli-compare-return"><ArrowLeft :size="17" aria-hidden="true"/> Tillbaka till hela kollektionen</NuxtLink>
 </main>
</template>

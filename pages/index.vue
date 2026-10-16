<script setup lang="ts">
import { ArrowRight, TreePine, Leaf, PawPrint, Heart, ShieldCheck, ArrowUpRight, Mail, Sparkles, Sofa, Compass, Scissors, Soup } from 'lucide-vue-next'
import { COLLECTION_NEEDS, matchesNeed } from '~/utils/storefrontDiscovery.mjs'
import { organizationSchema, websiteSchema } from '~/utils/editorialSeo.mjs'
import type { Product } from '~/data/products'

useSeoMeta({
  title: 'Skandinaviska favoriter för hund och katt',
  description: 'Norrli Pets – en nordiskt inspirerad kollektion av produktidéer för ett enklare och gladare liv med hund och katt.',
  ogTitle: 'Norrli Pets · Nära naturen, nära varandra'
})
useHead({script:[{type:'application/ld+json',innerHTML:JSON.stringify(organizationSchema())},{type:'application/ld+json',innerHTML:JSON.stringify(websiteSchema())}]})
const config=useRuntimeConfig()
const previewOnly=computed(()=>!config.public.checkoutEnabled)
const { data: catalog } = await useFetch<{ products: Product[]; source: string }>('/api/products')
const featured=computed(()=> (catalog.value?.products || []).slice(0,6))
const collectionIcons=[Sofa,Compass,Scissors,Soup]
const productsByNeed=(needId:string)=>(catalog.value?.products||[]).filter(product=>matchesNeed(product,needId)).length
const categories=[
  {name:'Hund',to:'/shop?category=Dogs',src:'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=500&q=75',alt:'Golden retriever i mjukt dagsljus'},
  {name:'Katt',to:'/shop?category=Cats',src:'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=500&q=75',alt:'Katt i naturligt ljus'},
  {name:'Pälsvård',to:'/shop?q=groom',src:'/products/softgroom.webp',alt:'Illustrativ bild av en pälsvårdsborste'},
  {name:'Promenad & resa',to:'/shop?category=Travel',src:'https://images.unsplash.com/photo-1763586756635-1c1b61f969d2?auto=format&fit=crop&w=500&q=75',alt:'Hund vid en nordisk sjö'},
  {name:'Hemmet',to:'/shop?category=Clean%20Home',src:'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=500&q=75',alt:'Ljust skandinaviskt vardagsrum'},
  {name:'Mat & hälsa',to:'/shop?q=feeding',src:'/products/calmbite.webp',alt:'Illustrativ bild av en matskål'},
  {name:'Nyheter',to:'/shop',src:'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=500&q=75',alt:'Landskap med fjäll och sjö'},
  {name:'Inspiration',to:'/about',src:'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=500&q=75',alt:'Nordisk skog'}
]
const email=ref('')
const consent=ref(false)
const newsletterState=ref<'idle'|'loading'|'success'|'error'>('idle')
const newsletterMessage=ref('')
const joinNewsletter=async()=>{
  if(!consent.value||newsletterState.value==='loading')return
  newsletterState.value='loading'; newsletterMessage.value=''
  try{
    const result=await $fetch<{ok:boolean;alreadySubscribed?:boolean}>('/api/newsletter',{
      method:'POST',body:{email:email.value,locale:'sv'}
    })
    newsletterState.value='success'
    newsletterMessage.value=result.alreadySubscribed
      ? 'Du finns redan på vår lista.'
      : 'Tack! Du har anmält dig till Norrli Pets nyhetsbrev.'
    email.value='';consent.value=false
  }catch(e:any){
    newsletterState.value='error'
    newsletterMessage.value=e?.data?.statusMessage||'Det gick inte att registrera e-postadressen just nu.'
  }
}
</script>

<template>
  <main class="nordic-home">
    <section class="nordic-hero-wrap container">
      <div class="nordic-hero-scene">
        <div class="nordic-hero-mountain" aria-hidden="true"></div>
        <div class="nordic-hero-pets" aria-hidden="true">
          <img src="https://images.unsplash.com/photo-1765382119933-77efd0ee2921?auto=format&fit=crop&w=1300&q=85"
            alt="" fetchpriority="high" width="1300" height="1080"/>
        </div>
        <div class="nordic-hero-copy">
          <span class="nordic-overline"><TreePine :size="16"/> ETT NATURLIGARE DJURLIV</span>
          <h1>Skandinaviska<br>favoriter för<br><em>lyckligare husdjur</em></h1>
          <p>Inspirerade av den nordiska naturen och skapade för vardagens små och stora äventyr med hund och katt.</p>
          <NuxtLink to="/shop" class="nordic-pill-button">Utforska kollektionen <ArrowRight :size="18"/></NuxtLink>
          <small v-if="previewOnly" class="nordic-preview-line">En förhandstitt på vårt kommande sortiment</small>
        </div>
        <div class="nordic-hero-seal"><TreePine :size="27"/><span>NÄRA<br>NATUREN<br>NÄRA<br>VARANDRA</span></div>
      </div>
    </section>

    <section class="nordic-benefits container" aria-label="Norrli Pets värderingar">
      <div><TreePine :size="29"/><span><strong>Nordisk inspiration</strong><small>Naturliga färger och enkla former</small></span></div>
      <div><Leaf :size="29"/><span><strong>Omsorgsfulla idéer</strong><small>Praktiska produkter för vardagen</small></span></div>
      <div><PawPrint :size="29"/><span><strong>Hundar & katter</strong><small>För våra fyrbenta familjemedlemmar</small></span></div>
      <div><Heart :size="29"/><span><strong>Ett mjukare hem</strong><small>Plats för både vila och lek</small></span></div>
    </section>

    <section class="norrli-premium-editorial container" aria-labelledby="norrli-premium-editorial-title">
      <div class="norrli-premium-editorial-heading">
        <span class="nordic-overline"><Leaf :size="16" aria-hidden="true"/> FÖR LIVET TILLSAMMANS</span>
        <h2 id="norrli-premium-editorial-title">Små detaljer. <em>Större stunder.</em></h2>
        <p>Hitta idéer för promenaden, hemmet, pälsvården och måltiden – med den stillsamma känslan av nordisk design.</p>
      </div>
      <div class="norrli-premium-editorial-meta">
        <span><PawPrint :size="19" aria-hidden="true"/> Skapat med omtanke</span>
        <NuxtLink to="/about">Läs vår berättelse <ArrowRight :size="16" aria-hidden="true"/></NuxtLink>
      </div>
    </section>

    <section class="norrli-premium-home-needs container" aria-labelledby="norrli-home-needs-title">
      <div class="nordic-section-heading">
        <div><span class="nordic-overline">UPPTÄCK EFTER BEHOV</span><h2 id="norrli-home-needs-title">För varje liten vardag.</h2></div>
        <NuxtLink to="/shop" class="nordic-all-link">Hitta din favorit <ArrowRight :size="17" aria-hidden="true"/></NuxtLink>
      </div>
      <div class="norrli-premium-home-needs-grid">
        <NuxtLink v-for="(collection,index) in COLLECTION_NEEDS" :key="collection.id" :to="collection.href"
          class="norrli-premium-home-need" :class="'need-'+collection.theme">
          <span class="norrli-premium-home-need-icon"><component :is="collectionIcons[index]" :size="30" :stroke-width="1.6" aria-hidden="true"/></span>
          <span class="norrli-premium-home-need-title">{{collection.title}}</span>
          <span class="norrli-premium-home-need-description">{{collection.description}}</span>
          <span class="norrli-premium-home-need-bottom">
            <span>{{productsByNeed(collection.id)}} {{productsByNeed(collection.id)===1?'produktidé':'produktidéer'}}</span>
            <span class="norrli-premium-need-arrow"><ArrowRight :size="19" aria-hidden="true"/></span>
          </span>
        </NuxtLink>
      </div>
      <p class="norrli-premium-honesty-note">Kollektionen visas som inspiration och produktidéer medan leverantörer och sortiment granskas.</p>
    </section>

    <StorefrontFinder />\n\n    <section class="nordic-section nordic-categories container">
      <div class="nordic-section-heading"><div><span class="nordic-overline">HITTA DIN FAVORIT</span><h2>Handla efter kategori</h2></div>
        <NuxtLink to="/shop" class="nordic-all-link">Visa alla produkter <ArrowRight :size="17"/></NuxtLink>
      </div>
      <div class="nordic-category-grid">
        <NuxtLink v-for="cat in categories" :key="cat.name" :to="cat.to" class="nordic-category-tile">
          <div class="nordic-category-photo"><img :src="cat.src" :alt="cat.alt" loading="lazy" width="320" height="340"/></div>
          <div class="nordic-category-label"><span>{{cat.name}}</span><span class="nordic-round-arrow"><ArrowRight :size="17"/></span></div>
        </NuxtLink>
      </div>
      <p class="nordic-photo-note">Produktbilder i kollektionen är illustrativa koncept tills sortimentet är bekräftat.</p>
    </section>

    <section class="nordic-section nordic-featured container">
      <div class="nordic-section-heading"><div><span class="nordic-overline">NORRLI PETS COLLECTION</span><h2>Utvalda favoriter</h2></div>
        <NuxtLink to="/shop" class="nordic-all-link">Se hela kollektionen <ArrowRight :size="17"/></NuxtLink>
      </div>
      <div v-if="featured.length" class="nordic-featured-grid">
        <ProductCard v-for="product in featured" :key="product.id" :product="product"/>
      </div>
      <p v-else class="nordic-empty-products">Vi förbereder våra produktidéer. Utforska gärna butiken igen snart.</p>
    </section>

    <section class="norrli-premium-founder-note container" aria-labelledby="norrli-founder-note-title">
      <div class="norrli-premium-founder-emblem"><Heart :size="25" aria-hidden="true"/><span>H</span></div>
      <div>
        <span class="nordic-overline">PERSONEN BAKOM IDÉN</span>
        <h2 id="norrli-founder-note-title">En personlig idé, byggd med hjärta.</h2>
        <p>Norrli Pets grundades som en idé av <strong>Hasan Iqram</strong>. Läs om visionen och arbetet bakom webbplatsen.</p>
      </div>
      <NuxtLink to="/about" class="norrli-premium-founder-link">Möt skaparen <ArrowRight :size="17" aria-hidden="true"/></NuxtLink>
    </section>

    <section class="nordic-story-grid container">
      <article class="nordic-story-card nordic-story-dog">
        <img src="https://images.unsplash.com/photo-1763586756635-1c1b61f969d2?auto=format&fit=crop&w=1100&q=80" loading="lazy"
          alt="Golden retriever vid vatten och skog" width="1000" height="560"/>
        <div class="nordic-story-content">
          <span class="nordic-overline">REDO FÖR NYA ÄVENTYR</span>
          <h2>Tillsammans ut<br>i naturen</h2>
          <p>Upptäck våra idéer för resor, promenader och ett aktivt hundliv.</p>
          <NuxtLink to="/shop?category=Travel">Utforska resa & promenad <ArrowRight :size="17"/></NuxtLink>
        </div>
      </article>
      <article class="nordic-story-card nordic-story-cat">
        <img src="https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=1100&q=80" loading="lazy"
          alt="Katt i en ljus, lugn miljö" width="1000" height="560"/>
        <div class="nordic-story-content">
          <span class="nordic-overline">ETT LUGNARE HEM</span>
          <h2>Små stunder,<br>stora känslor</h2>
          <p>Enklare rutiner och mysiga detaljer för livet med katt.</p>
          <NuxtLink to="/shop?category=Cats">Upptäck kattfavoriter <ArrowRight :size="17"/></NuxtLink>
        </div>
      </article>
    </section>

    <section class="nordic-newsletter container" aria-label="Prenumerera på nyhetsbrev">
      <div class="nordic-newsletter-copy"><Mail :size="27"/><div><span class="nordic-overline">HÄNG MED PÅ RESAN</span>
        <h2>Få inspiration från Norrli Pets</h2>
        <p>Nyheter, produktidéer och vardagsinspiration för dig och ditt husdjur.</p></div>
      </div>
      <div class="nordic-newsletter-actions">
        <form @submit.prevent="joinNewsletter">
          <div class="nordic-newsletter-input"><input v-model="email" type="email" required maxlength="254"
            placeholder="Din e-postadress" aria-label="Din e-postadress"/>
            <button type="submit" :disabled="newsletterState==='loading'||!consent">{{newsletterState==='loading'?'Vänta…':'Prenumerera'}} <ArrowRight :size="17"/></button>
          </div>
          <label class="nordic-newsletter-consent"><input v-model="consent" type="checkbox" required/>
            <span>Jag vill få nyhetsbrev och har läst <NuxtLink to="/legal/privacy">integritetspolicyn</NuxtLink>.</span>
          </label>
        </form>
        <p v-if="newsletterMessage" :class="['nordic-newsletter-message',newsletterState]" role="status">{{newsletterMessage}}</p>
      </div>
    </section>
  </main>
</template>

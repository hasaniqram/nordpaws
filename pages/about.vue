<script setup lang="ts">
import {
  ArrowRight, Heart, Leaf, PawPrint, Sparkles, ShieldCheck,
  Quote, MapPin, Compass, CheckCircle2
} from 'lucide-vue-next'

const config = useRuntimeConfig()
const previewOnly = computed(() => !config.public.checkoutEnabled)

const values = [
  {
    title: 'Omtanke före allt',
    description: 'Vi vill göra det enklare att välja sådant som faktiskt kan underlätta vardagen för både djur och människor.',
    icon: Heart,
    number: '01'
  },
  {
    title: 'Det enkla är det vackra',
    description: 'Lugn skandinavisk design, tydlig information och genomtänkta detaljer. Inget onödigt – bara det som fyller en funktion.',
    icon: Leaf,
    number: '02'
  },
  {
    title: 'Förtroende måste förtjänas',
    description: 'Vi vill kunna stå bakom det vi visar. Därför ska produktinformation, leveransvillkor och leverantörsuppgifter kontrolleras före försäljning.',
    icon: ShieldCheck,
    number: '03'
  }
]

useSeoMeta({
  title: 'Vår berättelse – Norrli Pets',
  description: 'Lär känna visionen bakom Norrli Pets och grundaren Hasan Iqram. En personlig idé om omtanke, genomtänkt design och livet med våra fyrbenta vänner.',
  ogTitle: 'Vår berättelse | Norrli Pets',
  ogDescription: 'En idé, mycket arbete och en vision om en mer omtänksam vardag. Möt Hasan Iqram, skaparen bakom Norrli Pets.'
})
</script>

<template>
  <main class="norrli-about">
    <nav class="container norrli-about-breadcrumb" aria-label="Brödsmulor">
      <NuxtLink to="/">Startsida</NuxtLink>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Om Norrli Pets</span>
    </nav>

    <section class="container norrli-about-hero" aria-labelledby="about-heading">
      <div class="norrli-about-hero-copy">
        <span class="norrli-about-eyebrow">
          <span class="norrli-about-spark" aria-hidden="true"></span>
          VÅR BERÄTTELSE · SKAPAD MED OMTANKE
        </span>
        <h1 id="about-heading">Det börjar med <em>en idé.</em><br />Det växer med <em>hjärtat.</em></h1>
        <p class="norrli-about-hero-lead">
          Norrli Pets föddes ur en enkel tanke: det ska kännas lika fint att ta hand om våra
          fyrbenta vänner som det gör att dela livet med dem.
        </p>
        <p class="norrli-about-hero-support">
          Här möts skandinavisk enkelhet, nyfikenhet och viljan att skapa något meningsfullt.
          Inte bara en butik, utan ett projekt byggt med tid, engagemang och en tydlig vision.
        </p>
        <div class="norrli-about-hero-actions">
          <a href="#skaparen" class="norrli-about-button">Möt personen bakom <ArrowRight :size="17" aria-hidden="true" /></a>
          <NuxtLink to="/shop" class="norrli-about-textlink">Utforska sortimentet <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
        </div>
        <p v-if="previewOnly" class="norrli-about-preview">
          <Sparkles :size="15" aria-hidden="true" />
          Vi bygger fortfarande Norrli Pets. Sortimentet är just nu en förhandsvisning.
        </p>
      </div>
      <div class="norrli-about-hero-art" aria-hidden="true">
        <div class="norrli-about-art-circle circle-one"></div>
        <div class="norrli-about-art-circle circle-two"></div>
        <div class="norrli-about-art-inner">
          <PawPrint :size="100" :stroke-width="1" />
          <span>Nära naturen.<br />Nära varandra.</span>
          <Leaf :size="29" :stroke-width="1.4" />
        </div>
        <span class="norrli-about-art-caption">EN LITEN IDÉ, EN STOR OMSORG</span>
      </div>
    </section>

    <section class="norrli-about-manifesto" aria-labelledby="manifesto-heading">
      <div class="container norrli-about-manifesto-inner">
        <div>
          <span class="norrli-about-eyebrow">VARFÖR VI FINNS</span>
          <h2 id="manifesto-heading">För de små stunderna som betyder <em>allt.</em></h2>
        </div>
        <div class="norrli-about-manifesto-copy">
          <p>
            Glädjen när någon möter dig vid dörren. En promenad i frisk luft.
            Ett tryggt hörn att vila i. De bästa delarna av livet är ofta de enklaste.
          </p>
          <p>
            Vi vill bidra med genomtänkta idéer som gör de stunderna lite enklare,
            lugnare och mer lustfyllda. Med respekt för djurens behov och för
            människorna som älskar dem.
          </p>
        </div>
      </div>
    </section>

    <section class="container norrli-about-values" aria-labelledby="values-heading">
      <div class="norrli-about-section-heading">
        <span class="norrli-about-eyebrow">VÅR KOMPASS</span>
        <h2 id="values-heading">Tre värderingar. En riktning.</h2>
        <p>En vision är bara början. Det är valen längs vägen som gör den verklig.</p>
      </div>
      <div class="norrli-about-values-grid">
        <article v-for="value in values" :key="value.number" class="norrli-about-value-card">
          <div class="norrli-about-value-top">
            <span class="norrli-about-value-icon"><component :is="value.icon" :size="25" :stroke-width="1.6" aria-hidden="true" /></span>
            <span class="norrli-about-value-number">{{ value.number }}</span>
          </div>
          <h3>{{ value.title }}</h3>
          <p>{{ value.description }}</p>
        </article>
      </div>
    </section>

    <section id="skaparen" class="container norrli-about-founder" aria-labelledby="founder-heading">
      <div class="norrli-about-founder-portrait">
        <div class="norrli-about-founder-image-wrap">
          <FounderPortrait />
        </div>
        <div class="norrli-about-founder-photo-tag">
          <span>GRUNDARE &amp; SKAPARE</span>
          <strong>Hasan Iqram</strong>
        </div>
      </div>
      <div class="norrli-about-founder-story">
        <span class="norrli-about-eyebrow">MÄNNISKAN BAKOM NORRLI PETS</span>
        <h2 id="founder-heading">En vision som har fått växa med <em>tålamod, mod och hårt arbete.</em></h2>
        <p>
          Jag heter <strong>Hasan Iqram</strong> och Norrli Pets är min idé.
          Jag har skapat konceptet och arbetat med att utveckla webbplatsen,
          steg för steg, från en tanke till något man kan besöka och uppleva.
        </p>
        <p>
          För mig handlar det här projektet inte bara om produkter.
          Det handlar om att våga bygga något eget, att lära sig längs vägen och
          att aldrig förlora känslan för de små detaljerna. Varje sida, varje förbättring
          och varje nytt steg tar visionen lite längre.
        </p>
        <div class="norrli-about-founder-quote">
          <Quote :size="26" aria-hidden="true" />
          <blockquote>Jag tror att något stort kan börja med en enkel idé – om man ger den tid, omsorg och viljan att fortsätta.</blockquote>
          <span>En tanke bakom Norrli Pets</span>
        </div>
        <div class="norrli-about-founder-signature">
          <strong>Hasan Iqram</strong>
          <span>Initiativtagare · Konceptskapare · Webbplatsutvecklare</span>
        </div>
        <NuxtLink class="norrli-about-founder-copyright" to="/legal/copyright">
          Läs om skapandet och upphovsrätten <ArrowRight :size="16" aria-hidden="true" />
        </NuxtLink>
      </div>
    </section>

    <section class="container norrli-about-journey" aria-labelledby="journey-heading">
      <div class="norrli-about-journey-intro">
        <span class="norrli-about-eyebrow"><Compass :size="16" aria-hidden="true" /> RESAN FORTSÄTTER</span>
        <h2 id="journey-heading">Vi bygger hellre rätt än för fort.</h2>
        <p>
          Norrli Pets är fortfarande under utveckling. Därför tar vi oss tid att
          utvärdera produkter, leverantörer och kundinformation innan vi öppnar för köp.
          Det är ett löfte om hur vi vill arbeta, inte ett påstående om att allt redan är färdigt.
        </p>
      </div>
      <div class="norrli-about-journey-points">
        <div><CheckCircle2 :size="20" aria-hidden="true" /><span>En tydlig och genomtänkt upplevelse</span></div>
        <div><CheckCircle2 :size="20" aria-hidden="true" /><span>Ärliga besked om vad som är klart</span></div>
        <div><CheckCircle2 :size="20" aria-hidden="true" /><span>Omsorg i varje nytt beslut</span></div>
      </div>
    </section>

    <section class="container norrli-about-closing" aria-label="Upptäck Norrli Pets">
      <div class="norrli-about-closing-copy">
        <span class="norrli-about-eyebrow">TACK FÖR ATT DU ÄR HÄR</span>
        <h2>Det bästa ligger <em>framför oss.</em></h2>
        <p>Välkommen att följa en idé som växer – med hjärta för djur, design och vardagens små äventyr.</p>
      </div>
      <div class="norrli-about-closing-actions">
        <NuxtLink to="/shop" class="norrli-about-button">Upptäck Norrli Pets <ArrowRight :size="17" aria-hidden="true" /></NuxtLink>
        <NuxtLink to="/contact" class="norrli-about-textlink">Kom i kontakt <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
      </div>
    </section>
  </main>
</template>

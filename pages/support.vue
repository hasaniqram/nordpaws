<script setup lang="ts">
import { ArrowRight, PackageCheck, RotateCcw, ShieldCheck, FileText, MessageCircle, Truck, Search, ChevronRight } from 'lucide-vue-next'
const query=ref('')
const subjects=[
 {title:'Kontakta oss',to:'/contact',subtitle:'Ställ en fråga till kundservice',icon:MessageCircle},
 {title:'Leveransinformation',to:'/delivery',subtitle:'Frakt, leveransområde och postnummer',icon:Truck},
 {title:'Leveransvillkor',to:'/legal/shipping',subtitle:'När leveransvillkor och avgifter fastställs',icon:PackageCheck},
 {title:'Returer och ångerrätt',to:'/legal/returns',subtitle:'Ångerrätt, reklamation och returprocess',icon:RotateCcw},
 {title:'Integritetspolicy',to:'/legal/privacy',subtitle:'Hur personuppgifter hanteras',icon:ShieldCheck},
 {title:'Köpvillkor',to:'/legal/terms',subtitle:'Köp, betalning och konsumentskydd',icon:FileText}
]
const faqs=[
 {q:'Går det att beställa från Norrli Pets just nu?',a:'Inte ännu. Sortimentet visas som förhandsvisning och vi tar inte emot betalda beställningar. Vi kommer att publicera aktuella priser och köpvillkor före försäljningsstart.',to:'/legal/terms'},
 {q:'Vad kostar frakten och när får jag min vara?',a:'Fraktpris och leveranstider är ännu inte verifierade. Vi publicerar uppgifterna innan köp kan genomföras.',to:'/delivery'},
 {q:'Hur fungerar ångerrätt och reklamation?',a:'Vid distansköp av varor från företag gäller normalt 14 dagars ångerrätt med lagstadgade undantag. Reklamationsrätten är normalt tre år enligt konsumentköplagen.',to:'/legal/returns'},
 {q:'Hur kontaktar jag kundservice?',a:'Använd kontaktformuläret. Beskriv ärendet, men skicka inte känsliga personuppgifter eller betalningsinformation.',to:'/contact'},
 {q:'Kan jag se mina beställningar?',a:'Kundsidan finns redan, men funktionerna testas fortfarande inför lanseringen. Eventuella testbeställningar är inte riktiga köp.',to:'/account'},
 {q:'Hur använder ni min information?',a:'Kontaktformuläret lagrar namn, e-postadress och meddelande för att kunna hantera frågan. Läs om fler behandlingar och information som ännu behöver kompletteras före lansering.',to:'/legal/privacy'}
]
const results=computed(()=>faqs.filter(f=>!query.value.trim()||(f.q+' '+f.a).toLocaleLowerCase('sv-SE').includes(query.value.toLocaleLowerCase('sv-SE').trim())))
useSeoMeta({title:'Kundservice och hjälpcenter',description:'Norrli Pets hjälpcenter – kontakt, leveranser, returer, integritet och köpvillkor.'})
</script>
<template>
 <SupportShell title="Hur kan vi hjälpa dig?" eyebrow="NORRLI PETS · HJÄLPCENTER" intro="Tydliga svar, genomtänkt service och information som du kan lita på. Här hittar du allt om kontakt, leverans, returer och villkor.">
  <section class="norrli-support-section">
   <span class="norrli-support-kicker">HITTA SVAR DIREKT</span><h2>Vad vill du ha hjälp med?</h2>
   <div class="norrli-support-topics">
    <NuxtLink v-for="s in subjects" :key="s.to" :to="s.to" class="norrli-support-topic">
     <span class="norrli-support-topic-icon"><component :is="s.icon" :size="23" aria-hidden="true"/></span>
     <strong>{{ s.title }}</strong><small>{{ s.subtitle }}</small><ArrowRight :size="17" class="topic-arrow" aria-hidden="true"/>
    </NuxtLink>
   </div>
  </section>
  <section class="norrli-support-section">
   <div class="norrli-support-section-head"><div><span class="norrli-support-kicker">VANLIGA FRÅGOR</span><h2>Snabb hjälp</h2></div><span>{{ results.length }} frågor</span></div>
   <label class="norrli-faq-search"><Search :size="20" aria-hidden="true"/><span class="sr-only">Sök bland vanliga frågor</span><input v-model="query" type="search" placeholder="Sök bland vanliga frågor…" autocomplete="off"/></label>
   <div class="norrli-support-faqs">
    <details v-for="faq in results" :key="faq.q">
     <summary>{{ faq.q }}<ChevronRight :size="19" aria-hidden="true"/></summary>
     <div><p>{{ faq.a }}</p><NuxtLink :to="faq.to">Läs mer <ArrowRight :size="15" aria-hidden="true"/></NuxtLink></div>
    </details>
    <p v-if="!results.length" class="norrli-support-empty">Inga frågor matchar din sökning. <NuxtLink to="/contact">Kontakta kundservice</NuxtLink>.</p>
   </div>
  </section>
  <section class="norrli-support-highlight"><ShieldCheck :size="28" aria-hidden="true"/><div><h3>Vi är tydliga från början</h3><p>Norrli Pets befinner sig i förberedelsefas. Vi publicerar inte påhittade svarstider, returadresser, leveranstider eller fraktpriser. När informationen är bekräftad uppdaterar vi villkoren.</p></div></section>
 </SupportShell>
</template>

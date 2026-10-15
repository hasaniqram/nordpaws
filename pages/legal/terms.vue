<script setup lang="ts">
import { ShieldCheck, CreditCard, ShoppingBag, Info, ArrowRight } from 'lucide-vue-next'
useSeoMeta({title:'Köpvillkor',description:'Norrli Pets köpvillkor under förberedelse – information om priser, betalning, beställning och konsumentskydd.'})
</script>
<template>
<SupportShell title="Köpvillkor" eyebrow="VILLKOR · KÖP" updated="15 oktober 2026"
 intro="Här kan du läsa hur Norrli Pets planerar att informera om köp, priser och ansvar. Slutliga köpvillkor fastställs innan försäljningen öppnar.">
 <div class="norrli-support-notice"><Info :size="21" aria-hidden="true"/><div><strong>Förhandsinformation — inga bindande köp ännu.</strong>
  <p>Webbplatsen visar ett preliminärt sortiment. Du kan för närvarande inte betala, genomföra ett köp eller ingå ett köpavtal via vår checkout.</p></div></div>
 <section class="norrli-support-section"><span class="norrli-support-kicker">INFÖR KÖP</span><h2>En tydlig kundupplevelse</h2>
  <div class="norrli-support-feature-grid">
   <div><ShoppingBag :size="23" aria-hidden="true"/><h3>Produktinformation</h3><p>Beskrivning, tillgänglighet och relevanta produktuppgifter ska kontrolleras innan försäljning startar.</p></div>
   <div><CreditCard :size="23" aria-hidden="true"/><h3>Priser och betalning</h3><p>Alla bindande slutpriser, skatter, frakt och accepterade betalningssätt ska visas tydligt innan ett köp godkänns.</p></div>
   <div><ShieldCheck :size="23" aria-hidden="true"/><h3>Konsumentskydd</h3><p>Vid försäljning till konsument ska tillämplig svensk konsumentlagstiftning gälla. Villkoren får inte begränsa tvingande konsumenträtt.</p></div>
  </div>
 </section>
 <section class="norrli-support-section norrli-support-article">
  <h2>Villkor som ska fastställas före lansering</h2>
  <h3>Avtalspart och kontaktuppgifter</h3><p>Den ansvariga säljarens juridiska namn, organisationsnummer, geografiska adress och kontaktvägar ska publiceras före köp. Vi anger inga obekräftade företagsuppgifter i förhandsversionen.</p>
  <h3>Beställning och avtal</h3><p>Inga köpeavtal ingås genom webbplatsen i detta skede. När checkout öppnar ska beställningsflödet ange när ett bindande avtal uppkommer samt ge kunden relevant orderbekräftelse.</p>
  <h3>Produktpriser och tillgänglighet</h3><p>Priser och produktinformation kan komma att ändras under utveckling. Leverantörernas lageruppgifter och produktunderlag måste verifieras innan vi tar emot betalning.</p>
  <h3>Leveranser och frakt</h3><p>Vi publicerar de fraktkostnader, leveransalternativ och tidsuppskattningar som faktiskt gäller före lanseringen. Se <NuxtLink to="/legal/shipping">leveransvillkor</NuxtLink>.</p>
  <h3>Ångerrätt, reklamation och återbetalning</h3><p>Regler enligt distansavtalslagen och konsumentköplagen kommer att tillämpas på framtida köp. Läs vår <NuxtLink to="/legal/returns">information om returer och ångerrätt</NuxtLink>. Operativa returinstruktioner fastställs när butiken öppnar.</p>
  <h3>Personuppgifter</h3><p>Information om behandling av personuppgifter finns i vår <NuxtLink to="/legal/privacy">integritetspolicy</NuxtLink>. Den behöver kompletteras med verifierade ansvarighets- och lagringsuppgifter före lansering.</p>
 </section>
 <section class="norrli-support-reference"><strong>Mer information</strong><p>För vägledning om distansavtal och konsumenträtt, besök <a href="https://www.konsumentverket.se/" target="_blank" rel="noopener noreferrer">Konsumentverket ↗</a>.</p></section>
 <div class="norrli-support-actions"><NuxtLink to="/support">Till hjälpcentret <ArrowRight :size="16" aria-hidden="true"/></NuxtLink><NuxtLink to="/contact" class="secondary">Frågor om villkoren</NuxtLink></div>
</SupportShell>
</template>
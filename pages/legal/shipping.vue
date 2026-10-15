<script setup lang="ts">
import { Truck, Clock3, Package, ArrowRight, Info } from 'lucide-vue-next'
useSeoMeta({title:'Leveransvillkor',description:'Information om Norrli Pets planerade frakt- och leveransvillkor inför butikens öppning.'})
</script>
<template>
<SupportShell title="Leveransvillkor" eyebrow="VILLKOR · LEVERANS" updated="15 oktober 2026"
 intro="Vårt mål är att du alltid ska kunna se leveransalternativ, kostnader och tider innan du beställer. Läs vad som gäller under förberedelserna.">
 <div class="norrli-support-notice"><Info :size="21" aria-hidden="true"/><div><strong>Leveransvillkoren är inte slutligt fastställda.</strong><p>Butiken är en förhandsvisning. Inga betalda beställningar tas emot och inga fraktalternativ är aktiva.</p></div></div>
 <section class="norrli-support-section"><span class="norrli-support-kicker">ÖVERSIKT</span><h2>Leverans till Sverige</h2>
  <div class="norrli-support-feature-grid">
   <div><Truck :size="23" aria-hidden="true"/><h3>Leveransområde</h3><p>Vi förbereder försäljning till svenska adresser. Exakt leveransområde måste bekräftas innan köp öppnar.</p></div>
   <div><Clock3 :size="23" aria-hidden="true"/><h3>Leveranstider</h3><p>Leveranstider anges först när leverantörs- och transportavtal är verifierade. Ingen tidsram utlovas i dagsläget.</p></div>
   <div><Package :size="23" aria-hidden="true"/><h3>Fraktkostnader</h3><p>Slutligt fraktpris, eventuella avgifter och leveranssätt ska framgå tydligt före betalning.</p></div>
  </div>
 </section>
 <section class="norrli-support-section norrli-support-article">
  <h2>Så ska leveransinformationen fungera</h2>
  <h3>1. Innan köp</h3><p>Vi kommer att visa uppgifter om tillgängliga leveranssätt, kostnader, beräknad leveranstid och eventuella begränsningar före ett bindande köp. Produktpriser och leveransuppgifter som visas under utveckling är preliminära.</p>
  <h3>2. Bekräftelse och spårning</h3><p>Orderbekräftelser och leveransaviseringar behöver färdigställas och testas före lansering. Vi visar inte fiktiva spårningsnummer som om de vore verkliga leveranser.</p>
  <h3>3. Försening, skada eller utebliven vara</h3><p>Vid ett framtida köp gäller konsumentköplagen och tillämpliga distansavtalsregler. Om en vara blir försenad eller skadad ska kunden kunna kontakta säljaren och använda sina rättigheter enligt lag. Hur ärendet hanteras behöver beskrivas när den verkliga logistiklösningen är klar.</p>
  <h3>4. Internationella leverantörer</h3><p>Om varor skickas från ett annat land ska eventuella tillkommande kostnader och ansvar för import och avgifter framgå tydligt innan köpet ingås. Vi anger inga obekräftade upplägg.</p>
 </section>
 <section class="norrli-support-reference"><strong>Rättslig information</strong><p>Läs mer om dina rättigheter vid leverans och köp hos <a href="https://www.konsumentverket.se/" target="_blank" rel="noopener noreferrer">Konsumentverket ↗</a>.</p></section>
 <div class="norrli-support-actions"><NuxtLink to="/delivery">Läs leveransinformationen <ArrowRight :size="16" aria-hidden="true"/></NuxtLink><NuxtLink to="/contact" class="secondary">Ställ en fråga</NuxtLink></div>
</SupportShell>
</template>
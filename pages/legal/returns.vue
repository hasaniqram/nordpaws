<script setup lang="ts">
import { RotateCcw, ShieldCheck, Info, ArrowRight } from 'lucide-vue-next'
useSeoMeta({title:'Returer och ångerrätt',description:'Läs om ångerrätt, reklamation och returinformation hos Norrli Pets enligt svenska konsumentregler.'})
</script>
<template>
<SupportShell title="Returer och ångerrätt" eyebrow="KUNDENS RÄTTIGHETER" updated="15 oktober 2026"
 intro="Vi vill att du ska känna till dina rättigheter och enkelt kunna hitta rätt information om ånger, reklamation och återbetalning.">
 <div class="norrli-support-notice"><Info :size="21" aria-hidden="true"/><div><strong>Returhanteringen öppnar först när försäljningen startar.</strong>
  <p>Vi har ännu ingen publicerad returadress, returetikettstjänst eller fastställd returfrakt. Vi tar för närvarande inte emot riktiga beställningar.</p></div></div>
 <section class="norrli-support-section"><span class="norrli-support-kicker">DINA RÄTTIGHETER</span><h2>Trygghet enligt svensk konsumenträtt</h2>
  <div class="norrli-support-feature-grid">
   <div><RotateCcw :size="23" aria-hidden="true"/><h3>14 dagars ångerrätt</h3><p>Vid distansköp från företag har du normalt 14 dagar på dig att ångra ett varuköp från dagen efter mottagandet. Lagstadgade undantag kan gälla.</p></div>
   <div><ShieldCheck :size="23" aria-hidden="true"/><h3>Tre års reklamationsrätt</h3><p>Vid ursprungliga fel på en vara har konsumenter normalt rätt att reklamera inom tre år enligt konsumentköplagen.</p></div>
   <div><Info :size="23" aria-hidden="true"/><h3>Tydlig återbetalning</h3><p>Regler för när återbetalning ska ske och eventuella returfraktkostnader följer konsumentlagstiftningen och den information som lämnats före köpet.</p></div>
  </div>
 </section>
 <section class="norrli-support-section norrli-support-article">
  <h2>Så fungerar ångerrätten</h2>
  <h3>Meddela att du ångrar köpet</h3><p>Vid ett framtida distansköp med ångerrätt behöver du lämna ett tydligt meddelande inom ångerfristen. Du behöver normalt inte ange något skäl. En särskild, lättillgänglig digital ångerfunktion med mottagningsbevis ska finnas när ett köp kan ingås online. Den funktionen är ännu inte aktiv eftersom checkout är stängd.</p>
  <h3>Returfrakt och varans skick</h3><p>Om du ska bekosta en retur måste detta ha informerats om innan köpet. I vissa fall kan värdeminskningsavdrag bli aktuellt om varan hanterats mer än vad som behövs för att undersöka den. Lagstadgade undantag från ångerrätten kan gälla för vissa varor.</p>
  <h3>Återbetalning</h3><p>Återbetalning ska göras enligt lagens tidsfrister och som huvudregel med samma betalningssätt som användes vid köpet. Säljaren kan i vissa fall avvakta tills varan kommit tillbaka eller retur har styrkts. Vi publicerar konkreta returinstruktioner före lansering.</p>
  <h2>Om det är fel på varan: reklamation</h2>
  <p>Reklamation är inte samma sak som ångerrätt. Du kan reklamera en felaktig vara till säljaren även när ångerfristen gått ut. Åtgärder kan exempelvis vara reparation, utbyte, prisavdrag eller hävning enligt de förutsättningar som gäller i lag. Spara information om köpet och felet.</p>
  <h2>Vad behöver du göra just nu?</h2><p>Eftersom Norrli Pets ännu inte genomför riktiga köp finns det inga aktuella kundreturer att registrera. Har du en fråga kan du skriva till oss via kontaktformuläret, men det är ännu inte en aktiverad digital ångerfunktion.</p>
 </section>
 <section class="norrli-support-reference"><strong>Officiell vägledning</strong>
  <p><a href="https://www.konsumentverket.se/konsumentratt-process/angerratt/" target="_blank" rel="noopener noreferrer">Konsumentverket: ångerrätt ↗</a> ·
  <a href="https://www.konsumentverket.se/konsumentratt-process/reklamera-vara/" target="_blank" rel="noopener noreferrer">Konsumentverket: reklamation ↗</a></p>
 </section>
 <div class="norrli-support-actions"><NuxtLink to="/contact">Frågor om retur eller reklamation <ArrowRight :size="16" aria-hidden="true"/></NuxtLink><NuxtLink to="/legal/terms" class="secondary">Läs köpvillkoren</NuxtLink></div>
</SupportShell>
</template>
<script setup lang="ts">
import { LockKeyhole, UserRound, Mail, Info, ArrowRight } from 'lucide-vue-next'
useSeoMeta({title:'Integritetspolicy',description:'Information om personuppgifter, kontaktformulär, kundkonton och integritetsrättigheter hos Norrli Pets.'})
</script>
<template>
<SupportShell title="Integritetspolicy" eyebrow="INTEGRITET · PERSONUPPGIFTER" updated="15 oktober 2026"
 intro="Vi vill beskriva vilka personuppgifter som används när du besöker webbplatsen, kontaktar oss eller använder ett kundkonto.">
 <div class="norrli-support-notice"><Info :size="21" aria-hidden="true"/><div><strong>Preliminär information – behöver kompletteras.</strong>
  <p>Identitet och kontaktuppgifter för personuppgiftsansvarig, rättsliga grunder, lagringstider och vissa leverantörsuppgifter måste fastställas och publiceras. Den här sidan är därför inte en färdig juridiskt granskad integritetspolicy.</p></div></div>
 <section class="norrli-support-section"><span class="norrli-support-kicker">VAD SOM BEHANDLAS</span><h2>Uppgifter i olika tjänster</h2>
  <div class="norrli-support-feature-grid">
   <div><Mail :size="23" aria-hidden="true"/><h3>Kontakt med kundservice</h3><p>Namn, e-postadress, val av ärendekategori, eventuellt orderreferens och meddelande sparas för att hantera din fråga.</p></div>
   <div><UserRound :size="23" aria-hidden="true"/><h3>Kundkonton</h3><p>Om du använder inloggning behandlas uppgifter kopplade till konto och verifiering via vår autentiseringsleverantör. Orderhistorik visas bara efter verifierad inloggning.</p></div>
   <div><LockKeyhole :size="23" aria-hidden="true"/><h3>Teknisk drift</h3><p>För webbplatsens funktion, säkerhet och felsökning kan tekniska uppgifter behandlas av drift- och databastjänster.</p></div>
  </div>
 </section>
 <section class="norrli-support-section norrli-support-article">
  <h2>Vilka andra uppgifter kan behandlas?</h2>
  <h3>Nyhetsbrev</h3><p>Om du väljer att anmäla dig till nyhetsbrev behandlas din e-postadress. Nyhetsbrevshanteringen använder en separat tjänst. Rättslig grund, återkallelse och hur prenumerationer avslutas behöver ses över och dokumenteras i en slutlig policy.</p>
  <h3>Favoriter och lokal lagring</h3><p>Funktioner som favoritlistor kan spara inställningar lokalt i din webbläsare. Webbplatsen kan också använda tekniskt nödvändig lagring för inloggning och andra funktioner. En fullständig cookie- och spårningsgenomgång krävs före lansering.</p>
  <h3>Betalnings- och leveransuppgifter</h3><p>Betalningar är inte aktiverade. Om framtida köp tillåts måste information om eventuella betalnings- och logistikleverantörer samt tillhörande uppgifter publiceras innan de börjar användas.</p>
  <h2>Hur länge sparas uppgifter?</h2><p>Exakta lagringsperioder och raderingsrutiner behöver fastställas för kontaktärenden, konton och övriga datakategorier. Ingen generell tidsfrist utlovas i nuläget.</p>
  <h2>Vilka kan ta del av uppgifterna?</h2><p>Webbplatsen använder drift, autentisering och datalagring via externa tjänsteleverantörer. Vilka personuppgiftsbiträden som används, var uppgifter behandlas och eventuella överföringar utanför EU/EES ska kartläggas och beskrivas tydligt.</p>
  <h2>Dina rättigheter</h2><p>Enligt GDPR kan du bland annat ha rätt att begära tillgång, rättelse, radering och begränsning av behandlingen. I vissa fall finns också rätt att invända eller få ut uppgifter. Du kan lämna klagomål till Integritetsskyddsmyndigheten (IMY).</p>
  <h2>Frågor om personuppgifter</h2><p>Du kan använda <NuxtLink to="/contact">kontaktformuläret</NuxtLink> och välja ”Personuppgifter och integritet”. Vi kan behöva kontrollera identitet innan en begäran handläggs. Lämna inte personnummer eller känsliga uppgifter i det öppna formuläret.</p>
 </section>
 <section class="norrli-support-reference"><strong>Officiell information</strong><p>
  <a href="https://www.imy.se/vanliga-fragor-och-svar/vad-ska-en-integritetspolicy-innehalla/" target="_blank" rel="noopener noreferrer">IMY: vad en integritetspolicy ska innehålla ↗</a>
 </p></section>
 <div class="norrli-support-actions"><NuxtLink to="/contact">Kontakta oss om integritet <ArrowRight :size="16" aria-hidden="true"/></NuxtLink><NuxtLink to="/support" class="secondary">Till hjälpcentret</NuxtLink></div>
</SupportShell>
</template>
<script setup lang="ts">
import { Copyright, Image as ImageIcon, BadgeCheck, Scale, FileCheck2, Mail, ExternalLink, ArrowRight, ShieldCheck, Info } from 'lucide-vue-next'
useSeoMeta({
  title:'Upphovsrätt och användning av innehåll',
  description:'Information om upphovsrätt, bilder, varumärken och tillåten användning av innehåll på Norrli Pets.'
})
</script>

<template>
  <SupportShell
    title="Upphovsrätt och innehåll"
    eyebrow="NORRLI PETS · COPYRIGHT"
    updated="15 oktober 2026"
    intro="Vi värnar om kreativt arbete och respekterar både våra egna och andras rättigheter. Här förklarar vi hur innehåll på webbplatsen får användas."
  >
    <section class="norrli-copyright-founder norrli-copyright-founder-with-portrait" aria-label="Skaparen bakom Norrli Pets">
      <div class="norrli-copyright-founder-story">
        <span class="norrli-support-kicker">MÄNNISKAN BAKOM IDÉN</span>
        <h2>Skapad av <strong>Hasan Iqram</strong></h2>
        <p>
          Norrli Pets bygger på Hasan Iqrams egen idé, vision och arbete med att
          utveckla webbplatsen. Från det första konceptet till den digitala
          kundupplevelsen är det ett projekt skapat med engagemang, målmedvetenhet
          och omtanke om djur och deras människor.
        </p>
        <span class="norrli-copyright-founder-role">Initiativtagare · Konceptskapare · Webbplatsutvecklare</span>
      </div>
      <div class="norrli-copyright-founder-portrait">
        <FounderPortrait />
        <span class="norrli-copyright-founder-photo-caption">Hasan Iqram · Norrli Pets</span>
      </div>
    </section>

    <section class="norrli-copyright-summary" aria-label="Information om upphovsrätt">
      <div class="norrli-copyright-summary-icon"><Copyright :size="30" aria-hidden="true" /></div>
      <div>
        <span class="norrli-support-kicker">INNEHÅLL OCH RÄTTIGHETER</span>
        <h2>© {{ new Date().getFullYear() }} Norrli Pets</h2>
        <p>
          Texter, grafiskt material och annat innehåll kan vara skyddade av upphovsrätt.
          Rättigheterna tillkommer den som skapat materialet eller den som förvärvat dem.
          Material från tredje part omfattas av respektive rättighetshavares villkor.
        </p>
      </div>
    </section>

    <div class="norrli-support-notice">
      <Info :size="21" aria-hidden="true" />
      <div>
        <strong>Viktig information om webbplatsens innehåll</strong>
        <p>
          Norrli Pets är under utveckling. Produktbilder, fotografier och illustrationer kan
          komma från externa leverantörer, bildtjänster eller andra källor.
          En copyrighttext överlåter inte deras upphovsrätt till Norrli Pets.
        </p>
      </div>
    </div>

    <section class="norrli-support-section">
      <span class="norrli-support-kicker">VAD GÄLLER?</span>
      <h2>Respekt för skapande och äganderätt</h2>
      <div class="norrli-copyright-grid">
        <article>
          <div class="norrli-copyright-card-icon"><Copyright :size="23" aria-hidden="true" /></div>
          <h3>Texter och formgivning</h3>
          <p>Originalmaterial på webbplatsen kan omfattas av upphovsrätt. Rättigheterna förutsätter att innehållet uppfyller tillämpliga skyddskrav och att rättigheterna tillkommer respektive upphovsperson eller rättighetshavare.</p>
        </article>
        <article>
          <div class="norrli-copyright-card-icon"><ImageIcon :size="23" aria-hidden="true" /></div>
          <h3>Fotografier och illustrationer</h3>
          <p>Produktbilder, inspirationsbilder, ikoner och illustrationer kan tillhöra andra rättighetshavare och användas med licens eller tillstånd. Det är inte tillåtet att anta att dessa bilder är fria att återanvända.</p>
        </article>
        <article>
          <div class="norrli-copyright-card-icon"><BadgeCheck :size="23" aria-hidden="true" /></div>
          <h3>Namn och logotyp</h3>
          <p>Norrli Pets används som namn och kännetecken för webbplatsen. Namn och grafiska kännetecken kan omfattas av olika rättigheter. Vi påstår inte att varumärket är registrerat och använder inte registreringssymbolen ®.</p>
        </article>
        <article>
          <div class="norrli-copyright-card-icon"><Scale :size="23" aria-hidden="true" /></div>
          <h3>Lagliga undantag</h3>
          <p>Upphovsrätten har undantag och begränsningar, exempelvis viss citering med korrekt källangivelse. Denna information är inte avsedd att begränsa rättigheter du har enligt svensk lag.</p>
        </article>
      </div>
    </section>

    <section class="norrli-support-section norrli-support-article">
      <span class="norrli-support-kicker">ANVÄNDNING OCH TILLSTÅND</span>
      <h2>Vill du använda vårt material?</h2>
      <h3>Privat användning och delning</h3>
      <p>Du får naturligtvis besöka webbplatsen och dela länkar till våra sidor. Användning av skyddat innehåll, till exempel återpublicering av fotografier eller kopiering av längre texter, kan kräva rättighetshavarens tillstånd om inget lagligt undantag gäller.</p>
      <h3>Publicering, försäljning och marknadsföring</h3>
      <p>Kontakta oss före kommersiell återanvändning av material som vi faktiskt innehar rättigheterna till. För material som ägs av tredje part behöver du inhämta tillstånd från respektive rättighetshavare. En länk till vår webbplats ersätter inte sådant tillstånd.</p>
      <h3>Programvara och externa tjänster</h3>
      <p>Webbplatsen använder tekniska komponenter, tjänster och bibliotek som kan ha egna upphovsrätter och licensvillkor. Dessa påverkas inte av Norrli Pets copyrightmeddelande.</p>
    </section>

    <section class="norrli-copyright-contact">
      <div class="norrli-copyright-contact-icon"><Mail :size="25" aria-hidden="true" /></div>
      <div>
        <span class="norrli-support-kicker">RÄTTIGHETSFRÅGOR</span>
        <h2>Begär tillstånd eller anmäl ett problem</h2>
        <p>
          Har du en fråga om hur en bild eller text används, eller anser du att vi publicerat ditt
          material utan tillstånd? Skicka information via kontaktformuläret och välj
          <strong>”Upphovsrätt och innehåll”</strong>. Bifoga gärna en relevant webbadress
          och beskriv vad ärendet gäller. Undvik att skicka känsliga personuppgifter.
        </p>
        <NuxtLink to="/contact" class="norrli-copyright-action">
          Kontakta oss om upphovsrätt <ArrowRight :size="17" aria-hidden="true" />
        </NuxtLink>
      </div>
    </section>

    <section class="norrli-support-reference">
      <strong><ShieldCheck :size="16" aria-hidden="true" /> Officiell vägledning</strong>
      <p>På <a href="https://www.prv.se/sv/upphovsratt/" target="_blank" rel="noopener noreferrer">PRV:s webbplats <ExternalLink :size="13" aria-hidden="true" /></a> kan du läsa om hur upphovsrätt uppkommer och vilka rättigheter och undantag som gäller.</p>
    </section>

    <div class="norrli-support-actions">
      <NuxtLink to="/contact">Fråga om användning av innehåll <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
      <NuxtLink to="/legal/terms" class="secondary">Läs köpvillkoren</NuxtLink>
    </div>
  </SupportShell>
</template>

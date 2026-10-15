<script setup lang="ts">
import { Truck, MapPin, ShieldCheck, ArrowRight, Clock3, PackageCheck, Info } from 'lucide-vue-next'
import { deliveryReadiness, formatSwedishPostcode } from '~/utils/deliveryReadiness'

const postcode = ref('')
const checked = ref(false)
const validPostcode = computed(() => formatSwedishPostcode(postcode.value))
const inspectPostcode = () => { checked.value = true }
watch(postcode, () => { checked.value = false })
useSeoMeta({
  title: 'Leverans och frakt',
  description: 'Läs om förberedelserna för svenska leveranser hos Norrli Pets. Aktuella fraktkostnader och tider publiceras före försäljningsstart.'
})
</script>

<template>
  <main class="norrli-delivery-page">
    <section class="container norrli-delivery-hero">
      <span class="eyebrow"><Truck :size="16" aria-hidden="true" /> NORRLI PETS · LEVERANS</span>
      <h1>Trygga leveranser, tydliga villkor</h1>
      <p>Vi bygger en genomtänkt leveransupplevelse för våra svenska kunder. Fraktkostnader, leveranstider och transportörer publiceras när de är bekräftade.</p>
      <span class="norrli-delivery-status"><Info :size="16" aria-hidden="true" /> Förhandsinformation – försäljningen är inte öppen</span>
    </section>

    <section class="container norrli-delivery-grid" aria-label="Leveransinformation">
      <article class="norrli-delivery-card">
        <MapPin :size="30" aria-hidden="true" />
        <h2>Leveransområde</h2>
        <p>Butiken förbereds för leveranser inom <strong>{{ deliveryReadiness.countryName }}</strong>. Leveranser är ännu inte aktiva.</p>
      </article>
      <article class="norrli-delivery-card">
        <Truck :size="30" aria-hidden="true" />
        <h2>Fraktpris</h2>
        <p>Fraktpriset är ännu <strong>inte fastställt</strong>. Vi visar kostnaden innan någon betalningsmöjlighet aktiveras.</p>
      </article>
      <article class="norrli-delivery-card">
        <Clock3 :size="30" aria-hidden="true" />
        <h2>Leveranstid</h2>
        <p>Vi inväntar bekräftade leveranstider från våra leverantörer och transportörer. Inga dagar är utlovade ännu.</p>
      </article>
    </section>

    <section class="container norrli-postcode-panel">
      <div>
        <span class="eyebrow">LEVERANSFÖRBEREDELSER</span>
        <h2>Kontrollera postnummerformat</h2>
        <p>Du kan kontrollera formatet på ett svenskt postnummer. Det här är <strong>inte</strong> en kontroll av leveransbarhet och visar inte fraktpris eller leveranstid.</p>
        <form class="norrli-postcode-form" @submit.prevent="inspectPostcode">
          <label for="norrli-postcode">Svenskt postnummer</label>
          <div><input id="norrli-postcode" v-model="postcode" inputmode="numeric" autocomplete="postal-code" maxlength="7" required placeholder="123 45" />
          <button type="submit">Kontrollera <ArrowRight :size="16" aria-hidden="true" /></button></div>
        </form>
        <p v-if="checked && validPostcode" class="norrli-postcode-valid" role="status">
          <ShieldCheck :size="18" aria-hidden="true" /> Postnummer {{ validPostcode }} har giltigt svenskt format. Leveransalternativ är ännu inte bekräftade.
        </p>
        <p v-else-if="checked" class="norrli-postcode-error" role="alert">
          Ange fem siffror, till exempel 123 45.
        </p>
        <small>Kontrollen sker i din webbläsare. Postnumret skickas inte till vår server.</small>
      </div>
      <div class="norrli-postcode-art" aria-hidden="true"><PackageCheck :size="80" /><span>Nära naturen,<br />nära varandra.</span></div>
    </section>

    <section class="container norrli-delivery-bottom">
      <div>
        <span class="eyebrow">INFÖR DIN BESTÄLLNING</span>
        <h2>Allt ska vara tydligt innan du handlar</h2>
        <p>Vi kommer att visa slutpris, fraktpris, leveranstid och gällande konsumentvillkor innan checkout öppnar. Nuvarande produktpriser är preliminära.</p>
      </div>
      <div class="norrli-delivery-links">
        <NuxtLink to="/legal/shipping">Leveransvillkor <ArrowRight :size="17" aria-hidden="true" /></NuxtLink>
        <NuxtLink to="/legal/returns">Returer och ångerrätt <ArrowRight :size="17" aria-hidden="true" /></NuxtLink>
        <NuxtLink to="/contact">Kontakta kundservice <ArrowRight :size="17" aria-hidden="true" /></NuxtLink>
      </div>
    </section>
  </main>
</template>

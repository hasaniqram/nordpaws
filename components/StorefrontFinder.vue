<script setup lang="ts">
import { ArrowRight, RotateCcw, PawPrint, Sparkles } from 'lucide-vue-next'
import { COLLECTION_NEEDS } from '~/utils/storefrontDiscovery.mjs'

const pet = ref<'Dogs'|'Cats'|''>('')
const need = ref('')
const selected = computed(() => COLLECTION_NEEDS.find((item) => item.id === need.value))
const destination = computed(() => {
  const params = new URLSearchParams()
  if (pet.value) params.set('category', pet.value)
  if (need.value) params.set('need', need.value)
  return '/shop?' + params.toString()
})
const reset = () => { pet.value = ''; need.value = '' }
</script>

<template>
  <section class="norrli-finder container" aria-labelledby="norrli-finder-title">
    <div class="norrli-finder-intro">
      <span class="nordic-overline"><Sparkles :size="16" aria-hidden="true" /> PERSONLIG UPPTÄCKT</span>
      <h2 id="norrli-finder-title">Vad passar er vardag?</h2>
      <p>Välj din fyrbenta vän och vad du letar efter. Vi visar relevanta produktidéer i kollektionen, utan att påstå att de är individuellt rekommenderade eller kvalitetstestade.</p>
    </div>
    <div class="norrli-finder-panel">
      <fieldset>
        <legend><span>01</span> Vem handlar du till?</legend>
        <div class="norrli-finder-options">
          <button type="button" :aria-pressed="pet === 'Dogs'" :class="{active:pet==='Dogs'}" @click="pet='Dogs'">Hund</button>
          <button type="button" :aria-pressed="pet === 'Cats'" :class="{active:pet==='Cats'}" @click="pet='Cats'">Katt</button>
        </div>
      </fieldset>
      <fieldset :disabled="!pet">
        <legend><span>02</span> Vad är viktigast just nu?</legend>
        <div class="norrli-finder-options">
          <button v-for="item in COLLECTION_NEEDS" :key="item.id" type="button"
            :class="{active:need===item.id}" :aria-pressed="need===item.id"
            @click="need=item.id">{{ item.title }}</button>
        </div>
      </fieldset>
      <div class="norrli-finder-actions">
        <p aria-live="polite">{{ !pet ? 'Börja med att välja hund eller katt.' : !selected ? 'Välj ett område för att fortsätta.' : 'Klart! Utforska '+selected.title.toLowerCase()+' för '+(pet==='Dogs'?'hund':'katt')+'.' }}</p>
        <div>
          <button type="button" class="norrli-finder-reset" @click="reset"><RotateCcw :size="15" aria-hidden="true" /> Börja om</button>
          <NuxtLink v-if="pet && selected" :to="destination" class="nordic-pill-button">Visa produktidéer <ArrowRight :size="17" aria-hidden="true" /></NuxtLink>
        </div>
      </div>
    </div>
    <p class="norrli-finder-note"><PawPrint :size="15" aria-hidden="true" /> Sortiment och leverantörer är under granskning. Guiden sorterar enbart befintliga produktidéer.</p>
  </section>
</template>

<style scoped>
.norrli-finder{padding-block:65px 25px}.norrli-finder-intro{max-width:730px;margin-bottom:26px}.norrli-finder-intro h2{font:500 clamp(34px,4vw,55px)/1.08 Georgia,serif;letter-spacing:-.045em;color:#1b4c35;margin:12px 0}.norrli-finder-intro p{color:#4d6b56;line-height:1.75;font-size:14px}.norrli-finder-panel{background:linear-gradient(120deg,#e8efe5,#f4f2e9);border:1px solid #d2e0d0;border-radius:25px;padding:clamp(22px,4vw,40px);display:grid;gap:25px}.norrli-finder-panel fieldset{border:0;margin:0;padding:0;min-width:0}.norrli-finder-panel fieldset:disabled{opacity:.45}.norrli-finder-panel legend{font-size:14px;font-weight:800;color:#224a36;margin-bottom:13px}.norrli-finder-panel legend span{font:italic 19px Georgia,serif;color:#66876d;margin-right:11px}.norrli-finder-options{display:flex;flex-wrap:wrap;gap:9px}.norrli-finder-options button{border:1px solid #c7d7c5;border-radius:40px;background:#fff;padding:12px 19px;cursor:pointer;color:#28533a;font-weight:750}.norrli-finder-options button:hover,.norrli-finder-options button.active{background:#21543c;border-color:#21543c;color:white}.norrli-finder-options button:focus-visible,.norrli-finder-reset:focus-visible{outline:3px solid #267547;outline-offset:3px}.norrli-finder-actions{border-top:1px solid #cbdbcb;padding-top:20px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}.norrli-finder-actions p{font-size:12px;color:#3b5f46;margin:0}.norrli-finder-actions>div{display:flex;align-items:center;gap:15px;flex-wrap:wrap}.norrli-finder-reset{border:0;background:transparent;color:#34664a;display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-weight:750}.norrli-finder-note{display:flex;align-items:center;gap:7px;font-size:11px;color:#647668;line-height:1.5;margin:13px 0 0}@media(max-width:620px){.norrli-finder{padding-block:44px 18px}.norrli-finder-options button{flex:1 1 auto}.norrli-finder-actions>div{width:100%;justify-content:space-between}.norrli-finder-actions .nordic-pill-button{font-size:12px}}
@media(prefers-reduced-motion:reduce){.norrli-finder *{scroll-behavior:auto;transition:none!important}}
</style>

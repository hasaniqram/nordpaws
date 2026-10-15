<script setup lang="ts">
import { ArrowRight, ChevronRight, HeartHandshake, Info, MessageCircle, ShieldCheck } from 'lucide-vue-next'
defineProps<{
  title:string
  eyebrow?:string
  intro:string
  updated?:string
}>()
const route=useRoute()
const entries=[
  {to:'/support',label:'Hjälpcenter'},
  {to:'/contact',label:'Kontakta oss'},
  {to:'/delivery',label:'Leveransinformation'},
  {to:'/legal/shipping',label:'Leveransvillkor'},
  {to:'/legal/returns',label:'Returer och ångerrätt'},
  {to:'/legal/privacy',label:'Integritetspolicy'},
  {to:'/legal/terms',label:'Köpvillkor'}
]
</script>
<template>
  <main class="norrli-support">
    <div class="norrli-support-ribbon">
      <div class="container"><ShieldCheck :size="16" aria-hidden="true"/>
        <span>Butiken förbereds inför lansering — vi tar ännu inte emot betalda beställningar.</span>
        <NuxtLink to="/delivery">Läs om leveranser <ArrowRight :size="14" aria-hidden="true"/></NuxtLink>
      </div>
    </div>
    <div class="container norrli-support-breadcrumb" aria-label="Brödsmulor">
      <NuxtLink to="/">Startsida</NuxtLink><ChevronRight :size="14" aria-hidden="true"/>
      <NuxtLink to="/support">Kundservice</NuxtLink>
      <template v-if="route.path!=='/support'"><ChevronRight :size="14" aria-hidden="true"/><span aria-current="page">{{ title }}</span></template>
    </div>
    <header class="container norrli-support-hero">
      <div>
        <span class="norrli-support-eyebrow"><HeartHandshake :size="16" aria-hidden="true"/>{{ eyebrow||'NORRLI PETS · KUNDSERVICE' }}</span>
        <h1>{{ title }}</h1>
        <p>{{ intro }}</p>
        <div class="norrli-support-hero-meta"><span><Info :size="15" aria-hidden="true"/> Förhandsinformation</span>
          <span v-if="updated">Uppdaterad: {{ updated }}</span></div>
      </div>
      <div class="norrli-support-hero-mark" aria-hidden="true">
        <HeartHandshake :size="64" :stroke-width="1.3"/><span>Nära naturen.<br/>Nära varandra.</span>
      </div>
    </header>
    <div class="container norrli-support-layout">
      <aside class="norrli-support-aside" aria-label="Kundservice">
        <div class="norrli-support-aside-title">HITTA RÄTT HJÄLP</div>
        <nav class="norrli-support-nav" aria-label="Kundservice och villkor">
          <NuxtLink v-for="entry in entries" :key="entry.to" :to="entry.to"
            :class="{active:route.path===entry.to}"
            :aria-current="route.path===entry.to?'page':undefined">
            {{ entry.label }}<ChevronRight :size="16" aria-hidden="true"/>
          </NuxtLink>
        </nav>
        <div class="norrli-support-aside-contact">
          <MessageCircle :size="23" aria-hidden="true"/>
          <strong>Behöver du hjälp?</strong>
          <p>Skicka din fråga via vårt kontaktformulär. Vi lovar ingen svarstid innan kundservicen är fullt etablerad.</p>
          <NuxtLink to="/contact">Kontakta oss <ArrowRight :size="16" aria-hidden="true"/></NuxtLink>
        </div>
      </aside>
      <article class="norrli-support-content"><slot/></article>
    </div>
    <div class="container norrli-support-bottom">
      <div><span class="norrli-support-eyebrow">FRÅGOR OCH FUNDERINGAR</span><h2>Vi hjälper dig att hitta rätt</h2>
        <p>Se våra vanligaste frågor eller kontakta oss via formuläret.</p></div>
      <div><NuxtLink to="/support">Besök hjälpcentret <ArrowRight :size="17" aria-hidden="true"/></NuxtLink>
        <NuxtLink to="/contact" class="outline">Skriv till oss <ArrowRight :size="17" aria-hidden="true"/></NuxtLink></div>
    </div>
  </main>
</template>

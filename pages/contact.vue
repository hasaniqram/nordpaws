<script setup lang="ts">
import { ArrowRight, Mail, MessageCircle, ShieldCheck, AlertCircle, CheckCircle2, Truck, RotateCcw } from 'lucide-vue-next'
const form=reactive({name:'',email:'',topic:'general',orderReference:'',message:''})
const state=ref<'idle'|'loading'|'success'|'error'>('idle')
const feedback=ref('')
const submitted=ref(false)
const topics=[
 {value:'general',label:'Allmän fråga'},
 {value:'product',label:'Produkter och sortiment'},
 {value:'delivery',label:'Leverans och frakt'},
 {value:'returns',label:'Returer och reklamation'},
 {value:'account',label:'Mitt konto'},
 {value:'privacy',label:'Personuppgifter och integritet'}
]
const submit=async()=>{
  if(state.value==='loading')return
  state.value='loading';feedback.value='';submitted.value=false
  try{
    await $fetch('/api/contact',{method:'POST',body:{...form}})
    state.value='success'
    feedback.value='Tack! Ditt meddelande har sparats. Spara gärna en egen kopia av din fråga.'
    submitted.value=true
    form.name='';form.email='';form.topic='general';form.orderReference='';form.message=''
  }catch(error:any){
    state.value='error'
    feedback.value=error?.data?.statusMessage||'Vi kunde inte spara ditt meddelande just nu. Försök igen senare.'
  }
}
useSeoMeta({title:'Kontakta kundservice',description:'Kontakta Norrli Pets kundservice via vårt formulär. Hjälp med produkter, leverans, retur och integritetsfrågor.'})
</script>
<template>
 <SupportShell title="Kontakta oss" eyebrow="PERSONLIG HJÄLP · KUNDSERVICE" intro="Frågor om sortiment, leverans, returer eller personuppgifter? Skicka din fråga direkt via formuläret.">
  <section class="norrli-support-section">
   <div class="norrli-support-section-head"><div><span class="norrli-support-kicker">SKRIV TILL OSS</span><h2>Hur kan vi hjälpa dig?</h2></div><span><MessageCircle :size="17" aria-hidden="true"/> Kontaktformulär</span></div>
   <p class="norrli-support-muted">Fyll i dina kontaktuppgifter och beskriv ditt ärende. Vi tar ännu inte emot betalda beställningar och kan därför inte ge information om verkliga leveranser eller orderstatus.</p>
   <div v-if="state==='success'&&submitted" class="norrli-support-success" role="status" aria-live="polite">
     <CheckCircle2 :size="26" aria-hidden="true"/><div><strong>Meddelandet är mottaget</strong><p>{{ feedback }}</p>
     <small>Detta är en bekräftelse i webbläsaren. Ett separat bekräftelsemejl eller ärendenummer skapas inte i nuläget.</small></div>
   </div>
   <form class="norrli-support-form" @submit.prevent="submit">
     <div class="norrli-support-fields">
       <label for="support-name">Namn <span aria-hidden="true">*</span>
         <input id="support-name" v-model.trim="form.name" required minlength="2" maxlength="100" autocomplete="name" placeholder="Ditt namn"/>
       </label>
       <label for="support-email">E-postadress <span aria-hidden="true">*</span>
         <input id="support-email" v-model.trim="form.email" required type="email" maxlength="254" autocomplete="email" placeholder="namn@exempel.se"/>
       </label>
     </div>
     <label for="support-topic">Vad gäller din fråga? <span aria-hidden="true">*</span>
       <select id="support-topic" v-model="form.topic" required>
         <option v-for="topic in topics" :key="topic.value" :value="topic.value">{{ topic.label }}</option>
       </select>
     </label>
     <label for="support-reference">Orderreferens <span class="norrli-optional">valfritt</span>
       <input id="support-reference" v-model.trim="form.orderReference" maxlength="64" pattern="[-a-zA-Z0-9 _]*" placeholder="Endast om du har en relevant referens"/>
     </label>
     <label for="support-message">Ditt meddelande <span aria-hidden="true">*</span>
       <textarea id="support-message" v-model.trim="form.message" required minlength="10" maxlength="3500"
         rows="7" placeholder="Beskriv din fråga så tydligt som möjligt…"/>
       <span class="norrli-input-count">{{ form.message.length }} / 3 500 tecken</span>
     </label>
     <div class="norrli-support-privacy-note"><ShieldCheck :size="20" aria-hidden="true"/><p>
       Vi använder dina uppgifter för att hantera din fråga. Skicka inga personnummer, betalningsuppgifter eller känsliga uppgifter.
       Läs vår <NuxtLink to="/legal/privacy">integritetspolicy</NuxtLink>.
     </p></div>
     <div class="norrli-support-submit"><button type="submit" :disabled="state==='loading'">
       {{ state==='loading'?'Sparar ditt meddelande…':'Skicka meddelande' }}
       <ArrowRight :size="18" aria-hidden="true"/>
     </button><small>Obligatoriska fält markeras med *</small></div>
     <p v-if="state==='error'" class="norrli-support-error" role="alert"><AlertCircle :size="18" aria-hidden="true"/>{{ feedback }}</p>
   </form>
  </section>
  <section class="norrli-support-section">
    <span class="norrli-support-kicker">MER HJÄLP</span><h2>Hitta svar på din fråga</h2>
    <div class="norrli-support-mini-links">
      <NuxtLink to="/delivery"><Truck :size="23" aria-hidden="true"/><span><strong>Leveransinformation</strong><small>Vad gäller innan butiken öppnar?</small></span><ArrowRight :size="16" aria-hidden="true"/></NuxtLink>
      <NuxtLink to="/legal/returns"><RotateCcw :size="23" aria-hidden="true"/><span><strong>Returer och ångerrätt</strong><small>Så fungerar konsumentskyddet</small></span><ArrowRight :size="16" aria-hidden="true"/></NuxtLink>
    </div>
  </section>
 </SupportShell>
</template>

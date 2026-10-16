<script setup lang="ts">
const consent=ref<'unset'|'off'|'on'>('unset')
const open=ref(false)
onMounted(()=>{try{const v=localStorage.getItem('norrli-analytics-consent-v1');consent.value=v==='on'||v==='off'?v:'unset'}catch{consent.value='unset'}})
const choose=(value:'off'|'on')=>{consent.value=value;try{localStorage.setItem('norrli-analytics-consent-v1',value)}catch{/* private browsing */}open.value=false}
</script>
<template>
<div class="norrli-privacy-choice">
<button type="button" class="norrli-privacy-open" :aria-expanded="open" @click="open=!open">Analysinställningar</button>
<div v-if="open" class="norrli-privacy-panel" role="group" aria-label="Analysinställningar">
<h3>Dina integritetsval</h3>
<p>Valfri webbplatsanalys är inte aktiverad. Inga analystjänster laddas här, oavsett ditt val, förrän en separat granskad integration införs. Ditt önskemål sparas endast i denna webbläsare.</p>
<p>Nuvarande val: <strong>{{consent==='on'?'Godkänd för eventuell framtida analys':consent==='off'?'Avböjd':'Inte valt'}}</strong></p>
<div class="norrli-privacy-actions"><button type="button" @click="choose('off')">Avböj analys</button><button type="button" @click="choose('on')">Tillåt framtida analys</button></div>
</div></div>
</template>
<style scoped>.norrli-privacy-choice{position:relative;margin-top:12px}.norrli-privacy-open{background:transparent;border:1px solid currentColor;border-radius:10px;padding:10px 13px;color:inherit;cursor:pointer;min-height:44px}.norrli-privacy-panel{max-width:440px;background:#f2f6ed;color:#234732;padding:20px;border-radius:14px;margin-top:10px}.norrli-privacy-panel h3{font:500 22px Georgia,serif;color:#21432f}.norrli-privacy-panel p{font-size:12px;line-height:1.7}.norrli-privacy-actions{display:flex;gap:9px;flex-wrap:wrap}.norrli-privacy-actions button{border:1px solid #a7bba8;background:white;border-radius:10px;padding:10px 12px;color:#254d35;min-height:44px;cursor:pointer}.norrli-privacy-choice button:focus-visible{outline:3px solid #7dc99a;outline-offset:3px}</style>
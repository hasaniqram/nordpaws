<script setup lang="ts">
const props = withDefaults(defineProps<{ tone?: 'dark' | 'light'; showWordmark?: boolean }>(), {
  tone: 'dark',
  showWordmark: true
})
</script>

<template>
  <NuxtLink to="/" :class="['norrli-logo', `tone-${props.tone}`]" aria-label="Norrli Pets home">
    <svg class="norrli-mark" viewBox="0 0 86 58" role="img" aria-hidden="true">
      <path class="n-shape" d="M7 49V9h13l31 30V9h13v40H51L20 19v30H7Z"/>
      <path class="dog-head" d="M19 17c4-5 10-6 15-3 4 2 5 6 4 10-1 5-5 8-10 8h-3v8h-7V27c-3-2-4-6-2-10 1-1 2-1 3 0Z"/>
      <circle class="pet-eye" cx="31.5" cy="19.5" r="1.2"/>
      <path class="cat-head" d="M37 33l4-5 4 4 5-3 3 5v12H37V33Z"/>
      <circle class="pet-eye" cx="43" cy="36.5" r="1"/>
      <circle class="pet-eye" cx="48.2" cy="36.5" r="1"/>
      <g class="tail-wag">
        <path class="tail" d="M58 44c10 1 18-7 18-17 4 5 5 13 1 19-4 7-12 10-19 7"/>
      </g>
      <g class="paw">
        <ellipse cx="68" cy="12" rx="2.8" ry="3.6"/>
        <ellipse cx="75" cy="12" rx="2.8" ry="3.6"/>
        <ellipse cx="64" cy="18" rx="2.6" ry="3.3"/>
        <ellipse cx="79" cy="18" rx="2.6" ry="3.3"/>
        <path d="M66 22c0-4 3-6 6-6s6 2 6 6c0 3-3 5-6 5s-6-2-6-5Z"/>
      </g>
    </svg>
    <span v-if="props.showWordmark" class="norrli-wordmark">
      <span class="norrli-name">Norrli Pets</span>
      <span class="norrli-tagline">Scandinavian pet essentials</span>
    </span>
  </NuxtLink>
</template>

<style scoped>
.norrli-logo{
  --logo-ink:#20372a;
  --logo-pet:#f7f5ef;
  --logo-accent:#b58b61;
  display:inline-flex;
  align-items:center;
  gap:10px;
  min-width:0;
  text-decoration:none;
  color:inherit;
}
.norrli-logo.tone-light{
  --logo-ink:#f1efe8;
  --logo-pet:#1b211d;
  --logo-accent:#caa57e;
}
.norrli-mark{width:48px;height:36px;overflow:visible;flex:0 0 auto}
.n-shape,.tail{fill:var(--logo-ink)}
.dog-head,.cat-head{fill:var(--logo-pet)}
.pet-eye{fill:var(--logo-ink)}
.paw{fill:var(--logo-accent);transform-origin:72px 20px}
.tail-wag{transform-box:fill-box;transform-origin:11% 78%;animation:norrli-tail-wag 3.8s ease-in-out infinite}
.norrli-wordmark{display:flex;flex-direction:column;line-height:1}
.norrli-name{font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:600;letter-spacing:-.02em;white-space:nowrap}
.norrli-tagline{margin-top:5px;font-size:8px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;opacity:.64;white-space:nowrap}
.norrli-logo:hover .tail-wag{animation-duration:.7s}
@keyframes norrli-tail-wag{
  0%,72%,100%{transform:rotate(0deg)}
  78%{transform:rotate(13deg)}
  84%{transform:rotate(-10deg)}
  90%{transform:rotate(10deg)}
  96%{transform:rotate(-5deg)}
}
@media (max-width:620px){
  .norrli-mark{width:42px;height:32px}
  .norrli-name{font-size:18px}
  .norrli-tagline{display:none}
}
@media (prefers-reduced-motion: reduce){
  .tail-wag{animation:none!important}
}
</style>

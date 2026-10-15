<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'dark' | 'light'; showWordmark?: boolean }>(), {
  tone: 'dark', showWordmark: true
})
</script>

<template>
  <NuxtLink to="/" :class="['nordic-brand', 'tone-' + tone]" aria-label="Norrli Pets – till startsidan">
    <svg class="nordic-brand-mark" viewBox="0 0 112 101" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="norrliSky" x1="15" y1="13" x2="96" y2="83" gradientUnits="userSpaceOnUse">
          <stop stop-color="#F6F1E7"/><stop offset="1" stop-color="#C5D9D8"/>
        </linearGradient>
        <linearGradient id="norrliDog" x1="30" y1="25" x2="61" y2="84" gradientUnits="userSpaceOnUse">
          <stop stop-color="#F6E7C5"/><stop offset="1" stop-color="#BDA984"/>
        </linearGradient>
      </defs>
      <circle cx="56" cy="50" r="44" fill="url(#norrliSky)" stroke="currentColor" stroke-width="2.3"/>
      <path d="M11 68 37 37l11 14 17-29 21 26 13-9 2 38H11V68Z" fill="#7D9CA4"/>
      <path d="m34 40 4-5 10 15m17-26 10 14 6-5" stroke="#F4F0E6" stroke-width="4" stroke-linecap="round"/>
      <path d="M13 73c13-13 30-16 48-11 13 4 23 3 38-4v22H13V73Z" fill="#3E6658"/>
      <path d="M12 75 22 55l10 20H12ZM14 69l8-16 8 16M85 79 94 53l11 26H85ZM90 69l5-18 7 18" fill="#174438" stroke="#174438" stroke-width="2" stroke-linejoin="round"/>
      <path class="nordic-tail" d="M28 70c-19-8-18-27-7-34-3 13 5 19 13 22" stroke="#BFA77C" stroke-width="9" stroke-linecap="round"/>
      <path d="M34 74c-4-13-1-27 10-35 8-7 18-8 25-2 7 6 8 18 2 26l-7 13H34Z" fill="url(#norrliDog)" stroke="#1D493C" stroke-width="2.2"/>
      <path d="M46 35c-9-6-19 3-17 15 1 8 8 13 14 12l9-15-6-12Z" fill="#245347"/>
      <path d="M55 38c8-5 20-1 23 10 2 7-1 13-7 18-6 4-14 4-21-2l-1-11" fill="#F4E6C7" stroke="#1D493C" stroke-width="2.2"/>
      <path d="M72 48c8 4 9 9 4 13l-7 1" fill="#E3CEAD"/>
      <circle cx="64" cy="48" r="2" fill="#153D34"/>
      <path d="M73 53c2 1 3 3 1 5l-5 1" fill="#153D34"/>
      <path d="M59 61c5 5 11 5 15 0" stroke="#164336" stroke-width="2" stroke-linecap="round"/>
      <path d="M38 74c-2-9 1-17 9-20 7-2 11 0 14 7l2 15-25-2Z" fill="#EAD9B9"/>
      <path d="M40 76v-7m12 7v-7" stroke="#1D493C" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M64 75c0-11 6-19 17-19 9 0 15 9 14 20H64Z" fill="#9DB0A2" stroke="#1E493D" stroke-width="2.2"/>
      <path d="m69 60 3-13 9 8 10-7 2 14" fill="#9DB0A2" stroke="#1E493D" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="m69 60 3-13 9 8 10-7 2 14" fill="#9DB0A2"/>
      <circle cx="76" cy="64" r="1.5" fill="#153D34"/><circle cx="87" cy="64" r="1.5" fill="#153D34"/>
      <path d="m80 69 2 2 2-2m-2 2v2m-2 0c2 2 4 2 6 0" stroke="#153D34" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M20 82c20 11 52 11 72 0" stroke="#A8BDB5" stroke-width="3" stroke-linecap="round"/>
      <path d="M8 90c25 10 68 11 96-1" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".35"/>
    </svg>
    <span v-if="showWordmark" class="nordic-brand-copy">
      <span class="nordic-brand-name">Norrli<span>Pets</span></span>
      <span class="nordic-brand-subtitle">NÄRA NATUREN · NÄRA VARANDRA</span>
    </span>
  </NuxtLink>
</template>

<style scoped>
.nordic-brand{display:inline-flex;align-items:center;gap:8px;color:#123e34;text-decoration:none;min-width:0}
.nordic-brand.tone-light{color:#f6f3e8}
.nordic-brand-mark{height:72px;width:78px;flex:none;filter:drop-shadow(0 3px 5px rgba(22,48,36,.08))}
.nordic-brand-copy{display:flex;flex-direction:column;line-height:1;gap:6px}
.nordic-brand-name{font:700 clamp(24px,2.3vw,35px)/.95 Georgia,serif;letter-spacing:-.065em;white-space:nowrap}
.nordic-brand-name span{color:#6c8975;margin-left:4px}
.tone-light .nordic-brand-name span{color:#c8d9c6}
.nordic-brand-subtitle{font-size:7px;letter-spacing:.22em;font-weight:800;white-space:nowrap}
.nordic-tail{transform-origin:33px 62px;animation:nordicTail 3.5s ease-in-out infinite}
.nordic-brand:hover .nordic-tail{animation-duration:.7s}
@keyframes nordicTail{0%,70%,100%{transform:rotate(0deg)}78%{transform:rotate(14deg)}85%{transform:rotate(-7deg)}92%{transform:rotate(8deg)}}
@media(max-width:650px){.nordic-brand-mark{width:55px;height:58px}.nordic-brand-name{font-size:24px}.nordic-brand-subtitle{font-size:5.5px;letter-spacing:.1em}}
@media(prefers-reduced-motion:reduce){.nordic-tail{animation:none}}
</style>

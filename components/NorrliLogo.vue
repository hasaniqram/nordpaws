<script setup lang="ts">
withDefaults(defineProps<{
  tone?: 'dark' | 'light'
  showWordmark?: boolean
  layout?: 'horizontal' | 'stacked'
}>(), {
  tone: 'dark', showWordmark: true, layout: 'horizontal'
})
</script>

<template>
  <NuxtLink to="/" :class="['nordic-brand','tone-'+tone, {'is-stacked': layout === 'stacked'}]" aria-label="Norrli Pets – till startsidan">
    <span class="nordic-logo-art" aria-hidden="true">
      <img class="nordic-logo-image" src="/branding/norrli-emblem.png" alt="" width="191" height="116"
        decoding="async"/>
      <img class="nordic-logo-tail" src="/branding/norrli-emblem.png" alt="" width="191" height="116"
        decoding="async"/>
      <span class="nordic-logo-spark nordic-logo-spark-a">✦</span>
      <span class="nordic-logo-spark nordic-logo-spark-b">✧</span>
    </span>
    <span v-if="showWordmark" class="nordic-brand-copy">
      <span class="nordic-brand-name">Norrli<span>Pets</span></span>
      <span class="nordic-brand-subtitle">NÄRA NATUREN · NÄRA VARANDRA</span>
    </span>
  </NuxtLink>
</template>

<style scoped>
.nordic-brand{display:inline-flex;align-items:center;gap:2px;color:#123e34;text-decoration:none;min-width:0}
.nordic-brand.tone-light{color:#f6f3e8}
.nordic-logo-art{display:block;position:relative;width:100px;height:66px;flex:none;isolation:isolate}
.nordic-logo-image,.nordic-logo-tail{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.nordic-logo-image{animation:norrliGentleFloat 4.5s ease-in-out infinite;filter:drop-shadow(0 3px 4px rgba(16,52,40,.1))}
.nordic-logo-tail{clip-path:polygon(0% 23%,42% 23%,42% 95%,0% 95%);transform-origin:25% 66%;animation:norrliRealTailWag 4.5s ease-in-out infinite;pointer-events:none}
.nordic-logo-spark{position:absolute;z-index:2;pointer-events:none;color:#a7bb97;opacity:0;font-size:15px;animation:norrliTwinkle 4.5s ease-in-out infinite}
.nordic-logo-spark-a{right:9%;top:0}
.nordic-logo-spark-b{left:24%;top:3%;font-size:10px;animation-delay:.85s}
.nordic-brand-copy{display:flex;flex-direction:column;line-height:1;gap:6px}
.nordic-brand-name{
  font-family:'Nunito','Nunito Sans','Arial Rounded MT Bold','Arial Black',system-ui,sans-serif;
  font-size:clamp(25px,2.5vw,36px);
  font-weight:1000;
  line-height:.94;
  letter-spacing:-.072em;
  font-variation-settings:'wght' 1000;
  white-space:nowrap;
}
.nordic-brand-name span{color:#78937b;margin-left:5px}
.nordic-brand.is-stacked{flex-direction:column;align-items:center;justify-content:center;gap:0}
.nordic-brand.is-stacked .nordic-logo-art{width:111px;height:68px}
.nordic-brand.is-stacked .nordic-brand-copy{align-items:center;gap:3px}
.nordic-brand.is-stacked .nordic-brand-name{font-size:30px;letter-spacing:-.075em}
.nordic-brand.is-stacked .nordic-brand-subtitle{display:none}
.tone-light .nordic-brand-name span{color:#c8d9c6}
.nordic-brand-subtitle{font-size:7px;letter-spacing:.22em;font-weight:800;white-space:nowrap}
.nordic-brand:hover .nordic-logo-tail{animation-duration:.9s}
.nordic-brand:hover .nordic-logo-image{animation-duration:2s}
@keyframes norrliGentleFloat{
  0%,100%{transform:translateY(0)}
  46%{transform:translateY(-2px)}
}
@keyframes norrliRealTailWag{
  0%,68%,100%{transform:rotate(0deg)}
  74%{transform:rotate(-6deg)}
  80%{transform:rotate(7deg)}
  86%{transform:rotate(-5deg)}
  93%{transform:rotate(4deg)}
}
@keyframes norrliTwinkle{
  0%,55%,100%{opacity:0;transform:scale(.6)}
  67%{opacity:.9;transform:scale(1.15)}
  78%{opacity:0;transform:scale(.8)}
}
@media(max-width:650px){
  .nordic-logo-art{width:72px;height:51px}
  .nordic-brand-name{font-size:24px}
  .nordic-brand.is-stacked .nordic-logo-art{width:81px;height:49px}
  .nordic-brand.is-stacked .nordic-brand-name{font-size:23px}
  .nordic-brand-subtitle{font-size:5.5px;letter-spacing:.1em}
}
@media(prefers-reduced-motion:reduce){
  .nordic-logo-image,.nordic-logo-tail,.nordic-logo-spark{animation:none!important}
}
</style>

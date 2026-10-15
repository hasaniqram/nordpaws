<script setup lang="ts">
withDefaults(defineProps<{
  tone?: 'dark' | 'light'
  showWordmark?: boolean
  layout?: 'horizontal' | 'stacked'
}>(), {
  tone: 'dark',
  showWordmark: true,
  layout: 'stacked'
})
</script>

<template>
  <NuxtLink
    to="/"
    :class="['nordic-brand', 'tone-' + tone, { 'nordic-brand-emblem-only': !showWordmark }]"
    aria-label="Norrli Pets – till startsidan"
  >
    <img
      class="nordic-approved-logo-image"
      :src="showWordmark ? '/branding/norrli-approved-logo.png?v=3' : '/branding/norrli-emblem.png'"
      :alt="showWordmark ? 'Norrli Pets' : 'Norrli Pets emblem'"
      :width="showWordmark ? 245 : 191"
      :height="showWordmark ? 198 : 116"
      decoding="async"
    />
  </NuxtLink>
</template>

<style scoped>
.nordic-brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  flex: none;
  width: var(--norrli-logo-width, 145px);
  max-width: 100%;
  text-decoration: none;
}
.nordic-approved-logo-image {
  display: block;
  width: 100%;
  height: auto;
  max-height: none;
  object-fit: contain;
  transform-origin: center;
  animation: norrli-approved-float 5s ease-in-out infinite;
  transition: filter .25s ease, transform .25s ease;
}
.nordic-brand:hover .nordic-approved-logo-image {
  animation-play-state: paused;
  transform: translateY(-3px) scale(1.025);
  filter: drop-shadow(0 4px 5px rgba(15, 57, 41, .11));
}
@keyframes norrli-approved-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
@media (prefers-reduced-motion: reduce) {
  .nordic-approved-logo-image { animation: none; transition: none; }
  .nordic-brand:hover .nordic-approved-logo-image { transform: none; }
}
</style>

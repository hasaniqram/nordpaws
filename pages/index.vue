<script setup lang="ts">
import { ArrowRight, PackageCheck, RotateCcw, ShieldCheck, Sparkles } from 'lucide-vue-next'
import type { Product } from '~/data/products'

useSeoMeta({ title: 'Scandinavian pet essentials', ogTitle: 'NORDPAWS · Scandinavian pet essentials' })

const { data: catalog } = await useFetch<{ products: Product[]; source: string }>('/api/products')
const featured = computed(() => (catalog.value?.products || []).slice(0, 4))

const email = ref('')
const newsletterState = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const newsletterMessage = ref('')

const joinNewsletter = async () => {
  newsletterMessage.value = ''
  newsletterState.value = 'loading'
  try {
    const result = await $fetch<{ ok: boolean; alreadySubscribed?: boolean }>('/api/newsletter', {
      method: 'POST',
      body: { email: email.value, locale: 'en' }
    })
    newsletterState.value = 'success'
    newsletterMessage.value = result.alreadySubscribed ? 'You’re already on the list.' : 'Welcome to the NORDPAWS note.'
    email.value = ''
  } catch (error: any) {
    newsletterState.value = 'error'
    newsletterMessage.value = error?.data?.statusMessage || 'Please try again.'
  }
}
</script>

<template>
  <main>
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="eyebrow"><Sparkles :size="15"/> Designed for everyday pet life</span>
          <h1>Less mess.<br><em>More moments.</em></h1>
          <p>Thoughtful pet essentials for cleaner homes, calmer routines and better adventures — selected with Scandinavian simplicity in mind.</p>
          <div class="hero-actions"><NuxtLink to="/shop" class="btn btn-primary">Shop bestsellers <ArrowRight :size="18"/></NuxtLink><NuxtLink to="/about" class="text-link">Why NORDPAWS?</NuxtLink></div>
          <div class="hero-proof"><span>★★★★★</span><p>Launching in Sweden · Founding collection</p></div>
        </div>
        <div class="hero-visual">
          <div class="hero-orb orb-one">🐕</div><div class="hero-orb orb-two">🐈</div>
          <div class="hero-product"><div class="mini-label">NORDPAWS / 01</div><div class="hero-emoji">🛋️</div><h3>CleanRoll™</h3><p>Pet hair, handled.</p></div>
        </div>
      </div>
    </section>

    <section class="trust-strip"><div class="container trust-grid"><div><PackageCheck/>Tracked delivery</div><div><RotateCcw/>30-day returns</div><div><ShieldCheck/>Secure checkout</div><div><Sparkles/>Curated essentials</div></div></section>

    <section class="section container">
      <div class="section-head"><div><span class="eyebrow">The first drop</span><h2>Everyday problems, quietly solved.</h2></div><NuxtLink to="/shop" class="text-link">Shop all <ArrowRight :size="16"/></NuxtLink></div>
      <div class="product-grid"><ProductCard v-for="product in featured" :key="product.id" :product="product"/></div>
    </section>

    <section class="editorial container">
      <div class="editorial-visual"><span class="editorial-emoji">🐾</span><div class="editorial-tag">NORDPAWS EDIT / 2026</div></div>
      <div class="editorial-copy"><span class="eyebrow">Built around real routines</span><h2>A pet store that feels less like a pet store.</h2><p>We focus on practical products with a calm aesthetic — things you can leave in your home, take in your car and use every day without clutter.</p><NuxtLink to="/about" class="btn btn-secondary">Read our approach <ArrowRight :size="18"/></NuxtLink></div>
    </section>

    <section class="newsletter">
      <div class="container newsletter-inner">
        <div><span class="eyebrow">The NORDPAWS note</span><h2>New drops. Better pet routines.</h2><p>Get product launches, practical tips and early offers.</p></div>
        <div>
          <form class="newsletter-form" @submit.prevent="joinNewsletter">
            <input v-model="email" type="email" required placeholder="Email address" aria-label="Email address">
            <button class="btn btn-primary" :disabled="newsletterState === 'loading'">{{ newsletterState === 'loading' ? 'Joining…' : 'Join the list' }}</button>
          </form>
          <p v-if="newsletterMessage" :class="['inline-status', newsletterState]">{{ newsletterMessage }}</p>
        </div>
      </div>
    </section>
  </main>
</template>

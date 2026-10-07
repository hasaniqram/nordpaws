<script setup lang="ts">
import { Menu, ShoppingBag, X } from 'lucide-vue-next'
const open = ref(false)
const { count } = useCart()
</script>

<template>
  <div>
    <div class="announcement">Free shipping in Sweden over 599 SEK · 30-day returns</div>
    <header class="header container">
      <NuxtLink to="/" class="brand" aria-label="Norrli Pets home">
        <span class="brand-mark">N</span><span>Norrli Pets</span>
      </NuxtLink>
      <nav class="desktop-nav" aria-label="Main navigation">
        <NuxtLink to="/shop">Shop</NuxtLink>
        <NuxtLink to="/shop?category=Dogs">Dogs</NuxtLink>
        <NuxtLink to="/shop?category=Cats">Cats</NuxtLink>
        <NuxtLink to="/shop?category=Travel">Travel</NuxtLink>
        <NuxtLink to="/about">Our story</NuxtLink>
      </nav>
      <div class="header-actions">
        <NuxtLink to="/cart" class="icon-btn cart-link" aria-label="Shopping cart">
          <ShoppingBag :size="21" /> <span v-if="count" class="cart-count">{{ count }}</span>
        </NuxtLink>
        <button class="icon-btn mobile-menu-btn" @click="open = !open" aria-label="Toggle menu">
          <X v-if="open" :size="22"/><Menu v-else :size="22"/>
        </button>
      </div>
    </header>
    <nav v-if="open" class="mobile-nav container">
      <NuxtLink to="/shop" @click="open=false">Shop all</NuxtLink>
      <NuxtLink to="/shop?category=Dogs" @click="open=false">Dogs</NuxtLink>
      <NuxtLink to="/shop?category=Cats" @click="open=false">Cats</NuxtLink>
      <NuxtLink to="/shop?category=Travel" @click="open=false">Travel</NuxtLink>
      <NuxtLink to="/about" @click="open=false">Our story</NuxtLink>
    </nav>
  </div>
</template>

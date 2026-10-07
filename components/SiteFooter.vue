<template>
  <footer class="footer">
    <div class="container footer-grid">
      <div>
        <div class="brand footer-brand"><span class="brand-mark">N</span><span>Norrli Pets</span></div>
        <p class="muted">Scandinavian essentials for cleaner homes, safer trips and happier pets.</p>
      </div>
      <div><h4>Shop</h4><NuxtLink to="/shop">All products</NuxtLink><NuxtLink to="/shop?category=Travel">Travel</NuxtLink><NuxtLink to="/shop?category=Clean%20Home">Clean home</NuxtLink></div>
      <div><h4>Help</h4><NuxtLink to="/legal/shipping">Shipping</NuxtLink><NuxtLink to="/legal/returns">Returns</NuxtLink><NuxtLink to="/contact">Contact</NuxtLink></div>
      <div><h4>Legal</h4><NuxtLink to="/legal/privacy">Privacy</NuxtLink><NuxtLink to="/legal/terms">Terms</NuxtLink></div>
    </div>
    <div class="container footer-bottom">© {{ new Date().getFullYear() }} Norrli Pets · Built for Sweden</div>
  </footer>
</template>

<template>
  <footer class="nordic-footer">
    <div class="nordic-footer-forest" aria-hidden="true"></div>
    <div class="container nordic-footer-grid">
      <div class="nordic-footer-about">
        <NorrliLogo tone="light" layout="stacked"/>
        <p>Nära naturen, nära varandra. För vardagen, äventyret och livet tillsammans med våra fyrbenta vänner.</p>
        <span class="nordic-footer-preview">Norrli Pets · Kollektion under utveckling</span>
      </div>
      <div class="nordic-footer-column">
        <h3>Utforska</h3>
        <NuxtLink to="/shop">Alla produkter</NuxtLink>
        <NuxtLink to="/shop?category=Dogs">Hund</NuxtLink>
        <NuxtLink to="/shop?category=Cats">Katt</NuxtLink>
        <NuxtLink to="/shop?category=Travel">Promenad & resa</NuxtLink>
        <NuxtLink to="/shop?category=Clean%20Home">Hemmet</NuxtLink>
      </div>
      <div class="nordic-footer-column">
        <h3>Kundservice</h3>
        <NuxtLink to="/contact">Kontakta oss</NuxtLink>
        <NuxtLink to="/legal/shipping">Leveransinformation</NuxtLink>
        <NuxtLink to="/legal/returns">Returer och ångerrätt</NuxtLink>
        <NuxtLink to="/legal/privacy">Integritetspolicy</NuxtLink>
        <NuxtLink to="/legal/terms">Köpvillkor</NuxtLink>
      </div>
      <div class="nordic-footer-column">
        <h3>Om Norrli Pets</h3>
        <NuxtLink to="/about">Vår berättelse</NuxtLink>
        <NuxtLink to="/favorites">Mina favoriter</NuxtLink>
        <NuxtLink to="/contact">Frågor och kontakt</NuxtLink>
        <span class="nordic-footer-signoff">Skandinavisk känsla för hund & katt.</span>
      </div>
    </div>
    <div class="container nordic-footer-bottom">
      <span>© {{new Date().getFullYear()}} Norrli Pets</span>
      <span>Skapad med omtanke i Sverige</span>
    </div>
  </footer>
</template>

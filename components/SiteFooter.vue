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
        <NuxtLink to="/support">Hjälpcenter & vanliga frågor</NuxtLink>
        <NuxtLink to="/contact">Kontakta oss</NuxtLink>
        <NuxtLink to="/delivery">Leveransinformation</NuxtLink>
        <NuxtLink to="/legal/shipping">Leveransvillkor</NuxtLink>
        <NuxtLink to="/legal/returns">Returer och ångerrätt</NuxtLink>
        <NuxtLink to="/legal/privacy">Integritetspolicy</NuxtLink>
        <AnalyticsPreferences />
        <NuxtLink to="/legal/terms">Köpvillkor</NuxtLink>
        <NuxtLink to="/legal/copyright">Upphovsrätt och innehåll</NuxtLink>
      </div>
      <div class="nordic-footer-column">
        <h3>Om Norrli Pets</h3>
        <NuxtLink to="/about">Vår berättelse</NuxtLink>
        <NuxtLink to="/favorites">Mina favoriter</NuxtLink>
        <NuxtLink to="/account">Mitt konto & beställningar</NuxtLink>
        <NuxtLink to="/contact">Frågor och kontakt</NuxtLink>
        <span class="nordic-footer-signoff">Skandinavisk känsla för hund & katt.</span>
      </div>
    </div>
    <div class="container nordic-footer-bottom">
      <div class="nordic-footer-copyright">
        <span class="nordic-footer-copyright-main">© {{ new Date().getFullYear() }} Norrli Pets</span>
        <span class="nordic-footer-creator-credit">Idé, koncept &amp; webbplatsutveckling: <strong>Hasan Iqram</strong></span>
        <small>Material från tredje part omfattas av respektive rättighetshavares villkor.</small>
      </div>
      <nav class="nordic-footer-legal-links" aria-label="Juridisk information">
        <NuxtLink to="/legal/copyright">Upphovsrätt</NuxtLink>
        <NuxtLink to="/legal/privacy">Integritet</NuxtLink>
        <NuxtLink to="/legal/terms">Villkor</NuxtLink>
      </nav>
      <span class="nordic-footer-signature">Skapad med omtanke i Sverige</span>
    </div>
  </footer>
</template>

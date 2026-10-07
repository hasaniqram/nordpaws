export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css', '~/assets/css/enhancements.css', '~/assets/css/admin.css'],
  app: {
    head: {
      titleTemplate: '%s · Norrli Pets',
      meta: [
        { name: 'description', content: 'Scandinavian pet essentials for cleaner homes, safer trips and happier pets.' },
        { name: 'theme-color', content: '#f7f5ef' }
      ]
    }
  },
  runtimeConfig: {
    supabaseSecretKey: '',
    mollieApiKey: '',
    brevoApiKey: '',
    brevoSenderEmail: '',
    brevoSenderName: 'Norrli Pets',
    brevoListId: '',
    checkoutEnabled: false,
    public: {
      supabaseUrl: '',
      supabasePublishableKey: '',
      siteUrl: 'http://localhost:3000',
      checkoutEnabled: false
    }
  },
  nitro: {
    preset: 'vercel'
  }
})

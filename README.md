# NORDPAWS

Sweden-first premium pet essentials storefront built with Nuxt 3.

## Stack
- Nuxt 3 / Vue 3
- Supabase for catalog + orders
- Stripe Checkout for one-time physical-goods payments
- Resend for transactional order email
- Vercel for hosting
- GitHub for source control

## Safety-first launch state
The storefront and cart work without credentials. Checkout intentionally returns a setup-required response until a dedicated NORDPAWS Stripe account/test context and `NUXT_CHECKOUT_ENABLED=true` are configured. The Supabase code also falls back to the local catalog until a dedicated NORDPAWS project is connected.

## Local
```bash
npm install
cp .env.example .env
npm run dev
```

## Required production variables
See `.env.example`. Keep all secret values in Vercel environment variables, never in GitHub.

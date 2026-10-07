# Norrli Pets

Sweden-first premium pet essentials storefront built with Nuxt 3.

## Stack
- Nuxt 3 / Vue 3
- Supabase for catalog, orders, admin data and newsletter leads
- Mollie for Sweden-first checkout (planned: Swish, Klarna, cards, Apple Pay)
- Brevo for transactional email and marketing contacts
- Vercel for hosting
- GitHub for source control

## Safety-first launch state
The storefront and cart work without payment credentials. Checkout intentionally returns a setup-required response until a dedicated Norrli Pets Mollie account is connected and `NUXT_CHECKOUT_ENABLED=true` is configured. Product data is read from the dedicated Norrli Pets Supabase project.

## Local
```bash
npm install
cp .env.example .env
npm run dev
```

## Required production variables
See `.env.example`. Keep all secret values in Vercel environment variables, never in GitHub.

## Payment flow
Cart → customer/delivery details → Mollie hosted checkout → Mollie webhook → Supabase order → Brevo order confirmation.

## Target domain
- Primary launch domain: `norrlipets.se` (attach after registration and DNS ownership verification)

## Launch note
Shipping pricing, the verified Norrli Pets sending domain, Brevo API credentials and Mollie API credentials must be finalized before live checkout is enabled.

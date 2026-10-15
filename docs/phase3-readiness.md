# Phase 3 — customer accounts and order readiness

This release is designed for review in a Vercel preview first. It does not activate checkout or create new database tables.

## Included

- `/account`: passwordless Supabase email sign-in, verified customer order history, read-only fulfillment and tracking fields.
- `/delivery`: honest Swedish launch information and a client-only postal-code format checker.
- `/cart`: Swedish delivery input and Stripe sandbox preparation, behind the existing checkout feature gate.
- Account / delivery navigation and responsive styles.

## Required configuration before launching customer login

1. Confirm `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` refer to **NORDPAWS**, not another project's Supabase instance.
2. In **Supabase Authentication → URL Configuration**, set the Site URL to `https://norrlipets.se`. Allow `https://norrlipets.se/account` and approved preview hostnames used during testing.
3. Review the Supabase email provider, authentication email template and sending limits. The default OTP method sends a magic link; a numeric token is available only if the email template also includes it.
4. Run one opt-in test with an address you own to confirm magic-link callback, verified session, sign-out and session restoration.
5. Verify the server-side service key is configured only in Vercel server environment; never put it under `NUXT_PUBLIC_`.
6. Test a verified customer with no orders and with permitted test orders. Verify customers cannot view orders tied to other email addresses.
7. Review production privacy disclosures and retention requirements with your legal adviser before enabling real customer onboarding.

## Order data protection

`/api/account/orders`:
- Validates `Authorization: Bearer <JWT>` through Supabase Auth and requires confirmed email.
- Filters server-side by the confirmed account email. No client-entered email or order number is trusted.
- Selects a capped list of safe customer-facing order fields and item names only.
- Does **not** expose home addresses, internal supplier pricing, payment URLs, secret keys or arbitrary order lookup.
- Returns 401 without a valid verified user session and 503 when secure order storage is unavailable.

The database's existing admin-only RLS policies are unchanged.

## Shipping and checkout release gates

The default `checkoutEnabled` remains `false`; `/api/checkout` still requires an explicitly enabled test gate **and** a `sk_test_` Stripe secret key. This implementation does not accept live payments.

Do not enable customer payments or publish firm delivery promises until supplier routes, VAT/taxes, shipping rates, carrier tracking integration, Swedish/EU consumer terms and business verification have been reviewed.

## Review checklist

- [ ] Vercel preview builds without error
- [ ] `/account`, `/delivery`, `/cart`, `/shop`, `/api/products` respond normally
- [ ] Unauthenticated order-history endpoint rejects requests
- [ ] Passwordless login works with an owned test email and expected redirect allowlist
- [ ] Order list contains only verified-email orders and shows sandbox labeling
- [ ] Postcode checker validates format **without** suggesting availability, cost or ETA
- [ ] Desktop and mobile navigation and layouts reviewed at 375px/768px/1440px
- [ ] Production checkout remains disabled

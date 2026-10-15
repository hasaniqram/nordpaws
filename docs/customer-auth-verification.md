# Norrli Pets — customer account launch verification

Status: **development complete; customer login / cross-account runtime tests outstanding**.
The current production checkout gate stays OFF. This guide never requires sharing a secret.

## Verified without sending customer email

- Production HTML references the intended NORDPAWS Supabase project and renders the account sign-in page.
- Production Vercel has the server-side Supabase credential configured, but Preview currently does not.
- Current database `orders` and `order_items` permissions are admin-only; the customer endpoint therefore validates the Supabase JWT on the server and filters orders by `getUser(token).user.email` after email confirmation.
- Node regression tests run as part of `npm run build` and assert malformed bearer rejection, unverified-user rejection, server-derived email filtering, sensitive-field exclusion, row limits and fail-closed behavior.
- Login state uses a revision guard so results from an old authenticated session cannot reappear after sign-out.
- No authentication messages or test orders were created as part of this change.

## Supabase Auth URL configuration (manual verification needed)

Project: **NORDPAWS** (`fuwpbukpxwpiipzkfanb`).

1. In [Supabase Auth URL Configuration](https://supabase.com/dashboard/project/fuwpbukpxwpiipzkfanb/auth/url-configuration), review the Site URL. Recommended production Site URL: `https://norrlipets.se`.
2. Allow the exact production callback `https://norrlipets.se/account`. If using the `www` host, allow `https://www.norrlipets.se/account`.
3. For testing the specific review preview, add only its exact `https://<preview>.vercel.app/account` URL. Avoid a global `https://**` allowlist.
4. In Supabase Authentication → Providers, confirm email sign-in is enabled and that the login email template is correct. The default `signInWithOtp()` sends a magic link; an emailed numeric OTP requires an appropriate template.
5. Confirm redirect URLs by signing in **only with an address you own**. Do not paste sign-in URLs, OTPs, bearer tokens or email contents into bug reports or chats.

## Manual account tests (needed before enabling onboarding)

- [ ] On the approved domain, request login using an address you control.
- [ ] Open the email link. It returns to `https://norrlipets.se/account` and displays that same account address after confirmation.
- [ ] Refresh the account page; the session persists correctly.
- [ ] Sign out; account identity and any previously visible orders disappear immediately.
- [ ] Check that the account page does not display order history before login.
- [ ] Check order history with an **existing sandbox order** owned by your verified email. Check sandbox labeling and no address/phone data.
- [ ] With a second independently owned verified email, confirm it cannot see the first account's orders.
- [ ] Verify calling `/api/account/orders` without a bearer token returns HTTP 401 (not a Vercel authentication challenge). Do this using an authenticated Vercel testing context, not by disabling Vercel Deployment Protection.
- [ ] If testing on a Vercel preview, provision a separate **least-privilege** test setup first; currently the preview has no server-side Supabase secret, so its order endpoint returns 503 even after a successful login.
- [ ] Audit consent/retention and whether historical orders should automatically associate with newly verified emails before inviting public registrations.

## Security guardrails

- Do **not** copy production Supabase secret keys to a public environment, an issue, or this document.
- Do **not** allow `anon` or `authenticated` roles to query raw `orders` or `order_items` tables without carefully designed owner policies.
- Do **not** enable live payments or fulfillment; `NUXT_CHECKOUT_ENABLED` / `NUXT_PUBLIC_CHECKOUT_ENABLED` must remain disabled until the separate operational launch process is complete.
- Do **not** insert fabricated paid orders in the production database for testing.
- No schema migrations, Supabase RLS policy modifications, account deletions, emails or payment changes are part of this PR.

## Supporting references

- [Supabase passwordless email sign-in](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase RLS security](https://supabase.com/docs/guides/database/postgres/row-level-security)

# Norrli Pets — Release Gate (next development phase)

## New private workspace

`/admin/release-gate` is a **read-only, admin-only prelaunch risk dashboard**, connected from Admin Dashboard, Operations Center and Launch Workspace.

This is not a feature that enables checkout. It **always** returns `launchApproved=false`, `paymentsEnabledByReport=false`.

### Automated evidence indicators
- **Seller administration:** reads only existing checklist `code,status` for company_registration and vat. Does not verify that an organization or trading permission exists.
- **Supplier readiness:** requires a supplier lead internally marked contracted and shipping to Sweden. Does not authenticate contracts.
- **Quote data:** requires traceable source/reference, costs, fees, FX, delivery interval and a contracted supplier. Does not establish actual shipping terms or consumer prices.
- **Stock & product documentation:** for *every* active product requires documented SKU/material, nonconcept product image, quote, and a positive stock quantity verified within the past 30 days by a matching supplier. Stale inventory always fails.
- **Safety and shipping:** existing planner task states are displayed as recorded/not recorded, never externally approved.
- **Customer service:** counts the latest 200 case **statuses only**, with no names, emails or message contents. Zero backlog does not mean messages were answered or that the form was tested.
- **Email:** checks planner status; does not send mail.

### Manual blockers not automatically cleared
- Publish actual legal seller identity/contact information.
- Complete GDPR information, privacy procedures and data processors.
- Provide required online withdrawal feature with immediate durable acknowledgment where the right applies.
- Establish real shipping, returns, import and carrier responsibilities.
- Perform authorized contact form and admin triage end-to-end tests with synthetic information.
- Confirm separate commercial and payment approval.

### Review checklist

Under "Egen granskning" an administrator can temporarily tick review items, add **non-personal** notes and export a sanitized local JSON snapshot. This information is **not stored**, does not modify launch task statuses and does not enable payments.

### Test plan

The "Testplan" tab links to existing Kundservice, Supplier Integration Lab, security verification and customer terms. All recommended testing is separate and explicit; no test is automatically run against production accounts or real customer records.

## Official references

- E-handelslagen, Konsumentverket: https://www.konsumentverket.se/lagar/e-handelslagen-konsument/
- Online withdrawal feature effective 19 June 2026, Konsumentverket: https://www.konsumentverket.se/nyhet/lagandring-gor-det-enklare-att-angra-kop-pa-natet/
- GDPR privacy information, IMY: https://www.imy.se/vanliga-fragor-och-svar/vad-ska-en-integritetspolicy-innehalla/
- Terms before distance contracts, Konsumentverket: https://www.konsumentverket.se/marknadsratt-foretag/informationskrav-vid-distansavtal-regler-for-foretag

## Deployment and privacy safeguards
- Supabase `admins` verified client-side before reading RLS-controlled records.
- No production database SQL writes or migrations.
- All reports are limited and exclude personal/supplier contact details.
- No Stripe/Mollie API calls, stock updates, emails or supplier purchases.
- The page may work only after administrator sign-in; plain HTTP 200 does **not** prove that RLS and auth E2E passes.
- No real order data needed or accessed.
- Explicit approval required before merging into `main`; separate explicit approval still required before enabling any payments.

## Pre-merge validation

- [ ] Security/pure-function regression suite and Nuxt build pass.
- [ ] Preview deployed READY for the correct GitHub branch.
- [ ] Route responses HTTP 200 for new dashboard, existing Admin, Operations, Launch, Kundservice, Shop, Home.
- [ ] Authorized admin inspects actual server-RLS-protected evidence counts.
- [ ] Non-admin/anonymous user sees no private data.
- [ ] Manual review checkbox doesn't persist, exported JSON contains only sanitized fields.
- [ ] Desktop/mobile visual and keyboard checks.
- [ ] Live checkout/payment flags remain off and production unchanged.

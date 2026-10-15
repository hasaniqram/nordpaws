# Norrli Pets — Kundservice & Swedish policy redesign

## Routes implemented

- `/support` — searchable customer help center, FAQ, and topic directory.
- `/contact` — Swedish categorized support contact form with validation, optional reference, honest receipt state and a privacy notice.
- `/delivery` — retains Swedish postcode format check and delivery-readiness features, now integrated into the support layout.
- `/legal/shipping` — prelaunch shipping information, no invented rates or timings.
- `/legal/returns` — statutory consumer withdrawal and complaint overview, distinguishes the mandatory withdrawal functionality (not yet active) from a generic contact form.
- `/legal/privacy` — descriptions of actual data categories and explicit disclosure gaps before full GDPR policy.
- `/legal/terms` — preparatory terms; no fake corporate identity or currently operable checkout.
- `/admin/support` — private admin case inbox with search and status updates, using existing `contact_messages` table and its `new/open/closed` constraint and RLS policies.

## Technical implementation

- `components/SupportShell.vue`: consistent breadcrumb, hero, policy navigation, visible prelaunch disclosure, and links to contact/help.
- `assets/css/support-center.css`: scoped global class names so the approved Norrli storefront and logo are preserved; responsive widths 375/768/1440px.
- `server/utils/supportMessage.mjs`: pure server-side validation of support topics, order references and length limits.
- Existing `server/api/contact.post.ts` rate limiting remains. Support category/reference are prepended to the **existing** `message` field: no schema changes or migrations.
- No email is sent, no support case number is fabricated, and no response-time guarantee is advertised.
- Admin inbox selects messages with verified admin session under Supabase RLS, then updates only status (new, open, closed), with an optimistic concurrency check. It does not send email or notify a customer.
- No payment, checkout, supplier, inventory or order-write behavior changed.
- The Swedish footer now links to `/support`.

## Source references for statutory information

- Konsumentverket on withdrawal: https://www.konsumentverket.se/konsumentratt-process/angerratt/
- Konsumentverket on defective goods: https://www.konsumentverket.se/konsumentratt-process/reklamera-vara/
- IMY on privacy disclosures: https://www.imy.se/vanliga-fragor-och-svar/vad-ska-en-integritetspolicy-innehalla/
- Swedish distance contracts law: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-200559-om-distansavtal-och-avtal-utanfor_sfs-2005-59/

## Mandatory remaining legal/operational work **before taking paid orders**

- [ ] Publish and verify legal seller entity, company registration number, geographic address, and actual customer contact methods.
- [ ] Complete GDPR records: controller, lawful bases, processor data handling, subprocessor geography, transfer safeguards, retention/deletion periods and cookie/tracker audit. **The current policy explicitly says it is incomplete.**
- [ ] Establish shipping provider/contracts, customer shipping prices and genuine delivery expectations.
- [ ] Confirm returns/complaint workflow, physical return address, return-fright allocation and contact channels.
- [ ] Implement, test and document the statutory online withdrawal function and durable automated acknowledgement before online contracts can be concluded.
- [ ] Have Swedish consumer-law and privacy information reviewed before publishing binding customer terms.
- [ ] Validate contact-message insert under production RLS without using a real customer's data.
- [ ] Test admin support inbox as an authorized administrator and verify rejected non-admin access, status transition and no email dispatch.
- [ ] Test keyboard/focus, form success/error paths, mobile navigation and postcode checker visually.
- [ ] Keep checkout/payment features disabled until a separately approved launch decision.

**This is a prelaunch support experience, not a statement of completed legal compliance.**

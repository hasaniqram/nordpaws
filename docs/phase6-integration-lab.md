# Phase 6 — Supplier Integration Lab (private, read-only)

New admin-only route: `/admin/integrations`.

## Scope and protections

- **Supplier feed review:** choose a supplier, then select a CSV (max 250 KB, 100 rows) locally. The existing strict `parseCatalogCsv()` parser validates the file. The comparison helper checks SKU changes only within the selected supplier, preserves existing product mappings, marks new SKUs as **unmapped**, and offers unique SKU-based product *suggestions only*. It flags costs/stock changes that invalidate previous verification, duplicates and out-of-stock entries. The resulting report can be exported as a local JSON file.
- **Inventory sync preparation:** highlight missing/unverified stock, stock verified over 30 days ago, unavailable products and unmapped SKUs. Does not schedule polls, update the database or alter storefront visibility.
- **Shipping estimate review:** use saved quote values and the existing `calculateQuote` function. Highlight absent shipping documentation, missing costs/fees/FX, supplier agreements and delivery ranges. Supplier-side estimates are not approved consumer prices or guaranteed delivery times.
- **Offline email sandbox:** fictional confirmation, dispatch and delivery templates. `to=demo@example.invalid`; no public or internal send endpoint is called. Copying text is local.

## Source data

Reads admin-RLS-protected `supplier_leads`, `products`, `supplier_catalog_items`, and `supplier_quotes` using an authenticated browser session after verifying `admins.user_id`. No new Supabase migrations or external provider credentials are required.

**Important:** This integration lab **does not alter the existing manual CSV importer** at `/admin/catalog`. A proposed change must be reviewed and separately entered and verified there. The existing CSV importer is case-sensitive; this lab is intentionally case-insensitive when detecting potential collisions. Check source SKUs and avoid duplicate imports.

## Automatic workflow status

| Workflow | Status |
|---|---|
| CSV parsing and local diff | Implemented, preview only |
| SKU matching suggestions | Implemented, never auto-linked |
| Stale/unavailable inventory report | Implemented, read only |
| Automatic supplier API integration | Not activated; awaiting provider documentation and permission |
| Scheduled inventory synchronization | Not activated |
| Shipping fee publishing | Not activated |
| Branded email copy preview | Implemented; fictional content only |
| Real email sends, automation, order placement | Not activated |
| Live checkout and payments | Remain disabled |

## Quality review before production merge

- [ ] Automated pure-function regression tests pass in Vercel build.
- [ ] `/admin/integrations`, `/admin/operations`, `/admin/catalog`, `/admin/quotes` return HTTP 200.
- [ ] Authenticated admin loads supplier data and non-admin sees no private records.
- [ ] Upload a sample CSV with new/updated SKUs, verify product suggestions and warnings, and confirm that no database record changes.
- [ ] Check stock alerts against manual stock-lab records.
- [ ] Verify shipping calculations agree with quote planner and are labeled estimates.
- [ ] Verify no real recipient, API key or send button is present in email preview.
- [ ] Review desktop/mobile rendering (375/768/1440 px).
- [ ] Confirm Vercel's production branch remains unchanged until explicit approval.

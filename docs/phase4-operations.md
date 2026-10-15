# Phase 4 — Admin Operations Workspace

New private route: `/admin/operations` (available to allowlisted administrators).
This release is a **pre-launch operations preview** and does not initiate supplier purchasing, customer notifications, or payment processing.

## Implemented

- Consolidated order queue and five operational KPIs that exclude test, unpaid and ineligible orders from actionable counts.
- Fulfillment progression via `POST /api/admin/fulfillment` with server-verified Supabase identity and membership in `admins`.
- Only paid `mollie` orders, not `stripe_test` or `NR-TEST-*`, can advance through:
  `unfulfilled → supplier_ordered → processing → shipped → delivered`.
- Requires supplier order reference before advancing, and actual carrier/tracking evidence before recording dispatch.
- Guards against skipped/reversed stages and optimistic concurrency races.
- Keeps the existing admin order editor, but its fulfillment saves now use the same guarded endpoint instead of direct client-side Supabase writes.
- Supplier readiness summary from existing `supplier_leads`, `supplier_quotes`, `products` and `supplier_catalog_items` records.
- Shipping cost evidence table uses existing quote currencies and conversion estimates; incomplete costs and delivery ranges are labeled unverified.
- Links to the existing quotation planner, stock lab, decision board, and launch workspace.
- New regression tests run with existing authentication tests during every Vercel build.

## Safety and limitations

- No Supabase DDL/migrations, no RLS changes and no test/real orders created.
- No live checkout or payment feature flag changes.
- No email or automated shipment creation.
- No automatic supplier purchase orders: admin enters references only for actions already completed externally.
- Supplier quotations are planning estimates. A quote marked `supplier_confirmed` is an *admin-recorded status*, not externally authenticated supplier approval.
- No published shipping rates or delivery times.
- The server route requires production-style server credentials, absent in some preview environments. The UI may display read-only data while saves remain unavailable in preview.
- Existing legacy UI admins retain database RLS update permissions. This change routes both the old and new admin UI through the guarded endpoint, but cannot prevent a privileged administrator from using direct database access. If stronger database-wide enforcement is required, implement audited SQL role policies/triggers in a separately reviewed migration.
- Admin operations pages are private in application logic; test Vercel preview under an authorized admin account before release.

## Review checklist

- [ ] Vercel preview build READY, security tests pass
- [ ] Sign in with an allowlisted administrator; unauthenticated/unauthorized user cannot see private records
- [ ] Queue totals exclude unpaid and sandbox orders
- [ ] Sandbox/unpaid rows are locked against fulfillment updates in both admin interfaces
- [ ] API rejects unauthenticated/non-admin requests
- [ ] Real paid order requires sequential progression and shipment evidence
- [ ] Supplier quotes and stock warnings match existing records
- [ ] Shipping data contains no invented verified rates
- [ ] Mobile widths 375 / 768 / 1440px reviewed
- [ ] Production remains unmodified until preview approval

Development note: Visual browser interactions and privileged end-to-end fulfillment transitions need explicit testing with safe fixtures and owner-controlled accounts. Unit tests assert the pure policy behavior, not the presence of a real eligible customer order.

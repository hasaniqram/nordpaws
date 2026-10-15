# Norrli Pets · Phase 2, Release 1 — Premium discovery

## Status

A review branch, not a production rollout. Do not merge without explicit user approval. No checkout or payments are enabled.

## Included in this release

1. Homepage editorial feature with creator-story link and original founder credit preserved.
2. Four **shop-by-need** collections: clean home, adventures, grooming, feeding. Each card dynamically shows number of matching product concepts from the existing catalog.
3. Swedish accent-insensitive product discovery with limited, descriptive aliases for the current catalog.
4. Instant suggestion dropdown in the collection search field, with links to existing product detail pages and focus hand-off for keyboard users.
5. Existing category, price, sorting and favorites filters still work. New `need` filter is encoded in the URL and can be removed independently.
6. Per-product selection for side-by-side comparison, capped at three and reversible. No login or customer data needed.
7. Public `/compare?items=slug1,slug2` comparison of category, description, preliminary price and existing product specifications. Missing measurements are honestly labeled “Behöver verifieras”.
8. Responsive cards, comparison control and horizontally scrollable accessible comparison table.

## Source of truth and honesty

- Product data remains from the existing `/api/products` endpoint. No made-up real product availability or supplier evidence.
- Existing product images and the approved Norrli logo remain unchanged. Image fallbacks avoid displaying broken-image frames when possible.
- All prices and product concepts are explicitly provisional; comparison is **not** an offer, guarantee or claim of verified material, safety or delivery.
- All comparison and search processing stays client/server local; no third-party AI API or hidden profiling.
- The editorial text does not claim verified certifications, reviews, bestseller status or business registration.
- The existing checkoutEnabled guard is not changed.

## Validation

- Run existing `npm run build` (unit/security suite + Nuxt SSR build) through Vercel.
- Confirm Vercel preview READY for **the latest branch SHA**, not an earlier intermediate build.
- Smoke `/`, `/shop`, `/shop?need=outdoors`, `/shop?q=pals`, `/compare?items=cleanroll,fold-bowl`, `/products/cleanroll`, `/about`, `/admin`, `/api/products`.
- Check Swedish `lang=sv`, approved logo, founder credit and prelaunch notices.
- Verify no admin header on private routes.
- Manual interactive QA still required: tab into suggestions, click suggestions, combine/reverse filters, select three products, compare and remove one, scroll narrow screen, review contrast and tap targets.

## Next Phase 2 releases

- Product Detail 3.0: guided specifications and supplier-verification status, no invented safety claims.
- Search 3.0: accessibility audit, request-specific synonyms and relevance tuned to verified catalog growth.
- Sharing: short SEO-safe preview links and optional collection-sharing without customer data.
- Localization: Swedish primary and English later, with professional translation review.
- Mobile performance: real-device performance audit and image-asset licensing inventory.

These are **not yet built** by Release 1.

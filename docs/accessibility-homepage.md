# Homepage accessibility remediation — October 2026

## Baseline

A user-provided accessibility report for `https://norrlipets.se/` showed:
- 1 scanned page
- 2 **serious** rule types
- 24 affected nodes total
- **Color contrast:** 23 nodes
- **Document language:** 1 node

The report did not include individual element selectors, computed colors, or machine-readable axe JSON. The changes below target confirmed low-contrast styles found in the actual code, but **the original reported node count cannot be validated or guaranteed resolved until the exact scanner is rerun**.

## Code changes

- Nuxt `app.head.htmlAttrs.lang = 'sv'` fixes the missing language attribute in server-rendered HTML.
- `assets/css/accessibility.css` is loaded **last**, after existing storefront and support CSS, to apply palette adjustments without changing the approved logo, site layout architecture, or checkout.
- Improved normal-text contrast for product categories, subtitles, provisional-price captions, value-strip captions, photography note, newsletter text and consent, search placeholders, header hover/active states, and mobile headings.
- Kept the existing cream, sage and forest-green identity. Added near-opaque pale reading surfaces for photo-backed hero and editorial cards where image pixels would otherwise make contrast unpredictable.
- Strengthened visible keyboard focus across storefront and footer.

## Quality gate

`tests/accessibility-contrast.test.mjs`:
- Confirms `lang:'sv'` is configured.
- Confirms CSS override loads last.
- Calculates contrast against the recorded light backgrounds for 14 selectors; **minimum 4.5:1** for normal text.
- Checks that the photographic text reading surfaces and keyboard focus styles remain.
- Confirms no approved logo changes.

Vercel preview also confirms SSR `<html lang="sv">` and the transformed CSS rules in served HTML.

## Manual verification before merging

1. Rescan the **preview homepage** using the same accessibility scanner and compare affected nodes.
2. If any `color-contrast` nodes remain, capture affected selector(s), foreground/background and screenshot, then refine without global color hacks.
3. Run an axe accessibility audit at desktop and mobile breakpoints to check the entire page.
4. Test hero and editorial text with images fully loaded; check active/hover/focus states, form placeholders, footer links, and product cards.
5. Navigate the site with keyboard only; test focus, mobile menu and search.
6. Perform screen-reader spot checks in Swedish (VoiceOver or NVDA).
7. Confirm original logo/brand, prelaunch banner, auth and cart remain intact.

## Restrictions

No payments, customer email, supplier actions or production settings were changed. The change is contained in a draft PR and must not be merged without explicit approval.

**Note:** Passing CSS contrast regression checks and a Nuxt/Vercel build does not constitute a complete WCAG 2.2 AA certification.

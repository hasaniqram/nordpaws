import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
test('product image loading and variants retain keyboard and screen reader semantics',()=>{
 const p=read('pages/products/[slug].vue')
 assert.match(p,/fetchpriority="high" loading="eager"/)
 assert.match(p,/loading="lazy" decoding="async"/)
 assert.match(p,/:aria-pressed="selectedVariantId===variant.id"/)
 assert.match(p,/onGalleryKeydown/)
})
test('cart quantity accessible announcement and touch controls',()=>{
 const c=read('pages/cart.vue'),css=read('assets/css/storefront-phase52.css')
 assert.match(c,/<output :aria-label=/)
 assert.match(css,/min-height:44px/)
 assert.match(css,/max-width:760px/)
 assert.match(css,/prefers-reduced-motion:reduce/)
})
test('Phase 5.2 CSS loads without breaking discovery-accessibility precedence',()=>{
 const cfg=read('nuxt.config.ts')
 assert.match(cfg,/storefront-phase52.css/)
 assert.match(cfg,/'~\/assets\/css\/premium-discovery.css', '~\/assets\/css\/accessibility.css'/)
 assert.equal((cfg.match(/checkoutEnabled: false/g)||[]).length,2)
 const email=read('server/api/admin/reminder-provider-status.get.ts')
 assert.match(email,/automaticRemindersEnabled:false/)
})

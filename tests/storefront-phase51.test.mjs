import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
test('shop exposes keyboard skip link and live search results',()=>{
 const page=read('pages/shop/index.vue')
 assert.match(page,/href="#norrli-products"/)
 assert.match(page,/id="norrli-products"/)
 assert.match(page,/aria-live="polite"/)
})
test('mobile filter refinements preserve reduced motion and touch targets',()=>{
 const css=read('assets/css/storefront-phase51.css')
 assert.match(css,/max-width:760px/)
 assert.match(css,/min-height:44px/)
 assert.match(css,/prefers-reduced-motion:reduce/)
 assert.match(read('nuxt.config.ts'),/storefront-phase51.css/)
})
test('premium changes preserve checkout disablement and existing filtering',()=>{
 assert.match(read('nuxt.config.ts'),/checkoutEnabled: false/)
 assert.match(read('pages/shop/index.vue'),/filterStorefront/)
 assert.match(read('server/api/checkout.post.ts'),/sk_test_/)
})

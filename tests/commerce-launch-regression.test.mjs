import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
test('checkout rejects live payment keys and requires explicit enablement',()=>{
 const checkout=read('server/api/checkout.post.ts')
 assert.match(checkout,/!config\.checkoutEnabled/)
 assert.match(checkout,/!apiKey\.startsWith\('sk_test_'\)/)
})
test('merchant feed cannot advertise provisional products',()=>{
 const feed=read('server/api/merchant-feed.get.ts')
 assert.match(feed,/statusCode:503/)
 assert.match(feed,/commercial launch/)
})
test('shopping discovery, filters, cart and product page are retained',()=>{
 assert.match(read('pages/shop/index.vue'),/filterStorefront/)
 assert.match(read('pages/shop/index.vue'),/suggestProducts/)
 assert.match(read('pages/cart.vue'),/checkoutEnabled/)
 assert.match(read('pages/products/[slug].vue'),/useSeoMeta|useHead/)
})
test('pre-launch QA and shipping sandbox have no payment or fulfillment APIs',()=>{
 for(const path of ['pages/admin/commerce-acceptance.vue','pages/admin/shipping-sandbox.vue']){
  const source=read(path)
  assert.doesNotMatch(source,/\/api\/checkout|\/api\/admin\/send-reminder-test/)
  assert.match(source,/noindex,nofollow/)
 }
})

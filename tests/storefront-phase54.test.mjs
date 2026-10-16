import test from 'node:test'
import assert from 'node:assert/strict'
import {HISTORY_KEY,cleanRecent,addRecent} from '../utils/recentlyViewed.mjs'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
test('recent products are bounded deduplicated and restricted to catalog',()=>{
 assert.deepEqual(cleanRecent(['a','b','a','unknown'],['a','b']),['a','b'])
 assert.deepEqual(addRecent(['a','b'],'b',['a','b']),['b','a'])
 assert.equal(cleanRecent(Array(20).fill('a'),['a']).length,1)
 assert.equal(addRecent(['a'],'outside',['a']).includes('outside'),false)
})
test('viewed history stays browser-side and can be erased',()=>{
 const product=read('pages/products/[slug].vue'),favorites=read('pages/favorites.vue')
 assert.match(product,/localStorage\.setItem\(HISTORY_KEY/)
 assert.match(favorites,/localStorage\.removeItem\(HISTORY_KEY\)/)
 assert.match(favorites,/Rensa historiken/)
 assert.equal(HISTORY_KEY,'norrli-recent-products-v1')
})
test('checkout and scheduled emails remain off',()=>{
 assert.equal((read('nuxt.config.ts').match(/checkoutEnabled: false/g)||[]).length,2)
 assert.match(read('server/api/admin/reminder-provider-status.get.ts'),/automaticRemindersEnabled:false/)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {recommendFromFavorites} from '../utils/privacyRecommendations.mjs'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
const catalog=[{slug:'a',category:'Cats'},{slug:'b',category:'Dogs'},{slug:'c',category:'Cats'},{slug:'d',category:'Dogs'}]
test('recommends same-category products without repeating saved favorites',()=>{
 assert.deepEqual(recommendFromFavorites(catalog,['a'],2).map(x=>x.slug),['c','b'])
})
test('recommendations are bounded and deterministic without saved favorites',()=>{
 assert.deepEqual(recommendFromFavorites(catalog,[],2).map(x=>x.slug),['a','b'])
 assert.equal(recommendFromFavorites(catalog,['a'],1).length,1)
})
test('favorites recommendations do not send user data or enable commerce',()=>{
 const page=read('pages/favorites.vue')
 assert.match(page,/recommendFromFavorites/)
 assert.match(page,/Ingen personlig spårning används/)
 assert.doesNotMatch(read('utils/privacyRecommendations.mjs'),/fetch\(|localStorage|document\.cookie/)
 assert.match(read('nuxt.config.ts'),/checkoutEnabled: false/)
 assert.match(read('server/api/admin/reminder-provider-status.get.ts'),/automaticRemindersEnabled:false/)
})

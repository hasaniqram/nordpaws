import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {filterStorefront,suggestProducts,getComparison} from '../utils/storefrontDiscovery.mjs'
import {cleanRecent,addRecent} from '../utils/recentlyViewed.mjs'
import {recommendFromFavorites} from '../utils/privacyRecommendations.mjs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
const catalog=[
 {id:'1',slug:'cleanroll',name:'CleanRoll',category:'Clean Home',price:32900,description:'Pet hair sofa'},
 {id:'2',slug:'paw-cleaner',name:'Paw Cleaner',category:'Clean Home',price:17900,description:'Dog paws'},
 {id:'3',slug:'fold-bowl',name:'Fold Bowl',category:'Travel',price:24900,description:'Travel water'},
 {id:'4',slug:'car-seat-cover',name:'Car Cover',category:'Travel',price:59900,description:'Car dog'}
]
test('customer discovery journey: Swedish search and category-filtered results',()=>{
 assert.ok(suggestProducts(catalog,'tassar',5).some(p=>p.slug==='paw-cleaner'))
 assert.deepEqual(filterStorefront(catalog,{category:'Travel',price:'under-250'}).map(x=>x.slug),['fold-bowl'])
 assert.deepEqual(getComparison(catalog,'cleanroll,fold-bowl').map(x=>x.slug),['cleanroll','fold-bowl'])
})
test('privacy-only customer journey: favorites and recent product cleanup',()=>{
 assert.deepEqual(recommendFromFavorites(catalog,['cleanroll'],2).map(x=>x.slug),['paw-cleaner','fold-bowl'])
 assert.deepEqual(addRecent(['cleanroll'],'fold-bowl',catalog.map(p=>p.slug)),['fold-bowl','cleanroll'])
 assert.deepEqual(cleanRecent(['invalid','fold-bowl'],catalog.map(p=>p.slug)),['fold-bowl'])
})
test('test-only checkout fails closed before order creation when disabled',()=>{
 const checkout=read('server/api/checkout.post.ts')
 const gated=checkout.indexOf('if (!config.checkoutEnabled || !apiKey.startsWith(\'sk_test_\'))')
 const firstDb=checkout.indexOf('getSupabaseAdmin()')
 assert.ok(gated>=0&&firstDb>gated)
 assert.equal((read('nuxt.config.ts').match(/checkoutEnabled: false/g)||[]).length,2)
})
test('all admin API handlers check role; merchant feed stays blocked',()=>{
 const paths=['fulfillment.post.ts','reminder-provider-status.get.ts','reserve-reminder-test.post.ts','send-reminder-test.post.ts','verify-reminder-email.post.ts']
 for(const name of paths){
  const page=read('server/api/admin/'+name)
  assert.match(page,/auth\.getUser\(token\)/)
  assert.match(page,/\.from\('admins'\)/)
 }
 assert.match(read('server/api/merchant-feed.get.ts'),/statusCode:503/)
})

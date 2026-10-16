import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {organizationSchema,websiteSchema} from '../utils/editorialSeo.mjs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
test('brand structured data does not claim purchasable products',()=>{
 const schemas=[organizationSchema(),websiteSchema()]
 assert.equal(schemas[0]['@type'],'Organization')
 assert.equal(schemas[1]['@type'],'WebSite')
 assert.equal(schemas.some(x=>JSON.stringify(x).includes('Offer')),false)
 assert.match(read('pages/index.vue'),/organizationSchema\(\)/)
})
test('analytics preference is opt-in and no external trackers are added',()=>{
 const comp=read('components/AnalyticsPreferences.vue')
 assert.match(comp,/consent=ref<'unset'\|'off'\|'on'>\('unset'\)/)
 assert.match(comp,/Avböj analys/)
 assert.match(comp,/localStorage\.setItem/)
 assert.doesNotMatch(comp,/gtag\(|fbq\(|google-analytics\.com|fetch\(/)
 assert.match(read('components/SiteFooter.vue'),/<AnalyticsPreferences/)
})
test('no commerce or outbound email activation',()=>{
 assert.equal((read('nuxt.config.ts').match(/checkoutEnabled: false/g)||[]).length,2)
 assert.match(read('server/api/admin/reminder-provider-status.get.ts'),/automaticRemindersEnabled:false/)
 assert.match(read('server/api/merchant-feed.get.ts'),/statusCode:503/)
})

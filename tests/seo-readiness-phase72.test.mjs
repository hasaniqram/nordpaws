import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
test('Phase 7.2 provides honest external verification links and no fake metrics',()=>{
 const page=read('pages/admin/seo-readiness.vue')
 assert.match(page,/search\.google\.com\/search-console/)
 assert.match(page,/pagespeed\.web\.dev/)
 assert.match(page,/no performance score is inferred/)
 assert.match(page,/noindex,nofollow/)
})
test('SEO readiness page does not make outbound tracking or payment calls',()=>{
 const page=read('pages/admin/seo-readiness.vue')
 assert.doesNotMatch(page,/\$fetch\(|fetch\(|gtag\(|fbq\(|\/api\/checkout/)
 assert.match(read('server/api/merchant-feed.get.ts'),/statusCode:503/)
 assert.equal((read('nuxt.config.ts').match(/checkoutEnabled: false/g)||[]).length,2)
 assert.match(read('server/api/admin/reminder-provider-status.get.ts'),/automaticRemindersEnabled:false/)
})

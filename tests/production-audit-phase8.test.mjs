import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
test('Phase 8 audit is administrator-gated and noindexed',()=>{
 const page=read('pages/admin/production-audit.vue')
 assert.match(page,/c\.auth\.getSession\(\)/)
 assert.match(page,/c\.auth\.getUser\(\)/)
 assert.match(page,/\.from\('admins'\)/)
 assert.match(page,/v-else-if="!authorized"/)
 assert.match(page,/v-else class="p8-wrap"/)
 assert.match(page,/noindex,nofollow/)
})
test('release gate remains blocked and audit cannot transact',()=>{
 const page=read('pages/admin/production-audit.vue')
 assert.match(page,/Release gate: NOT APPROVED/)
 assert.match(page,/P0/)
 assert.doesNotMatch(page,/\/api\/checkout|refunds\.create|sendEmail\(|\.update\(|\.insert\(/)
 assert.equal((read('nuxt.config.ts').match(/checkoutEnabled: false/g)||[]).length,2)
 assert.match(read('server/api/merchant-feed.get.ts'),/statusCode:503/)
 assert.match(read('server/api/admin/reminder-provider-status.get.ts'),/automaticRemindersEnabled:false/)
})

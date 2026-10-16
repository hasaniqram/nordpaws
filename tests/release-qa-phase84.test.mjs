import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
test('Phase 8.4 QA capture is admin gated, noindexed and evidence never auto-approves release',()=>{
 const p=read('pages/admin/release-qa-evidence.vue')
 assert.match(p,/auth\.getUser\(\)/)
 assert.match(p,/\.from\('admins'\)/)
 assert.match(p,/<main v-if="authorized"/)
 assert.match(p,/noindex,nofollow/)
 assert.match(p,/NOT APPROVED/)
 assert.match(p,/Export local QA report/)
})
test('QA capture is manual and does not read orders or execute payment or email APIs',()=>{
 const p=read('pages/admin/release-qa-evidence.vue')
 assert.doesNotMatch(p,/\$fetch\(|fetch\(|\.from\('orders'\)|\/api\/checkout|sendEmail|\.insert\(|\.update\(/)
 assert.match(read('server/api/merchant-feed.get.ts'),/statusCode:503/)
 assert.equal((read('nuxt.config.ts').match(/checkoutEnabled: false/g)||[]).length,2)
 assert.match(read('server/api/admin/reminder-provider-status.get.ts'),/automaticRemindersEnabled:false/)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {RELEASE_GATES,assessReleaseEvidence} from '../utils/releaseDecision.mjs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
test('release decision remains NO-GO even with all self-reported evidence',()=>{
 const complete=Object.fromEntries(RELEASE_GATES.map(g=>[g.id,{status:'verified',reference:'TEST-REPORT'}]))
 assert.equal(assessReleaseEvidence(complete).decision,'NOT APPROVED')
 assert.equal(assessReleaseEvidence(complete).evidenceComplete,true)
 assert.equal(assessReleaseEvidence({}).outstanding.length,RELEASE_GATES.length)
 assert.equal(assessReleaseEvidence({security:{status:'verified',reference:''}}).outstanding.includes('security'),true)
})
test('admin-only review does not use live payment, email, product or fulfillment APIs',()=>{
 const page=read('pages/admin/release-decision.vue')
 assert.match(page,/\.from\('admins'\)/)
 assert.match(page,/<main v-if="authorized"/)
 assert.match(page,/noindex,nofollow/)
 assert.doesNotMatch(page,/\$fetch\(|fetch\(|\.update\(|\.insert\(|\/api\/checkout|sendEmail/)
 assert.equal((read('nuxt.config.ts').match(/checkoutEnabled: false/g)||[]).length,2)
 assert.match(read('server/api/merchant-feed.get.ts'),/statusCode:503/)
 assert.match(read('server/api/admin/reminder-provider-status.get.ts'),/automaticRemindersEnabled:false/)
})

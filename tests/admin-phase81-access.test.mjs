import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
for(const path of ['pages/admin/shipping-tracking-sandbox.vue','pages/admin/fulfillment-operations-demo.vue','pages/admin/seo-readiness.vue']){
 test(path+' requires admin before rendering',()=>{
  const page=read(path)
  assert.match(page,/auth\.getSession\(\)/)
  assert.match(page,/auth\.getUser\(\)/)
  assert.match(page,/\.from\('admins'\)/)
  assert.match(page,/<main v-if="authorized"/)
  assert.match(page,/Administrator access required/)
  assert.match(page,/noindex,nofollow/)
 })
}
test('live checkout and outbound automatic reminders remain disabled',()=>{
 assert.equal((read('nuxt.config.ts').match(/checkoutEnabled: false/g)||[]).length,2)
 assert.match(read('server/api/admin/reminder-provider-status.get.ts'),/automaticRemindersEnabled:false/)
})

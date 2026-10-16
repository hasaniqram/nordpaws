import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
const adminRoutes=[
 'server/api/admin/fulfillment.post.ts',
 'server/api/admin/reminder-provider-status.get.ts',
 'server/api/admin/reserve-reminder-test.post.ts',
 'server/api/admin/send-reminder-test.post.ts',
 'server/api/admin/verify-reminder-email.post.ts'
]
for(const path of adminRoutes){
 test(path+' checks a verified session and administrator role before privileged actions',()=>{
  const code=read(path)
  assert.match(code,/getHeader\(event,\s*'authorization'\)/)
  assert.match(code,/auth\.getUser\(token\)/)
  assert.match(code,/\.from\('admins'\)/)
  assert.match(code,/adminError\s*\|\|\s*!admin/)
  assert.match(code,/no-store/)
 })
}
test('privileged routes do not change safety flags or expose production payment path',()=>{
 const config=read('nuxt.config.ts')
 assert.equal((config.match(/checkoutEnabled: false/g)||[]).length,2)
 assert.match(read('server/api/checkout.post.ts'),/sk_test_/)
 assert.match(read('server/api/admin/reminder-provider-status.get.ts'),/automaticRemindersEnabled:false/)
 assert.match(read('server/api/merchant-feed.get.ts'),/statusCode:503/)
})

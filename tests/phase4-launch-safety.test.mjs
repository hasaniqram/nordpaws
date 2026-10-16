import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
test('checkout defaults to disabled in server and public config',()=>{
 const config=read('nuxt.config.ts')
 assert.match(config,/checkoutEnabled: false/)
 assert.equal((config.match(/checkoutEnabled: false/g)||[]).length,2)
})
test('launch gate pages do not activate products, send emails or enable checkout',()=>{
 for(const path of ['pages/admin/launch-gate.vue','pages/admin/launch-qa.vue']){
  const page=read(path)
  assert.doesNotMatch(page,/\.from\(['"]products['"]\)\.update\(/)
  assert.doesNotMatch(page,/send-reminder-test|checkoutEnabled\s*:\s*true/)
 }
})
test('Brevo provider check does not claim independently verified domain or automatic emails',()=>{
 const route=read('server/api/admin/reminder-provider-status.get.ts')
 assert.match(route,/senderDomainConfirmed:false/)
 assert.match(route,/automaticRemindersEnabled:false/)
})

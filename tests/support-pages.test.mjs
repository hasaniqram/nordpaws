import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
const routes=[
 ['pages/support.vue','Hur kan vi hjälpa dig?'],
 ['pages/contact.vue','Kontakta oss'],
 ['pages/delivery.vue','Leveransinformation'],
 ['pages/legal/shipping.vue','Leveransvillkor'],
 ['pages/legal/returns.vue','Returer och ångerrätt'],
 ['pages/legal/privacy.vue','Integritetspolicy'],
 ['pages/legal/terms.vue','Köpvillkor'],
 ['pages/legal/copyright.vue','Upphovsrätt och innehåll']
]
test('all Kundservice pages share accessible design and real Swedish headings',()=>{
 for(const [p,title] of routes){
  const source=read(p)
  assert.match(source,/<SupportShell/)
  assert.ok(source.includes(title),p+' must contain correct Swedish title')
  assert.equal(source.includes('This page is a launch placeholder'),false)
 }
})
test('public support navigation includes every customer page',()=>{
 const shell=read('components/SupportShell.vue')
 for(const path of ['/support','/contact','/delivery','/legal/shipping','/legal/returns','/legal/privacy','/legal/terms','/legal/copyright'])
  assert.ok(shell.includes("'"+path+"'"),'Missing route '+path)
})
test('contact flow has no support-email dispatch, ticket identifiers or false SLA promise',()=>{
 const api=read('server/api/contact.post.ts')
 const ui=read('pages/contact.vue')
 assert.ok(api.includes('contact_messages'))
 assert.equal(api.includes('syncBrevoContact'),false)
 assert.equal(api.includes('sendEmail'),false)
 assert.equal(ui.includes('ärendenummer skapas inte'),true)
 assert.equal(ui.includes('Svar inom 24'),false)
})
test('admin inbox handles existing allowed statuses without sending mail',()=>{
 const page=read('pages/admin/support.vue')
 assert.ok(page.includes("from('admins')"))
 assert.ok(page.includes("from('contact_messages')"))
 assert.ok(page.includes("eq('status',c.status)"))
 for(const val of ['new','open','closed'])assert.ok(page.includes('value="'+val+'"'))
 assert.equal(page.includes('sendEmail'),false)
})
test('privacy and return terms disclose unfinished legal work',()=>{
 const privacy=read('pages/legal/privacy.vue')
 const returns=read('pages/legal/returns.vue')
 assert.match(privacy,/personuppgiftsansvarig/)
 assert.match(privacy,/behöver kompletteras/)
 assert.match(returns,/digital ångerfunktion/)
 assert.match(returns,/kontaktformuläret/)
})

import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {prepareSupportMessage, SUPPORT_TOPICS} from '../server/utils/supportMessage.mjs'
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
test('copyright page is a Swedish support page and explains third-party image rights',()=>{
 const page=read('pages/legal/copyright.vue')
 assert.match(page,/<SupportShell/)
 assert.match(page,/Upphovsrätt och innehåll/)
 assert.match(page,/tredje part/)
 assert.match(page,/Fotografier och illustrationer/)
 assert.match(page,/ursprungliga upphovsperson/i)
})
test('copyright page avoids falsely claiming registered trademarks or ownership of stock images',()=>{
 const page=read('pages/legal/copyright.vue')
 assert.match(page,/Vi påstår inte att varumärket är registrerat/)
 assert.match(page,/®/)
 assert.match(page,/En copyrighttext överlåter inte deras upphovsrätt/)
 assert.ok(!page.includes('Alla bilder tillhör Norrli Pets'))
})
test('footer includes the dynamic year, qualified copyright statement and accessible legal link',()=>{
 const footer=read('components/SiteFooter.vue')
 assert.ok(footer.includes("new Date().getFullYear()"))
 assert.ok(footer.includes("to=\"/legal/copyright\""))
 assert.match(footer,/Material från tredje part omfattas av respektive rättighetshavares villkor/)
 assert.ok(footer.includes('aria-label="Juridisk information"'))
 assert.ok(!footer.includes('Norrli Pets®'))
})
test('copyright route is discoverable from help center and legal navigation',()=>{
 assert.match(read('components/SupportShell.vue'),/to:'\/legal\/copyright'/)
 assert.match(read('pages/support.vue'),/to:'\/legal\/copyright'/)
})
test('copyright inquiries use validated existing contact-message workflow',()=>{
 const contact=read('pages/contact.vue')
 assert.ok(contact.includes("value:'copyright'"))
 assert.ok(SUPPORT_TOPICS.some(([id])=>id==='copyright'))
 const data=prepareSupportMessage({name:'Copyright Rights Holder',email:'owner@example.org',
  topic:'copyright',message:'Önskar tillstånd för en bild på Norrli Pets.'})
 assert.match(data.message,/Ärende: Upphovsrätt och innehåll/)
 assert.equal(data.status,'new')
 assert.equal('ticketId' in data,false)
})

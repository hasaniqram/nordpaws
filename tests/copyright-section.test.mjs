import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {prepareSupportMessage, SUPPORT_TOPICS} from '../server/utils/supportMessage.mjs'
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
test('copyright page is a Swedish support page and explains third-party image rights',()=>{
 const page=read('pages/legal/copyright.vue')
 assert.match(page,/<SupportShell/)
 assert.match(page,/Upphovsrätt och innehåll/)
 assert.match(page,/tredje part/)
 assert.match(page,/Fotografier och illustrationer/)
 assert.match(page,/upphovsperson eller rättighetshavare/)
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

test('Norrli Pets footer clearly credits Hasan Iqram for the concept and website',()=>{
 const footer=read('components/SiteFooter.vue')
 assert.match(footer,/Idé, koncept &amp; webbplatsutveckling:/)
 assert.match(footer,/<strong>Hasan Iqram<\/strong>/)
})
test('creator credit is prominent on the copyright page without assigning third-party rights',()=>{
 const page=read('pages/legal/copyright.vue')
 assert.match(page,/Skapad av <strong>Hasan Iqram<\/strong>/)
 assert.match(page,/Initiativtagare · Konceptskapare · Webbplatsutvecklare/)
 assert.match(page,/Material från tredje part omfattas av respektive rättighetshavares villkor/)
})

test('uploaded founder photo has correct optimized original bytes and is displayed accessibly',()=>{
 const file=read('components/FounderPortrait.vue')
 const match=file.match(/src="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/)
 assert.ok(match,'Founder portrait image data is missing')
 const buffer=Buffer.from(match[1],'base64')
 assert.equal(buffer.length,4878)
 assert.equal(buffer.toString('ascii',0,4),'RIFF')
 assert.equal(buffer.toString('ascii',8,12),'WEBP')
 assert.equal(buffer.readUInt32LE(4)+8,buffer.length)
 assert.equal(createHash('sha256').update(buffer).digest('hex'),'7b817bcaf7b617d48644c584f6933365a0053b483038b0db905491cba36124d8')
 assert.match(file,/alt="Porträtt av Hasan Iqram/)
 assert.match(read('pages/legal/copyright.vue'),/<FounderPortrait \/>/)
})

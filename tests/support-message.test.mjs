import {test} from 'node:test'
import assert from 'node:assert/strict'
import {prepareSupportMessage,SUPPORT_TOPICS} from '../server/utils/supportMessage.mjs'
const request={name:' Test Customer ',email:' HELP@EXAMPLE.COM ',message:'Det här är en fråga om leverans.'}
test('safe normalized case stored through existing contact_messages structure',()=>{
 const actual=prepareSupportMessage({...request,topic:'delivery',orderReference:'AB-123'})
 assert.equal(actual.name,'Test Customer')
 assert.equal(actual.email,'help@example.com')
 assert.match(actual.message,/Ärende: Leverans och frakt/)
 assert.match(actual.message,/Orderreferens: AB-123/)
 assert.match(actual.message,/Det här är en fråga om leverans/)
 assert.equal(actual.status,'new')
})
test('existing plain contact requests remain compatible',()=>{
 const out=prepareSupportMessage(request)
 assert.match(out.message,/Ärende: Allmän fråga/)
 assert.equal(out.message.includes('Orderreferens:'),false)
})
test('all displayed topics have supported server allowlist entries',()=>{
 assert.equal(SUPPORT_TOPICS.length,6)
 for(const [key] of SUPPORT_TOPICS){
  assert.equal(prepareSupportMessage({...request,topic:key}).topic,key)
 }
})
test('invalid messages and spoofed subjects are rejected before persistence',()=>{
 for(const body of [
  {...request,topic:'admin'},
  {...request,name:'A'}, {...request,email:'bad'},
  {...request,message:'short'}, {...request,message:'X'.repeat(3501)},
  {...request,orderReference:'../../not-safe'},
  {...request,orderReference:'A'.repeat(65)}
 ])assert.throws(()=>prepareSupportMessage(body))
})
test('no email delivery, external calls or ticket IDs are generated',()=>{
 const result=prepareSupportMessage(request)
 assert.equal('ticketId' in result,false)
 assert.equal('sent' in result,false)
 assert.equal('delivery' in result,false)
 assert.ok(result.message.length<=4000)
})

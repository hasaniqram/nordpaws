import test from 'node:test'
import assert from 'node:assert/strict'
import {simulateStep,evaluateRefundRequest,classifyDeliveryIssue} from '../utils/shippingSimulation.mjs'
import {readFileSync} from 'node:fs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
const order={stage:'unfulfilled',carrier:'',tracking:'',events:[]}
test('step-by-step simulated order progression',()=>{
 const next=simulateStep(order,'supplier_ordered')
 assert.equal(next.ok,true)
 assert.equal(next.order.events.length,1)
 assert.equal(simulateStep(order,'delivered').ok,false)
})
test('shipment requires simulated carrier and tracking',()=>{
 const initial={...order,stage:'processing'}
 assert.equal(simulateStep(initial,'shipped').ok,false)
 assert.equal(simulateStep({...initial,carrier:'Demo',tracking:'TEST-1'},'shipped').ok,true)
})
test('refund validates amounts without performing transactions',()=>{
 assert.equal(evaluateRefundRequest({reason:'return',amount:100,orderTotal:499}).valid,true)
 assert.equal(evaluateRefundRequest({reason:'return',amount:500,orderTotal:499}).valid,false)
 assert.match(classifyDeliveryIssue('lost'),/Missing/)
})
test('simulation remains isolated from real orders and payments',()=>{
 const page=read('pages/admin/shipping-tracking-sandbox.vue')
 assert.doesNotMatch(page,/\/api\/checkout|\.from\(['"]orders['"]\)|refunds\.create|fetch\(/)
 assert.match(read('nuxt.config.ts'),/checkoutEnabled: false/)
 assert.match(read('server/api/admin/reminder-provider-status.get.ts'),/automaticRemindersEnabled:false/)
})

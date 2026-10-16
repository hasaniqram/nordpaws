import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {simulateStep,evaluateRefundRequest} from '../utils/shippingSimulation.mjs'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
test('Phase 6.2 demo provides multi-order selection and isolated audit entries',()=>{
 const page=read('pages/admin/fulfillment-operations-demo.vue')
 assert.match(page,/NP-DEMO-001/)
 assert.match(page,/SIMULATION_STEPS/)
 assert.match(page,/current\.events/)
 assert.match(page,/Reset demo/)
 assert.match(page,/noindex,nofollow/)
})
test('demo never uses network, DB order writes or live payment APIs',()=>{
 const page=read('pages/admin/fulfillment-operations-demo.vue')
 assert.doesNotMatch(page,/\$fetch\(|fetch\(|\.from\(['\"](?:orders|order_items|refunds)['\"]\)|\/api\/checkout|refunds\.create|sendEmail/)
})
test('simulated refunds and shipping remain constrained',()=>{
 assert.equal(simulateStep({stage:'processing',carrier:'',tracking:'',events:[]},'shipped').ok,false)
 assert.equal(evaluateRefundRequest({reason:'return',amount:500,orderTotal:499}).valid,false)
 assert.equal((read('nuxt.config.ts').match(/checkoutEnabled: false/g)||[]).length,2)
})

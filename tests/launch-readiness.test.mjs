import {test} from 'node:test'
import assert from 'node:assert/strict'
import {evaluateLaunchReadiness,previewFulfillment} from '../utils/launchReadiness.mjs'
const paid={payment_status:'paid',payment_provider:'mollie',order_number:'NR-123',fulfillment_status:'unfulfilled'}
test('empty evidence never counts as launch-ready',()=>{
 const x=evaluateLaunchReadiness()
 assert.equal(x.ready,false);assert.equal(x.passed,1);assert.equal(x.total,6)
})
test('unverified supplier and costs are not considered documented',()=>{
 const x=evaluateLaunchReadiness({leads:[{id:'a',status:'shortlisted',shipping_to_sweden:true}],
 quotes:[{supplier_lead_id:'a',product_id:'p',status:'supplier_confirmed'}],
 products:[{id:'p',active:true,stock_status:'unknown'}]})
 assert.equal(x.checks.find(c=>c.id==='suppliers').passed,false)
 assert.equal(x.checks.find(c=>c.id==='quotes').passed,false)
 assert.equal(x.checks.find(c=>c.id==='catalog').passed,false)
 assert.equal(x.ready,false)
})
test('fully documented preparation still requires external launch approval',()=>{
 const data={
 tasks:[{status:'ready',priority:1}],leads:[{id:'s',status:'contracted',shipping_to_sweden:true}],
 quotes:[{supplier_lead_id:'s',product_id:'p',status:'supplier_confirmed',unit_cost:10,shipping_per_order:25,payment_fee_pct:2,delivery_min_days:3,delivery_max_days:7}],
 products:[{id:'p',active:true,material:'Cotton',stock_status:'in_stock',supplier_sku:'SKU'}],
 images:[{product_id:'p',is_concept:false}],stock:[{verified_at:new Date().toISOString()}],orders:[]
 }
 const result=evaluateLaunchReadiness(data)
 assert.equal(result.passed,result.total)
 assert.equal(result.ready,false)
})
test('dry-run never authorizes sandbox, unpaid, jumps or fabricated tracking',()=>{
 const fields={supplierOrderReference:'PO1',carrier:'Carrier',trackingNumber:'TRACK'}
 for(const o of [{...paid,payment_status:'unpaid'},{...paid,payment_provider:'stripe_test'},{...paid,order_number:'NR-TEST-1'}]){
  assert.equal(previewFulfillment(o,'supplier_ordered',fields).allowed,false)
 }
 assert.equal(previewFulfillment(paid,'shipped',fields).allowed,false)
 assert.equal(previewFulfillment(paid,'supplier_ordered',fields).allowed,true)
 assert.equal(previewFulfillment(paid,'supplier_ordered',fields).mutated,false)
 assert.equal(previewFulfillment({...paid,fulfillment_status:'processing'},'shipped',{supplierOrderReference:'PO1'}).allowed,false)
 assert.equal(previewFulfillment({...paid,fulfillment_status:'shipped'},'delivered',fields).allowed,false)
})

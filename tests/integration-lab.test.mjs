import {test} from 'node:test'
import assert from 'node:assert/strict'
import {compareSupplierFeed,stockSyncAlerts,shippingEvidence,localEmailPreview} from '../utils/integrationLab.mjs'

const supplier='s1', old=[
 {id:'c1',supplier_lead_id:supplier,supplier_sku:' CLEAN-01 ',title:'Cleaner',product_id:'p1',
 stock_status:'in_stock',stock_quantity:12,unit_cost:45,currency:'SEK',verified_at:'2026-10-01',lead_time_days:3},
 {id:'c2',supplier_lead_id:'s2',supplier_sku:'CLEAN-01',title:'Other supplier',stock_status:'out_of_stock',stock_quantity:0,unit_cost:1,currency:'SEK'}
]
const products=[{id:'p1',name:'Cleaner',supplier_sku:'CLEAN-01'}, {id:'p2',name:'Brush',supplier_sku:'BRUSH-02'}]
test('only matching supplier SKUs are compared and verified stock is invalidated in proposal',()=>{
 const before=structuredClone(old)
 const result=compareSupplierFeed([{sku:'clean-01',title:'Cleaner',stock_quantity:4,stock_status:'low_stock'}],old,supplier,products)
 assert.equal(result.summary.changed,1)
 assert.equal(result.rows[0].prior.product_id,'p1')
 assert.equal(result.rows[0].proposed.stock_quantity,4)
 assert.equal(result.rows[0].requiresVerification,true)
 assert.equal(result.writeEnabled,false)
 assert.deepEqual(old,before)
})
test('new matching SKU is only a suggestion, never silently mapped',()=>{
 const diff=compareSupplierFeed([{sku:'BRUSH-02',title:'Brush',stock_quantity:0}],old,supplier,products)
 assert.equal(diff.rows[0].action,'review_new')
 assert.equal(diff.rows[0].productId,null)
 assert.equal(diff.rows[0].suggestedProduct.id,'p2')
})
test('unchanged rows do not imply stock verification',()=>{
 const x=compareSupplierFeed([{sku:'CLEAN-01',title:'Cleaner'}],old,supplier,products)
 assert.equal(x.summary.unchanged,1)
 assert.equal(x.rows[0].requiresVerification,false)
})
test('duplicate SKUs in feed are rejected even if case differs',()=>{
 assert.throws(()=>compareSupplierFeed([{sku:'AB',title:'A'},{sku:'ab',title:'B'}],[],supplier),/Duplicate/)
})
test('cross-supplier catalog collisions do not overwrite existing data',()=>{
 const x=compareSupplierFeed([{sku:'CLEAN-01',title:'New'}],old,'new-supplier',products)
 assert.equal(x.rows[0].action,'review_new')
})
test('stale stock, unavailable stock, unmapped SKUs and missing quantities are surfaced',()=>{
 const list=stockSyncAlerts([{id:'x',supplier_sku:'X',title:'Test',verified_at:null,stock_status:'out_of_stock',stock_quantity:null,product_id:null}])
 assert.equal(list.length,1)
 assert.equal(list[0].alerts.length,4)
})
test('shipping numbers are quotes only and never approve customer rates',()=>{
 const supplier={status:'contracted',shipping_to_sweden:true}
 const quote={status:'supplier_confirmed',quote_reference:'Q1',unit_cost:40,shipping_per_order:12,fx_to_sek:10,
 payment_fee_pct:2,payment_fixed_sek:3,returns_reserve_pct:1,delivery_min_days:3,delivery_max_days:9}
 const x=shippingEvidence(quote,supplier,29900)
 assert.equal(x.estimateSEK,120)
 assert.equal(x.reviewReady,true)
 assert.equal(x.customerShippingApproved,false)
 assert.equal(shippingEvidence({...quote,quote_reference:null,source_url:null},supplier,29900).reviewReady,false)
})
test('email templates are fictional and never send anything',()=>{
 for(const kind of ['confirmation','dispatch','delivery']){
  const x=localEmailPreview(kind)
  assert.equal(x.sent,false)
  assert.equal(x.to,'demo@example.invalid')
  assert.match(x.subject,/DEMO/)
  assert.match(x.body,/DEMO EMAIL — NOT SENT/)
 }
 assert.throws(()=>localEmailPreview('real-order'),/Unsupported/)
})

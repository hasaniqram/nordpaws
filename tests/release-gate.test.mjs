import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {evaluateReleaseGate,RELEASE_REVIEW_ITEMS} from '../utils/releaseGate.mjs'

const input={
 tasks:[
  {code:'company_registration',status:'ready'},{code:'vat',status:'ready'},
  {code:'safety',status:'ready'},{code:'shipping',status:'ready'},{code:'email',status:'ready'}
 ],
 leads:[{id:'s1',status:'contracted',shipping_to_sweden:true}],
 quotes:[{
  supplier_lead_id:'s1',product_id:'p1',status:'supplier_confirmed',quote_reference:'Q1',
  unit_cost:12,shipping_per_order:8,fx_to_sek:1,payment_fee_pct:2,payment_fixed_sek:2,
  returns_reserve_pct:1,delivery_min_days:2,delivery_max_days:7
 }],
 products:[{id:'p1',active:true,material:'Cotton',supplier_sku:'P1'}],
 images:[{product_id:'p1',is_concept:false}],
 catalog:[{product_id:'p1',supplier_lead_id:'s1',stock_status:'in_stock',stock_quantity:24,verified_at:'2026-10-14T00:00:00Z'}],
 contacts:[{status:'closed'}]
}
const at=Date.parse('2026-10-15T12:00:00Z')
const copy=v=>JSON.parse(JSON.stringify(v))
const get=(o,id)=>o.items.find(x=>x.id===id)

test('even complete planner and internal evidence never approve commerce, payments or legal compliance',()=>{
 const result=evaluateReleaseGate(input,at)
 for(const key of ['business','supplier','costs','inventory','safety','shipping','support','email'])
  assert.equal(get(result,key).state,'recorded',key)
 assert.equal(result.launchApproved,false)
 assert.equal(result.paymentsEnabledByReport,false)
 assert.equal(get(result,'withdrawal').state,'manual')
 assert.equal(get(result,'privacy').state,'manual')
 assert.equal(get(result,'seller-published').state,'manual')
 assert.equal(get(result,'payment-approval').state,'manual')
})
test('no data means no automatic pass for supplier or products',()=>{
 const r=evaluateReleaseGate({},at)
 for(const key of ['business','supplier','costs','inventory','shipping','safety'])
  assert.equal(get(r,key).state,'review',key)
 assert.equal(r.eligibleProducts,0)
 assert.equal(r.launchApproved,false)
})
test('cost evidence requires source, finite fees, valid FX and delivery range',()=>{
 for(const edit of [
  {quote_reference:null},{fx_to_sek:0},{unit_cost:null},{payment_fee_pct:null},
  {shipping_per_order:NaN},{delivery_min_days:12,delivery_max_days:4},
  {status:'researching'}
 ]){
  const data=copy(input)
  data.quotes[0]={...data.quotes[0],...edit}
  assert.equal(get(evaluateReleaseGate(data,at),'costs').state,'review',JSON.stringify(edit))
 }
})
test('stale, unverified, unmapped, zero-quantity and out-of-stock rows never pass inventory evidence',()=>{
 for(const edit of [
  {verified_at:null},{verified_at:'2026-07-10T00:00:00Z'},
  {product_id:null},{stock_quantity:0},{stock_status:'out_of_stock'},
  {verified_at:'2026-11-15T00:00:00Z'},{supplier_lead_id:'other'}
 ]){
  const data=copy(input);data.catalog[0]={...data.catalog[0],...edit}
  assert.equal(get(evaluateReleaseGate(data,at),'inventory').state,'review',JSON.stringify(edit))
 }
})
test('supplier agreement is required for shipping/cost/inventory evidence',()=>{
 const data=copy(input);data.leads[0].status='contacted'
 const r=evaluateReleaseGate(data,at)
 for(const key of ['supplier','costs','inventory'])assert.equal(get(r,key).state,'review')
})
test('multiple active products prevent all-pass status when one is undocumented',()=>{
 const data=copy(input);data.products.push({id:'p2',active:true,supplier_sku:'P2'})
 const r=evaluateReleaseGate(data,at)
 assert.equal(r.eligibleProducts,1)
 assert.equal(r.activeProducts,2)
 assert.equal(get(r,'inventory').state,'review')
})
test('support status is observational, not evidence of a delivered customer response',()=>{
 const data=copy(input);data.contacts=[{status:'new'},{status:'open'},{status:'closed'}]
 const result=evaluateReleaseGate(data,at)
 assert.equal(result.openCases,2)
 assert.equal(get(result,'support').state,'review')
 assert.equal(get(result,'contact-e2e').state,'manual')
})
test('readiness evaluator does not mutate source data or leak customer information',()=>{
 const x=copy(input);const before=JSON.stringify(x)
 x.contacts=[{id:'1',status:'open',name:'not-for-export',email:'private@example.com',message:'private'}]
 const r=evaluateReleaseGate(x,at)
 assert.equal(JSON.stringify(x).includes('private@example.com'),true)
 assert.equal(JSON.stringify(r).includes('private@example.com'),false)
 assert.equal(JSON.stringify(r).includes('not-for-export'),false)
 assert.equal(r.launchApproved,false)
 assert.deepEqual(input,JSON.parse(before))
})
test('manual checklist is explicit, unique and never a proxy for checkout approval',()=>{
 const ids=RELEASE_REVIEW_ITEMS.map(x=>x.id)
 assert.equal(new Set(ids).size,ids.length)
 assert.ok(ids.includes('withdrawal')&&ids.includes('identity')&&ids.includes('service'))
})
test('private UI uses verified role and limited projections, not checkout write methods',()=>{
 const source=readFileSync(new URL('../pages/admin/release-gate.vue',import.meta.url),'utf8')
 assert.match(source,/auth\.getUser\(\)/)
 assert.match(source,/from\('admins'\)/)
 assert.match(source,/from\('contact_messages'\)\.select\('id,status'\)/)
 assert.doesNotMatch(source,/contact_messages'\)\.select\('\*'|\.insert\(|\.update\(|\.delete\(|\/api\/checkout|syncBrevoContact/)
 assert.match(source,/paymentsEnabled:false/)
 assert.match(source,/launchApproved:false/)
})

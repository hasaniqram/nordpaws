import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mayFulfill, validateFulfillmentTransition, createFulfillmentPatch, fulfillmentSummary } from '../server/utils/fulfillmentPolicy.mjs'

const paid = {
  id:'real', order_number:'NR-123', payment_status:'paid', payment_provider:'mollie',
  fulfillment_status:'unfulfilled', supplier_ordered_at:null, processing_at:null, shipped_at:null, delivered_at:null
}
const refs={supplierOrderReference:'PO-123',carrier:'PostNord',trackingNumber:'PKG-123'}
test('only paid non-sandbox Mollie orders are eligible', () => {
  assert.equal(mayFulfill(paid), true)
  for(const order of [
    {...paid,payment_status:'unpaid'}, {...paid,payment_provider:'stripe_test'},
    {...paid,payment_provider:'stripe'}, {...paid,payment_provider:null},
    {...paid,order_number:'NR-TEST-123'}, {...paid,fulfillment_status:'refunded'},
    {...paid,fulfillment_status:'cancelled'}, null
  ]) assert.equal(mayFulfill(order),false)
})
test('blocks sending unpaid or sandbox orders to suppliers', () => {
  for(const o of [
    {...paid,payment_status:'unpaid'}, {...paid,payment_provider:'stripe_test'},
    {...paid,order_number:'NR-TEST-SAMPLE'}
  ]) assert.equal(validateFulfillmentTransition(o,'supplier_ordered',refs).ok,false)
})
test('fulfillment steps cannot skip forward or reverse, and do not set refunded/cancelled', () => {
  assert.equal(validateFulfillmentTransition(paid,'shipped',refs).ok,false)
  assert.equal(validateFulfillmentTransition(paid,'unfulfilled',refs).ok,false)
  assert.equal(validateFulfillmentTransition(paid,'refunded',refs).ok,false)
  assert.equal(validateFulfillmentTransition(paid,'cancelled',refs).ok,false)
  assert.equal(validateFulfillmentTransition({...paid,fulfillment_status:'shipped',shipped_at:'2026-10-15'},'processing',refs).ok,false)
  assert.equal(validateFulfillmentTransition(paid,'supplier_ordered',refs).ok,true)
})
test('supplier order references required, plus tracking evidence before shipment', () => {
  assert.equal(validateFulfillmentTransition(paid,'supplier_ordered',{...refs,supplierOrderReference:''}).ok,false)
  assert.equal(validateFulfillmentTransition({...paid,fulfillment_status:'processing'},'shipped',{...refs,carrier:''}).ok,false)
  assert.equal(validateFulfillmentTransition({...paid,fulfillment_status:'processing'},'shipped',{...refs,trackingNumber:''}).ok,false)
  assert.equal(validateFulfillmentTransition({...paid,fulfillment_status:'shipped'},'delivered',refs).ok,false)
  assert.equal(validateFulfillmentTransition({...paid,fulfillment_status:'shipped',shipped_at:'2026-10-15'},'delivered',refs).ok,true)
})
test('patch contains only approved operational fields, no financial mutations', () => {
  const patch=createFulfillmentPatch(paid,'supplier_ordered',refs,'2026-10-15T11:00:00Z')
  assert.equal(patch.supplier_order_reference,'PO-123')
  assert.equal(patch.supplier_status,'ordered')
  assert.equal(patch.supplier_ordered_at,'2026-10-15T11:00:00Z')
  assert.equal('payment_status' in patch,false)
  assert.equal('amount_total' in patch,false)
  assert.equal('provider_payment_id' in patch,false)
  const shipped=createFulfillmentPatch({...paid,fulfillment_status:'processing'},'shipped',refs,'2026-10-15T11:00:00Z')
  assert.equal(shipped.shipped_at,'2026-10-15T11:00:00Z')
})
test('overview excludes unpaid and sandbox records from actionable KPIs',()=>{
 const metrics=fulfillmentSummary([paid,{...paid,id:'test',payment_provider:'stripe_test'}, {...paid,id:'unpaid',payment_status:'unpaid'}, {...paid,id:'shipped',fulfillment_status:'shipped'}])
 assert.deepEqual(metrics,{paidOrders:2,waitingSupplier:1,inProgress:0,shipped:1,delivered:0,excluded:2})
})

// Pure, testable safeguards for admin fulfillment transitions.
// All payment/fulfillment state is re-read by the server from Supabase.
export const FULFILLMENT_STEPS = ['unfulfilled','supplier_ordered','processing','shipped','delivered']
const STEP = new Map(FULFILLMENT_STEPS.map((v,i)=>[v,i]))

export function mayFulfill(order) {
  return !!order && order.payment_status === 'paid'
    && order.payment_provider === 'mollie'
    && !String(order.order_number || '').startsWith('NR-TEST-')
    && !['refunded','cancelled'].includes(order.fulfillment_status)
}

export function validateFulfillmentTransition(order, target, fields = {}) {
  if (!mayFulfill(order)) return {ok:false,reason:'Only paid, non-sandbox orders may enter fulfillment.'}
  const current=order.fulfillment_status || 'unfulfilled'
  const position=STEP.get(current)
  const next=STEP.get(target)
  if(position===undefined || next===undefined) return {ok:false,reason:'Unsupported fulfillment state.'}
  if(next!==position+1) return {ok:false,reason:'Only the next fulfillment stage may be recorded.'}
  const ref=String(fields.supplierOrderReference||'').trim()
  const carrier=String(fields.carrier||'').trim()
  const tracking=String(fields.trackingNumber||'').trim()
  if(ref.length>160 || carrier.length>120 || tracking.length>160)
    return {ok:false,reason:'One of the reference fields is too long.'}
  if(next>=1 && !ref) return {ok:false,reason:'Supplier order reference is required.'}
  if(next>=3 && (!carrier || !tracking)) return {ok:false,reason:'Carrier and tracking number are required before shipping.'}
  if(next>=4 && !order.shipped_at)
    return {ok:false,reason:'The order must be shipped before marking it delivered.'}
  return {ok:true,reason:''}
}

export function createFulfillmentPatch(order,target,fields,now) {
  const check=validateFulfillmentTransition(order,target,fields)
  if(!check.ok) throw new Error(check.reason)
  const patch={
    fulfillment_status:target,
    supplier_order_reference:fields.supplierOrderReference.trim(),
    carrier:fields.carrier?.trim()||null,
    tracking_number:fields.trackingNumber?.trim()||null,
    updated_at:now
  }
  const statuses={unfulfilled:'pending',supplier_ordered:'ordered',processing:'accepted',shipped:'shipped',delivered:'delivered'}
  patch.supplier_status=statuses[target]
  if(target==='supplier_ordered') patch.supplier_ordered_at=order.supplier_ordered_at||now
  if(target==='processing') patch.processing_at=order.processing_at||now
  if(target==='shipped') patch.shipped_at=order.shipped_at||now
  if(target==='delivered') patch.delivered_at=order.delivered_at||now
  return patch
}

export function fulfillmentSummary(orders) {
  const paid=orders.filter(mayFulfill)
  return {
    paidOrders:paid.length,
    waitingSupplier:paid.filter(o=>(o.fulfillment_status||'unfulfilled')==='unfulfilled').length,
    inProgress:paid.filter(o=>['supplier_ordered','processing'].includes(o.fulfillment_status)).length,
    shipped:paid.filter(o=>o.fulfillment_status==='shipped').length,
    delivered:paid.filter(o=>o.fulfillment_status==='delivered').length,
    excluded:orders.length-paid.length
  }
}

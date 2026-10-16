// Pure sandbox transition policy. No orders, carriers, refunds or payments are mutated.
const transitions=Object.freeze({
 unfulfilled:['supplier_ordered'],
 supplier_ordered:['processing'],
 processing:['shipped'],
 shipped:['delivered'],
 delivered:[]
})
export function evaluateFulfillmentTransition(order,target){
 const errors=[]
 if(!order||typeof order!=='object')errors.push('Order is required')
 if(!Object.hasOwn(transitions,target)&&target!=='cancelled')errors.push('Unsupported fulfillment status')
 if(order){
  const current=order.fulfillment_status
  if(!Object.hasOwn(transitions,current))errors.push('Unknown current fulfillment status')
  else if(target==='cancelled'){
   if(current==='delivered'||order.payment_status==='refunded')errors.push('Delivered or refunded orders require separate exception handling')
  }else if(!transitions[current].includes(target))errors.push('Invalid fulfillment progression')
  if(order.payment_status!=='paid')errors.push('Fulfillment requires confirmed payment')
  if(!order.payment_provider||order.payment_provider==='none')errors.push('Payment provider is not confirmed')
  if(target==='shipped'&&(!order.tracking_number||!order.carrier))errors.push('Carrier and tracking reference required')
 }
 return {allowed:errors.length===0,errors}
}

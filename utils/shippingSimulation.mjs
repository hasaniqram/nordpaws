// All examples and transitions are local simulation. No fulfillment or payment APIs.
export const SIMULATION_STEPS=['unfulfilled','supplier_ordered','processing','shipped','delivered']
export function simulateStep(order,next){
 const errors=[]
 if(!SIMULATION_STEPS.includes(next))errors.push('Invalid stage')
 else if(SIMULATION_STEPS.indexOf(next)!==SIMULATION_STEPS.indexOf(order.stage)+1)errors.push('Stages must advance one step at a time')
 if(next==='shipped'&&(!order.carrier?.trim()||!order.tracking?.trim()))errors.push('Tracking reference and carrier required')
 if(errors.length)return {ok:false,errors,order}
 return {ok:true,errors:[],order:{...order,stage:next,events:[...order.events,{status:next,at:new Date().toISOString()}]}}
}
export function classifyDeliveryIssue(kind){
 const options={delay:'Carrier delay — investigate',lost:'Missing parcel — investigate',damaged:'Damaged in transit — investigate',return:'Return requested — review policy'}
 return options[kind]||'Unknown exception'
}
export function evaluateRefundRequest({reason,amount,orderTotal}){
 const errors=[]
 if(!['return','damaged','lost','other'].includes(reason))errors.push('Choose an allowed reason')
 if(!Number.isFinite(amount)||amount<=0||!Number.isFinite(orderTotal)||amount>orderTotal)errors.push('Refund request must be above zero and no more than the test order amount')
 return {valid:errors.length===0,errors}
}

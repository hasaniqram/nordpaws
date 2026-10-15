export function checkOperationalReadiness(product,review,catalogItems,now=Date.now()){
 const blockers=[]
 const active=product.active===true
 if(!review)blockers.push('No private research review')
 else {
  if(review.decision!=='research_approved')blockers.push('Research evidence not approved')
  const due=review.review_due_on
  if(!due)blockers.push('Next review date missing')
  else if(!/^\d{4}-\d{2}-\d{2}$/.test(due)||Date.parse(due+'T23:59:59Z')<now)blockers.push('Research review overdue or invalid')
 }
 const confirmed=(catalogItems||[]).some(item=>{
  const timestamp=Date.parse(item.verified_at||'')
  return ['in_stock','low_stock'].includes(item.stock_status)&&Number.isFinite(timestamp)&&timestamp<=now&&now-timestamp<=30*86400000
 })
 if(!confirmed)blockers.push('No verified available stock within 30 days')
 if(!Number.isFinite(product.price)||product.price<=0)blockers.push('Missing valid selling price')
 return {active,blockers,operationallyReady:blockers.length===0,publiclyActiveWithGaps:active&&blockers.length>0}
}

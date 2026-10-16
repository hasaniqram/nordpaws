// Fail-closed release review. Browser input is never sufficient to authorize launch.
export const RELEASE_GATES=Object.freeze([
 {id:'security',priority:'P0',label:'Administrator, API and RLS access tests'},
 {id:'products',priority:'P0',label:'Product safety, GPSR and supplier evidence'},
 {id:'payments',priority:'P0',label:'Payments, webhooks and refunds tested safely'},
 {id:'customer',priority:'P0',label:'Customer journeys and support obligations'},
 {id:'shipping',priority:'P0',label:'Carrier, delivery and returns evidence'},
 {id:'legal',priority:'P0',label:'Legal and privacy review'},
 {id:'accessibility',priority:'P1',label:'Accessibility and mobile browser evidence'},
 {id:'performance',priority:'P1',label:'Measured Core Web Vitals'},
 {id:'marketing',priority:'P1',label:'Search, consent and sender verification'}
])
export function assessReleaseEvidence(evidence={}){
 const outstanding=RELEASE_GATES.filter(g=>evidence[g.id]?.status!=='verified'||!String(evidence[g.id]?.reference||'').trim())
 return {decision:'NOT APPROVED',outstanding:outstanding.map(x=>x.id),evidenceComplete:outstanding.length===0,requiresIndependentReleaseAuthorization:true}
}

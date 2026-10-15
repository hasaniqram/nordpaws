// Norrli Pets: read-only release risk review.
// A recorded planner status is not a signed contract, verified legal compliance,
// successful customer-service E2E test, or permission to start taking payments.
const completed=(tasks,code)=>tasks.find(t=>t.code===code)?.status==='ready'
const exists=value=>value!==null&&value!==undefined&&String(value).trim()!==''
const note=(id,label,ok,detail,link)=>({id,label,state:ok?'recorded':'review',detail,link})
const review=(id,label,detail,link)=>({id,label,state:'manual',detail,link})

export function evaluateReleaseGate(input={},now=Date.now()){
 const tasks=input.tasks||[],leads=input.leads||[],quotes=input.quotes||[]
 const products=input.products||[],images=input.images||[],catalog=input.catalog||[],contacts=input.contacts||[]
 const time=Number.isFinite(Number(now))?Number(now):Date.now()
 const active=products.filter(p=>p.active===true)
 const contracted=leads.filter(l=>l.status==='contracted'&&l.shipping_to_sweden===true)
 const contractedIds=new Set(contracted.map(x=>x.id))
 const quoted=quotes.filter(q=>contractedIds.has(q.supplier_lead_id)&&q.status==='supplier_confirmed'
  &&exists(q.quote_reference||q.source_url)
  &&[q.unit_cost,q.shipping_per_order,q.fx_to_sek,q.payment_fee_pct,q.payment_fixed_sek,q.returns_reserve_pct]
    .every(x=>x!==null&&x!==undefined&&Number.isFinite(Number(x))&&Number(x)>=0)
  &&Number(q.fx_to_sek)>0
  &&Number.isInteger(Number(q.delivery_min_days))&&Number.isInteger(Number(q.delivery_max_days))
  &&q.delivery_min_days!=null&&q.delivery_max_days!=null
  &&Number(q.delivery_min_days)<=Number(q.delivery_max_days))
 const quoteKeys=new Set(quoted.map(q=>[q.product_id,q.supplier_lead_id].join('::')))
 const verifiedStock=catalog.filter(c=>c.product_id
  &&exists(c.supplier_sku)
  &&['in_stock','low_stock'].includes(c.stock_status)
  &&c.stock_quantity!=null&&Number(c.stock_quantity)>0
  &&exists(c.verified_at)&&Number.isFinite(Date.parse(c.verified_at))
  &&Date.parse(c.verified_at)<=time
  &&time-Date.parse(c.verified_at)<=30*86400000
  &&contractedIds.has(c.supplier_lead_id))
 const realImages=new Set(images.filter(x=>x.is_concept===false).map(x=>x.product_id))
 const productEligible=p=>exists(p.supplier_id)&&exists(p.supplier_sku)&&exists(p.material)
  &&realImages.has(p.id)
  &&quoteKeys.has([p.id,p.supplier_id].join('::'))
  &&verifiedStock.some(c=>c.product_id===p.id&&c.supplier_lead_id===p.supplier_id
    &&String(c.supplier_sku).trim().toLocaleUpperCase('en-US')===
      String(p.supplier_sku).trim().toLocaleUpperCase('en-US'))
 const readyProducts=active.filter(productEligible)
 const openCases=contacts.filter(c=>c.status==='new'||c.status==='open').length
 const items=[
  note('business','Säljaruppgifter och företagsadministration',
   completed(tasks,'company_registration')&&completed(tasks,'vat'),
   'Kontrollera faktisk avtalspart, adress, kontaktvägar samt registrering och skattehantering före försäljning. Plannerstatus är inte dokumentbevis.',
   '/admin/launch'),
  note('supplier','Leverantörsavtal och Sverigeleverans',contracted.length>0,
   contracted.length+' leverantör(er) markerade som avtalade och Sverigelevererande. Bekräfta avtal och faktisk sändningsväg utanför systemet.',
   '/admin/launch'),
  note('costs','Spårbara kostnader och fraktunderlag',quoted.length>0,
   quoted.length+' offerter med intern status, källa, kostnadsfält och leveransintervall. Kontrollera originaloffert och avgifter manuellt.',
   '/admin/quotes'),
  note('inventory','Kontrollerat lanseringssortiment',active.length>0&&readyProducts.length===active.length,
   readyProducts.length+' av '+active.length+' aktiva produkter har matchande avtalad leverantör, SKU, offert, dokumenterade bilder/material och aktuell positiv lagerbekräftelse. Ingen automatisk lagergaranti.',
   '/admin/catalog'),
  note('safety','Dokumenterad produktsäkerhet',completed(tasks,'safety'),
   'Granska varje produkt mot tillämpliga säkerhets- och informationskrav; att markera checklistan räcker inte som extern kontroll.',
   '/admin/launch'),
  note('shipping','Leverans- och returprocess',completed(tasks,'shipping'),
   'Fastställ fraktpris, leveranstid, ansvar, returadress och reklamationsrutiner. Allt saknar ännu komplett offentlig verifiering.',
   '/admin/launch'),
  note('support','Kundservice: arbetskö',openCases===0,
   openCases+' av '+contacts.length+' hämtade meddelanden är markerade nya eller pågående. Detta bevisar inte att e-post- eller formulärflödet fungerar end-to-end.',
   '/admin/support'),
  note('email','Kundmeddelanden: arbetsstatus',completed(tasks,'email'),
   'Planeringsstatus från checklistan. Riktiga transaktionsutskick och bekräftelser är inte aktiverade genom denna granskning.',
   '/admin/launch'),
  review('seller-published','Verifiera och publicera säljarens juridiska identitet',
   'Kräver kontroll av juridiskt namn, adress, telefon, e-post och relevanta registreringsuppgifter. Använd aldrig påhittade företagsuppgifter.',
   '/legal/terms'),
  review('privacy','Färdigställ GDPR-information och rutiner',
   'Integritetspolicyn anger fortfarande att uppgifter om personuppgiftsansvarig, rättslig grund, lagring och biträden behöver slutföras.',
   '/legal/privacy'),
  review('withdrawal','Bygg och verifiera online-ångerfunktion',
   'E-handelsreglerna från juni 2026 kräver en lättillgänglig ångerfunktion med automatiskt mottagningsbevis när ångerrätt finns vid onlineavtal. Ingen sådan funktion aktiveras här.',
   '/legal/returns'),
  review('contact-e2e','Testa verklig kontaktformulärsmottagning säkert',
   'Utför separat godkänt test med syntetisk data: formulär, rate-limit, databasregistrering, adminbehörighet och ändring av intern status. Inga testärenden skickas från denna sida.',
   '/admin/support'),
  review('shipping-contract','Granska verkliga frakt- och returavtal',
   'Säkerställ transporter, leveranstider, returfrakt, moms/tull och konsumentinformation innan de publiceras.',
   '/legal/shipping'),
  review('payment-approval','Separat beslut om betalningar och kommersiell lansering',
   'Checkout och betalningar förblir avstängda oavsett planeringsstatus. Detta är inte en knapp för lansering.',
   '/admin/verify')
 ]
 return {
  items,
  total:items.length,
  recorded:items.filter(x=>x.state==='recorded').length,
  needsReview:items.filter(x=>x.state==='review').length,
  requiresManual:items.filter(x=>x.state==='manual').length,
  suppliers:contracted.length,
  eligibleProducts:readyProducts.length,
  activeProducts:active.length,
  openCases,
  launchApproved:false,
  paymentsEnabledByReport:false,
  warning:'Detta är en intern risköversikt. Registrerade uppgifter och kryssrutor innebär inte juridiskt godkännande eller rätt att börja ta betalt.'
 }
}

export const RELEASE_REVIEW_ITEMS=Object.freeze([
 {id:'identity',title:'Säljaridentitet granskad',description:'Juridiskt namn, kontaktvägar och företags-/skatteuppgifter kontrollerade',link:'/legal/terms'},
 {id:'gdpr',title:'GDPR-information verifierad',description:'Ansvarig, rättsliga grunder, lagring, biträden och eventuella överföringar dokumenterade',link:'/legal/privacy'},
 {id:'withdrawal',title:'Digital ångerfunktion testad',description:'Funktion och automatiskt mottagningsbevis verifierade med godkända testdata',link:'/legal/returns'},
 {id:'delivery',title:'Leverantörs- och returavtal verifierade',description:'Reella fraktpriser, ansvar, returadress och leveranstider styrkta',link:'/legal/shipping'},
 {id:'service',title:'Kundservicens testflöde genomfört',description:'Formulär, spamgränser, RLS, admininkorg och ärendehantering testade separat',link:'/admin/support'},
 {id:'security',title:'Åtkomst och kontodata testade',description:'Behörighetsgränser, kundkonton och orderisolering verifierade med testkonton',link:'/admin/verify'}
])

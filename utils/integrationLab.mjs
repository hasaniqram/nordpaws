// Phase 6: pure integration previews. These functions NEVER write supplier or
// storefront records. Supplier CSV is validated separately by supplierCatalogCsv.ts.
const statusLabels = new Set(['unknown','in_stock','low_stock','out_of_stock','backorder','discontinued'])
export const canonicalSku = value => String(value ?? '').trim().toLocaleUpperCase('en-US')
const equivalent=(a,b)=>a==null&&b==null||String(a)===String(b)
const sameNumber=(a,b)=>a==null&&b==null||a!=null&&b!=null&&Number(a)===Number(b)

/**
 * Compare parsed supplier CSV rows with one supplier's *current* private catalog.
 * It returns a review queue only; never mutates the source arrays.
 * Blank CSV fields keep existing values (the behavior of the legacy importer).
 */
export function compareSupplierFeed(rows, catalog, supplierId, products=[]) {
  if(!supplierId || typeof supplierId!=='string')throw new Error('Choose a supplier before previewing updates.')
  if(!Array.isArray(rows) || rows.length>100)throw new Error('Up to 100 validated rows are accepted per review.')
  const scoped=(catalog||[]).filter(item=>item.supplier_lead_id===supplierId)
  const index=new Map()
  const collisions=new Set()
  for(const item of scoped){
    const sku=canonicalSku(item.supplier_sku)
    if(!sku)continue
    if(index.has(sku))collisions.add(sku)
    else index.set(sku,item)
  }
  const productIndex=new Map()
  for(const product of products||[]){
    const sku=canonicalSku(product.supplier_sku)
    if(!sku)continue
    const matches=productIndex.get(sku)||[]
    matches.push(product)
    productIndex.set(sku,matches)
  }
  const seen=new Set()
  const changes=rows.map((row,idx)=>{
    const sku=canonicalSku(row.sku)
    if(!sku || sku.length>120)throw new Error('Row '+(idx+2)+': invalid supplier SKU.')
    if(seen.has(sku))throw new Error('Duplicate supplier SKU in import: '+sku)
    seen.add(sku)
    const prior=index.get(sku)||null
    const proposed={
      title:row.title,
      stock_status:row.stock_status??prior?.stock_status??'unknown',
      stock_quantity:row.stock_quantity??prior?.stock_quantity??null,
      unit_cost:row.unit_cost??prior?.unit_cost??null,
      currency:row.currency??prior?.currency??'SEK',
      lead_time_days:row.lead_time_days??prior?.lead_time_days??null,
      source_url:row.source_url??prior?.source_url??null
    }
    if(!statusLabels.has(proposed.stock_status))throw new Error('Row '+(idx+2)+': invalid stock status.')
    const changedFields=!prior?Object.keys(proposed):Object.keys(proposed).filter(key=>
      ['unit_cost','stock_quantity','lead_time_days'].includes(key)
        ? !sameNumber(proposed[key],prior[key])
        : !equivalent(proposed[key],prior[key]))
    const stockOrCostChanged=!!prior&&['stock_status','stock_quantity','unit_cost','currency'].some(key=>changedFields.includes(key))
    const matches=productIndex.get(sku)||[]
    const mapping=prior?.product_id||null
    const warnings=[]
    if(collisions.has(sku))warnings.push('Existing supplier catalog has multiple case-insensitive matching SKUs.')
    if(matches.length>1 && !mapping)warnings.push('Several storefront products share this SKU. Manual review required.')
    if(!prior&&!mapping)warnings.push('New supplier SKU. Verify product mapping manually.')
    if(stockOrCostChanged)warnings.push('Stock or cost changed; previous stock verification cannot be trusted.')
    if(proposed.stock_status==='out_of_stock'||proposed.stock_status==='discontinued')warnings.push('Supplier reports unavailable stock.')
    if(proposed.unit_cost==null)warnings.push('Supplier cost missing.')
    if(proposed.stock_quantity==null)warnings.push('Stock quantity not documented.')
    return {
      sku:row.sku,title:row.title,
      action:prior?(changedFields.length?'review_change':'unchanged'):'review_new',
      changedFields,prior:prior?{
        supplier_sku:prior.supplier_sku,title:prior.title,product_id:prior.product_id,
        stock_status:prior.stock_status,stock_quantity:prior.stock_quantity,
        unit_cost:prior.unit_cost,currency:prior.currency,verified_at:prior.verified_at
      }:null,
      proposed,productId:mapping,
      suggestedProduct:!mapping&&matches.length===1?{id:matches[0].id,name:matches[0].name}:null,
      requiresVerification:!prior||stockOrCostChanged,
      warnings
    }
  })
  return {
    rows:changes,
    summary:{
      total:changes.length,
      new:changes.filter(r=>r.action==='review_new').length,
      changed:changes.filter(r=>r.action==='review_change').length,
      unchanged:changes.filter(r=>r.action==='unchanged').length,
      needsVerification:changes.filter(r=>r.requiresVerification).length,
      warnings:changes.reduce((n,r)=>n+r.warnings.length,0)
    },
    writeEnabled:false
  }
}

export function stockSyncAlerts(catalog,now=Date.now()) {
  return (catalog||[]).map(item=>{
    const verified=Date.parse(item.verified_at||'')
    const age=Number.isFinite(verified)?Math.max(0,Math.floor((now-verified)/86400000)):null
    const alerts=[]
    if(age==null)alerts.push('Never verified')
    else if(age>30)alerts.push('Verification older than 30 days')
    if(['out_of_stock','discontinued'].includes(item.stock_status))alerts.push('Unavailable at supplier')
    if(item.stock_quantity==null)alerts.push('No confirmed quantity')
    if(!item.product_id)alerts.push('Not mapped to a Norrli product')
    return {id:item.id,sku:item.supplier_sku,title:item.title,verifiedDaysAgo:age,alerts}
  }).filter(item=>item.alerts.length>0)
}

export function shippingEvidence(quote,supplier,priceOre) {
  const supplierShipping=Number(quote?.shipping_per_order)
  const fx=Number(quote?.fx_to_sek)
  const complete=quote?.shipping_per_order!=null && quote?.unit_cost!=null &&
    quote?.payment_fee_pct!=null && quote?.payment_fixed_sek!=null &&
    quote?.returns_reserve_pct!=null && Number.isFinite(fx)&&fx>0 &&
    Number.isFinite(supplierShipping)&&supplierShipping>=0 &&
    Number(priceOre)>0
  const reasons=[]
  if(supplier?.shipping_to_sweden!==true)reasons.push('Sweden shipping not confirmed.')
  if(supplier?.status!=='contracted')reasons.push('Supplier agreement not recorded as contracted.')
  if(quote?.status!=='supplier_confirmed')reasons.push('Quotation not marked confirmed in the planner.')
  if(!quote?.quote_reference&&!quote?.source_url)reasons.push('Quotation reference or source is missing.')
  if(quote?.delivery_min_days==null||quote?.delivery_max_days==null)reasons.push('Delivery range not entered.')
  if(!complete)reasons.push('One or more cost, FX, payment or selling-price inputs missing.')
  return {
    estimateSEK:quote?.shipping_per_order!=null&&Number.isFinite(fx)&&fx>0&&Number.isFinite(supplierShipping)
      ? Math.round(supplierShipping*fx*100)/100:null,
    deliveryRange:quote?.delivery_min_days!=null&&quote?.delivery_max_days!=null
      ? String(quote.delivery_min_days)+'–'+String(quote.delivery_max_days)+' days (supplier estimate)':null,
    reviewReady:reasons.length===0,
    reasons,customerShippingApproved:false
  }
}

// Templates are returned as plain text to the browser. No dispatch API exists.
// Example content is unambiguously fictional; no contact details are collected.
export function localEmailPreview(kind='confirmation') {
  const sample={name:'Demo Customer',number:'DEMO-NO-ORDER',item:'Demo pet accessory',tracking:'DEMO-NOT-TRACKABLE'}
  const templates={
    confirmation:{
      subject:'[DEMO – NOT SENT] Norrli Pets order confirmation',
      body:`DEMO EMAIL — NOT SENT\n\nHej ${sample.name},\n\nThis is how an order confirmation could look.\nOrder: ${sample.number}\nItem: ${sample.item}\n\nShipping price and delivery dates would be confirmed before a real order.\n\nNorrli Pets\n\nThis message is a preview only.`
    },
    dispatch:{
      subject:'[DEMO – NOT SENT] Your Norrli Pets dispatch update',
      body:`DEMO EMAIL — NOT SENT\n\nHej ${sample.name},\n\nA real dispatch notice would be sent only after carrier confirmation.\nOrder: ${sample.number}\nDemo tracking placeholder: ${sample.tracking}\n\nThis code is not a real tracking number.\n\nNorrli Pets`
    },
    delivery:{
      subject:'[DEMO – NOT SENT] Your Norrli Pets delivery update',
      body:`DEMO EMAIL — NOT SENT\n\nHej ${sample.name},\n\nA delivery update would depend on verified carrier events.\nOrder: ${sample.number}\n\nNo delivery has taken place; this is a UI preview.\n\nNorrli Pets`
    }
  }
  if(!Object.hasOwn(templates,kind))throw new Error('Unsupported preview template.')
  return {to:'demo@example.invalid',...templates[kind],sent:false,source:'local-only'}
}

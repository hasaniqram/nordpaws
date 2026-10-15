// Phase 5: evidence-based prelaunch health, not approval or legal advice.
// Read-only evaluation of existing records. Never turn a recommendation into a payment switch.
export function evaluateLaunchReadiness(input = {}) {
  const tasks = input.tasks || [], leads = input.leads || [], quotes = input.quotes || []
  const products = input.products || [], images = input.images || [], stock = input.stock || [], orders = input.orders || []
  const flags = []
  const taskBlocked = tasks.filter(t => t.priority === 1 && t.status !== 'ready')
  flags.push({ id:'critical-tasks',label:'Essential launch checklist',passed:tasks.length>0&&taskBlocked.length===0,
    detail:tasks.length===0?'No launch checklist data loaded':taskBlocked.length+' essential requirements still unverified' })
  const supplierIds=new Set(leads.filter(s=>s.shipping_to_sweden===true && s.status==='contracted').map(s=>s.id))
  flags.push({id:'suppliers',label:'Documented supplier agreement and Swedish delivery',passed:supplierIds.size>0,
    detail:supplierIds.size+' supplier records meet both internal criteria; external agreements still need human review'})
  const quoteIds=new Set(quotes.filter(q=>q.status==='supplier_confirmed' && supplierIds.has(q.supplier_lead_id)
    && q.unit_cost!=null && q.shipping_per_order!=null && q.payment_fee_pct!=null
    && q.delivery_min_days!=null && q.delivery_max_days!=null).map(q=>q.product_id))
  flags.push({id:'quotes',label:'Cost and delivery evidence',passed:quoteIds.size>0,
    detail:quoteIds.size+' product(s) with recorded supplier-linked pricing evidence'})
  const realPhotos=new Set(images.filter(i=>i.is_concept===false).map(i=>i.product_id))
  const eligible=products.filter(p=>p.active)
  const incomplete=eligible.filter(p=>!quoteIds.has(p.id)||!realPhotos.has(p.id)||!p.material||
    p.stock_status==='unknown'||p.stock_status==='out_of_stock'||!p.supplier_sku)
  flags.push({id:'catalog',label:'Active product documentation',passed:eligible.length>0&&incomplete.length===0,
    detail:eligible.length===0?'No active catalog items':incomplete.length+' of '+eligible.length+' active products need checks'})
  const stale=stock.filter(x=>!x.verified_at||Number.isNaN(Date.parse(x.verified_at))||
    (Date.now()-Date.parse(x.verified_at))>30*864e5)
  flags.push({id:'inventory',label:'Supplier stock verification',passed:stock.length>0&&stale.length===0,
    detail:stock.length===0?'No supplier-stock evidence':stale.length+' unverified or older than 30 days'})
  const testOrders=orders.filter(o=>o.payment_provider==='stripe_test'||String(o.order_number||'').startsWith('NR-TEST-'))
  flags.push({id:'sandbox',label:'Test orders separated from dispatch',passed:orders.length===0||testOrders.every(o=>o.fulfillment_status==='unfulfilled'||!o.shipped_at),
    detail:testOrders.length+' test orders in the sampled history; review their fulfillment state'})
  return {checks:flags,passed:flags.filter(c=>c.passed).length,total:flags.length,
    ready:false, // Explicitly never claims commercial launch is approved.
    caution:'Preparation indicators only. Checkout remains disabled and requires separate commercial/legal approval.'}
}

export function previewFulfillment(order,target,fields={}) {
  const stages=['unfulfilled','supplier_ordered','processing','shipped','delivered']
  const errors=[]
  if(!order || order.payment_status!=='paid'||order.payment_provider!=='mollie'||
      String(order.order_number||'').startsWith('NR-TEST-'))
    errors.push('A paid, real Mollie order is required. Sandbox and unpaid orders cannot be fulfilled.')
  const current=order?.fulfillment_status||'unfulfilled'
  if(stages.indexOf(target)!==stages.indexOf(current)+1 || !stages.includes(target))
    errors.push('Only the immediate next fulfillment stage is allowed.')
  if(!String(fields.supplierOrderReference||'').trim())errors.push('Enter a genuine supplier reference.')
  if(['shipped','delivered'].includes(target)&&
     (!String(fields.carrier||'').trim()||!String(fields.trackingNumber||'').trim()))
    errors.push('Real carrier and tracking details are required.')
  if(target==='delivered'&&!order?.shipped_at)errors.push('A recorded shipment is required before delivery.')
  return {allowed:errors.length===0,errors,mutated:false}
}

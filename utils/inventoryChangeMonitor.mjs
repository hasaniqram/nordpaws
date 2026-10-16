export function detectInventoryChange(item,product,quote,now=Date.now()){
 const warnings=[]
 const verified=Date.parse(item.verified_at||'')
 if(!Number.isFinite(verified)||verified>now||now-verified>30*86400000)warnings.push('Stock evidence is older than 30 days or missing')
 if(!product)warnings.push('Supplier item has no linked storefront product')
 else {
  if(item.stock_status!==product.stock_status)warnings.push('Stock status differs from storefront')
  if(item.stock_quantity!=null&&product.stock_quantity!=null&&Number(item.stock_quantity)!==Number(product.stock_quantity))warnings.push('Stock quantity differs from storefront')
  if(!['in_stock','low_stock'].includes(item.stock_status))warnings.push('Supplier stock not currently available')
 }
 const cost=Number(item.unit_cost)
 const quoted=Number(quote?.unit_cost)
 const comparable=quote&&item.currency===quote.currency&&Number.isFinite(cost)&&Number.isFinite(quoted)&&quoted>0&&item.unit_cost!=null&&quote.unit_cost!=null
 const changePct=comparable?(cost/quoted-1)*100:null
 if(changePct!==null&&Math.abs(changePct)>=5)warnings.push('Supplier cost differs from quoted unit cost by at least 5%')
 if(quote&&item.currency!==quote.currency)warnings.push('Quote currency differs: FX conversion is required before cost comparison')
 const priceSek=product?Number(product.price)/100:null
 const unitSek=quote&&item.unit_cost!=null&&item.currency===quote.currency?cost*Number(quote.fx_to_sek):null
 const costRatio=priceSek!=null&&priceSek>0&&unitSek!=null&&Number.isFinite(unitSek)?unitSek/priceSek*100:null
 if(costRatio!==null&&costRatio>=65)warnings.push('Wholesale unit cost reaches 65% of retail price (before other costs)')
 return {warnings,changePct,costRatio,requiresReview:warnings.length>0}
}

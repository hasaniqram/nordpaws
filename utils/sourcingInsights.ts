import { calculateQuote, type QuoteResult, type SupplierQuote } from '~/utils/profitability'

export type LeadSnapshot = {
  id: string
  name: string
  status: string
  shipping_to_sweden: boolean | null
}
export type ProductSnapshot = {
  id: string
  name: string
  slug: string
  price: number
  active: boolean
  material: string | null
  supplier_sku: string | null
  supplier_product_url: string | null
}
export type InsightCheck = { label: string; points: number; passed: boolean }
export type QuoteInsight = {
  points: number
  possible: number
  evidenceLabel: string
  blockers: string[]
  checks: InsightCheck[]
  isDocumented: boolean
  result: QuoteResult
}

const entered = (v: number | null | undefined) =>
  v !== null && v !== undefined && Number.isFinite(Number(v)) && String(v).trim() !== ''

/**
 * Score = preparedness of evidence in the private research record.
 * NEVER an approval, product safety assessment, or promise of profitability.
 */
export function scoreQuote(
  quote: SupplierQuote, supplier: LeadSnapshot | undefined,
  product: ProductSnapshot | undefined, targetMargin = 25
): QuoteInsight {
  const unitPrice = (product?.price ?? 0) / 100
  const result = calculateQuote(quote, unitPrice, targetMargin)
  const documented = Boolean(quote.quote_reference?.trim() || quote.source_url?.trim())
  const checks: InsightCheck[] = [
    {label:'Essential pricing inputs completed',points:20,passed:result.complete},
    {label:'Supplier quote marked confirmed by admin',points:15,passed:quote.status==='supplier_confirmed'},
    {label:'Supplier shipping to Sweden recorded as confirmed',points:15,passed:supplier?.shipping_to_sweden===true},
    {label:'Quotation reference or source recorded',points:10,passed:documented},
    {label:'Delivery-time range entered',points:10,passed:entered(quote.delivery_min_days)&&entered(quote.delivery_max_days)},
    {label:'Supplier SKU recorded',points:10,passed:!!quote.supplier_sku?.trim()},
    {label:'Packaging, duty, marketing and overhead reviewed',points:10,
      passed:[quote.packaging_per_order,quote.extra_supplier_fee_per_order,quote.duty_per_order_sek,
        quote.other_cost_per_order_sek,quote.ad_cost_per_order_sek,quote.overhead_per_order_sek]
        .every(entered)},
    {label:'Minimum order quantity documented',points:5,passed:entered(quote.min_order_units)},
    {label:`Estimated margin reaches ${targetMargin}% target`,points:5,
      passed:result.complete&&(result.marginPct??-100)>=targetMargin}
  ]
  const blockers: string[] = []
  if (!result.complete) blockers.push(`${result.missing.length} essential cost or price fields missing`)
  if (supplier?.shipping_to_sweden !== true) blockers.push('Sweden delivery not confirmed')
  if (quote.status !== 'supplier_confirmed') blockers.push('No confirmed supplier quote recorded')
  if (!documented) blockers.push('No quote reference or evidence link')
  if (!quote.supplier_sku?.trim()) blockers.push('No supplier SKU')
  if (quote.min_order_units != null && quote.units_per_order < quote.min_order_units)
    blockers.push('Minimum order quantity exceeds modeled units')
  if (quote.status === 'rejected') blockers.push('Quote marked not suitable')
  if (result.complete && (result.profit??0)<0) blockers.push('Modeled contribution is negative')
  const points=checks.reduce((sum,c)=>sum+(c.passed?c.points:0),0)
  return {
    points, possible:100, isDocumented:documented, blockers, checks,
    evidenceLabel:quote.status==='supplier_confirmed'?'Supplier-confirmed (admin entry)':
      quote.status==='received'?'Received, unconfirmed':
      quote.status==='requested'?'Requested':
      quote.status==='rejected'?'Not suitable':'Draft estimate',
    result
  }
}

export function stressScenarios(
  quote:SupplierQuote, catalogPriceSek:number, targetMargin=25
) {
  const original=calculateQuote(quote,catalogPriceSek,targetMargin)
  const tests = [
    {
      id:'baseline', label:'Baseline', explanation:'Entered quote values',
      changed:quote
    },
    {
      id:'cost', label:'Product cost +15%', explanation:'Unit wholesale cost rises 15%',
      changed:{...quote, unit_cost:(quote.unit_cost ?? 0)*1.15}
    },
    {
      id:'shipping', label:'Delivery +40 SEK', explanation:'Extra delivery cost per customer order',
      changed:{...quote, other_cost_per_order_sek:(quote.other_cost_per_order_sek ?? 0)+40}
    },
    {
      id:'discount', label:'Selling price −10%', explanation:'Selling price falls 10%; buyer shipping unchanged',
      changed:{...quote, price_override_sek:
        (quote.price_override_sek ?? catalogPriceSek)*0.9}
    },
    {
      id:'returns', label:'Returns reserve +3 pts', explanation:'Higher returns provision',
      changed:{...quote, returns_reserve_pct:(quote.returns_reserve_pct ?? 0)+3}
    }
  ]
  return tests.map(s=>({
    id:s.id,label:s.label,explanation:s.explanation,
    result: original.complete ? calculateQuote(s.changed,catalogPriceSek,targetMargin) : original
  }))
}

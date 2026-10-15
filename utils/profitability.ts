/**
 * Norrli Pets scenario calculator. Planning illustration only — not tax advice.
 * All supplier-side monetary inputs are in quote currency unless suffixed _sek.
 * Selling prices, payment fees, overhead, VAT assumptions and output are SEK.
 * Supplier inputs should be entered exclusive of reclaimable input VAT (if any).
 */
export type QuoteStatus = 'draft' | 'requested' | 'received' | 'supplier_confirmed' | 'rejected'
export type QuoteCurrency = 'SEK' | 'EUR' | 'USD' | 'GBP' | 'DKK' | 'NOK'
export type SupplierQuote = {
  id: string
  supplier_lead_id: string
  product_id: string
  label: string
  status: QuoteStatus
  source_url: string | null
  quote_reference: string | null
  supplier_sku: string | null
  currency: QuoteCurrency
  fx_to_sek: number
  unit_cost: number | null
  shipping_per_order: number | null
  packaging_per_order: number | null
  extra_supplier_fee_per_order: number | null
  duty_per_order_sek: number | null
  other_cost_per_order_sek: number | null
  customer_shipping_sek: number
  price_override_sek: number | null
  units_per_order: number
  vat_assumption_pct: number
  payment_fee_pct: number | null
  payment_fixed_sek: number | null
  returns_reserve_pct: number | null
  ad_cost_per_order_sek: number | null
  overhead_per_order_sek: number | null
  min_order_units: number | null
  delivery_min_days: number | null
  delivery_max_days: number | null
  evidence_notes: string
  created_at: string
  updated_at: string
}
export type QuoteResult = {
  complete: boolean
  missing: string[]
  assumedZero: string[]
  grossRevenue: number
  revenueExVat: number
  vatIllustration: number
  productCost: number
  supplierShipping: number
  supplierHandling: number
  paymentFees: number
  returnReserve: number
  otherCosts: number
  totalCost: number
  profit: number | null
  profitPerUnit: number | null
  marginPct: number | null
  breakEvenUnitPrice: number | null
  targetUnitPrice: number | null
  quantity: number
}

const num = (value: number | null | undefined) => Number.isFinite(Number(value)) && value != null ? Number(value) : 0
const positive = (v: number | null | undefined) => v != null && String(v).trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0
const round = (n:number) => Math.round((n + Number.EPSILON) * 100) / 100

export function calculateQuote(quote: SupplierQuote, catalogUnitPriceSek: number, targetMarginPct = 25): QuoteResult {
  const missing: string[] = []
  const mustHave = [
    ['Unit wholesale cost', quote.unit_cost],
    ['Supplier shipping per order', quote.shipping_per_order],
    ['Payment fee percentage', quote.payment_fee_pct],
    ['Payment fee fixed amount', quote.payment_fixed_sek],
    ['Returns reserve percentage', quote.returns_reserve_pct]
  ] as const
  for (const [label, field] of mustHave) if (!positive(field)) missing.push(label)
  const optional = [
    ['Packaging/handling', quote.packaging_per_order],
    ['Supplier surcharge', quote.extra_supplier_fee_per_order],
    ['Import/duty allowance', quote.duty_per_order_sek],
    ['Other landed costs', quote.other_cost_per_order_sek],
    ['Marketing per order', quote.ad_cost_per_order_sek],
    ['Overhead per order', quote.overhead_per_order_sek]
  ] as const
  const assumedZero = optional.filter(([,v])=>v==null).map(([label])=>label)
  const fx = num(quote.fx_to_sek)
  const quantity = num(quote.units_per_order)
  const vat = num(quote.vat_assumption_pct) / 100
  const price = quote.price_override_sek == null || String(quote.price_override_sek).trim() === '' ? catalogUnitPriceSek : num(quote.price_override_sek)
  if (!(fx > 0)) missing.push('Exchange rate to SEK')
  if (!(quantity >= 1 && Number.isInteger(quantity))) missing.push('Units per customer order')
  if (!(price > 0)) missing.push('Selling price incl. VAT')
  if (!(vat >= 0 && vat <= 1)) missing.push('VAT assumption')

  const grossRevenue = round(price * quantity + num(quote.customer_shipping_sek))
  const revenueExVat = round(grossRevenue / (1 + vat))
  const vatIllustration = round(grossRevenue - revenueExVat)
  const productCost = round(num(quote.unit_cost) * quantity * fx)
  const supplierShipping = round(num(quote.shipping_per_order) * fx)
  const supplierHandling = round((num(quote.packaging_per_order) + num(quote.extra_supplier_fee_per_order)) * fx)
  const paymentFees = round(grossRevenue * num(quote.payment_fee_pct) / 100 + num(quote.payment_fixed_sek))
  const returnReserve = round(grossRevenue * num(quote.returns_reserve_pct) / 100)
  const otherCosts = round(
    num(quote.duty_per_order_sek) +
    num(quote.other_cost_per_order_sek) +
    num(quote.ad_cost_per_order_sek) +
    num(quote.overhead_per_order_sek)
  )
  const totalCost = round(productCost + supplierShipping + supplierHandling + paymentFees + returnReserve + otherCosts)
  const complete = missing.length === 0
  const profit = complete ? round(revenueExVat - totalCost) : null
  const marginPct = complete && revenueExVat > 0 && profit != null ? round(100 * profit / revenueExVat) : null
  const profitPerUnit = complete && profit != null ? round(profit / quantity) : null

  // Solve for inclusive customer price, keeping quantity & customer shipping constant.
  // Let R = price * qty + shippingCustomer, and contribution =
  // R/(1+vat) - R*(paymentFeePct+returnReservePct)/100 - fixedCosts.
  // For target margin m of net revenue: R * [(1-m)/(1+vat)-variableRates] = fixedCosts.
  const variableRate = (num(quote.payment_fee_pct) + num(quote.returns_reserve_pct)) / 100
  const fixedCosts = productCost + supplierShipping + supplierHandling + otherCosts +
    num(quote.payment_fixed_sek)
  const grossFor = (margin:number) => {
    const denominator = (1 - margin / 100) / (1 + vat) - variableRate
    if (!complete || denominator <= 0 || quantity <= 0) return null
    return round(Math.max(0, (fixedCosts / denominator - num(quote.customer_shipping_sek)) / quantity))
  }
  return {
    complete, missing, assumedZero, grossRevenue, revenueExVat, vatIllustration,
    productCost, supplierShipping, supplierHandling, paymentFees, returnReserve,
    otherCosts, totalCost, profit, profitPerUnit, marginPct,
    breakEvenUnitPrice: grossFor(0), targetUnitPrice: grossFor(targetMarginPct),
    quantity
  }
}

export const formatSek = (value:number | null | undefined) =>
  value == null || !Number.isFinite(value) ? '—' :
    new Intl.NumberFormat('sv-SE', { style:'currency', currency:'SEK', maximumFractionDigits:2 }).format(value)

export function blankQuote(supplierLeadId:string, productId:string): Omit<SupplierQuote,'id'|'created_at'|'updated_at'> {
  return {
    supplier_lead_id:supplierLeadId, product_id:productId, label:'Quotation',
    status:'draft', source_url:null, quote_reference:null, supplier_sku:null,
    currency:'SEK', fx_to_sek:1, unit_cost:null, shipping_per_order:null,
    packaging_per_order:null, extra_supplier_fee_per_order:null,
    duty_per_order_sek:null, other_cost_per_order_sek:null,
    customer_shipping_sek:0, price_override_sek:null, units_per_order:1,
    vat_assumption_pct:25, payment_fee_pct:null, payment_fixed_sek:null,
    returns_reserve_pct:null, ad_cost_per_order_sek:null,
    overhead_per_order_sek:null, min_order_units:null,
    delivery_min_days:null, delivery_max_days:null, evidence_notes:''
  }
}

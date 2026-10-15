// Customer-facing delivery readiness. Never guess prices or carrier SLAs.
// Change only after shipping costs and supplier routes are verified and approved.
export const deliveryReadiness = {
  country: 'SE' as const,
  countryName: 'Sverige',
  shippingAvailable: false,
  shippingFeeOre: null as number | null,
  deliveryMinDays: null as number | null,
  deliveryMaxDays: null as number | null,
  carrier: null as string | null,
  notice: 'Leveransalternativ, priser och leveranstider fastställs innan försäljningen öppnar.'
}

export const formatSwedishPostcode = (value: string) => {
  const digits = value.replace(/\s/g, '')
  return /^\d{5}$/.test(digits) ? `${digits.slice(0, 3)} ${digits.slice(3)}` : null
}

// Security-critical customer order access. No browser-supplied email or order ID is accepted.
// Node-native tests run during npm run build, before any Vercel deployment becomes READY.

export const CUSTOMER_ORDER_LIMIT = 25
export const CUSTOMER_ITEM_LIMIT = 250

export function extractBearerToken(header) {
  if (typeof header !== 'string') return null
  const match = /^Bearer ([A-Za-z0-9._~-]+)$/i.exec(header)
  if (!match) return null
  return match[1].length <= 4096 ? match[1] : null
}

export function verifiedCustomerEmail(user) {
  if (!user || user.is_anonymous || !user.email_confirmed_at || typeof user.email !== 'string') return null
  const email = user.email.trim().toLowerCase()
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

export async function findVerifiedCustomerOrders(client, user) {
  const verifiedEmail = verifiedCustomerEmail(user)
  if (!verifiedEmail) throw new Error('CUSTOMER_NOT_VERIFIED')

  // Service-side filter MUST be derived only from the verified Supabase Auth user.
  const { data, error } = await client
    .from('orders')
    .select('id,order_number,amount_total,currency,payment_status,payment_provider,status,fulfillment_status,tracking_number,carrier,created_at,shipped_at,delivered_at')
    .eq('email', verifiedEmail)
    .order('created_at', { ascending: false })
    .limit(CUSTOMER_ORDER_LIMIT)
  if (error) throw new Error('ORDER_LOOKUP_FAILED')

  const rows = data || []
  if (!rows.length) return []
  const ids = rows.map(order => order.id)
  const { data: items, error: itemsError } = await client
    .from('order_items')
    .select('order_id,name,variant_name,quantity,unit_amount')
    .in('order_id', ids)
    .limit(CUSTOMER_ITEM_LIMIT)
  if (itemsError) throw new Error('ORDER_ITEMS_LOOKUP_FAILED')

  const itemsByOrder = new Map()
  for (const item of items || []) {
    const list = itemsByOrder.get(item.order_id) || []
    list.push(item)
    itemsByOrder.set(item.order_id, list)
  }

  // Explicit allowlist: never include PII (addresses, phone), supplier costs or payment URLs.
  return rows.map(order => ({
    orderNumber: order.order_number,
    createdAt: order.created_at,
    amountTotal: order.amount_total,
    currency: order.currency,
    paymentStatus: order.payment_status,
    paymentProvider: order.payment_provider,
    status: order.status,
    fulfillmentStatus: order.fulfillment_status,
    carrier: order.carrier,
    trackingNumber: order.tracking_number,
    shippedAt: order.shipped_at,
    deliveredAt: order.delivered_at,
    sandbox: order.payment_provider === 'stripe_test' || order.order_number.startsWith('NR-TEST-'),
    items: (itemsByOrder.get(order.id) || []).map(item => ({
      name: item.name,
      variantName: item.variant_name,
      quantity: item.quantity,
      unitAmount: item.unit_amount
    }))
  }))
}

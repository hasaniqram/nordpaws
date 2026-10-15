import { getSupabaseAdmin } from '~/server/utils/supabase'

type OrderRow = {
  id: string
  order_number: string
  amount_total: number
  currency: string
  payment_status: string | null
  payment_provider: string | null
  status: string
  fulfillment_status: string | null
  tracking_number: string | null
  carrier: string | null
  created_at: string
  shipped_at: string | null
  delivered_at: string | null
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'Vary', 'Authorization')

  const bearer = getHeader(event, 'authorization') || ''
  const token = bearer.match(/^Bearer ([A-Za-z0-9._~-]+)$/i)?.[1]
  if (!token || token.length > 4096) {
    throw createError({ statusCode: 401, statusMessage: 'Logga in för att se dina beställningar.' })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw createError({ statusCode: 503, statusMessage: 'Orderhistorik är inte konfigurerad ännu.' })
  }

  // Always validate the JWT with Supabase Auth, never trust a client-provided email.
  const { data: auth, error: authError } = await supabase.auth.getUser(token)
  const user = auth?.user
  const verifiedEmail = user?.email_confirmed_at && !user.is_anonymous
    ? user.email?.trim().toLowerCase() : null
  if (authError || !verifiedEmail) {
    throw createError({ statusCode: 401, statusMessage: 'En verifierad e-postadress krävs.' })
  }

  // Read-only, authenticated order history: Supabase service credentials stay server-side.
  // Do not expose shipping addresses, provider session URLs, or internal supplier costs.
  const { data, error } = await supabase
    .from('orders')
    .select('id,order_number,amount_total,currency,payment_status,payment_provider,status,fulfillment_status,tracking_number,carrier,created_at,shipped_at,delivered_at')
    .eq('email', verifiedEmail)
    .order('created_at', { ascending: false })
    .limit(25)

  if (error) {
    throw createError({ statusCode: 503, statusMessage: 'Det gick inte att hämta orderhistoriken.' })
  }

  const rows = (data || []) as OrderRow[]
  const ids = rows.map(order => order.id)
  let itemRows: Array<{ order_id: string; name: string; variant_name: string | null; quantity: number; unit_amount: number }> = []
  if (ids.length) {
    const items = await supabase
      .from('order_items')
      .select('order_id,name,variant_name,quantity,unit_amount')
      .in('order_id', ids)
      .limit(250)
    if (items.error) {
      throw createError({ statusCode: 503, statusMessage: 'Det gick inte att hämta orderraderna.' })
    }
    itemRows = items.data || []
  }

  const itemsByOrder = new Map<string, typeof itemRows>()
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.order_id) || []
    list.push(item)
    itemsByOrder.set(item.order_id, list)
  }

  return {
    orders: rows.map(order => ({
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
})

import { getSupabaseAdmin } from '~/server/utils/supabase'
import { createFulfillmentPatch, validateFulfillmentTransition } from '~/server/utils/fulfillmentPolicy.mjs'

type Body = {
  orderId?: string
  expectedStatus?: string
  targetStatus?: string
  supplierOrderReference?: string
  carrier?: string
  trackingNumber?: string
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  const config = useRuntimeConfig()
  // This endpoint updates operational metadata only. It cannot alter payment status
  // and must not initiate payments, notify customers or place supplier orders.
  const bearer = getHeader(event, 'authorization') || ''
  const token = /^Bearer ([A-Za-z0-9._~-]{1,4096})$/i.exec(bearer)?.[1]
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Admin sign-in required.' })
  const db = getSupabaseAdmin()
  if (!db) throw createError({ statusCode: 503, statusMessage: 'Secure order storage is not configured.' })
  const { data: auth, error: authError } = await db.auth.getUser(token)
  const user = auth?.user
  if (authError || !user || user.is_anonymous || !user.email_confirmed_at) {
    throw createError({ statusCode: 401, statusMessage: 'Verified admin sign-in required.' })
  }
  const { data: admin, error: adminError } = await db
    .from('admins').select('user_id').eq('user_id',user.id).maybeSingle()
  if (adminError || !admin) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access is not authorized.' })
  }

  const body = await readBody<Body>(event)
  if (!body || typeof body.orderId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.orderId) ||
      typeof body.targetStatus !== 'string' || typeof body.expectedStatus !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid fulfillment request.' })
  }
  const fields = {
    supplierOrderReference: String(body.supplierOrderReference || '').trim(),
    carrier: String(body.carrier || '').trim(),
    trackingNumber: String(body.trackingNumber || '').trim()
  }
  if (Object.values(fields).some(v => v.length>160)) {
    throw createError({ statusCode: 400, statusMessage: 'Reference field too long.' })
  }
  const { data: order, error: lookupError } = await db.from('orders')
    .select('id,order_number,payment_status,payment_provider,fulfillment_status,supplier_ordered_at,processing_at,shipped_at,delivered_at')
    .eq('id',body.orderId).maybeSingle()
  if (lookupError || !order) throw createError({ statusCode: 404, statusMessage: 'Order not found.' })
  if ((order.fulfillment_status || 'unfulfilled') !== body.expectedStatus) {
    throw createError({ statusCode: 409, statusMessage: 'The order changed since you opened it. Refresh and try again.' })
  }
  const checked=validateFulfillmentTransition(order,body.targetStatus,fields)
  if (!checked.ok) throw createError({ statusCode: 422, statusMessage: checked.reason })

  const patch=createFulfillmentPatch(order,body.targetStatus,fields,new Date().toISOString())
  const { data: updated, error: writeError } = await db.from('orders')
    .update(patch)
    .eq('id',order.id)
    .eq('payment_status','paid')
    .eq('payment_provider','mollie')
    .eq('fulfillment_status',order.fulfillment_status)
    .select('id,fulfillment_status,supplier_status,supplier_order_reference,carrier,tracking_number,shipped_at,delivered_at')
    .maybeSingle()
  if (writeError) throw createError({ statusCode: 503, statusMessage: 'Could not update fulfillment.' })
  if (!updated) throw createError({ statusCode: 409, statusMessage: 'Order changed or is no longer eligible. Refresh to continue.' })
  return { success:true,order:updated }
})

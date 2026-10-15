import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CUSTOMER_ORDER_LIMIT, CUSTOMER_ITEM_LIMIT, extractBearerToken,
  verifiedCustomerEmail, findVerifiedCustomerOrders
} from '../server/utils/customerOrders.mjs'

const person = (email = 'Customer@Example.SE') => ({
  id: 'verified-user-id',
  email,
  email_confirmed_at: '2026-10-15T06:00:00.000Z',
  is_anonymous: false
})

function fakeDatabase({ orders = [], items = [], orderError = null, itemError = null } = {}) {
  const calls = []
  return {
    calls,
    from(table) {
      assert.ok(['orders', 'order_items'].includes(table))
      const query = {
        selected: null, email: null, ids: null, limitValue: null,
        select(columns) {
          this.selected = columns
          calls.push({ method: 'select', table, columns })
          return this
        },
        eq(field, value) {
          calls.push({ method: 'eq', table, field, value })
          if (table === 'orders' && field === 'email') this.email = value
          return this
        },
        in(field, values) {
          calls.push({ method: 'in', table, field, values })
          if (table === 'order_items' && field === 'order_id') this.ids = values
          return this
        },
        order() { return this },
        limit(n) {
          this.limitValue = n
          calls.push({ method: 'limit', table, n })
          const data = table === 'orders'
            ? orders.filter(o => o.email === this.email).slice(0, n)
            : items.filter(item => this.ids?.includes(item.order_id)).slice(0, n)
          return Promise.resolve({ data, error: table === 'orders' ? orderError : itemError })
        }
      }
      return query
    }
  }
}

test('rejects missing, malformed and excessively long bearer credentials', () => {
  for (const header of [null, '', 'Basic something', 'Bearer ', 'Bearer A B', 'Bearer foo\nBar', 'Bearer x/y', 'Bearer ' + 'x'.repeat(4097)]) {
    assert.equal(extractBearerToken(header), null)
  }
  assert.equal(extractBearerToken('Bearer abc.def_ghi-~'), 'abc.def_ghi-~')
  assert.equal(extractBearerToken('bearer valid_123'), 'valid_123')
})

test('rejects unverified, anonymous, missing, and malformed email identities', () => {
  assert.equal(verifiedCustomerEmail(null), null)
  assert.equal(verifiedCustomerEmail({ email: 'a@example.com' }), null)
  assert.equal(verifiedCustomerEmail({ ...person(), is_anonymous: true }), null)
  assert.equal(verifiedCustomerEmail({ ...person(), email: 'invalid email' }), null)
  assert.equal(verifiedCustomerEmail({ ...person(), email: '' }), null)
  assert.equal(verifiedCustomerEmail({ ...person(), email: 'x'.repeat(252) + '@example.com' }), null)
  assert.equal(verifiedCustomerEmail(person()), 'customer@example.se')
})

test('requires verified identity before touching the order database', async () => {
  const db = fakeDatabase()
  await assert.rejects(findVerifiedCustomerOrders(db, { email: 'test@example.se' }), /CUSTOMER_NOT_VERIFIED/)
  assert.deepEqual(db.calls, [])
})

test('only queries orders belonging to the server-verified email', async () => {
  const db = fakeDatabase({
    orders: [
      { id: 'owned', email: 'customer@example.se', order_number: 'NR-TEST-A', created_at: '2026-10-15', amount_total: 1000, currency: 'sek', status: 'pending', payment_status: 'unpaid', payment_provider: 'stripe_test', shipping_address: { line1: 'PRIVATE' }, phone: 'PRIVATE', provider_checkout_url: 'SECRET' },
      { id: 'other', email: 'other@example.se', order_number: 'NR-B', created_at: '2026-10-15', amount_total: 90000, currency: 'sek', status: 'paid', payment_status: 'paid', payment_provider: 'mollie', shipping_address: { line1: 'SENSITIVE' } }
    ],
    items: [
      { order_id: 'owned', name: 'CleanRoll', quantity: 1, unit_amount: 1000, variant_name: null, supplier_cost: 30 },
      { order_id: 'other', name: 'Other customer item', quantity: 1, unit_amount: 90000, variant_name: null }
    ]
  })
  const result = await findVerifiedCustomerOrders(db, person('CUSTOMER@EXAMPLE.SE'))
  assert.equal(result.length, 1)
  assert.equal(result[0].orderNumber, 'NR-TEST-A')
  assert.equal(result[0].sandbox, true)
  assert.deepEqual(result[0].items, [{ name: 'CleanRoll', variantName: null, quantity: 1, unitAmount: 1000 }])
  assert.equal(JSON.stringify(result).includes('PRIVATE'), false)
  assert.equal(JSON.stringify(result).includes('SECRET'), false)
  assert.equal(JSON.stringify(result).includes('supplier_cost'), false)
  assert.equal(JSON.stringify(result).includes('other@example.se'), false)
  assert.deepEqual(db.calls.find(call => call.method === 'eq'), { method: 'eq', table: 'orders', field: 'email', value: 'customer@example.se' })
  assert.deepEqual(db.calls.find(call => call.method === 'in'), { method: 'in', table: 'order_items', field: 'order_id', values: ['owned'] })
})

test('caps reads and returns only known customer-facing fields', async () => {
  const db = fakeDatabase({
    orders: Array.from({ length: 40 }, (_, i) => ({
      id: 'order-' + i,
      email: 'customer@example.se',
      order_number: 'NR-' + i,
      created_at: '2026-10-15',
      amount_total: 1000,
      shipping_address: { line1: 'UNSAFE' },
      stripe_checkout_session_id: 'SECRET_SESSION',
      supplier_order_reference: 'PRIVATE'
    }))
  })
  const result = await findVerifiedCustomerOrders(db, person())
  assert.equal(result.length, CUSTOMER_ORDER_LIMIT)
  assert.equal(JSON.stringify(result).includes('UNSAFE'), false)
  assert.equal(JSON.stringify(result).includes('SECRET_SESSION'), false)
  assert.equal(JSON.stringify(result).includes('PRIVATE'), false)
  assert.ok(db.calls.some(call => call.table === 'orders' && call.method === 'limit' && call.n === CUSTOMER_ORDER_LIMIT))
  assert.ok(db.calls.some(call => call.table === 'order_items' && call.method === 'limit' && call.n === CUSTOMER_ITEM_LIMIT))
})

test('a customer with no orders cannot access any order items', async () => {
  const db = fakeDatabase()
  assert.deepEqual(await findVerifiedCustomerOrders(db, person()), [])
  assert.equal(db.calls.some(call => call.table === 'order_items'), false)
})

test('fails closed on either database read error', async () => {
  const first = fakeDatabase({ orderError: { message: 'unavailable' } })
  await assert.rejects(findVerifiedCustomerOrders(first, person()), /ORDER_LOOKUP_FAILED/)
  const second = fakeDatabase({
    orders: [{ id: 'owned', email: 'customer@example.se', order_number: 'NR-X' }],
    itemError: { message: 'unavailable' }
  })
  await assert.rejects(findVerifiedCustomerOrders(second, person()), /ORDER_ITEMS_LOOKUP_FAILED/)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {evaluateFulfillmentTransition} from '../utils/fulfillmentSandbox.mjs'
const paid={fulfillment_status:'processing',payment_status:'paid',payment_provider:'mollie',carrier:'PostNord',tracking_number:'TEST-123'}
test('sandbox permits documented shipment transition',()=>assert.equal(evaluateFulfillmentTransition(paid,'shipped').allowed,true))
test('sandbox refuses unpaid fulfillment',()=>assert.equal(evaluateFulfillmentTransition({...paid,payment_status:'pending'},'shipped').allowed,false))
test('sandbox refuses shipment without carrier tracking',()=>assert.equal(evaluateFulfillmentTransition({...paid,tracking_number:''},'shipped').allowed,false))
test('sandbox refuses skipped statuses',()=>assert.equal(evaluateFulfillmentTransition({...paid,fulfillment_status:'unfulfilled'},'delivered').allowed,false))

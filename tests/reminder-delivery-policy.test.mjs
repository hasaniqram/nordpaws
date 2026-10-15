import test from 'node:test'
import assert from 'node:assert/strict'
import {canSendReminder,reminderKey} from '../utils/reminderDeliveryPolicy.mjs'
test('sending requires every explicit safeguard',()=>{
 const ready={verified:true,enabled:true,recipientMatches:true,providerReady:true,idempotencyReady:true}
 assert.equal(canSendReminder(ready),true)
 for(const key of Object.keys(ready))assert.equal(canSendReminder({...ready,[key]:false}),false,key)
 assert.equal(canSendReminder({}),false)
})
test('keys are stable for a unique administrator, product and due date',()=>{
 const args=['admin-1','product-1','2026-11-01',7]
 assert.equal(reminderKey(...args),reminderKey(...args))
 assert.notEqual(reminderKey(...args),reminderKey('admin-1','product-1','2026-11-02',7))
 assert.equal(reminderKey('admin-1','product-1','invalid',7),null)
 assert.equal(reminderKey('admin-1','product-1','2026-11-01',0),null)
})

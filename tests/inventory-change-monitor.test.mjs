import test from 'node:test'
import assert from 'node:assert/strict'
import {detectInventoryChange} from '../utils/inventoryChangeMonitor.mjs'
const now=Date.parse('2026-10-16T12:00:00Z')
const item={verified_at:'2026-10-14T08:00:00Z',stock_status:'in_stock',stock_quantity:10,unit_cost:55,currency:'SEK'}
const product={stock_status:'in_stock',stock_quantity:10,price:20000}
const quote={currency:'SEK',unit_cost:50,fx_to_sek:1}
test('identifies supplier cost changes and cost pressure',()=>{
 const v=detectInventoryChange(item,product,quote,now)
 assert.ok(Math.abs(v.changePct-10)<0.000001)
 assert.equal(v.requiresReview,true)
})
test('flags stale stock and mismatched quantities',()=>{
 const v=detectInventoryChange({...item,verified_at:'2026-08-01T00:00:00Z',stock_quantity:2},product,quote,now)
 assert.ok(v.warnings.some(x=>x.includes('30 days')))
 assert.ok(v.warnings.some(x=>x.includes('quantity differs')))
})
test('no fabricated cost comparison with different currencies',()=>{
 const v=detectInventoryChange({...item,currency:'EUR'},product,quote,now)
 assert.equal(v.changePct,null)
 assert.ok(v.warnings.some(x=>x.includes('currency differs')))
})

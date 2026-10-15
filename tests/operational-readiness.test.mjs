import test from 'node:test'
import assert from 'node:assert/strict'
import {checkOperationalReadiness} from '../utils/operationalReadiness.mjs'
const now=Date.parse('2026-10-16T12:00:00Z')
const product={active:true,price:19900}
const review={decision:'research_approved',review_due_on:'2026-11-01'}
const stock=[{stock_status:'in_stock',verified_at:'2026-10-12T08:00:00Z'}]
test('complete research and recent stock has no operational gaps',()=>assert.equal(checkOperationalReadiness(product,review,stock,now).operationallyReady,true))
test('active catalog with missing or expired evidence is flagged',()=>{
 assert.equal(checkOperationalReadiness(product,null,stock,now).publiclyActiveWithGaps,true)
 assert.equal(checkOperationalReadiness(product,{...review,review_due_on:'2026-10-01'},stock,now).operationallyReady,false)
 assert.equal(checkOperationalReadiness(product,review,[{stock_status:'in_stock',verified_at:'2026-08-01T00:00:00Z'}],now).publiclyActiveWithGaps,true)
})
test('bad price or unavailable stock fails closed',()=>{
 assert.equal(checkOperationalReadiness({...product,price:0},review,stock,now).operationallyReady,false)
 assert.equal(checkOperationalReadiness(product,review,[{stock_status:'out_of_stock',verified_at:'2026-10-15T00:00:00Z'}],now).operationallyReady,false)
})

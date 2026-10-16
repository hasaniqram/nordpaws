<script setup lang="ts">
import {ArrowLeft,Truck,RotateCcw,ShieldCheck} from 'lucide-vue-next'
import {SIMULATION_STEPS,simulateStep,classifyDeliveryIssue,evaluateRefundRequest} from '~/utils/shippingSimulation.mjs'
const testOrder=()=>({stage:'unfulfilled',carrier:'',tracking:'',events:[{status:'unfulfilled',at:new Date().toISOString()}]})
const order=ref(testOrder()),issue=ref('delay'),refundReason=ref('return'),refundAmount=ref(0),message=ref('')
const advance=()=>{
 const next=SIMULATION_STEPS[SIMULATION_STEPS.indexOf(order.value.stage)+1]
 if(!next)return
 const result=simulateStep(order.value,next)
 if(result.ok){order.value=result.order;message='Test timeline updated locally.'}
 else message=result.errors.join('. ')
}
const reset=()=>{order.value=testOrder();message='Test timeline reset.'}
const requestRefund=()=>{
 const outcome=evaluateRefundRequest({reason:refundReason.value,amount:Number(refundAmount.value),orderTotal:499})
 message=outcome.valid?'Refund request validated for demonstration only. No refund has been created.':outcome.errors.join('. ')
}
useSeoMeta({title:'Shipping tracking sandbox',robots:'noindex,nofollow'})
</script>
<template><main class="admin-shell"><header class="admin-topbar"><NorrliLogo compact/><NuxtLink to="/admin" class="btn btn-secondary compact"><ArrowLeft :size="16"/> Admin</NuxtLink></header>
<section class="ss-wrap"><span class="eyebrow"><Truck :size="16"/> PHASE 6.1 · OFFLINE SIMULATION</span><h1>Shipping & tracking sandbox</h1><p>Explore a fictional 499 SEK order. This demonstration does not read or change customer orders, carriers, payments, or refunds. Data resets when the page reloads.</p>
<div class="ss-note"><ShieldCheck :size="19"/> No purchases, label generation, carrier requests or payment operations are possible here.</div>
<div class="ss-grid"><article><h2>Test shipment timeline</h2><ol><li v-for="step in SIMULATION_STEPS" :key="step" :class="{current:step===order.stage}">{{step}}</li></ol><label>Carrier (fictional)<input v-model="order.carrier" placeholder="Example carrier"/></label><label>Tracking reference (fictional)<input v-model="order.tracking" placeholder="TEST-12345"/></label><div class="ss-actions"><button class="btn btn-primary compact" type="button" :disabled="order.stage==='delivered'" @click="advance">Advance test order</button><button class="btn btn-secondary compact" type="button" @click="reset"><RotateCcw :size="15"/> Reset</button></div><p>Events in this session: {{order.events.length}}</p></article>
<article><h2>Delivery exception preview</h2><label>Select scenario<select v-model="issue"><option value="delay">Delayed shipment</option><option value="lost">Missing parcel</option><option value="damaged">Damaged parcel</option><option value="return">Return requested</option></select></label><p class="ss-outcome">{{classifyDeliveryIssue(issue)}}</p><p>Staff should verify carrier evidence and communicate through approved channels before taking action on real orders.</p></article>
<article><h2>Refund request validation</h2><label>Reason<select v-model="refundReason"><option value="return">Return</option><option value="damaged">Damage</option><option value="lost">Lost parcel</option><option value="other">Other</option></select></label><label>Test amount SEK<input v-model.number="refundAmount" min="0" max="499" type="number"/></label><button type="button" class="btn btn-secondary compact" @click="requestRefund">Validate only</button><p>No actual refund is issued.</p></article></div><p v-if="message" class="ss-message" role="status">{{message}}</p>
</section></main></template>
<style scoped>.ss-wrap{max-width:1060px;margin:35px auto;padding:0 20px 40px}.ss-wrap h1{font:500 clamp(32px,4vw,48px) Georgia,serif;color:#245237}.ss-wrap>p{line-height:1.7;color:#627766}.ss-note{display:flex;gap:10px;background:#edf4e9;padding:15px;border-radius:12px;border:1px solid #d4e1cf;margin:20px 0}.ss-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:15px}.ss-grid article{padding:23px;border:1px solid #dbe6d5;background:white;border-radius:18px}.ss-grid h2{font:500 25px Georgia,serif;color:#245237}.ss-grid ol{padding-left:20px;color:#738375;font-size:13px;line-height:2}.ss-grid li.current{color:#23613c;font-weight:900}.ss-grid label{display:grid;gap:5px;font-size:13px;margin:12px 0}.ss-grid input,.ss-grid select{border:1px solid #cdddc9;border-radius:9px;padding:11px;width:100%}.ss-actions{display:flex;flex-wrap:wrap;gap:10px}.ss-outcome,.ss-message{background:#f2f5ed;padding:12px;border-radius:10px;color:#30563e}.ss-grid button{min-height:44px}</style>
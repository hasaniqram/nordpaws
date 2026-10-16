<script setup lang="ts">
import { ArrowLeft, ShieldCheck, Search, Package, Truck, BarChart3 } from 'lucide-vue-next'
const checks=[
 {area:'Storefront',name:'Product search, filters and cart',path:'/shop',detail:'Review Swedish search terms, filter behavior, empty results, variant quantities and the mobile cart.'},
 {area:'Storefront',name:'Product detail and structured data',path:'/shop',detail:'Verify product images, descriptions, variant pricing, accessibility, and that draft-only merchandise is not advertised as available.'},
 {area:'Fulfillment',name:'Shipping and delivery promises',path:'/delivery',detail:'Validate lead times and delivery region with suppliers; avoid promising a shipping carrier or date without a contract.'},
 {area:'Fulfillment',name:'Tracking and returns',path:'/admin',detail:'Review test-order fulfillment and refunds only; verify customer-facing return procedures before real orders.'},
 {area:'Marketing',name:'Google Merchant Center product eligibility',path:'/shop',detail:'Do not submit provisional or unverified inventory as available for purchase. Match feeds to actual online availability.'},
 {area:'Marketing',name:'Consent-based campaigns',path:'/admin',detail:'Require affirmative consent, maintain unsubscribe records, and verify email sender authentication before any campaigns.'},
 {area:'Launch safety',name:'Checkout and activation restrictions',path:'/admin/launch-gate',detail:'Keep checkout disabled; run negative activation and test payment cases. No production charges.'}
]
const done=ref<Record<string,boolean>>({})
useSeoMeta({title:'Production acceptance checklist',robots:'noindex,nofollow'})
</script>
<template><main class="admin-shell"><header class="admin-topbar"><NorrliLogo compact/><NuxtLink to="/admin/launch-qa" class="btn btn-secondary compact"><ArrowLeft :size="16"/> Launch QA</NuxtLink></header>
<section class="acc-wrap"><span class="eyebrow"><ShieldCheck :size="16"/> PHASES 4.8–7 · INTERNAL CHECKLIST</span><h1>Commerce readiness & acceptance tests</h1><p>Use these manual acceptance checks to validate storefront, delivery, administration and marketing workflows. Checking a box records progress in this browser only; it is not a certification or a production launch authorization.</p>
<div class="acc-banner">Payments and automated outbound emails remain disabled. Carrier integrations and Google Merchant submissions require approved external accounts and real fulfillment evidence.</div>
<div class="acc-summary">{{Object.values(done).filter(Boolean).length}} / {{checks.length}} reviewed in this session</div>
<article v-for="check in checks" :key="check.name" class="acc-card"><label><input type="checkbox" :checked="!!done[check.name]" @change="done[check.name]=!done[check.name]"/><span><small>{{check.area}}</small><strong>{{check.name}}</strong></span></label><p>{{check.detail}}</p><NuxtLink :to="check.path">Review related page →</NuxtLink></article>
</section></main></template>
<style scoped>.acc-wrap{margin:35px auto;padding:0 24px 45px;max-width:950px}.acc-wrap h1{font:500 clamp(32px,4vw,49px)/1.1 Georgia,serif;color:#204b36;margin:12px 0}.acc-wrap>p{color:#607768;line-height:1.7}.acc-banner{background:#ecf3e8;border:1px solid #d1e0cb;border-radius:13px;padding:15px;color:#315a40;margin:22px 0}.acc-summary{font-weight:800;margin-bottom:14px;color:#234d37}.acc-card{border:1px solid #dce8d8;background:white;border-radius:15px;padding:18px;margin:12px 0}.acc-card label{display:flex;gap:13px;align-items:center;cursor:pointer}.acc-card label input{width:18px;height:18px}.acc-card span{display:grid;gap:3px}.acc-card small{color:#708471}.acc-card strong{color:#255137}.acc-card p{font-size:13px;color:#657a6a;line-height:1.6}.acc-card a{font-size:13px;color:#2b6647;text-decoration:underline}</style>
<script setup lang="ts">
const sent = ref(false)
useSeoMeta({ title: 'Contact' })
</script>
<template><main class="container page-shell contact-page"><span class="eyebrow">Contact</span><h1>How can we help?</h1><p>Support email will be activated with the NORDPAWS sending domain before launch.</p><form class="contact-form" @submit.prevent="sent=true"><label>Name<input required></label><label>Email<input required type="email"></label><label>Message<textarea required rows="6"></textarea></label><button class="btn btn-primary">Send message</button><p v-if="sent" class="form-note">Thanks — the live support endpoint will be connected before launch.</p></form></main></template>

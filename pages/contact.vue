<script setup lang="ts">
const form = reactive({ name: '', email: '', message: '' })
const state = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const feedback = ref('')

const submit = async () => {
  state.value = 'loading'
  feedback.value = ''
  try {
    await $fetch('/api/contact', { method: 'POST', body: form })
    state.value = 'success'
    feedback.value = 'Thanks — your message has been received.'
    form.name = ''
    form.email = ''
    form.message = ''
  } catch (error: any) {
    state.value = 'error'
    feedback.value = error?.data?.statusMessage || 'We could not send your message.'
  }
}

useSeoMeta({ title: 'Contact' })
</script>

<template>
  <main class="container page-shell contact-page">
    <span class="eyebrow">Contact</span><h1>How can we help?</h1>
    <p>Send us a message here. A branded support email address will be added when the NORDPAWS domain is connected.</p>
    <form class="contact-form" @submit.prevent="submit">
      <label>Name<input v-model="form.name" required minlength="2" maxlength="100"></label>
      <label>Email<input v-model="form.email" required type="email" maxlength="254"></label>
      <label>Message<textarea v-model="form.message" required minlength="10" maxlength="4000" rows="6"></textarea></label>
      <button class="btn btn-primary" :disabled="state === 'loading'">{{ state === 'loading' ? 'Sending…' : 'Send message' }}</button>
      <p v-if="feedback" :class="['form-note', state]">{{ feedback }}</p>
    </form>
  </main>
</template>

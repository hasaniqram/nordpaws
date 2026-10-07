<script setup lang="ts">
const email = ref('')
const password = ref('')
const state = ref<'idle'|'loading'|'success'|'error'>('idle')
const feedback = ref('')
const mode = ref<'signin'|'signup'>('signin')

const submit = async () => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return
  state.value = 'loading'
  feedback.value = ''

  if (mode.value === 'signin') {
    const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
    if (error) {
      state.value = 'error'
      feedback.value = error.message
      return
    }
    await navigateTo('/admin')
    return
  }

  const { error } = await supabase.auth.signUp({ email: email.value, password: password.value })
  if (error) {
    state.value = 'error'
    feedback.value = error.message
    return
  }

  state.value = 'success'
  feedback.value = 'Account created. Confirm your email if requested, then sign in. Admin permission must be granted separately.'
}

useSeoMeta({ title: 'Admin login', robots: 'noindex,nofollow' })
</script>

<template>
  <main class="admin-auth">
    <div class="admin-auth-card">
      <NuxtLink to="/" class="brand"><span class="brand-mark">N</span><span>NORDPAWS</span></NuxtLink>
      <span class="eyebrow">Store administration</span>
      <h1>{{ mode === 'signin' ? 'Admin sign in' : 'Create admin account' }}</h1>
      <p>Authentication is handled by Supabase. Only approved accounts can access store data.</p>

      <form class="admin-form" @submit.prevent="submit">
        <label>Email<input v-model="email" type="email" required autocomplete="email"></label>
        <label>Password<input v-model="password" type="password" minlength="8" required :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"></label>
        <button class="btn btn-primary" :disabled="state === 'loading'">{{ state === 'loading' ? 'Working…' : (mode === 'signin' ? 'Sign in' : 'Create account') }}</button>
      </form>

      <p v-if="feedback" :class="['admin-feedback', state]">{{ feedback }}</p>
      <button class="admin-mode" @click="mode = mode === 'signin' ? 'signup' : 'signin'">
        {{ mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in' }}
      </button>
    </div>
  </main>
</template>

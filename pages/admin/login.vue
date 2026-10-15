<script setup lang="ts">
const email = ref('')
const password = ref('')
const state = ref<'idle'|'loading'|'error'>('idle')
const feedback = ref('')

const submit = async () => {
  const supabase = useSupabaseBrowser()
  if (!supabase) return

  state.value = 'loading'
  feedback.value = ''

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value.trim().toLowerCase(),
    password: password.value
  })

  if (error) {
    state.value = 'error'
    feedback.value = error.message
    return
  }

  await navigateTo('/admin')
}

useSeoMeta({ title: 'Admin login', robots: 'noindex,nofollow' })
</script>

<template>
  <main class="admin-auth">
    <div class="admin-auth-card">
      <NorrliLogo />
      <span class="eyebrow">Store administration</span>
      <h1>Admin sign in</h1>
      <p>Sign in with an approved Norrli Pets administrator account.</p>

      <form class="admin-form" @submit.prevent="submit">
        <label>
          Email
          <input v-model="email" type="email" required autocomplete="email">
        </label>
        <label>
          Password
          <input v-model="password" type="password" minlength="8" required autocomplete="current-password">
        </label>
        <button class="btn btn-primary" :disabled="state === 'loading'">
          {{ state === 'loading' ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p v-if="feedback" :class="['admin-feedback', state]">{{ feedback }}</p>
      <p class="admin-login-note">New administrators must be approved in the Norrli Pets admin allow-list.</p>
    </div>
  </main>
</template>

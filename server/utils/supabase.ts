import { createClient } from '@supabase/supabase-js'

export const getSupabasePublic = () => {
  const config = useRuntimeConfig()
  if (!config.public.supabaseUrl || !config.public.supabasePublishableKey) return null
  return createClient(config.public.supabaseUrl, config.public.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
}

export const getSupabaseAdmin = () => {
  const config = useRuntimeConfig()
  if (!config.public.supabaseUrl || !config.supabaseSecretKey) return null
  return createClient(config.public.supabaseUrl, config.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
}

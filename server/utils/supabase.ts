import { createClient } from '@supabase/supabase-js'

export const getSupabaseAdmin = () => {
  const config = useRuntimeConfig()
  if (!config.public.supabaseUrl || !config.supabaseSecretKey) return null
  return createClient(config.public.supabaseUrl, config.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
}

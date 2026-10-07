import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export const useSupabaseBrowser = () => {
  if (!import.meta.client) return null
  const config = useRuntimeConfig()
  if (!client) {
    client = createClient(config.public.supabaseUrl, config.public.supabasePublishableKey)
  }
  return client
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { config } from '@/lib/env'

// Admin (service role) Supabase client for server-only operations that must bypass RLS.
// NEVER expose the service role key to the client/browser.
export const createAdminClient = () => {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration')
  }
  return createSupabaseClient(config.supabase.url, config.supabase.serviceRoleKey)
}



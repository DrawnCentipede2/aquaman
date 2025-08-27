import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { config } from '@/lib/env'

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
} 
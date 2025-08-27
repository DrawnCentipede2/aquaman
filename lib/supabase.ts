import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { clientConfig, config } from '@/lib/env'

// Client-side Supabase configuration
// Use NEXT_PUBLIC_ prefixed environment variables for client-side access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required. Please check your .env.local file.')
}

if (!supabaseKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required. Please check your .env.local file.')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey)

// Server-side Supabase client (for API routes)
export const createServerSupabaseClient = (cookieStore?: any) => {
  return createServerClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore?.get(name)?.value
        },
      },
    }
  )
}

// Admin Supabase client (for admin operations)
export const createAdminSupabaseClient = () => {
  return createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey
  )
}

// Database types for our application
export interface Pin {
  id: string
  title: string
  description: string
  google_maps_url: string
  category: string
  latitude: number
  longitude: number
  created_at: string
  creator_location: string
  creator_ip: string
  photos?: string[] // Array of base64 encoded images
}

export interface PinPack {
  id: string
  title: string
  description: string
  price: number
  city: string
  country: string
  created_at: string
  creator_location: string
  pin_count: number
  categories?: string[] // Array of category strings (up to 3)
  maps_list_reference?: any // JSON field containing original_url, expanded_url, and title
  // Optional analytics fields (may not be present in all queries)
  creator_id?: string
  download_count?: number
  average_rating?: number
  rating_count?: number
  updated_at?: string
}

export interface PinPackPin {
  id: string
  pin_pack_id: string
  pin_id: string
} 
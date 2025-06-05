import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// These values come from your Supabase project settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey)

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
}

export interface PinPackPin {
  id: string
  pin_pack_id: string
  pin_id: string
} 
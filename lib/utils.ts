import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from './supabase'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Shared utility function for querying creator data by UUID or email
export const queryCreatorData = async (
  creatorId: string, 
  selectFields: string = '*'
): Promise<{ data: any | null; error: any | null; queryType: 'UUID' | 'email' }> => {
  try {
    // Always decode the creator ID to handle URL-encoded emails consistently
    const decodedCreatorId = decodeURIComponent(creatorId)
    console.log('Querying creator data for ID:', decodedCreatorId)
    
    // Check if creatorId looks like a UUID or an email
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedCreatorId)
    
    let result
    if (isUUID) {
      // Query by UUID (id field)
      console.log('Querying by UUID:', decodedCreatorId)
      result = await supabase
        .from('users')
        .select(selectFields)
        .eq('id', decodedCreatorId)
        .maybeSingle()
    } else {
      // Query by email (assuming creatorId is an email for legacy creators)
      console.log('Querying by email:', decodedCreatorId)
      result = await supabase
        .from('users')
        .select(selectFields)
        .eq('email', decodedCreatorId)
        .maybeSingle()
    }

    console.log('Creator data query result:', { 
      data: result.data, 
      error: result.error, 
      queryType: isUUID ? 'UUID' : 'email' 
    })

    return {
      data: result.data,
      error: result.error,
      queryType: isUUID ? 'UUID' : 'email'
    }
  } catch (error) {
    console.error('Error in queryCreatorData:', error)
    return {
      data: null,
      error: error,
      queryType: 'email' // Default fallback
    }
  }
}

// Function to get the first available photo from a pack's pins
export const getPackDisplayImage = async (packId: string): Promise<string | null> => {
  try {
    const { data: packPinsData, error } = await supabase
      .from('pin_pack_pins')
      .select(`
        pins (
          id,
          photos
        )
      `)
      .eq('pin_pack_id', packId)
      .limit(10)

    if (error || !packPinsData) return null

    // Find first pin with photos
    for (const packPin of packPinsData) {
      const pin = packPin.pins as any
      if (pin?.photos && Array.isArray(pin.photos) && pin.photos.length > 0) {
        return pin.photos[0]
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting pack display image:', error)
    return null
  }
} 
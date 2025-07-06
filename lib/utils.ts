import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from './supabase'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
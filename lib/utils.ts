import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from './supabase'
import { logger } from './logger'

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
    logger.log('Querying creator data for ID:', decodedCreatorId)
    
    // Check if creatorId looks like a UUID or an email
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedCreatorId)
    
    let result
    if (isUUID) {
      // Query by UUID (id field)
      logger.log('Querying by UUID:', decodedCreatorId)
      result = await supabase
        .from('users')
        .select(selectFields)
        .eq('id', decodedCreatorId)
        .maybeSingle()
    } else {
      // Query by email (assuming creatorId is an email for legacy creators)
      logger.log('Querying by email:', decodedCreatorId)
      result = await supabase
        .from('users')
        .select(selectFields)
        .eq('email', decodedCreatorId)
        .maybeSingle()
    }

    logger.log('Creator data query result:', { 
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
    logger.error('Error in queryCreatorData:', error)
    return {
      data: null,
      error: error,
      queryType: 'email' // Default fallback
    }
  }
}

// Function to get the first available photo from a pack's pins
const packCoverCache = new Map<string, string | null>()

// Fetch and cache a representative cover image for a pack from its pins
export const getPackDisplayImage = async (packId: string): Promise<string | null> => {
  try {
    if (!packId) return null

    // Serve from cache if available
    if (packCoverCache.has(packId)) {
      return packCoverCache.get(packId) ?? null
    }

    // 1) Get related pin ids for this pack
    const { data: packPinData, error: packPinError } = await supabase
      .from('pin_pack_pins')
      .select('pin_id')
      .eq('pin_pack_id', packId)

    if (packPinError) {
      logger.warn('getPackDisplayImage: error loading pin relations', packPinError)
      packCoverCache.set(packId, null)
      return null
    }

    const pinIds = (packPinData || []).map((r: any) => r.pin_id)
    if (pinIds.length === 0) {
      packCoverCache.set(packId, null)
      return null
    }

    // 2) Get cover_photo (preferred) or legacy photos[0] for these pins
    const { data: pinsData, error: pinsError } = await supabase
      .from('pins')
      .select('id, cover_photo, photos')
      .in('id', pinIds)

    if (pinsError) {
      logger.warn('getPackDisplayImage: error loading pins', pinsError)
      packCoverCache.set(packId, null)
      return null
    }

    // 3) Find the first available image
    let chosen: string | null = null
    for (const p of pinsData || []) {
      const cover = (p?.cover_photo as string | null) || null
      const legacy = Array.isArray(p?.photos) && p.photos.length > 0 ? (p.photos[0] as string) : null
      if (cover || legacy) {
        chosen = cover || legacy
        break
      }
    }

    // Cache and return
    packCoverCache.set(packId, chosen)
    return chosen

  } catch (error) {
    logger.error('Error getting pack display image:', error)
    return null
  }
}

// Transform a Supabase Storage public URL to the Image Transformation endpoint
// Example:
//  https://<project>.supabase.co/storage/v1/object/public/pin-photos/pins/<id>/0.webp
// → https://<project>.supabase.co/storage/v1/render/image/public/pin-photos/pins/<id>/0.webp?width=600&quality=70
export function toTransformedImageUrl(
  url: string,
  opts: { width?: number; height?: number; quality?: number } = {}
): string {
  try {
    if (!url || typeof url !== 'string') return url
    // Allow enabling via env flag; default to off to avoid 403 if transformations aren't enabled
    if (process.env.NEXT_PUBLIC_SUPABASE_TRANSFORM_ENABLED !== 'true') return url
    if (!url.includes('/storage/v1/object/public/')) return url
    const width = opts.width ?? 600
    const quality = opts.quality ?? 70
    const heightParam = opts.height ? `&height=${opts.height}` : ''
    return url
      .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
      .concat(`?width=${width}${heightParam}&quality=${quality}`)
  } catch {
    return url
  }
}
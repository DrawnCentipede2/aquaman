import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { PinPack } from '@/lib/supabase'
import { generateFallbackReviews } from '@/lib/reviews'
import { queryCreatorData } from '@/lib/utils'

interface PinPackWithPhoto extends PinPack {
  coverPhoto?: string | null
}

interface UsePackDetailsResult {
  pack: PinPack | null
  pins: any[]
  similarPacks: PinPackWithPhoto[]
  reviews: any[]
  reviewsSource: 'pack' | 'google' | null
  creatorProfile: any
  loading: boolean
  error: string | null
  refetchReviews: () => Promise<void>
}

// Cache for creator profiles to avoid duplicate queries
const creatorProfileCache = new Map<string, any>()

export function usePackDetails(packId: string): UsePackDetailsResult {
  // Core state
  const [pack, setPack] = useState<PinPack | null>(null)
  const [pins, setPins] = useState<any[]>([])
  const [similarPacks, setSimilarPacks] = useState<PinPackWithPhoto[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewsSource, setReviewsSource] = useState<'pack' | 'google' | null>(null)
  const [creatorProfile, setCreatorProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Optimized pack loading with minimal queries
  const loadPackDetails = useCallback(async () => {
    if (!packId) return

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Loading pack details for ID:', packId)

      // Single optimized query for pack + pins + photos
      const { data: packData, error: packError } = await supabase
        .from('pin_packs')
        .select(`
          *,
          pin_pack_pins(
            pins(
              id, title, description, google_maps_url, category,
              latitude, longitude, created_at, address, city, country,
              zip_code, business_type, phone, website, rating, rating_count,
              business_status, current_opening_hours, reviews, place_id,
              needs_manual_edit, updated_at, photos
            )
          )
        `)
        .eq('id', packId)
        .single()

      if (packError) throw packError
      if (!packData) throw new Error('Pack not found')

      console.log('🔍 Pack data loaded:', packData)
      console.log('🔍 Pack reviews:', packData.reviews)
      console.log('🔍 Creator ID:', packData.creator_id)

      setPack(packData)

      // Process pins data
      const pinsData = packData.pin_pack_pins?.map((item: any) => ({
        id: item.pins.id,
        name: item.pins.title,
        title: item.pins.title,
        description: item.pins.description,
        google_maps_url: item.pins.google_maps_url,
        category: item.pins.category,
        latitude: item.pins.latitude,
        longitude: item.pins.longitude,
        created_at: item.pins.created_at,
        address: item.pins.address,
        city: item.pins.city,
        country: item.pins.country,
        zip_code: item.pins.zip_code,
        business_type: item.pins.business_type,
        phone: item.pins.phone,
        website: item.pins.website,
        rating: item.pins.rating,
        rating_count: item.pins.rating_count,
        business_status: item.pins.business_status,
        current_opening_hours: item.pins.current_opening_hours,
        reviews: item.pins.reviews,
        place_id: item.pins.place_id,
        needs_manual_edit: item.pins.needs_manual_edit,
        updated_at: item.pins.updated_at,
        photos: item.pins.photos || []
      })) || []

      console.log('🔍 Pins data processed:', pinsData.length, 'pins')
      setPins(pinsData)

      // Process reviews
      if (packData.reviews && Array.isArray(packData.reviews) && packData.reviews.length > 0) {
        console.log('🔍 Using existing pack reviews:', packData.reviews.length, 'reviews')
        setReviews(packData.reviews)
        const firstReview = packData.reviews[0]
        setReviewsSource(firstReview.source === 'Google Maps' ? 'google' : 'pack')
      } else {
        console.log('🔍 No existing reviews, generating fallback reviews')
        const fallbackReviews = generateFallbackReviews(packData, pinsData)
        console.log('🔍 Generated fallback reviews:', fallbackReviews)
        setReviews(fallbackReviews)
        setReviewsSource('pack')
      }

      // Load creator profile with caching
      if (packData.creator_id) {
        console.log('🔍 Loading creator profile for ID:', packData.creator_id)
        
        if (creatorProfileCache.has(packData.creator_id)) {
          console.log('🔍 Using cached creator profile')
          setCreatorProfile(creatorProfileCache.get(packData.creator_id))
        } else {
          try {
            console.log('🔍 Querying creator data...')
            const { data: creator, error: creatorError } = await queryCreatorData(
              packData.creator_id,
              'name, email, bio, verified, city, country, occupation'
            )

            console.log('🔍 Creator query result:', { creator, creatorError })

            const creatorData = creator && !creatorError ? creator : {
              name: 'Local Creator',
              email: packData.creator_id.includes('@') ? decodeURIComponent(packData.creator_id) : '',
              bio: 'Local guide passionate about sharing authentic experiences.',
              verified: false,
              city: packData.city,
              country: packData.country,
              occupation: 'Local Guide'
            }

            console.log('🔍 Final creator data:', creatorData)
            creatorProfileCache.set(packData.creator_id, creatorData)
            setCreatorProfile(creatorData)
          } catch (error) {
            console.warn('🔍 Error loading creator profile:', error)
            const fallbackCreator = {
              name: 'Local Creator',
              email: '',
              bio: 'Local guide passionate about sharing authentic experiences.',
              verified: false,
              city: packData.city,
              country: packData.country,
              occupation: 'Local Guide'
            }
            setCreatorProfile(fallbackCreator)
          }
        }
      } else {
        console.log('🔍 No creator_id found in pack data')
      }

      // Load similar packs with optimized query (limit to reduce load time)
      try {
        const { data: similarData, error: similarError } = await supabase
          .from('pin_packs')
          .select(`
            id, title, description, city, country, pin_count, download_count,
            pin_pack_pins!inner(
              pins!inner(photos)
            )
          `)
          .or(`city.eq.${packData.city},country.eq.${packData.country}`)
          .neq('id', packId)
          .limit(6) // Reduced from 8 to 6 for faster loading

        if (!similarError && similarData) {
          // Process similar packs with cover photos
          const similarPacksWithPhotos = similarData.map((similarPack: any) => {
            let coverPhoto = null
            
            // Find first pin with photos
            if (similarPack.pin_pack_pins && Array.isArray(similarPack.pin_pack_pins)) {
              for (const pinPackPin of similarPack.pin_pack_pins) {
                if (pinPackPin.pins?.photos && Array.isArray(pinPackPin.pins.photos) && pinPackPin.pins.photos.length > 0) {
                  coverPhoto = pinPackPin.pins.photos[0]
                  break
                }
              }
            }
            
            return {
              id: similarPack.id,
              title: similarPack.title,
              description: similarPack.description,
              city: similarPack.city,
              country: similarPack.country,
              pin_count: similarPack.pin_count,
              download_count: similarPack.download_count,
              coverPhoto
            }
          })
          
          setSimilarPacks(similarPacksWithPhotos)
        } else {
          setSimilarPacks([])
        }
      } catch (error) {
        console.warn('Error loading similar packs:', error)
        setSimilarPacks([])
      }

    } catch (err) {
      console.error('Error loading pack details:', err)
      setError(`Failed to load pack details: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [packId])

  // Optimized reviews refresh function
  const refetchReviews = useCallback(async () => {
    if (!pack || !pins.length) return

    try {
      // This would call the refresh reviews API
      const { data: updatedPackData } = await supabase
        .from('pin_packs')
        .select('reviews')
        .eq('id', pack.id)
        .single()

      if (updatedPackData?.reviews && Array.isArray(updatedPackData.reviews) && updatedPackData.reviews.length > 0) {
        setReviews(updatedPackData.reviews)
        const firstReview = updatedPackData.reviews[0]
        setReviewsSource(firstReview.source === 'Google Maps' ? 'google' : 'pack')
      }
    } catch (error) {
      console.error('Error refreshing reviews:', error)
    }
  }, [pack, pins])

  // Load data when packId changes
  useEffect(() => {
    loadPackDetails()
  }, [loadPackDetails])

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(() => ({
    pack,
    pins,
    similarPacks,
    reviews,
    reviewsSource,
    creatorProfile,
    loading,
    error,
    refetchReviews
  }), [pack, pins, similarPacks, reviews, reviewsSource, creatorProfile, loading, error, refetchReviews])
} 
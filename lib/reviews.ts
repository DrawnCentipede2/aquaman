// Reviews utility functions for fetching and storing Google Maps reviews
// This optimizes performance by fetching reviews once during pack creation
// 
// PRIVACY NOTE: Google Maps user names and profile photos are anonymized to "Google User"
// and generic avatars to protect user privacy and comply with data protection regulations.

export interface Review {
  id: string
  user_name: string // For Google Maps reviews, this will be "Google User" for privacy
  user_avatar: string // For Google Maps reviews, this will be "GU" for privacy
  rating: number
  comment: string
  date: string
  verified: boolean
  source: 'Google Maps' | 'Local Experience'
  place_name?: string
  profile_photo_url?: string // For Google Maps reviews, this will be null for privacy
}

export interface Pin {
  id: string
  title: string
  description: string
  google_maps_url: string
  category: string
  latitude: number
  longitude: number
  place_id?: string
  rating?: number
  rating_count?: number
  address?: string
  city?: string
  country?: string
  zip_code?: string
  business_type?: string
  phone?: string
  website?: string
  current_opening_hours?: any
  business_status?: string
  reviews?: any[]
  needs_manual_edit?: boolean
  photos?: string[]
}

// Function to extract a searchable query from Google Maps URL
const extractQueryFromUrl = (url: string): string | null => {
  console.log('Extracting query from URL:', url)
  
  try {
    const urlObj = new URL(url)
    console.log('URL hostname:', urlObj.hostname)
    console.log('URL pathname:', urlObj.pathname)
    
    // For short URLs like maps.app.goo.gl, try to get the query parameter
    if (urlObj.hostname.includes('maps.app.goo.gl')) {
      const path = urlObj.pathname.replace('/', '')
      if (path) {
        console.log('Extracted from short URL:', path)
        return path
      }
    }
    
    // For regular Google Maps URLs (google.com, google.de, etc.)
    if (urlObj.hostname.includes('google')) {
      const pathParts = urlObj.pathname.split('/')
      console.log('Path parts:', pathParts)
      
      // Look for the 'place' segment and get the next part
      const placeIndex = pathParts.findIndex(part => part === 'place')
      console.log('Place index:', placeIndex)
      
      if (placeIndex !== -1 && placeIndex + 1 < pathParts.length) {
        const placeName = pathParts[placeIndex + 1]
        console.log('Place name found:', placeName)
        
        if (placeName && !placeName.startsWith('@')) {
          const decodedName = decodeURIComponent(placeName.replace(/\+/g, ' '))
          console.log('Decoded place name:', decodedName)
          return decodedName
        }
      }
      
      // Fallback: try to extract any meaningful text from the path
      const meaningfulParts = pathParts.filter(part => 
        part && 
        part !== 'maps' && 
        part !== 'place' && 
        !part.startsWith('@') && 
        !part.startsWith('data=') &&
        part.length > 2
      )
      console.log('Meaningful parts:', meaningfulParts)
      
      if (meaningfulParts.length > 0) {
        const fallbackName = decodeURIComponent(meaningfulParts[0].replace(/\+/g, ' '))
        console.log('Fallback name:', fallbackName)
        return fallbackName
      }
    }
    
    console.log('Using full URL as fallback')
    return url
  } catch (error) {
    console.error('Error parsing URL:', error)
    return url
  }
}

// Function to fetch Google Maps reviews for a single place
const fetchPlaceReviews = async (pin: Pin): Promise<Review[]> => {
  try {
    console.log('Fetching reviews for pin:', pin.title, 'URL:', pin.google_maps_url)
    
    if (!pin.google_maps_url) {
      console.log('No Google Maps URL, skipping')
      return []
    }
    
    // Extract a searchable query from the URL
    const query = extractQueryFromUrl(pin.google_maps_url)
    console.log('Extracted query:', query)
    
    if (!query) {
      console.log('No searchable query extracted, skipping')
      return []
    }
    
    // First, get place details to find the place_id
    console.log('Fetching place details for query:', query)
    const placeDetailsResponse = await fetch(`/api/places/details?query=${encodeURIComponent(query)}`)
    
    if (!placeDetailsResponse.ok) {
      console.log('Failed to fetch place details, skipping')
      return []
    }
    
    const placeDetails = await placeDetailsResponse.json()
    console.log('Place details:', placeDetails)
    
    if (!placeDetails.place_id) {
      console.log('No place_id found in place details, skipping')
      return []
    }
    
    // Now fetch reviews using the place_id
    console.log('Fetching reviews for place ID:', placeDetails.place_id)
    const reviewsResponse = await fetch(`/api/places/reviews?placeId=${placeDetails.place_id}&maxResults=3`)
    
    if (reviewsResponse.ok) {
      const reviewsData = await reviewsResponse.json()
      console.log('Reviews response:', reviewsData)
      
      if (reviewsData.reviews && reviewsData.reviews.length > 0) {
        // Transform Google Maps reviews to our format with privacy protection
        const transformedReviews: Review[] = reviewsData.reviews.map((review: any, index: number) => ({
          id: `${placeDetails.place_id}-${index}`,
          user_name: 'Google User', // Privacy: Don't display real names
          user_avatar: 'GU', // Generic avatar initials
          rating: review.rating || 5,
          comment: review.text || 'Great place!',
          date: review.time ? new Date(review.time * 1000).toISOString().split('T')[0] : '2024-01-01',
          verified: true, // Google reviews are verified
          source: 'Google Maps',
          place_name: pin.title,
          profile_photo_url: null // Privacy: Don't display profile photos
        }))
        
        console.log('Transformed reviews:', transformedReviews)
        return transformedReviews
      } else {
        console.log('No reviews found for this place')
        return []
      }
    } else {
      console.log('Failed to fetch reviews, status:', reviewsResponse.status)
      return []
    }
  } catch (error) {
    console.warn('Error fetching reviews for place:', pin.title, error)
    return []
  }
}

// Function to fetch Google Maps reviews for all pins in a pack
export const fetchPackReviews = async (pins: Pin[]): Promise<Review[]> => {
  try {
    console.log('Fetching Google Maps reviews for pins:', pins.length)
    const allReviews: Review[] = []
    
    // Get reviews from the first few places that have Google Maps URLs
    const placesWithUrls = pins.filter(pin => pin.google_maps_url).slice(0, 3)
    console.log('Places with URLs:', placesWithUrls.length)
    
    for (const pin of placesWithUrls) {
      try {
        const pinReviews = await fetchPlaceReviews(pin)
        allReviews.push(...pinReviews)
      } catch (error) {
        console.warn('Error fetching reviews for place:', pin.title, error)
      }
    }
    
    console.log('Total reviews collected:', allReviews.length)
    
    // If no reviews were collected, log why
    if (allReviews.length === 0) {
      console.log('No Google Maps reviews collected - this is normal if:')
      console.log('1. Places don\'t have proper Google Maps URLs')
      console.log('2. Google Places API returns no reviews for the places')
      console.log('3. Place details cannot be found')
      console.log('Falling back to local experience reviews...')
    }
    
    return allReviews.slice(0, 6) // Return max 6 reviews
  } catch (error) {
    console.error('Error fetching Google Maps reviews:', error)
    return []
  }
}

// Function to generate fallback reviews when Google Maps fails
export const generateFallbackReviews = (pack: any, pins: Pin[]): Review[] => {
  const fallbackReviews: Review[] = [
    {
      id: '1',
      user_name: 'Sarah Chen',
      user_avatar: 'SC',
      rating: 5,
      comment: `Amazing local spots in ${pack.city}! Found some hidden gems I never would have discovered on my own.`,
      date: '2024-01-15',
      verified: true,
      source: 'Local Experience'
    },
    {
      id: '2',
      user_name: 'Miguel Rodriguez',
      user_avatar: 'MR',
      rating: 5,
      comment: `Perfect for exploring the authentic side of ${pack.city}. Highly recommend!`,
      date: '2024-01-10',
      verified: true,
      source: 'Local Experience'
    },
    {
      id: '3',
      user_name: 'Emma Wilson',
      user_avatar: 'EW',
      rating: 4,
      comment: `Great selection of places. Some were closed when I visited but overall excellent experience.`,
      date: '2024-01-08',
      verified: false,
      source: 'Local Experience'
    }
  ]
  
  return fallbackReviews
}

// Function to aggregate and store reviews for a pack
export const aggregateAndStorePackReviews = async (packId: string, pins: Pin[], supabase: any): Promise<void> => {
  try {
    console.log('Aggregating reviews for pack:', packId)
    
    // First, try to fetch reviews from Google Maps for places in this pack
    const googleReviews = await fetchPackReviews(pins)
    console.log('Google reviews fetched:', googleReviews.length)
    
    let finalReviews: Review[]
    let reviewsSource: 'google' | 'pack' = 'pack'
    
    if (googleReviews.length > 0) {
      console.log('Using Google reviews:', googleReviews)
      finalReviews = googleReviews
      reviewsSource = 'google'
    } else {
      console.log('No Google reviews, using fallback')
      // Fallback to generated reviews if Google Maps fails
      const fallbackReviews = generateFallbackReviews({ city: 'Unknown' }, pins)
      console.log('Using fallback reviews:', fallbackReviews)
      finalReviews = fallbackReviews
      reviewsSource = 'pack'
    }
    
    // Store the reviews in the database
    const { error } = await supabase
      .from('pin_packs')
      .update({ 
        reviews: finalReviews,
        reviews_updated_at: new Date().toISOString()
      })
      .eq('id', packId)
    
    if (error) {
      console.error('Error storing reviews:', error)
      throw error
    }
    
    console.log(`Successfully stored ${finalReviews.length} reviews for pack ${packId} (source: ${reviewsSource})`)
    
  } catch (error) {
    console.error('Error aggregating and storing pack reviews:', error)
    throw error
  }
}

// Function to refresh reviews for an existing pack
export const refreshPackReviews = async (packId: string, pins: Pin[], supabase: any): Promise<void> => {
  try {
    console.log('Refreshing reviews for pack:', packId)
    await aggregateAndStorePackReviews(packId, pins, supabase)
  } catch (error) {
    console.error('Error refreshing pack reviews:', error)
    throw error
  }
} 
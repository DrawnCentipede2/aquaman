// Google Maps API integration utilities
// This handles fetching places from Google Maps lists and place details

// Extend the Window interface to include Google Maps
declare global {
  interface Window {
    google: any;
  }
}

interface PlaceDetails {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  types: string[]
  rating?: number
  user_ratings_total?: number
  photos?: Array<{
    photo_reference: string
  }>
  website?: string
  website_uri?: string
  formatted_phone_number?: string
  opening_hours?: {
    open_now: boolean
    weekday_text: string[]
  }
  current_opening_hours?: {
    open_now: boolean
    weekday_text: string[]
  }
  reviews?: Array<{
    author_name: string
    rating: number
    text: string
    time: number
  }>
  price_level?: number
  business_status?: string
}

interface ImportedPlace {
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
  current_opening_hours?: {
    open_now: boolean
    weekday_text: string[]
  }
  business_status?: string
  reviews?: Array<{
    author_name: string
    rating: number
    text: string
    time: number
  }>
  needs_manual_edit?: boolean
}

// Get the Google Maps API key from environment variables
const getApiKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('Google Maps API key is not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.')
  }
  return apiKey
}

// Initialize Google Maps API
export const initializeGoogleMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      resolve()
      return
    }

    // Create script element
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${getApiKey()}&libraries=places`
    script.async = true
    script.defer = true
    
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps API'))
    
    document.head.appendChild(script)
  })
}

// Extract place ID from Google Maps URL
export const extractPlaceId = (url: string): string | null => {
  console.log('Extracting place ID from URL:', url)
  
  // Valid Google place IDs should:
  // - Start with specific prefixes (ChIJ, GhIJ, EhIJ, etc.)
  // - Be at least 20 characters long
  // - Contain only alphanumeric characters, hyphens, and underscores
  const isValidPlaceId = (id: string): boolean => {
    if (!id || id.length < 20) return false
    
    // Check for valid place ID prefixes (expanded list)
    const validPrefixes = [
      'ChIJ', 'GhIJ', 'EhIJ', 'EkIJ', 'ElIJ', 'EmIJ', 'EnIJ',
      'ChAJ', 'GhAJ', 'EhAJ', 'EkAJ', 'ElAJ', 'EmAJ', 'EnAJ'
    ]
    const hasValidPrefix = validPrefixes.some(prefix => id.startsWith(prefix))
    
    // Check for valid characters (alphanumeric, hyphens, underscores)
    const hasValidChars = /^[a-zA-Z0-9_-]+$/.test(id)
    
    return hasValidPrefix && hasValidChars
  }
  
  // Check if this is a CID format (hexadecimal coordinate reference)
  const isCidFormat = (id: string): boolean => {
    // CID format looks like: 0x47a851f6074c0b13:0xfafeaa57e0dc05c9
    return /^0x[a-fA-F0-9]+:0x[a-fA-F0-9]+$/.test(id)
  }
  
  // Try different patterns to extract place ID from modern Google Maps URLs
  const patterns = [
    // Modern format: Look for !1s followed by a valid place ID
    /!1s([a-zA-Z0-9_-]{20,})(?:[!&]|$)/,
    
    // Alternative format: data=...!1s[PLACE_ID]
    /data=.*!1s([a-zA-Z0-9_-]{20,})(?:[!&]|$)/,
    
    // Legacy format with place_id parameter
    /[?&]place_id=([a-zA-Z0-9_-]{20,})(?:[&]|$)/,
    
    // Another legacy format
    /place_id[=:]([a-zA-Z0-9_-]{20,})(?:[&!]|$)/,
    
    // Data parameter with different encoding
    /data=.*!4s([a-zA-Z0-9_-]{20,})(?:[!&]|$)/,
    
    // CID format pattern (hexadecimal coordinates)
    /!1s(0x[a-fA-F0-9]+:0x[a-fA-F0-9]+)(?:[!&]|$)/,
    
    // Flexible pattern for place IDs in data sections
    /!1s([a-zA-Z0-9_:-]{15,})(?:[!&]|$)/,
    
    // Direct place ID in URL path (less common)
    /\/([a-zA-Z0-9_-]{20,})(?:\/|$)/
  ]
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i]
    const match = url.match(pattern)
    if (match && match[1]) {
      const potentialPlaceId = match[1]
      console.log(`Potential place ID found using pattern ${i + 1}:`, potentialPlaceId)
      
      // Check if it's a CID format (which is not a valid place ID)
      if (isCidFormat(potentialPlaceId)) {
        console.log('Found CID format (hexadecimal coordinates), this is not a valid place ID:', potentialPlaceId)
        continue // Skip CID format, it's not a place ID
      }
      
      // First try strict validation
      if (isValidPlaceId(potentialPlaceId)) {
        console.log('Valid place ID confirmed:', potentialPlaceId)
        return potentialPlaceId
      } else {
        console.log('Invalid place ID format, trying next pattern...')
      }
    }
  }
  
  console.log('No valid place ID found in URL')
  return null
}

// Extract coordinates from Google Maps URL (fallback method)
export const extractCoordinates = (url: string): { latitude: number; longitude: number } => {
  const patterns = [
    /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
    /(?:^|[^\d])(-?\d+\.\d+),(-?\d+\.\d+)(?:[^\d]|$)/,
    /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { latitude: lat, longitude: lng }
      }
    }
  }
  
  // Default coordinates (center of the world)
  return { latitude: 0, longitude: 0 }
}

// Get place details using Google Places API
export const getPlaceDetails = async (placeId: string): Promise<PlaceDetails> => {
  console.log('Getting place details for place ID:', placeId)
  
  try {
    await initializeGoogleMaps()
    console.log('Google Maps API initialized successfully')
  } catch (initError) {
    console.error('Failed to initialize Google Maps API:', initError)
    throw new Error(`Google Maps API initialization failed: ${initError}`)
  }
  
  return new Promise((resolve, reject) => {
    const service = new (window as any).google.maps.places.PlacesService(
      document.createElement('div')
    )
    
    const request = {
      placeId: placeId,
      fields: [
        'place_id',
        'name', 
        'formatted_address',
        'geometry',
        'types',
        'rating',
        'user_ratings_total',
        'photos',
        'website',
        'formatted_phone_number',
        'opening_hours',
        'current_opening_hours',
        'website_uri',
        'reviews',
        'price_level',
        'business_status'
      ]
    }
    
    console.log('Making Places API request with:', request)
    
    service.getDetails(request, (place: any, status: any) => {
      console.log('Places API response status:', status)
      console.log('Places API response data:', place)
      
      if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place) {
        console.log('Places API request successful')
        resolve(place as PlaceDetails)
      } else {
        console.error('Places API request failed with status:', status)
        
        // Provide more specific error messages
        let errorMessage = `Failed to get place details: ${status}`
        
        if (status === (window as any).google.maps.places.PlacesServiceStatus.NOT_FOUND) {
          errorMessage = 'Place not found. The place ID might be invalid or the place might not exist.'
        } else if (status === (window as any).google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
          errorMessage = 'API quota exceeded. Please check your Google Cloud billing and usage limits.'
        } else if (status === (window as any).google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
          errorMessage = 'API request denied. Please check your API key and permissions.'
        } else if (status === (window as any).google.maps.places.PlacesServiceStatus.INVALID_REQUEST) {
          errorMessage = 'Invalid request. The place ID format might be incorrect.'
        }
        
        reject(new Error(errorMessage))
      }
    })
  })
}

// Determine category based on Google place types
const categorizePlace = (types: string[]): string => {
  console.log('Categorizing place with types:', types)
  
  // Priority mapping - more specific types first
  const priorityMapping: { [key: string]: { category: string, priority: number } } = {
    // Specific venues (highest priority)
    'stadium': { category: 'attraction', priority: 1 },
    'amusement_park': { category: 'attraction', priority: 1 },
    'zoo': { category: 'nature', priority: 1 },
    'aquarium': { category: 'nature', priority: 1 },
    'museum': { category: 'culture', priority: 1 },
    'art_gallery': { category: 'culture', priority: 1 },
    'movie_theater': { category: 'culture', priority: 1 },
    'casino': { category: 'attraction', priority: 1 },
    
    // Food & Drink (high priority)
    'restaurant': { category: 'restaurant', priority: 2 },
    'meal_takeaway': { category: 'restaurant', priority: 2 },
    'meal_delivery': { category: 'restaurant', priority: 2 },
    'cafe': { category: 'cafe', priority: 2 },
    'bakery': { category: 'cafe', priority: 2 },
    'bar': { category: 'bar', priority: 2 },
    'night_club': { category: 'bar', priority: 2 },
    'liquor_store': { category: 'bar', priority: 2 },
    
    // Shopping (medium priority)
    'shopping_mall': { category: 'shopping', priority: 3 },
    'store': { category: 'shopping', priority: 3 },
    'clothing_store': { category: 'shopping', priority: 3 },
    'electronics_store': { category: 'shopping', priority: 3 },
    'book_store': { category: 'shopping', priority: 3 },
    'grocery_or_supermarket': { category: 'shopping', priority: 3 },
    
    // Nature & Parks (medium priority)
    'park': { category: 'nature', priority: 3 },
    'natural_feature': { category: 'nature', priority: 3 },
    
    // Tourist attractions (medium priority)
    'tourist_attraction': { category: 'attraction', priority: 3 },
    
    // Culture (medium priority)
    'library': { category: 'culture', priority: 3 },
    'church': { category: 'culture', priority: 3 },
    'mosque': { category: 'culture', priority: 3 },
    'synagogue': { category: 'culture', priority: 3 },
    'hindu_temple': { category: 'culture', priority: 3 },
    
    // Generic types (lowest priority)
    'food': { category: 'restaurant', priority: 4 },
    'establishment': { category: 'other', priority: 5 },
    'point_of_interest': { category: 'other', priority: 5 }
  }
  
  // Find the best match with highest priority (lowest number)
  let bestMatch = { category: 'other', priority: 999 }
  
  for (const type of types) {
    const mapping = priorityMapping[type]
    if (mapping && mapping.priority < bestMatch.priority) {
      bestMatch = mapping
    }
  }
  
  console.log('Selected category:', bestMatch.category, 'from types:', types)
  return bestMatch.category
}

// Generate a description for the place based on its details
const generateDescription = (place: PlaceDetails): string => {
  // Return empty string so users can write their own personal recommendations
  return ''
}

// Extract city, country, and zip code from address
const extractCityCountryFromAddress = (address: string): { city: string, country: string, zip_code: string } => {
  console.log('Extracting location from address:', address)
  
  if (!address) {
    return { city: 'Unknown', country: 'Unknown', zip_code: '' }
  }
  
  // Split by commas and clean up
  const parts = address.split(',').map(part => part.trim())
  
  let city = 'Unknown'
  let country = 'Unknown'
  let zip_code = ''
  
  if (parts.length > 0) {
    // The last part is usually the country
    country = parts[parts.length - 1] || 'Unknown'
    
    // Look for zip code patterns in the address parts
    for (const part of parts) {
      // Common zip code patterns
      const zipPatterns = [
        /\b(\d{5})\b/, // US 5-digit zip (12345)
        /\b(\d{5}-\d{4})\b/, // US ZIP+4 (12345-6789)
        /\b([A-Z]\d[A-Z] \d[A-Z]\d)\b/, // Canadian postal code (A1A 1A1)
        /\b(\d{4,5})\s+([A-Za-z\s]+)$/, // European format (12345 City)
        /\b(\d{4})\s+([A-Za-z\s]+)$/, // 4-digit postal codes
        /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/, // UK postal code
      ]
      
      for (const pattern of zipPatterns) {
        const match = part.match(pattern)
        if (match) {
          zip_code = match[1]
          break
        }
      }
      
      if (zip_code) break
    }
    
    // Extract city - look for patterns like "12345 Berlin" or just city names
    for (let i = parts.length - 2; i >= 0; i--) {
      const part = parts[i]
      
      // Check if this part contains a zip code + city combination
      const zipCityMatch = part.match(/^(\d{4,5})\s+(.+)$/)
      if (zipCityMatch) {
        if (!zip_code) zip_code = zipCityMatch[1]
        city = zipCityMatch[2]
        break
      }
      
      // Check if this part is just a city name (no numbers at the start)
      if (!/^\d/.test(part) && part.length > 2) {
        city = part
        break
      }
    }
  }
  
  console.log('Extracted location:', { city, country, zip_code })
  return { city, country, zip_code }
}

// Extract business type from Google place types
const extractBusinessType = (types: string[]): string => {
  console.log('Extracting business type from types:', types)
  
  // Priority mapping for business types - more specific first
  const businessTypeMapping: { [key: string]: { type: string, priority: number } } = {
    // Specific venues (highest priority)
    'stadium': { type: 'Stadium', priority: 1 },
    'amusement_park': { type: 'Amusement Park', priority: 1 },
    'zoo': { type: 'Zoo', priority: 1 },
    'aquarium': { type: 'Aquarium', priority: 1 },
    'museum': { type: 'Museum', priority: 1 },
    'art_gallery': { type: 'Art Gallery', priority: 1 },
    'movie_theater': { type: 'Movie Theater', priority: 1 },
    'casino': { type: 'Casino', priority: 1 },
    'bowling_alley': { type: 'Bowling Alley', priority: 1 },
    
    // Food & Drink (high priority)
    'restaurant': { type: 'Restaurant', priority: 2 },
    'meal_takeaway': { type: 'Restaurant', priority: 2 },
    'meal_delivery': { type: 'Restaurant', priority: 2 },
    'cafe': { type: 'Café', priority: 2 },
    'bar': { type: 'Bar', priority: 2 },
    'night_club': { type: 'Nightclub', priority: 2 },
    
    // Shopping (medium priority)
    'shopping_mall': { type: 'Shopping Mall', priority: 3 },
    'clothing_store': { type: 'Clothing Store', priority: 3 },
    'electronics_store': { type: 'Electronics Store', priority: 3 },
    'book_store': { type: 'Bookstore', priority: 3 },
    'grocery_or_supermarket': { type: 'Supermarket', priority: 3 },
    'pharmacy': { type: 'Pharmacy', priority: 3 },
    
    // Services (medium priority)
    'lodging': { type: 'Hotel', priority: 3 },
    'hospital': { type: 'Hospital', priority: 3 },
    'doctor': { type: 'Medical Clinic', priority: 3 },
    'dentist': { type: 'Dental Clinic', priority: 3 },
    'bank': { type: 'Bank', priority: 3 },
    'gas_station': { type: 'Gas Station', priority: 3 },
    'car_rental': { type: 'Car Rental', priority: 3 },
    'gym': { type: 'Gym', priority: 3 },
    'spa': { type: 'Spa', priority: 3 },
    'beauty_salon': { type: 'Beauty Salon', priority: 3 },
    'hair_care': { type: 'Hair Salon', priority: 3 },
    
    // Transportation (medium priority)
    'subway_station': { type: 'Subway Station', priority: 3 },
    'bus_station': { type: 'Bus Station', priority: 3 },
    'airport': { type: 'Airport', priority: 3 },
    'train_station': { type: 'Train Station', priority: 3 },
    
    // Religious & Cultural (medium priority)
    'church': { type: 'Church', priority: 3 },
    'mosque': { type: 'Mosque', priority: 3 },
    'synagogue': { type: 'Synagogue', priority: 3 },
    'hindu_temple': { type: 'Temple', priority: 3 },
    'school': { type: 'School', priority: 3 },
    'university': { type: 'University', priority: 3 },
    'library': { type: 'Library', priority: 3 },
    
    // Nature (medium priority)
    'park': { type: 'Park', priority: 3 },
    
    // Generic types (low priority)
    'tourist_attraction': { type: 'Tourist Attraction', priority: 4 },
    'food': { type: 'Restaurant', priority: 4 },
    'store': { type: 'Store', priority: 4 },
    'atm': { type: 'ATM', priority: 4 },
    
    // Very generic (lowest priority)
    'establishment': { type: 'Business', priority: 5 },
    'point_of_interest': { type: 'Point of Interest', priority: 5 }
  }
  
  // Find the best match with highest priority (lowest number)
  let bestMatch = { type: 'Business', priority: 999 }
  
  for (const type of types) {
    const mapping = businessTypeMapping[type]
    if (mapping && mapping.priority < bestMatch.priority) {
      bestMatch = mapping
    }
  }
  
  console.log('Selected business type:', bestMatch.type, 'from types:', types)
  return bestMatch.type
}

// Import a single place from Google Maps URL
export const importSinglePlace = async (url: string): Promise<ImportedPlace> => {
  console.log('=== Starting importSinglePlace ===')
  console.log('Input URL:', url)
  
  try {
    // Check if this is a shortened URL that we should handle specially
    if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
      console.log('Detected shortened URL, using special handling')
      return await handleShortenedUrl(url)
    }
    
    // First, expand shortened URLs if needed (for other short URL formats)
    const expandedUrl = await expandShortenedUrl(url)
    console.log('Working with URL:', expandedUrl)
    
    // First try to extract place ID (for maximum accuracy)
    const placeId = extractPlaceId(expandedUrl)
    console.log('Extracted place ID:', placeId)
    
    if (placeId) {
      console.log('Place ID found, attempting to get place details...')
      
      try {
        // Validate place ID format before making API call
        if (placeId.length < 15) {
          console.warn('Place ID seems too short, might be invalid:', placeId)
          throw new Error('Place ID format appears invalid (too short)')
        }
        
        if (!/^[a-zA-Z0-9_-]+$/.test(placeId)) {
          console.warn('Place ID contains invalid characters:', placeId)
          throw new Error('Place ID format appears invalid (invalid characters)')
        }
        
        // Use Google Places API to get detailed information
        const placeDetails = await getPlaceDetails(placeId)
        console.log('Place details received:', placeDetails)
        
        // Extract coordinates properly (they are functions in Google Maps API)
        const latitude = typeof (placeDetails.geometry.location as any).lat === 'function' 
          ? (placeDetails.geometry.location as any).lat() 
          : (placeDetails.geometry.location as any).lat
        const longitude = typeof (placeDetails.geometry.location as any).lng === 'function' 
          ? (placeDetails.geometry.location as any).lng() 
          : (placeDetails.geometry.location as any).lng
        
        console.log('Extracted coordinates:', { latitude, longitude })
        
        // Extract city and country from address
        const addressInfo = extractCityCountryFromAddress(placeDetails.formatted_address)
        
        const result = {
          title: placeDetails.name,
          description: generateDescription(placeDetails),
          google_maps_url: url, // Keep original URL
          category: categorizePlace(placeDetails.types),
          latitude: latitude,
          longitude: longitude,
          place_id: placeDetails.place_id,
          rating: placeDetails.rating,
          rating_count: placeDetails.user_ratings_total,
          address: placeDetails.formatted_address,
          city: addressInfo.city,
          country: addressInfo.country,
          business_type: extractBusinessType(placeDetails.types),
          phone: placeDetails.formatted_phone_number,
          website: placeDetails.website,
          zip_code: addressInfo.zip_code,
          current_opening_hours: placeDetails.current_opening_hours,
          business_status: placeDetails.business_status,
          reviews: placeDetails.reviews,
          needs_manual_edit: false
        }
        
        console.log('Returning result from place ID:', result)
        return result
        
      } catch (apiError) {
        console.error('Google Places API error with place ID:', apiError)
        console.log('Falling back to text search method...')
        // Don't throw here, try the text search fallback below
      }
    }
    
    // Fallback 1: Try text search with place name
    console.log('Trying text search fallback...')
    const placeName = extractPlaceName(expandedUrl)
    console.log('Extracted place name:', placeName)
    
    if (placeName) {
      // Also try to get coordinates to improve search accuracy
      const coords = extractCoordinates(expandedUrl)
      console.log('Extracted coordinates for search bias:', coords)
      
      try {
        const searchCoords = (coords.latitude !== 0 || coords.longitude !== 0) 
          ? { lat: coords.latitude, lng: coords.longitude } 
          : undefined
          
        console.log('Attempting text search with:', { placeName, searchCoords })
        const placeDetails = await searchPlaceByName(placeName, searchCoords)
        console.log('Text search place details received:', placeDetails)
        
        // Extract coordinates properly (they are functions in Google Maps API)
        const latitude = typeof (placeDetails.geometry.location as any).lat === 'function' 
          ? (placeDetails.geometry.location as any).lat() 
          : (placeDetails.geometry.location as any).lat
        const longitude = typeof (placeDetails.geometry.location as any).lng === 'function' 
          ? (placeDetails.geometry.location as any).lng() 
          : (placeDetails.geometry.location as any).lng
        
        console.log('Text search extracted coordinates:', { latitude, longitude })
        
        // Extract city and country from address
        const addressInfo = extractCityCountryFromAddress(placeDetails.formatted_address)
        
        const result = {
          title: placeDetails.name,
          description: generateDescription(placeDetails),
          google_maps_url: url, // Keep original URL
          category: categorizePlace(placeDetails.types),
          latitude: latitude,
          longitude: longitude,
          place_id: placeDetails.place_id,
          rating: placeDetails.rating,
          rating_count: placeDetails.user_ratings_total,
          address: placeDetails.formatted_address,
          city: addressInfo.city,
          country: addressInfo.country,
          business_type: extractBusinessType(placeDetails.types),
          phone: placeDetails.formatted_phone_number,
          website: placeDetails.website,
          zip_code: addressInfo.zip_code,
          current_opening_hours: placeDetails.current_opening_hours,
          business_status: placeDetails.business_status,
          reviews: placeDetails.reviews,
          needs_manual_edit: false
        }
        
        console.log('Returning result from text search:', result)
        return result
        
      } catch (searchError) {
        console.error('Text search also failed:', searchError)
        // Continue to final fallback
      }
    }
    
    // Final fallback: coordinate extraction only
    console.log('All API methods failed, falling back to coordinate extraction')
    const coords = extractCoordinates(expandedUrl)
    console.log('Extracted coordinates:', coords)
    
    const fallbackResult = {
      title: 'Imported Place',
      description: '', // Leave empty for user input
      google_maps_url: url, // Keep original URL
      category: 'other',
      latitude: coords.latitude,
      longitude: coords.longitude,
      needs_manual_edit: true
    }
    
    console.log('Returning fallback result:', fallbackResult)
    return fallbackResult
    
  } catch (error) {
    console.error('Error in importSinglePlace:', error)
    
    // Final fallback to coordinate extraction
    const coords = extractCoordinates(url)
    console.log('Final fallback coordinates:', coords)
    
    const errorResult = {
      title: 'Imported Place',
      description: '', // Leave empty for user input
      google_maps_url: url,
      category: 'other',
      latitude: coords.latitude,
      longitude: coords.longitude,
      needs_manual_edit: true
    }
    
    console.log('Returning error fallback result:', errorResult)
    return errorResult
  }
}

// Export a pin pack to Google My Maps (for buyers)
export const exportToGoogleMyMaps = async (pinPack: any, pins: any[]): Promise<string> => {
  // Generate a KML file that users can import manually into Google My Maps
  const kml = generateKMLFile(pinPack, pins)
  
  // Create a download link for the KML file
  const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' })
  const url = URL.createObjectURL(blob)
  
  // Create a temporary link and trigger download
  const link = document.createElement('a')
  link.href = url
  link.download = `${pinPack.title.replace(/[^a-z0-9]/gi, '_')}.kml`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
  
  return 'KML file downloaded. You can import this into Google My Maps manually.'
}

// Generate KML file for Google My Maps import
const generateKMLFile = (pinPack: any, pins: any[]): string => {
  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${pinPack.title}</name>
    <description>${pinPack.description}</description>
    ${pins.map(pin => `
    <Placemark>
      <name>${pin.title || pin.name}</name>
      <description>${pin.description}</description>
      <Point>
        <coordinates>${pin.longitude},${pin.latitude},0</coordinates>
      </Point>
    </Placemark>`).join('')}
  </Document>
</kml>`
  
  return kml
}

// Extract place name from Google Maps URL for text search
export const extractPlaceName = (url: string): string | null => {
  console.log('Extracting place name from URL:', url)
  
  // Try different patterns to extract place name
  const patterns = [
    // Standard format: /place/Place+Name/@
    /\/place\/([^\/\@\?]+)/,
    
    // Expanded goo.gl format: /maps/place/Restaurant+Name/@
    /\/maps\/place\/([^\/\@\?]+)/,
    
    // Search format: /search/Restaurant+Name/
    /\/search\/([^\/\@\?]+)/,
    
    // Query parameter: ?q=Restaurant+Name
    /[?&]q=([^&]+)/,
    
    // Place query: /place/data=!3m1!4b1!4m5!3m4!1s0x123:0x456!8m2!3d48.123!4d2.456!16s%2Fg%2F11abc_def?entry=ttu
    // Try to extract from the URL structure
    /\/place\/[^\/]*\/data=.*!16s%2F[gm]%2F([^!?]+)/
  ]
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i]
    const match = url.match(pattern)
    if (match && match[1]) {
      // Clean and decode the place name
      let placeName = decodeURIComponent(match[1])
        .replace(/\+/g, ' ')  // Replace + with spaces
        .replace(/_/g, ' ')   // Replace _ with spaces
        .replace(/%20/g, ' ') // Replace URL encoded spaces
        .trim()
      
      // Skip if it's just numbers or very short
      if (placeName.length > 2 && !/^\d+$/.test(placeName)) {
        console.log(`Place name found using pattern ${i + 1}:`, placeName)
        return placeName
      }
    }
  }
  
  console.log('No place name found in URL')
  return null
}

// Search for place using Google Places Text Search API
export const searchPlaceByName = async (placeName: string, coordinates?: { lat: number, lng: number }): Promise<PlaceDetails> => {
  console.log('Searching for place by name:', placeName, 'near coordinates:', coordinates)
  
  await initializeGoogleMaps()
  
  return new Promise((resolve, reject) => {
    const service = new (window as any).google.maps.places.PlacesService(
      document.createElement('div')
    )
    
    const request: any = {
      query: placeName,
      fields: [
        'place_id',
        'name',
        'formatted_address',
        'geometry',
        'types',
        'rating',
        'user_ratings_total',
        'photos',
        'website',
        'formatted_phone_number',
        'opening_hours',
        'current_opening_hours',
        'website_uri',
        'reviews',
        'price_level',
        'business_status'
      ]
    }
    
    // If we have coordinates, use them to bias the search
    if (coordinates) {
      request.locationBias = {
        center: { lat: coordinates.lat, lng: coordinates.lng },
        radius: 1000 // 1km radius
      }
    }
    
    console.log('Making Text Search request with:', request)
    
    service.textSearch(request, (results: any[], status: any) => {
      console.log('Text Search response status:', status)
      console.log('Text Search response data:', results)
      
      if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        console.log('Text Search successful, using first result')
        resolve(results[0] as PlaceDetails)
      } else {
        console.error('Text Search failed with status:', status)
        
        let errorMessage = `Text search failed: ${status}`
        
        if (status === (window as any).google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          errorMessage = 'No places found with that name.'
        } else if (status === (window as any).google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
          errorMessage = 'API quota exceeded.'
        } else if (status === (window as any).google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
          errorMessage = 'API request denied. Check your API key.'
        }
        
        reject(new Error(errorMessage))
      }
    })
  })
}

// Expand shortened Google Maps URLs (goo.gl) to full URLs
export const expandShortenedUrl = async (url: string): Promise<string> => {
  console.log('Expanding shortened URL:', url)
  
  // Check if it's a shortened URL
  if (!url.includes('goo.gl') && !url.includes('maps.app.goo.gl')) {
    console.log('Not a shortened URL, returning as-is')
    return url
  }
  
  // For shortened URLs, we'll try a different approach
  // Since CORS prevents direct expansion, we'll use the Google Maps Embed API approach
  try {
    console.log('Attempting to resolve shortened URL using alternative method...')
    
    // Extract the short code from the URL
    const shortCodeMatch = url.match(/maps\.app\.goo\.gl\/([a-zA-Z0-9]+)/)
    if (shortCodeMatch && shortCodeMatch[1]) {
      const shortCode = shortCodeMatch[1]
      console.log('Extracted short code:', shortCode)
      
      // Try to construct a searchable query using the short code
      // This is a fallback approach when we can't expand the URL
      return url // Return original for now, we'll handle this in the import function
    }
    
    return url
    
  } catch (error) {
    console.error('Error with shortened URL processing:', error)
    return url
  }
}

// Special handling for shortened URLs that can't be expanded
export const handleShortenedUrl = async (url: string): Promise<ImportedPlace> => {
  console.log('=== Handling shortened URL specially ===')
  console.log('Shortened URL:', url)
  
  // Extract the short code
  const shortCodeMatch = url.match(/maps\.app\.goo\.gl\/([a-zA-Z0-9]+)/)
  if (!shortCodeMatch || !shortCodeMatch[1]) {
    throw new Error('Could not extract short code from URL')
  }
  
  const shortCode = shortCodeMatch[1]
  console.log('Short code:', shortCode)
  
  // Since we can't expand the URL directly, we'll ask the user to provide
  // the place name or we'll use a different approach
  return {
    title: 'Place from Shared Link',
    description: '', // Leave empty for user input
    google_maps_url: url,
    category: 'other',
    latitude: 0,
    longitude: 0,
    needs_manual_edit: true // Flag to indicate this needs manual editing
  }
}

// Temporary debugging function to test place ID extraction
export const debugPlaceIdExtraction = (url: string): void => {
  console.log('=== DEBUG PLACE ID EXTRACTION ===')
  console.log('Input URL:', url)
  
  // Test all place ID patterns individually
  const placeIdPatterns = [
    { name: 'Modern !1s pattern', regex: /!1s([a-zA-Z0-9_-]{20,})(?:[!&]|$)/ },
    { name: 'Data !1s pattern', regex: /data=.*!1s([a-zA-Z0-9_-]{20,})(?:[!&]|$)/ },
    { name: 'Legacy place_id', regex: /[?&]place_id=([a-zA-Z0-9_-]{20,})(?:[&]|$)/ },
    { name: 'Alternative place_id', regex: /place_id[=:]([a-zA-Z0-9_-]{20,})(?:[&!]|$)/ },
    { name: 'Data !4s pattern', regex: /data=.*!4s([a-zA-Z0-9_-]{20,})(?:[!&]|$)/ },
    { name: 'CID format pattern', regex: /!1s(0x[a-fA-F0-9]+:0x[a-fA-F0-9]+)(?:[!&]|$)/ },
    { name: 'Flexible !1s pattern', regex: /!1s([a-zA-Z0-9_:-]{15,})(?:[!&]|$)/ },
    { name: 'Direct path pattern', regex: /\/([a-zA-Z0-9_-]{20,})(?:\/|$)/ }
  ]
  
  console.log('--- TESTING PLACE ID PATTERNS ---')
  placeIdPatterns.forEach((pattern, index) => {
    const match = url.match(pattern.regex)
    if (match && match[1]) {
      console.log(`✓ Pattern ${index + 1} (${pattern.name}) found:`, match[1])
      
      // Test validation
      const id = match[1]
      const isCid = /^0x[a-fA-F0-9]+:0x[a-fA-F0-9]+$/.test(id)
      const isValid = id.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(id) && 
        ['ChIJ', 'GhIJ', 'EhIJ', 'EkIJ', 'ElIJ', 'EmIJ', 'EnIJ', 'ChAJ', 'GhAJ', 'EhAJ', 'EkAJ', 'ElAJ', 'EmAJ', 'EnAJ']
        .some(prefix => id.startsWith(prefix))
      
      console.log(`    - Length: ${id.length}`)
      console.log(`    - Is CID format: ${isCid}`)
      console.log(`    - Valid place ID: ${isValid}`)
      console.log(`    - Characters: ${id.split('').slice(0, 15).join('')}...`)
    } else {
      console.log(`✗ Pattern ${index + 1} (${pattern.name}): No match`)
    }
  })
  
  // Test place name extraction patterns
  console.log('--- TESTING PLACE NAME PATTERNS ---')
  const placeNamePatterns = [
    { name: 'Standard place format', regex: /\/place\/([^\/\@\?]+)/ },
    { name: 'Maps place format', regex: /\/maps\/place\/([^\/\@\?]+)/ },
    { name: 'Search format', regex: /\/search\/([^\/\@\?]+)/ },
    { name: 'Query parameter', regex: /[?&]q=([^&]+)/ },
    { name: 'Data structure', regex: /\/place\/[^\/]*\/data=.*!16s%2F[gm]%2F([^!?]+)/ }
  ]
  
  placeNamePatterns.forEach((pattern, index) => {
    const match = url.match(pattern.regex)
    if (match && match[1]) {
      let placeName = decodeURIComponent(match[1])
        .replace(/\+/g, ' ')
        .replace(/_/g, ' ')
        .trim()
      console.log(`✓ Place name pattern ${index + 1} (${pattern.name}) found:`, placeName)
    } else {
      console.log(`✗ Place name pattern ${index + 1} (${pattern.name}): No match`)
    }
  })
  
  // Test coordinate extraction
  console.log('--- TESTING COORDINATE PATTERNS ---')
  const coordPatterns = [
    { name: 'Standard @lat,lng', regex: /@(-?\d+\.?\d*),(-?\d+\.?\d*)/ },
    { name: '!3d!4d format', regex: /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/ },
    { name: 'Direct coordinates', regex: /(?:^|[^\d])(-?\d+\.\d+),(-?\d+\.\d+)(?:[^\d]|$)/ }
  ]
  
  coordPatterns.forEach((pattern, index) => {
    const match = url.match(pattern.regex)
    if (match && match[1] && match[2]) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      console.log(`✓ Coordinate pattern ${index + 1} (${pattern.name}) found:`, { lat, lng })
    } else {
      console.log(`✗ Coordinate pattern ${index + 1} (${pattern.name}): No match`)
    }
  })
  
  // Test final extraction functions
  console.log('--- TESTING EXTRACTION FUNCTIONS ---')
  const extractedPlaceId = extractPlaceId(url)
  const extractedPlaceName = extractPlaceName(url)
  const extractedCoords = extractCoordinates(url)
  
  console.log('Final extracted place ID:', extractedPlaceId)
  console.log('Final extracted place name:', extractedPlaceName)
  console.log('Final extracted coordinates:', extractedCoords)
  
  console.log('=== END DEBUG ===')
}

export default {
  initializeGoogleMaps,
  extractPlaceId,
  extractCoordinates,
  getPlaceDetails,
  importSinglePlace,
  exportToGoogleMyMaps,
  extractPlaceName,
  searchPlaceByName,
  expandShortenedUrl,
  handleShortenedUrl,
  debugPlaceIdExtraction
} 
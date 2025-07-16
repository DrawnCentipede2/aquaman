'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Plus, Trash2, Save, HelpCircle, Globe, Upload, Sparkles, Download, ExternalLink, Star, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { importSinglePlace, extractCoordinates, extractPlaceId } from '@/lib/googleMaps'
import { getAllCountries, getCitiesForCountry } from '@/lib/countries-cities'

// Interface for a single pin
interface Pin {
  title: string
  description: string
  google_maps_url: string
  category: string
  latitude: number
  longitude: number
  rating?: number
  rating_count?: number
  business_type?: string
  place_city?: string
  place_country?: string
  zip_code?: string
  address?: string
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
  photos?: string[]
  fetching?: boolean
  needs_manual_edit?: boolean
  // Completion tracking
  has_user_description?: boolean
  has_user_photo?: boolean
}

export default function CreatePackPage() {
  const router = useRouter()
  
  // State for the pin pack being created
  const [packTitle, setPackTitle] = useState('')
  const [packDescription, setPackDescription] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [price, setPrice] = useState('')
  
  // State for pins in the pack
  const [pins, setPins] = useState<Pin[]>([])
  
  // State for Google Maps list import
  const [googleMapsListUrl, setGoogleMapsListUrl] = useState('')
  const [singlePlaceUrl, setSinglePlaceUrl] = useState('')
  const [importedPlaces, setImportedPlaces] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  
  // State for storing the maps list reference for buyers
  const [mapsListReference, setMapsListReference] = useState<{
    original_url: string
    expanded_url: string
    title: string
  } | null>(null)
  
  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string>('')
  
  // State for completion error modal
  const [showCompletionError, setShowCompletionError] = useState<{
    show: boolean
    incompletePlaces: Array<{index: number, pin: Pin, missing: string[]}>
  }>({ show: false, incompletePlaces: [] })

  // Country and city dropdown state
  const [availableCountries, setAvailableCountries] = useState<string[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [filteredCountries, setFilteredCountries] = useState<string[]>([])
  const [filteredCities, setFilteredCities] = useState<string[]>([])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [countrySearchTerm, setCountrySearchTerm] = useState('')
  const [citySearchTerm, setCitySearchTerm] = useState('')
  
  // Keyboard navigation state
  const [selectedCountryIndex, setSelectedCountryIndex] = useState(-1)
  const [selectedCityIndex, setSelectedCityIndex] = useState(-1)
  const selectedCountryIndexRef = useRef(-1)
  const selectedCityIndexRef = useRef(-1)
  
  // Dropdown container refs for auto-scrolling
  const countryDropdownRef = useRef<HTMLDivElement>(null)
  const cityDropdownRef = useRef<HTMLDivElement>(null)

  // Load countries and cities data on component mount
  useEffect(() => {
    const countries = getAllCountries()
    setAvailableCountries(countries)
    setFilteredCountries(countries)
  }, [])

  // Helper function to check if a place is complete
  const isPlaceComplete = (pin: Pin): boolean => {
    const hasDescription = !!(pin.description && pin.description.trim().length > 0)
    const hasPhoto = !!(pin.photos && pin.photos.length > 0)
    return hasDescription && hasPhoto
  }

  // Helper function to get incomplete places
  const getIncompletePlaces = (): Array<{index: number, pin: Pin, missing: string[]}> => {
    return pins.map((pin, index) => {
      const missing: string[] = []
      if (!pin.description || pin.description.trim().length === 0) {
        missing.push('description')
      }
      if (!pin.photos || pin.photos.length === 0) {
        missing.push('photo')
      }
      return { index, pin, missing }
    }).filter(item => item.missing.length > 0)
  }

  // Helper function to get completion stats
  const getCompletionStats = () => {
    const total = pins.length
    const complete = pins.filter(isPlaceComplete).length
    return { complete, total, percentage: total > 0 ? (complete / total) * 100 : 0 }
  }

  // Sync refs with state for keyboard navigation and auto-scroll
  useEffect(() => {
    selectedCountryIndexRef.current = selectedCountryIndex
    
    // Auto-scroll the selected country item into view
    if (selectedCountryIndex >= 0 && countryDropdownRef.current) {
      const dropdown = countryDropdownRef.current
      const selectedButton = dropdown.children[selectedCountryIndex] as HTMLElement
      if (selectedButton) {
        selectedButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }
    }
  }, [selectedCountryIndex])

  useEffect(() => {
    selectedCityIndexRef.current = selectedCityIndex
    
    // Auto-scroll the selected city item into view
    if (selectedCityIndex >= 0 && cityDropdownRef.current) {
      const dropdown = cityDropdownRef.current
      const selectedButton = dropdown.children[selectedCityIndex] as HTMLElement
      if (selectedButton) {
        selectedButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }
    }
  }, [selectedCityIndex])

  // Check for authenticated user or redirect to sign in
  useEffect(() => {
    const checkAuth = () => {
      // Check if user is authenticated via new email system
      const userProfile = localStorage.getItem('pinpacks_user_profile')
      const savedUserId = localStorage.getItem('pinpacks_user_id')
      
      if (userProfile) {
        // User is authenticated via email system
        const profile = JSON.parse(userProfile)
        setUserId(profile.userId)
        console.log('Authenticated user found:', profile.email)
      } else if (savedUserId) {
        // User has old system ID - still allow them to use it
        setUserId(savedUserId)
        console.log('Legacy user found:', savedUserId)
      } else {
        // No authentication found - redirect to sign in
        console.log('No authentication found, redirecting to auth')
        window.location.href = '/auth'
        return
      }
    }
    
    checkAuth()
  }, [])

  // Load pins from localStorage when component mounts
  useEffect(() => {
    const loadPinsFromStorage = () => {
      try {
        // Check if user just created a pack successfully
        const packJustCreated = localStorage.getItem('pinpacks_pack_just_created')
        if (packJustCreated) {
          // Clear the flag and don't load any pins
          localStorage.removeItem('pinpacks_pack_just_created')
          localStorage.removeItem('pinpacks_create_pins')
          localStorage.removeItem('pinpacks_create_pack_details')
          console.log('🧹 Detected pack was just created, clearing all data for fresh start')
          return
        }

        const savedPins = localStorage.getItem('pinpacks_create_pins')
        if (savedPins) {
          const pins: Pin[] = JSON.parse(savedPins)
          setPins(pins)
          console.log(' Loaded pins from localStorage:', pins.length, pins.map(p => p.title || 'Untitled'))
        } else {
          console.log('ℹ️ No saved pins found in localStorage')
        }
      } catch (error) {
        console.error('❌ Error loading pins from localStorage:', error)
      }
    }

    loadPinsFromStorage()
  }, [])

  // Load pack details from localStorage when component mounts
  useEffect(() => {
    const loadPackDetailsFromStorage = () => {
      try {
        const savedPackDetails = localStorage.getItem('pinpacks_create_pack_details')
        if (savedPackDetails) {
          const details = JSON.parse(savedPackDetails)
          
          // Load pack details
          if (details.packTitle) setPackTitle(details.packTitle)
          if (details.packDescription) setPackDescription(details.packDescription)
          if (details.price) setPrice(details.price)
          if (details.country) {
            setCountry(details.country)
            // Load cities for the saved country
            const cities = getCitiesForCountry(details.country)
            setAvailableCities(cities)
            setFilteredCities(cities)
          }
          if (details.city) setCity(details.city)
          
          // Load maps list reference if it exists
          if (details.mapsListReference) {
            setMapsListReference(details.mapsListReference)
          }
          
          console.log(' Loaded pack details from localStorage:', details)
        } else {
          console.log('ℹ️ No saved pack details found in localStorage')
        }
      } catch (error) {
        console.error('❌ Error loading pack details from localStorage:', error)
      }
    }

    loadPackDetailsFromStorage()
  }, [])

  // Save pack details to localStorage whenever they change
  useEffect(() => {
    const savePackDetailsToStorage = () => {
      try {
        const packDetails = {
          packTitle,
          packDescription,
          price,
          country,
          city,
          mapsListReference
        }
        
        localStorage.setItem('pinpacks_create_pack_details', JSON.stringify(packDetails))
        console.log('💾 Saved pack details to localStorage')
      } catch (error) {
        console.error('❌ Error saving pack details to localStorage:', error)
      }
    }

    // Only save if we have some meaningful data
    if (packTitle || packDescription || price || country || city || mapsListReference) {
      savePackDetailsToStorage()
    }
  }, [packTitle, packDescription, price, country, city, mapsListReference])

  // Function to validate single place URLs and provide helpful guidance
  const validateSinglePlaceUrl = (url: string): { isValid: boolean; errorMessage?: string; guidance?: string; warning?: string } => {
    // Check if it's a Google Maps list URL (which we don't want for single places)
    const isListUrl = url.includes('/lists/') || 
                     url.includes('list/') ||
                     url.includes('/maps/list/')
    
    if (isListUrl) {
      return {
        isValid: false,
        errorMessage: 'This is a Google Maps List URL',
        guidance: `This URL appears to be a Google Maps list or collection, not a single place.

How to get the correct URL:
1. Go to Google Maps
2. Search for the specific place you want
3. Click on the place name/listing (not a list)
4. Click "Share" and copy the link
5. The URL should look like: https://maps.app.goo.gl/... or https://maps.google.com/maps?cid=...

For Google Maps lists, use the "Google Maps List URL" field above instead.`
      }
    }
    
    // Check if it's a valid Google Maps place URL
    const isValidGoogleMapsUrl = 
      url.includes('maps.google.com') ||
      url.includes('goo.gl') ||
      url.includes('maps.app.goo.gl') ||
      url.includes('google.com/maps') ||
      url.includes('maps.google.') ||
      url.includes('plus.codes') ||
      (url.includes('@') && url.includes('google.')) ||
      url.includes('/maps/place/') ||
      url.includes('/maps?') ||
      (url.includes('google.') && url.includes('/maps'))

    if (!isValidGoogleMapsUrl) {
      return {
        isValid: false,
        errorMessage: 'Not a valid Google Maps URL',
        guidance: `This doesn't appear to be a Google Maps URL.

How to get the correct URL:
1. Go to Google Maps (maps.google.com)
2. Search for the place you want to add
3. Click on the place name/listing
4. Click the "Share" button
5. Click "Copy link"
6. Paste the URL here

The URL should start with:
• https://maps.app.goo.gl/ (recommended)
• https://maps.google.com/
• https://goo.gl/maps/
• https://www.google.com/maps/`
      }
    }
    
    // Check for search URLs (which are not single places)
    const isSearchUrl = url.includes('/maps/search/') || 
                       url.includes('?q=') ||
                       url.includes('search?')
    
    if (isSearchUrl) {
      return {
        isValid: false,
        errorMessage: 'This is a search URL, not a specific place',
        guidance: `This URL appears to be a search result, not a specific place.

How to get the correct URL:
1. In Google Maps, search for your place
2. From the search results, click on the specific place name
3. Make sure you're on the place's detail page (not search results)
4. Click "Share" and copy the link
5. The URL should show the place name, not search terms

You need to click on the actual place listing, not stay on the search page.`
      }
    }
    
    // Check if it's the preferred browser URL format (works best with API)
    const isBrowserUrl = url.includes('/place/') && url.includes('@') && url.includes('data=!')
    
    if (isBrowserUrl) {
      // This is the preferred format - works best with Google Maps API
      return { isValid: true }
    }
    
    // Check if it's a shortened URL that might not work as well
    const isShortenedUrl = url.includes('goo.gl') || url.includes('maps.app.goo.gl')
    
    if (isShortenedUrl) {
      return {
        isValid: true,
        warning: `For best results, use the browser URL format

While this URL will work, for more reliable data fetching:

1. Open this place in Google Maps
2. Copy the URL from your browser's address bar (not the Share button)
3. Use that URL instead

The browser URL format provides more detailed information.`
      }
    }
    
    return { isValid: true }
  }

  const addSinglePlace = async () => {
    if (!singlePlaceUrl) {
      console.log('No place URL provided')
      return
    }

    // Check if Google Maps list URL has been added first
    if (!mapsListReference) {
      console.log('Maps list reference required before adding individual places')
      return
    }

    setIsImporting(true)
    
    try {
      // Validate the URL first
      const validation = validateSinglePlaceUrl(singlePlaceUrl)
      
      if (!validation.isValid) {
        console.log('Invalid URL:', validation.errorMessage)
        return
      }

      // Import single place using the enhanced API integration
      try {
        const importedPlace = await importSinglePlace(singlePlaceUrl)
        
        // Check for duplicates before adding
        const isDuplicate = pins.some(existingPin => {
          // Check by Google Maps URL (most reliable)
          if (existingPin.google_maps_url === importedPlace.google_maps_url) {
            return true
          }
          
          // Check by coordinates (in case URLs are different but same place)
          const coordsMatch = Math.abs(existingPin.latitude - importedPlace.latitude) < 0.0001 && 
                             Math.abs(existingPin.longitude - importedPlace.longitude) < 0.0001
          
          return coordsMatch
        })
        
        if (isDuplicate) {
          console.log(`Duplicate place: "${importedPlace.title}" is already in pack`)
          return
        }
        
        // Map the imported place to our Pin interface
        const newPin: Pin = {
          title: importedPlace.title,
          description: importedPlace.description,
          google_maps_url: importedPlace.google_maps_url,
          category: importedPlace.category,
          latitude: importedPlace.latitude,
          longitude: importedPlace.longitude,
          rating: importedPlace.rating,
          rating_count: importedPlace.rating_count,
          business_type: importedPlace.business_type,
          place_city: importedPlace.city,
          place_country: importedPlace.country,
          zip_code: importedPlace.zip_code,
          address: importedPlace.address,
          phone: importedPlace.phone,
          website: importedPlace.website,
          current_opening_hours: importedPlace.current_opening_hours,
          business_status: importedPlace.business_status,
          reviews: importedPlace.reviews,
          needs_manual_edit: importedPlace.needs_manual_edit
        }
        
        // Add the imported place to our pins
        setPins(currentPins => [...currentPins, newPin])
        
        console.log(`Successfully imported "${importedPlace.title}"`)
      } catch (apiError) {
        console.warn('API import failed, falling back to basic method:', apiError)
        
        // Fallback to basic coordinate extraction
        const coords = extractCoordinates(singlePlaceUrl)
        
        const basicPin: Pin = {
          title: 'Imported Place',
          description: '',
          google_maps_url: singlePlaceUrl,
          category: 'other',
          latitude: coords.latitude,
          longitude: coords.longitude
        }
        
        setPins(currentPins => [...currentPins, basicPin])
        console.log('Place imported with basic details')
      }
      
      // Clear the URL field
      setSinglePlaceUrl('')
      
    } catch (err) {
      console.error('Import error:', err)
    } finally {
      setIsImporting(false)
    }
  }

  // Enhanced function to import maps list URLs as references for buyers
  const importFromGoogleMapsList = async () => {
    if (!googleMapsListUrl) {
      console.log('No Google Maps list URL provided')
      return
    }

    setIsImporting(true)
    
    try {
      // Validate that it's a Google Maps URL
      const isValidGoogleMapsUrl = 
        googleMapsListUrl.includes('maps.google.com') ||
        googleMapsListUrl.includes('goo.gl') ||
        googleMapsListUrl.includes('maps.app.goo.gl') ||
        googleMapsListUrl.includes('google.com/maps') ||
        googleMapsListUrl.includes('maps.google.') ||
        (googleMapsListUrl.includes('google.') && googleMapsListUrl.includes('/maps'))

      if (!isValidGoogleMapsUrl) {
        throw new Error('Please enter a valid Google Maps URL')
      }

      // Validate and check if it's a maps list
      const validation = await validateMapsListUrl(googleMapsListUrl)
      
      if (!validation.is_list) {
        console.log('URL is not a valid Google Maps list')
        return
      }

      // Store the maps list reference
      setMapsListReference({
        original_url: googleMapsListUrl,
        expanded_url: validation.expanded_url,
        title: validation.title
      })

      console.log(`Maps list added successfully: ${validation.title}`)
      
      // Clear the URL field
      setGoogleMapsListUrl('')
      
    } catch (err) {
      console.error('Maps list import error:', err)
    } finally {
      setIsImporting(false)
    }
  }

  // Handle edit requests
  const handleEditRequest = (field: string, currentValue: string, requestedValue: string) => {
    // For now, we'll just log the edit request and show confirmation
    // In a real app, you'd send this to your backend for review
    console.log('Edit request:', { field, currentValue, requestedValue })
    
    // Show confirmation to user
    alert(
      `Edit Request Submitted! 📝\n\n` +
      `Field: ${field}\n` +
      `Current: ${currentValue}\n` +
      `Requested: ${requestedValue}\n\n` +
      `Your request will be reviewed and applied if approved.\n\n` +
      `Note: In a production app, this would be saved to the database for admin review.`
    )
    
    // TODO: Implement database storage for edit requests
    // This would require:
    // 1. Finding the pin_id for the place being edited
    // 2. Saving to place_edit_requests table:
    /*
    const editRequestData = {
      pin_id: pinId, // Need to determine this
      user_id: userId,
      field_name: field,
      current_value: currentValue,
      requested_value: requestedValue,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    
    await supabase
      .from('place_edit_requests')
      .insert([editRequestData])
    */
  }

  // Function to extract coordinates from Google Maps URL
  const extractCoordinates = (url: string) => {
    console.log('Extracting coordinates from URL:', url)
    
    try {
      // Multiple patterns to match different Google Maps URL formats
      const patterns = [
        // Standard @lat,lng format (most common)
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // Place ID format with coordinates (!3d and !4d)
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
        // Direct coordinates in URL (lat,lng format)
        /(?:^|[^\d])(-?\d+\.\d+),(-?\d+\.\d+)(?:[^\d]|$)/,
        // Query parameter format (?q=lat,lng)
        /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // Center parameter format
        /[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // Location parameter format
        /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/
      ]
      
      for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) {
          const lat = parseFloat(match[1])
          const lng = parseFloat(match[2])
          
          // Validate coordinates are within reasonable ranges
          if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            console.log('Found coordinates:', { latitude: lat, longitude: lng })
            return { latitude: lat, longitude: lng }
          }
        }
      }
      
      console.log('No coordinates found in URL, using default')
      return { latitude: 0, longitude: 0 }
    } catch (err) {
      console.error('Error extracting coordinates:', err)
      return { latitude: 0, longitude: 0 }
    }
  }

  // Function to fetch place information from Google Maps URL
  const fetchPlaceInfo = async (index: number, url: string) => {
    if (!url.trim()) {
      console.log('No Google Maps URL provided')
      return
    }

    // Set loading state
    updatePin(index, { fetching: true })

    try {
      console.log('=== DEBUG: Starting fetchPlaceInfo ===')
      console.log('URL:', url)
      
      // Check for shortened URLs
      if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
        console.log('Shortened URL detected, proceeding with limited information')
      }
      
      // Use the existing importSinglePlace function
      console.log('=== DEBUG: Calling importSinglePlace ===')
      const placeInfo = await importSinglePlace(url)
      
      console.log('=== DEBUG: Fetched place info ===', placeInfo)
      
      // Use the city and country from the enhanced fetch, fallback to address parsing
      let city = placeInfo.city || ''
      let country = placeInfo.country || ''
      
      // Fallback to manual parsing if not provided
      if (!city || !country) {
        if (placeInfo.address) {
          const addressParts = placeInfo.address.split(',').map(part => part.trim())
          if (addressParts.length >= 2) {
            city = city || addressParts[addressParts.length - 3] || addressParts[0] || ''
            country = country || addressParts[addressParts.length - 1] || ''
          }
        }
      }
      
      // Update the pin with fetched information
      const updatedPin = {
        title: placeInfo.title || '',
        category: placeInfo.category || 'restaurant',
        latitude: placeInfo.latitude || 0,
        longitude: placeInfo.longitude || 0,
        rating: placeInfo.rating || undefined,
        rating_count: placeInfo.rating_count || undefined,
        business_type: placeInfo.business_type || undefined,
        place_city: city,
        place_country: country,
        google_maps_url: url,
        fetching: false
      }
      
      console.log('=== DEBUG: Updating pin with ===', updatedPin)
      updatePin(index, updatedPin)

      // Log success based on the type of URL and data fetched
      if (placeInfo.needs_manual_edit) {
        console.log('Place added with limited information from shortened URL')
      } else {
        console.log(`Place information fetched successfully: ${placeInfo.title || 'Unknown place'}`)
      }
      
    } catch (error) {
      console.error('=== DEBUG: Error in fetchPlaceInfo ===', error)
      
      // Fallback to basic coordinate extraction
      const coords = extractCoordinates(url)
      updatePin(index, {
        google_maps_url: url,
        latitude: coords.latitude,
        longitude: coords.longitude,
        fetching: false
      })
      
      console.log('Could not fetch detailed place information, using basic coordinates')
    }
  }

  // Note: addPin function removed - users can only add places via Google Maps URL import

  // Function to remove a pin
  const removePin = (index: number) => {
    setPins(pins.filter((_, i) => i !== index))
  }

  // Function to update a pin
  const updatePin = (index: number, updatedPin: Partial<Pin>) => {
    const newPins = [...pins]
    newPins[index] = { ...newPins[index], ...updatedPin }
    setPins(newPins)
    
    // Save to localStorage so individual place pages can access the data
    try {
      localStorage.setItem('pinpacks_create_pins', JSON.stringify(newPins))
    } catch (error) {
      console.error('Error saving pins to localStorage:', error)
    }
  }

  // Save pins to localStorage whenever pins change (but not on initial load)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  useEffect(() => {
    if (isInitialLoad) {
      setIsInitialLoad(false)
      return // Don't save on initial mount
    }
    
    try {
      localStorage.setItem('pinpacks_create_pins', JSON.stringify(pins))
      console.log('💾 Saved pins to localStorage:', pins.length, pins.map(p => p.title || 'Untitled'))
    } catch (error) {
      console.error('❌ Error saving pins to localStorage:', error)
    }
  }, [pins, isInitialLoad])

  // Function to create the pin pack
  const createPinPack = async () => {
    if (!packTitle.trim() || !city.trim() || !country.trim() || pins.length === 0) {
      console.log('Missing required fields or no pins added')
      return
    }

    // Check if all places are complete (have description and photo)
    const incompletePlaces = getIncompletePlaces()
    if (incompletePlaces.length > 0) {
      const incompleteList = incompletePlaces.map(item => {
        const placeName = item.pin.title || `Place ${item.index + 1}`
        const missingItems = item.missing.join(' and ')
        return `• ${placeName}: missing ${missingItems}`
      }).join('\n')
      
      console.log('Incomplete places found:', incompletePlaces)
      
      // Show completion error modal instead of alert
      setShowCompletionError({
        show: true,
        incompletePlaces: incompletePlaces
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Create pin pack data
      const pinPackData = {
        title: packTitle.trim(),
        description: packDescription.trim(),
        city: city.trim(),
        country: country.trim(),
        price: price === '' ? 0 : Number(price),
        creator_id: userId,
        pin_count: pins.length,
        maps_list_reference: mapsListReference ? JSON.stringify(mapsListReference) : null,
        created_at: new Date().toISOString()
      }

      console.log('Creating pin pack:', pinPackData)

      // Insert pin pack
      const { data: packResponse, error: packError } = await supabase
        .from('pin_packs')
        .insert([pinPackData])
        .select()

      if (packError) {
        console.error('Error creating pin pack:', packError)
        throw packError
      }

      const newPackId = packResponse[0].id
      console.log('Pin pack created with ID:', newPackId)

      // Insert pins first (without pack_id since it's not in the schema)
      const pinData = pins.map(pin => ({
        title: pin.title.trim(),
        description: pin.description.trim(),
        google_maps_url: pin.google_maps_url.trim(),
        category: pin.category,
        latitude: pin.latitude,
        longitude: pin.longitude,
        
        // Enhanced place information
        address: pin.address || null,
        city: pin.place_city || null,
        country: pin.place_country || null,
        zip_code: pin.zip_code || null,
        business_type: pin.business_type || null,
        phone: pin.phone || null,
        website: pin.website || null,
        rating: pin.rating || null,
        rating_count: pin.rating_count || null,
        business_status: pin.business_status || null,
        current_opening_hours: pin.current_opening_hours || null,
        reviews: pin.reviews || null,
        needs_manual_edit: pin.needs_manual_edit || false,
        
        // Include photos array (now supported by database)
        photos: pin.photos || [],
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      console.log('Creating pins:', pinData)

      const { data: createdPins, error: pinsError } = await supabase
        .from('pins')
        .insert(pinData)
        .select()

      if (pinsError) {
        console.error('Error creating pins:', pinsError)
        throw pinsError
      }

      console.log('Pins created:', createdPins)

      // Now create the relationships in pin_pack_pins junction table
      const relationshipData = createdPins.map(pin => ({
        pin_pack_id: newPackId,
        pin_id: pin.id,
        created_at: new Date().toISOString()
      }))

      console.log('Creating pin-pack relationships:', relationshipData)

      const { error: relationshipError } = await supabase
        .from('pin_pack_pins')
        .insert(relationshipData)

      if (relationshipError) {
        console.error('Error creating pin-pack relationships:', relationshipError)
        throw relationshipError
      }

      // Clear form and localStorage first (before showing alert)
      setPackTitle('')
      setPackDescription('')
      setCity('')
      setCountry('')
      setPrice('')
      setPins([])
      setMapsListReference(null)
      
      // Clear localStorage and set flag for next visit
      try {
        localStorage.removeItem('pinpacks_create_pack_details')
        localStorage.removeItem('pinpacks_create_pins')
        localStorage.setItem('pinpacks_pack_just_created', 'true')
        console.log('🧹 Cleared localStorage after successful pack creation and set flag for next visit')
      } catch (error) {
        console.error('❌ Error clearing localStorage:', error)
      }
      
      console.log('Pin pack created successfully')
      
      // Use router.push instead of window.location.href for better navigation
      router.push('/manage')
      
    } catch (err) {
      console.error('Error creating pin pack:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

    // Handle country search/filter
  const handleCountrySearch = (searchTerm: string) => {
    setCountrySearchTerm(searchTerm)
    setSelectedCountryIndex(-1) // Reset selection when typing
    
    // If user starts typing, clear the selected country to allow editing
    if (country && searchTerm !== country) {
      setCountry('')
      setCity('') // Also clear city when country changes
      setCitySearchTerm('')
      setAvailableCities([])
      setFilteredCities([])
    }
    
    // If user clears the field completely, reset everything
    if (!searchTerm.trim()) {
      setFilteredCountries(availableCountries)
      if (country) {
        setCountry('')
        setCity('')
        setCitySearchTerm('')
        setAvailableCities([])
        setFilteredCities([])
      }
    } else {
      const filtered = availableCountries.filter(country =>
        country.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCountries(filtered)
    }
    
    if (!showCountryDropdown) {
      setShowCountryDropdown(true)
    }
  }

  // Handle city search/filter
  const handleCitySearch = (searchTerm: string) => {
    setCitySearchTerm(searchTerm)
    setSelectedCityIndex(-1) // Reset selection when typing
    
    // If user starts typing, clear the selected city to allow editing
    if (city && searchTerm !== city) {
      setCity('')
    }
    
    // If user clears the field completely, reset city
    if (!searchTerm.trim()) {
      setFilteredCities(availableCities)
      if (city) {
        setCity('')
      }
    } else {
      const filtered = availableCities.filter(city =>
        city.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCities(filtered)
    }
    
    if (!showCityDropdown && availableCities.length > 0) {
      setShowCityDropdown(true)
    }
  }

  // Handle country selection and update available cities
  const handleCountrySelect = (selectedCountry: string) => {
    setCountry(selectedCountry)
    setCountrySearchTerm('') // Clear search term
    setSelectedCountryIndex(-1) // Reset selection
    setCity('') // Reset city when country changes  
    setCitySearchTerm('') // Clear city search term
    setSelectedCityIndex(-1) // Reset city selection
    setShowCountryDropdown(false)
    
    // Load cities for the selected country
    const cities = getCitiesForCountry(selectedCountry)
    setAvailableCities(cities)
    setFilteredCities(cities)
  }

  // Handle city selection
  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity)
    setCitySearchTerm('') // Clear search term
    setSelectedCityIndex(-1) // Reset selection
    setShowCityDropdown(false)
  }

  // Handle country keyboard navigation
  const handleCountryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isDropdownVisible = showCountryDropdown
    const suggestionsCount = filteredCountries.length

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (isDropdownVisible && suggestionsCount > 0) {
        const currentIndex = selectedCountryIndexRef.current === -1 ? -1 : selectedCountryIndexRef.current
        const newIndex = currentIndex < suggestionsCount - 1 ? currentIndex + 1 : 0
        setSelectedCountryIndex(newIndex)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (isDropdownVisible && suggestionsCount > 0) {
        const currentIndex = selectedCountryIndexRef.current === -1 ? suggestionsCount : selectedCountryIndexRef.current
        const newIndex = currentIndex > 0 ? currentIndex - 1 : suggestionsCount - 1
        setSelectedCountryIndex(newIndex)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (isDropdownVisible && suggestionsCount > 0 && selectedCountryIndexRef.current >= 0) {
        const selectedCountry = filteredCountries[selectedCountryIndexRef.current]
        handleCountrySelect(selectedCountry)
      }
    } else if (e.key === 'Escape') {
      setShowCountryDropdown(false)
      setSelectedCountryIndex(-1)
    }
  }

  // Handle city keyboard navigation
  const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isDropdownVisible = showCityDropdown
    const suggestionsCount = filteredCities.length

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (isDropdownVisible && suggestionsCount > 0) {
        const currentIndex = selectedCityIndexRef.current === -1 ? -1 : selectedCityIndexRef.current
        const newIndex = currentIndex < suggestionsCount - 1 ? currentIndex + 1 : 0
        setSelectedCityIndex(newIndex)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (isDropdownVisible && suggestionsCount > 0) {
        const currentIndex = selectedCityIndexRef.current === -1 ? suggestionsCount : selectedCityIndexRef.current
        const newIndex = currentIndex > 0 ? currentIndex - 1 : suggestionsCount - 1
        setSelectedCityIndex(newIndex)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (isDropdownVisible && suggestionsCount > 0 && selectedCityIndexRef.current >= 0) {
        const selectedCity = filteredCities[selectedCityIndexRef.current]
        handleCitySelect(selectedCity)
      }
    } else if (e.key === 'Escape') {
      setShowCityDropdown(false)
      setSelectedCityIndex(-1)
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.country-dropdown')) {
        setShowCountryDropdown(false)
        setSelectedCountryIndex(-1) // Reset selection
        if (!country) {
          setCountrySearchTerm('') // Clear search if no country selected
        }
      }
      if (!target.closest('.city-dropdown')) {
        setShowCityDropdown(false)
        setSelectedCityIndex(-1) // Reset selection
        if (!city) {
          setCitySearchTerm('') // Clear search if no city selected
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [country, city])

  // Function to validate maps list URLs (simplified approach)
  const validateMapsListUrl = async (url: string): Promise<{expanded_url: string, is_list: boolean, title: string}> => {
    try {
      // First, check if it's a full URL that clearly contains list indicators
      const isFullListUrl = url.includes('/lists/') || 
                           url.includes('list/') ||
                           url.includes('/maps/list/')
      
      if (isFullListUrl) {
        // For full list URLs, we can be confident it's a list
        let title = 'Google Maps List'
        const listMatch = url.match(/lists\/([^\/\?&]+)/)
        if (listMatch) {
          title = `Maps List ${listMatch[1].substring(0, 10)}...`
        }
        
        return {
          expanded_url: url,
          is_list: true,
          title: title
        }
      }
      
      // Check for Google Maps URLs with encoded data (potential lists/collections)
      const hasEncodedData = url.includes('google.') && 
                             url.includes('/maps') && 
                             url.includes('data=!') &&
                             (url.includes('!2s') || url.includes('!4m')) // Common patterns in list URLs
      
      if (hasEncodedData) {
        // This might be a Google Maps list/collection with encoded data
        return {
          expanded_url: url,
          is_list: true,
          title: 'Google Maps Collection (Encoded)'
        }
      }
      
      // For shortened URLs, we'll use a client-side redirect check
      const isShortenedGoogleMaps = (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) &&
                                   (url.includes('google') || url.includes('maps'))
      
      if (isShortenedGoogleMaps) {
        // Try to check if it redirects to a list by making a fetch request
        // This might work in some cases, but we'll handle failures gracefully
        try {
          const response = await fetch(url, { 
            method: 'HEAD', 
            mode: 'no-cors' // This avoids CORS but limits what we can see
          })
          
          // Even with no-cors, we can't access the response, but if it doesn't throw, it's valid
          return {
            expanded_url: url, // Keep original URL since we can't see the redirect
            is_list: true, // Assume shortened Google Maps URLs could be lists
            title: 'Google Maps List (Shortened)'
          }
        } catch (fetchError) {
          // If fetch fails, still allow it but with a note
          return {
            expanded_url: url,
            is_list: true, // Assume it's valid
            title: 'Google Maps List (Shortened)'
          }
        }
      }
      
      // If it's not recognizable as a Google Maps URL, reject it
      throw new Error('Not a valid Google Maps list URL')
      
    } catch (error) {
      console.error('Error validating URL:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gray-25">
      <div 
        className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 ${
          showCompletionError.show ? 'pointer-events-none' : ''
        }`}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-500 mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Create Your Pin Pack
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Share your favorite local spots with travelers around the world
          </p>

        </div>

        {/* Main Form */}
        <div className="space-y-8">
          {/* Pack Details Card - Now includes Add Place functionality */}
          <div className="card-airbnb p-8">
            <div className="flex items-center mb-6">
              <Globe className="h-6 w-6 text-coral-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Pack Details</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Pack Title *
                </label>
                <input
                  type="text"
                  value={packTitle}
                  onChange={(e) => setPackTitle(e.target.value)}
                  placeholder="Best coffee shops in Barcelona"
                  className="input-airbnb w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Price (EUR)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => {
                    const inputValue = e.target.value
                    // Allow empty string or valid numbers up to 10
                    if (inputValue === '' || (Number(inputValue) >= 0 && Number(inputValue) <= 10)) {
                      setPrice(inputValue)
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent entering letters, 'e', '+', '-' and other non-numeric characters
                    if (
                      !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End', 'ArrowLeft', 'ArrowRight', 'Clear', 'Copy', 'Paste'].includes(e.key) &&
                      !e.ctrlKey && 
                      !e.metaKey &&
                      (e.key.length === 1 && !/[0-9]/.test(e.key))
                    ) {
                      e.preventDefault()
                    }
                  }}
                  min="0"
                  max="10"
                  step="1"
                  placeholder="0"
                  className="input-airbnb w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum price is €10</p>
              </div>

              {/* Country dropdown with search */}
              <div className="relative country-dropdown">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Country *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={countrySearchTerm || country}
                    onChange={(e) => handleCountrySearch(e.target.value)}
                    onKeyDown={handleCountryKeyDown}
                    onFocus={() => {
                      setShowCountryDropdown(true)
                      // Always show all countries when focusing, regardless of current state
                      setFilteredCountries(availableCountries)
                    }}
                    placeholder="Start typing to search countries..."
                    className="input-airbnb w-full pr-10"
                  />
                  <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                </div>
                {/* Country dropdown list */}
                {showCountryDropdown && filteredCountries.length > 0 && (
                  <div 
                    ref={countryDropdownRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredCountries.map((countryOption, index) => (
                      <button
                        key={index}
                        onClick={() => handleCountrySelect(countryOption)}
                        className={`w-full text-left px-4 py-3 first:rounded-t-xl last:rounded-b-xl border-l-4 transition-all duration-200 ${
                          selectedCountryIndex === index 
                            ? 'bg-coral-50 border-coral-500 text-coral-900' 
                            : 'hover:bg-gray-100 hover:text-gray-900 border-transparent'
                        }`}
                      >
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 text-gray-400 mr-3" />
                          <span className="text-gray-900">{countryOption}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* City dropdown with search */}
              <div className="relative city-dropdown">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  City *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={citySearchTerm || city}
                    onChange={(e) => handleCitySearch(e.target.value)}
                    onKeyDown={handleCityKeyDown}
                    onFocus={() => {
                      if (availableCities.length > 0) {
                        setShowCityDropdown(true)
                        // Always show all cities when focusing, regardless of current state
                        setFilteredCities(availableCities)
                      }
                    }}
                    disabled={!country}
                    placeholder={country ? "Start typing to search cities..." : "Select a country first"}
                    className="input-airbnb w-full pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} />
                </div>
                {/* City dropdown list */}
                {showCityDropdown && filteredCities.length > 0 && (
                  <div 
                    ref={cityDropdownRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                  >
                    {filteredCities.map((cityOption, index) => (
                      <button
                        key={index}
                        onClick={() => handleCitySelect(cityOption)}
                        className={`w-full text-left px-4 py-3 first:rounded-t-xl last:rounded-b-xl border-l-4 transition-all duration-200 ${
                          selectedCityIndex === index 
                            ? 'bg-coral-50 border-coral-500 text-coral-900' 
                            : 'hover:bg-gray-100 hover:text-gray-900 border-transparent'
                        }`}
                      >
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                          <span className="text-gray-900">{cityOption}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Description
              </label>
              <textarea
                value={packDescription}
                onChange={(e) => setPackDescription(e.target.value)}
                placeholder="Describe what makes these places special and why travelers should visit them..."
                rows={2}
                className="input-airbnb w-full resize-none"
              />
            </div>

            {/* Add Place Section - Now integrated here */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Add Places</h3>
              </div>
              
              <div className="space-y-4">
                {/* Maps List URL Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step 1: Add Google Maps List URL
                    {mapsListReference && (
                      <span className="ml-2 text-xs bg-coral-100 text-coral-800 px-2 py-1 rounded-full">Added</span>
                    )}
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={googleMapsListUrl}
                      onChange={(e) => setGoogleMapsListUrl(e.target.value)}
                      placeholder="https://maps.google.com/maps/lists/... or https://maps.app.goo.gl/..."
                      className="input-airbnb flex-1"
                    />
                    <button
                      onClick={importFromGoogleMapsList}
                      disabled={!googleMapsListUrl.trim() || isImporting}
                      className="btn-primary px-6 disabled:opacity-50"
                    >
                      {isImporting ? 'Adding...' : 'Add List'}
                    </button>
                  </div>
                </div>

                {/* Single Place URL Input */}
                <div className={!mapsListReference ? 'opacity-50' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step 2: Add Individual Places
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="url"
                      value={singlePlaceUrl}
                      onChange={(e) => setSinglePlaceUrl(e.target.value)}
                      placeholder={mapsListReference ? "https://www.google.de/maps/place/place_name/@latitude,longitude..." : "Complete Step 1 first to add individual places"}
                      disabled={!mapsListReference}
                      className="input-airbnb flex-1"
                    />
                    <button
                      onClick={addSinglePlace}
                      disabled={!singlePlaceUrl.trim() || isImporting || !mapsListReference}
                      className="btn-primary px-6 disabled:opacity-50"
                    >
                      {isImporting ? 'Adding...' : 'Add Place'}
                    </button>
                  </div>
                  
                  {/* URL validation feedback */}
                  {singlePlaceUrl && (() => {
                    const validation = validateSinglePlaceUrl(singlePlaceUrl)
                    return (
                      <div className="mt-3">
                        {!validation.isValid && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-gray-600 text-xs font-bold">!</span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {validation.errorMessage}
                                </h4>
                                {validation.guidance && (
                                  <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                                    {validation.guidance}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {validation.isValid && validation.warning && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-blue-600 text-xs font-bold">i</span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <h4 className="text-sm font-medium text-blue-900">
                                  {validation.warning}
                                </h4>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {validation.isValid && !validation.warning && (
                          <div className="bg-coral-50 border border-coral-200 rounded-lg p-3">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-4 h-4 bg-coral-100 rounded-full flex items-center justify-center">
                                  <span className="text-coral-600 text-xs font-bold">✓</span>
                                </div>
                              </div>
                              <div className="ml-2">
                                <span className="text-sm text-coral-700">
                                  Valid single place URL
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>

            {/* Maps List Reference Display */}
            {mapsListReference && (
              <div className="mt-6 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <h4 className="text-sm font-semibold text-gray-900">Maps List Reference</h4>
                  </div>
                  <button
                    onClick={() => setMapsListReference(null)}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                    title="Remove maps list reference"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-800 font-medium">{mapsListReference.title}</p>
                  <a 
                    href={mapsListReference.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Maps List
                  </a>
        
                </div>
              </div>
            )}

          </div>

          {/* Pins Section */}
          <div className="card-airbnb p-8" data-places-section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <MapPin className="h-6 w-6 text-coral-500 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Places ({pins.length})
                </h2>
              </div>
            </div>

            {pins.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No places yet</h3>
                <p className="text-gray-600 mb-6">
                  Paste a Google Maps place URL above to add your first place. 
                  The system will automatically fetch all the place details for you!
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pins.map((pin, index) => {
                  const isComplete = isPlaceComplete(pin)
                  const hasDescription = !!(pin.description && pin.description.trim().length > 0)
                  const hasPhoto = !!(pin.photos && pin.photos.length > 0)
                  
                  return (
                    <div 
                      key={index} 
                      className={`border rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative ${
                        isComplete ? 'border-coral-200 hover:border-coral-300' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        console.log('Navigating to place:', index)
                        router.push(`/create/place/${index}`)
                      }}
                    >
                      {/* Completion Status Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        {isComplete ? (
                          <div className="bg-coral-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Complete
                          </div>
                        ) : (
                          <div className="bg-gray-400 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Incomplete
                          </div>
                        )}
                      </div>

                      {/* Place Card Header */}
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-20">
                            <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
                              {pin.title || `Place ${index + 1}`}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                              {pin.address || 'No address available'}
                            </p>
                            
                            {/* Completion indicators */}
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center">
                                <div className={`w-2 h-2 rounded-full mr-1 ${hasDescription ? 'bg-coral-500' : 'bg-gray-300'}`}></div>
                                <span className="text-xs text-gray-600">Description</span>
                              </div>
                              <div className="flex items-center">
                                <div className={`w-2 h-2 rounded-full mr-1 ${hasPhoto ? 'bg-coral-500' : 'bg-gray-300'}`}></div>
                                <span className="text-xs text-gray-600">Photo</span>
                              </div>
                            </div>
                            
                            {/* Rating - only show if available */}
                            {pin.rating && (
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                <span className="text-sm font-medium text-gray-900">
                                  {pin.rating}/5
                                </span>
                                {pin.rating_count && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({pin.rating_count})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removePin(index)
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors absolute top-4 right-16"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                                </div>
      </div>

      {/* Completion Error Modal */}
      {showCompletionError.show && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-[9999] p-4"
          onClick={(e) => {
            // Only close if clicking on the backdrop itself, not on child elements
            if (e.target === e.currentTarget) {
              setShowCompletionError({ show: false, incompletePlaces: [] })
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-300 relative z-[10000] pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-gray-600 font-bold">!</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Complete All Places First
                </h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                Before creating your pack, each place needs a description and photo. 
                The following places are incomplete:
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
                {showCompletionError.incompletePlaces.map((item, index) => (
                  <div key={index} className="flex items-start mb-3 last:mb-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {item.pin.title || `Place ${item.index + 1}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        Missing: {item.missing.join(' and ')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowCompletionError({ show: false, incompletePlaces: [] })
                        router.push(`/create/place/${item.index}`)
                      }}
                      className="text-coral-600 hover:text-coral-800 text-sm font-medium ml-3"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCompletionError({ show: false, incompletePlaces: [] })}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowCompletionError({ show: false, incompletePlaces: [] })
                    // Scroll to places section
                    const placesSection = document.querySelector('[data-places-section]')
                    if (placesSection) {
                      placesSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="btn-primary px-4 py-2"
                >
                  Complete Places
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              onClick={createPinPack}
              disabled={isSubmitting || !packTitle.trim() || !city.trim() || !country.trim() || pins.length === 0}
              className="btn-primary px-12 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Pin Pack...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-5 w-5 mr-2" />
                  Create Pin Pack
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
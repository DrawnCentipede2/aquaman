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
  const [importedPlaces, setImportedPlaces] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  
  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string>('')

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
        alert('Please sign in first to create pin packs')
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
        const savedPins = localStorage.getItem('pinpacks_create_pins')
        if (savedPins) {
          const pins: Pin[] = JSON.parse(savedPins)
          setPins(pins)
          console.log('✅ Loaded pins from localStorage:', pins.length, pins.map(p => p.title || 'Untitled'))
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
          
          console.log('✅ Loaded pack details from localStorage:', details)
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
    const packDetails = {
      packTitle,
      packDescription,
      city,
      country,
      price
    }
    
    // Only save if at least one field has content
    if (packTitle.trim() || packDescription.trim() || city.trim() || country.trim() || price.trim()) {
      try {
        localStorage.setItem('pinpacks_create_pack_details', JSON.stringify(packDetails))
        console.log('💾 Saved pack details to localStorage')
      } catch (error) {
        console.error('❌ Error saving pack details to localStorage:', error)
      }
    }
  }, [packTitle, packDescription, city, country, price])

  // Enhanced function to import places from Google Maps URLs using Places API
  const importFromGoogleMapsList = async () => {
    if (!googleMapsListUrl) {
      alert('Please enter a Google Maps place URL')
      return
    }

    setIsImporting(true)
    
    // Debug information for URL validation
    console.log('=== Google Maps Import Debug ===')
    console.log('Input URL:', googleMapsListUrl)
    console.log('URL length:', googleMapsListUrl.length)
    
    try {
      // Check if it's a valid Google Maps URL
      // Support multiple Google Maps URL formats that users commonly encounter
      const isValidGoogleMapsUrl = 
        googleMapsListUrl.includes('maps.google.com') ||     // Standard Google Maps
        googleMapsListUrl.includes('goo.gl') ||              // Shortened URLs
        googleMapsListUrl.includes('maps.app.goo.gl') ||     // New shortened format
        googleMapsListUrl.includes('google.com/maps') ||     // Alternative format (US)
        googleMapsListUrl.includes('maps.google.') ||        // International domains (maps.google.es, etc.)
        googleMapsListUrl.includes('plus.codes') ||          // Plus codes
        (googleMapsListUrl.includes('@') && googleMapsListUrl.includes('google.')) || // URLs with coordinates (any Google domain)
        googleMapsListUrl.includes('/maps/place/') ||        // Place URLs on any Google domain
        googleMapsListUrl.includes('/maps?') ||              // Map search URLs
        (googleMapsListUrl.includes('google.') && googleMapsListUrl.includes('/maps')) // Any Google domain with maps
      
      // Debug: Show which validation conditions match
      const validationTests = {
        'maps.google.com': googleMapsListUrl.includes('maps.google.com'),
        'goo.gl': googleMapsListUrl.includes('goo.gl'),
        'maps.app.goo.gl': googleMapsListUrl.includes('maps.app.goo.gl'),
        'google.com/maps': googleMapsListUrl.includes('google.com/maps'),
        'maps.google.*': googleMapsListUrl.includes('maps.google.'),
        'plus.codes': googleMapsListUrl.includes('plus.codes'),
        'coordinates (@)': googleMapsListUrl.includes('@') && googleMapsListUrl.includes('google.'),
        '/maps/place/': googleMapsListUrl.includes('/maps/place/'),
        '/maps?': googleMapsListUrl.includes('/maps?'),
        'google.* with /maps': googleMapsListUrl.includes('google.') && googleMapsListUrl.includes('/maps')
      }
      
      console.log('URL validation tests:', validationTests)
      console.log('URL validation result:', isValidGoogleMapsUrl)

      if (!isValidGoogleMapsUrl) {
        // Enhanced error message to help users understand what URLs are supported
        throw new Error(
          'Please enter a valid Google Maps URL.\n\n' +
          'Supported formats:\n' +
          '• https://maps.google.com/... (or any Google domain)\n' +
          '• https://www.google.com/maps/... (or .de, .es, .fr, etc.)\n' +
          '• https://goo.gl/maps/...\n' +
          '• https://maps.app.goo.gl/...\n' +
          '• URLs with coordinates (containing @)\n' +
          '• URLs with /maps/place/\n' +
          '• Plus codes (plus.codes)\n\n' +
          'Current URL: ' + googleMapsListUrl
        )
      }

      // Handle different types of URLs
      const isListUrl = googleMapsListUrl.includes('/lists/') || googleMapsListUrl.includes('list/')

      if (isListUrl) {
        // For list URLs, show guidance on extracting individual places
        alert(
          '📋 Google Maps List Detected!\n\n' +
          'Unfortunately, Google doesn\'t allow direct import from lists.\n\n' +
          'To import places from your list:\n' +
          '1. Open your Google Maps list\n' +
          '2. Click on each place in the list\n' +
          '3. Copy each place URL (from the address bar)\n' +
          '4. Come back and paste each URL here (one at a time)\n\n' +
          'The API will automatically fetch all place details!'
        )
      } else {
        // Import single place using the enhanced API integration
        try {
          const importedPlace = await importSinglePlace(googleMapsListUrl)
          
          // Check for duplicates before adding
          const isDuplicate = pins.some(existingPin => {
            // Check by Google Maps URL (most reliable)
            if (existingPin.google_maps_url === importedPlace.google_maps_url) {
              return true
            }
            
            // Check by coordinates (in case URLs are different but same place)
            const coordsMatch = Math.abs(existingPin.latitude - importedPlace.latitude) < 0.0001 && 
                               Math.abs(existingPin.longitude - importedPlace.longitude) < 0.0001
            
            // Check by title and address (as additional fallback)
            const titleMatch = existingPin.title.toLowerCase().trim() === importedPlace.title.toLowerCase().trim()
            const addressMatch = existingPin.address && importedPlace.address && 
                                 existingPin.address.toLowerCase().trim() === importedPlace.address.toLowerCase().trim()
            
            return coordsMatch || (titleMatch && addressMatch)
          })
          
          if (isDuplicate) {
            alert(
              `🚫 Duplicate Place Detected!\n\n` +
              `"${importedPlace.title}" is already in your pack.\n\n` +
              `Each place can only be added once to maintain the quality and uniqueness of your pin pack.`
            )
            return // Don't add the duplicate
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
          
          // Store the imported place for display
          setImportedPlaces([importedPlace])
          
          alert(
            `Successfully imported "${importedPlace.title}"! ✅\n\n` +
            `📍 Location: ${importedPlace.address || 'Coordinates detected'}\n` +
            `📂 Category: ${importedPlace.category}\n` +
            `${importedPlace.rating ? `⭐ Rating: ${importedPlace.rating}/5 (${importedPlace.rating_count || 0} reviews)` : ''}\n` +
            `${importedPlace.business_status ? `📊 Status: ${importedPlace.business_status}` : ''}\n\n` +
            `Check the detailed information below and edit if needed!`
          )
        } catch (apiError) {
          console.warn('API import failed, falling back to basic method:', apiError)
          // Fallback to the basic coordinate extraction method
          const coords = extractCoordinates(googleMapsListUrl)
          
          // Check for duplicates before adding (basic method)
          const isDuplicateBasic = pins.some(existingPin => {
            // Check by Google Maps URL
            if (existingPin.google_maps_url === googleMapsListUrl) {
              return true
            }
            
            // Check by coordinates
            const coordsMatch = Math.abs(existingPin.latitude - coords.latitude) < 0.0001 && 
                               Math.abs(existingPin.longitude - coords.longitude) < 0.0001
            
            return coordsMatch
          })
          
          if (isDuplicateBasic) {
            alert(
              `🚫 Duplicate Place Detected!\n\n` +
              `This place is already in your pack.\n\n` +
              `Each place can only be added once to maintain the quality and uniqueness of your pin pack.`
            )
            return // Don't add the duplicate
          }
          
          const basicPin: Pin = {
            title: 'Imported Place',
            description: '', // Leave empty for user input
            google_maps_url: googleMapsListUrl,
            category: 'other',
            latitude: coords.latitude,
            longitude: coords.longitude
          }
          
          setPins(currentPins => [...currentPins, basicPin])
          
          alert(
            `Place imported with basic details!\n\n` +
            `Please edit the place name, category, and description to add your personal touch.\n\n` +
            `Tip: Make sure your Google Maps API key is configured for enhanced features.`
          )
        }
      }
      
      // Clear the URL field
      setGoogleMapsListUrl('')
      
    } catch (err) {
      alert('Could not import from this URL. Please make sure it\'s a valid Google Maps URL.')
      console.error('Import error:', err)
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
      alert('Please enter a Google Maps URL first')
      return
    }

    // Set loading state
    updatePin(index, { fetching: true })

    try {
      console.log('=== DEBUG: Starting fetchPlaceInfo ===')
      console.log('URL:', url)
      
      // Check for shortened URLs and show warning
      if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
        const shouldContinue = confirm(
          '🔗 Shortened URL Detected\n\n' +
          'You\'re using a shortened URL from Google Maps "Share" button.\n\n' +
          '⚠️ These URLs have limited information. For best results:\n' +
          '1. Open the place in Google Maps\n' +
          '2. Copy the URL from your browser\'s address bar\n' +
          '3. Use that full URL instead\n\n' +
          'Continue with shortened URL anyway?'
        )
        
        if (!shouldContinue) {
          updatePin(index, { fetching: false })
          return
        }
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

      // Show different success messages based on the type of URL and data fetched
      if (placeInfo.needs_manual_edit) {
        alert(
          '📍 Place Added!\n\n' +
          'Since this is a shortened URL, we couldn\'t fetch detailed information.\n\n' +
          '✏️ Please fill in:\n' +
          '• Place name\n' +
          '• Category\n' +
          '• Your personal recommendation\n\n' +
          'This will make your pack more valuable for travelers!'
        )
      } else {
        // Show success message with fetched data
        let message = `✅ Place information fetched successfully!\n\n📍 ${placeInfo.title || 'Unknown place'}`
        if (placeInfo.rating) {
          const reviewText = placeInfo.rating_count ? ` (${placeInfo.rating_count} reviews)` : ''
          message += `\n⭐ Rating: ${placeInfo.rating}/5${reviewText}`
        }
        if (placeInfo.business_type) {
          message += `\n🏢 Type: ${placeInfo.business_type}`
        }
        if (city && country) {
          message += `\n🌍 Location: ${city}, ${country}`
        }
        if (placeInfo.category) {
          message += `\n🏷️ Category: ${placeInfo.category}`
        }
        message += '\n\nNow add your personal recommendations!'
        
        alert(message)
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
      
      alert('⚠️ Could not fetch detailed place information.\n\nPossible issues:\n• Google Maps API key not configured\n• Invalid URL format\n• Place ID not found\n\nPlease fill in the details manually.')
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
      alert('Please fill in all required fields and add at least one pin.')
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

      alert('Pin pack created successfully! 🎉')
      
      // Clear form
      setPackTitle('')
      setPackDescription('')
      setCity('')
      setCountry('')
      setPrice('')
      setPins([])
      
      // Clear localStorage to start fresh for next pack
      try {
        localStorage.removeItem('pinpacks_create_pack_details')
        localStorage.removeItem('pinpacks_create_pins')
        console.log('🧹 Cleared localStorage after successful pack creation')
      } catch (error) {
        console.error('❌ Error clearing localStorage:', error)
      }
      
      // Redirect to manage page
      window.location.href = '/manage'
      
    } catch (err) {
      console.error('Error creating pin pack:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      alert(`Failed to create pin pack. Error: ${errorMessage}`)
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

  return (
    <div className="min-h-screen bg-gray-25">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
              <div className="flex items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Add Places</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={googleMapsListUrl}
                    onChange={(e) => setGoogleMapsListUrl(e.target.value)}
                    placeholder="https://maps.google.com/place/..."
                    className="input-airbnb flex-1"
                  />
                  <button
                    onClick={importFromGoogleMapsList}
                    disabled={!googleMapsListUrl.trim() || isImporting}
                    className="btn-primary px-6 disabled:opacity-50"
                  >
                    {isImporting ? 'Importing...' : 'Add Place'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pins Section */}
          <div className="card-airbnb p-8">
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
                {pins.map((pin, index) => (
                  <div 
                    key={index} 
                    className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      console.log('Navigating to place:', index) // Debug log
                      router.push(`/create/place/${index}`)
                    }}
                  >
                    {/* Place Card Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
                            {pin.title || `Place ${index + 1}`}
                          </h3>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                            {pin.address || 'No address available'}
                          </p>
                          
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
                            e.stopPropagation() // Prevent card click when deleting
                            removePin(index)
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors ml-2 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
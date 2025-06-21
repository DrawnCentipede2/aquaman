'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Plus, Trash2, Save, HelpCircle, Globe, Upload, Sparkles, Download, ExternalLink, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { importSinglePlace, extractCoordinates, extractPlaceId } from '@/lib/googleMaps'

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
  const [price, setPrice] = useState(0)
  
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

  // Function to add a new empty pin
  const addPin = () => {
    const newPin: Pin = {
      title: '',
      description: '',
      google_maps_url: '',
      category: 'restaurant',
      latitude: 0,
      longitude: 0,
      fetching: false
    }
    setPins([...pins, newPin])
  }

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
        price: price,
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
      setPrice(0)
      setPins([])
      
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

  // Test function to check Google Maps API configuration
  const testGoogleMapsAPI = async () => {
    try {
      console.log('Testing Google Maps API configuration...')
      
      // Check if API key is available
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      console.log('API Key available:', !!apiKey)
      
      if (!apiKey) {
        alert('❌ Google Maps API key is not configured.\n\nPlease add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.')
        return
      }
      
      // Test with a simple URL
      const testUrl = 'https://www.google.com/maps/place/Eiffel+Tower/@48.8583701,2.2922926,17z'
      const result = await importSinglePlace(testUrl)
      
      console.log('Test result:', result)
      alert(`✅ Google Maps API is working!\n\nTest result:\n• Title: ${result.title}\n• Category: ${result.category}\n• Rating: ${result.rating || 'N/A'}\n• Address: ${result.address || 'N/A'}`)
      
    } catch (error) {
      console.error('Google Maps API test failed:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`❌ Google Maps API test failed.\n\nError: ${errorMessage}\n\nPlease check:\n• API key is valid\n• Places API is enabled\n• Billing is set up`)
    }
  }

  // Debug function to test place ID extraction
  const debugPlaceId = () => {
    const testUrl = prompt('Enter a Google Maps URL to test place ID extraction:')
    if (!testUrl) return
    
    console.log('=== DEBUGGING PLACE ID EXTRACTION ===')
    console.log('Test URL:', testUrl)
    
    // Test the extraction function from googleMaps.ts
    try {
      const placeId = extractPlaceId ? extractPlaceId(testUrl) : 'extractPlaceId function not available'
      console.log('Extracted Place ID:', placeId)
      
      const coords = extractCoordinates(testUrl)
      console.log('Extracted Coordinates:', coords)
      
      // Show results in alert
      alert(
        `Debug Results:\n\n` +
        `URL: ${testUrl}\n\n` +
        `Place ID: ${placeId || 'None found'}\n\n` +
        `Coordinates: ${coords.latitude}, ${coords.longitude}\n\n` +
        `Check console for detailed logs.`
      )
    } catch (error) {
      console.error('Debug error:', error)
      alert(`Debug error: ${error}`)
    }
  }

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
          
          {/* Debug: Test Google Maps API */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={testGoogleMapsAPI}
              className="btn-secondary text-sm"
            >
              🔧 Test Google Maps API
            </button>
            <button
              onClick={debugPlaceId}
              className="btn-secondary text-sm"
            >
              🔍 Debug Place ID
            </button>
            <button
              onClick={() => {
                try {
                  const savedPins = localStorage.getItem('pinpacks_create_pins')
                  if (savedPins) {
                    const pins = JSON.parse(savedPins)
                    console.log('🔍 DEBUG: Current localStorage contents:', pins)
                    alert(`Found ${pins.length} pins in localStorage. Check console for details.`)
                  } else {
                    console.log('🔍 DEBUG: No pins found in localStorage')
                    alert('No pins found in localStorage')
                  }
                } catch (error) {
                  console.error('❌ Error reading localStorage:', error)
                  alert('Error reading localStorage - check console')
                }
              }}
              className="btn-secondary text-sm"
            >
              🔍 Debug Storage
            </button>
          </div>
        </div>

        {/* Main Form */}
        <div className="space-y-8">
          {/* Pack Details Card */}
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
                  Price (USD)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  min="0"
                  step="1"
                  className="input-airbnb w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Barcelona"
                  className="input-airbnb w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Spain"
                  className="input-airbnb w-full"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Description
              </label>
              <textarea
                value={packDescription}
                onChange={(e) => setPackDescription(e.target.value)}
                placeholder="Describe what makes these places special and why travelers should visit them..."
                rows={4}
                className="input-airbnb w-full resize-none"
              />
            </div>
          </div>

          {/* Quick Import Section */}
          <div className="card-airbnb p-8">
            <div className="flex items-center mb-6">
              <Upload className="h-6 w-6 text-coral-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Add place</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Google Maps Place URL
                </label>
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
                    {isImporting ? 'Importing...' : 'Fetch Info'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Paste a Google Maps place URL to automatically extract place information including ratings, hours, and reviews.
                </p>
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
                <p className="text-gray-600 mb-6">Add your first place to get started</p>
                <button
                  onClick={addPin}
                  className="btn-primary flex items-center mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Place
                </button>
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
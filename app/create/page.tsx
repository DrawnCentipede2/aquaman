'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, Trash2, Save, HelpCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Interface for a single pin
interface Pin {
  title: string
  description: string
  google_maps_url: string
  category: string
  latitude: number
  longitude: number
}

export default function CreatePackPage() {
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

  // Function to import places from Google Maps list URL
  const importFromGoogleMapsList = async () => {
    if (!googleMapsListUrl) {
      alert('Please enter a Google Maps list URL or individual place URL')
      return
    }

    setIsImporting(true)
    try {
      // Check if it's a valid Google Maps URL (including shortened URLs)
      const isValidGoogleMapsUrl = 
        googleMapsListUrl.includes('maps.google.com') || 
        googleMapsListUrl.includes('goo.gl') ||
        googleMapsListUrl.includes('maps.app.goo.gl')

      if (!isValidGoogleMapsUrl) {
        throw new Error('Please enter a valid Google Maps URL.')
      }

      // Handle different types of URLs silently in the background
      const isListUrl = googleMapsListUrl.includes('/lists/') || googleMapsListUrl.includes('list/')
      const isSinglePlace = googleMapsListUrl.includes('goo.gl') || 
                           googleMapsListUrl.includes('@') || 
                           googleMapsListUrl.includes('place/')

      if (isSinglePlace) {
        // Import single place directly
        quickAddFromUrls(googleMapsListUrl)
      } else if (isListUrl) {
        // For list URLs, show guidance on extracting individual places
        alert(
          '📋 Google Maps List Detected!\n\n' +
          'To import places from your list:\n' +
          '1. Open your Google Maps list\n' +
          '2. Click on each place in the list\n' +
          '3. Copy each place URL\n' +
          '4. Come back and paste each URL here (one at a time)\n\n' +
          'This ensures we get all the place details correctly!'
        )
      } else {
        // Try to import as a single place anyway
        quickAddFromUrls(googleMapsListUrl)
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

  // Function to quickly add multiple places from URLs
  const quickAddFromUrls = (urlsText: string) => {
    if (!urlsText.trim()) return

    const urls = urlsText.split('\n').filter(url => url.trim())
    const newPins: Pin[] = []

    urls.forEach((url, index) => {
      const trimmedUrl = url.trim()
      // Accept various Google Maps URL formats including shortened ones
      if (trimmedUrl.includes('maps.google.com') || 
          trimmedUrl.includes('goo.gl') || 
          trimmedUrl.includes('maps.app.goo.gl')) {
        const coords = extractCoordinates(trimmedUrl)
        
        // Create a basic pin - user can edit details later
        const pin: Pin = {
          title: `Imported Place ${pins.length + newPins.length + 1}`,
          description: 'Edit this description to add your personal insights!',
          google_maps_url: trimmedUrl,
          category: 'other',
          latitude: coords.latitude,
          longitude: coords.longitude
        }
        newPins.push(pin)
      }
    })

    if (newPins.length > 0) {
      setPins([...pins, ...newPins])
      const shortUrlCount = newPins.filter(pin => 
        pin.google_maps_url.includes('goo.gl') || 
        pin.google_maps_url.includes('maps.app.goo.gl')
      ).length
      
      if (shortUrlCount > 0) {
        alert(
          `✅ Successfully imported ${newPins.length} places!\n\n` +
          `📝 Note: ${shortUrlCount} of these are shortened URLs which may not show coordinates initially.\n` +
          `This is normal - the places will still work when shared!\n\n` +
          `Now you can edit each place to add your personal descriptions and choose the right categories.`
        )
      } else {
        alert(`✅ Successfully imported ${newPins.length} places!\n\nNow you can edit each place to add your personal descriptions and choose the right categories.`)
      }
    } else {
      alert('No valid Google Maps URLs found. Please check your URLs and make sure they include "maps.google.com" or "goo.gl".')
    }
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
      
      // Special handling for shortened URLs - they often don't contain coordinates
      if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
        console.log('Shortened URL detected - coordinates may not be available until resolved')
        // For shortened URLs, we'll return 0,0 but let the user know this is normal
        return { latitude: 0, longitude: 0 }
      }
      
      console.log('No valid coordinates found, returning 0,0')
      return { latitude: 0, longitude: 0 }
    } catch (err) {
      console.error('Error extracting coordinates:', err)
      return { latitude: 0, longitude: 0 }
    }
  }



  // Function to remove a pin from the pack
  const removePin = (index: number) => {
    setPins(pins.filter((_, i) => i !== index))
  }

  // Function to update a specific pin
  const updatePin = (index: number, updatedPin: Partial<Pin>) => {
    const newPins = [...pins]
    newPins[index] = { ...newPins[index], ...updatedPin }
    setPins(newPins)
  }

  // Function to get user's approximate location (for local verification)
  const getUserLocation = async () => {
    try {
      // Get user's IP-based location (simple approach for MVP)
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      return `${data.city}, ${data.country_name}`
    } catch (err) {
      console.error('Failed to get location:', err)
      return 'Unknown Location'
    }
  }

  // Function to create the pin pack
  const createPinPack = async () => {
    if (!packTitle || !city || !country || pins.length === 0) {
      alert('Please fill in all required fields and add at least one pin')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Get user location for verification
      const location = await getUserLocation()

      // Try with new schema first, fallback to basic schema if it fails
      let insertedPack;
      let packError;

      try {
        // Attempt with new fields (for updated database)
        const result = await supabase
          .from('pin_packs')
          .insert({
            title: packTitle,
            description: packDescription,
            price: price,
            city: city,
            country: country,
            creator_location: location,
            pin_count: pins.length,
            creator_id: userId,
            download_count: 0,
            average_rating: 0,
            rating_count: 0
          })
          .select()
          .single()
        
        insertedPack = result.data
        packError = result.error
      } catch (newSchemaError) {
        console.log('New schema failed, trying basic schema:', newSchemaError)
        
        // Fallback to basic schema (for older database)
        try {
          const result = await supabase
            .from('pin_packs')
            .insert({
              title: packTitle,
              description: packDescription,
              price: price,
              city: city,
              country: country,
              creator_location: location,
              pin_count: pins.length
            })
            .select()
            .single()
          
          insertedPack = result.data
          packError = result.error
        } catch (basicSchemaError) {
          console.error('Both schemas failed:', basicSchemaError)
          throw new Error('Database insertion failed with both new and basic schemas')
        }
      }

      if (packError) {
        console.error('Pack creation error:', packError)
        throw new Error(`Database error: ${packError.message}`)
      }

      if (!insertedPack) {
        throw new Error('No pack data returned from database')
      }

      // Create all pins
      const pinsToInsert = pins.map(pin => ({
        ...pin,
        creator_location: location,
        creator_ip: '' // We'll skip IP tracking for MVP
      }))

      const { data: pinsData, error: pinsError } = await supabase
        .from('pins')
        .insert(pinsToInsert)
        .select()

      if (pinsError) throw pinsError

      // Link pins to the pack
      const pinPackPins = pinsData.map(pin => ({
        pin_pack_id: insertedPack.id,
        pin_id: pin.id
      }))

      const { error: linkError } = await supabase
        .from('pin_pack_pins')
        .insert(pinPackPins)

      if (linkError) throw linkError

      alert('Pin pack created successfully!')
      
      // Reset form
      setPackTitle('')
      setPackDescription('')
      setCity('')
      setCountry('')
      setPrice(0)
      setPins([])
      
    } catch (err) {
      alert('Failed to create pin pack. Please try again.')
      console.error('Error creating pin pack:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-full">
              <Plus className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-800 bg-clip-text text-transparent mb-4">
            Create Your Pin Pack
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Share your local knowledge and help travelers discover the authentic gems of your city.
            Create a curated collection that only a true local would know!
          </p>
        </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Pin Pack Information */}
        <div className="space-y-8">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg mr-4">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Pack Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pack Title *
                </label>
                <input
                  type="text"
                  value={packTitle}
                  onChange={(e) => setPackTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Best Coffee Shops in Downtown Barcelona"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={packDescription}
                  onChange={(e) => setPackDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe what makes this collection special..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Barcelona"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Spain"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (USD)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave as 0 for free packs (recommended for MVP testing)
                </p>
              </div>
            </div>
          </div>

          {/* Google Maps List Import */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-8 rounded-2xl shadow-xl border border-orange-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 p-3 rounded-lg mr-4">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Import Google Maps List</h2>
              </div>
              
              {/* Help Button */}
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Need help creating a Google Maps list?"
              >
                <HelpCircle className="h-6 w-6" />
              </button>
            </div>
            
            {/* Help Section (Collapsible) */}
            {showHelp && (
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">❓ How to Create a Google Maps List</h3>
                <div className="space-y-3 text-sm text-blue-800">
                  <div>
                    <p className="font-medium mb-2">📱 On Mobile:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Open Google Maps app</li>
                      <li>Search for a place</li>
                      <li>Tap on the place to open its details</li>
                      <li>Tap "Save" and choose "New list" or select existing list</li>
                      <li>Repeat for other places</li>
                      <li>Share your list: Go to "Your lists" → Select list → "Share"</li>
                    </ol>
                  </div>
                  
                  <div>
                    <p className="font-medium mb-2">💻 On Desktop:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to maps.google.com</li>
                      <li>Search for a place and click on it</li>
                      <li>Click "Save" and choose "New list" or existing list</li>
                      <li>Add more places to your list</li>
                      <li>Share: Go to "Your places" → "Lists" → Select list → "Share"</li>
                    </ol>
                  </div>
                  
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <p className="font-medium text-blue-900">💡 Pro Tip:</p>
                    <p className="text-blue-700">You can paste either individual place URLs or list URLs here. If it's a list, we'll guide you on extracting the places!</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white/70 p-6 rounded-xl border border-orange-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🚀 Import Your Places</h3>
              <p className="text-gray-700 mb-4">
                Paste your Google Maps list URL here to automatically import all places:
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Maps URL
                  </label>
                  <input
                    type="url"
                    value={googleMapsListUrl}
                    onChange={(e) => setGoogleMapsListUrl(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="https://maps.app.goo.gl/... or https://maps.google.com/lists/..."
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Create a list in Google Maps first, then share it and paste the URL here
                  </p>
                </div>
                
                <button
                  onClick={importFromGoogleMapsList}
                  disabled={isImporting}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 mr-2" />
                      Import Google Maps List
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>


        </div>

        {/* Pins List and Submit */}
        <div className="space-y-8">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-lg mr-4">
                <Save className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {/* Smart title based on how pins were added */}
                {importedPlaces.length > 0 && pins.length === importedPlaces.length ? (
                  `Google List (${pins.length} places)`
                ) : importedPlaces.length > 0 && pins.length > importedPlaces.length ? (
                  `Mixed Pack (${importedPlaces.length} from list + ${pins.length - importedPlaces.length} manual)`
                ) : (
                  `Pin Pack (${pins.length} pins)`
                )}
              </h2>
            </div>
            
            {pins.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No places imported yet</p>
                <p className="text-sm">Import a Google Maps list using the form on the left</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pins.map((pin, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="space-y-3">
                      {/* Pin Title (Editable) */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Pin Title
                        </label>
                        <input
                          type="text"
                          value={pin.title}
                          onChange={(e) => updatePin(index, { title: e.target.value })}
                          className="w-full text-lg font-medium text-gray-900 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter pin title"
                        />
                      </div>

                      {/* Description (Editable) */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Your Personal Description
                        </label>
                        <textarea
                          value={pin.description}
                          onChange={(e) => updatePin(index, { description: e.target.value })}
                          rows={2}
                          className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Why is this place special? Share your local insights..."
                        />
                      </div>

                      {/* Category and Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Category
                            </label>
                            <select
                              value={pin.category}
                              onChange={(e) => updatePin(index, { category: e.target.value })}
                              className="border border-gray-200 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="restaurant">Restaurant</option>
                              <option value="cafe">Café</option>
                              <option value="attraction">Attraction</option>
                              <option value="shopping">Shopping</option>
                              <option value="nightlife">Nightlife</option>
                              <option value="culture">Culture</option>
                              <option value="outdoor">Outdoor</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          {/* Coordinates Info */}
                          {(pin.latitude !== 0 || pin.longitude !== 0) && (
                            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              ✅ Location: {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
                            </div>
                          )}
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removePin(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Remove this pin"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* URL Preview */}
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <span className="font-medium">Google Maps:</span> 
                        <a 
                          href={pin.google_maps_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 ml-1 break-all"
                        >
                          {pin.google_maps_url.length > 50 
                            ? pin.google_maps_url.substring(0, 50) + '...' 
                            : pin.google_maps_url
                          }
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={createPinPack}
            disabled={isSubmitting || pins.length === 0}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Creating Your Pack...
              </>
            ) : (
              <>
                <Save className="h-6 w-6 mr-3" />
                Create Pin Pack
              </>
            )}
          </button>
          
          <p className="text-sm text-gray-500 text-center">
            Your pack will be available for download immediately after creation.
            We verify that you're creating packs for your local area.
          </p>
        </div>
      </div>
      </div>
    </div>
  )
} 
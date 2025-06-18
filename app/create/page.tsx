'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, Trash2, Save, HelpCircle, Globe, Upload, Sparkles } from 'lucide-react'
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
      
      console.log('No coordinates found in URL, using default')
      return { latitude: 0, longitude: 0 }
    } catch (err) {
      console.error('Error extracting coordinates:', err)
      return { latitude: 0, longitude: 0 }
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
      longitude: 0
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
  }

  // Function to get user's location for city/country
  const getUserLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      setCity(data.city || '')
      setCountry(data.country_name || '')
    } catch (err) {
      console.error('Could not get location:', err)
    }
  }

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
        created_at: new Date().toISOString()
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
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Share your favorite local spots with travelers around the world
          </p>
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
                  step="0.01"
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
                <button
                  onClick={getUserLocation}
                  className="text-sm text-coral-500 hover:text-coral-600 mt-1"
                >
                  Auto-detect my location
                </button>
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

          {/* Quick Import Card */}
          <div className="card-airbnb p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Upload className="h-6 w-6 text-coral-500 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Quick Import</h2>
              </div>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-coral-500 hover:text-coral-600"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>

            {showHelp && (
              <div className="bg-coral-50 border border-coral-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-coral-900 mb-2">How to import places:</h3>
                <ul className="text-sm text-coral-800 space-y-1">
                  <li>• Copy any Google Maps place URL</li>
                  <li>• Paste it below and click import</li>
                  <li>• You can then edit the details</li>
                  <li>• Or add places manually one by one</li>
                </ul>
              </div>
            )}

            <div className="flex gap-4">
              <input
                type="text"
                value={googleMapsListUrl}
                onChange={(e) => setGoogleMapsListUrl(e.target.value)}
                placeholder="Paste Google Maps URL here..."
                className="input-airbnb flex-1"
              />
              <button
                onClick={importFromGoogleMapsList}
                disabled={isImporting || !googleMapsListUrl.trim()}
                className="btn-primary px-6 disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Import'}
              </button>
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
              <button
                onClick={addPin}
                className="btn-secondary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Place
              </button>
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
              <div className="space-y-6">
                {pins.map((pin, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Place {index + 1}
                      </h3>
                      <button
                        onClick={() => removePin(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Place Name *
                        </label>
                        <input
                          type="text"
                          value={pin.title}
                          onChange={(e) => updatePin(index, { title: e.target.value })}
                          placeholder="Café Central"
                          className="input-airbnb w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Category
                        </label>
                        <select
                          value={pin.category}
                          onChange={(e) => updatePin(index, { category: e.target.value })}
                          className="input-airbnb w-full"
                        >
                          <option value="restaurant">Restaurant</option>
                          <option value="cafe">Café</option>
                          <option value="bar">Bar/Nightlife</option>
                          <option value="attraction">Attraction</option>
                          <option value="shopping">Shopping</option>
                          <option value="nature">Nature</option>
                          <option value="culture">Culture</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Google Maps URL *
                        </label>
                        <input
                          type="url"
                          value={pin.google_maps_url}
                          onChange={(e) => {
                            const url = e.target.value
                            const coords = extractCoordinates(url)
                            updatePin(index, { 
                              google_maps_url: url,
                              latitude: coords.latitude,
                              longitude: coords.longitude
                            })
                          }}
                          placeholder="https://maps.google.com/..."
                          className="input-airbnb w-full"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                          Your Personal Recommendation
                        </label>
                        <textarea
                          value={pin.description}
                          onChange={(e) => updatePin(index, { description: e.target.value })}
                          placeholder="Why do you love this place? What should travelers know?"
                          rows={3}
                          className="input-airbnb w-full resize-none"
                        />
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
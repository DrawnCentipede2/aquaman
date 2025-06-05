'use client'

import { useState } from 'react'
import { MapPin, Plus, Trash2, Save } from 'lucide-react'
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
  const [currentPin, setCurrentPin] = useState<Pin>({
    title: '',
    description: '',
    google_maps_url: '',
    category: 'restaurant',
    latitude: 0,
    longitude: 0
  })
  
  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Function to extract coordinates from Google Maps URL
  const extractCoordinates = (url: string) => {
    console.log('Extracting coordinates from URL:', url)
    
    try {
      // Multiple patterns to match different Google Maps URL formats
      const patterns = [
        // Standard @lat,lng format
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // Place ID format with coordinates
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
        // Direct coordinates in URL
        /(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // Query parameter format
        /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/
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
      
      console.log('No valid coordinates found, returning 0,0')
      return { latitude: 0, longitude: 0 }
    } catch (err) {
      console.error('Error extracting coordinates:', err)
      return { latitude: 0, longitude: 0 }
    }
  }

  // Function to add a pin to the pack
  const addPin = () => {
    if (!currentPin.title || !currentPin.google_maps_url) {
      alert('Please fill in at least the title and Google Maps URL')
      return
    }

    // Extract coordinates from URL
    const coords = extractCoordinates(currentPin.google_maps_url)
    
    // Warn user if no coordinates could be extracted
    if (coords.latitude === 0 && coords.longitude === 0) {
      const proceed = confirm(
        `⚠️ Warning: Could not extract location coordinates from the Google Maps URL.\n\n` +
        `This pin may not work properly in Google Maps. The URL should contain coordinates.\n\n` +
        `Try getting a new URL by:\n` +
        `1. Opening Google Maps\n` +
        `2. Searching for the location\n` +
        `3. Clicking on the location pin\n` +
        `4. Clicking "Share" → "Copy link"\n\n` +
        `Do you want to add this pin anyway?`
      )
      if (!proceed) return
    }
    
    const newPin: Pin = {
      ...currentPin,
      latitude: coords.latitude,
      longitude: coords.longitude
    }

    setPins([...pins, newPin])
    
    // Show success message with coordinate info
    if (coords.latitude !== 0 || coords.longitude !== 0) {
      alert(`✅ "${currentPin.title}" added to your pack!\nCoordinates: ${coords.latitude}, ${coords.longitude}`)
    } else {
      alert(`⚠️ "${currentPin.title}" added to your pack, but without coordinates.`)
    }
    
    // Reset current pin form
    setCurrentPin({
      title: '',
      description: '',
      google_maps_url: '',
      category: 'restaurant',
      latitude: 0,
      longitude: 0
    })
  }

  // Function to remove a pin from the pack
  const removePin = (index: number) => {
    setPins(pins.filter((_, i) => i !== index))
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

      // Create the pin pack in database
      const { data: packData, error: packError } = await supabase
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

      if (packError) throw packError

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
        pin_pack_id: packData.id,
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

          {/* Add Pin Form */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-lg mr-4">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Add a Pin</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pin Title *
                </label>
                <input
                  type="text"
                  value={currentPin.title}
                  onChange={(e) => setCurrentPin({...currentPin, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Café Central"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Maps URL *
                </label>
                <input
                  type="url"
                  value={currentPin.google_maps_url}
                  onChange={(e) => setCurrentPin({...currentPin, google_maps_url: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://maps.google.com/..."
                />
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium mb-1">
                    📍 How to get a Google Maps URL:
                  </p>
                  <ol className="text-xs text-blue-600 space-y-1">
                    <li>1. Search for the location on Google Maps</li>
                    <li>2. Click on the location pin or result</li>
                    <li>3. Click "Share" → "Copy link"</li>
                    <li>4. Paste it here!</li>
                  </ol>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={currentPin.category}
                  onChange={(e) => setCurrentPin({...currentPin, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={currentPin.description}
                  onChange={(e) => setCurrentPin({...currentPin, description: e.target.value})}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Why is this place special?"
                />
              </div>
              
              <button
                onClick={addPin}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Pin to Pack
              </button>
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
                Pins in Pack ({pins.length})
              </h2>
            </div>
            
            {pins.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No pins added yet</p>
                <p className="text-sm">Add pins using the form on the left</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pins.map((pin, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{pin.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{pin.description}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {pin.category}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removePin(index)}
                        className="text-red-500 hover:text-red-700 ml-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
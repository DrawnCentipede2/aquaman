'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Download, Star, Calendar, Package, ExternalLink, X, CheckCircle, Smartphone, ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PinPack } from '@/lib/supabase'

export default function PinventoryPage() {
  const router = useRouter()
  
  // Authentication and user state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Pack data state
  const [purchasedPacks, setPurchasedPacks] = useState<PinPack[]>([])
  const [groupedPacks, setGroupedPacks] = useState<{[key: string]: PinPack[]}>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Country expansion state
  const [expandedCountries, setExpandedCountries] = useState<{[key: string]: boolean}>({})
  
  // Enhanced delivery modal state
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [selectedPack, setSelectedPack] = useState<PinPack | null>(null)
  const [deliveryStep, setDeliveryStep] = useState<'options' | 'mymaps' | 'manual' | 'both'>('options')
  const [savedPlaces, setSavedPlaces] = useState<string[]>([])
  const [packPins, setPackPins] = useState<any[]>([])

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = () => {
      const userProfileData = localStorage.getItem('pinpacks_user_profile')
      if (userProfileData) {
        setUserProfile(JSON.parse(userProfileData))
        setIsAuthenticated(true)
      } else {
        setUserProfile(null)
        setIsAuthenticated(false)
      }
    }
    
    checkAuth()
  }, [])

  // Load purchased packs when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadPurchasedPacks()
    } else if (isAuthenticated === false) {
      // User is not authenticated, redirect to sign in
      router.push('/auth')
    }
  }, [isAuthenticated, router])

  // Group packs by country when purchasedPacks changes
  useEffect(() => {
    groupPacksByCountry()
  }, [purchasedPacks])

  // Load purchased packs from database orders and localStorage (for backward compatibility)
  const loadPurchasedPacks = async () => {
    try {
      setLoading(true)
      
      // Get purchased pack IDs from both sources
      let purchasedPackIds: string[] = []
      
      // 1. Get from database orders (new PayPal purchases)
      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          pin_pack_id,
          orders!inner(status)
        `)
        .eq('orders.status', 'completed')
      
      if (!orderError && orderItems) {
        const databasePackIds = orderItems.map(item => item.pin_pack_id)
        purchasedPackIds.push(...databasePackIds)
      }
      
      // 2. Get from localStorage (old purchases and free packs)
      const localStorageIds = JSON.parse(localStorage.getItem('pinpacks_purchased') || '[]')
      
      // Clean up invalid UUIDs from localStorage
      const validLocalIds = localStorageIds.filter((id: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return typeof id === 'string' && uuidRegex.test(id)
      })
      
      // Merge both sources and remove duplicates
      purchasedPackIds = Array.from(new Set([...purchasedPackIds, ...validLocalIds]))
      
      // Update localStorage if we found invalid UUIDs
      if (validLocalIds.length !== localStorageIds.length) {
        localStorage.setItem('pinpacks_purchased', JSON.stringify(validLocalIds))
        console.log(`Cleaned up ${localStorageIds.length - validLocalIds.length} invalid pack IDs from localStorage`)
      }
      
      if (purchasedPackIds.length === 0) {
        setPurchasedPacks([])
        setGroupedPacks({})
        setLoading(false)
        return
      }

      // Fetch pack details from database
      const { data: packsData, error: packsError } = await supabase
        .from('pin_packs')
        .select('*')
        .in('id', purchasedPackIds)

      if (packsError) throw packsError

      setPurchasedPacks(packsData || [])
      
    } catch (err) {
      console.error('Error loading purchased packs:', err)
      setError('Failed to load your purchased packs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Group packs by country
  const groupPacksByCountry = () => {
    const grouped: {[key: string]: PinPack[]} = {}
    
    purchasedPacks.forEach(pack => {
      const country = pack.country
      if (!grouped[country]) {
        grouped[country] = []
      }
      grouped[country].push(pack)
    })
    
    // Sort packs within each country by title
    Object.keys(grouped).forEach(country => {
      grouped[country].sort((a, b) => a.title.localeCompare(b.title))
    })
    
    setGroupedPacks(grouped)
    
    // Auto-expand countries if there are only a few
    const countries = Object.keys(grouped)
    if (countries.length <= 3) {
      const expanded: {[key: string]: boolean} = {}
      countries.forEach(country => {
        expanded[country] = true
      })
      setExpandedCountries(expanded)
    }
  }

  // Toggle country expansion
  const toggleCountry = (country: string) => {
    setExpandedCountries(prev => ({
      ...prev,
      [country]: !prev[country]
    }))
  }

  // Handle "Get Your Places" button click
  const handleGetPlaces = async (pack: PinPack) => {
    setSelectedPack(pack)
    
    // Load pins for this pack
    try {
      const { data: packPinsData, error: pinsError } = await supabase
        .from('pin_pack_pins')
        .select(`
          pins (
            id,
            title,
            description,
            google_maps_url,
            category,
            latitude,
            longitude
          )
        `)
        .eq('pin_pack_id', pack.id)

      if (pinsError) throw pinsError

      const pinsData = packPinsData?.map((item: any) => ({
        id: item.pins.id,
        name: item.pins.title,
        title: item.pins.title,
        description: item.pins.description,
        google_maps_url: item.pins.google_maps_url,
        category: item.pins.category,
        latitude: item.pins.latitude,
        longitude: item.pins.longitude
      })) || []
      
      setPackPins(pinsData)
      setShowDeliveryModal(true)
      
    } catch (err) {
      console.error('Error loading pack pins:', err)
      alert('Failed to load pack details. Please try again.')
    }
  }

  // Generate My Maps KML file
  const generateMyMapsKML = async () => {
    if (!selectedPack || packPins.length === 0) {
      throw new Error('No pack selected or no pins available')
    }

    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${selectedPack.title}</name>
    <description>${selectedPack.description}</description>
    ${packPins.map((pin, index) => `
    <Placemark>
      <name>${pin.name}</name>
      <description>${pin.description || 'No description available'}</description>
      <Point>
        <coordinates>${pin.longitude},${pin.latitude},0</coordinates>
      </Point>
    </Placemark>`).join('')}
  </Document>
</kml>`

    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedPack.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.kml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Generate individual Google Maps links
  const generateIndividualLinks = () => {
    return packPins.map(pin => ({
      id: pin.id,
      name: pin.name,
      description: pin.description,
      googleMapsUrl: pin.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pin.name)}`
    }))
  }

  // Open My Maps import page
  const openMyMapsImportPage = () => {
    window.open('https://www.google.com/maps/d/', '_blank')
  }

  // Mark place as saved (for individual links flow)
  const markPlaceAsSaved = (placeId: string) => {
    setSavedPlaces(prev => [...prev, placeId])
  }

  // Debug function to add test packs for testing purposes
  const addTestPack = async () => {
    try {
      // First, let's get an actual pack ID from the database
      const { data: packs, error } = await supabase
        .from('pin_packs')
        .select('id, title')
        .limit(1)

      if (error) throw error

      if (packs && packs.length > 0) {
        const testPackId = packs[0].id
        const existingPurchases = JSON.parse(localStorage.getItem('pinpacks_purchased') || '[]')
        
        if (!existingPurchases.includes(testPackId)) {
          const newPurchases = [...existingPurchases, testPackId]
          localStorage.setItem('pinpacks_purchased', JSON.stringify(newPurchases))
          
          // Reload the purchased packs
          loadPurchasedPacks()
          
          console.log(`Added test pack "${packs[0].title}" to your Pinventory!`)
        } else {
          console.log('This pack is already in your Pinventory!')
        }
      } else {
        console.log('No packs found in database. Please create a pack first by going to /create')
      }
    } catch (error) {
      console.error('Error adding test pack:', error)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-100 mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading your collection...</p>
        </div>
      </div>
    )
  }

  // Show authentication required message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-100 mb-6">
            <Package className="h-8 w-8 text-coral-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in required</h3>
          <p className="text-gray-600 text-lg mb-8">Please sign in to view your purchased packs.</p>
          <button 
            onClick={() => router.push('/auth')}
            className="btn-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Your Pinventory
              </h1>
              <p className="text-gray-600 text-lg">
                All your purchased pin packs in one place
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-coral-500">
                {Object.keys(groupedPacks).length}
              </div>
              <div className="text-sm text-gray-500">
                {Object.keys(groupedPacks).length === 1 ? 'country' : 'countries'} available
              </div>
            </div>
          </div>
        </div>

        {/* Country Grouped Packs */}
        {Object.keys(groupedPacks).length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-6">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No packs purchased yet</h3>
            <p className="text-gray-600 mb-8">
              Start exploring and purchase your first pin pack to see it here!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/browse')}
                className="btn-primary"
              >
                Browse Pin Packs
              </button>
              <button
                onClick={addTestPack}
                className="btn-secondary"
              >
                Add Test Pack (Debug)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(groupedPacks).sort().map((country) => (
              <div key={country} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Country Header */}
                <button
                  onClick={() => toggleCountry(country)}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left border-b border-gray-200"
                >
                  <div className="flex items-center">
                    <div className="flex items-center mr-4">
                      <MapPin className="h-5 w-5 text-coral-500 mr-2" />
                      <h2 className="text-xl font-semibold text-gray-900">{country}</h2>
                    </div>
                    <span className="bg-coral-100 text-coral-700 px-3 py-1 rounded-full text-sm font-medium">
                      {groupedPacks[country].length} {groupedPacks[country].length === 1 ? 'pack' : 'packs'}
                    </span>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                    expandedCountries[country] ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Country Packs */}
                {expandedCountries[country] && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groupedPacks[country].map((pack) => (
                        <div key={pack.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                          {/* Pack Image/Map */}
                          <div className="h-48 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 relative">
                            <div 
                              className="absolute inset-0 bg-cover bg-center"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e0e0e0' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)`,
                                backgroundSize: '60px 60px, cover'
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                              
                              {/* Pin count badge */}
                              <div className="absolute top-3 right-3">
                                <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-2 py-1 rounded-lg text-xs font-medium">
                                  {pack.pin_count} places
                                </span>
                              </div>

                              {/* Location badge */}
                              <div className="absolute bottom-3 left-3 text-white">
                                <div className="flex items-center text-sm">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {pack.city}, {pack.country}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Pack Details */}
                          <div className="p-6">
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                                {pack.title}
                              </h3>
                              <p className="text-gray-600 text-sm line-clamp-2">
                                {pack.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Purchased {new Date(pack.created_at).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                <span>{pack.average_rating || 4.8}</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                              {/* Get Your Places Button - Main CTA */}
                              <button
                                onClick={() => handleGetPlaces(pack)}
                                className="w-full btn-primary flex items-center justify-center py-3"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Get Your Places
                              </button>

                              {/* View Pack Details Button */}
                              <button
                                onClick={() => router.push(`/pack/${pack.id}`)}
                                className="w-full btn-secondary flex items-center justify-center py-2"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Delivery Modal */}
      {showDeliveryModal && selectedPack && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Get Your Places</h2>
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {deliveryStep === 'options' && (
                <div className="p-6 space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Choose how you want to use your places
                    </h3>
                    <p className="text-gray-600">
                      We'll help you get the best experience for your needs
                    </p>
                  </div>

                  {/* Option 1: My Maps (Recommended) */}
                  <div className="relative">
                    <div className="absolute -top-2 -right-2 bg-coral-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Recommended
                    </div>
                    <button
                      onClick={() => setDeliveryStep('mymaps')}
                      className="w-full p-6 border-2 border-coral-200 bg-coral-50 hover:bg-coral-100 rounded-2xl text-left transition-colors"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-coral-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            Complete Experience (My Maps)
                          </h4>
                          <p className="text-gray-600 mb-3">
                            Get all places with descriptions in Google My Maps
                          </p>
                          <div className="space-y-1 text-sm text-gray-700">
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Keeps all descriptions and tips
                            </div>
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Works perfectly on mobile
                            </div>
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Offline access available
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Option 2: Regular Google Maps */}
                  <button
                    onClick={() => setDeliveryStep('manual')}
                    className="w-full p-6 border-2 border-gray-200 hover:border-gray-300 rounded-2xl text-left transition-colors"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Smartphone className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          Regular Google Maps
                        </h4>
                        <p className="text-gray-600 mb-3">
                          Save places individually to your main Google Maps
                        </p>
                        <div className="space-y-1 text-sm text-gray-700">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            In your main Google Maps account
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            Shows in search suggestions
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {deliveryStep === 'mymaps' && (
                <div className="p-6 space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-8 w-8 text-coral-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      My Maps - Complete Experience
                    </h3>
                    <p className="text-gray-600">
                      Get all {packPins.length} places with descriptions in one organized map
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">How it works:</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-coral-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                        <p className="text-gray-700">We'll download a file with all your places</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-coral-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                        <p className="text-gray-700">We'll open Google My Maps for you</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-coral-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                        <p className="text-gray-700">Click "Import" and upload your downloaded file</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setDeliveryStep('options')}
                      className="flex-1 btn-secondary py-3"
                    >
                      Back
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await generateMyMapsKML()
                          openMyMapsImportPage()
                          setShowDeliveryModal(false)
                        } catch (error) {
                          alert(error instanceof Error ? error.message : 'Failed to export')
                        }
                      }}
                      className="flex-2 btn-primary py-3 flex items-center justify-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download & Open My Maps
                    </button>
                  </div>
                </div>
              )}

              {deliveryStep === 'manual' && (
                <div className="p-6 space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Save to Google Maps
                    </h3>
                    <p className="text-gray-600">
                      Easy checklist to save all {packPins.length} places individually
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-2xl p-6 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Quick Instructions:</h4>
                    <p className="text-gray-700 text-sm">
                      Tap each link below, then hit the "Save" button in Google Maps. 
                      We'll keep track of your progress!
                    </p>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {generateIndividualLinks().map((place, index) => (
                      <div
                        key={place.id}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          savedPlaces.includes(place.id)
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 mr-4">
                            <h5 className="font-medium text-gray-900 truncate">
                              {place.name}
                            </h5>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {place.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {index + 1}/{packPins.length}
                            </span>
                            <a
                              href={place.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => markPlaceAsSaved(place.id)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                savedPlaces.includes(place.id)
                                  ? 'bg-green-500 text-white'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                              }`}
                            >
                              {savedPlaces.includes(place.id) ? (
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Saved
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Save
                                </div>
                              )}
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium text-gray-900">
                        {savedPlaces.length} of {packPins.length} places saved
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(savedPlaces.length / packPins.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setDeliveryStep('options')}
                      className="flex-1 btn-secondary py-3"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setShowDeliveryModal(false)}
                      className="flex-1 btn-primary py-3"
                    >
                      {savedPlaces.length === packPins.length ? 'All Done!' : 'Close'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
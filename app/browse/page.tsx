'use client'

import { useState, useEffect } from 'react'
import { MapPin, Download, Star, Users, Search, Filter, QrCode } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PinPack } from '@/lib/supabase'

export default function BrowsePage() {
  // State for storing pin packs from database
  const [pinPacks, setPinPacks] = useState<PinPack[]>([])
  const [filteredPacks, setFilteredPacks] = useState<PinPack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  
  // Get unique countries for filter
  const countries = Array.from(new Set(pinPacks.map(pack => pack.country))).sort()

  // Load pin packs when component mounts
  useEffect(() => {
    loadPinPacks()
  }, [])

  // Filter packs when search term or country changes
  useEffect(() => {
    let filtered = pinPacks

    if (searchTerm) {
      filtered = filtered.filter(pack => 
        pack.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pack.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pack.city.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCountry) {
      filtered = filtered.filter(pack => pack.country === selectedCountry)
    }

    setFilteredPacks(filtered)
  }, [pinPacks, searchTerm, selectedCountry])

  // Function to fetch pin packs from Supabase database
  const loadPinPacks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pin_packs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPinPacks(data || [])
      setFilteredPacks(data || [])
    } catch (err) {
      setError('Failed to load pin packs')
      console.error('Error loading pin packs:', err)
    } finally {
      setLoading(false)
    }
  }

  // Function to open pin pack in Google Maps or generate QR code
  const openPinPack = async (packId: string, format: 'maps' | 'qr' = 'maps') => {
    try {
      // Get pin pack info and pins
      const [{ data: packData }, { data: packPins }] = await Promise.all([
        supabase.from('pin_packs').select('*').eq('id', packId).single(),
        supabase.from('pin_pack_pins').select(`
          pins (
            title,
            description,
            google_maps_url,
            latitude,
            longitude,
            category
          )
        `).eq('pin_pack_id', packId)
      ])

      if (!packData || !packPins) throw new Error('Failed to get pack data')

      if (format === 'maps') {
        // Create Google Maps URL with all locations
        generateGoogleMapsListURL(packData, packPins.map(item => (item as any).pins))
      } else if (format === 'qr') {
        // Generate QR code for the pack
        generateQRCode(packData, packPins.map(item => (item as any).pins))
      }
    } catch (err) {
      alert('Failed to open pin pack')
      console.error('Download error:', err)
    }
  }

  // Generate Google Maps URL with multiple locations (like a list)
  const generateGoogleMapsListURL = (packData: any, pins: any[]) => {
    // Debug: log the pins to see what data we're getting
    console.log('Pins data:', pins)
    
    // Filter out pins with invalid coordinates and create coordinate strings
    const validPins = pins.filter(pin => pin.latitude && pin.longitude && pin.latitude !== 0 && pin.longitude !== 0)
    console.log('Valid pins:', validPins)
    
    if (validPins.length === 0) {
      alert('No valid coordinates found for these pins. Please check the pin pack data.')
      return
    }
    
    // Create a Google Maps directions URL that includes all locations as waypoints
    const coordinates = validPins.map(pin => `${pin.latitude},${pin.longitude}`)
    console.log('Coordinates:', coordinates)
    
    // Google Maps directions URL with multiple waypoints (shows all locations at once)
    const directionsUrl = `https://www.google.com/maps/dir/${coordinates.join('/')}`
    console.log('Directions URL:', directionsUrl)
    
    // Also create a search URL that shows the area with all pins
    const bounds = calculateBounds(validPins)
    const centerLat = (bounds.north + bounds.south) / 2
    const centerLng = (bounds.east + bounds.west) / 2
    const searchUrl = `https://www.google.com/maps/@${centerLat},${centerLng},12z`
    
    // Create individual location URLs for each pin (only valid ones)
    const individualUrls = validPins.map(pin => ({
      title: pin.title,
      description: pin.description,
      url: `https://www.google.com/maps/search/${pin.latitude},${pin.longitude}`,
      coordinates: `${pin.latitude},${pin.longitude}`
    }))
    
    // Open sharing modal with the URL and instructions
    showGoogleMapsModal(packData, validPins, directionsUrl, individualUrls, searchUrl)
  }

  // Calculate bounds for all pins to center the map view
  const calculateBounds = (pins: any[]) => {
    const lats = pins.map(pin => parseFloat(pin.latitude))
    const lngs = pins.map(pin => parseFloat(pin.longitude))
    
    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    }
  }

  // Show modal with Google Maps sharing options
  const showGoogleMapsModal = (packData: any, pins: any[], directionsUrl: string, individualUrls: any[], searchUrl?: string) => {
    // Create modal content
    const modalHtml = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; font-family: Arial, sans-serif;">
        <div style="background: white; border-radius: 16px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; padding: 0;">
          <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 24px; border-radius: 16px 16px 0 0; color: white;">
            <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">${packData.title}</h2>
            <p style="margin: 0; opacity: 0.9;">${packData.city}, ${packData.country} • ${pins.length} locations</p>
          </div>
          
          <div style="padding: 24px;">
            <div style="background: #f1f5f9; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 18px;">📍 Locations in this pack:</h3>
              <div style="max-height: 200px; overflow-y: auto;">
                ${individualUrls.map(location => `
                  <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid #3b82f6;">
                    <div style="font-weight: bold; color: #1e293b; margin-bottom: 4px;">${location.title}</div>
                    <div style="color: #64748b; font-size: 14px; margin-bottom: 8px;">${location.description}</div>
                    <a href="${location.url}" target="_blank" style="background: #3b82f6; color: white; text-decoration: none; font-size: 14px; padding: 6px 12px; border-radius: 6px; font-weight: bold;">📍 Open in Google Maps</a>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <a href="${directionsUrl}" target="_blank" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; text-decoration: none; padding: 16px 24px; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; transition: transform 0.2s; text-align: center; display: block;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                🗺️ View All Locations Together
              </a>
              <button onclick="generateQRForModal('${packData.title}', '${directionsUrl}')" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 16px 24px; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                📱 Share QR Code
              </button>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-top: 16px;">
              <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px;">💡 How to use these locations:</h4>
              <ol style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.5;">
                <li><strong>"View All Locations Together"</strong> - Opens Google Maps with all places visible on one map</li>
                <li><strong>Individual buttons</strong> - Click to open each location separately</li>
                <li><strong>To save places:</strong> Open any location → Click the pin → Tap "Save" → Add to your list</li>
                <li><strong>QR Code</strong> - Share this pin pack with others easily</li>
                <li><strong>Pro tip:</strong> The "View All Together" button shows the best route between all locations!</li>
              </ol>
            </div>
            
            <button onclick="document.body.removeChild(document.getElementById('pinpack-modal'))" style="background: #64748b; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%; margin-top: 16px;">
              Close
            </button>
          </div>
        </div>
      </div>
    `
    
    // Remove any existing modal
    const existingModal = document.getElementById('pinpack-modal')
    if (existingModal) {
      document.body.removeChild(existingModal)
    }
    
    // Create new modal
    const modal = document.createElement('div')
    modal.id = 'pinpack-modal'
    modal.innerHTML = modalHtml
    document.body.appendChild(modal)
    
    // Add QR code function to window
    ;(window as any).generateQRForModal = (title: string, url: string) => {
      // Create a QR code that links directly to the Google Maps directions URL
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`
      
      // Remove existing QR modal if any
      const existingQR = document.getElementById('qr-modal')
      if (existingQR) document.body.removeChild(existingQR)
      
      const qrModal = document.createElement('div')
      qrModal.id = 'qr-modal'
      qrModal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
          <div style="background: white; padding: 30px; border-radius: 16px; text-align: center; max-width: 400px;">
            <h3 style="margin: 0 0 20px 0; color: #1e293b;">${title}</h3>
            <img src="${qrCodeUrl}" alt="QR Code" style="border-radius: 8px; margin-bottom: 20px;" />
            <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">Scan to open all locations directly in Google Maps!<br/><a href="${url}" target="_blank" style="color: #3b82f6;">🗺️ Or click here to open now</a></p>
            <button onclick="document.body.removeChild(document.getElementById('qr-modal'))" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold;">Close</button>
          </div>
        </div>
      `
      document.body.appendChild(qrModal)
    }
  }



  // Generate QR Code for easy sharing
  const generateQRCode = (packData: any, pins: any[]) => {
    // Filter out pins with invalid coordinates
    const validPins = pins.filter(pin => pin.latitude && pin.longitude && pin.latitude !== 0 && pin.longitude !== 0)
    
    if (validPins.length === 0) {
      alert('No valid coordinates found for these pins.')
      return
    }
    
    // Create the same directions URL that shows all locations together
    const coordinates = validPins.map(pin => `${pin.latitude},${pin.longitude}`)
    const directionsUrl = `https://www.google.com/maps/dir/${coordinates.join('/')}`
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(directionsUrl)}`
    
    const qrWindow = window.open('', '_blank', 'width=400,height=500')
    if (qrWindow) {
      qrWindow.document.write(`
        <html>
          <head><title>QR Code - ${packData.title}</title></head>
          <body style="text-align:center; font-family:Arial; padding:20px;">
            <h2>${packData.title}</h2>
            <p><strong>Scan to view all ${validPins.length} locations together in Google Maps!</strong></p>
            <img src="${qrCodeUrl}" alt="QR Code" style="border:1px solid #ccc; border-radius:8px;" />
            <p style="margin-top:20px; font-size:14px; color:#666;">
              This QR code opens Google Maps with all locations visible<br>
              <a href="${directionsUrl}" target="_blank" style="color:#4285f4; text-decoration:none;">🗺️ Open in Google Maps</a>
            </p>
            <p style="margin-top:20px;">
              <button onclick="window.print()" style="background:#4285f4; color:white; border:none; padding:10px 20px; border-radius:4px; cursor:pointer;">Print QR Code</button>
            </p>
          </body>
        </html>
      `)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Browse Pin Packs
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Discover curated collections from locals around the world. 
            Find authentic experiences for your next adventure.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by city, title, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Country Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-48"
              >
                <option value="">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            {loading ? 'Loading...' : `${filteredPacks.length} pin pack${filteredPacks.length !== 1 ? 's' : ''} found`}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-6 text-gray-600 text-lg">Loading pin packs...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button 
              onClick={loadPinPacks}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredPacks.length === 0 && pinPacks.length === 0 && (
          <div className="text-center py-16">
            <MapPin className="h-20 w-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Pin Packs Yet</h3>
            <p className="text-gray-600 text-lg mb-8">
              Be the first to create a pin pack and help travelers discover your city!
            </p>
            <a href="/create" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg px-8 py-4 rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 inline-flex items-center">
              Create First Pin Pack
            </a>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && filteredPacks.length === 0 && pinPacks.length > 0 && (
          <div className="text-center py-16">
            <Search className="h-20 w-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Results Found</h3>
            <p className="text-gray-600 text-lg mb-8">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <button 
              onClick={() => {
                setSearchTerm('')
                setSelectedCountry('')
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Pin Packs Grid */}
        {!loading && !error && filteredPacks.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPacks.map((pack) => (
              <div 
                key={pack.id} 
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden transform hover:-translate-y-2"
              >
                {/* Card header with gradient */}
                <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {pack.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <MapPin className="h-4 w-4 mr-1 text-blue-500" />
                        <span className="font-medium">{pack.city}, {pack.country}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                        ${pack.price}
                      </div>
                      {pack.price === 0 && (
                        <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full mt-1">
                          FREE
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {pack.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm mb-6 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="font-medium">{pack.pin_count} pins</span>
                    </div>
                    <div className="flex items-center text-yellow-600">
                      <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                      <span className="font-medium">Local Made</span>
                    </div>
                  </div>
                  
                                    <button
                    onClick={() => openPinPack(pack.id, 'maps')}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Open in Google Maps
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 
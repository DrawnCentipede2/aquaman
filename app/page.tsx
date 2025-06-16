'use client'

import { useState, useEffect } from 'react'
import { MapPin, Download, Star, Users, Plus, Shield, Globe, Heart, ArrowRight, CheckCircle, QrCode, Search, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PinPack } from '@/lib/supabase'

export default function LandingPage() {
  // State for storing pin packs from database
  const [pinPacks, setPinPacks] = useState<PinPack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load pin packs when component mounts
  useEffect(() => {
    loadPinPacks()
  }, [])

  // Function to fetch pin packs from Supabase database
  const loadPinPacks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pin_packs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6) // Only show 6 featured packs

      if (error) throw error
      setPinPacks(data || [])
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

      // Track the download/view
      try {
        // Get user location for analytics
        const locationResponse = await fetch('https://ipapi.co/json/')
        const locationData = await locationResponse.json()
        const userLocation = `${locationData.city}, ${locationData.country_name}`

        // Record the download
        await supabase.from('pack_downloads').insert({
          pin_pack_id: packId,
          download_type: format,
          user_location: userLocation,
          user_ip: locationData.ip
        })

        // Update download count in pin_packs table
        await supabase
          .from('pin_packs')
          .update({ download_count: (packData.download_count || 0) + 1 })
          .eq('id', packId)
      } catch (analyticsErr) {
        // Don't fail the main function if analytics fail
        console.log('Analytics tracking failed:', analyticsErr)
      }

      if (format === 'maps') {
        // Open Google Maps directly without modal
        openGoogleMapsDirectly(packData, packPins.map(item => (item as any).pins))
      } else if (format === 'qr') {
        // Generate QR code for the pack
        generateQRCode(packData, packPins.map(item => (item as any).pins))
      }
    } catch (err) {
      alert('Failed to open pin pack')
      console.error('Download error:', err)
    }
  }

  // Generate KML file content
  const generateKML = (title: string, description: string, pins: any[]) => {
    const placemarks = pins.map(pin => `
    <Placemark>
      <n>${escapeXML(pin.title)}</n>
      <description><![CDATA[
        <p>${escapeXML(pin.description)}</p>
        <p><strong>Category:</strong> ${escapeXML(pin.category)}</p>
        <p><a href="${pin.google_maps_url}" target="_blank">View on Google Maps</a></p>
      ]]></description>
      <Point>
        <coordinates>${pin.longitude},${pin.latitude},0</coordinates>
      </Point>
      <Style>
        <IconStyle>
          <Icon>
            <href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href>
          </Icon>
        </IconStyle>
      </Style>
    </Placemark>`).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <n>${escapeXML(title)}</n>
    <description>${escapeXML(description)}</description>
    ${placemarks}
  </Document>
</kml>`
  }

  // Escape XML characters
  const escapeXML = (str: string) => {
    return str.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;'
        case '>': return '&gt;'
        case '&': return '&amp;'
        case "'": return '&apos;'
        case '"': return '&quot;'
        default: return c
      }
    })
  }

  // Generate QR Code for easy sharing
  const generateQRCode = (packData: any, pins: any[]) => {
    // Create a shareable URL (for now, we'll create a Google Maps search URL)
    const searchQuery = `${packData.title} ${packData.city}`
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`
    
    // Create QR code URL (using a free QR code service)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mapsUrl)}`
    
    // Open QR code in new window
    const qrWindow = window.open('', '_blank', 'width=400,height=500')
    if (qrWindow) {
      qrWindow.document.write(`
        <html>
          <head><title>QR Code - ${packData.title}</title></head>
          <body style="text-align:center; font-family:Arial; padding:20px;">
            <h2>${packData.title}</h2>
            <p>Scan this QR code to search for these locations on Google Maps</p>
            <img src="${qrCodeUrl}" alt="QR Code" style="border:1px solid #ccc; border-radius:8px;" />
            <p style="margin-top:20px; font-size:12px; color:#666;">
              Or visit: <br><a href="${mapsUrl}" target="_blank">${mapsUrl}</a>
            </p>
            <p style="margin-top:20px;">
              <button onclick="window.print()" style="background:#4285f4; color:white; border:none; padding:10px 20px; border-radius:4px; cursor:pointer;">Print QR Code</button>
            </p>
          </body>
        </html>
      `)
    }
  }

  // Open Google Maps directly without any modal
  const openGoogleMapsDirectly = (packData: any, pins: any[]) => {
    // Check if pins have valid coordinates
    const pinsWithCoords = pins.filter(pin => pin.latitude !== 0 || pin.longitude !== 0)
    const pinsWithoutCoords = pins.filter(pin => pin.latitude === 0 && pin.longitude === 0)
    
    if (pinsWithCoords.length === 0 && pinsWithoutCoords.length > 0) {
      // All pins are from a Google Maps list URL - check if we have the original list URL
      const hasListUrl = pinsWithoutCoords.some(pin => 
        pin.google_maps_url && (
          pin.google_maps_url.includes('/lists/') || 
          pin.google_maps_url.includes('list/') ||
          (pin.google_maps_url.includes('maps.app.goo.gl') && !pin.google_maps_url.includes('@'))
        )
      )
      
      if (hasListUrl) {
        // Open the original Google Maps list URL directly
        const listUrl = pinsWithoutCoords[0].google_maps_url
        window.open(listUrl, '_blank')
        return
      } else {
        alert('No valid coordinates found for these pins. Please check the pin pack data.')
        return
      }
    }
    
    // If we have pins with coordinates, create a directions URL with all waypoints
    if (pinsWithCoords.length > 1) {
      // Create Google Maps directions URL with multiple waypoints
      const coordinates = pinsWithCoords.map(pin => `${pin.latitude},${pin.longitude}`)
      const directionsUrl = `https://www.google.com/maps/dir/${coordinates.join('/')}`
      window.open(directionsUrl, '_blank')
    } else if (pinsWithCoords.length === 1) {
      // Single location - open directly
      const pin = pinsWithCoords[0]
      const singleUrl = `https://www.google.com/maps/search/${pin.latitude},${pin.longitude}`
      window.open(singleUrl, '_blank')
    } else {
      // Fallback to search by pack title and city
      const fallbackUrl = `https://www.google.com/maps/search/${encodeURIComponent(packData.title + ' ' + packData.city)}`
      window.open(fallbackUrl, '_blank')
    }
  }

  // Show modal specifically for Google Maps list URLs
  const showGoogleMapsListModal = (packData: any, pins: any[], listUrl: string) => {
    const modalHtml = `
      <div id="pinpack-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; font-family: Arial, sans-serif;">
        <div style="background: white; border-radius: 16px; max-width: 500px; width: 90%; padding: 0;">
          <div style="background: linear-gradient(135deg, #fb7185, #f59e0b); padding: 24px; border-radius: 16px 16px 0 0; color: white;">
            <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">📋 ${packData.title}</h2>
            <p style="margin: 0; opacity: 0.9;">${packData.city}, ${packData.country} • Google Maps List</p>
          </div>
          
          <div style="padding: 24px;">
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin-bottom: 20px; text-align: center;">
              <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 18px;">🗺️ This is a Google Maps List!</h3>
              <p style="margin: 0 0 16px 0; color: #92400e; line-height: 1.5;">This pin pack was created from a Google Maps list. Click below to open the complete list directly in Google Maps.</p>
              <a href="${listUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; font-size: 16px; font-weight: bold; padding: 16px 24px; border-radius: 12px; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                🚀 Open Complete List in Google Maps
              </a>
            </div>
            
            <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <h4 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px;">📱 What you'll get:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 14px; line-height: 1.5;">
                <li>Complete Google Maps list with all ${pins.length} places</li>
                <li>Ability to save the entire list to your Google Maps</li>
                <li>Get directions to any place in the list</li>
                <li>Access offline if you save it to your phone</li>
              </ul>
            </div>
            
            <button onclick="document.body.removeChild(document.getElementById('pinpack-modal'))" style="background: #64748b; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%;">
              Close
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHtml)
  }

  // Show modal with Google Maps sharing options
  const showGoogleMapsModal = (packData: any, pins: any[], mapsUrl: string, individualUrls: any[]) => {
    const modalHtml = `
      <div id="pinpack-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; font-family: Arial, sans-serif;">
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
                  <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid ${location.hasCoordinates ? '#3b82f6' : '#f59e0b'};">
                    <div style="font-weight: bold; color: #1e293b; margin-bottom: 4px;">${location.title}</div>
                    <div style="color: #64748b; font-size: 14px; margin-bottom: 8px;">${location.description}</div>
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
                      ${location.hasCoordinates ? `📍 ${location.coordinates}` : `🔗 ${location.coordinates}`}
                    </div>
                    <a href="${location.url}" target="_blank" style="background: ${location.hasCoordinates ? '#3b82f6' : '#f59e0b'}; color: white; text-decoration: none; font-size: 14px; padding: 6px 12px; border-radius: 6px; font-weight: bold;">
                      ${location.hasCoordinates ? '📍 Open in Google Maps' : '🔗 Open Original URL'}
                    </a>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <button onclick="generateQRForModal('${packData.title}', '${mapsUrl}')" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 16px 24px; border-radius: 12px; font-size: 16px; font-weight: bold; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                📱 Show QR Code for All Locations
              </button>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-top: 16px;">
              <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px;">💡 How to save to your Google Maps:</h4>
              <ol style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.5;">
                <li>Click "Open in Google Maps" for each location above</li>
                <li>In Google Maps, tap/click the location pin</li>
                <li>Tap "Save" and add to a new or existing list</li>
                <li>Your saved places will appear in your Google Maps "Saved" tab</li>
                <li>Or use the QR code to share all locations easily!</li>
              </ol>
            </div>
            
            <button onclick="document.body.removeChild(document.getElementById('pinpack-modal'))" style="background: #64748b; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%; margin-top: 16px;">
              Close
            </button>
          </div>
        </div>
      </div>
    `
    
    const existingModal = document.getElementById('pinpack-modal')
    if (existingModal) document.body.removeChild(existingModal)
    
    const modal = document.createElement('div')
    modal.id = 'pinpack-modal'
    modal.innerHTML = modalHtml
    document.body.appendChild(modal)
    
    ;(window as any).generateQRForModal = (title: string, url: string) => {
      // Create a QR code that links to our website which will then redirect to the locations
      const shareUrl = `${window.location.origin}/browse`
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`
      
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
            <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">Scan to visit our pin pack marketplace<br/>and find these locations!</p>
            <button onclick="document.body.removeChild(document.getElementById('qr-modal'))" style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold;">Close</button>
          </div>
        </div>
      `
      document.body.appendChild(qrModal)
    }
  }

  // Sample testimonials
  const testimonials = [
    {
      name: "Sarah Chen",
      location: "Traveled to Barcelona",
      text: "The local coffee shops pack was incredible! Found hidden gems I never would have discovered on my own. So much better than generic travel guides.",
      rating: 5,
      avatar: "SC"
    },
    {
      name: "Mike Rodriguez",
      location: "Local from Mexico City",
      text: "Love sharing my favorite spots with travelers! Made $200 this month just by creating packs of my neighborhood's best tacos and local markets.",
      rating: 5,
      avatar: "MR"
    },
    {
      name: "Emma Thompson",
      location: "Traveled to Tokyo",
      text: "Authentic recommendations from real locals made my trip unforgettable. No more tourist traps - just real experiences.",
      rating: 5,
      avatar: "ET"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Airbnb-inspired Hero Section */}
      <div className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-br from-coral-50 via-white to-gray-50 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-coral-200 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-primary-200 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Hero content */}
          <div className="space-y-8 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
              Find amazing places
              <br />
              <span className="text-coral-500">created by locals</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover authentic travel experiences through curated pin collections from people who know their cities best.
            </p>

            {/* Airbnb-style search bar with redirect functionality */}
            <div className="mt-12 max-w-2xl mx-auto">
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  const searchInput = e.currentTarget.querySelector('input') as HTMLInputElement
                  const searchQuery = searchInput.value.trim()
                  // Redirect to browse page with search query
                  window.location.href = searchQuery 
                    ? `/browse?search=${encodeURIComponent(searchQuery)}`
                    : '/browse'
                }}
                className="search-bar p-2 flex items-center w-full"
              >
                <div className="flex-1 flex items-center">
                  <Search className="h-5 w-5 text-gray-400 ml-4 mr-3" />
                  <input
                    type="text"
                    placeholder="Where do you want to explore?"
                    className="flex-1 border-none outline-none text-gray-700 text-lg placeholder-gray-400 bg-transparent w-full"
                  />
                </div>
                <button 
                  type="submit"
                  className="btn-primary ml-4 px-8 py-4 text-lg flex items-center"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-coral-500 mb-1">{pinPacks.length}+</div>
                <div className="text-gray-600 font-medium">Pin Packs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-coral-500 mb-1">100%</div>
                <div className="text-gray-600 font-medium">Local Made</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-coral-500 mb-1">Free</div>
                <div className="text-gray-600 font-medium">During Beta</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Pin Packs Section */}
      <div className="py-20 bg-gray-25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Explore places recommended by locals
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hand-picked locations from people who call these places home.
            </p>
          </div>

          {loading && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-100 mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
              </div>
              <p className="text-gray-600 text-lg">Finding amazing places...</p>
            </div>
          )}

          {!loading && pinPacks.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <MapPin className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Be the first to share!</h3>
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                No pin packs yet. Create the first one and help travelers discover your city.
              </p>
              <a 
                href="/create" 
                onClick={(e) => {
                  const userProfile = localStorage.getItem('pinpacks_user_profile')
                  if (!userProfile) {
                    e.preventDefault()
                    window.location.href = '/signup'
                  }
                }}
                className="btn-primary inline-flex items-center text-lg px-8 py-4"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create First Pin Pack
              </a>
            </div>
          )}

          {!loading && pinPacks.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {pinPacks.map((pack, index) => (
                  <div 
                    key={pack.id} 
                    className="card-airbnb card-airbnb-hover group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Card image placeholder */}
                    <div className="h-64 bg-gradient-to-br from-coral-100 to-gray-100 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      <div className="absolute top-4 right-4">
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-coral-600">
                          {pack.pin_count} pins
                        </div>
                      </div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <div className="flex items-center space-x-1 text-sm">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="font-medium">Local favorite</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-coral-600 transition-colors line-clamp-1">
                            {pack.title}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{pack.city}, {pack.country}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {pack.price === 0 ? 'Free' : `$${pack.price}`}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-6 leading-relaxed line-clamp-2">
                        {pack.description}
                      </p>
                      
                      <button
                        onClick={() => openPinPack(pack.id, 'maps')}
                        className="w-full btn-primary flex items-center justify-center group"
                      >
                        <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        Open in Google Maps
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <a href="/browse" className="btn-secondary inline-flex items-center text-lg px-8 py-4">
                  Show all destinations
                  <ArrowRight className="h-5 w-5 ml-2" />
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How PinPacks works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, authentic, and created by the people who know best.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-coral-100 mb-6 group-hover:bg-coral-200 transition-colors">
                <Users className="h-10 w-10 text-coral-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Locals create</h3>
              <p className="text-gray-600 leading-relaxed">
                Real people who live in these places share their favorite hidden gems and authentic experiences.
              </p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-coral-100 mb-6 group-hover:bg-coral-200 transition-colors">
                <Shield className="h-10 w-10 text-coral-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">We verify</h3>
              <p className="text-gray-600 leading-relaxed">
                We ensure all recommendations come from verified locals to guarantee authentic experiences.
              </p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-coral-100 mb-6 group-hover:bg-coral-200 transition-colors">
                <Globe className="h-10 w-10 text-coral-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">You explore</h3>
              <p className="text-gray-600 leading-relaxed">
                Download collections directly to your phone and explore cities like a local with one-click Google Maps.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 gradient-coral">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 text-shadow">
            Ready to explore like a local?
          </h2>
          <p className="text-xl text-white/90 mb-12 text-shadow">
            Join thousands discovering authentic places through local recommendations.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <a href="/browse" className="btn-secondary bg-white text-coral-500 hover:bg-gray-50 inline-flex items-center text-lg px-8 py-4">
              <Globe className="h-5 w-5 mr-2" />
              Browse destinations
            </a>
            <a 
              href="/create" 
              onClick={(e) => {
                const userProfile = localStorage.getItem('pinpacks_user_profile')
                if (!userProfile) {
                  e.preventDefault()
                  window.location.href = '/signup'
                }
              }}
              className="btn-outline border-white text-white hover:bg-white hover:text-coral-500 inline-flex items-center text-lg px-8 py-4"
            >
              <Heart className="h-5 w-5 mr-2" />
              Share your city
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { MapPin, Download, Star, Users, Plus, Shield, Globe, Heart, ArrowRight, CheckCircle, QrCode } from 'lucide-react'
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

  // Generate KML file content
  const generateKML = (title: string, description: string, pins: any[]) => {
    const placemarks = pins.map(pin => `
    <Placemark>
      <name>${escapeXML(pin.title)}</name>
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
    <name>${escapeXML(title)}</name>
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

  // Generate Google Maps URL with multiple locations (like a list)
  const generateGoogleMapsListURL = (packData: any, pins: any[]) => {
    // Create a Google Maps search URL that shows the first location
    // We'll show individual locations in the modal for better user experience
    const firstPin = pins[0]
    const mainUrl = `https://www.google.com/maps/search/${firstPin.latitude},${firstPin.longitude}`
    
    // Create individual location URLs for each pin
    const individualUrls = pins.map(pin => ({
      title: pin.title,
      description: pin.description,
      url: `https://www.google.com/maps/search/${pin.latitude},${pin.longitude}`,
      coordinates: `${pin.latitude},${pin.longitude}`
    }))
    
    // Open sharing modal with the URL and instructions
    showGoogleMapsModal(packData, pins, mainUrl, individualUrls)
  }

  // Show modal with Google Maps sharing options
  const showGoogleMapsModal = (packData: any, pins: any[], mapsUrl: string, individualUrls: any[]) => {
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
    <div className="min-h-screen">
      {/* Hero section */}
      <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
        <div className="absolute inset-0 bg-white/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
                <MapPin className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-8">
              Travel Like a Local
              <br />
              <span className="text-5xl md:text-6xl">Not a Tourist</span>
            </h1>
            <p className="text-2xl md:text-3xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Get curated pin collections from real locals who know their cities inside out. 
              Skip the tourist traps and discover authentic experiences.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
              <a href="/browse" className="group relative bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-xl px-12 py-5 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative flex items-center">
                  <Globe className="h-6 w-6 mr-3" />
                  Browse Pin Packs
                </span>
              </a>
              <a href="/create" className="group bg-white/90 backdrop-blur-sm text-gray-800 font-bold text-xl px-12 py-5 rounded-2xl border-2 border-gray-200 hover:border-purple-300 hover:bg-white hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300">
                <span className="flex items-center">
                  <Plus className="h-6 w-6 mr-3" />
                  Create Your Pack
                </span>
              </a>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/30">
                <div className="text-4xl font-bold text-blue-600 mb-2">{pinPacks.length}+</div>
                <div className="text-gray-700 font-medium">Pin Packs Available</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/30">
                <div className="text-4xl font-bold text-purple-600 mb-2">100%</div>
                <div className="text-gray-700 font-medium">Created by Locals</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/30">
                <div className="text-4xl font-bold text-green-600 mb-2">Free</div>
                <div className="text-gray-700 font-medium">During MVP Phase</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How PinPacks Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, authentic, and created by the people who know best - the locals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Locals Create</h3>
              <p className="text-gray-600 leading-relaxed">
                Real locals curate collections of their favorite hidden gems, authentic restaurants, 
                and must-visit spots that tourists never find.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">We Verify</h3>
              <p className="text-gray-600 leading-relaxed">
                We ensure creators are actually local to the areas they're sharing. 
                No fake recommendations or tourist traps allowed.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Download className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">You Explore</h3>
              <p className="text-gray-600 leading-relaxed">
                Download pin collections directly to your phone and explore cities like a local. 
                One-click import to Google Maps.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Pin Packs */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Featured Pin Packs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the most popular collections created by locals around the world.
            </p>
          </div>

          {loading && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-6 text-gray-600 text-lg">Loading amazing pin packs...</p>
            </div>
          )}

          {!loading && pinPacks.length === 0 && (
            <div className="text-center py-16">
              <MapPin className="h-20 w-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Be the First!</h3>
              <p className="text-gray-600 text-lg mb-8">
                No pin packs yet. Create the first one and help travelers discover your city!
              </p>
              <a href="/create" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg px-8 py-4 rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 inline-flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Create First Pin Pack
              </a>
            </div>
          )}

          {!loading && pinPacks.length > 0 && (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {pinPacks.map((pack) => (
                  <div 
                    key={pack.id} 
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden transform hover:-translate-y-2"
                  >
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
              
              <div className="text-center">
                <a href="/browse" className="bg-gradient-to-r from-gray-700 to-gray-900 text-white font-semibold text-lg px-8 py-4 rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 inline-flex items-center">
                  View All Pin Packs
                  <ArrowRight className="h-5 w-5 ml-2" />
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What People Are Saying
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real experiences from travelers and locals using PinPacks.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl border border-blue-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.location}</p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-gray-700 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Travel Like a Local?
          </h2>
          <p className="text-xl text-blue-100 mb-12">
            Join thousands of travelers discovering authentic experiences through local recommendations.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <a href="/browse" className="bg-white text-blue-600 font-bold text-xl px-10 py-5 rounded-2xl hover:bg-blue-50 transform hover:-translate-y-1 transition-all duration-200 inline-flex items-center justify-center">
              <Globe className="h-6 w-6 mr-3" />
              Start Exploring
            </a>
            <a href="/create" className="border-2 border-white text-white font-bold text-xl px-10 py-5 rounded-2xl hover:bg-white hover:text-blue-600 transform hover:-translate-y-1 transition-all duration-200 inline-flex items-center justify-center">
              <Heart className="h-6 w-6 mr-3" />
              Share Your City
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 
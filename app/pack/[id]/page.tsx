'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, Download, Star, Users, Heart, Share2, Calendar, Clock, ArrowLeft, ChevronLeft, ChevronRight, QrCode, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PinPack } from '@/lib/supabase'

export default function PackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const packId = params.id as string

  // State management for the pack detail page
  const [pack, setPack] = useState<PinPack | null>(null)
  const [pins, setPins] = useState<any[]>([])
  const [similarPacks, setSimilarPacks] = useState<PinPack[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wishlistItems, setWishlistItems] = useState<string[]>([])
  
  // Image gallery state for navigating through pack photos
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // Function to generate map with pins when there are no photos
  const generateMapImage = () => {
    if (!pack || pins.length === 0) return null
    
    // Create a static map with pins using Google Maps Static API
    const mapWidth = 800
    const mapHeight = 600
    const zoom = 13
    
    // Use the first pin's coordinates, or fall back to city center
    const centerLat = pins[0]?.latitude || 0
    const centerLng = pins[0]?.longitude || 0
    
    // Create markers for all pins
    const markers = pins
      .filter(pin => pin.latitude && pin.longitude)
      .map((pin, index) => `markers=color:red%7Clabel:${index + 1}%7C${pin.latitude},${pin.longitude}`)
      .join('&')
    
    // Fallback to a simple map centered on the city if no coordinates
    if (!centerLat || !centerLng) {
      return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(pack.city + ', ' + pack.country)}&zoom=12&size=${mapWidth}x${mapHeight}&maptype=roadmap&key=YOUR_API_KEY`
    }
    
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=${zoom}&size=${mapWidth}x${mapHeight}&maptype=roadmap&${markers}&key=YOUR_API_KEY`
    
    return mapUrl
  }
  
  // Since we don't have actual photos yet, we'll use the map as background
  const getDisplayImage = () => {
    const mapUrl = generateMapImage()
    if (mapUrl) return mapUrl
    
    // Fallback gradient if map generation fails
    return null
  }

  // Load pack details when the component first loads
  useEffect(() => {
    if (packId) {
      loadPackDetails()
      loadWishlist()
    }
  }, [packId])

  // Load user's wishlist from browser storage
  const loadWishlist = () => {
    const savedWishlist = localStorage.getItem('pinpacks_wishlist')
    if (savedWishlist) {
      try {
        const wishlist = JSON.parse(savedWishlist)
        const wishlistIds = wishlist.map((item: any) => item.id)
        setWishlistItems(wishlistIds)
      } catch (error) {
        console.error('Error loading wishlist:', error)
      }
    }
  }

  // Main function to load all pack details, pins, and similar packs
  const loadPackDetails = async () => {
    try {
      setLoading(true)
      console.log('Loading pack details for ID:', packId) // Debug log
      
      // First, get the main pack information from database
      const { data: packData, error: packError } = await supabase
        .from('pin_packs')
        .select('*')
        .eq('id', packId)
        .single()

      console.log('Pack query result:', { packData, packError }) // Debug log

      if (packError) throw packError
      if (!packData) throw new Error('Pack not found')
      
      setPack(packData)

      // Load all the pins/places that belong to this pack using the junction table
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
            longitude,
            created_at
          )
        `)
        .eq('pin_pack_id', packId)

      console.log('Pins query result:', { packPinsData, pinsError }) // Debug log

      if (pinsError) {
        console.warn('Error loading pins:', pinsError)
        // Don't throw error for pins, just set empty array
        setPins([])
      } else {
        // Extract the pins from the junction table response and map to expected format
        const pinsData = packPinsData?.map((item: any) => ({
          id: item.pins.id,
          name: item.pins.title, // Map 'title' to 'name' for consistency with existing code
          title: item.pins.title,
          description: item.pins.description,
          google_maps_url: item.pins.google_maps_url,
          category: item.pins.category,
          latitude: item.pins.latitude,
          longitude: item.pins.longitude,
          created_at: item.pins.created_at,
          address: null // Address is not in the schema, so we'll use the city
        })) || []
        
        setPins(pinsData)
      }

      // Find similar packs from the same city or country (excluding current pack)
      const { data: similarData, error: similarError } = await supabase
        .from('pin_packs')
        .select('*')
        .or(`city.eq.${packData.city},country.eq.${packData.country}`)
        .neq('id', packId)
        .limit(8)

      if (similarError) {
        console.warn('Error loading similar packs:', similarError)
        setSimilarPacks([])
      } else {
        setSimilarPacks(similarData || [])
      }

      // Mock reviews data since we don't have a reviews table yet
      // This shows realistic reviews that would appear on a pack detail page
      setReviews([
        {
          id: 1,
          user_name: 'Sarah Chen',
          user_avatar: 'SC',
          rating: 5,
          comment: 'Amazing local spots! Found some hidden gems I never would have discovered on my own.',
          date: '2024-01-15',
          verified: true
        },
        {
          id: 2,
          user_name: 'Miguel Rodriguez',
          user_avatar: 'MR',
          rating: 5,
          comment: 'Perfect for exploring the authentic side of the city. Highly recommend!',
          date: '2024-01-10',
          verified: true
        },
        {
          id: 3,
          user_name: 'Emma Wilson',
          user_avatar: 'EW',
          rating: 4,
          comment: 'Great selection of places. Some were closed when I visited but overall excellent.',
          date: '2024-01-08',
          verified: false
        }
      ])

    } catch (err) {
      console.error('Detailed error loading pack details:', err) // Enhanced debug log
      setError(`Failed to load pack details: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Function to add a pack to user's wishlist
  const addToWishlist = (pack: PinPack) => {
    try {
      const savedWishlist = localStorage.getItem('pinpacks_wishlist')
      let currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : []
      
      // Check if pack is already in wishlist to avoid duplicates
      const isAlreadyInWishlist = currentWishlist.some((item: any) => item.id === pack.id)
      
      if (!isAlreadyInWishlist) {
        currentWishlist.push(pack)
        localStorage.setItem('pinpacks_wishlist', JSON.stringify(currentWishlist))
        setWishlistItems(prev => [...prev, pack.id])
        console.log('Added to wishlist:', pack.title)
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error)
    }
  }

  // Function to remove a pack from user's wishlist
  const removeFromWishlist = (packId: string) => {
    try {
      const savedWishlist = localStorage.getItem('pinpacks_wishlist')
      let currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : []
      
      currentWishlist = currentWishlist.filter((item: any) => item.id !== packId)
      localStorage.setItem('pinpacks_wishlist', JSON.stringify(currentWishlist))
      setWishlistItems(prev => prev.filter(id => id !== packId))
      console.log('Removed from wishlist:', packId)
    } catch (error) {
      console.error('Error removing from wishlist:', error)
    }
  }

  // Toggle wishlist status - add if not in wishlist, remove if already in wishlist
  const toggleWishlist = (pack: PinPack) => {
    const isInWishlist = wishlistItems.includes(pack.id)
    if (isInWishlist) {
      removeFromWishlist(pack.id)
    } else {
      addToWishlist(pack)
    }
  }

  // Navigate to another similar pack's detail page
  const navigateToSimilarPack = (similarPackId: string) => {
    router.push(`/pack/${similarPackId}`)
  }

  // Open the pack's locations in Google Maps
  const openInGoogleMaps = async () => {
    if (!pack || pins.length === 0) return

    try {
      // Create a search query with all the places in the pack
      const placesQuery = pins
        .map(pin => `${pin.name || pin.title}, ${pack.city}`)
        .join(' | ')
      
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(placesQuery)}`
      window.open(mapsUrl, '_blank')
      
      // Update download count in database when user opens in maps
      await supabase
        .from('pin_packs')
        .update({ download_count: (pack.download_count || 0) + 1 })
        .eq('id', pack.id)
        
    } catch (error) {
      console.error('Error opening in Google Maps:', error)
    }
  }

  // Share the pack using native share API or copy link to clipboard
  const sharePackage = async () => {
    const shareUrl = window.location.href
    
    if (navigator.share) {
      // Use native share API if available (mobile devices)
      try {
        await navigator.share({
          title: pack?.title || 'Check out this pin pack',
          text: pack?.description || 'Amazing local recommendations',
          url: shareUrl,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(shareUrl)
      alert('Link copied to clipboard!')
    }
  }

  // Show loading screen while pack data is being loaded
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-100 mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading pack details...</p>
        </div>
      </div>
    )
  }

  // Show error screen if pack couldn't be loaded or doesn't exist
  if (error || !pack) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
            <MapPin className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Pack not found</h3>
          <p className="text-gray-600 text-lg mb-8">{error || 'This pack may have been removed or the link is incorrect.'}</p>
          <button 
            onClick={() => router.push('/browse')}
            className="btn-primary"
          >
            Browse Other Packs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-25">
      {/* Header with back navigation button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area - Takes up 2/3 of the space on large screens */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Map Display Section showing pack location */}
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 rounded-2xl overflow-hidden relative">
                {/* Simple map background that always works - using a generic map pattern */}
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e0e0e0' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)`,
                    backgroundSize: '60px 60px, cover',
                    backgroundPosition: 'center, center'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  
                  {/* Add some map-like elements for visual interest */}
                  <div className="absolute inset-0">
                    {/* Simulated roads/paths */}
                    <div className="absolute top-1/3 left-0 right-0 h-1 bg-white/30 transform -rotate-12"></div>
                    <div className="absolute top-2/3 left-0 right-0 h-1 bg-white/30 transform rotate-12"></div>
                    <div className="absolute left-1/4 top-0 bottom-0 w-1 bg-white/30 transform rotate-6"></div>
                    <div className="absolute right-1/3 top-0 bottom-0 w-1 bg-white/30 transform -rotate-6"></div>
                    
                    {/* Simulated landmarks/pins */}
                    <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-coral-500 rounded-full shadow-lg"></div>
                    <div className="absolute top-3/5 right-1/4 w-3 h-3 bg-coral-500 rounded-full shadow-lg"></div>
                    <div className="absolute bottom-1/4 left-2/3 w-3 h-3 bg-coral-500 rounded-full shadow-lg"></div>
                  </div>
                </div>

                {/* Overlay content */}
                <div className="absolute inset-0 flex flex-col justify-between p-6">
                  {/* Top right info */}
                  <div className="flex justify-end">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-sm font-medium text-gray-800 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {pack.city}, {pack.country}
                    </div>
                  </div>

                  {/* Bottom left info */}
                  <div className="text-white">
                    <div className="flex items-center space-x-2 text-sm mb-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium">4.8 • {pack.download_count || 0} downloads</span>
                    </div>
                    <div className="bg-coral-500 text-white px-3 py-1 rounded-lg text-sm font-medium inline-flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {pins.length} amazing places
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Pack Information Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {pack.title}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span className="text-lg">{pack.city}, {pack.country}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Created {new Date(pack.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      2-3 hours to explore
                    </div>
                  </div>
                </div>
                
                {/* Action buttons for wishlist and sharing */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleWishlist(pack)}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <Heart 
                      className={`h-5 w-5 transition-colors ${
                        wishlistItems.includes(pack.id) 
                          ? 'text-coral-500 fill-current' 
                          : 'text-gray-600'
                      }`} 
                    />
                  </button>
                  
                  <button
                    onClick={sharePackage}
                    className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <Share2 className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Detailed description of the pack */}
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                <p>{pack.description}</p>
                
                <p>Discover the authentic side of {pack.city} through this carefully curated collection of local favorites. 
                Each location has been personally selected and visited, ensuring you experience the city like a true local.</p>
                
                <p>Perfect for travelers who want to go beyond typical tourist attractions and experience the real culture, 
                food, and atmosphere that makes this place special.</p>
              </div>
            </div>

            {/* List of all places/pins in this pack */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Places in this pack ({pins.length})
              </h2>
              
              <div className="space-y-4">
                {pins.map((pin, index) => (
                  <div key={pin.id} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                    {/* Numbered indicator for each place */}
                    <div className="w-8 h-8 bg-coral-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{pin.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{pin.description}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{pin.address || 'Address available in map'}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                      <span>Local favorite</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews and ratings section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Reviews ({reviews.length})
                </h2>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-semibold">4.8</span>
                  <span className="text-gray-500">({reviews.length} reviews)</span>
                </div>
              </div>

              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex items-start space-x-4">
                      {/* User avatar with initials */}
                      <div className="w-10 h-10 bg-coral-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {review.user_avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{review.user_name}</span>
                            {review.verified && (
                              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                Verified
                              </span>
                            )}
                          </div>
                          {/* Star rating display */}
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{review.comment}</p>
                        <span className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Takes up 1/3 of space on large screens */}
          <div className="space-y-6">
            
            {/* Booking/Download card with pricing and actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 sticky top-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {pack.price === 0 ? 'Free' : `$${pack.price}`}
                </div>
                <p className="text-gray-600">Get instant access</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={openInGoogleMaps}
                  className="w-full btn-primary flex items-center justify-center text-lg py-4"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Open in Google Maps
                </button>
                
                <button
                  onClick={() => {
                    // QR code functionality would be implemented here
                    console.log('Generate QR code')
                  }}
                  className="w-full btn-secondary flex items-center justify-center"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Get QR Code
                </button>
              </div>

              {/* Pack metadata and statistics */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Creator location</span>
                  <span>{pack.creator_location || pack.city}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Total places</span>
                  <span>{pins.length} locations</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Downloaded</span>
                  <span>{pack.download_count || 0} times</span>
                </div>
              </div>
            </div>

            {/* Local tips section with helpful travel advice */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">💡 Local Tips</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p>• Best visited during morning hours (9 AM - 12 PM)</p>
                <p>• Bring comfortable walking shoes</p>
                <p>• Most places accept card payments</p>
                <p>• English is widely spoken</p>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Packs Section - Horizontal scrollable list */}
        {similarPacks.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                More from {pack.city}
              </h2>
              <a 
                href={`/browse?search=${encodeURIComponent(pack.city)}`}
                className="text-coral-500 hover:text-coral-600 font-medium inline-flex items-center"
              >
                View all
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>

            {/* Horizontal scrollable container for similar packs */}
            <div className="overflow-x-auto">
              <div className="flex space-x-6 pb-4">
                {similarPacks.map((similarPack) => (
                  <div
                    key={similarPack.id}
                    onClick={() => navigateToSimilarPack(similarPack.id)}
                    className="flex-none w-80 card-airbnb card-airbnb-hover group cursor-pointer"
                  >
                    {/* Similar pack image with overlays */}
                    <div className="h-48 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                      
                      {/* Heart icon for adding to wishlist */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleWishlist(similarPack)
                        }}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors group z-10"
                      >
                        <Heart 
                          className={`h-4 w-4 transition-colors ${
                            wishlistItems.includes(similarPack.id) 
                              ? 'text-coral-500 fill-current' 
                              : 'text-gray-700 group-hover:text-coral-500'
                          }`} 
                        />
                      </button>
                      
                      {/* Price badge */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                          {similarPack.price === 0 ? 'Free' : `$${similarPack.price}`}
                        </span>
                      </div>
                      
                      {/* Pin count badge */}
                      <div className="absolute bottom-3 right-3">
                        <span className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium">
                          {similarPack.pin_count} pins
                        </span>
                      </div>
                    </div>
                    
                    {/* Similar pack content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-coral-600 transition-colors">
                            {similarPack.title}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {similarPack.city}, {similarPack.country}
                          </p>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 ml-2">
                          <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                          <span className="text-xs">{similarPack.download_count || 0}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {similarPack.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
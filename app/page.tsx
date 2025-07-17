'use client'

import { MapPin, Users, Shield, Globe, Heart, Search, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Interface for packs with cover photos
interface PinPackWithPhoto {
  id: string
  title: string
  description: string
  price: number
  city: string
  country: string
  created_at: string
  creator_location: string
  pin_count: number
  download_count?: number
  average_rating?: number
  rating_count?: number
  coverPhoto?: string | null
}

export default function LandingPage() {
  // State for real packs
  const [realPacks, setRealPacks] = useState<PinPackWithPhoto[]>([])
  const [loadingPacks, setLoadingPacks] = useState(true)

  // Function to fetch real packs from database
  const loadRealPacks = async () => {
    try {
      setLoadingPacks(true)
      
      // Get all pin packs ordered by rating and download count
      const { data: packData, error: packError } = await supabase
        .from('pin_packs')
        .select('*')
        .order('average_rating', { ascending: false })
        .order('download_count', { ascending: false })
        .limit(5) // Get top 5 packs

      if (packError) throw packError

      // For each pack, get the first available photo from its pins
      const packsWithPhotos = await Promise.all(
        (packData || []).map(async (pack) => {
          try {
            // Get first pin with photos for this pack
            const { data: pinData, error: pinError } = await supabase
              .from('pin_pack_pins')
              .select(`
                pins (
                  photos
                )
              `)
              .eq('pin_pack_id', pack.id)
              .limit(10) // Get up to 10 pins to check for photos

            if (!pinError && pinData) {
              // Find first pin that has photos
              const pinWithPhoto = pinData.find((item: any) => {
                const pin = item.pins as any
                return pin?.photos && Array.isArray(pin.photos) && pin.photos.length > 0
              })
              
              if (pinWithPhoto) {
                const pin = pinWithPhoto.pins as any
                return {
                  ...pack,
                  coverPhoto: pin.photos[0] // Add first photo as cover
                }
              }
            }
          } catch (error) {
            console.warn('Error loading photos for pack:', pack.id, error)
          }
          
          return {
            ...pack,
            coverPhoto: null // No photos found
          }
        })
      )

      setRealPacks(packsWithPhotos)
    } catch (err) {
      console.error('Error loading real packs:', err)
    } finally {
      setLoadingPacks(false)
    }
  }

  // Load real packs on component mount
  useEffect(() => {
    loadRealPacks()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* New Hero Section with Dark Cloudy Background */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Cloud background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/clouds-hero-bg.jpg')`,
          }}
        >
          {/* Subtle dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          {/* Hero content */}
          <div className="space-y-8 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Discover Local Favorites
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
              Uncover unique experiences in every destination.
            </p>

            {/* Simplified search bar */}
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
                className="bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl border border-gray-300/80 hover:border-coral-300/60 p-2 flex items-center w-full transition-all duration-300"
              >
                {/* Search input section */}
                <div className="flex-1 flex items-center pl-4 pr-2">
                  <Search className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="What are you looking for?"
                    className="flex-1 border-none outline-none text-gray-700 text-lg placeholder-gray-400 bg-transparent w-full py-2"
                  />
                </div>
                
                {/* Search button */}
                <button 
                  type="submit"
                  className="bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-full transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 flex items-center justify-center h-12 px-6 ml-2"
                  style={{ minWidth: '100px' }}
                >
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden">Go</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Categories Section - Tetris-like Layout */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Featured Categories
            </h2>
          </div>

          {/* Tetris-style layout - compact and visible without scrolling */}
          <div className="grid grid-cols-12 gap-4 auto-rows-[120px] md:auto-rows-[180px]">
            {/* Row 1: Nightlife (full height, 2 rows) + Food (top half) + Family (bottom half) */}
            
            {/* Nightlife - Full height spanning 2 rows (6 cols) */}
            <div className="col-span-2 md:col-span-3 row-span-2 group cursor-pointer">
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <img 
                  src="/Nightlife.jpg"
                  alt="Nightlife"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-lg md:text-xl font-semibold">Nightlife</h3>
                </div>
              </div>
            </div>

            {/* Food - Top half (6 cols, 1 row) */}
            <div className="col-span-6 md:col-span-6 row-span-1 group cursor-pointer">
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <img 
                  src="/Food.jpg"
                  alt="Food"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="text-white text-sm md:text-lg font-semibold">Food</h3>
                </div>
              </div>
            </div>

            {/* Family - Bottom half (6 cols, 1 row) */}
            <div className="col-span-6 md:col-span-6 row-span-1 group cursor-pointer">
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <img 
                  src="/Family.jpg"
                  alt="Family"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="text-white text-sm md:text-lg font-semibold">Family</h3>
                </div>
              </div>
            </div>

            {/* Row 2: Adventure (full height, 2 rows) + Romantic (top half) + Hidden Gems (bottom half) */}
            
            {/* Adventure - Full height spanning 2 rows (6 cols) */}
            <div className="col-span-6 md:col-span-6 row-span-2 group cursor-pointer">
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <img 
                  src="/Adventure.jpg"
                  alt="Adventure"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-lg md:text-xl font-semibold">Adventure</h3>
                </div>
              </div>
            </div>

            {/* Romantic - Top half (6 cols, 1 row) */}
            <div className="col-span-6 md:col-span-6 row-span-1 group cursor-pointer">
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <img 
                  src="/Romantic.jpg"
                  alt="Romantic"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="text-white text-sm md:text-lg font-semibold">Romantic</h3>
                </div>
              </div>
            </div>

            {/* Hidden Gems - Bottom half (6 cols, 1 row) */}
            <div className="col-span-6 md:col-span-6 row-span-1 group cursor-pointer">
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <img 
                  src="/Hidden_Gems.jpg"
                  alt="Hidden Gems"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="text-white text-sm md:text-lg font-semibold">Hidden Gems</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Highly Rated Packs Section - Using Real Data */}
      <div className="py-20 bg-gray-25">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Highly Rated Packs
            </h2>
          </div>

          {loadingPacks ? (
            // Loading state
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-2xl mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : realPacks.length > 0 ? (
            // Real packs grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {realPacks.map((pack) => (
                <div key={pack.id} className="group cursor-pointer" onClick={() => window.location.href = `/pack/${pack.id}`}>
                  <div className="relative h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    {pack.coverPhoto ? (
                      <img 
                        src={pack.coverPhoto}
                        alt={pack.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                          backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23f8fafc"/><circle cx="80" cy="60" r="20" fill="%23e2e8f0" opacity="0.8"/><circle cx="220" cy="80" r="15" fill="%23cbd5e1" opacity="0.7"/><circle cx="150" cy="140" r="25" fill="%23e2e8f0" opacity="0.6"/></svg>')`
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <div className="bg-coral-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                        {pack.average_rating ? pack.average_rating.toFixed(1) : 'N/A'}
                      </div>
                    </div>
                    
                  </div>
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{pack.title}</h3>
                    <p className="text-sm text-gray-600">{pack.city}, {pack.country}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Fallback to placeholder packs if no real data
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Pack 1 */}
              <div className="group cursor-pointer">
                <div className="relative h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23ffd93d"/><circle cx="80" cy="60" r="20" fill="%23ff6b6b" opacity="0.8"/><circle cx="220" cy="80" r="15" fill="%23a29bfe" opacity="0.7"/><circle cx="150" cy="140" r="25" fill="%23fdcb6e" opacity="0.6"/></svg>')`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <div className="bg-coral-500 text-white text-sm font-bold px-2 py-1 rounded-full">9.8</div>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <div className="bg-white/90 text-gray-800 text-xs px-2 py-1 rounded-full">from $50/pack</div>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900 mb-1">City Explorer Pack</h3>
                  <p className="text-sm text-gray-600">New York</p>
                </div>
              </div>

              {/* Pack 2 */}
              <div className="group cursor-pointer">
                <div className="relative h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23e17055"/><circle cx="100" cy="80" r="25" fill="%23fdcb6e" opacity="0.8"/><circle cx="200" cy="120" r="20" fill="%23d63031" opacity="0.7"/><circle cx="150" cy="160" r="15" fill="%23e17055" opacity="0.6"/></svg>')`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <div className="bg-coral-500 text-white text-sm font-bold px-2 py-1 rounded-full">9.6</div>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <div className="bg-white/90 text-gray-800 text-xs px-2 py-1 rounded-full">from $35/pack</div>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Culinary Adventure</h3>
                  <p className="text-sm text-gray-600">Paris</p>
                </div>
              </div>

              {/* Pack 3 */}
              <div className="group cursor-pointer">
                <div className="relative h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%2374b9ff"/><circle cx="80" cy="100" r="20" fill="%2300b894" opacity="0.8"/><circle cx="220" cy="80" r="25" fill="%2374b9ff" opacity="0.7"/><circle cx="150" cy="160" r="15" fill="%2300cec9" opacity="0.6"/></svg>')`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <div className="bg-coral-500 text-white text-sm font-bold px-2 py-1 rounded-full">9.7</div>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <div className="bg-white/90 text-gray-800 text-xs px-2 py-1 rounded-full">from $40/pack</div>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Beach Retreat</h3>
                  <p className="text-sm text-gray-600">Bali</p>
                </div>
              </div>

              {/* Pack 4 */}
              <div className="group cursor-pointer">
                <div className="relative h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%2300b894"/><circle cx="100" cy="80" r="25" fill="%2300cec9" opacity="0.8"/><circle cx="200" cy="120" r="20" fill="%2300b894" opacity="0.7"/><circle cx="150" cy="160" r="15" fill="%2300cec9" opacity="0.6"/></svg>')`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <div className="bg-coral-500 text-white text-sm font-bold px-2 py-1 rounded-full">9.5</div>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <div className="bg-white/90 text-gray-800 text-xs px-2 py-1 rounded-full">from $45/pack</div>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Wellness Escape</h3>
                  <p className="text-sm text-gray-600">Thailand</p>
                </div>
              </div>

              {/* Pack 5 */}
              <div className="group cursor-pointer">
                <div className="relative h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23fd79a8"/><circle cx="100" cy="80" r="20" fill="%23e84393" opacity="0.8"/><circle cx="200" cy="120" r="25" fill="%23fd79a8" opacity="0.7"/><circle cx="150" cy="160" r="15" fill="%23e84393" opacity="0.6"/></svg>')`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                  </div>
                  <div className="absolute top-3 left-3">
                    <div className="bg-coral-500 text-white text-sm font-bold px-2 py-1 rounded-full">9.4</div>
                  </div>
                  <div className="absolute bottom-3 right-3">
                    <div className="bg-white/90 text-gray-800 text-xs px-2 py-1 rounded-full">from $30/pack</div>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900 mb-1">Shopping Spree</h3>
                  <p className="text-sm text-gray-600">Tokyo</p>
                </div>
              </div>
            </div>
          )}
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
            <a href="/browse" className="btn-secondary bg-white text-primary-500 hover:bg-gray-50 inline-flex items-center text-lg px-8 py-4">
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
              className="btn-outline border-white text-white hover:bg-white hover:text-primary-500 inline-flex items-center text-lg px-8 py-4"
            >
              <Heart className="h-5 w-5 mr-2" />
              Create Pack
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 
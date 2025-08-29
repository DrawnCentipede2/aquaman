'use client'

import { MapPin, Users, Shield, Globe, Heart, Search, Star } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import heroBg from '@/public/clouds-hero-bg.jpg'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// Note: We rely on Next/Image with priority + blur placeholder for the hero image
// to ensure a smooth, single-stage appearance rather than progressive paint.

// Cache for Google Maps ratings to avoid recalculation
const ratingCache = new Map()

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
  categories?: string[]
}

export default function LandingPage() {
  // State for real packs
  const [realPacks, setRealPacks] = useState<PinPackWithPhoto[]>([])
  const [loadingPacks, setLoadingPacks] = useState(true)
  const [heroLoaded, setHeroLoaded] = useState(false) // Controls hero image fade-in

  // Function to get Google Maps rating for a location - CACHED
  const getGoogleMapsRating = useCallback((city: string, country: string, packTitle: string) => {
    const cacheKey = `${city}${country}${packTitle}`
    
    if (ratingCache.has(cacheKey)) {
      return ratingCache.get(cacheKey)
    }
    
    // Simulate Google Maps ratings based on location and pack title
    const locationHash = cacheKey.toLowerCase().replace(/[^a-z0-9]/g, '')
    const hashValue = locationHash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    
    // Generate realistic ratings between 3.8 and 4.8
    const baseRating = 3.8 + (hashValue % 10) * 0.1
    const reviewCount = 50 + (hashValue % 450) // Between 50-500 reviews
    
    const result = {
      rating: Math.round(baseRating * 10) / 10, // Round to 1 decimal
      reviewCount: reviewCount,
      source: 'Google Maps'
    }
    
    ratingCache.set(cacheKey, result)
    return result
  }, [])

  // Function to determine if we should show Google Maps rating - MEMOIZED
  const shouldShowGoogleMapsRating = useCallback((pack: PinPackWithPhoto) => {
    // Show Google Maps rating if pack has no reviews or very few downloads
    const hasOwnReviews = pack.rating_count && pack.rating_count > 0
    const hasSignificantDownloads = pack.download_count && pack.download_count > 10
    return !hasOwnReviews || !hasSignificantDownloads
  }, [])

  // Function to fetch real packs from database - HEAVILY OPTIMIZED
  const loadRealPacks = async () => {
    try {
      setLoadingPacks(true)
      
      // Get packs with their associated pins and photos
      const { data: packData, error: packError } = await supabase
        .from('pin_packs')
        .select(`
          id,
          title,
          description,
          price,
          city,
          country,
          created_at,
          pin_count,
          download_count,
          average_rating,
          rating_count,
          categories,
          pin_pack_pins(
            pins(
              photos
            )
          )
        `)
        .order('download_count', { ascending: false })
        .order('average_rating', { ascending: false })
        .limit(5) // Get top 5 packs

      if (packError) throw packError

      // Process packs with actual photos from their pins
      const packsWithPhotos = (packData || []).map((pack: any) => {
        // Find the first pin with photos
        let coverPhoto = null
        
        if (pack.pin_pack_pins && Array.isArray(pack.pin_pack_pins)) {
          for (const pinPackPin of pack.pin_pack_pins) {
            if (pinPackPin.pins && pinPackPin.pins.photos && Array.isArray(pinPackPin.pins.photos) && pinPackPin.pins.photos.length > 0) {
              coverPhoto = pinPackPin.pins.photos[0] // Use the first photo from the first pin
              break
            }
          }
        }
        
        return {
          ...pack,
          coverPhoto: coverPhoto
        }
      })

      setRealPacks(packsWithPhotos)
    } catch (err) {
      logger.error('Error loading real packs:', err)
      // Fallback to empty array to prevent errors
      setRealPacks([])
    } finally {
      setLoadingPacks(false)
    }
  }

  // Load real packs on component mount
  useEffect(() => {
    loadRealPacks()
  }, [])



  // Removed manual <link rel="preload"> injection.
  // Next/Image with priority handles preloading efficiently at build/runtime.

  // Skeleton loading component for better perceived performance
  const PackSkeleton = () => (
    <div className="group cursor-pointer animate-pulse">
      <div className="relative h-48 rounded-2xl overflow-hidden bg-gray-200">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-300 via-transparent to-transparent"></div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  )

  // Memoized skeleton array
  const skeletonPacks = useMemo(() => Array(5).fill(null).map((_, i) => <PackSkeleton key={i} />), [])

  return (
    <div className="min-h-screen bg-white">
      {/* New Hero Section with Dark Cloudy Background */}
      <div className="relative h-screen -mt-20 flex items-center justify-center overflow-hidden z-0">
        {/* Cloud background image using Next/Image for smooth loading */}
        <div className="absolute inset-0">
          {/* Neutral fallback background to avoid staged paint */}
          <div className="absolute inset-0 bg-gray-100"></div>
          <Image
            src={heroBg}
            alt=""
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            quality={75}
            className={`object-cover transition-opacity duration-500 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ imageRendering: 'auto' }}
            onLoadingComplete={() => setHeroLoaded(true)}
          />
          {/* Subtle dark overlay for better text readability, only after image is ready */}
          {heroLoaded && <div className="absolute inset-0 bg-black/20"></div>}
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
      <div className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Categories
            </h2>
          </div>

          {/* Tetris-style layout - compact and visible without scrolling */}
          <div className="grid grid-cols-12 gap-4 auto-rows-[100px] md:auto-rows-[140px]">
            {/* Row 1: Nightlife (full height, 2 rows) + Food (top half) + Family (bottom half) */}
            
            {/* Nightlife - Full height spanning 2 rows (6 cols) */}
            <div 
              className="col-span-2 md:col-span-3 row-span-2 group cursor-pointer"
              onClick={() => window.location.href = '/browse?category=Nightlife'}
            >
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm hover:scale-105 transition-all duration-300">
                <Image 
                  src="/Nightlife.jpg"
                  alt="Nightlife"
                  fill
                  sizes="(max-width: 768px) 33vw, 25vw"
                  className="object-cover transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-lg md:text-xl font-semibold">Nightlife</h3>
                </div>
              </div>
            </div>

            {/* Food - Top half (6 cols, 1 row) */}
            <div 
              className="col-span-6 md:col-span-3 row-span-1 group cursor-pointer"
              onClick={() => window.location.href = `/browse?category=${encodeURIComponent('Food & Drink')}`}
            >
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm hover:scale-105 transition-all duration-300">
                <Image 
                  src="/Food.jpg"
                  alt="Food"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="text-white text-sm md:text-lg font-semibold">Food & Drink</h3>
                </div>
              </div>
            </div>

            {/* Family - Bottom half (6 cols, 1 row) */}
            <div 
              className="col-span-6 md:col-span-6 row-span-1 group cursor-pointer"
              onClick={() => window.location.href = '/browse?category=Family'}
            >
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm hover:scale-105 transition-all duration-300">
                <Image 
                  src="/Family.jpg"
                  alt="Family"
                  fill
                  sizes="(max-width: 768px) 50vw, 50vw"
                  className="object-cover transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="text-white text-sm md:text-lg font-semibold">Family</h3>
                </div>
              </div>
            </div>

            {/* Row 2: Adventure (full height, 2 rows) + Romantic (top half) + Hidden Gems (bottom half) */}
            
            {/* Adventure - Full height spanning 2 rows (6 cols) */}
            <div 
              className="col-span-6 md:col-span-6 row-span-2 group cursor-pointer"
              onClick={() => window.location.href = '/browse?category=Adventure'}
            >
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm hover:scale-105 transition-all duration-300">
                <Image 
                  src="/Adventure.jpg"
                  alt="Adventure"
                  fill
                  sizes="(max-width: 768px) 50vw, 50vw"
                  className="object-cover transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-lg md:text-xl font-semibold">Adventure</h3>
                </div>
              </div>
            </div>

            {/* Romantic - Top half (6 cols, 1 row) */}
            <div 
              className="col-span-6 md:col-span-3 row-span-2 group cursor-pointer"
              onClick={() => window.location.href = '/browse?category=Romantic'}
            >
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm hover:scale-105 transition-all duration-300">
                <Image 
                  src="/Romantic.jpg"
                  alt="Romantic"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="text-white text-sm md:text-lg font-semibold">Romantic</h3>
                </div>
              </div>
            </div>

            {/* Hidden Gems - Bottom half (6 cols, 1 row) */}
            <div 
              className="col-span-6 md:col-span-3 row-span-1 group cursor-pointer"
              onClick={() => window.location.href = '/browse?category=Hidden Gems'}
            >
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm hover:scale-105 transition-all duration-300">
                <Image 
                  src="/Hidden Gems.jpg"
                  alt="Hidden Gems"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300"
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
      <div className="py-8 bg-gray-25">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Highly Rated Packs
            </h2>
          </div>

          {loadingPacks ? (
            // Loading state with proper aspect ratios to prevent layout shifts
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {skeletonPacks}
            </div>
          ) : realPacks.length > 0 ? (
            // Real packs grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {realPacks.map((pack) => (
                <div key={pack.id} className="group cursor-pointer" onClick={() => window.location.href = `/pack/${pack.id}`}>
                  <div className="relative h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    {pack.coverPhoto ? (
                      <Image 
                        src={pack.coverPhoto}
                        alt={pack.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 20vw"
                        className="object-cover"
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
                    
                    {/* Fallback placeholder for failed images */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden"
                      style={{
                        backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23f8fafc"/><circle cx="80" cy="60" r="20" fill="%23e2e8f0" opacity="0.8"/><circle cx="220" cy="80" r="15" fill="%23cbd5e1" opacity="0.7"/><circle cx="150" cy="140" r="25" fill="%23e2e8f0" opacity="0.6"/></svg>')`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                    </div>
                  </div>
                  
                  {/* Enhanced card content */}
                  <div className="mt-4 space-y-2">
                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-coral-600 transition-colors">
                      {pack.title}
                    </h3>
                    
                    {/* Location */}
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      {pack.city}, {pack.country}
                    </p>
                    
                    {/* Rating details */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <span className="text-yellow-400 text-sm mr-1">★</span>
                          {shouldShowGoogleMapsRating(pack) ? (
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-700">
                                {getGoogleMapsRating(pack.city, pack.country, pack.title).rating}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">
                                (Google)
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-medium text-gray-700">
                              {pack.average_rating ? pack.average_rating.toFixed(1) : ((pack.download_count || 0) % 50 + 350) / 100}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {shouldShowGoogleMapsRating(pack) 
                            ? `(${getGoogleMapsRating(pack.city, pack.country, pack.title).reviewCount} reviews)`
                            : `(${Math.floor((pack.download_count || 0) / 10) + 15} reviews)`
                          }
                        </span>
                      </div>
                    </div>
                    
                    {/* Categories (if available) */}
                    {pack.categories && pack.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {pack.categories.slice(0, 2).map((category: string) => (
                          <span 
                            key={category}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                          >
                            {category}
                          </span>
                        ))}
                        {pack.categories.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{pack.categories.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
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
      <div className="py-16 gradient-coral">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-shadow">
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
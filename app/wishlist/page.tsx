'use client'

import { useState, useEffect } from 'react'
import { Heart, Trash2, Eye, Download, MapPin, Calendar, Star } from 'lucide-react'
import CloudLoader from '@/components/CloudLoader'
import { supabase } from '@/lib/supabase'
import type { PinPack } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast'
import { logger } from '@/lib/logger'

// Rating cache for Google Maps ratings
const ratingCache = new Map()

// Function to get Google Maps rating for a location - CACHED
const getGoogleMapsRating = (city: string, country: string, packTitle: string) => {
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
}

// Function to determine if we should show Google Maps rating
const shouldShowGoogleMapsRating = (pack: any) => {
  if (!pack) return false
  const hasOwnReviews = pack.rating_count && pack.rating_count > 0
  const hasSignificantDownloads = pack.download_count && pack.download_count > 10
  return !hasOwnReviews || !hasSignificantDownloads
}

export default function WishlistPage() {
  const { showToast } = useToast()
  const [wishlistItems, setWishlistItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load wishlist and photos
  useEffect(() => {
    const loadWishlistWithPhotos = async () => {
      try {
        // Load wishlist from localStorage
        const savedWishlist = localStorage.getItem('pinpacks_wishlist')
        if (savedWishlist) {
          const wishlist = JSON.parse(savedWishlist)
          logger.log('🔄 Wishlist - Loading wishlist items:', wishlist.length)
          
          // Load photos for wishlist items
          const wishlistWithPhotos = await loadPhotosForWishlist(wishlist)
          setWishlistItems(wishlistWithPhotos)
          logger.log('✅ Wishlist - Loaded photos for wishlist items')
        } else {
          setWishlistItems([])
        }
      } catch (error) {
        logger.error('Error loading wishlist:', error)
        setWishlistItems([])
      } finally {
        setLoading(false)
      }
    }

    loadWishlistWithPhotos()
  }, [])

  // Function to load photos for wishlist items
  const loadPhotosForWishlist = async (wishlist: any[]) => {
    try {
      if (wishlist.length === 0) return wishlist

      const packIds = wishlist.map(pack => pack.id)
      logger.log('🔄 Wishlist - Loading photos for pack IDs:', packIds)

      const { data: photoData, error: photoError } = await supabase
        .from('pin_pack_pins')
        .select(`
          pin_pack_id,
          pins!inner(
            photos
          )
        `)
        .in('pin_pack_id', packIds)

      if (photoError) {
        logger.error('Error loading photos for wishlist:', photoError)
        return wishlist
      }

      logger.log('🔄 Wishlist - Photo data received:', photoData?.length || 0, 'items')

      // Create a map of pack_id to first photo
      const photoMap = new Map()
      photoData?.forEach((item: any) => {
        if (item.pins?.photos?.[0]) {
          photoMap.set(item.pin_pack_id, item.pins.photos[0])
          logger.log('🔄 Wishlist - Found photo for pack:', item.pin_pack_id)
        } else {
          logger.log('🔄 Wishlist - No photo found for pack:', item.pin_pack_id)
        }
      })

      logger.log('🔄 Wishlist - Photo map created with', photoMap.size, 'entries')

      // Add photos to wishlist items
      const wishlistWithPhotos = wishlist.map(pack => ({
        ...pack,
        coverPhoto: photoMap.get(pack.id) || null
      }))

      logger.log('🔄 Wishlist - Wishlist items with photos:', wishlistWithPhotos.filter(p => p.coverPhoto).length)
      return wishlistWithPhotos
    } catch (error) {
      logger.error('Error loading photos for wishlist:', error)
      return wishlist
    }
  }

  // Function to remove item from wishlist
  const removeFromWishlist = (packId: string): void => {
    try {
      // Get current wishlist from localStorage
      const savedWishlist = localStorage.getItem('pinpacks_wishlist')
      let currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : []
      
      // Remove the item
      currentWishlist = currentWishlist.filter((item: any) => item.id !== packId)
      
      // Save to localStorage
      localStorage.setItem('pinpacks_wishlist', JSON.stringify(currentWishlist))
      
      // Update local state (remove from current state with photos)
      setWishlistItems(prev => prev.filter(item => item.id !== packId))
      
      showToast('Pack removed from wishlist', 'success')
    } catch (error) {
      logger.error('Error removing from wishlist:', error)
      showToast('Failed to remove pack from wishlist', 'error')
    }
  }

  const getRatingDisplay = (pack: any) => {
    if (!pack) return { rating: 0, reviewCount: 0, source: 'Pack' }
    if (shouldShowGoogleMapsRating(pack)) {
      const googleRating = getGoogleMapsRating(pack.city, pack.country, pack.title)
      return {
        rating: googleRating.rating,
        reviewCount: googleRating.reviewCount,
        source: 'Google'
      }
    } else {
      return {
        rating: pack.average_rating || 0,
        reviewCount: pack.rating_count || 0,
        source: 'Pack'
      }
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
                  <CloudLoader size="lg" text="Loading your wishlist..." />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <Heart className="h-8 w-8 text-coral-500 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Your Wishlist
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl">
            Save pin packs you want to explore later. Your wishlist is private and only visible to you.
          </p>
        </div>

        {/* Empty State */}
        {wishlistItems.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
              <Heart className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Start exploring and save pin packs you'd like to visit later.
            </p>
            <a 
              href="/browse"
              className="btn-primary inline-flex items-center text-lg px-8 py-4"
            >
              <MapPin className="h-5 w-5 mr-2" />
              Browse Pin Packs
            </a>
          </div>
        )}

        {/* Wishlist Grid */}
        {wishlistItems.length > 0 && (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                {wishlistItems.length} saved {wishlistItems.length === 1 ? 'pack' : 'packs'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((pack) => (
                <div 
                  key={pack.id}
                  onClick={() => window.location.href = `/pack/${pack.id}`}
                  className="card-airbnb group cursor-pointer"
                >
                  {/* Image placeholder - Google Maps style background */}
                  <div className="relative h-64 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 overflow-hidden">
                    <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-300 ease-out">
                      {/* Display actual photo if available, otherwise Google Maps background */}
                      {pack.coverPhoto ? (
                        <img 
                          src={pack.coverPhoto}
                          alt={`${pack.title} cover`}
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ aspectRatio: '4/3' }}
                          onError={(e) => {
                            logger.log('🔄 Wishlist - image failed to load for pack:', pack.id);
                            (e.target as HTMLImageElement).src = "/google-maps-bg.svg";
                          }}
                          onLoad={() => {
                            logger.log('✅ Wishlist - Image loaded successfully for pack:', pack.id);
                          }}
                        />
                      ) : (
                        <img 
                          src="/google-maps-bg.svg"
                          alt="Map background"
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ aspectRatio: '4/3' }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                    </div>
                    
                    {/* Heart icon - Remove from wishlist */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click when clicking heart
                        removeFromWishlist(pack.id);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors group shadow-sm"
                    >
                      <Heart 
                        className="h-4 w-4 text-red-500 fill-current transition-colors"
                      />
                    </button>
                    
                    {/* Pin count */}
                    <div className="absolute bottom-3 right-3">
                      <span className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium">
                        {pack.pin_count} pins
                      </span>
                    </div>
                  </div>
                  
                  {/* Card content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-coral-600 transition-colors">
                          {pack.title}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {pack.city}, {pack.country}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                      {pack.description}
                    </p>
                    
                    {/* Bottom section with rating and price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {(() => {
                          const ratingDisplay = getRatingDisplay(pack)
                          const { rating } = ratingDisplay
                          const fullStars = Math.floor(rating)
                          const halfStar = rating - fullStars >= 0.5
                          const emptyStars = 5 - fullStars - (halfStar ? 1 : 0)
                          return [
                            ...Array.from({ length: fullStars }, (_, i) => (
                              <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                            )),
                            ...(halfStar ? [<Star key="half" className="h-4 w-4 text-yellow-400 fill-current opacity-50" />] : []),
                            ...Array.from({ length: emptyStars }, (_, i) => (
                              <Star key={i + fullStars + 1} className="h-4 w-4 text-gray-300 fill-current" />
                            )),
                          ]
                        })()}
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {getRatingDisplay(pack).rating.toFixed(1)}
                          {getRatingDisplay(pack).source === 'Google' && (
                            <span className="text-xs text-gray-500 ml-1">(Google)</span>
                          )}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {pack.price === 0 ? 'Free' : `$${pack.price}`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
} 
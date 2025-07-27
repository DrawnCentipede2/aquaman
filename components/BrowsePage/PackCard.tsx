'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Star, Heart } from 'lucide-react'
import type { PinPack } from '@/lib/supabase'

interface PinPackWithPhoto extends PinPack {
  coverPhoto?: string | null
}

interface PackCardProps {
  pack: PinPackWithPhoto
  isAuthenticated: boolean
  wishlistItems: string[]
  onToggleWishlist: (pack: PinPack) => void
  onShowLoginModal: () => void
  getGoogleMapsRating: (city: string, country: string, packTitle: string) => {
    rating: number
    reviewCount: number
    source: string
  }
  shouldShowGoogleMapsRating: (pack: PinPackWithPhoto) => boolean
  displayedPacks?: PinPackWithPhoto[] // Add this prop for priority loading
}

export default function PackCard({ 
  pack, 
  isAuthenticated, 
  wishlistItems, 
  onToggleWishlist, 
  onShowLoginModal,
  getGoogleMapsRating,
  shouldShowGoogleMapsRating,
  displayedPacks
}: PackCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [imgSrc, setImgSrc] = useState<string>("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDMyMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNDAgMTAwQzE0MCA4OS41MDk2IDE0OC45NTQgODEgMTYwIDgxQzE3MS4wNDYgODEgMTgwIDg5LjUwOTYgMTgwIDEwMEMxODAgMTE2LjU2OSAxNjAgMTQwIDE2MCAxNDBDMTYwIDE0MCAxNDAgMTE2LjU2OSAxNDAgMTAwWiIgZmlsbD0iI0VGNDQ0NCIvPgo8Y2lyY2xlIGN4PSIxNjAiIGN5PSIxMDAiIHI9IjEwIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K")
  const cardRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading - OPTIMIZED for LCP
  useEffect(() => {
    // ULTRA-OPTIMIZED: Load first 4 images immediately for better LCP
    const isFirstFewImages = displayedPacks && displayedPacks.length > 0 && 
      displayedPacks.slice(0, 4).some(p => p.id === pack.id)
    
    if (isFirstFewImages) {
      setIsVisible(true) // Load immediately for LCP
      setImageLoaded(true) // Skip loading state for immediate render
      return
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [pack.id, displayedPacks])

  // Progressive image loading - OPTIMIZED for LCP
  useEffect(() => {
    // ULTRA-OPTIMIZED: Load first image immediately for LCP
    const isFirstImage = displayedPacks && displayedPacks.length > 0 && pack.id === displayedPacks[0].id
    
    if (!isVisible && !isFirstImage) return
    if (!pack.coverPhoto) return

    // Check if it's a data URI
    const isDataUri = pack.coverPhoto.startsWith('data:')
    
    if (isDataUri) {
      // For data URIs, use them directly without query parameters
      setImgSrc(pack.coverPhoto)
      setImageLoaded(true)
    } else {
      // ULTRA-OPTIMIZED: Load image immediately without artificial delay for better LCP
      setImgSrc(pack.coverPhoto)
      
      const img = new Image()
      img.onload = () => {
        setImageLoaded(true)
      }
      img.onerror = () => {
        setImgSrc("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDMyMCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNDAgMTAwQzE0MCA4OS41MDk2IDE0OC45NTQgODEgMTYwIDgxQzE3MS4wNDYgODEgMTgwIDg5LjUwOTYgMTgwIDEwMEMxODAgMTE2LjU2OSAxNjAgMTQwIDE2MCAxNDBDMTYwIDE0MCAxNDAgMTE2LjU2OSAxNDAgMTAwWiIgZmlsbD0iI0VGNDQ0NCIvPgo8Y2lyY2xlIGN4PSIxNjAiIGN5PSIxMDAiIHI9IjEwIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K")
        setImageLoaded(true)
      }
      
      // Load immediately for better LCP
      img.src = pack.coverPhoto
    }
    
  }, [isVisible, pack.coverPhoto, pack.id, displayedPacks])

  const handleWishlistClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (isAuthenticated) {
      onToggleWishlist(pack)
    } else {
      onShowLoginModal()
    }
  }, [isAuthenticated, onToggleWishlist, pack, onShowLoginModal])

  const handleCardClick = useCallback(() => {
    window.location.href = `/pack/${pack.id}`
  }, [pack.id])

  // Get the appropriate rating and review count
  const getRatingDisplay = () => {
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

  const ratingDisplay = getRatingDisplay()

  return (
    <div 
      ref={cardRef}
      onClick={handleCardClick}
      className="card-airbnb group cursor-pointer"
    >
      {/* Image container with progressive loading */}
      <div className="relative h-64 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 overflow-hidden">
        {/* Loading skeleton - only show for non-priority images */}
        {!imageLoaded && !(displayedPacks && displayedPacks.slice(0, 4).some(p => p.id === pack.id)) && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
        )}
        
        {/* Optimized image with scaling container */}
        <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-300 ease-out">
          {isVisible && (
            <img 
              src={imgSrc}
              alt={`${pack.title} cover`}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ aspectRatio: '4/3' }}
              loading={pack.id === displayedPacks?.[0]?.id ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={pack.id === displayedPacks?.[0]?.id ? "high" : "auto"}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        </div>
        
        {/* Wishlist button */}
        <button 
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full flex items-center justify-center transition-colors shadow-sm z-10"
        >
          <Heart 
            className={`h-4 w-4 transition-colors ${
              isAuthenticated && wishlistItems.includes(pack.id) 
                ? 'text-red-500 fill-current' 
                : 'text-red-700 hover:text-red-500'
            }`} 
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
      <div className="p-6">
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
            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">
                {ratingDisplay.rating.toFixed(1)}
              </span>
              {ratingDisplay.source === 'Google' && (
                <span className="text-xs text-gray-400 ml-1">
                  (Google)
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 ml-1">
              ({ratingDisplay.reviewCount} reviews)
            </span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {pack.price === 0 ? 'Free' : `$${pack.price}`}
          </div>
        </div>
      </div>
    </div>
  )
} 
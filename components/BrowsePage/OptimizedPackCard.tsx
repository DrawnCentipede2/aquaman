'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, Star, Heart } from 'lucide-react'
import type { PinPack } from '@/lib/supabase'

interface OptimizedPackCardProps {
  pack: PinPack & { coverPhoto?: string | null }
  isAuthenticated: boolean
  isInWishlist: boolean
  onToggleWishlist: (pack: PinPack) => void
  onShowLoginModal: () => void
  getGoogleMapsRating: (city: string, country: string, packTitle: string) => { rating: number, reviewCount: number, source: string }
  shouldShowGoogleMapsRating: (pack: any) => boolean
  index: number
}

export default function OptimizedPackCard({
  pack,
  isAuthenticated,
  isInWishlist,
  onToggleWishlist,
  onShowLoginModal,
  getGoogleMapsRating,
  shouldShowGoogleMapsRating,
  index
}: OptimizedPackCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isAuthenticated) {
      onToggleWishlist(pack)
    } else {
      onShowLoginModal()
    }
  }

  const handleCardClick = () => {
    window.location.href = `/pack/${pack.id}`
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(true)
  }

  return (
    <div 
      ref={cardRef}
      onClick={handleCardClick}
      className="card-airbnb group cursor-pointer"
      data-pack-index={index.toString()}
    >
      {/* Pack cover image with lazy loading */}
      <div className="relative h-64 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 overflow-hidden">
        {/* Enhanced loading skeleton with shimmer animation */}
        {!imageLoaded && (
          <div className="absolute inset-0">
            {/* Base gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200" />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 animate-shimmer" />
            
            {/* Floating dots animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-coral-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-coral-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-coral-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
            
            {/* Photo placeholder icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                <MapPin className="h-6 w-6 text-coral-500 animate-pulse" />
              </div>
            </div>
          </div>
        )}
        
        {/* Inner container that scales - maintains boundaries */}
        <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-300 ease-out">
          {/* Display actual photo if available and visible, otherwise Google Maps background */}
          {isVisible && pack.coverPhoto && !imageError ? (
            <picture>
              <source srcSet={pack.coverPhoto.replace(/\.(jpg|jpeg|png)$/i, '.webp')} type="image/webp" />
              <img 
                src={pack.coverPhoto}
                alt={`${pack.title} cover`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ aspectRatio: '4/3' }}
                loading="lazy"
                decoding="async"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </picture>
          ) : (
            <img 
              src="/google-maps-bg.svg"
              alt="Map background"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ aspectRatio: '4/3' }}
              loading="lazy"
              decoding="async"
              onLoad={handleImageLoad}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        </div>
        
        {/* Heart icon - Add to wishlist */}
        <button 
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 w-8 h-8 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors group shadow-sm z-10"
        >
          <Heart 
            className={`h-4 w-4 transition-colors ${
              isAuthenticated && isInWishlist 
                ? 'text-red-500 fill-current'
                : 'text-red-700 group-hover:text-red-500'
            }`} 
          />
        </button>
        
        {/* Pin count */}
        <div className="absolute bottom-3 right-3 z-10">
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
            {shouldShowGoogleMapsRating(pack) ? (
              <div className="flex items-center">
                <span className="text-sm text-gray-600">
                  {getGoogleMapsRating(pack.city, pack.country, pack.title).rating}
                </span>
                <span className="text-xs text-gray-400 ml-1">
                  (Google)
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-600">
                {((pack.download_count || 0) % 50 + 350) / 100}
              </span>
            )}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {pack.price === 0 ? 'Free' : `$${pack.price}`}
          </div>
        </div>
      </div>
    </div>
  )
} 
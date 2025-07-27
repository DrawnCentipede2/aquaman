'use client'

import { MapPin, Star } from 'lucide-react'
import Image from 'next/image'

// Simplified interface - match the landing page interface
interface PinPackWithPhoto {
  id: string
  title: string
  description: string
  price: number
  city: string
  country: string
  pin_count: number
  download_count?: number
  average_rating?: number
  coverPhoto?: string | null
}

interface PackDisplayProps {
  realPacks: PinPackWithPhoto[]
  loadingPacks: boolean
  getGoogleMapsRating: (city: string, country: string, packTitle: string) => any
  shouldShowGoogleMapsRating: (pack: PinPackWithPhoto) => boolean
}

export default function PackDisplay({ 
  realPacks, 
  loadingPacks, 
  getGoogleMapsRating, 
  shouldShowGoogleMapsRating 
}: PackDisplayProps) {
  // Handle pack card click - redirect to pack detail page
  const handlePackClick = (packId: string) => {
    window.location.href = `/pack/${packId}`
  }

  if (loadingPacks) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => ( // Reduced skeleton items for better performance
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-2xl mb-4"></div>
            <div className="bg-gray-200 h-4 rounded mb-2"></div>
            <div className="bg-gray-200 h-3 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  if (realPacks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">No packs available at the moment</div>
        <div className="text-sm text-gray-400">Check back soon for new local recommendations</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {realPacks.map((pack) => {
        const googleMapsRating = shouldShowGoogleMapsRating(pack) 
          ? getGoogleMapsRating(pack.city, pack.country, pack.title)
          : null

        return (
          <div 
            key={pack.id} 
            className="group cursor-pointer"
            onClick={() => handlePackClick(pack.id)}
          >
            <div className="relative h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              {pack.coverPhoto ? (
                <Image
                  src={pack.coverPhoto}
                  alt={pack.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              ) : (
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23${Math.floor(Math.random()*16777215).toString(16)}"/><circle cx="100" cy="80" r="20" fill="%23${Math.floor(Math.random()*16777215).toString(16)}" opacity="0.8"/><circle cx="200" cy="120" r="25" fill="%23${Math.floor(Math.random()*16777215).toString(16)}" opacity="0.7"/><circle cx="150" cy="160" r="15" fill="%23${Math.floor(Math.random()*16777215).toString(16)}" opacity="0.6"/></svg>')`
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                </div>
              )}
              
              {/* Rating badge */}
              <div className="absolute top-3 left-3">
                <div className="bg-coral-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                  {pack.average_rating ? pack.average_rating.toFixed(1) : googleMapsRating?.rating || '4.5'}
                </div>
              </div>
              
              {/* Price badge */}
              <div className="absolute bottom-3 right-3">
                <div className="bg-white/90 text-gray-800 text-xs px-2 py-1 rounded-full">
                  {pack.price === 0 ? 'Free' : `$${pack.price}`}
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-coral-600 transition-colors">{pack.title}</h3>
              <p className="text-sm text-gray-600">{pack.city}, {pack.country}</p>
              
              {/* Rating source */}
              {googleMapsRating && (
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  <span>{googleMapsRating.rating} ({googleMapsRating.reviewCount} reviews)</span>
                  <span className="ml-1 text-gray-400">• {googleMapsRating.source}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
} 
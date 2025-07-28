import { useState, useEffect, useRef } from 'react'
import { MapPin, Star, Heart, ExternalLink } from 'lucide-react'
import OptimizedPackImage from './OptimizedPackImage'

interface SimilarPack {
  id: string
  title: string
  description: string
  city: string
  country: string
  pin_count: number
  download_count?: number
  coverPhoto?: string | null
}

interface SimilarPacksSectionProps {
  similarPacks: SimilarPack[]
  currentPackCity: string
  wishlistItems: string[]
  isAuthenticated: boolean
  onWishlistToggle: (pack: SimilarPack) => void
  onPackClick: (packId: string) => void
  onShowLoginModal: () => void
}

export default function SimilarPacksSection({
  similarPacks,
  currentPackCity,
  wishlistItems,
  isAuthenticated,
  onWishlistToggle,
  onPackClick,
  onShowLoginModal
}: SimilarPacksSectionProps) {
  const [visiblePacks, setVisiblePacks] = useState<Set<number>>(new Set([0, 1])) // Load first 2 packs immediately
  const observerRef = useRef<IntersectionObserver>()
  const packRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    // Create intersection observer for lazy loading similar packs
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-pack-index') || '0')
            setVisiblePacks(prev => new Set(Array.from(prev).concat(index)))
          }
        })
      },
      {
        rootMargin: '100px', // Load packs 100px before they come into view
        threshold: 0.1
      }
    )

    // Observe all pack containers
    packRefs.current.forEach((ref) => {
      if (ref && observerRef.current) {
        observerRef.current.observe(ref)
      }
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [similarPacks.length])

  if (similarPacks.length === 0) return null

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          More from {currentPackCity}
        </h2>
        <a 
          href={`/browse?search=${encodeURIComponent(currentPackCity)}`}
          className="text-coral-500 hover:text-coral-600 font-medium inline-flex items-center"
        >
          View all
          <ExternalLink className="h-4 w-4 ml-1" />
        </a>
      </div>

      {/* Horizontal scrollable container for similar packs */}
      <div className="overflow-x-auto">
        <div className="flex space-x-6 pb-4">
          {similarPacks.map((pack, index) => (
            <div
              key={pack.id}
              ref={(el) => { packRefs.current[index] = el }}
              data-pack-index={index.toString()}
              className="flex-none w-80 card-airbnb group cursor-pointer"
              onClick={() => onPackClick(pack.id)}
            >
              {/* Similar pack image with lazy loading */}
              <div className="h-48 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 relative overflow-hidden">
                {visiblePacks.has(index) ? (
                  <OptimizedPackImage
                    src={pack.coverPhoto || null}
                    alt={`${pack.title} cover`}
                    fill
                    sizes="(max-width: 768px) 80vw, 320px"
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 animate-pulse" />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                
                {/* Heart icon for adding to wishlist */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isAuthenticated) {
                      onWishlistToggle(pack)
                    } else {
                      onShowLoginModal()
                    }
                  }}
                  className="absolute top-3 right-3 w-8 h-8 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors group shadow-sm z-10"
                >
                  <Heart 
                    className={`h-4 w-4 transition-colors ${
                      isAuthenticated && wishlistItems.includes(pack.id) 
                        ? 'text-red-500 fill-current' 
                        : 'text-red-700 group-hover:text-red-500'
                    }`} 
                  />
                </button>
                
                {/* Pin count badge */}
                <div className="absolute bottom-3 right-3 z-10">
                  <span className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium">
                    {pack.pin_count} pins
                  </span>
                </div>
              </div>
              
              {/* Similar pack content */}
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
                  <div className="flex items-center text-sm text-gray-500 ml-2">
                    <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                    <span className="text-xs">{((pack.download_count || 0) % 50 + 350) / 100}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                  {pack.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 
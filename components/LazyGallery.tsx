import { useState, useEffect, useRef } from 'react'
import OptimizedPackImage from './OptimizedPackImage'

interface LazyGalleryProps {
  photos: string[]
  packTitle: string
  onImageClick: (index: number) => void
}

export default function LazyGallery({ photos, packTitle, onImageClick }: LazyGalleryProps) {
  const [visibleImages, setVisibleImages] = useState<Set<number>>(new Set([0])) // Always load the first image
  const observerRef = useRef<IntersectionObserver>()
  const imageRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    // Create intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0')
            setVisibleImages(prev => new Set(Array.from(prev).concat(index)))
          }
        })
      },
      {
        rootMargin: '50px', // Load images 50px before they come into view
        threshold: 0.1
      }
    )

    // Observe all image containers
    imageRefs.current.forEach((ref) => {
      if (ref && observerRef.current) {
        observerRef.current.observe(ref)
      }
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [photos.length])

  if (photos.length === 0) return null

  return (
    <div className="w-full flex gap-2 h-80 rounded-2xl overflow-hidden">
      {/* Main photo - left side (takes 50% width) */}
      <div 
        ref={(el) => { imageRefs.current[0] = el }}
        data-index="0"
        className="flex-1 relative cursor-pointer group h-full overflow-hidden"
        onClick={() => onImageClick(0)}
      >
        {visibleImages.has(0) ? (
          <OptimizedPackImage
            src={photos[0]}
            alt={packTitle}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 animate-pulse" />
        )}
        {/* Subtle gray overlay on hover */}
        <div className="absolute inset-0 bg-gray-300 opacity-0 group-hover:opacity-30 transition-opacity"></div>
      </div>
      
      {/* Right side - 2x2 grid of smaller photos (50% width) */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-2 h-full">
        {photos.slice(1, 5).map((photo, idx) => {
          const imageIndex = idx + 1
          const isLast = idx === 3 && photos.length > 5
          
          return (
            <div
              key={imageIndex}
              ref={(el) => { imageRefs.current[imageIndex] = el }}
              data-index={imageIndex.toString()}
              className="relative cursor-pointer group overflow-hidden"
              onClick={() => onImageClick(imageIndex)}
            >
              {visibleImages.has(imageIndex) ? (
                <OptimizedPackImage
                  src={photo}
                  alt={`Gallery photo ${imageIndex + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 animate-pulse" />
              )}
              
              {/* Subtle gray overlay on hover */}
              <div className="absolute inset-0 bg-gray-300 opacity-0 group-hover:opacity-30 transition-opacity"></div>
              
              {/* Show more pill on last image if there are more photos */}
              {isLast && (
                <button 
                  className="absolute bottom-2 right-2 bg-white/90 text-gray-800 px-3 py-1 rounded-full font-medium text-xs flex items-center space-x-1 shadow hover:bg-gray-100"
                  onClick={e => { e.stopPropagation(); onImageClick(0); }}
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x='3' y='3' width='18' height='18' rx='2' ry='2'/>
                    <circle cx='8.5' cy='8.5' r='1.5'/>
                    <polyline points='21,15 16,10 5,21'/>
                  </svg>
                  <span>+{photos.length - 5} more</span>
                </button>
              )}
            </div>
          )
        })}
        
        {/* Fill remaining slots if less than 4 additional photos */}
        {Array.from({ length: Math.max(0, 4 - (photos.length - 1)) }, (_, idx) => (
          <div key={`empty-${idx}`} className="bg-gray-100"></div>
        ))}
      </div>
    </div>
  )
} 
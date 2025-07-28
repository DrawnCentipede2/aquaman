'use client'

import { useState, useRef, useEffect } from 'react'

interface ProgressiveImageProps {
  src: string | null
  alt: string
  className?: string
  onClick?: () => void
  priority?: boolean
  placeholder?: string
  sizes?: string
  width?: number
  height?: number
  onLoad?: () => void
}

export default function ProgressiveImage({
  src,
  alt,
  className = '',
  onClick,
  priority = false,
  placeholder = "/google-maps-bg.svg",
  sizes,
  width,
  height,
  onLoad
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(placeholder)
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(priority)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '100px 0px', // Load images 100px before they come into view
        threshold: 0.01
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [priority])

  // Progressive loading effect
  useEffect(() => {
    if (!isVisible || !src || hasError) return

    const img = new Image()
    
    // Generate low-quality placeholder (LQIP) URL
    const lqipSrc = generateLQIP(src)
    
    // First load low quality version
    const lqipImg = new Image()
    lqipImg.onload = () => {
      setCurrentSrc(lqipSrc)
      setIsLoading(false)
    }
    lqipImg.src = lqipSrc

    // Then load high quality version
    img.onload = () => {
      setCurrentSrc(src)
      setIsLoading(false)
      onLoad?.()
    }

    img.onerror = () => {
      setHasError(true)
      setCurrentSrc(placeholder)
      setIsLoading(false)
    }

    // Add delay for high-quality image to allow LQIP to show
    setTimeout(() => {
      img.src = src
    }, 50)

  }, [isVisible, src, hasError, placeholder, onLoad])

  // Generate low-quality image placeholder
  const generateLQIP = (originalSrc: string): string => {
    // In a real implementation, you'd have a service that generates LQIP versions
    // For now, we'll use a simple technique with URL parameters
    if (originalSrc.includes('?')) {
      return `${originalSrc}&w=20&q=10&blur=20`
    }
    return `${originalSrc}?w=20&q=10&blur=20`
  }

  // Generate WebP source if supported
  const getWebPSrc = (originalSrc: string): string => {
    if (originalSrc.includes('?')) {
      return `${originalSrc}&format=webp`
    }
    return `${originalSrc}?format=webp`
  }

  // Check WebP support
  const isWebPSupported = () => {
    if (typeof window === 'undefined') return false
    const canvas = document.createElement('canvas')
    return canvas.toDataURL('image/webp').indexOf('webp') > -1
  }

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      )}

      {/* Progressive Image */}
      {isVisible && (
        <picture>
          {/* WebP source for supported browsers */}
          {src && isWebPSupported() && (
            <source 
              srcSet={getWebPSrc(src)} 
              type="image/webp"
              sizes={sizes}
            />
          )}
          
          {/* Fallback image */}
          <img
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            className={`w-full h-full object-cover transition-all duration-500 ${
              isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
            } ${hasError ? 'filter grayscale' : ''}`}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            style={{
              aspectRatio: width && height ? `${width}/${height}` : undefined,
              contentVisibility: 'auto',
              containIntrinsicSize: width && height ? `${width}px ${height}px` : undefined
            }}
          />
        </picture>
      )}

      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
    </div>
  )
}

// Add CSS for shimmer animation
const shimmerCSS = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`

// Inject CSS if not already present
if (typeof document !== 'undefined' && !document.querySelector('#progressive-image-styles')) {
  const style = document.createElement('style')
  style.id = 'progressive-image-styles'
  style.textContent = shimmerCSS
  document.head.appendChild(style)
}
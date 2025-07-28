import Image from 'next/image'
import { useState } from 'react'

interface OptimizedPackImageProps {
  src: string | null
  alt: string
  className?: string
  onClick?: () => void
  priority?: boolean
  sizes?: string
  fill?: boolean
  width?: number
  height?: number
  fallbackSrc?: string
}

export default function OptimizedPackImage({
  src,
  alt,
  className = '',
  onClick,
  priority = false,
  sizes,
  fill = false,
  width,
  height,
  fallbackSrc = "/google-maps-bg.svg"
}: OptimizedPackImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    setHasError(true)
    setIsLoading(false)
    setImgSrc(fallbackSrc)
  }

  // If no src provided, show fallback immediately
  if (!src) {
    return (
      <div 
        className={`bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 flex items-center justify-center ${className}`}
        onClick={onClick}
      >
        <Image
          src={fallbackSrc}
          alt={alt}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          sizes={sizes}
          className="object-cover"
          priority={priority}
        />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
      
      {/* Optimized image */}
      <Image
        src={imgSrc}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        sizes={sizes}
        className={`object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        priority={priority}
        onLoad={handleImageLoad}
        onError={handleImageError}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      />
    </div>
  )
} 
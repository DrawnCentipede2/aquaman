'use client'

import { MapPin, Star, Heart } from 'lucide-react'

export default function BrowsePageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded-lg w-1/3 mb-4 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
      </div>

      {/* Search and filters skeleton */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search bar skeleton */}
          <div className="flex-1">
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
          
          {/* Sort dropdown skeleton */}
          <div className="w-48">
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          
          {/* Filter button skeleton */}
          <div className="w-32">
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Results count skeleton */}
      <div className="mb-6">
        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
      </div>

      {/* Grid of pack card skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <PackCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

function PackCardSkeleton() {
  return (
    <div className="card-airbnb">
      {/* Image skeleton */}
      <div className="relative h-64 bg-gray-200 rounded-t-xl overflow-hidden animate-pulse">
        {/* Heart button skeleton */}
        <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full animate-pulse"></div>
        
        {/* Pin count skeleton */}
        <div className="absolute bottom-3 right-3">
          <div className="h-6 bg-gray-300 rounded-lg w-16 animate-pulse"></div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-6">
        {/* Title skeleton */}
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
        
        {/* Location skeleton */}
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
        
        {/* Description skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
        </div>
        
        {/* Bottom section skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-4 w-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
} 
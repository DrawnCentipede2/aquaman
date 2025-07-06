'use client'

import { useState, useEffect } from 'react'
import { Heart, MapPin, Star, Download } from 'lucide-react'
import CloudLoader from '@/components/CloudLoader'

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load wishlist from localStorage
    const savedWishlist = localStorage.getItem('pinpacks_wishlist')
    if (savedWishlist) {
      setWishlistItems(JSON.parse(savedWishlist))
    }
    setLoading(false)
  }, [])

  // Function to remove item from wishlist
  const removeFromWishlist = (packId: string) => {
    try {
      // Get current wishlist from localStorage
      const savedWishlist = localStorage.getItem('pinpacks_wishlist')
      let currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : []
      
      // Remove the item
      currentWishlist = currentWishlist.filter((item: any) => item.id !== packId)
      
      // Save to localStorage
      localStorage.setItem('pinpacks_wishlist', JSON.stringify(currentWishlist))
      
      // Update local state
      setWishlistItems(currentWishlist)
      
      console.log('Removed from wishlist:', packId)
    } catch (error) {
      console.error('Error removing from wishlist:', error)
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
                            (e.target as HTMLImageElement).src = "/google-maps-bg.svg";
                          }}
                        />
                      ) : (
                        <img 
                          src={pack.coverPhoto && pack.coverPhoto !== '' ? pack.coverPhoto : "/google-maps-bg.svg"}
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
                        e.stopPropagation() // Prevent card click when clicking heart
                        removeFromWishlist(pack.id)
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
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm text-gray-600">{((pack.download_count || 0) % 50 + 350) / 100}</span>
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
'use client'

import { useState, useEffect, useMemo } from 'react'
import { MapPin, Download, Star, Users, Search, Filter, QrCode, Heart, Calendar, Globe2, X, Sliders, CheckCircle, ShoppingCart, CreditCard, Package, User } from 'lucide-react'
import { STANDARD_CATEGORIES } from '@/lib/categories'
import CloudLoader from '@/components/CloudLoader'
import OptimizedPackCard from '@/components/BrowsePage/OptimizedPackCard'
import SearchBar from '@/components/BrowsePage/SearchBar'
import BrowsePageSkeleton from '@/components/BrowsePage/BrowsePageSkeleton'
import { useOptimizedBrowsePage, useOptimizedWishlist, useOptimizedAuthentication, useOptimizedSearchSuggestions } from '@/hooks/useOptimizedBrowsePage'
import PayPalCheckout from '@/components/PayPalCheckout'
import PaymentSuccessModal from '@/components/PaymentSuccessModal'
import { logger } from '@/lib/logger'

// Extended PinPack type to include cover photo
interface PinPackWithPhoto {
  id: string
  title: string
  description: string
  price: number
  city: string
  country: string
  pin_count: number
  download_count: number
  average_rating: number
  rating_count: number
  categories?: string[]
  coverPhoto?: string | null
}

export default function BrowsePageOptimizedV2() {
  // Use optimized hooks for better performance
  const { pinPacks, filteredPacks, loading, error, applyFiltersAndSort } = useOptimizedBrowsePage()
  const { wishlistItems, toggleWishlist } = useOptimizedWishlist()
  const { isAuthenticated } = useOptimizedAuthentication()
  const { suggestions, showSuggestions, generateSuggestions, setShowSuggestions } = useOptimizedSearchSuggestions(pinPacks)

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearchTerm, setActiveSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [starRatingFilter, setStarRatingFilter] = useState('all')
  const [pinCountFilter, setPinCountFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)

  // UI state
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Cart and payment state
  const [cartSuccess, setCartSuccess] = useState(false)
  const [addedPack, setAddedPack] = useState<{
    id: string
    title: string
    price: string
    city: string
    country: string
    pin_count: string
  } | null>(null)
  const [countdownTime, setCountdownTime] = useState('24:00')
  const [addedPackImage, setAddedPackImage] = useState<string | null>(null)
  const [showPayPalModal, setShowPayPalModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [purchasedPacksCount, setPurchasedPacksCount] = useState(0)

  // Handle URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const searchParam = urlParams.get('search')
    const categoryParam = urlParams.get('category')
    
    if (searchParam) {
      setSearchTerm(searchParam)
      setActiveSearchTerm(searchParam)
      setHasSearched(true)
    }
    
    if (categoryParam) {
      const decodedCategory = decodeURIComponent(categoryParam)
      if (STANDARD_CATEGORIES.includes(decodedCategory as any)) {
        setCategoryFilter(decodedCategory)
      }
    }
  }, [])

  // Memoized filtered and sorted packs
  const currentFilteredPacks = useMemo(() => {
    return applyFiltersAndSort(
      pinPacks,
      activeSearchTerm,
      categoryFilter,
      starRatingFilter,
      pinCountFilter,
      sortBy
    )
  }, [pinPacks, activeSearchTerm, categoryFilter, starRatingFilter, pinCountFilter, sortBy, applyFiltersAndSort])

  // Handle search input change
  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value)
    generateSuggestions(value)
  }

  // Handle search button click
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm)
    setHasSearched(true)
    setShowSuggestions(false)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    setActiveSearchTerm(suggestion)
    setShowSuggestions(false)
    setHasSearched(true)
  }

  // Handle suggestion index change
  const handleSuggestionIndexChange = (index: number) => {
    setSelectedSuggestionIndex(index)
  }

  // Utility functions
  const getGoogleMapsRating = (city: string, country: string, packTitle: string) => {
    // Simulate Google Maps rating based on city and pack title
    const baseRating = 4.2 + (city.length % 3) * 0.3
    const reviewCount = 150 + (packTitle.length % 100)
    return {
      rating: Math.min(5, Math.max(3.5, baseRating)),
      reviewCount,
      source: 'Google Maps'
    }
  }

  const shouldShowGoogleMapsRating = (pack: PinPackWithPhoto) => {
    // Show Google Maps rating for popular cities
    const popularCities = ['Berlin', 'Paris', 'London', 'New York', 'Tokyo', 'Barcelona']
    return popularCities.includes(pack.city)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setActiveSearchTerm('')
    setCategoryFilter('all')
    setStarRatingFilter('all')
    setPinCountFilter('all')
    setSortBy('newest')
    setHasSearched(false)
    setShowSuggestions(false)
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (activeSearchTerm) count++
    if (categoryFilter !== 'all') count++
    if (starRatingFilter !== 'all') count++
    if (pinCountFilter !== 'all') count++
    return count
  }

  const handleProtectedAction = (action: () => void) => {
    if (isAuthenticated) {
      action()
    } else {
      setShowLoginModal(true)
    }
  }

  const handleToggleWishlist = (pack: any) => {
    handleProtectedAction(() => toggleWishlist(pack))
  }

  // Cart and payment handlers
  const handlePayPalSuccess = async (orderData: any) => {
    try {
      logger.log('PayPal success:', orderData)
      
      // Update download count
      if (addedPack) {
        // This would typically update the database
        logger.log('Updating download count for pack:', addedPack.id)
      }
      
      setPurchasedPacksCount(prev => prev + 1)
      setShowPayPalModal(false)
      setShowSuccessModal(true)
      
      // Clear cart success banner
      setCartSuccess(false)
      setAddedPack(null)
      
    } catch (error) {
      logger.error('Error handling PayPal success:', error)
    }
  }

  const handleCartBannerCheckout = async () => {
    if (addedPack) {
      setShowPayPalModal(true)
    }
  }

  const handlePayPalError = (error: any) => {
    logger.error('PayPal error:', error)
    setShowPayPalModal(false)
  }

  const handleViewPacks = () => {
    setShowSuccessModal(false)
    window.location.href = '/pinventory'
  }

  const handleKeepBrowsing = () => {
    setShowSuccessModal(false)
  }

  // Countdown timer effect
  useEffect(() => {
    if (cartSuccess && addedPack) {
      const updateCountdown = () => {
        setCountdownTime(prev => {
          const [minutes, seconds] = prev.split(':').map(Number)
          if (minutes === 0 && seconds === 0) {
            setCartSuccess(false)
            setAddedPack(null)
            return '24:00'
          }
          
          if (seconds === 0) {
            return `${minutes - 1}:59`
          } else {
            return `${minutes}:${seconds - 1 < 10 ? '0' : ''}${seconds - 1}`
          }
        })
      }

      const interval = setInterval(updateCountdown, 1000)
      return () => clearInterval(interval)
    }
  }, [cartSuccess, addedPack])

  // Show skeleton while loading
  if (loading) {
    return <BrowsePageSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cart Success Banner */}
      {cartSuccess && addedPack && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Left side - Success message and pack details */}
              <div className="flex items-center space-x-4">
                {/* Success icon */}
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                
                {/* Pack thumbnail */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 rounded-lg overflow-hidden relative">
                    <picture>
                      <source srcSet={(addedPackImage || "/google-maps-bg.svg").replace(/\.(jpg|jpeg|png)$/i, '.webp')} type="image/webp" />
                      <img 
                        src={addedPackImage || "/google-maps-bg.svg"}
                        alt="Pack thumbnail"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                    
                    {/* Small pin count badge */}
                    <div className="absolute bottom-1 right-1">
                      <span className="bg-black/50 backdrop-blur-sm text-white px-1 py-0.5 rounded text-xs font-medium">
                        {addedPack.pin_count} pins
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Pack details */}
                <div className="flex items-center space-x-6">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Added to cart
                    </p>
                    <p className="text-sm text-gray-700 font-semibold">
                      {addedPack.title}
                    </p>
                    <p className="text-xs text-gray-600">
                      {addedPack.city}, {addedPack.country}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Right side - Action buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.location.href = '/cart'}
                  className="bg-coral-500 hover:bg-coral-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Go to cart
                </button>
                
                <button
                  onClick={handleCartBannerCheckout}
                  className="bg-coral-500 hover:bg-coral-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center"
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Check out
                </button>
                
                {/* Close button */}
                <button
                  onClick={() => {
                    setCartSuccess(false)
                    setAddedPack(null)
                  }}
                  className="text-green-600 hover:text-green-800 p-1"
                  aria-label="Close notification"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Mobile countdown timer */}
            <div className="sm:hidden mt-2">
              <p className="text-sm text-green-700">
                We'll hold your spot for <span className="font-semibold">{countdownTime} minutes</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
              <MapPin className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Try again
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discover Amazing Places
          </h1>
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${currentFilteredPacks.length} places available`}
            {searchTerm && !hasSearched && (
              <span className="ml-2 text-coral-600 font-medium">- Type and press search to filter results</span>
            )}
          </p>
        </div>
        
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1">
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={handleSearchInputChange}
                onSearch={handleSearch}
                suggestions={suggestions}
                showSuggestions={showSuggestions}
                selectedSuggestionIndex={selectedSuggestionIndex}
                onSuggestionClick={handleSuggestionClick}
                onSuggestionIndexChange={handleSuggestionIndexChange}
              />
            </div>
            
            {/* Sort by label and custom dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort by</span>
              <div className="relative sort-dropdown-container">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 focus:border-coral-500 focus:ring-2 focus:ring-coral-500/20 transition-all cursor-pointer min-w-[140px]"
                >
                  <span>
                    {sortBy === 'newest' && 'Newest'}
                    {sortBy === 'oldest' && 'Oldest'}
                    {sortBy === 'rating' && 'Highest Rated'}
                    {sortBy === 'downloaded' && 'Most Downloaded'}
                  </span>
                  <svg 
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showSortDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Custom dropdown menu with smooth animation */}
                <div 
                  className={`absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden transition-all duration-300 ease-out ${
                    showSortDropdown 
                      ? 'opacity-100 max-h-48 transform scale-y-100' 
                      : 'opacity-0 max-h-0 transform scale-y-0'
                  }`}
                  style={{
                    transformOrigin: 'top'
                  }}
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setSortBy('newest')
                        setShowSortDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        sortBy === 'newest' ? 'text-coral-600 bg-coral-50' : 'text-gray-700'
                      }`}
                    >
                      Newest
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('oldest')
                        setShowSortDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        sortBy === 'oldest' ? 'text-coral-600 bg-coral-50' : 'text-gray-700'
                      }`}
                    >
                      Oldest
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('rating')
                        setShowSortDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        sortBy === 'rating' ? 'text-coral-600 bg-coral-50' : 'text-gray-700'
                      }`}
                    >
                      Highest Rated
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('downloaded')
                        setShowSortDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        sortBy === 'downloaded' ? 'text-coral-600 bg-coral-50' : 'text-gray-700'
                      }`}
                    >
                      Most Downloaded
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters button */}
            <button
              onClick={() => setShowFilterModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
            >
              <Sliders className="h-4 w-4" />
              Filters
              {getActiveFilterCount() > 0 && (
                <span className="bg-coral-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Results Grid */}
        {!error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentFilteredPacks.map((pack, index) => (
              <OptimizedPackCard
                key={pack.id}
                pack={pack}
                isAuthenticated={isAuthenticated}
                isInWishlist={wishlistItems.includes(pack.id)}
                onToggleWishlist={handleToggleWishlist}
                onShowLoginModal={() => setShowLoginModal(true)}
                getGoogleMapsRating={getGoogleMapsRating}
                shouldShowGoogleMapsRating={shouldShowGoogleMapsRating}
                index={index}
              />
            ))}
          </div>
        )}

        {/* Load more button if many results */}
        {!loading && !error && currentFilteredPacks.length > 12 && (
          <div className="text-center mt-12">
            <button className="btn-secondary inline-flex items-center text-lg px-8 py-4">
              Show more places
            </button>
          </div>
        )}
      </div>

      {/* PayPal Modal for Single Pack Checkout */}
      {showPayPalModal && addedPack && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Complete Purchase</h2>
              <button
                onClick={() => setShowPayPalModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Pack Summary */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                {/* Pack thumbnail */}
                <div className="w-16 h-16 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 rounded-lg overflow-hidden relative">
                  <img 
                    src={addedPackImage || "/google-maps-bg.svg"}
                    alt="Pack thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  <div className="absolute bottom-1 right-1">
                    <span className="bg-black/50 backdrop-blur-sm text-white px-1 py-0.5 rounded text-xs font-medium">
                      {addedPack.pin_count} pins
                    </span>
                  </div>
                </div>
                
                {/* Pack details */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{addedPack.title}</h3>
                  <p className="text-sm text-gray-600">{addedPack.city}, {addedPack.country}</p>
                  <div className="mt-2">
                    <span className="text-lg font-bold text-coral-600">
                      {addedPack.price === '0' ? 'Free' : `$${addedPack.price}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PayPal Checkout */}
            <div className="p-6">
              {addedPack.price !== '0' ? (
                <PayPalCheckout
                  cartItems={[{
                    id: addedPack.id,
                    title: addedPack.title,
                    price: parseFloat(addedPack.price),
                    city: addedPack.city,
                    country: addedPack.country,
                    pin_count: parseInt(addedPack.pin_count)
                  }]}
                  totalAmount={parseFloat(addedPack.price)}
                  processingFee={0.50}
                  onSuccess={handlePayPalSuccess}
                  onError={handlePayPalError}
                />
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">This pack is free! Click to add to your collection.</p>
                  <button
                    onClick={() => handlePayPalSuccess({ orderID: 'free', payerID: 'free' })}
                    className="w-full btn-primary"
                  >
                    Get Free Pack
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-coral-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in required</h2>
              <p className="text-gray-600">
                You need an account to save favorites and add items to your cart
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowLoginModal(false)
                  window.location.href = '/auth'
                }}
                className="w-full btn-primary py-3 text-base"
              >
                Sign In
              </button>
              
              <button
                onClick={() => {
                  setShowLoginModal(false)
                  window.location.href = '/signup'
                }}
                className="w-full btn-secondary py-3 text-base"
              >
                Create Account
              </button>
              
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Modal with Falling Pins */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        packsCount={purchasedPacksCount}
        onViewPacks={handleViewPacks}
        onKeepBrowsing={handleKeepBrowsing}
      />
    </div>
  )
} 
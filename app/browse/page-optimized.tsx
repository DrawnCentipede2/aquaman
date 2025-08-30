'use client'

import { useState, useEffect, useMemo } from 'react'
import { MapPin, Search, Filter, X, Sliders, CheckCircle, ShoppingCart, CreditCard, Package, User, Globe2 } from 'lucide-react'
import { STANDARD_CATEGORIES } from '@/lib/categories'
import CloudLoader from '@/components/CloudLoader'
import PackCard from '@/components/BrowsePage/PackCard'
import SearchBar from '@/components/BrowsePage/SearchBar'
import { usePinPacks, useWishlist, useAuthentication, useSearchSuggestions } from '@/hooks/useBrowsePage'
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
  download_count?: number
  average_rating?: number
  rating_count?: number
  categories?: string[]
  coverPhoto?: string | null
}

export default function BrowsePageOptimized() {
  // Use custom hooks for better performance
  const { pinPacks, loading, error, refetch } = usePinPacks()
  const { wishlistItems, toggleWishlist } = useWishlist()
  const { isAuthenticated } = useAuthentication()
  const { suggestions, showSuggestions, generateSuggestions, setShowSuggestions } = useSearchSuggestions(pinPacks)

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

  // Filter and sort logic - memoized for performance
  const filteredPacks = useMemo(() => {
    let filtered = pinPacks

    // Search filter
    if (activeSearchTerm) {
      const searchLower = activeSearchTerm.toLowerCase()
      filtered = filtered.filter(pack => {
        if (searchLower.includes(',')) {
          const [cityPart, countryPart] = searchLower.split(',').map(s => s.trim())
          return (
            (pack.city.toLowerCase().includes(cityPart) || cityPart.includes(pack.city.toLowerCase())) &&
            (pack.country.toLowerCase().includes(countryPart) || countryPart.includes(pack.country.toLowerCase()))
          )
        }
        
        return (
          pack.title.toLowerCase().includes(searchLower) ||
          pack.description.toLowerCase().includes(searchLower) ||
          pack.city.toLowerCase().includes(searchLower) ||
          pack.country.toLowerCase().includes(searchLower)
        )
      })
    }

    // Star rating filter
    if (starRatingFilter === '4+') {
      filtered = filtered.filter(pack => {
        const rating = ((pack.download_count || 0) % 50 + 350) / 100
        return rating >= 4.0
      })
    } else if (starRatingFilter === '4.5+') {
      filtered = filtered.filter(pack => {
        const rating = ((pack.download_count || 0) % 50 + 350) / 100
        return rating >= 4.5
      })
    }

    // Pin count filter
    if (pinCountFilter === 'small') {
      filtered = filtered.filter(pack => pack.pin_count >= 0 && pack.pin_count <= 5)
    } else if (pinCountFilter === 'medium') {
      filtered = filtered.filter(pack => pack.pin_count > 5 && pack.pin_count <= 15)
    } else if (pinCountFilter === 'large') {
      filtered = filtered.filter(pack => pack.pin_count > 15)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(pack => {
        if (pack.categories && Array.isArray(pack.categories)) {
          return pack.categories.includes(categoryFilter)
        }
        const titleLower = pack.title.toLowerCase()
        const packCategories = {
          'Solo Travel': titleLower.includes('solo') || titleLower.includes('alone'),
          'Romantic': titleLower.includes('romantic') || titleLower.includes('date'),
          'Family': titleLower.includes('family') || titleLower.includes('kids'),
          'Friends Group': titleLower.includes('friend') || titleLower.includes('group'),
          'Business Travel': titleLower.includes('business') || titleLower.includes('work'),
          'Adventure': titleLower.includes('adventure') || titleLower.includes('outdoor'),
          'Relaxation': titleLower.includes('relax') || titleLower.includes('spa'),
          'Cultural': titleLower.includes('culture') || titleLower.includes('museum'),
          'Food & Drink': titleLower.includes('food') || titleLower.includes('restaurant'),
          'Nightlife': titleLower.includes('night') || titleLower.includes('bar')
        }
        return packCategories[categoryFilter as keyof typeof packCategories]
      })
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        break
      case 'downloaded':
        filtered.sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
    }

    return filtered
  }, [pinPacks, activeSearchTerm, starRatingFilter, pinCountFilter, categoryFilter, sortBy])

  // Utility functions
  const getGoogleMapsRating = (city: string, country: string, packTitle: string) => {
    const locationHash = `${city}${country}${packTitle}`.toLowerCase().replace(/[^a-z0-9]/g, '')
    const hashValue = locationHash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const baseRating = 3.8 + (hashValue % 10) * 0.1
    const reviewCount = 50 + (hashValue % 450)
    
    return {
      rating: Math.round(baseRating * 10) / 10,
      reviewCount: reviewCount,
      source: 'Google Maps'
    }
  }

  const shouldShowGoogleMapsRating = (pack: PinPackWithPhoto) => {
    const hasOwnReviews = pack.rating_count && pack.rating_count > 0
    const hasSignificantDownloads = pack.download_count && pack.download_count > 10
    return !hasOwnReviews || !hasSignificantDownloads
  }

  const clearFilters = () => {
    setSearchTerm('')
    setActiveSearchTerm('')
    setHasSearched(false)
    setStarRatingFilter('all')
    setPinCountFilter('all')
    setCategoryFilter('all')
    const url = new URL(window.location.href)
    url.searchParams.delete('search')
    url.searchParams.delete('category')
    window.history.replaceState({}, '', url.toString())
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (starRatingFilter !== 'all') count++
    if (pinCountFilter !== 'all') count++
    if (categoryFilter !== 'all') count++
    return count
  }

  // Handle protected actions
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-25">
        <div className="text-center py-20">
          <CloudLoader size="lg" text="Finding amazing places..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-25">
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
            <MapPin className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 text-lg mb-8">{error}</p>
          <button onClick={refetch} className="btn-primary">
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-25">
      {/* Results summary and controls */}
      <div className="bg-white border-b border-gray-100 pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Results summary */}
            <div className="flex-1">
              {hasSearched && activeSearchTerm ? (
                <p className="text-sm text-gray-600">
                  {loading ? 'Searching...' : `${filteredPacks.length} results for "${activeSearchTerm}"`}
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  {loading ? 'Loading...' : `${filteredPacks.length} places available`}
                  {searchTerm && !hasSearched && (
                    <span className="ml-2 text-coral-600 font-medium">- Type and press search to filter results</span>
                  )}
                </p>
              )}
            </div>
            
            {/* Filters and Sorting controls */}
            <div className="flex items-center gap-3">
              {/* Sort by dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Sort by</span>
                <div className="relative">
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
                  
                  {showSortDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        {[
                          { value: 'newest', label: 'Newest' },
                          { value: 'oldest', label: 'Oldest' },
                          { value: 'rating', label: 'Highest Rated' },
                          { value: 'downloaded', label: 'Most Downloaded' }
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value)
                              setShowSortDropdown(false)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                              sortBy === option.value ? 'text-coral-600 bg-coral-50' : 'text-gray-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filters button */}
              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
              >
                <Sliders className="h-4 w-4" />
                <span>Filters</span>
                {getActiveFilterCount() > 0 && (
                  <span className="bg-coral-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={handleSearchInputChange}
            onSearch={handleSearch}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            selectedSuggestionIndex={selectedSuggestionIndex}
            onSuggestionClick={handleSuggestionClick}
            onSuggestionIndexChange={setSelectedSuggestionIndex}
          />
        </div>

        {/* Empty State */}
        {!loading && !error && filteredPacks.length === 0 && pinPacks.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
              <MapPin className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No places yet</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Be the first to share amazing places from your city with travelers around the world.
            </p>
            <a 
              href="/create" 
              onClick={(e) => {
                const userProfile = localStorage.getItem('pinpacks_user_profile')
                if (!userProfile) {
                  e.preventDefault()
                  window.location.href = '/auth'
                }
              }}
              className="btn-primary inline-flex items-center text-lg px-8 py-4"
            >
              <Globe2 className="h-5 w-5 mr-2" />
              Create first pin pack
            </a>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && filteredPacks.length === 0 && pinPacks.length > 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No results found</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Try adjusting your search or filters to discover more places.
            </p>
            <button onClick={clearFilters} className="btn-secondary">
              Clear all filters
            </button>
          </div>
        )}

        {/* Pin Packs Grid */}
        {!loading && !error && filteredPacks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPacks.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                isAuthenticated={isAuthenticated}
                wishlistItems={wishlistItems}
                onToggleWishlist={handleToggleWishlist}
                onShowLoginModal={() => setShowLoginModal(true)}
                getGoogleMapsRating={getGoogleMapsRating}
                shouldShowGoogleMapsRating={shouldShowGoogleMapsRating}
              />
            ))}
          </div>
        )}

        {/* Load more button if many results */}
        {!loading && !error && filteredPacks.length > 12 && (
          <div className="text-center mt-12">
            <button className="btn-secondary inline-flex items-center text-lg px-8 py-4">
              Show more places
            </button>
          </div>
        )}
      </div>

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
                  window.location.href = '/auth'
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
    </div>
  )
} 
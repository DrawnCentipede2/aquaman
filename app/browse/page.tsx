'use client'

import { useState, useEffect } from 'react'
import { MapPin, Download, Star, Users, Search, Filter, QrCode, Heart, Calendar, Globe2, X, Sliders } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PinPack } from '@/lib/supabase'

export default function BrowsePage() {
  // State for storing pin packs from database
  const [pinPacks, setPinPacks] = useState<PinPack[]>([])
  const [filteredPacks, setFilteredPacks] = useState<PinPack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  
  // Enhanced filter states
  const [ratingFilter, setRatingFilter] = useState('all')
  const [createdDateFilter, setCreatedDateFilter] = useState('all')
  const [pinCountFilter, setPinCountFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showFilterModal, setShowFilterModal] = useState(false)
  
  // Wishlist state - track which items are in wishlist
  const [wishlistItems, setWishlistItems] = useState<string[]>([])
  
  // Get unique values for filter options
  const categories = ['Solo Travel', 'Couple', 'Family', 'Friends Group', 'Business Travel', 'Adventure', 'Relaxation', 'Cultural', 'Food & Drink', 'Nightlife']

  // Handle search button click
  const handleSearch = () => {
    setHasSearched(true)
    // You could add additional search logic here if needed
  }

  // Load pin packs and check for URL parameters when component mounts
  useEffect(() => {
    loadPinPacks()
    
    // Check for search parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    const searchParam = urlParams.get('search')
    if (searchParam) {
      setSearchTerm(searchParam)
    }
  }, [])

  // Load wishlist from localStorage when component mounts
  useEffect(() => {
    const savedWishlist = localStorage.getItem('pinpacks_wishlist')
    if (savedWishlist) {
      try {
        const wishlist = JSON.parse(savedWishlist)
        // Extract just the IDs for easier checking
        const wishlistIds = wishlist.map((item: any) => item.id)
        setWishlistItems(wishlistIds)
      } catch (error) {
        console.error('Error loading wishlist:', error)
      }
    }
  }, [])

  // Enhanced filter logic when any filter changes
  useEffect(() => {
    let filtered = pinPacks

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(pack => 
        pack.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pack.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pack.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pack.country.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // People's Choice filter (based on download count as proxy for popularity)
    if (ratingFilter === 'favorite') {
      // People's Favorite - most downloaded overall
      filtered = filtered.filter(pack => (pack.download_count || 0) >= 50)
    } else if (ratingFilter === 'most_rated') {
      // Most Rated - moderate to high download count
      filtered = filtered.filter(pack => (pack.download_count || 0) >= 25)
    } else if (ratingFilter === 'best_rated') {
      // Best Rated - highest download count threshold
      filtered = filtered.filter(pack => (pack.download_count || 0) >= 75)
    }

    // Created date filter
    if (createdDateFilter === 'recent') {
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      filtered = filtered.filter(pack => new Date(pack.created_at) >= oneMonthAgo)
    } else if (createdDateFilter === 'older') {
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      filtered = filtered.filter(pack => new Date(pack.created_at) < oneMonthAgo)
    }

    // Pin count filter
    if (pinCountFilter === 'small') {
      filtered = filtered.filter(pack => pack.pin_count >= 0 && pack.pin_count <= 5)
    } else if (pinCountFilter === 'medium') {
      filtered = filtered.filter(pack => pack.pin_count > 5 && pack.pin_count <= 15)
    } else if (pinCountFilter === 'large') {
      filtered = filtered.filter(pack => pack.pin_count > 15)
    }

    // Category filter (for demo purposes, we'll use a random assignment based on pack ID)
    if (categoryFilter !== 'all') {
      // In a real app, this would be stored in the database
      // For demo, we'll filter based on a pattern
      filtered = filtered.filter(pack => {
        const packCategories = {
          'Solo Travel': pack.id.includes('1') || pack.id.includes('4'),
          'Couple': pack.id.includes('2') || pack.id.includes('5'),
          'Family': pack.id.includes('3') || pack.id.includes('6'),
          'Friends Group': pack.id.includes('7') || pack.id.includes('0'),
          'Business Travel': pack.id.includes('8'),
          'Adventure': pack.title.toLowerCase().includes('adventure') || pack.title.toLowerCase().includes('outdoor'),
          'Relaxation': pack.title.toLowerCase().includes('relax') || pack.title.toLowerCase().includes('spa'),
          'Cultural': pack.title.toLowerCase().includes('culture') || pack.title.toLowerCase().includes('museum'),
          'Food & Drink': pack.title.toLowerCase().includes('food') || pack.title.toLowerCase().includes('restaurant'),
          'Nightlife': pack.title.toLowerCase().includes('night') || pack.title.toLowerCase().includes('bar')
        }
        return packCategories[categoryFilter as keyof typeof packCategories]
      })
    }

    setFilteredPacks(filtered)
  }, [pinPacks, searchTerm, ratingFilter, createdDateFilter, pinCountFilter, categoryFilter])

  // Function to fetch pin packs from Supabase database
  const loadPinPacks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pin_packs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPinPacks(data || [])
      setFilteredPacks(data || [])
    } catch (err) {
      setError('Failed to load pin packs')
      console.error('Error loading pin packs:', err)
    } finally {
      setLoading(false)
    }
  }

  // Function to add item to wishlist
  const addToWishlist = (pack: PinPack) => {
    try {
      // Get current wishlist from localStorage
      const savedWishlist = localStorage.getItem('pinpacks_wishlist')
      let currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : []
      
      // Check if item is already in wishlist
      const isAlreadyInWishlist = currentWishlist.some((item: any) => item.id === pack.id)
      
      if (!isAlreadyInWishlist) {
        // Add the pack to wishlist
        currentWishlist.push(pack)
        
        // Save to localStorage
        localStorage.setItem('pinpacks_wishlist', JSON.stringify(currentWishlist))
        
        // Update local state
        setWishlistItems(prev => [...prev, pack.id])
        
        console.log('Added to wishlist:', pack.title)
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error)
    }
  }

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
      setWishlistItems(prev => prev.filter(id => id !== packId))
      
      console.log('Removed from wishlist:', packId)
    } catch (error) {
      console.error('Error removing from wishlist:', error)
    }
  }

  // Function to toggle wishlist status
  const toggleWishlist = (pack: PinPack) => {
    const isInWishlist = wishlistItems.includes(pack.id)
    
    if (isInWishlist) {
      removeFromWishlist(pack.id)
    } else {
      addToWishlist(pack)
    }
  }

  // Function to open pin pack in Google Maps or generate QR code
  const openPinPack = async (packId: string, format: 'maps' | 'qr' = 'maps') => {
    try {
      // Get pin pack info and pins
      const [{ data: packData }, { data: packPins }] = await Promise.all([
        supabase.from('pin_packs').select('*').eq('id', packId).single(),
        supabase.from('pin_pack_pins').select(`
          pins (
            title,
            description,
            google_maps_url,
            latitude,
            longitude,
            category
          )
        `).eq('pin_pack_id', packId)
      ])

      if (!packData || !packPins) throw new Error('Failed to get pack data')

      // Track the download/view
      try {
        const locationResponse = await fetch('https://ipapi.co/json/')
        const locationData = await locationResponse.json()
        const userLocation = `${locationData.city}, ${locationData.country_name}`

        await supabase.from('pack_downloads').insert({
          pin_pack_id: packId,
          download_type: format,
          user_location: userLocation,
          user_ip: locationData.ip
        })

        await supabase
          .from('pin_packs')
          .update({ download_count: (packData.download_count || 0) + 1 })
          .eq('id', packId)
      } catch (analyticsErr) {
        console.log('Analytics tracking failed:', analyticsErr)
      }

      if (format === 'maps') {
        openGoogleMapsDirectly(packData, packPins.map(item => (item as any).pins))
      } else if (format === 'qr') {
        generateQRCode(packData, packPins.map(item => (item as any).pins))
      }
    } catch (err) {
      alert('Failed to open pin pack')
      console.error('Download error:', err)
    }
  }

  // Open Google Maps directly
  const openGoogleMapsDirectly = (packData: any, pins: any[]) => {
    const pinsWithCoords = pins.filter(pin => pin.latitude !== 0 || pin.longitude !== 0)
    
    if (pinsWithCoords.length === 0) {
      const firstPin = pins[0]
      if (firstPin?.google_maps_url) {
        window.open(firstPin.google_maps_url, '_blank')
      } else {
        alert('No valid coordinates found for these pins.')
      }
      return
    }
    
    if (pinsWithCoords.length === 1) {
      const pin = pinsWithCoords[0]
      const url = pin.google_maps_url || `https://www.google.com/maps?q=${pin.latitude},${pin.longitude}`
      window.open(url, '_blank')
    } else {
      const waypoints = pinsWithCoords.map(pin => `${pin.latitude},${pin.longitude}`).join('/')
      const url = `https://www.google.com/maps/dir/${waypoints}`
      window.open(url, '_blank')
    }
  }

  // Generate QR Code
  const generateQRCode = (packData: any, pins: any[]) => {
    const searchQuery = `${packData.title} ${packData.city}`
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mapsUrl)}`
    
    const qrWindow = window.open('', '_blank', 'width=400,height=500')
    if (qrWindow) {
      qrWindow.document.write(`
        <html>
          <head><title>QR Code - ${packData.title}</title></head>
          <body style="text-align:center; font-family:Arial; padding:20px;">
            <h2>${packData.title}</h2>
            <p>Scan this QR code to search for these locations on Google Maps</p>
            <img src="${qrCodeUrl}" alt="QR Code" style="border:1px solid #ccc; border-radius:8px;" />
            <p style="margin-top:20px; font-size:12px; color:#666;">
              Or visit: <br><a href="${mapsUrl}" target="_blank">${mapsUrl}</a>
            </p>
            <p style="margin-top:20px;">
              <button onclick="window.print()" style="background:#ff5a5f; color:white; border:none; padding:10px 20px; border-radius:4px; cursor:pointer;">Print QR Code</button>
            </p>
          </body>
        </html>
      `)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setHasSearched(false)
    setRatingFilter('all')
    setCreatedDateFilter('all')
    setPinCountFilter('all')
    setCategoryFilter('all')
    // Update URL to remove search parameter
    const url = new URL(window.location.href)
    url.searchParams.delete('search')
    window.history.replaceState({}, '', url.toString())
  }

  // Count active filters for badge
  const getActiveFilterCount = () => {
    let count = 0
    if (ratingFilter !== 'all') count++
    if (createdDateFilter !== 'all') count++
    if (pinCountFilter !== 'all') count++
    if (categoryFilter !== 'all') count++
    return count
  }

  return (
    <div className="min-h-screen bg-gray-25">
      {/* Airbnb-inspired Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Explore amazing places
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover hand-picked local recommendations from people who know their cities best.
            </p>
          </div>

          {/* Enhanced Airbnb-style search and filter bar */}
          <div className="max-w-4xl mx-auto">
            <div className="search-bar p-1 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-0 mb-4">
              {/* Search input */}
              <div className="flex-1 flex items-center min-h-[56px]">
                <Search className="h-5 w-5 text-gray-400 ml-4 mr-3" />
                <input
                  type="text"
                  placeholder="Search destinations, cities, or experiences..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-none outline-none text-gray-700 text-base placeholder-gray-400 bg-transparent"
                />
              </div>
              
              {/* Filter button - only show after search is performed */}
              {hasSearched && (
                <div className="flex items-center px-2">
                  <div className="hidden md:block w-px h-8 bg-gray-300 mx-2"></div>
                  <button
                    onClick={() => setShowFilterModal(true)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-full transition-colors border border-gray-300 hover:border-gray-400 min-h-[40px]"
                  >
                    <Sliders className="h-4 w-4" />
                    <span className="font-medium text-sm">Filters</span>
                    {getActiveFilterCount() > 0 && (
                      <span className="bg-coral-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {getActiveFilterCount()}
                      </span>
                    )}
                  </button>
                </div>
              )}
              
              {/* Search button */}
              <button 
                onClick={handleSearch}
                className="btn-primary ml-2 px-8 py-3 text-base min-h-[56px]"
              >
                Search
              </button>
            </div>
          </div>

          {/* Results summary */}
          <div className="max-w-4xl mx-auto mt-6">
            <p className="text-gray-600">
              {loading ? 'Searching...' : 
               searchTerm ? `${filteredPacks.length} results for "${searchTerm}"` :
               `${filteredPacks.length} amazing places to explore`}
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-8">
              {/* People's Choice */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">People's Choice</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setRatingFilter('all')}
                    className={`p-3 border-2 rounded-xl text-center transition-colors ${
                      ratingFilter === 'all'
                        ? 'border-coral-500 text-gray-900'
                        : 'border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    All places
                  </button>
                  <button
                    onClick={() => setRatingFilter('favorite')}
                    className={`p-3 border-2 rounded-xl text-center transition-colors ${
                      ratingFilter === 'favorite'
                        ? 'border-coral-500 text-gray-900'
                        : 'border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    People's Favorite
                  </button>
                  <button
                    onClick={() => setRatingFilter('most_rated')}
                    className={`p-3 border-2 rounded-xl text-center transition-colors ${
                      ratingFilter === 'most_rated'
                        ? 'border-coral-500 text-gray-900'
                        : 'border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    Most Rated
                  </button>
                  <button
                    onClick={() => setRatingFilter('best_rated')}
                    className={`p-3 border-2 rounded-xl text-center transition-colors ${
                      ratingFilter === 'best_rated'
                        ? 'border-coral-500 text-gray-900'
                        : 'border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    Best Rated
                  </button>
                </div>
              </div>

              {/* Created Date */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">When Created</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setCreatedDateFilter('all')}
                    className={`p-3 border-2 rounded-xl text-center transition-colors ${
                      createdDateFilter === 'all'
                        ? 'border-coral-500 text-gray-900'
                        : 'border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    Any time
                  </button>
                  <button
                    onClick={() => setCreatedDateFilter('recent')}
                    className={`p-3 border-2 rounded-xl text-center transition-colors ${
                      createdDateFilter === 'recent'
                        ? 'border-coral-500 text-gray-900'
                        : 'border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    Less than 1 month
                  </button>
                  <button
                    onClick={() => setCreatedDateFilter('older')}
                    className={`p-3 border-2 rounded-xl text-center transition-colors ${
                      createdDateFilter === 'older'
                        ? 'border-coral-500 text-gray-900'
                        : 'border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    More than 1 month
                  </button>
                </div>
              </div>

              {/* Number of Pins */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Size</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setPinCountFilter('all')}
                    className={`p-3 border-2 rounded-xl text-center transition-colors ${
                      pinCountFilter === 'all'
                        ? 'border-coral-500 text-gray-900'
                        : 'border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    All sizes
                  </button>
                  <button
                    onClick={() => setPinCountFilter('small')}
                    className={`p-3 border-2 rounded-xl text-center transition-colors ${
                      pinCountFilter === 'small'
                        ? 'border-coral-500 text-gray-900'
                        : 'border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    Small (0-5)
                  </button>
                  <button
                    onClick={() => setPinCountFilter('medium')}
                    className={`p-3 border-2 rounded-xl text-center transition-colors ${
                      pinCountFilter === 'medium'
                        ? 'border-coral-500 text-gray-900'
                        : 'border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    Medium (6-15)
                  </button>
                  <button
                    onClick={() => setPinCountFilter('large')}
                    className={`p-3 border-2 rounded-xl text-center transition-colors ${
                      pinCountFilter === 'large'
                        ? 'border-coral-500 text-gray-900'
                        : 'border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    Large (15+)
                  </button>
                </div>
              </div>

              {/* Travel Categories */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Travel Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`p-3 border-2 rounded-xl text-center transition-colors ${
                      categoryFilter === 'all'
                        ? 'border-coral-500 text-gray-900'
                        : 'border-gray-300 hover:border-gray-400 text-gray-900'
                    }`}
                  >
                    All categories
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setCategoryFilter(category)}
                      className={`p-3 border-2 rounded-xl text-center transition-colors ${
                        categoryFilter === category
                          ? 'border-coral-500 text-gray-900'
                          : 'border-gray-300 hover:border-gray-400 text-gray-900'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-b-2xl">
              <button
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800 font-medium underline"
              >
                Clear all filters
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="btn-primary px-8 py-3"
              >
                Show {filteredPacks.length} places
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-100 mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
            </div>
            <p className="text-gray-600 text-lg">Finding amazing places...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
              <MapPin className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 text-lg mb-8">{error}</p>
            <button 
              onClick={loadPinPacks}
              className="btn-primary"
            >
              Try again
            </button>
          </div>
        )}

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
                  window.location.href = '/signup'
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
            <button 
              onClick={clearFilters}
              className="btn-secondary"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Pin Packs Grid - Airbnb-style */}
        {!loading && !error && filteredPacks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPacks.map((pack, index) => (
              <div 
                key={pack.id}
                onClick={() => window.location.href = `/pack/${pack.id}`}
                className="card-airbnb card-airbnb-hover group cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Image placeholder - Airbnb style */}
                <div className="relative h-64 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  
                  {/* Heart icon - Add to wishlist */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation() // Prevent card click when clicking heart
                      toggleWishlist(pack)
                    }}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors group"
                  >
                    <Heart 
                      className={`h-4 w-4 transition-colors ${
                        wishlistItems.includes(pack.id) 
                          ? 'text-coral-500 fill-current' 
                          : 'text-gray-700 group-hover:text-coral-500'
                      }`} 
                    />
                  </button>
                  
                  {/* Price badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                      {pack.price === 0 ? 'Free' : `$${pack.price}`}
                    </span>
                  </div>
                  
                  {/* Pin count */}
                  <div className="absolute bottom-3 right-3">
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
                    <div className="flex items-center text-sm text-gray-500 ml-2">
                      <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                      <span className="text-xs">{pack.download_count || 0}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                    {pack.description}
                  </p>
                  
                  <button
                    onClick={() => window.location.href = `/pack/${pack.id}`}
                    className="w-full btn-primary text-sm py-2.5 flex items-center justify-center group"
                  >
                    <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    View Details
                  </button>
                </div>
              </div>
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
    </div>
  )
} 
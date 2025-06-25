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
  
  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  // Enhanced filter states
  const [starRatingFilter, setStarRatingFilter] = useState('all')
  const [pinCountFilter, setPinCountFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showFilterModal, setShowFilterModal] = useState(false)
  
  // Sorting state
  const [sortBy, setSortBy] = useState('newest') // 'rating', 'downloaded', 'newest', 'oldest'
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  
  // Wishlist state - track which items are in wishlist
  const [wishlistItems, setWishlistItems] = useState<string[]>([])
  
  // Get unique values for filter options
  const categories = ['Solo Travel', 'Couple', 'Family', 'Friends Group', 'Business Travel', 'Adventure', 'Relaxation', 'Cultural', 'Food & Drink', 'Nightlife']

  // Handle search button click
  const handleSearch = () => {
    setHasSearched(true)
    setShowSuggestions(false)
  }

  // Generate autocomplete suggestions
  const generateSuggestions = (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const searchQuery = query.toLowerCase()
    const allSuggestions: string[] = []
    
    // Get suggestions from pack titles, cities, and countries
    pinPacks.forEach(pack => {
      // Add pack titles
      if (pack.title.toLowerCase().includes(searchQuery)) {
        allSuggestions.push(pack.title)
      }
      // Add cities
      if (pack.city.toLowerCase().includes(searchQuery)) {
        allSuggestions.push(pack.city + ', ' + pack.country)
      }
      // Add countries
      if (pack.country.toLowerCase().includes(searchQuery)) {
        allSuggestions.push(pack.country)
      }
    })

    // Remove duplicates and limit to 6 suggestions
    const uniqueSuggestions = Array.from(new Set(allSuggestions)).slice(0, 6)
    setSuggestions(uniqueSuggestions)
    setShowSuggestions(uniqueSuggestions.length > 0)
  }

  // Handle search input change
  const handleSearchInputChange = (value: string) => {
    setSearchTerm(value)
    generateSuggestions(value)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    setShowSuggestions(false)
    setHasSearched(true)
  }

  // Load pin packs and check for URL parameters when component mounts
  useEffect(() => {
    loadPinPacks()
    
    // Check for search parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    const searchParam = urlParams.get('search')
    if (searchParam) {
      setSearchTerm(searchParam)
      setHasSearched(true)
    }
  }, [])

  // Mount search bar in header when component mounts and hide tagline
  useEffect(() => {
    // Hide the tagline on browse page
    const tagline = document.getElementById('tagline')
    if (tagline) {
      tagline.style.display = 'none'
    }
    
    const headerContainer = document.getElementById('header-search-container')
    if (headerContainer) {
      headerContainer.innerHTML = `
        <div class="flex items-center gap-4">
          <div class="w-full max-w-md relative" id="search-input-container">
            <div class="flex items-center bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 focus-within:border-coral-500 focus-within:ring-2 focus-within:ring-coral-500/20 transition-all">
              <svg class="h-4 w-4 text-gray-400 ml-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                type="text"
                placeholder="Search destinations, cities..."
                id="header-search-input"
                class="flex-1 border-none outline-none text-gray-700 text-sm placeholder-gray-400 bg-transparent py-3 pr-3"
              />
            </div>
            <div id="suggestions-dropdown" class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto hidden"></div>
          </div>
          <button 
            id="header-search-button"
            class="bg-coral-500 hover:bg-coral-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
          >
            Search
          </button>
        </div>
      `
      
      // Set up event listeners for the header search
      const searchInput = document.getElementById('header-search-input') as HTMLInputElement
      const searchButton = document.getElementById('header-search-button')
      const suggestionsDropdown = document.getElementById('suggestions-dropdown')
      
      if (searchInput && searchButton && suggestionsDropdown) {
        // Set current search term
        searchInput.value = searchTerm
        
        // Input change handler
        const handleInputChange = (e: Event) => {
          const value = (e.target as HTMLInputElement).value
          setSearchTerm(value)
          generateHeaderSuggestions(value, suggestionsDropdown)
        }
        
        // Search button click handler
        const handleSearchClick = () => {
          setHasSearched(true)
          setShowSuggestions(false)
          suggestionsDropdown.classList.add('hidden')
        }
        
        // Enter key handler
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            handleSearchClick()
          }
          if (e.key === 'Escape') {
            setShowSuggestions(false)
            suggestionsDropdown.classList.add('hidden')
          }
        }
        
        // Focus handler
        const handleFocus = () => {
          if (searchInput.value.length >= 2) {
            generateHeaderSuggestions(searchInput.value, suggestionsDropdown)
          }
        }
        
        // Blur handler
        const handleBlur = () => {
          setTimeout(() => {
            setShowSuggestions(false)
            suggestionsDropdown.classList.add('hidden')
          }, 200)
        }
        
        // Add event listeners
        searchInput.addEventListener('input', handleInputChange)
        searchInput.addEventListener('keydown', handleKeyDown)
        searchInput.addEventListener('focus', handleFocus)
        searchInput.addEventListener('blur', handleBlur)
        searchButton.addEventListener('click', handleSearchClick)
        
        // Cleanup function
        return () => {
          searchInput.removeEventListener('input', handleInputChange)
          searchInput.removeEventListener('keydown', handleKeyDown)
          searchInput.removeEventListener('focus', handleFocus)
          searchInput.removeEventListener('blur', handleBlur)
          searchButton.removeEventListener('click', handleSearchClick)
        }
      }
    }
    
    // Cleanup when component unmounts
    return () => {
      const headerContainer = document.getElementById('header-search-container')
      if (headerContainer) {
        headerContainer.innerHTML = ''
      }
      
      // Restore the tagline when leaving browse page
      const tagline = document.getElementById('tagline')
      if (tagline) {
        tagline.style.display = ''
      }
    }
  }, [searchTerm])

  // Helper function to generate suggestions in the header
  const generateHeaderSuggestions = (query: string, dropdownElement: HTMLElement) => {
    if (!query.trim() || query.length < 2) {
      dropdownElement.classList.add('hidden')
      return
    }

    const searchQuery = query.toLowerCase()
    const allSuggestions: string[] = []
    
    // Get suggestions from pack titles, cities, and countries
    pinPacks.forEach(pack => {
      if (pack.title.toLowerCase().includes(searchQuery)) {
        allSuggestions.push(pack.title)
      }
      if (pack.city.toLowerCase().includes(searchQuery)) {
        allSuggestions.push(pack.city + ', ' + pack.country)
      }
      if (pack.country.toLowerCase().includes(searchQuery)) {
        allSuggestions.push(pack.country)
      }
    })

    const uniqueSuggestions = Array.from(new Set(allSuggestions)).slice(0, 6)
    
    if (uniqueSuggestions.length > 0) {
      dropdownElement.innerHTML = uniqueSuggestions.map(suggestion => `
        <button
          class="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
          onclick="document.getElementById('header-search-input').value='${suggestion}'; this.parentElement.classList.add('hidden'); window.dispatchEvent(new CustomEvent('headerSuggestionClick', {detail: '${suggestion}'}));"
        >
          <div class="flex items-center">
            <svg class="h-3 w-3 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <span class="text-sm text-gray-700">${suggestion}</span>
          </div>
        </button>
      `).join('')
      dropdownElement.classList.remove('hidden')
    } else {
      dropdownElement.classList.add('hidden')
    }
  }

  // Listen for header suggestion clicks
  useEffect(() => {
    const handleHeaderSuggestionClick = (e: CustomEvent) => {
      setSearchTerm(e.detail)
      setHasSearched(true)
    }
    
    window.addEventListener('headerSuggestionClick', handleHeaderSuggestionClick as EventListener)
    
    return () => {
      window.removeEventListener('headerSuggestionClick', handleHeaderSuggestionClick as EventListener)
    }
  }, [])

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sortDropdown = document.querySelector('.sort-dropdown-container')
      if (sortDropdown && !sortDropdown.contains(event.target as Node)) {
        setShowSortDropdown(false)
      }
    }

    if (showSortDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSortDropdown])

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

  // Enhanced filter and sorting logic when any filter changes
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

    // Star rating filter (based on calculated rating)
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
      default:
        // Keep original order
        break
    }

    setFilteredPacks(filtered)
  }, [pinPacks, searchTerm, starRatingFilter, pinCountFilter, categoryFilter, sortBy])

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

  // Function to toggle wishlist (add or remove)
  const toggleWishlist = (pack: PinPack) => {
    if (wishlistItems.includes(pack.id)) {
      removeFromWishlist(pack.id)
    } else {
      addToWishlist(pack)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setHasSearched(false)
    setStarRatingFilter('all')
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
    if (starRatingFilter !== 'all') count++
    if (pinCountFilter !== 'all') count++
    if (categoryFilter !== 'all') count++
    return count
  }

  return (
    <div className="min-h-screen bg-gray-25">

      {/* Results summary and controls */}
      <div className="bg-white border-b border-gray-100 pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Results summary */}
            <div className="flex-1">
              {(hasSearched || searchTerm) ? (
                <p className="text-sm text-gray-600">
                  {loading ? 'Searching...' : 
                   searchTerm ? `${filteredPacks.length} results for "${searchTerm}"` :
                   `${filteredPacks.length} places available`}
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  {loading ? 'Loading...' : `${filteredPacks.length} places available`}
                </p>
              )}
            </div>
            
            {/* Filters and Sorting controls */}
            <div className="flex items-center gap-3">
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
                {/* Hamburger menu icon with circles in alternating positions */}
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  {/* First line with circle on the right */}
                  <rect x="3" y="5" width="14" height="2" rx="1"/>
                  <circle cx="20" cy="6" r="1.5"/>
                  
                  {/* Second line with circle on the left */}
                  <circle cx="4" cy="12" r="1.5"/>
                  <rect x="7" y="11" width="14" height="2" rx="1"/>
                  
                  {/* Third line with circle on the right */}
                  <rect x="3" y="17" width="14" height="2" rx="1"/>
                  <circle cx="20" cy="18" r="1.5"/>
                </svg>
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

      {/* Enhanced Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-center relative rounded-t-2xl">
              <button
                onClick={() => setShowFilterModal(false)}
                className="absolute left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-8">
              {/* Star Rating */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Star Rating</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="rating"
                      checked={starRatingFilter === 'all'}
                      onChange={() => setStarRatingFilter('all')}
                      className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">All ratings</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="rating"
                      checked={starRatingFilter === '4+'}
                      onChange={() => setStarRatingFilter('4+')}
                      className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">4+ stars</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="rating"
                      checked={starRatingFilter === '4.5+'}
                      onChange={() => setStarRatingFilter('4.5+')}
                      className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">4.5+ stars</span>
                  </label>
                </div>
              </div>

              {/* Pin Count */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Size</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="pinCount"
                      checked={pinCountFilter === 'all'}
                      onChange={() => setPinCountFilter('all')}
                      className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">All sizes</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="pinCount"
                      checked={pinCountFilter === 'small'}
                      onChange={() => setPinCountFilter('small')}
                      className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Small (0-5)</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="pinCount"
                      checked={pinCountFilter === 'medium'}
                      onChange={() => setPinCountFilter('medium')}
                      className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Medium (6-15)</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="pinCount"
                      checked={pinCountFilter === 'large'}
                      onChange={() => setPinCountFilter('large')}
                      className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Large (15+)</span>
                  </label>
                </div>
              </div>

              {/* Travel Categories */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Travel Categories</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      checked={categoryFilter === 'all'}
                      onChange={() => setCategoryFilter('all')}
                      className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">All categories</span>
                  </label>
                  {categories.map(category => (
                    <label key={category} className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="category"
                        checked={categoryFilter === category}
                        onChange={() => setCategoryFilter(category)}
                        className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end rounded-b-2xl">
              <div className="flex items-center gap-4">
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
                className="card-airbnb group cursor-pointer"
              >
                {/* Image placeholder - Google Maps style background */}
                <div className="relative h-64 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 overflow-hidden">
                  {/* Inner container that scales - maintains boundaries */}
                  <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-300 ease-out">
                    {/* Google Maps background */}
                    <img 
                      src="/google-maps-bg.svg"
                      alt="Map background"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  </div>
                  
                  {/* Heart icon - Add to wishlist */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation() // Prevent card click when clicking heart
                      toggleWishlist(pack)
                    }}
                    className="absolute top-3 right-3 w-8 h-8 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors group shadow-sm"
                  >
                    <Heart 
                      className={`h-4 w-4 transition-colors ${
                        wishlistItems.includes(pack.id) 
                          ? 'text-coral-500 fill-current' 
                          : 'text-gray-700 group-hover:text-coral-500'
                      }`} 
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
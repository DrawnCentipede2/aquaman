'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Download, Star, Users, Search, Filter, QrCode, Heart, Calendar, Globe2, X, Sliders, CheckCircle, ShoppingCart, CreditCard, Package, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PinPack } from '@/lib/supabase'
import PayPalCheckout from '@/components/PayPalCheckout'
import PaymentSuccessModal from '@/components/PaymentSuccessModal'

// Extended PinPack type to include cover photo
interface PinPackWithPhoto extends PinPack {
  coverPhoto?: string | null
}

export default function BrowsePage() {
  // State for storing pin packs from database
  const [pinPacks, setPinPacks] = useState<PinPackWithPhoto[]>([])
  const [filteredPacks, setFilteredPacks] = useState<PinPackWithPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearchTerm, setActiveSearchTerm] = useState('') // Only updated when user explicitly searches
  const [hasSearched, setHasSearched] = useState(false)
  
  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1) // For keyboard navigation
  const selectedIndexRef = useRef(-1) // Keep track of current selection synchronously
  
  // Debug selectedSuggestionIndex changes
  useEffect(() => {
    selectedIndexRef.current = selectedSuggestionIndex
    console.log('🔍 selectedSuggestionIndex changed to:', selectedSuggestionIndex)
  }, [selectedSuggestionIndex])
  
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
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  
  // Cart success state for showing success banner
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
  
  // Payment success state for falling pins modal
  const [showPayPalModal, setShowPayPalModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [purchasedPacksCount, setPurchasedPacksCount] = useState(0)
  
  // Get unique values for filter options
  const categories = ['Solo Travel', 'Couple', 'Family', 'Friends Group', 'Business Travel', 'Adventure', 'Relaxation', 'Cultural', 'Food & Drink', 'Nightlife']

  // Check authentication status
  const checkAuthentication = () => {
    const userProfileData = localStorage.getItem('pinpacks_user_profile')
    if (userProfileData) {
      try {
        const profile = JSON.parse(userProfileData)
        setIsAuthenticated(true)
        setUserProfile(profile)
        return true
      } catch (error) {
        console.error('Error parsing user profile:', error)
        localStorage.removeItem('pinpacks_user_profile')
      }
    }
    setIsAuthenticated(false)
    setUserProfile(null)
    return false
  }

  // Handle protected actions (show login modal if not authenticated)
  const handleProtectedAction = (action: () => void) => {
    if (isAuthenticated) {
      action()
    } else {
      setShowLoginModal(true)
    }
  }

  // Handle search button click
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm) // Set the active search term for filtering
    setHasSearched(true)
    setShowSuggestions(false)
  }

  // Generate autocomplete suggestions
  const generateSuggestions = (query: string) => {
    if (!query.trim() || query.length < 1) {
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
    setActiveSearchTerm(suggestion) // Set the active search term for filtering
    setShowSuggestions(false)
    setHasSearched(true)
  }

  // Load pin packs and check for URL parameters when component mounts
  useEffect(() => {
    checkAuthentication()
    loadPinPacks()
    
    // Check for search parameter in URL
    const urlParams = new URLSearchParams(window.location.search)
    const searchParam = urlParams.get('search')
    if (searchParam) {
      setSearchTerm(searchParam)
      setActiveSearchTerm(searchParam) // Set the active search term for filtering
      setHasSearched(true)
    }
    
    // Check for cart success parameters
    const cartSuccessParam = urlParams.get('cart_success')
    if (cartSuccessParam === 'true') {
      const packId = urlParams.get('added_pack_id')
      const packTitle = urlParams.get('added_pack_title')
      const packPrice = urlParams.get('added_pack_price')
      const packCity = urlParams.get('added_pack_city')
      const packCountry = urlParams.get('added_pack_country')
      const packPinCount = urlParams.get('added_pack_pin_count')
      
      if (packId && packTitle) {
        setCartSuccess(true)
        setAddedPack({
          id: packId,
          title: packTitle,
          price: packPrice || '0',
          city: packCity || '',
          country: packCountry || '',
          pin_count: packPinCount || '0'
        })
        
        // Clean up URL by removing cart success parameters
        const cleanUrl = new URL(window.location.href)
        cleanUrl.searchParams.delete('cart_success')
        cleanUrl.searchParams.delete('added_pack_id')
        cleanUrl.searchParams.delete('added_pack_title')
        cleanUrl.searchParams.delete('added_pack_price')
        cleanUrl.searchParams.delete('added_pack_city')
        cleanUrl.searchParams.delete('added_pack_country')
        cleanUrl.searchParams.delete('added_pack_pin_count')
        
        // Update URL without reloading the page
        window.history.replaceState({}, '', cleanUrl.toString())
      }
    }
  }, [])

  // Load wishlist when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist()
    } else {
      setWishlistItems([])
    }
  }, [isAuthenticated])

  // Load user's wishlist from browser storage (only when authenticated)
  const loadWishlist = () => {
    if (!isAuthenticated) {
      setWishlistItems([])
      return
    }

    const savedWishlist = localStorage.getItem('pinpacks_wishlist')
    if (savedWishlist) {
      try {
        const wishlist = JSON.parse(savedWishlist)
        const wishlistIds = wishlist.map((item: any) => item.id)
        setWishlistItems(wishlistIds)
      } catch (error) {
        console.error('Error loading wishlist:', error)
      }
    }
  }

  // Countdown timer for cart success banner
  useEffect(() => {
    if (!cartSuccess) return
    
    const startTime = Date.now()
    const duration = 24 * 60 * 1000 // 24 minutes in milliseconds
    
    const updateCountdown = () => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, duration - elapsed)
      
      if (remaining === 0) {
        setCartSuccess(false)
        setAddedPack(null)
        return
      }
      
      const minutes = Math.floor(remaining / (60 * 1000))
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000)
      setCountdownTime(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }
    
    updateCountdown() // Initial update
    const interval = setInterval(updateCountdown, 1000)
    
    return () => clearInterval(interval)
  }, [cartSuccess])

  // Mount search bar in header when component mounts and hide tagline
  useEffect(() => {
    // Hide the tagline on browse page
    const tagline = document.getElementById('tagline')
    if (tagline) {
      tagline.style.display = 'none'
    }
    
    const headerContainer = document.getElementById('header-search-container')
    if (headerContainer && !document.getElementById('header-search-input')) {
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
                autocomplete="off"
              />
            </div>
            <div id="suggestions-dropdown" class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 hidden"></div>
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
        // Input change handler
        const handleInputChange = (e: Event) => {
          const value = (e.target as HTMLInputElement).value
          setSearchTerm(value)
          selectedIndexRef.current = -1 // Reset selection when typing
          setSelectedSuggestionIndex(-1)
          generateHeaderSuggestions(value, suggestionsDropdown, -1)
        }
        
        // Search button click handler
        const handleSearchClick = () => {
          setActiveSearchTerm(searchInput.value) // Set the active search term for filtering
          setHasSearched(true)
          setShowSuggestions(false)
          suggestionsDropdown.classList.add('hidden')
        }
        
        // Enter key handler
        const handleKeyDown = (e: KeyboardEvent) => {
          const isDropdownVisible = !suggestionsDropdown.classList.contains('hidden')
          const suggestions = suggestionsDropdown.querySelectorAll('button')
          const suggestionsCount = suggestions.length

          // Debug key navigation
          if (['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
            console.log('🔍 Key navigation:', { key: e.key, selectedIndex: selectedIndexRef.current, suggestionsCount })
          }

          if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (isDropdownVisible && suggestionsCount > 0) {
              const currentIndex = selectedIndexRef.current === -1 ? -1 : selectedIndexRef.current
              const newIndex = currentIndex < suggestionsCount - 1 ? currentIndex + 1 : 0
              console.log('🔍 ArrowDown:', { prev: currentIndex, new: newIndex })
              selectedIndexRef.current = newIndex
              setSelectedSuggestionIndex(newIndex)
              generateHeaderSuggestions(searchInput.value, suggestionsDropdown, newIndex)
            }
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (isDropdownVisible && suggestionsCount > 0) {
              const currentIndex = selectedIndexRef.current === -1 ? suggestionsCount : selectedIndexRef.current
              const newIndex = currentIndex > 0 ? currentIndex - 1 : suggestionsCount - 1
              console.log('🔍 ArrowUp:', { prev: currentIndex, new: newIndex })
              selectedIndexRef.current = newIndex
              setSelectedSuggestionIndex(newIndex)
              generateHeaderSuggestions(searchInput.value, suggestionsDropdown, newIndex)
            }
                                  } else if (e.key === 'Enter') {
              e.preventDefault()
              if (isDropdownVisible && suggestionsCount > 0 && selectedIndexRef.current >= 0) {
                const selectedButton = suggestions[selectedIndexRef.current] as HTMLButtonElement
                console.log('🔍 Enter: selecting suggestion', selectedIndexRef.current)
                if (selectedButton) {
                  selectedButton.click()
                }
              } else {
                console.log('🔍 Enter: triggering search')
                handleSearchClick()
              }
            } else if (e.key === 'Escape') {
              setShowSuggestions(false)
              selectedIndexRef.current = -1
              setSelectedSuggestionIndex(-1)
              suggestionsDropdown.classList.add('hidden')
            } else {
              // Reset selection when typing
              selectedIndexRef.current = -1
              setSelectedSuggestionIndex(-1)
            }
        }
        
        // Focus handler
        const handleFocus = () => {
          if (searchInput.value.length >= 1) {
            // Don't reset selection if dropdown is already visible
            if (suggestionsDropdown.classList.contains('hidden')) {
              selectedIndexRef.current = -1
              setSelectedSuggestionIndex(-1)
              generateHeaderSuggestions(searchInput.value, suggestionsDropdown, -1)
            } else {
              generateHeaderSuggestions(searchInput.value, suggestionsDropdown)
            }
          }
        }
        
        // Blur handler
        const handleBlur = () => {
          setTimeout(() => {
            setShowSuggestions(false)
            selectedIndexRef.current = -1 // Reset selection when hiding dropdown
            setSelectedSuggestionIndex(-1)
            suggestionsDropdown.classList.add('hidden')
          }, 200)
        }
        
        // Reset suggestion index handler
        const handleResetSuggestionIndex = () => {
          selectedIndexRef.current = -1
          setSelectedSuggestionIndex(-1)
        }
        
        // Add event listeners
        searchInput.addEventListener('input', handleInputChange)
        searchInput.addEventListener('keydown', handleKeyDown)
        searchInput.addEventListener('focus', handleFocus)
        searchInput.addEventListener('blur', handleBlur)
        searchButton.addEventListener('click', handleSearchClick)
        window.addEventListener('resetSuggestionIndex', handleResetSuggestionIndex)
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
  }, []) // Removed searchTerm dependency to prevent re-creating the input

  // Separate useEffect to update the input value without recreating the element
  useEffect(() => {
    const searchInput = document.getElementById('header-search-input') as HTMLInputElement
    if (searchInput && searchInput.value !== searchTerm) {
      searchInput.value = searchTerm
    }
  }, [searchTerm])

  // Enhanced suggestion system with popular destinations and activities
  const generateHeaderSuggestions = (query: string, dropdownElement: HTMLElement, forceSelectedIndex?: number) => {
    const currentSelectedIndex = forceSelectedIndex !== undefined ? forceSelectedIndex : selectedSuggestionIndex
    if (!query.trim() || query.length < 1) {
      dropdownElement.classList.add('hidden')
      return
    }

    const searchQuery = query.toLowerCase()
    type SuggestionType = {text: string, type: 'destination' | 'activity' | 'pack' | 'city' | 'country', context: string}
    const allSuggestions: SuggestionType[] = []
    
    // Popular destinations worldwide (simulating regional relevance)
    const popularDestinations = [
      // Europe
      'Amsterdam, Netherlands', 'Athens, Greece', 'Barcelona, Spain', 'Berlin, Germany', 'Budapest, Hungary',
      'Copenhagen, Denmark', 'Dublin, Ireland', 'Edinburgh, Scotland', 'Florence, Italy', 'Geneva, Switzerland',
      'Lisbon, Portugal', 'London, England', 'Madrid, Spain', 'Munich, Germany', 'Paris, France',
      'Prague, Czech Republic', 'Rome, Italy', 'Stockholm, Sweden', 'Vienna, Austria', 'Zurich, Switzerland',
      
      // Asia
      'Bangkok, Thailand', 'Beijing, China', 'Delhi, India', 'Hong Kong', 'Jakarta, Indonesia',
      'Kuala Lumpur, Malaysia', 'Mumbai, India', 'Seoul, South Korea', 'Shanghai, China', 'Singapore',
      'Tokyo, Japan', 'Osaka, Japan', 'Manila, Philippines', 'Ho Chi Minh City, Vietnam', 'Taipei, Taiwan',
      
      // Americas
      'Buenos Aires, Argentina', 'Chicago, USA', 'Los Angeles, USA', 'Mexico City, Mexico', 'Montreal, Canada',
      'New York, USA', 'San Francisco, USA', 'São Paulo, Brazil', 'Toronto, Canada', 'Vancouver, Canada',
      'Miami, USA', 'Las Vegas, USA', 'Rio de Janeiro, Brazil', 'Lima, Peru', 'Bogotá, Colombia',
      
      // Africa & Middle East
      'Cairo, Egypt', 'Cape Town, South Africa', 'Dubai, UAE', 'Istanbul, Turkey', 'Johannesburg, South Africa',
      'Marrakech, Morocco', 'Tel Aviv, Israel', 'Casablanca, Morocco', 'Nairobi, Kenya', 'Lagos, Nigeria',
      
      // Oceania
      'Auckland, New Zealand', 'Melbourne, Australia', 'Sydney, Australia', 'Wellington, New Zealand'
    ]

    // Popular activities and experiences
    const popularActivities = [
      'Art galleries and museums', 'Beach and coastal areas', 'Cafes and coffee shops', 'Cultural experiences',
      'Food markets and street food', 'Historical landmarks', 'Local neighborhoods', 'Music and nightlife',
      'Nature and parks', 'Photography spots', 'Rooftop bars and views', 'Shopping districts',
      'Adventure activities', 'Architectural tours', 'Brewery and wine tours', 'Cooking classes',
      'Day trips and excursions', 'Family-friendly activities', 'Festivals and events', 'Gardens and botanical areas',
      'Hidden gems and local secrets', 'Hiking and outdoor activities', 'Markets and bazaars', 'Spa and wellness',
      'Sports and recreation', 'Street art and murals', 'Sunset and sunrise spots', 'Traditional crafts',
      'Underground and alternative scenes', 'Vintage and antique shopping', 'Walking tours', 'Waterfront activities'
    ]

    // Countries for broader search
    const countries = [
      'Albania', 'Argentina', 'Australia', 'Austria', 'Belgium', 'Brazil', 'Bulgaria', 'Canada', 'Chile',
      'China', 'Colombia', 'Croatia', 'Czech Republic', 'Denmark', 'Egypt', 'England', 'Estonia', 'Finland',
      'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Ireland', 'Israel', 'Italy',
      'Japan', 'Kenya', 'Latvia', 'Lithuania', 'Malaysia', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand',
      'Norway', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Romania', 'Scotland', 'Singapore', 'Slovakia',
      'Slovenia', 'South Africa', 'South Korea', 'Spain', 'Sweden', 'Switzerland', 'Taiwan', 'Thailand',
      'Turkey', 'Ukraine', 'United States', 'Vietnam', 'Wales'
    ]

    // Add matching destinations (split into cities)
    popularDestinations.forEach(destination => {
      if (destination.toLowerCase().includes(searchQuery)) {
        const [city, country] = destination.split(', ')
        // Add the city with country context
        allSuggestions.push({ text: city, type: 'city', context: country })
      }
    })

    // Add matching activities
    popularActivities.forEach(activity => {
      if (activity.toLowerCase().includes(searchQuery)) {
        allSuggestions.push({ text: activity, type: 'activity', context: '' })
      }
    })

    // Add matching countries
    countries.forEach(country => {
      if (country.toLowerCase().includes(searchQuery)) {
        allSuggestions.push({ text: country, type: 'country', context: '' })
      }
    })

    // Add suggestions from existing pin pack data
    pinPacks.forEach(pack => {
      // Add pack titles
      if (pack.title.toLowerCase().includes(searchQuery)) {
        allSuggestions.push({ text: pack.title, type: 'pack', context: '' })
      }
      // Add cities from packs
      if (pack.city.toLowerCase().includes(searchQuery)) {
        allSuggestions.push({ text: pack.city, type: 'city', context: pack.country })
      }
      // Add countries from packs  
      if (pack.country.toLowerCase().includes(searchQuery)) {
        allSuggestions.push({ text: pack.country, type: 'country', context: '' })
      }
    })

    // Remove duplicates and sort by relevance
    const uniqueSuggestions = Array.from(
      new Map(allSuggestions.map(item => [item.text, item])).values()
    )

    // Sort suggestions by relevance (exact matches first, then starts with, then contains)
    const sortedSuggestions = uniqueSuggestions.sort((a, b) => {
      const aText = a.text.toLowerCase()
      const bText = b.text.toLowerCase()
      
      // Exact match
      if (aText === searchQuery) return -1
      if (bText === searchQuery) return 1
      
      // Starts with
      if (aText.startsWith(searchQuery) && !bText.startsWith(searchQuery)) return -1
      if (bText.startsWith(searchQuery) && !aText.startsWith(searchQuery)) return 1
      
      // Prioritize cities and countries over activities and packs
      const priorityOrder: Record<string, number> = { 'city': 1, 'country': 2, 'pack': 3, 'activity': 4, 'destination': 5 }
      const aPriority = priorityOrder[a.type] || 5
      const bPriority = priorityOrder[b.type] || 5
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      return 0
    }).slice(0, 5) // Limit to 5 suggestions
    
    if (sortedSuggestions.length > 0) {
      dropdownElement.innerHTML = sortedSuggestions.map((suggestion, index) => {
        // Check if this suggestion is currently selected via keyboard
        const isSelected = currentSelectedIndex === index
        // Debug: Log suggestion rendering
        if (index === 0) console.log('🔍 Rendering suggestions with selectedIndex:', currentSelectedIndex)
        
        const icon = suggestion.type === 'destination' || suggestion.type === 'city' ? 
          `<svg class="h-3 w-3 text-gray-400 group-hover:text-gray-600 mr-3 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>` :
          suggestion.type === 'activity' ?
          `<svg class="h-3 w-3 text-gray-400 group-hover:text-gray-600 mr-3 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>` :
          suggestion.type === 'country' ?
          `<svg class="h-3 w-3 text-gray-400 group-hover:text-gray-600 mr-3 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>` :
          `<svg class="h-3 w-3 text-gray-400 group-hover:text-gray-600 mr-3 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>`

        const typeLabel = suggestion.type === 'city' && suggestion.context ? `City in ${suggestion.context}` :
                         suggestion.type === 'country' ? 'Country' :
                         suggestion.type === 'activity' ? 'Activity' :
                         suggestion.type === 'pack' ? 'Pin Pack' : 'Destination'

        // Add keyboard selection styling
        const baseClasses = "w-full text-left px-4 py-3 transition-all duration-200 first:rounded-t-xl last:rounded-b-xl group"
        const selectionClasses = isSelected 
          ? "bg-gray-100 shadow-sm" 
          : "hover:bg-gray-50 hover:shadow-sm"

        return `
          <button
            class="${baseClasses} ${selectionClasses}"
            onclick="document.getElementById('header-search-input').value='${suggestion.text.replace(/'/g, "\\'")}'; this.parentElement.classList.add('hidden'); window.dispatchEvent(new CustomEvent('headerSuggestionClick', {detail: '${suggestion.text.replace(/'/g, "\\'")}'})); window.dispatchEvent(new CustomEvent('resetSuggestionIndex'));"
          >
            <div class="flex items-center">
              ${icon}
              <div class="flex flex-col">
                <span class="text-sm text-gray-700 transition-colors">${suggestion.text}</span>
                <span class="text-xs text-gray-400 transition-colors">${typeLabel}</span>
              </div>
            </div>
          </button>
        `
      }).join('')
      dropdownElement.classList.remove('hidden')
    } else {
      dropdownElement.classList.add('hidden')
    }
  }

  // Listen for header suggestion clicks
  useEffect(() => {
    const handleHeaderSuggestionClick = (e: CustomEvent) => {
      setSearchTerm(e.detail)
      setActiveSearchTerm(e.detail) // Set the active search term for filtering
      setSelectedSuggestionIndex(-1) // Reset selection after choosing
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

  // Enhanced filter and sorting logic - only runs when user has searched or other filters change
  useEffect(() => {
    let filtered = pinPacks

    // Only apply search term filter if user has explicitly searched
    if (activeSearchTerm) {
      const searchLower = activeSearchTerm.toLowerCase()
      filtered = filtered.filter(pack => {
        // Check if it's a combined "City, Country" search
        if (searchLower.includes(',')) {
          const [cityPart, countryPart] = searchLower.split(',').map(s => s.trim())
          return (
            (pack.city.toLowerCase().includes(cityPart) || cityPart.includes(pack.city.toLowerCase())) &&
            (pack.country.toLowerCase().includes(countryPart) || countryPart.includes(pack.country.toLowerCase()))
          )
        }
        
        // Regular search across all fields
        return (
          pack.title.toLowerCase().includes(searchLower) ||
          pack.description.toLowerCase().includes(searchLower) ||
          pack.city.toLowerCase().includes(searchLower) ||
          pack.country.toLowerCase().includes(searchLower)
        )
      })
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
  }, [pinPacks, activeSearchTerm, starRatingFilter, pinCountFilter, categoryFilter, sortBy])

  // Function to fetch pin packs from Supabase database
  const loadPinPacks = async () => {
    try {
      setLoading(true)
      
      // First get all pin packs
      const { data: packData, error: packError } = await supabase
        .from('pin_packs')
        .select('*')
        .order('created_at', { ascending: false })

      if (packError) throw packError

      // For each pack, get the first available photo from its pins
      const packsWithPhotos = await Promise.all(
        (packData || []).map(async (pack) => {
          try {
            // Get first pin with photos for this pack
            const { data: pinData, error: pinError } = await supabase
              .from('pin_pack_pins')
              .select(`
                pins (
                  photos
                )
              `)
              .eq('pin_pack_id', pack.id)
              .limit(10) // Get up to 10 pins to check for photos

            if (!pinError && pinData) {
              // Find first pin that has photos
              const pinWithPhoto = pinData.find((item: any) => {
                const pin = item.pins as any
                return pin?.photos && Array.isArray(pin.photos) && pin.photos.length > 0
              })
              
              if (pinWithPhoto) {
                const pin = pinWithPhoto.pins as any
                return {
                  ...pack,
                  coverPhoto: pin.photos[0] // Add first photo as cover
                }
              }
            }
          } catch (error) {
            console.warn('Error loading photos for pack:', pack.id, error)
          }
          
          return {
            ...pack,
            coverPhoto: null // No photos found
          }
        })
      )

      setPinPacks(packsWithPhotos)
      setFilteredPacks(packsWithPhotos)
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

  // Function to toggle wishlist (add or remove) - protected action
  const toggleWishlist = (pack: PinPack) => {
    handleProtectedAction(() => {
      if (wishlistItems.includes(pack.id)) {
        removeFromWishlist(pack.id)
      } else {
        addToWishlist(pack)
      }
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setActiveSearchTerm('') // Also clear the active search term
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

  // PayPal success handler - shows falling pins modal
  const handlePayPalSuccess = async (orderData: any) => {
    try {
      console.log('PayPal payment successful:', orderData)
      
      if (addedPack) {
        // Create order in database (same API call as cart page)
        const createOrderResponse = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cartItems: [{
              id: addedPack.id,
              title: addedPack.title,
              price: parseFloat(addedPack.price),
              city: addedPack.city,
              country: addedPack.country,
              pin_count: parseInt(addedPack.pin_count)
            }],
            totalAmount: parseFloat(addedPack.price),
            processingFee: 0.50,
            userLocation: 'Unknown',
            userIp: 'Unknown'
          })
        })

        if (createOrderResponse.ok) {
          const { order } = await createOrderResponse.json()

          // Complete the order with PayPal details
          const completeOrderResponse = await fetch('/api/orders/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: order.id,
              paypalOrderId: orderData.orderID,
              paypalPayerId: orderData.payerID,
              paypalPaymentId: orderData.details?.id,
              customerEmail: orderData.details?.payer?.email_address,
              customerName: (orderData.details?.payer?.name?.given_name || '') + ' ' + 
                          (orderData.details?.payer?.name?.surname || ''),
              paymentDetails: orderData.details
            })
          })

          if (completeOrderResponse.ok) {
            // Remove from cart since it's now purchased
            const existingCart = JSON.parse(localStorage.getItem('pinpacks_cart') || '[]')
            const updatedCart = existingCart.filter((item: any) => item.id !== addedPack.id)
            localStorage.setItem('pinpacks_cart', JSON.stringify(updatedCart))
            
            // Close all modals and show falling pins success animation
            setShowPayPalModal(false)
            setCartSuccess(false)
            setPurchasedPacksCount(1)
            setShowSuccessModal(true)
          }
        }
      }
    } catch (error) {
      console.error('Error handling PayPal success:', error)
    }
  }

  // PayPal success handler for cart banner checkout
  const handleCartBannerCheckout = async () => {
    if (!addedPack) return
    
    try {
      // Same PayPal logic but for cart banner flow
      setShowPayPalModal(true)
    } catch (error) {
      console.error('Error with cart banner checkout:', error)
    }
  }

  // PayPal error handler
  const handlePayPalError = (error: any) => {
    console.error('PayPal payment error:', error)
    setShowPayPalModal(false)
    alert('Payment failed. Please try again.')
  }

  // Payment success modal handlers
  const handleViewPacks = () => {
    window.location.href = '/pinventory'
  }

  const handleKeepBrowsing = () => {
    setShowSuccessModal(false)
    setPurchasedPacksCount(0)
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
                    <span className="ml-2 text-coral-600 font-medium">• Type and press search to filter results</span>
                  )}
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

      {/* Cart Success Banner - GetYourGuide style */}
      {cartSuccess && addedPack && (
        <div className="bg-green-50 border-l-4 border-green-400 shadow-sm">
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
                    {/* Map-style background like pack cards but smaller */}
                    <img 
                      src="/google-maps-bg.svg"
                      alt="Pack thumbnail"
                      className="w-full h-full object-cover"
                    />
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
                {/* Pack cover image or Google Maps background */}
                <div className="relative h-64 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 overflow-hidden">
                  {/* Inner container that scales - maintains boundaries */}
                  <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-300 ease-out">
                    {/* Display actual photo if available, otherwise Google Maps background */}
                    {pack.coverPhoto ? (
                      <img 
                        src={`${pack.coverPhoto}`}
                        alt={`${pack.title} cover`}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ aspectRatio: '4/3' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/google-maps-bg.svg";
                        }}
                      />
                    ) : (
                      <img 
                        src="/google-maps-bg.svg"
                        alt="Map background"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ aspectRatio: '4/3' }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  </div>
                  
                  {/* Heart icon - Add to wishlist */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation() // Prevent card click when clicking heart
                      if (isAuthenticated) {
                        toggleWishlist(pack)
                      } else {
                        setShowLoginModal(true)
                      }
                    }}
                    className="absolute top-3 right-3 w-8 h-8 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors group shadow-sm"
                  >
                    <Heart 
                      className={`h-4 w-4 transition-colors ${
                        isAuthenticated && wishlistItems.includes(pack.id) 
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
                    src="/google-maps-bg.svg"
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
                  processingFee={0.50} // Small processing fee
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
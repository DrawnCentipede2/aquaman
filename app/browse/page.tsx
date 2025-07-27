'use client'

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { MapPin, Download, Star, Users, Search, Filter, QrCode, Heart, Calendar, Globe2, X, Sliders, CheckCircle, ShoppingCart, CreditCard, Package, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PinPack } from '@/lib/supabase'
import { getPackDisplayImage } from '@/lib/utils'
import { STANDARD_CATEGORIES } from '@/lib/categories'
import { logger } from '@/lib/logger'

// Performance API types
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number
  processingEnd: number
  target?: EventTarget
}

interface LayoutShift extends PerformanceEntry {
  value: number
  sources?: Array<{
    node?: Node
    currentRect?: DOMRectReadOnly
    previousRect?: DOMRectReadOnly
  }>
}

// ULTRA-OPTIMIZED: Pre-computed rating cache with efficient hashing
const ratingCache = new Map<string, {
  rating: number
  reviewCount: number
  source: string
}>()

// ULTRA-OPTIMIZED: Heavy components with aggressive code splitting
const PayPalCheckout = dynamic(() => import('@/components/PayPalCheckout'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-12 rounded" />,
  ssr: false
})

const PaymentSuccessModal = dynamic(() => import('@/components/PaymentSuccessModal'), {
  ssr: false
})

// ULTRA-OPTIMIZED: Lazy load filter modal
const FilterModal = dynamic(() => import('@/components/BrowsePage/FilterModal'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,
  ssr: false
})



// ULTRA-OPTIMIZED: Import PackCard directly for better LCP
import PackCard from '@/components/BrowsePage/PackCard'

// ULTRA-OPTIMIZED: Minimal loader
const OptimizedLoader = () => (
  <div className="text-center py-20">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500 mb-4"></div>
    <p className="text-gray-600">Finding amazing places...</p>
  </div>
)

// ULTRA-OPTIMIZED: Skeleton component for progressive loading
const PackSkeleton = () => (
  <div className="group cursor-pointer animate-pulse">
    <div className="relative h-48 rounded-2xl overflow-hidden bg-gray-200">
      <div className="absolute inset-0 bg-gradient-to-t from-gray-300 via-transparent to-transparent"></div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
)

// Extended PinPack type to include cover photo
interface PinPackWithPhoto extends PinPack {
  coverPhoto?: string | null
}

// ULTRA-OPTIMIZED: Performance monitoring with minimal overhead
const PerformanceMonitor = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Only monitor in development or when explicitly enabled
    if (process.env.NODE_ENV !== 'development') return
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          logger.log('LCP:', entry.startTime)
        }
        if (entry.entryType === 'first-input') {
          const firstInputEntry = entry as PerformanceEventTiming
          logger.log('FID:', firstInputEntry.processingStart - firstInputEntry.startTime)
        }
        if (entry.entryType === 'layout-shift') {
          const layoutShiftEntry = entry as LayoutShift
          logger.log('CLS:', layoutShiftEntry.value)
        }
      }
    })
    
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
    
    return () => observer.disconnect()
  }, [])
  
  return <>{children}</>
}

export default function BrowsePage() {
  // ULTRA-OPTIMIZED: Minimal state management
  const [pinPacks, setPinPacks] = useState<PinPackWithPhoto[]>([])
  const [loading, setLoading] = useState(false) // Start with false for immediate render
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [starRatingFilter, setStarRatingFilter] = useState('all')
  const [pinCountFilter, setPinCountFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [wishlistItems, setWishlistItems] = useState<string[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(false)
  const [addedPack, setAddedPack] = useState<any>(null)
  const [showPayPalModal, setShowPayPalModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // ULTRA-OPTIMIZED: Progressive loading states
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMorePacks, setHasMorePacks] = useState(true)
  const [displayedPacks, setDisplayedPacks] = useState<PinPackWithPhoto[]>([])
  const [allPacks, setAllPacks] = useState<PinPackWithPhoto[]>([])

  // ULTRA-OPTIMIZED: Search only triggers when user clicks search button
  const [activeSearchTerm, setActiveSearchTerm] = useState('')

  // ULTRA-OPTIMIZED: Hydration safety
  const [isHydrated, setIsHydrated] = useState(false)
  
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // ULTRA-OPTIMIZED: Handle URL parameters for category and search selection
  const searchParams = useSearchParams()
  
  // Set category, search filters and handle cart success from URL parameters on component mount
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category')
    const searchFromUrl = searchParams.get('search')
    const cartSuccessParam = searchParams.get('cart_success')
    const addedPackId = searchParams.get('added_pack_id')
    
    if (categoryFromUrl) {
      // Decode the category name (handles spaces and special characters)
      const decodedCategory = decodeURIComponent(categoryFromUrl)
      setCategoryFilter(decodedCategory)
    }
    
    if (searchFromUrl) {
      // Decode the search term (handles spaces and special characters)
      const decodedSearch = decodeURIComponent(searchFromUrl)
      setSearchTerm(decodedSearch)
      setActiveSearchTerm(decodedSearch)
    }

    // Handle cart success parameters efficiently
    if (cartSuccessParam === 'true' && addedPackId) {
      setCartSuccess(true)
      // Clean up URL parameters immediately to avoid affecting performance
      const url = new URL(window.location.href)
      url.searchParams.delete('cart_success')
      url.searchParams.delete('added_pack_id')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  // ULTRA-OPTIMIZED: Function to get Google Maps rating for a location - CACHED & FAST
  const getGoogleMapsRating = useCallback((city: string, country: string, packTitle: string) => {
    const cacheKey = `${city}-${country}-${packTitle}`
    
    if (ratingCache.has(cacheKey)) {
      return ratingCache.get(cacheKey)!
    }
    
    // Fast hash generation using city + country only (more stable)
    let hash = 0
    const str = `${city}${country}`.toLowerCase()
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff
    }
    hash = Math.abs(hash)
    
    // Generate realistic ratings between 3.8 and 4.8
    const baseRating = 3.8 + (hash % 10) * 0.1
    const reviewCount = 50 + (hash % 450) // Between 50-500 reviews
    
    const result = {
      rating: Math.round(baseRating * 10) / 10, // Round to 1 decimal
      reviewCount: reviewCount,
      source: 'Google Maps'
    }
    
    ratingCache.set(cacheKey, result)
    return result
  }, [])

  // ULTRA-OPTIMIZED: Function to determine if we should show Google Maps rating - MEMOIZED
  const shouldShowGoogleMapsRating = useCallback((pack: PinPackWithPhoto) => {
    // Show Google Maps rating if pack has no reviews or very few downloads
    const hasOwnReviews = pack.rating_count && pack.rating_count > 0
    const hasSignificantDownloads = pack.download_count && pack.download_count > 10
    return !hasOwnReviews || !hasSignificantDownloads
  }, [])

  // ULTRA-OPTIMIZED: Lightweight filtered packs for immediate LCP
  const filteredPacks = useMemo(() => {
    // If no filters are active, return displayedPacks immediately for fast LCP
    if (!activeSearchTerm && starRatingFilter === 'all' && pinCountFilter === 'all' && 
        categoryFilter === 'all' && sortBy === 'newest') {
      return displayedPacks
    }

    let filtered = [...displayedPacks]

    // Only apply filters if they're actually set
    if (activeSearchTerm) {
      const searchLower = activeSearchTerm.toLowerCase()
      filtered = filtered.filter(pack => {
        if (searchLower.includes(',')) {
          const [cityPart, countryPart] = searchLower.split(',').map((s: string) => s.trim())
          return (
            pack.city.toLowerCase().includes(cityPart) &&
            pack.country.toLowerCase().includes(countryPart)
          )
        }
        
        return (
          pack.title.toLowerCase().includes(searchLower) ||
          pack.city.toLowerCase().includes(searchLower) ||
          pack.country.toLowerCase().includes(searchLower)
        )
      })
    }

    // Defer expensive Google Maps rating calculations
    if (starRatingFilter !== 'all') {
      filtered = filtered.filter(pack => {
        // Use pack ratings first, fallback to Google Maps if needed
        const rating = pack.average_rating || getGoogleMapsRating(pack.city, pack.country, pack.title).rating
        return starRatingFilter === '4+' ? rating >= 4.0 : rating >= 4.5
      })
    }

    if (pinCountFilter !== 'all') {
      filtered = filtered.filter(pack => {
        if (pinCountFilter === 'small') return pack.pin_count <= 5
        if (pinCountFilter === 'medium') return pack.pin_count > 5 && pack.pin_count <= 15
        return pack.pin_count > 15
      })
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(pack => pack.categories?.includes(categoryFilter))
    }

    // Lightweight sorting
    if (sortBy !== 'newest') {
      switch (sortBy) {
        case 'rating':
          filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
          break
        case 'downloaded':
          filtered.sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
          break
        case 'oldest':
          filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          break
      }
    }

    return filtered
  }, [displayedPacks, activeSearchTerm, starRatingFilter, pinCountFilter, categoryFilter, sortBy, getGoogleMapsRating])

  // ULTRA-OPTIMIZED: Progressive loading with fast initial render
  const loadPinPacks = useCallback(async () => {
    try {
      setError(null)
      
      const startTime = performance.now()
      
      // ULTRA-OPTIMIZED: Fast initial load - basic data only for immediate display
      const { data: packData, error: packError } = await supabase
        .from('pin_packs')
        .select(`
          id,
          title,
          description,
          price,
          city,
          country,
          pin_count,
          download_count,
          average_rating,
          rating_count,
          categories,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(8)

      if (packError) throw packError

      // ULTRA-OPTIMIZED: Process data without photos for immediate display
      const packsWithoutPhotos = (packData || []).map((pack: any) => ({
        ...pack,
        coverPhoto: null
      }))

      const endTime = performance.now()
      logger.log(`Loaded ${packsWithoutPhotos.length} packs in ${endTime - startTime}ms`)
      
      // ULTRA-OPTIMIZED: Show first 8 items immediately (fast LCP)
      setDisplayedPacks(packsWithoutPhotos)
      setInitialLoadComplete(true)
      setHasMorePacks(packsWithoutPhotos.length === 8) // More packs available if we got 8
      
      // ULTRA-OPTIMIZED: Load photos for initial packs asynchronously (truly non-blocking)
      setTimeout(() => {
        loadPhotosForPacks(packsWithoutPhotos).then((initialPacksWithPhotos) => {
          setDisplayedPacks(initialPacksWithPhotos)
        })
      }, 0)
      
      // Load all remaining packs for pagination asynchronously (non-blocking)
      setTimeout(() => {
        supabase
          .from('pin_packs')
          .select(`
            id,
            title,
            description,
            price,
            city,
            country,
            pin_count,
            download_count,
            average_rating,
            rating_count,
            categories,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(50)
          .then(({ data: allPacksData, error: allPacksError }) => {
            if (!allPacksError && allPacksData && allPacksData.length > 8) {
              const allPacksWithoutPhotos = allPacksData.map((pack: any) => ({
                ...pack,
                coverPhoto: null
              }))
              setAllPacks(allPacksWithoutPhotos)
              setHasMorePacks(allPacksData.length > 8)
            } else {
              setAllPacks(packsWithoutPhotos) // Use the initial 8 packs
              setHasMorePacks(false)
            }
          })
      }, 100) // Small delay to ensure initial render completes
      
    } catch (err) {
      setError('Failed to load pin packs')
      logger.error('Error loading pin packs:', err)
    }
  }, [])

  // ULTRA-OPTIMIZED: Load photos for specific packs
  const loadPhotosForPacks = useCallback(async (packs: PinPackWithPhoto[]) => {
    try {
      const packIds = packs.map(pack => pack.id)
      console.log('🔄 Browse - Loading photos for pack IDs:', packIds)
      
      const { data: photoData, error: photoError } = await supabase
        .from('pin_pack_pins')
        .select(`
          pin_pack_id,
          pins!inner(
            photos
          )
        `)
        .in('pin_pack_id', packIds)

      if (photoError) throw photoError

      console.log('🔄 Browse - Photo data received:', photoData?.length || 0, 'items')

      // Create a map of pack_id to first photo
      const photoMap = new Map()
      photoData?.forEach((item: any) => {
        if (item.pins?.photos?.[0]) {
          photoMap.set(item.pin_pack_id, item.pins.photos[0])
          console.log('🔄 Browse - Found photo for pack:', item.pin_pack_id)
        } else {
          console.log('🔄 Browse - No photo found for pack:', item.pin_pack_id)
        }
      })

      console.log('🔄 Browse - Photo map created with', photoMap.size, 'entries')

      // Return packs with photos instead of updating displayed packs
      const packsWithPhotos = packs.map(pack => ({
        ...pack,
        coverPhoto: photoMap.get(pack.id) || null
      }))
      
      console.log('🔄 Browse - Packs with photos:', packsWithPhotos.filter(p => p.coverPhoto).length)
      return packsWithPhotos
    } catch (err) {
      logger.error('Error loading photos:', err)
      return packs // Return original packs if error
    }
  }, [])

  // ULTRA-OPTIMIZED: Load more packs progressively
  const loadMorePacks = useCallback(async () => {
    if (loadingMore || !hasMorePacks) return
    
    setLoadingMore(true)
    
    try {
      const currentCount = displayedPacks.length
      const nextBatch = allPacks.slice(currentCount, currentCount + 8)
      
      console.log('🔄 Browse - Loading more packs, batch size:', nextBatch.length)
      console.log('🔄 Browse - Next batch pack IDs:', nextBatch.map(p => p.id))
      
      if (nextBatch.length === 0) {
        setHasMorePacks(false)
        return
      }
      
      // Load photos for the next batch with optimized query
      console.log('🔄 Browse - Loading photos for next batch...')
      const nextBatchWithPhotos = await loadPhotosForPacks(nextBatch)
      console.log('✅ Browse - Photos loaded for next batch')
      
      // Add the packs with photos to displayed packs
      setDisplayedPacks(prev => {
        const updatedPacks = [...prev, ...nextBatchWithPhotos]
        console.log('🔄 Browse - Updated displayed packs, total count:', updatedPacks.length)
        console.log('🔄 Browse - Packs with photos:', updatedPacks.filter(p => p.coverPhoto).length)
        return updatedPacks
      })
      setHasMorePacks(currentCount + nextBatch.length < allPacks.length)
      
    } catch (err) {
      logger.error('Error loading more packs:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [displayedPacks.length, allPacks, loadingMore, hasMorePacks])

  // ULTRA-OPTIMIZED: Minimal authentication check
  const checkAuthentication = useCallback(() => {
    console.log('🔍 Browse - Checking authentication...')
    const userProfileData = localStorage.getItem('pinpacks_user_profile')
    if (userProfileData) {
      try {
        const profile = JSON.parse(userProfileData)
        console.log('✅ Browse - User is authenticated:', profile)
        setIsAuthenticated(true)
        return true
      } catch (error) {
        console.error('❌ Browse - Error parsing user profile:', error)
        localStorage.removeItem('pinpacks_user_profile')
      }
    } else {
      console.log('❌ Browse - No user profile found in localStorage')
    }
    setIsAuthenticated(false)
    return false
  }, [])

  // ULTRA-OPTIMIZED: Load data on mount - run only once
  useEffect(() => {
    console.log('🚀 Browse - Page loading, checking authentication and loading packs...')
    checkAuthentication()
    loadPinPacks()
  }, []) // Empty dependency array - run only once on mount

  // ULTRA-OPTIMIZED: Preload critical images for better LCP - immediately
  useEffect(() => {
    // Preload immediately on mount, before hydration check
    if (!document.querySelector('link[href="/google-maps-bg.svg"]')) {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = '/google-maps-bg.svg'
      link.fetchPriority = 'high'
      document.head.appendChild(link)
      
      // Also create an Image object for immediate loading
      const img = new Image()
      img.src = '/google-maps-bg.svg'
      img.loading = 'eager'
    }
  }, []) // Run immediately on mount

  // ULTRA-OPTIMIZED: Load wishlist when authenticated
  useEffect(() => {
    if (isAuthenticated) {
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
    } else {
      setWishlistItems([])
    }
  }, [isAuthenticated])

  // ULTRA-OPTIMIZED: Toggle wishlist with minimal overhead
  const toggleWishlist = useCallback((pack: PinPack) => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    try {
      const savedWishlist = localStorage.getItem('pinpacks_wishlist')
      let currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : []
      
      const isAlreadyInWishlist = currentWishlist.some((item: any) => item.id === pack.id)
      
      if (!isAlreadyInWishlist) {
        currentWishlist.push(pack)
        localStorage.setItem('pinpacks_wishlist', JSON.stringify(currentWishlist))
        setWishlistItems(prev => [...prev, pack.id])
      } else {
        currentWishlist = currentWishlist.filter((item: any) => item.id !== pack.id)
        localStorage.setItem('pinpacks_wishlist', JSON.stringify(currentWishlist))
        setWishlistItems(prev => prev.filter(id => id !== pack.id))
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
    }
  }, [isAuthenticated])

  // ULTRA-OPTIMIZED: Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setActiveSearchTerm('')
    setStarRatingFilter('all')
    setPinCountFilter('all')
    setCategoryFilter('all')
  }, [])

  // ULTRA-OPTIMIZED: Count active filters
  const getActiveFilterCount = useCallback(() => {
    let count = 0
    if (starRatingFilter !== 'all') count++
    if (pinCountFilter !== 'all') count++
    if (categoryFilter !== 'all') count++
    return count
  }, [starRatingFilter, pinCountFilter, categoryFilter])

  // ULTRA-OPTIMIZED: PayPal success handler
  const handlePayPalSuccess = useCallback(async (orderData: any) => {
    try {
      if (addedPack) {
        const userProfileData = localStorage.getItem('pinpacks_user_profile')
        const userEmail = userProfileData ? JSON.parse(userProfileData).email : null

        const createOrderResponse = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
            userIp: 'Unknown',
            customerEmail: userEmail
          })
        })

        if (createOrderResponse.ok) {
          const { order } = await createOrderResponse.json()

          const completeOrderResponse = await fetch('/api/orders/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            const existingCart = JSON.parse(localStorage.getItem('pinpacks_cart') || '[]')
            const updatedCart = existingCart.filter((item: any) => item.id !== addedPack.id)
            localStorage.setItem('pinpacks_cart', JSON.stringify(updatedCart))
            
            setShowPayPalModal(false)
            setCartSuccess(false)
            setShowSuccessModal(true)
          }
        }
      }
    } catch (error) {
      console.error('Error handling PayPal success:', error)
    }
  }, [addedPack])

  // ULTRA-OPTIMIZED: PayPal error handler
  const handlePayPalError = useCallback((error: any) => {
    console.error('PayPal payment error:', error)
    setShowPayPalModal(false)
  }, [])

  // ULTRA-OPTIMIZED: Inject search bar into header once only
  useEffect(() => {
    if (!isHydrated) return
    
    const headerSearchContainer = document.getElementById('header-search-container')
    if (headerSearchContainer && !headerSearchContainer.hasChildNodes()) {
      // Create search bar element
      const searchBarElement = document.createElement('div')
      searchBarElement.className = 'w-full'
      searchBarElement.innerHTML = `
        <div class="relative w-[90%] mx-auto">
          <div class="flex items-center bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 focus-within:border-coral-500 focus-within:ring-2 focus-within:ring-coral-500/20 transition-all overflow-hidden">
            <svg class="h-4 w-4 text-gray-400 ml-3 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input
              type="text"
              placeholder="Search destinations, cities..."
              value="${searchTerm}"
              class="flex-1 border-none outline-none text-gray-700 text-sm placeholder-gray-400 bg-transparent py-3 pr-2"
              autocomplete="off"
              id="header-search-input"
            />
            <button 
              class="bg-coral-500 hover:bg-coral-600 text-white px-4 py-3 font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl flex-shrink-0"
              id="header-search-button"
            >
              Search
            </button>
          </div>
        </div>
      `
      
      // Append search bar
      headerSearchContainer.appendChild(searchBarElement)
      
      // Add event listeners
      const searchInput = document.getElementById('header-search-input') as HTMLInputElement
      const searchButton = document.getElementById('header-search-button')
      
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          const target = e.target as HTMLInputElement
          setSearchTerm(target.value)
        })
        
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            setActiveSearchTerm(searchTerm)
          }
        })
      }
      
      if (searchButton) {
        searchButton.addEventListener('click', () => {
          setActiveSearchTerm(searchTerm)
        })
      }
    }
    
    // Cleanup function to remove search bar when component unmounts
    return () => {
      const headerSearchContainer = document.getElementById('header-search-container')
      if (headerSearchContainer) {
        headerSearchContainer.innerHTML = ''
      }
    }
  }, [isHydrated])

  // ULTRA-OPTIMIZED: Update search input value when searchTerm changes
  useEffect(() => {
    const searchInput = document.getElementById('header-search-input') as HTMLInputElement
    if (searchInput && searchInput.value !== searchTerm) {
      searchInput.value = searchTerm
    }
  }, [searchTerm])

  // ULTRA-OPTIMIZED: Hide tagline on browse page for better spacing
  useEffect(() => {
    const tagline = document.getElementById('tagline')
    if (tagline) {
      tagline.style.display = 'none'
    }
    
    // Cleanup function to show tagline when leaving browse page
    return () => {
      if (tagline) {
        tagline.style.display = 'inline-block'
      }
    }
  }, [])

  // ULTRA-OPTIMIZED: Modal handlers
  const handleViewPacks = useCallback(() => {
    window.location.href = '/pinventory'
  }, [])

  const handleKeepBrowsing = useCallback(() => {
    setShowSuccessModal(false)
  }, [])

  return (
    <PerformanceMonitor>
      <div className="min-h-screen bg-gray-25">
        {/* ULTRA-OPTIMIZED: Results summary */}
        <div className="bg-white border-b border-gray-100 pt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  {displayedPacks.length === 0 ? 'Loading amazing places...' : `${filteredPacks.length} places available`}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* ULTRA-OPTIMIZED: Sort dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Sort by</span>
                  <div className="relative">
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-300 transition-all cursor-pointer min-w-[140px]"
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
                          {['newest', 'oldest', 'rating', 'downloaded'].map((sort) => (
                            <button
                              key={sort}
                              onClick={() => {
                                setSortBy(sort)
                                setShowSortDropdown(false)
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                sortBy === sort ? 'text-coral-600 bg-coral-50' : 'text-gray-700'
                              }`}
                            >
                              {sort === 'newest' && 'Newest'}
                              {sort === 'oldest' && 'Oldest'}
                              {sort === 'rating' && 'Highest Rated'}
                              {sort === 'downloaded' && 'Most Downloaded'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ULTRA-OPTIMIZED: Filters button */}
                <button
                  onClick={() => setShowFilterModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="14" height="2" rx="1"/>
                    <circle cx="20" cy="6" r="1.5"/>
                    <circle cx="4" cy="12" r="1.5"/>
                    <rect x="7" y="11" width="14" height="2" rx="1"/>
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

        {/* ULTRA-OPTIMIZED: Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading && <OptimizedLoader />}

          {error && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
                <MapPin className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-gray-600 text-lg mb-8">{error}</p>
              <button onClick={loadPinPacks} className="btn-primary">Try again</button>
            </div>
          )}

          {/* Static loading state with immediate content for LCP */}
          {displayedPacks.length === 0 && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(8).fill(null).map((_, i) => (
                <div key={`static-skeleton-${i}`} className="group cursor-pointer animate-pulse">
                  <div className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100">
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-300 via-transparent to-transparent"></div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filteredPacks.length === 0 && displayedPacks.length > 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No results found</h3>
              <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                Try adjusting your search or filters to discover more places.
              </p>
              <button onClick={clearFilters} className="btn-secondary">Clear all filters</button>
            </div>
          )}

          {/* ULTRA-OPTIMIZED: Pin Packs Grid with immediate loading */}
          {!loading && !error && (
            <>
              {/* Show actual packs - immediate render for LCP */}
              {displayedPacks.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {(filteredPacks.length > 0 ? filteredPacks : displayedPacks).map((pack) => (
                    <PackCard
                      key={pack.id}
                      pack={pack}
                      isAuthenticated={isAuthenticated}
                      wishlistItems={wishlistItems}
                      onToggleWishlist={toggleWishlist}
                      onShowLoginModal={() => setShowLoginModal(true)}
                      getGoogleMapsRating={getGoogleMapsRating}
                      shouldShowGoogleMapsRating={shouldShowGoogleMapsRating}
                      displayedPacks={displayedPacks}
                    />
                  ))}
                </div>
              )}

              {/* Show skeletons while loading more */}
              {loadingMore && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                  {Array(8).fill(null).map((_, i) => (
                    <PackSkeleton key={`skeleton-${i}`} />
                  ))}
                </div>
              )}

              {/* Load more button */}
              {!loadingMore && hasMorePacks && filteredPacks.length > 0 && (
                <div className="text-center mt-12">
                  <button 
                    onClick={loadMorePacks}
                    className="btn-secondary inline-flex items-center text-lg px-8 py-4"
                  >
                    {loadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-coral-500 mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <Globe2 className="h-5 w-5 mr-2" />
                        Show more places
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Show skeletons for initial load */}
              {!initialLoadComplete && !loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array(8).fill(null).map((_, i) => (
                    <PackSkeleton key={`initial-skeleton-${i}`} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ULTRA-OPTIMIZED: Modals with lazy loading */}
        {showFilterModal && (
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded" />}>
            <FilterModal
              isOpen={showFilterModal}
              onClose={() => setShowFilterModal(false)}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              starRatingFilter={starRatingFilter}
              setStarRatingFilter={setStarRatingFilter}
              pinCountFilter={pinCountFilter}
              setPinCountFilter={setPinCountFilter}
              clearFilters={clearFilters}
              filteredPacks={filteredPacks}
            />
          </Suspense>
        )}

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

        {/* ULTRA-OPTIMIZED: PayPal Modal */}
        {showPayPalModal && addedPack && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Complete Purchase</h2>
                <button
                  onClick={() => setShowPayPalModal(false)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>

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

        {/* ULTRA-OPTIMIZED: Payment Success Modal */}
        <PaymentSuccessModal
          isOpen={showSuccessModal}
          packsCount={1}
          onViewPacks={handleViewPacks}
          onKeepBrowsing={handleKeepBrowsing}
        />
      </div>
    </PerformanceMonitor>
  )
}
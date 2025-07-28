import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { PinPack } from '@/lib/supabase'

// Extended PinPack type to include cover photo
interface PinPackWithPhoto extends PinPack {
  coverPhoto?: string | null
}

export function useOptimizedBrowsePage() {
  const [pinPacks, setPinPacks] = useState<PinPackWithPhoto[]>([])
  const [filteredPacks, setFilteredPacks] = useState<PinPackWithPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Optimized data loading with single query
  const loadPinPacks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      logger.log('🔍 Loading pin packs with optimized query...')
      
      // Single optimized query to get packs with their first photo
      const { data: packData, error: packError } = await supabase
        .from('pin_packs')
        .select(`
          *,
          pin_pack_pins!inner(
            pins!inner(photos)
          )
        `)
        .order('created_at', { ascending: false })

      if (packError) throw packError

      logger.log('🔍 Pack data loaded:', packData?.length || 0, 'packs')

      // Process packs with photos in a single pass
      const packsWithPhotos = (packData || []).map((pack: any) => {
        let coverPhoto = null
        
        // Find first pin with photos
        if (pack.pin_pack_pins && Array.isArray(pack.pin_pack_pins)) {
          for (const pinPackPin of pack.pin_pack_pins) {
            if (pinPackPin.pins?.photos && Array.isArray(pinPackPin.pins.photos) && pinPackPin.pins.photos.length > 0) {
              coverPhoto = pinPackPin.pins.photos[0]
              break
            }
          }
        }
        
        return {
          ...pack,
          coverPhoto
        }
      })

      logger.log('🔍 Processed packs with photos:', packsWithPhotos.length)
      setPinPacks(packsWithPhotos)
      setFilteredPacks(packsWithPhotos)
    } catch (err) {
      setError('Failed to load pin packs')
      logger.error('Error loading pin packs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Memoized filtering and sorting
  const applyFiltersAndSort = useCallback((
    packs: PinPackWithPhoto[],
    searchTerm: string,
    categoryFilter: string,
    starRatingFilter: string,
    pinCountFilter: string,
    sortBy: string
  ) => {
    let filtered = [...packs]

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(pack => {
        if (searchLower.includes(',')) {
          const [cityPart, countryPart] = searchLower.split(',').map(s => s.trim())
          return (
            pack.city.toLowerCase().includes(cityPart) &&
            pack.country.toLowerCase().includes(countryPart)
          )
        } else {
          return (
            pack.title.toLowerCase().includes(searchLower) ||
            pack.city.toLowerCase().includes(searchLower) ||
            pack.country.toLowerCase().includes(searchLower) ||
            pack.description.toLowerCase().includes(searchLower)
          )
        }
      })
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(pack => {
        if (pack.categories && Array.isArray(pack.categories)) {
          return pack.categories.includes(categoryFilter)
        }
        return false
      })
    }

    // Star rating filter
    if (starRatingFilter !== 'all') {
      const minRating = parseInt(starRatingFilter)
      filtered = filtered.filter(pack => {
        const rating = pack.average_rating || 0
        return rating >= minRating
      })
    }

    // Pin count filter
    if (pinCountFilter !== 'all') {
      const minPins = parseInt(pinCountFilter)
      filtered = filtered.filter(pack => pack.pin_count >= minPins)
    }

    // Sorting
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
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    return filtered
  }, [])

  // Load data on mount
  useEffect(() => {
    loadPinPacks()
  }, [loadPinPacks])

  return {
    pinPacks,
    filteredPacks,
    loading,
    error,
    refetch: loadPinPacks,
    applyFiltersAndSort
  }
}

// Optimized wishlist hook
export function useOptimizedWishlist() {
  const [wishlistItems, setWishlistItems] = useState<string[]>([])

  const loadWishlist = useCallback(() => {
    const savedWishlist = localStorage.getItem('pinpacks_wishlist')
    if (savedWishlist) {
      try {
        const wishlist = JSON.parse(savedWishlist)
        const wishlistIds = wishlist.map((item: any) => item.id)
        setWishlistItems(wishlistIds)
      } catch (error) {
        logger.error('Error loading wishlist:', error)
      }
    }
  }, [])

  const addToWishlist = useCallback((pack: PinPack) => {
    try {
      const savedWishlist = localStorage.getItem('pinpacks_wishlist')
      let currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : []
      
      const isAlreadyInWishlist = currentWishlist.some((item: any) => item.id === pack.id)
      
      if (!isAlreadyInWishlist) {
        currentWishlist.push(pack)
        localStorage.setItem('pinpacks_wishlist', JSON.stringify(currentWishlist))
        setWishlistItems(prev => [...prev, pack.id])
        logger.log('Added to wishlist:', pack.title)
      }
    } catch (error) {
      logger.error('Error adding to wishlist:', error)
    }
  }, [])

  const removeFromWishlist = useCallback((packId: string) => {
    try {
      const savedWishlist = localStorage.getItem('pinpacks_wishlist')
      let currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : []
      
      currentWishlist = currentWishlist.filter((item: any) => item.id !== packId)
      localStorage.setItem('pinpacks_wishlist', JSON.stringify(currentWishlist))
      setWishlistItems(prev => prev.filter(id => id !== packId))
      logger.log('Removed from wishlist:', packId)
    } catch (error) {
      logger.error('Error removing from wishlist:', error)
    }
  }, [])

  const toggleWishlist = useCallback((pack: PinPack) => {
    if (wishlistItems.includes(pack.id)) {
      removeFromWishlist(pack.id)
    } else {
      addToWishlist(pack)
    }
  }, [wishlistItems, addToWishlist, removeFromWishlist])

  useEffect(() => {
    loadWishlist()
  }, [loadWishlist])

  return { wishlistItems, toggleWishlist }
}

// Optimized authentication hook
export function useOptimizedAuthentication() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  const checkAuthentication = useCallback(() => {
    const userProfileData = localStorage.getItem('pinpacks_user_profile')
    if (userProfileData) {
      try {
        const profile = JSON.parse(userProfileData)
        setIsAuthenticated(true)
        setUserProfile(profile)
        return true
      } catch (error) {
        logger.error('Error parsing user profile:', error)
        localStorage.removeItem('pinpacks_user_profile')
      }
    }
    setIsAuthenticated(false)
    setUserProfile(null)
    return false
  }, [])

  useEffect(() => {
    checkAuthentication()
  }, [checkAuthentication])

  return { isAuthenticated, userProfile, checkAuthentication }
}

// Optimized search suggestions hook
export function useOptimizedSearchSuggestions(pinPacks: PinPackWithPhoto[]) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const generateSuggestions = useCallback((query: string) => {
    if (query.trim().length === 0) {
      setSuggestions([])
      setShowSuggestions(false)
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

    // Remove duplicates and limit to 6 suggestions
    const uniqueSuggestions = Array.from(new Set(allSuggestions)).slice(0, 6)
    setSuggestions(uniqueSuggestions)
    setShowSuggestions(uniqueSuggestions.length > 0)
  }, [pinPacks])

  return { suggestions, showSuggestions, generateSuggestions, setShowSuggestions }
} 
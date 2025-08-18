import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getPackDisplayImage } from '@/lib/utils'
import { logger } from '@/lib/logger'
import type { PinPack } from '@/lib/supabase'

// Extended PinPack type to include cover photo
interface PinPackWithPhoto extends PinPack {
  coverPhoto?: string | null
}

export function usePinPacks() {
  const [pinPacks, setPinPacks] = useState<PinPackWithPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPinPacks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // First get all pin packs
      const { data: packData, error: packError } = await supabase
        .from('pin_packs')
        .select('id, title, description, price, city, country, pin_count, download_count, average_rating, rating_count, categories, created_at')
        .order('created_at', { ascending: false })

      if (packError) throw packError

      // For each pack, get the first available photo from its pins
      const packsWithPhotos = await Promise.all(
        (packData || []).map(async (pack) => {
          try {
            // Get first pin with photos for this pack
            // Skip fetching photos in browse hook to reduce egress
            const pinData = null as any
            const pinError = null as any

            if (!pinError && pinData) {
              // Find first pin that has photos
              const pinWithPhoto = pinData.find((item: any) => {
                const pin = item.pins as any
                return pin?.photos && Array.isArray(pin.photos) && pin.photos.length > 0
              })
              
              // Do not attach coverPhoto in list context
            }
          } catch (error) {
            logger.warn('Error loading photos for pack:', pack.id, error)
          }
          
          return {
            ...pack,
            coverPhoto: null // No photos found
          }
        })
      )

      setPinPacks(packsWithPhotos)
    } catch (err) {
      setError('Failed to load pin packs')
      logger.error('Error loading pin packs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPinPacks()
  }, [loadPinPacks])

  return { pinPacks, loading, error, refetch: loadPinPacks }
}

export function useWishlist() {
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

export function useAuthentication() {
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

export function useSearchSuggestions(pinPacks: PinPackWithPhoto[]) {
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
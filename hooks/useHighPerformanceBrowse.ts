import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { PinPack } from '@/lib/supabase'

// High performance extended PinPack type
interface HighPerformancePinPack extends PinPack {
  coverPhoto?: string | null
  preloadedImages?: string[]
  isVisible?: boolean
}

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Virtualization hook
function useVirtualization(
  items: any[],
  containerHeight: number,
  itemHeight: number,
  columns: number
) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const rowHeight = itemHeight + 24 // 24px gap
  const totalRows = Math.ceil(items.length / columns)
  const totalHeight = totalRows * rowHeight

  const visibleRange = useMemo(() => {
    const viewportStart = scrollTop
    const viewportEnd = scrollTop + containerHeight

    const startRow = Math.floor(viewportStart / rowHeight)
    const endRow = Math.ceil(viewportEnd / rowHeight)

    const bufferRows = 2
    const startRowWithBuffer = Math.max(0, startRow - bufferRows)
    const endRowWithBuffer = Math.min(totalRows, endRow + bufferRows)

    return {
      startRow: startRowWithBuffer,
      endRow: endRowWithBuffer,
      startIndex: startRowWithBuffer * columns,
      endIndex: Math.min(endRowWithBuffer * columns, items.length)
    }
  }, [scrollTop, containerHeight, rowHeight, totalRows, columns, items.length])

  return {
    scrollTop,
    setScrollTop,
    visibleRange,
    totalHeight,
    rowHeight
  }
}

// Image preloader hook
function useImagePreloader(urls: string[], priority: boolean = false) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())

  const preloadImage = useCallback((url: string) => {
    if (loadedImages.has(url) || loadingImages.has(url)) {
      return Promise.resolve()
    }

    setLoadingImages(prev => new Set(Array.from(prev).concat([url])))

    return new Promise<void>((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        setLoadedImages(prev => new Set(Array.from(prev).concat([url])))
        setLoadingImages(prev => {
          const next = new Set(prev)
          next.delete(url)
          return next
        })
        resolve()
      }

      img.onerror = () => {
        setLoadingImages(prev => {
          const next = new Set(prev)
          next.delete(url)
          return next
        })
        reject()
      }

      img.src = url
    })
  }, [loadedImages, loadingImages])

  useEffect(() => {
    if (priority && urls.length > 0) {
      // Preload first few images immediately
      const priorityUrls = urls.slice(0, 6)
      priorityUrls.forEach(url => {
        if (url) preloadImage(url)
      })
    }
  }, [urls, priority, preloadImage])

  return {
    loadedImages,
    loadingImages,
    preloadImage
  }
}

// Main high performance browse hook
export function useHighPerformanceBrowse() {
  const [pinPacks, setPinPacks] = useState<HighPerformancePinPack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    category: 'all',
    starRating: 'all',
    pinCount: 'all',
    sortBy: 'newest'
  })

  // Debounce search for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Cache for processed data
  const cacheRef = useRef<Map<string, any>>(new Map())

  // Optimized data loading with aggressive caching
  const loadPinPacks = useCallback(async () => {
    const cacheKey = 'pin_packs_optimized'
    
    // Check cache first
    if (cacheRef.current.has(cacheKey)) {
      const cachedData = cacheRef.current.get(cacheKey)
      setPinPacks(cachedData)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      logger.log('Loading pin packs with high performance query...')
      
      // First get all pin packs
      const { data: packData, error: packError } = await supabase
        .from('pin_packs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100) // Limit initial load for better performance

      if (packError) throw packError

      logger.log('Processing', packData?.length || 0, 'packs...')

      // For each pack, get the first available photo from its pins
      const processedPacks = await Promise.all(
        (packData || []).map(async (pack) => {
          let coverPhoto: string | null = null
          const preloadedImages: string[] = []

          try {
            // Get first few pins with photos for this pack
            const { data: pinData, error: pinError } = await supabase
              .from('pin_pack_pins')
              .select(`
                pins (
                  photos
                )
              `)
              .eq('pin_pack_id', pack.id)
              .limit(3) // Get up to 3 pins to check for photos

            if (!pinError && pinData) {
              // Find first pin that has photos
              const pinWithPhoto = pinData.find((item: any) => {
                const pin = item.pins as any
                return pin?.photos && Array.isArray(pin.photos) && pin.photos.length > 0
              })
              
              if (pinWithPhoto) {
                const pin = pinWithPhoto.pins as any
                coverPhoto = pin.photos[0] // Add first photo as cover
                
                // Collect additional images for preloading
                for (const pinItem of pinData.slice(0, 3)) {
                  const pinPhotos = (pinItem.pins as any)?.photos
                  if (pinPhotos && Array.isArray(pinPhotos)) {
                    preloadedImages.push(...pinPhotos.slice(0, 2))
                  }
                }
              }
            }
          } catch (error) {
            logger.warn('Error loading photos for pack:', pack.id, error)
          }
          
          return {
            ...pack,
            coverPhoto,
            preloadedImages
          }
        })
      )

      // Cache processed data
      cacheRef.current.set(cacheKey, processedPacks)
      
      logger.log('Processed', processedPacks.length, 'packs')
      
      setPinPacks(processedPacks)
    } catch (err) {
      setError('Failed to load pin packs')
      logger.error('Error loading pin packs:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Memoized filtering with performance optimizations
  const filteredPacks = useMemo(() => {
    const cacheKey = `filtered_${debouncedSearchTerm}_${JSON.stringify(filters)}`
    
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey)
    }

    let filtered = [...pinPacks]

    // Optimized search with early exit
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(pack => {
        // Quick string includes check
        return (
          pack.title.toLowerCase().includes(searchLower) ||
          pack.city.toLowerCase().includes(searchLower) ||
          pack.country.toLowerCase().includes(searchLower)
        )
      })
    }

    // Optimized category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(pack => 
        pack.categories?.includes(filters.category)
      )
    }

    // Optimized star rating filter
    if (filters.starRating !== 'all') {
      const minRating = parseFloat(filters.starRating)
      filtered = filtered.filter(pack => 
        (pack.average_rating || 0) >= minRating
      )
    }

    // Optimized pin count filter
    if (filters.pinCount !== 'all') {
      const [min, max] = filters.pinCount.split('-').map(Number)
      filtered = filtered.filter(pack => {
        const count = pack.pin_count || 0
        return max ? (count >= min && count <= max) : count >= min
      })
    }

    // Optimized sorting
    switch (filters.sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        break
      case 'downloaded':
        filtered.sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
        break
      case 'price_low':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0))
        break
      case 'price_high':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    // Cache result
    cacheRef.current.set(cacheKey, filtered)
    
    return filtered
  }, [pinPacks, debouncedSearchTerm, filters])

  // Load data on mount with performance timing
  useEffect(() => {
    const startTime = performance.now()
    loadPinPacks().then(() => {
      const endTime = performance.now()
      logger.log(`Data loading completed in ${endTime - startTime}ms`)
    })
  }, [loadPinPacks])

  // Search optimization
  const updateSearch = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  // Filter optimization
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Clear cache when needed
  const clearCache = useCallback(() => {
    cacheRef.current.clear()
  }, [])

  return {
    pinPacks: filteredPacks,
    loading,
    error,
    searchTerm,
    filters,
    updateSearch,
    updateFilters,
    refetch: loadPinPacks,
    clearCache,
    totalCount: pinPacks.length,
    filteredCount: filteredPacks.length
  }
}

// Optimized wishlist hook with localStorage caching
export function useOptimizedWishlist() {
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set())
  const cacheRef = useRef<string[]>([])

  const loadWishlist = useCallback(() => {
    try {
      const savedWishlist = localStorage.getItem('pinpacks_wishlist')
      if (savedWishlist) {
        const wishlist = JSON.parse(savedWishlist)
        const wishlistIds = wishlist.map((item: any) => item.id)
        cacheRef.current = wishlistIds
        setWishlistItems(new Set(wishlistIds))
      }
    } catch (error) {
      logger.error('Error loading wishlist:', error)
    }
  }, [])

  const toggleWishlist = useCallback((pack: any) => {
    const packId = pack.id
    const isInWishlist = wishlistItems.has(packId)

    try {
      const savedWishlist = localStorage.getItem('pinpacks_wishlist')
      let currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : []

      if (isInWishlist) {
        // Remove from wishlist
        currentWishlist = currentWishlist.filter((item: any) => item.id !== packId)
        setWishlistItems(prev => {
          const next = new Set(prev)
          next.delete(packId)
          return next
        })
      } else {
        // Add to wishlist
        currentWishlist.push(pack)
        setWishlistItems(prev => new Set(Array.from(prev).concat([packId])))
      }

      localStorage.setItem('pinpacks_wishlist', JSON.stringify(currentWishlist))
      cacheRef.current = currentWishlist.map((item: any) => item.id)
      
    } catch (error) {
      logger.error('Error toggling wishlist:', error)
    }
  }, [wishlistItems])

  useEffect(() => {
    loadWishlist()
  }, [loadWishlist])

  return {
    wishlistItems: Array.from(wishlistItems),
    toggleWishlist,
    isInWishlist: (packId: string) => wishlistItems.has(packId)
  }
}

// Export all hooks
export { useDebounce, useVirtualization, useImagePreloader }
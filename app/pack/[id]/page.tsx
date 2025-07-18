'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, Download, Star, Users, Heart, Share2, Calendar, Clock, ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, ShoppingCart, CreditCard, X, CheckCircle, Copy, Smartphone, Navigation, Shield, User, MessageCircle, Package } from 'lucide-react'
import CloudLoader from '@/components/CloudLoader'
import { supabase } from '@/lib/supabase'
import type { PinPack } from '@/lib/supabase'

// Extended PinPack type to include cover photo (same as browse page)
interface PinPackWithPhoto extends PinPack {
  coverPhoto?: string | null
}
import { exportToGoogleMyMaps } from '@/lib/googleMaps'
import { queryCreatorData } from '@/lib/utils'
import PayPalCheckout from '@/components/PayPalCheckout'
import PaymentSuccessModal from '@/components/PaymentSuccessModal'
import GalleryModal from '@/components/GalleryModal'

export default function PackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const packId = params.id as string

  // State management for the pack detail page
  const [pack, setPack] = useState<PinPack | null>(null)
  const [pins, setPins] = useState<any[]>([])
  const [similarPacks, setSimilarPacks] = useState<PinPackWithPhoto[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wishlistItems, setWishlistItems] = useState<string[]>([])
  const [cartItems, setCartItems] = useState<string[]>([])
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  
  // Enhanced delivery modal state
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [deliveryStep, setDeliveryStep] = useState<'options' | 'mymaps' | 'manual' | 'both'>('options')
  const [savedPlaces, setSavedPlaces] = useState<string[]>([])
  
  // PayPal payment modal state
  const [showPayPalModal, setShowPayPalModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [purchasedPacksCount, setPurchasedPacksCount] = useState(0)
  
  // Purchase status state
  const [isPurchased, setIsPurchased] = useState(false)
  
  // Image gallery state for navigating through pack photos
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  // Image gallery modal state
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryStartIndex, setGalleryStartIndex] = useState(0)
  
  // Function to get the first available photo from any pin in the pack
  const getPackDisplayImage = () => {
    if (!pins || pins.length === 0) return null
    
    // Look for the first pin that has photos
    for (const pin of pins) {
      if (pin.photos && pin.photos.length > 0) {
        return pin.photos[0] // Return the first photo of the first pin that has photos
      }
    }
    
    return null // No photos found in any pins
  }
  
  // Function to get all photos from all pins in the pack with smart ordering
  const getAllPackPhotos = () => {
    if (!pins || pins.length === 0) return []
    
    const allPhotos: string[] = []
    pins.forEach(pin => {
      if (pin.photos && pin.photos.length > 0) {
        allPhotos.push(...pin.photos)
      }
    })
    
    return allPhotos
  }

  // Function to get photos with the best main photo first (horizontal preferred)
  const getOptimizedPackPhotos = () => {
    const allPhotos = getAllPackPhotos()
    if (allPhotos.length === 0) return []

    // For now, we'll keep original order but this function allows future optimization
    // TODO: Implement aspect ratio detection to prefer horizontal images for main photo
    return allPhotos
  }

  // State for creator profile data
  const [creatorProfile, setCreatorProfile] = useState<any>(null)

  // Load creator profile data based on creator_id
  useEffect(() => {
    const loadCreatorProfile = async () => {
      if (pack?.creator_id) {
        try {
          // Use shared utility function for consistent querying
          const { data: creator, error, queryType } = await queryCreatorData(
            pack.creator_id, 
            'name, email, bio, verified, city, country, occupation'
          )

          if (creator && !error) {
            setCreatorProfile(creator)
          } else if (error) {
            console.warn('Creator profile query failed:', error)
            // Set fallback creator data if query fails
            setCreatorProfile({
              name: 'Local Creator',
              email: queryType === 'UUID' ? '' : decodeURIComponent(pack.creator_id),
              bio: 'Local guide passionate about sharing authentic experiences.',
              verified: false,
              city: pack.city,
              country: pack.country,
              occupation: 'Local Guide'
            })
          }
        } catch (error) {
          console.error('Error loading creator profile:', error)
          // Set fallback creator data on any error
          setCreatorProfile({
            name: 'Local Creator',
            email: '',
            bio: 'Local guide passionate about sharing authentic experiences.',
            verified: false,
            city: pack.city,
            country: pack.country,
            occupation: 'Local Guide'
          })
        }
      }
    }

    loadCreatorProfile()
  }, [pack?.creator_id])

  // Get creator name - use real profile data or fallback
  const getCreatorName = (creatorId?: string) => {
    if (creatorProfile?.name) {
      return creatorProfile.name
    }
    
    // Fallback to email-based name or hardcoded values for backwards compatibility
    if (creatorId) {
      if (creatorId === 'local-expert') return 'Local Expert'
      if (creatorId.includes('@')) {
        return creatorId.split('@')[0].split('.').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      }
    }
    
    return 'Local Creator'
  }

  // Get creator bio
  const getCreatorBio = () => {
    if (creatorProfile?.bio) {
      return creatorProfile.bio
    }
    
    // Default bio for backwards compatibility
    return `Hi! I'm passionate about sharing the authentic side of my beautiful city. Having lived here for several years, I know all the hidden gems that locals love. I specialize in creating selected experiences that show you the real culture, amazing food spots, and unique places that most tourists never discover.`
  }

  // Get creator occupation
  const getCreatorOccupation = () => {
    if (creatorProfile?.occupation) {
      return creatorProfile.occupation
    }
    return 'Local tourism guide'
  }



  // Check if creator is verified
  const isCreatorVerified = () => {
    return creatorProfile?.verified || false
  }

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

  // Check if pack is already purchased
  const checkPurchaseStatus = () => {
    if (!packId) return false
    
    const existingPurchases = JSON.parse(localStorage.getItem('pinpacks_purchased') || '[]')
    const purchased = existingPurchases.includes(packId)
    setIsPurchased(purchased)
    return purchased
  }

  // Handle protected actions (show login modal if not authenticated)
  const handleProtectedAction = (action: () => void) => {
    if (isAuthenticated) {
      action()
    } else {
      setShowLoginModal(true)
    }
  }

  // Load pack details when the component first loads
  useEffect(() => {
    if (packId) {
      checkAuthentication()
      loadPackDetails()
      checkPurchaseStatus()
    }
  }, [packId])

  // Load wishlist and cart when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist()
    } else {
      setWishlistItems([])
      setCartItems([])
    }
    // Also check purchase status when auth changes
    checkPurchaseStatus()
  }, [isAuthenticated])

  // Load user's wishlist and cart from browser storage (only when authenticated)
  const loadWishlist = () => {
    if (!isAuthenticated) {
      setWishlistItems([])
      setCartItems([])
      return
    }

    // Load wishlist
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
    
    // Load shopping cart
    const savedCart = localStorage.getItem('pinpacks_cart')
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart)
        const cartIds = cart.map((item: any) => item.id)
        setCartItems(cartIds)
      } catch (error) {
        console.error('Error loading cart:', error)
      }
    }
  }

  // Main function to load all pack details, pins, and similar packs
  const loadPackDetails = async () => {
    try {
      setLoading(true)
      console.log('Loading pack details for ID:', packId) // Debug log
      
      // First, get the main pack information from database
      const { data: packData, error: packError } = await supabase
        .from('pin_packs')
        .select('*')
        .eq('id', packId)
        .maybeSingle()

      console.log('Pack query result:', { packData, packError }) // Debug log

      if (packError) throw packError
      if (!packData) throw new Error('Pack not found')
      
      setPack(packData)

      // Load all the pins/places that belong to this pack using the junction table
      const { data: packPinsData, error: pinsError } = await supabase
        .from('pin_pack_pins')
        .select(`
          pins (
            id,
            title,
            description,
            google_maps_url,
            category,
            latitude,
            longitude,
            created_at,
            address,
            city,
            country,
            zip_code,
            business_type,
            phone,
            website,
            rating,
            rating_count,
            business_status,
            current_opening_hours,
            reviews,
            place_id,
            needs_manual_edit,
            updated_at,
            photos
          )
        `)
        .eq('pin_pack_id', packId)

      console.log('Pins query result:', { packPinsData, pinsError }) // Debug log

      if (pinsError) {
        console.warn('Error loading pins:', pinsError)
        // Don't throw error for pins, just set empty array
        setPins([])
      } else {
        // Extract the pins from the junction table response and map to expected format
        const pinsData = packPinsData?.map((item: any) => ({
          id: item.pins.id,
          name: item.pins.title, // Map 'title' to 'name' for consistency with existing code
          title: item.pins.title,
          description: item.pins.description,
          google_maps_url: item.pins.google_maps_url,
          category: item.pins.category,
          latitude: item.pins.latitude,
          longitude: item.pins.longitude,
          created_at: item.pins.created_at,
          address: item.pins.address,
          city: item.pins.city,
          country: item.pins.country,
          zip_code: item.pins.zip_code,
          business_type: item.pins.business_type,
          phone: item.pins.phone,
          website: item.pins.website,
          rating: item.pins.rating,
          rating_count: item.pins.rating_count,
          business_status: item.pins.business_status,
          current_opening_hours: item.pins.current_opening_hours,
          reviews: item.pins.reviews,
          place_id: item.pins.place_id,
          needs_manual_edit: item.pins.needs_manual_edit,
          updated_at: item.pins.updated_at,
          photos: item.pins.photos || [] // Include photos array
        })) || []
        
        setPins(pinsData)
      }

      // Find similar packs from the same city or country (excluding current pack)
      const { data: similarData, error: similarError } = await supabase
        .from('pin_packs')
        .select('*')
        .or(`city.eq.${packData.city},country.eq.${packData.country}`)
        .neq('id', packId)
        .limit(8)

      if (similarError) {
        console.warn('Error loading similar packs:', similarError)
        setSimilarPacks([])
      } else {
        // Load cover photos for similar packs (same logic as browse page)
        const similarPacksWithPhotos = await Promise.all(
          (similarData || []).map(async (similarPack) => {
            try {
              // Get pins for this similar pack to find photos
              const { data: similarPackPins, error: similarPinsError } = await supabase
                .from('pin_pack_pins')
                .select(`
                  pins (
                    id,
                    photos
                  )
                `)
                .eq('pin_pack_id', similarPack.id)
                .limit(10) // Get up to 10 pins to check for photos

              if (!similarPinsError && similarPackPins && similarPackPins.length > 0) {
                // Find first pin with photos
                const pinWithPhoto = similarPackPins.find(packPin => {
                  const pin = packPin.pins as any
                  return pin?.photos && Array.isArray(pin.photos) && pin.photos.length > 0
                })
                
                if (pinWithPhoto) {
                  const pin = pinWithPhoto.pins as any
                  return {
                    ...similarPack,
                    coverPhoto: pin.photos[0] // Add first photo as cover
                  }
                }
              }
            } catch (error) {
              console.warn('Error loading photos for similar pack:', similarPack.id, error)
            }
            
            return {
              ...similarPack,
              coverPhoto: null // No photos found
            }
          })
        )
        
        setSimilarPacks(similarPacksWithPhotos)
      }

      // Mock reviews data since we don't have a reviews table yet
      // This shows realistic reviews that would appear on a pack detail page
      setReviews([
        {
          id: 1,
          user_name: 'Sarah Chen',
          user_avatar: 'SC',
          rating: 5,
          comment: 'Amazing local spots! Found some hidden gems I never would have discovered on my own.',
          date: '2024-01-15',
          verified: true
        },
        {
          id: 2,
          user_name: 'Miguel Rodriguez',
          user_avatar: 'MR',
          rating: 5,
          comment: 'Perfect for exploring the authentic side of the city. Highly recommend!',
          date: '2024-01-10',
          verified: true
        },
        {
          id: 3,
          user_name: 'Emma Wilson',
          user_avatar: 'EW',
          rating: 4,
          comment: 'Great selection of places. Some were closed when I visited but overall excellent.',
          date: '2024-01-08',
          verified: false
        }
      ])

    } catch (err) {
      console.error('Detailed error loading pack details:', err) // Enhanced debug log
      setError(`Failed to load pack details: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Function to add a pack to user's wishlist
  const addToWishlist = (pack: PinPack) => {
    try {
      const savedWishlist = localStorage.getItem('pinpacks_wishlist')
      let currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : []
      
      // Check if pack is already in wishlist to avoid duplicates
      const isAlreadyInWishlist = currentWishlist.some((item: any) => item.id === pack.id)
      
      if (!isAlreadyInWishlist) {
        currentWishlist.push(pack)
        localStorage.setItem('pinpacks_wishlist', JSON.stringify(currentWishlist))
        setWishlistItems(prev => [...prev, pack.id])
        console.log('Added to wishlist:', pack.title)
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error)
    }
  }

  // Function to remove a pack from user's wishlist
  const removeFromWishlist = (packId: string) => {
    try {
      const savedWishlist = localStorage.getItem('pinpacks_wishlist')
      let currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : []
      
      currentWishlist = currentWishlist.filter((item: any) => item.id !== packId)
      localStorage.setItem('pinpacks_wishlist', JSON.stringify(currentWishlist))
      setWishlistItems(prev => prev.filter(id => id !== packId))
      console.log('Removed from wishlist:', packId)
    } catch (error) {
      console.error('Error removing from wishlist:', error)
    }
  }

  // Toggle wishlist status - add if not in wishlist, remove if already in wishlist
  const toggleWishlist = (pack: PinPack) => {
    handleProtectedAction(() => {
      const isInWishlist = wishlistItems.includes(pack.id)
      if (isInWishlist) {
        removeFromWishlist(pack.id)
      } else {
        addToWishlist(pack)
      }
    })
  }

  // Add item to shopping cart (protected action)
  const addToCart = (pack: PinPack) => {
    handleProtectedAction(() => {
      try {
        const savedCart = localStorage.getItem('pinpacks_cart')
        let currentCart = savedCart ? JSON.parse(savedCart) : []
        
        const isAlreadyInCart = currentCart.some((item: any) => item.id === pack.id)
        
        if (!isAlreadyInCart) {
          currentCart.push(pack)
          localStorage.setItem('pinpacks_cart', JSON.stringify(currentCart))
          
          // Don't update state immediately - keep button text unchanged until redirect
          console.log('Added to cart:', pack.title)
          
          // Get the current search from referrer or URL if available
          const referrerUrl = document.referrer
          let searchQuery = ''
          
          if (referrerUrl && referrerUrl.includes('/browse')) {
            try {
              const referrerParams = new URL(referrerUrl).searchParams
              searchQuery = referrerParams.get('search') || ''
            } catch (error) {
              console.warn('Could not parse referrer URL:', error)
            }
          }
          // Get the best available image for the pack
          const displayImage = getPackDisplayImage() || ''
          // Redirect to browse page with cart success parameters
          const browseUrl = new URL('/browse', window.location.origin)
          if (searchQuery) {
            browseUrl.searchParams.set('search', searchQuery)
          }
          browseUrl.searchParams.set('cart_success', 'true')
          browseUrl.searchParams.set('added_pack_id', pack.id)
          window.location.href = browseUrl.toString()
        }
      } catch (error) {
        console.error('Error adding to cart:', error)
      }
    })
  }

  // Remove item from shopping cart
  const removeFromCart = (packId: string) => {
    try {
      const savedCart = localStorage.getItem('pinpacks_cart')
      let currentCart = savedCart ? JSON.parse(savedCart) : []
      
      currentCart = currentCart.filter((item: any) => item.id !== packId)
      localStorage.setItem('pinpacks_cart', JSON.stringify(currentCart))
      setCartItems(prev => prev.filter(id => id !== packId))
      console.log('Removed from cart:', packId)
    } catch (error) {
      console.error('Error removing from cart:', error)
    }
  }

  // Toggle cart status
  const toggleCart = (pack: PinPack) => {
    if (cartItems.includes(pack.id)) {
      removeFromCart(pack.id)
    } else {
      addToCart(pack)
    }
  }

  // Handle payment - show PayPal modal
  const handlePayment = (pack: PinPack) => {
    if (isAuthenticated) {
      setShowPayPalModal(true)
    } else {
      setShowLoginModal(true)
    }
  }

  // PayPal success handler
  const handlePayPalSuccess = async (orderData: any) => {
    try {
      console.log('PayPal payment successful:', orderData)
      
      if (pack) {
        // Get user email from profile
        const userProfileData = localStorage.getItem('pinpacks_user_profile')
        const userEmail = userProfileData ? JSON.parse(userProfileData).email : null
        
        console.log('🔍 Creating order with user email:', userEmail)

        // Create order in database (same API call as cart page)
        const createOrderResponse = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cartItems: [{
              id: pack.id,
              title: pack.title,
              price: pack.price,
              city: pack.city,
              country: pack.country,
              pin_count: pins.length
            }],
            totalAmount: pack.price,
            processingFee: 0.50,
            userLocation: 'Unknown',
            userIp: 'Unknown',
            customerEmail: orderData.details?.payer?.email_address || userEmail, // PayPal email
            userEmail: userEmail // PinCloud user email
          })
        })

        console.log('🔍 Create order response:', createOrderResponse.status)

        if (createOrderResponse.ok) {
          const { order } = await createOrderResponse.json()
          console.log('🔍 Order created successfully:', order)

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

          console.log('🔍 Complete order response:', completeOrderResponse.status)

          if (completeOrderResponse.ok) {
            console.log('🔍 Order completed successfully')
            
            // Add pack to purchased list
            const existingPurchases = JSON.parse(localStorage.getItem('pinpacks_purchased') || '[]')
            if (!existingPurchases.includes(pack.id)) {
              existingPurchases.push(pack.id)
              localStorage.setItem('pinpacks_purchased', JSON.stringify(existingPurchases))
              console.log('🔍 Added pack to localStorage purchased list:', pack.id)
              
              // Remove from cart if it was there
              const existingCart = JSON.parse(localStorage.getItem('pinpacks_cart') || '[]')
              const updatedCart = existingCart.filter((item: any) => item.id !== pack.id)
              localStorage.setItem('pinpacks_cart', JSON.stringify(updatedCart))
              
              // Update local state
              setCartItems(prev => prev.filter(id => id !== pack.id))
            }
            
            // Update purchase status and show falling pins success modal
            setIsPurchased(true)
            setShowPayPalModal(false)
            setPurchasedPacksCount(1)
            setShowSuccessModal(true)
          } else {
            console.error('🔍 Failed to complete order:', completeOrderResponse.status)
          }
        } else {
          console.error('🔍 Failed to create order:', createOrderResponse.status)
        }
      }
    } catch (error) {
      console.error('Error handling PayPal success:', error)
    }
  }

  // PayPal error handler
  const handlePayPalError = (error: any) => {
    console.error('PayPal payment error:', error)
    setShowPayPalModal(false)
    console.log('Payment failed. Please try again.')
  }

  // Payment success modal handlers
  const handleViewPacks = () => {
    window.location.href = '/pinventory'
  }

  const handleKeepBrowsing = () => {
    setShowSuccessModal(false)
    setPurchasedPacksCount(0)
  }

  // Navigate to another similar pack's detail page
  const navigateToSimilarPack = (similarPackId: string) => {
    router.push(`/pack/${similarPackId}`)
  }

  // Open the pack's locations in Google Maps
  const openInGoogleMaps = async () => {
    if (!pack || pins.length === 0) return

    try {
      // Add pack to purchased list for testing purposes (since it's free)
      const existingPurchases = JSON.parse(localStorage.getItem('pinpacks_purchased') || '[]')
      if (!existingPurchases.includes(pack.id)) {
        existingPurchases.push(pack.id)
        localStorage.setItem('pinpacks_purchased', JSON.stringify(existingPurchases))
        
        // Update purchase status
        setIsPurchased(true)
        
        // Show success message
        console.log(`🎉 Free pack "${pack.title}" added to your Pinventory! You can now access it anytime from your collection.`)
      }

      // Create a search query with all the places in the pack
      const placesQuery = pins
        .map(pin => `${pin.name || pin.title}, ${pack.city}`)
        .join(' | ')
      
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(placesQuery)}`
      window.open(mapsUrl, '_blank')
      
      // Update download count in database when user opens in maps
      await supabase
        .from('pin_packs')
        .update({ download_count: (pack.download_count || 0) + 1 })
        .eq('id', pack.id)
        
    } catch (error) {
      console.error('Error opening in Google Maps:', error)
    }
  }

  // Share the pack using native share API or copy link to clipboard
  const sharePackage = async () => {
    const shareUrl = window.location.href
    
    if (navigator.share) {
      // Use native share API if available (mobile devices)
      try {
        await navigator.share({
          title: pack?.title || 'Check out this pin pack',
          text: pack?.description || 'Amazing local recommendations',
          url: shareUrl,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(shareUrl)
      console.log('Link copied to clipboard!')
    }
  }

  // Enhanced delivery system functions
  const handleEnhancedExport = () => {
    setShowDeliveryModal(true)
    setDeliveryStep('options')
  }

  const generateMyMapsKML = async () => {
    try {
      const message = await exportToGoogleMyMaps(pack, pins)
      return message
    } catch (error) {
      console.error('Export error:', error)
      throw new Error('Failed to export to Google My Maps. Please try again.')
    }
  }

  const generateIndividualLinks = () => {
    return pins.map(pin => ({
      id: pin.id,
      name: pin.name || pin.title,
      description: pin.description,
      googleMapsUrl: pin.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pin.name || pin.title}, ${pack?.city}`)}`
    }))
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.error('Failed to copy:', error)
      return false
    }
  }

  const markPlaceAsSaved = (placeId: string) => {
    setSavedPlaces(prev => [...prev, placeId])
  }

  const openMyMapsImportPage = () => {
    window.open('https://www.google.com/maps/d/', '_blank')
  }

  // Handle profile picture click - always scroll to about section
  const handleProfileClick = () => {
    if (!pack) return
    
    const aboutSection = document.getElementById('creator-about-section')
    aboutSection?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // Handle navigation to creator shop
  const navigateToCreatorShop = () => {
    if (!pack) return
    window.location.href = `/creator/${pack.creator_id || 'local-expert'}`
  }

  // Show loading screen while pack data is being loaded
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
                  <CloudLoader size="lg" text="Loading pack details..." />
        </div>
      </div>
    )
  }

  // Show error screen if pack couldn't be loaded or doesn't exist
  if (error || !pack) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
            <MapPin className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Pack not found</h3>
          <p className="text-gray-600 text-lg mb-8">{error || 'This pack may have been removed or the link is incorrect.'}</p>
          <button 
            onClick={() => router.push('/browse')}
            className="btn-primary"
          >
            Browse Other Packs
          </button>
        </div>
      </div>
    )
  }

  // Get all photos from all pins in the pack (flat array)
  const allPhotos: string[] = getOptimizedPackPhotos()

  return (
    <div className="min-h-screen bg-gray-25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Top Section with Title and Action Buttons */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {pack.title}
            </h1>
            <div className="flex items-center space-x-4 mb-4">
              {/* Star rating and reviews */}
              <div className="flex items-center">
                <div className="flex items-center">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">4.7</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                Created by {getCreatorName(pack.creator_id)}
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{pack.city}, {pack.country}</span>
              </div>
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-1" />
                <span>{pack.pin_count} places</span>
              </div>
            </div>
            
            {/* Categories Display */}
            {pack.categories && pack.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {pack.categories.map((category, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center bg-coral-100 text-coral-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}
        </div>
          
          {/* Action buttons for wishlist and sharing in top right */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (isAuthenticated) {
                  toggleWishlist(pack)
                } else {
                  setShowLoginModal(true)
                }
              }}
              className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <Heart 
                className={`h-5 w-5 transition-colors ${
                  isAuthenticated && wishlistItems.includes(pack.id) 
                    ? 'text-red-500 fill-current' 
                    : 'text-red-600'
                }`} 
              />
            </button>
            
            <button
              onClick={sharePackage}
              className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <Share2 className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Gallery Section - Airbnb Style */}
        <div className="relative mb-10">
          {allPhotos.length > 0 ? (
            <div className="w-full flex gap-2 h-80 rounded-2xl overflow-hidden">
              {/* Main photo - left side (takes 50% width) */}
              <div 
                className="flex-1 relative cursor-pointer group h-full overflow-hidden"
                onClick={() => { setGalleryStartIndex(0); setGalleryOpen(true); }}
              >
                <img
                  src={`${allPhotos[0]}`}
                  alt={pack.title}
                  className="w-full h-full object-cover"
                />
                {/* Subtle gray overlay on hover */}
                <div className="absolute inset-0 bg-gray-300 opacity-0 group-hover:opacity-30 transition-opacity"></div>
              </div>
              
              {/* Right side - 2x2 grid of smaller photos (50% width) */}
              <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-2 h-full">
                {allPhotos.slice(1, 5).map((photo, idx) => {
                  const isLast = idx === 3 && allPhotos.length > 5;
                  return (
                    <div
                      key={idx}
                      className="relative cursor-pointer group overflow-hidden"
                      onClick={() => { setGalleryStartIndex(idx + 1); setGalleryOpen(true); }}
                    >
                      <img
                        src={`${photo}`}
                        alt={`Gallery photo ${idx + 2}`}
                        className="w-full h-full object-cover"
                      />
                      {/* Subtle gray overlay on hover */}
                      <div className="absolute inset-0 bg-gray-300 opacity-0 group-hover:opacity-30 transition-opacity"></div>
                      {/* Show more pill on last image if there are more photos */}
                      {isLast && (
                        <button 
                          className="absolute bottom-2 right-2 bg-white/90 text-gray-800 px-3 py-1 rounded-full font-medium text-xs flex items-center space-x-1 shadow hover:bg-gray-100"
                          onClick={e => { e.stopPropagation(); setGalleryStartIndex(0); setGalleryOpen(true); }}
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x='3' y='3' width='18' height='18' rx='2' ry='2'/>
                            <circle cx='8.5' cy='8.5' r='1.5'/>
                            <polyline points='21,15 16,10 5,21'/>
                          </svg>
                          <span>+{allPhotos.length - 5} more</span>
                        </button>
                      )}
                    </div>
                  )
                })}
                {/* Fill remaining slots if less than 4 additional photos */}
                {Array.from({ length: Math.max(0, 4 - (allPhotos.length - 1)) }, (_, idx) => (
                  <div key={`empty-${idx}`} className="bg-gray-100"></div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area - Takes up 2/3 of the space on large screens */}
          <div className="lg:col-span-2 space-y-8">

            {/* Main Pack Information Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">

              {/* Detailed description of the pack */}
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                <p>{pack.description}</p>
                
                <p>Discover the authentic side of {pack.city} through this carefully selected collection of local favorites. 
                Each location has been personally selected and visited, ensuring you experience the city like a true local.</p>
                
                <p>Perfect for travelers who want to go beyond typical tourist attractions and experience the real culture, 
                food, and atmosphere that makes this place special.</p>
              </div>
            </div>

            {/* List of places/pins in this pack - Preview for non-purchased, full for purchased */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              {(() => {
                // Calculate how many places to show in preview based on total count
                const getPreviewCount = (totalPlaces: number) => {
                  if (totalPlaces <= 3) return 1;  // Show 1 if 3 or fewer
                  if (totalPlaces <= 6) return 2;  // Show 2 if 4-6 places
                  return Math.min(Math.ceil(totalPlaces * 0.3), 3); // Show ~30% but cap at 3
                };

                const previewCount = getPreviewCount(pins.length);
                const placesToShow = isPurchased ? pins : pins.slice(0, previewCount);
                const hiddenCount = pins.length - previewCount;

                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {isPurchased ? `All Places (${pins.length})` : `Preview (${previewCount} of ${pins.length})`}
                      </h2>
                      {!isPurchased && (
                        <span className="bg-coral-100 text-coral-700 text-sm font-medium px-3 py-1 rounded-full">
                          Preview Only
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {placesToShow.map((pin, index) => (
                        <div key={pin.id} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                          {/* Numbered indicator for each place */}
                          <div className="w-8 h-8 bg-coral-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{pin.name}</h3>
                            <p className="text-gray-600 text-sm mb-2">{pin.description}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{pin.address || 'Address available in map'}</span>
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                            <span>Local favorite</span>
                          </div>
                        </div>
                      ))}
                      
                      {/* Show teaser for remaining places if not purchased */}
                      {!isPurchased && hiddenCount > 0 && (
                        <div className="mt-6 p-6 bg-gradient-to-r from-coral-50 to-orange-50 rounded-xl border border-coral-200">
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-3">
                              <Package className="h-8 w-8 text-coral-500 mr-2" />
                              <span className="text-2xl font-bold text-coral-600">+{hiddenCount}</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              More Amazing Places Waiting
                            </h3>
                            <p className="text-gray-600 mb-4">
                              Get the complete collection with {hiddenCount} additional hand-picked local favorites, 
                              complete with detailed descriptions, exact locations, and insider tips.
                            </p>
                            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-4">
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                <span>Exact addresses</span>
                              </div>
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                <span>Local insider tips</span>
                              </div>
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                <span>Google Maps ready</span>
                              </div>
                            </div>
                            {pack.price > 0 ? (
                              <button
                                onClick={() => handlePayment(pack)}
                                className="btn-primary px-6 py-3 font-semibold"
                              >
                                Get All {pins.length} Places for ${pack.price}
                              </button>
                            ) : (
                              <button
                                onClick={openInGoogleMaps}
                                className="btn-primary px-6 py-3 font-semibold"
                              >
                                Get All {pins.length} Places Free
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Reviews and ratings section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Reviews ({reviews.length})
                </h2>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-semibold">4.8</span>
                  <span className="text-gray-500">({reviews.length} reviews)</span>
                </div>
              </div>

              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex items-start space-x-4">
                      {/* User avatar with initials */}
                      <div className="w-10 h-10 bg-coral-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {review.user_avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{review.user_name}</span>
                            {review.verified && (
                              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                Verified
                              </span>
                            )}
                          </div>
                          {/* Star rating */}
                          <div className="flex items-center space-x-1 mb-2">
                            {Array.from({ length: review.rating }, (_, i) => (
                              <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                            ))}
                            {Array.from({ length: 5 - review.rating }, (_, i) => (
                              <Star key={i + review.rating} className="h-4 w-4 text-gray-300 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{review.comment}</p>
                        <span className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Takes up 1/3 of space on large screens */}
          <div className="space-y-6">
            
            {/* Booking/Download card with pricing and actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {pack.price === 0 ? 'Free' : `$${pack.price}`}
                </div>
                <p className="text-gray-600">Get instant access</p>
              </div>

              <div className="space-y-4">
                {isPurchased ? (
                  /* Already purchased - show pinventory button */
                  <button
                    onClick={() => window.location.href = '/pinventory'}
                    className="w-full btn-primary flex items-center justify-center text-lg py-4"
                  >
                    <Package className="h-5 w-5 mr-2" />
                    Go to My Pinventory
                  </button>
                ) : pack.price > 0 ? (
                  <>
                    {/* Pay button for paid packs */}
                    <button
                      onClick={() => handlePayment(pack)}
                      className="w-full btn-primary flex items-center justify-center text-lg py-4"
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pay ${pack.price}
                    </button>
                    
                    {/* Add to cart button */}
                    <div className="relative group">
                      <button
                        onClick={() => {
                          if (isAuthenticated && !cartItems.includes(pack.id)) {
                            addToCart(pack)
                          } else if (!isAuthenticated) {
                            setShowLoginModal(true)
                          }
                        }}
                        className={`w-full flex items-center justify-center py-3 transition-all ${
                          isAuthenticated && cartItems.includes(pack.id)
                            ? 'btn-secondary bg-coral-50 text-coral-600 border-coral-200 cursor-default'
                            : 'btn-secondary hover:border-coral-300 hover:text-coral-600'
                        }`}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {!isAuthenticated 
                          ? 'Sign in to Add to Cart'
                          : (cartItems.includes(pack.id) ? 'Added to Cart' : 'Add to Cart')
                        }
                      </button>
                      
                      {/* Hover tooltip for already added items */}
                      {isAuthenticated && cartItems.includes(pack.id) && (
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                          Pack is already in cart
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Free pack - direct download */
                  <button
                    onClick={openInGoogleMaps}
                    className="w-full btn-primary flex items-center justify-center text-lg py-4"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Get Free Pack
                  </button>
                )}
                

              </div>

              {/* Pack metadata and statistics */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Creator location</span>
                  <span>{pack.creator_location || pack.city}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Total places</span>
                  <span>{pins.length} locations</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Downloaded</span>
                  <span>{pack.download_count || 0} times</span>
                </div>
              </div>
            </div>

            {/* Creator Profile Card - Airbnb style */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mt-6">
              <div className="flex items-start space-x-4 mb-6">
                {/* Creator Profile Picture */}
                <div className="relative">
                  <button 
                    onClick={handleProfileClick}
                    className="w-16 h-16 bg-gradient-to-br from-coral-500 to-primary-500 rounded-full flex items-center justify-center text-white text-xl font-bold hover:shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer"
                  >
                    {getCreatorName(pack.creator_id)?.charAt(0).toUpperCase() || 'L'}
                  </button>
                  {/* Verification badge - only show if verified */}
                  {isCreatorVerified() && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-coral-500 rounded-full flex items-center justify-center">
                      <Shield className="h-3 w-3 text-white" />
                    </div>
                  )}

                </div>

                {/* Creator Stats */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {getCreatorName(pack.creator_id)}
                    </h3>
                    <span className="bg-coral-100 text-coral-700 text-xs font-medium px-2 py-1 rounded-full">
                      Superhost
                    </span>
                  </div>
                  
                  {/* Creator stats grid */}
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="font-bold text-gray-900">
                        73
                      </div>
                      <div className="text-gray-500 text-xs">Reviews</div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 flex items-center justify-center">
                        4.9
                        <Star className="h-3 w-3 text-yellow-400 fill-current ml-1" />
                      </div>
                      <div className="text-gray-500 text-xs">Rating</div>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">
                        5
                      </div>
                      <div className="text-gray-500 text-xs">Years creating</div>
                    </div>
                  </div>
                </div>
              </div>




            </div>

          </div>
        </div>

        {/* Creator About Section - Moved from sidebar */}
        <div id="creator-about-section" className="mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <button 
              onClick={navigateToCreatorShop}
              className="flex items-start space-x-6 mb-8 w-full text-left hover:bg-gray-50 p-4 rounded-xl transition-colors duration-200 group"
            >
              {/* Creator Profile Picture - Large version */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-to-br from-coral-500 to-primary-500 rounded-full flex items-center justify-center text-white text-3xl font-bold group-hover:shadow-lg transition-shadow duration-200">
                  {getCreatorName(pack.creator_id)?.charAt(0).toUpperCase() || 'L'}
                </div>
                {/* Verification badge - only show if verified */}
                {isCreatorVerified() && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-coral-500 rounded-full flex items-center justify-center border-4 border-white">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Creator Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{getCreatorName(pack.creator_id)}</h2>
                  <span className="bg-coral-100 text-coral-700 text-sm font-medium px-3 py-1 rounded-full">
                    Superhost
                  </span>
                </div>

                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span className="text-lg">Lives in {pack.city}, {pack.country}</span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">73</div>
                    <div className="text-gray-500 text-sm">Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 flex items-center justify-center">
                      4.9
                      <Star className="h-4 w-4 text-yellow-400 fill-current ml-1" />
                    </div>
                    <div className="text-gray-500 text-sm">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">5</div>
                    <div className="text-gray-500 text-sm">Years creating</div>
                  </div>
                </div>
              </div>
            </button>

            {/* About Creator Details */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">About {getCreatorName(pack.creator_id)}</h3>
              
              {/* Creator details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-600">
                  <MessageCircle className="h-5 w-5 mr-3" />
                  <span>My work: {getCreatorOccupation()}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-3" />
                  <span>Lives in {creatorProfile?.city || pack.city}, {creatorProfile?.country || pack.country}</span>
                </div>
                {isCreatorVerified() && (
                  <div className="flex items-center text-gray-600">
                    <Shield className="h-5 w-5 mr-3" />
                    <span className="underline">Identity verified</span>
                  </div>
                )}
              </div>

              {/* Creator bio */}
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {getCreatorBio()}
                </p>
              </div>


            </div>
          </div>
        </div>

        {/* Similar Packs Section - Horizontal scrollable list */}
        {similarPacks.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                More from {pack.city}
              </h2>
              <a 
                href={`/browse?search=${encodeURIComponent(pack.city)}`}
                className="text-coral-500 hover:text-coral-600 font-medium inline-flex items-center"
              >
                View all
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </div>

            {/* Horizontal scrollable container for similar packs */}
            <div className="overflow-x-auto">
              <div className="flex space-x-6 pb-4">
                {similarPacks.map((similarPack) => (
                  <div
                    key={similarPack.id}
                    onClick={() => navigateToSimilarPack(similarPack.id)}
                    className="flex-none w-80 card-airbnb group cursor-pointer"
                  >
                    {/* Similar pack image with overlays */}
                    <div className="h-48 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 relative overflow-hidden">
                      {/* Display actual photo if available, otherwise Google Maps background */}
                      {similarPack.coverPhoto ? (
                        <img 
                          src={`${similarPack.coverPhoto}`}
                          alt={`${similarPack.title} cover`}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/google-maps-bg.svg";
                          }}
                        />
                      ) : (
                        <img 
                          src={similarPack.coverPhoto && similarPack.coverPhoto !== '' ? similarPack.coverPhoto : "/google-maps-bg.svg"}
                          alt="Map background"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                      
                      {/* Heart icon for adding to wishlist */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isAuthenticated) {
                            toggleWishlist(similarPack)
                          } else {
                            setShowLoginModal(true)
                          }
                        }}
                        className="absolute top-3 right-3 w-8 h-8 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors group shadow-sm z-10"
                      >
                        <Heart 
                          className={`h-4 w-4 transition-colors ${
                            isAuthenticated && wishlistItems.includes(similarPack.id) 
                              ? 'text-red-500 fill-current' 
                              : 'text-red-700 group-hover:text-red-500'
                          }`} 
                        />
                      </button>
                      

                      
                      {/* Pin count badge */}
                      <div className="absolute bottom-3 right-3 z-10">
                        <span className="bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium">
                          {similarPack.pin_count} pins
                        </span>
                      </div>
                    </div>
                    
                    {/* Similar pack content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-coral-600 transition-colors">
                            {similarPack.title}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {similarPack.city}, {similarPack.country}
                          </p>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 ml-2">
                          <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                          <span className="text-xs">{((similarPack.download_count || 0) % 50 + 350) / 100}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {similarPack.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Get Your Places</h2>
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {deliveryStep === 'options' && (
                <div className="p-6 space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Choose how you want to use your places
                    </h3>
                    <p className="text-gray-600">
                      We'll help you get the best experience for your needs
                    </p>
                  </div>

                  {/* Option 1: My Maps (Recommended) */}
                  <div className="relative">
                    <div className="absolute -top-2 -right-2 bg-coral-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Recommended
                    </div>
                    <button
                      onClick={() => setDeliveryStep('mymaps')}
                      className="w-full p-6 border-2 border-coral-200 bg-coral-50 hover:bg-coral-100 rounded-2xl text-left transition-colors group"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-coral-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            Complete Experience (My Maps)
                          </h4>
                          <p className="text-gray-600 mb-3">
                            Get all places with descriptions in Google My Maps
                          </p>
                          <div className="space-y-1 text-sm text-gray-700">
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Keeps all descriptions and tips
                            </div>
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Works perfectly on mobile
                            </div>
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Offline access available
                            </div>
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              Easy sharing with friends
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-coral-500 transition-colors" />
                      </div>
                    </button>
                  </div>

                  {/* Option 2: Regular Google Maps */}
                  <button
                    onClick={() => setDeliveryStep('manual')}
                    className="w-full p-6 border-2 border-gray-200 hover:border-gray-300 rounded-2xl text-left transition-colors group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Smartphone className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          Regular Google Maps
                        </h4>
                        <p className="text-gray-600 mb-3">
                          Save places individually to your main Google Maps
                        </p>
                        <div className="space-y-1 text-sm text-gray-700">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            In your main Google Maps account
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            Shows in search suggestions
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-amber-500 mr-2" />
                            Takes 5-10 minutes to set up
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-amber-500 mr-2" />
                            Custom descriptions not included
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </button>

                  {/* Option 3: Both */}
                  <button
                    onClick={() => setDeliveryStep('both')}
                    className="w-full p-6 border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 rounded-2xl text-left transition-colors group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Star className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          Best of Both Worlds
                        </h4>
                        <p className="text-gray-600 mb-3">
                          Get My Maps file + individual links for manual saving
                        </p>
                        <div className="space-y-1 text-sm text-gray-700">
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            Complete My Maps experience
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            Plus individual place links
                          </div>
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            Maximum flexibility
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                    </div>
                  </button>
                </div>
              )}

              {deliveryStep === 'mymaps' && (
                <div className="p-6 space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-8 w-8 text-coral-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      My Maps - Complete Experience
                    </h3>
                    <p className="text-gray-600">
                      Get all {pins.length} places with descriptions in one organized map
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">How it works:</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-coral-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                        <p className="text-gray-700">We'll download a file with all your places</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-coral-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                        <p className="text-gray-700">We'll open Google My Maps for you</p>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-coral-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                        <p className="text-gray-700">Click "Import" and upload your downloaded file</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setDeliveryStep('options')}
                      className="flex-1 btn-secondary py-3"
                    >
                      Back
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await generateMyMapsKML()
                          openMyMapsImportPage()
                          setShowDeliveryModal(false)
                        } catch (error) {
                          console.log(error instanceof Error ? error.message : 'Failed to export')
                        }
                      }}
                      className="flex-2 btn-primary py-3 flex items-center justify-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download & Open My Maps
                    </button>
                  </div>
                </div>
              )}

              {deliveryStep === 'manual' && (
                <div className="p-6 space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Save to Google Maps
                    </h3>
                    <p className="text-gray-600">
                      Easy checklist to save all {pins.length} places individually
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-2xl p-6 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Quick Instructions:</h4>
                    <p className="text-gray-700 text-sm">
                      Tap each link below, then hit the "Save" button in Google Maps. 
                      We'll keep track of your progress!
                    </p>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {generateIndividualLinks().map((place, index) => (
                      <div
                        key={place.id}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          savedPlaces.includes(place.id)
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 mr-4">
                            <h5 className="font-medium text-gray-900 truncate">
                              {place.name}
                            </h5>
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {place.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {index + 1}/{pins.length}
                            </span>
                            <a
                              href={place.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => markPlaceAsSaved(place.id)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                savedPlaces.includes(place.id)
                                  ? 'bg-green-500 text-white'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                              }`}
                            >
                              {savedPlaces.includes(place.id) ? (
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Saved
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Save
                                </div>
                              )}
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium text-gray-900">
                        {savedPlaces.length} of {pins.length} places saved
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(savedPlaces.length / pins.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setDeliveryStep('options')}
                      className="flex-1 btn-secondary py-3"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setShowDeliveryModal(false)}
                      className="flex-1 btn-primary py-3"
                    >
                      {savedPlaces.length === pins.length ? 'All Done!' : 'Close'}
                    </button>
                  </div>
                </div>
              )}

              {deliveryStep === 'both' && (
                <div className="p-6 space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="h-8 w-8 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Best of Both Worlds
                    </h3>
                    <p className="text-gray-600">
                      Get everything - My Maps file plus individual links
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={async () => {
                        try {
                          await generateMyMapsKML()
                          openMyMapsImportPage()
                        } catch (error) {
                          console.log(error instanceof Error ? error.message : 'Failed to export')
                        }
                      }}
                      className="p-6 border-2 border-coral-200 bg-coral-50 hover:bg-coral-100 rounded-2xl text-left transition-colors"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <MapPin className="h-6 w-6 text-coral-500" />
                        <h4 className="font-semibold text-gray-900">My Maps</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Download file & open My Maps
                      </p>
                      <div className="flex items-center text-coral-600 text-sm font-medium">
                        <Download className="h-4 w-4 mr-1" />
                        Get My Maps File
                      </div>
                    </button>

                    <button
                      onClick={() => setDeliveryStep('manual')}
                      className="p-6 border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-2xl text-left transition-colors"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <Smartphone className="h-6 w-6 text-blue-500" />
                        <h4 className="font-semibold text-gray-900">Individual Links</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Save places one by one
                      </p>
                      <div className="flex items-center text-blue-600 text-sm font-medium">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Checklist
                      </div>
                    </button>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => setDeliveryStep('options')}
                      className="flex-1 btn-secondary py-3"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setShowDeliveryModal(false)}
                      className="flex-1 btn-primary py-3"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PayPal Modal for Pack Purchase */}
      {showPayPalModal && pack && (
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
                    src={getPackDisplayImage() || "/google-maps-bg.svg"}
                    alt="Pack thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  <div className="absolute bottom-1 right-1">
                    <span className="bg-black/50 backdrop-blur-sm text-white px-1 py-0.5 rounded text-xs font-medium">
                      {pins.length} pins
                    </span>
                  </div>
                </div>
                
                {/* Pack details */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{pack.title}</h3>
                  <p className="text-sm text-gray-600">{pack.city}, {pack.country}</p>
                  <div className="mt-2">
                    <span className="text-lg font-bold text-coral-600">
                      {pack.price === 0 ? 'Free' : `$${pack.price}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PayPal Checkout */}
            <div className="p-6">
              {pack.price > 0 ? (
                <PayPalCheckout
                  cartItems={[{
                    id: pack.id,
                    title: pack.title,
                    price: pack.price,
                    city: pack.city,
                    country: pack.country,
                    pin_count: pins.length
                  }]}
                  totalAmount={pack.price}
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

      {/* Payment Success Modal with Falling Pins */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        packsCount={purchasedPacksCount}
        onViewPacks={handleViewPacks}
        onKeepBrowsing={handleKeepBrowsing}
      />

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

      {/* Gallery Modal */}
      <GalleryModal
        images={getOptimizedPackPhotos()}
        startIndex={galleryStartIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </div>
  )
} 
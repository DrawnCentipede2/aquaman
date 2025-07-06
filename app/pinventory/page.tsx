'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Download, Star, Calendar, Package, ExternalLink, X, CheckCircle, Smartphone, ChevronDown, ChevronRight, Share2, ChevronUp, Clock, Globe } from 'lucide-react'
import CloudLoader from '@/components/CloudLoader'
import { supabase } from '@/lib/supabase'
import type { PinPack } from '@/lib/supabase'
import { getPackDisplayImage } from '@/lib/utils'

export default function PinventoryPage() {
  const router = useRouter()
  
  // Authentication and user state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Pack data state
  const [purchasedPacks, setPurchasedPacks] = useState<PinPack[]>([])
  const [groupedPacks, setGroupedPacks] = useState<{[key: string]: PinPack[]}>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [packImages, setPackImages] = useState<{[key: string]: string}>({})
  
  // Country expansion state
  const [expandedCountries, setExpandedCountries] = useState<{[key: string]: boolean}>({})
  
  // Pack card expansion state
  const [expandedPacks, setExpandedPacks] = useState<{[key: string]: boolean}>({})
  const [packPinsData, setPackPinsData] = useState<{[key: string]: any[]}>({})
  
  // Enhanced delivery modal state
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [selectedPack, setSelectedPack] = useState<PinPack | null>(null)
  const [deliveryStep, setDeliveryStep] = useState<'options' | 'mymaps' | 'manual' | 'both'>('options')
  const [savedPlaces, setSavedPlaces] = useState<string[]>([])
  const [packPins, setPackPins] = useState<any[]>([])

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = () => {
      const userProfileData = localStorage.getItem('pinpacks_user_profile')
      if (userProfileData) {
        setUserProfile(JSON.parse(userProfileData))
        setIsAuthenticated(true)
      } else {
        setUserProfile(null)
        setIsAuthenticated(false)
      }
    }
    
    checkAuth()
  }, [])

  // Function to sync with database and clear localStorage cache
  const syncWithDatabase = async () => {
    try {
      setLoading(true)
      
      // Clear localStorage purchased packs
      localStorage.removeItem('pinpacks_purchased')
      console.log('Cleared localStorage cached packs')
      
      // Debug: Show what user profile we have
      console.log('Current user profile:', userProfile)
      console.log('User email for filtering:', userProfile?.email)
      
      // Reload from database only
      await loadPurchasedPacks()
      
    } catch (error) {
      console.error('Error syncing with database:', error)
      setError('Failed to sync with database')
    }
  }

  // Load purchased packs when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadPurchasedPacks()
    } else if (isAuthenticated === false) {
      // User is not authenticated, redirect to sign in
      router.push('/auth')
    }
  }, [isAuthenticated, router])

  // Group packs by country when purchasedPacks changes
  useEffect(() => {
    groupPacksByCountry()
  }, [purchasedPacks])

  // Load pack images when packs change
  useEffect(() => {
    const loadPackImages = async () => {
      const images: {[key: string]: string} = {}
      for (const pack of purchasedPacks) {
        const imageUrl = await getPackDisplayImage(pack.id)
        if (imageUrl) {
          images[pack.id] = imageUrl
        }
      }
      setPackImages(images)
    }
    
    if (purchasedPacks.length > 0) {
      loadPackImages()
    }
  }, [purchasedPacks])

  // Load purchased packs from database orders and localStorage (for backward compatibility)
  const loadPurchasedPacks = async () => {
    try {
      setLoading(true)
      
      // Get purchased pack IDs from both sources
      let purchasedPackIds: string[] = []
      
      // 1. Get from database orders (new PayPal purchases)
      // Only get orders for the current user's email
      const userEmail = userProfile?.email
      let databasePackIds: string[] = []
      
      console.log('🔍 Loading purchased packs for user email:', userEmail)
      
      if (userEmail) {
        console.log('🔍 Querying database for orders with email:', userEmail)
        
        try {
          // First try to find orders by user_email (PinCloud email)
          const { data: orderItems, error: orderError } = await supabase
            .from('order_items')
            .select(`
              pin_pack_id,
              orders!inner(status, user_email)
            `)
            .eq('orders.status', 'completed')
            .eq('orders.user_email', userEmail)
          
          console.log('🔍 Database query result (user_email):', { orderItems, orderError })
          
          if (!orderError && orderItems) {
            databasePackIds = orderItems.map(item => item.pin_pack_id)
            console.log('🔍 Found database pack IDs (user_email):', databasePackIds)
          } else if (orderError) {
            console.error('Error fetching user orders by user_email:', orderError)
            
            // Fallback: try customer_email (PayPal email) if user_email doesn't work
            console.log('🔍 Trying fallback query with customer_email...')
            
            const { data: fallbackOrderItems, error: fallbackError } = await supabase
              .from('order_items')
              .select(`
                pin_pack_id,
                orders!inner(status, customer_email)
              `)
              .eq('orders.status', 'completed')
              .eq('orders.customer_email', userEmail)
            
            console.log('🔍 Fallback query result (customer_email):', { fallbackOrderItems, fallbackError })
            
            if (!fallbackError && fallbackOrderItems) {
              databasePackIds = fallbackOrderItems.map(item => item.pin_pack_id)
              console.log('🔍 Found database pack IDs (customer_email fallback):', databasePackIds)
            } else if (fallbackError) {
              console.error('Error fetching user orders by customer_email:', fallbackError)
              
              // If both queries fail, try direct orders query
              if (fallbackError.message.includes('relation') || fallbackError.message.includes('does not exist')) {
                console.log('🔍 Orders table might not exist, trying direct orders query...')
                
                const { data: directOrders, error: directError } = await supabase
                  .from('orders')
                  .select('id, customer_email, user_email, status')
                  .or(`user_email.eq.${userEmail},customer_email.eq.${userEmail}`)
                  .eq('status', 'completed')
                
                console.log('🔍 Direct orders query result:', { directOrders, directError })
                
                if (!directError && directOrders && directOrders.length > 0) {
                  // Get order items for these orders
                  const orderIds = directOrders.map(o => o.id)
                  const { data: directOrderItems, error: directItemsError } = await supabase
                    .from('order_items')
                    .select('pin_pack_id')
                    .in('order_id', orderIds)
                  
                  console.log('🔍 Direct order items result:', { directOrderItems, directItemsError })
                  
                  if (!directItemsError && directOrderItems) {
                    databasePackIds = directOrderItems.map(item => item.pin_pack_id)
                    console.log('🔍 Found database pack IDs (direct query):', databasePackIds)
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('🔍 Error in database query:', error)
        }
      } else {
        console.log('No user email found - skipping database orders')
      }
      
      purchasedPackIds.push(...databasePackIds)
      
      // 2. Get from localStorage (old purchases and free packs)
      const localStorageIds = JSON.parse(localStorage.getItem('pinpacks_purchased') || '[]')
      console.log('🔍 Found localStorage pack IDs:', localStorageIds)
      
      // Clean up invalid UUIDs from localStorage
      const validLocalIds = localStorageIds.filter((id: string) => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        return typeof id === 'string' && uuidRegex.test(id)
      })
      
      // Merge both sources and remove duplicates
      purchasedPackIds = Array.from(new Set([...purchasedPackIds, ...validLocalIds]))
      console.log('🔍 Final combined pack IDs:', purchasedPackIds)
      
      // Update localStorage if we found invalid UUIDs
      if (validLocalIds.length !== localStorageIds.length) {
        localStorage.setItem('pinpacks_purchased', JSON.stringify(validLocalIds))
        console.log(`Cleaned up ${localStorageIds.length - validLocalIds.length} invalid pack IDs from localStorage`)
      }
      
      if (purchasedPackIds.length === 0) {
        console.log('🔍 No purchased pack IDs found')
        setPurchasedPacks([])
        setGroupedPacks({})
        setLoading(false)
        return
      }

      // Fetch pack details from database
      console.log('🔍 Fetching pack details for IDs:', purchasedPackIds)
      const { data: packsData, error: packsError } = await supabase
        .from('pin_packs')
        .select('*')
        .in('id', purchasedPackIds)

      console.log('🔍 Pack details result:', { packsData, packsError })

      if (packsError) throw packsError

      setPurchasedPacks(packsData || [])
      
    } catch (err) {
      console.error('Error loading purchased packs:', err)
      setError('Failed to load your purchased packs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Group packs by country
  const groupPacksByCountry = () => {
    const grouped: {[key: string]: PinPack[]} = {}
    
    purchasedPacks.forEach(pack => {
      const country = pack.country
      if (!grouped[country]) {
        grouped[country] = []
      }
      grouped[country].push(pack)
    })
    
    // Sort packs within each country by title
    Object.keys(grouped).forEach(country => {
      grouped[country].sort((a, b) => a.title.localeCompare(b.title))
    })
    
    setGroupedPacks(grouped)
    
    // Auto-expand countries if there are only a few
    const countries = Object.keys(grouped)
    if (countries.length <= 3) {
      const expanded: {[key: string]: boolean} = {}
      countries.forEach(country => {
        expanded[country] = true
      })
      setExpandedCountries(expanded)
    }
  }

  // Toggle country expansion
  const toggleCountry = (country: string) => {
    setExpandedCountries(prev => ({
      ...prev,
      [country]: !prev[country]
    }))
  }

  // Toggle pack expansion and load pins if needed
  const togglePackExpansion = async (packId: string) => {
    const isCurrentlyExpanded = expandedPacks[packId]
    
    setExpandedPacks(prev => ({
      ...prev,
      [packId]: !isCurrentlyExpanded
    }))

    // Load pins if expanding and not already loaded
    if (!isCurrentlyExpanded && !packPinsData[packId]) {
      await loadPackPins(packId)
    }
  }

  // Load pins for a specific pack
  const loadPackPins = async (packId: string) => {
    try {
      const { data: packPinsResult, error: pinsError } = await supabase
        .from('pin_pack_pins')
        .select(`
          pins (
            id,
            title,
            description,
            google_maps_url,
            category,
            latitude,
            longitude
          )
        `)
        .eq('pin_pack_id', packId)

      if (pinsError) throw pinsError

      const pinsData = packPinsResult?.map((item: any) => ({
        id: item.pins.id,
        name: item.pins.title,
        title: item.pins.title,
        description: item.pins.description,
        google_maps_url: item.pins.google_maps_url,
        category: item.pins.category,
        latitude: item.pins.latitude,
        longitude: item.pins.longitude
      })) || []
      
      setPackPinsData(prev => ({
        ...prev,
        [packId]: pinsData
      }))
      
    } catch (error) {
      console.error('Error loading pack pins:', error)
    }
  }

  // Share pack functionality
  const sharePack = async (pack: PinPack) => {
    const shareUrl = `${window.location.origin}/pack/${pack.id}`
    const shareText = `Check out "${pack.title}" - ${pack.pin_count} amazing places in ${pack.city}, ${pack.country}!`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: pack.title,
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
        alert('Pack details copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy:', error)
        alert('Unable to copy. Please share manually: ' + shareUrl)
      }
    }
  }

  // Open pack in Google Maps (prioritize maps list reference if available)
  const openInGoogleMaps = (pack: PinPack) => {
    // First, check if pack has a maps list reference
    if (pack.maps_list_reference) {
      try {
        const mapsListData = typeof pack.maps_list_reference === 'string' 
          ? JSON.parse(pack.maps_list_reference)
          : pack.maps_list_reference
        
        if (mapsListData?.original_url) {
          // Redirect to the original Google Maps list
          window.open(mapsListData.original_url, '_blank')
          return
        }
      } catch (error) {
        console.error('Error parsing maps list reference:', error)
        // Fall through to default behavior
      }
    }
    
    // Fallback to the original behavior if no maps list reference
    const pins = packPinsData[pack.id] || []
    if (pins.length > 0) {
      const placesQuery = pins
        .map(pin => `${pin.name}, ${pack.city}`)
        .join(' | ')
      
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(placesQuery)}`
      window.open(mapsUrl, '_blank')
    } else {
      // Fallback to city search
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(pack.city + ', ' + pack.country)}`
      window.open(mapsUrl, '_blank')
    }
  }

  // Handle "Get Your Places" button click
  const handleGetPlaces = async (pack: PinPack) => {
    setSelectedPack(pack)
    
    // Load pins for this pack
    try {
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
            longitude
          )
        `)
        .eq('pin_pack_id', pack.id)

      if (pinsError) throw pinsError

      const pinsData = packPinsData?.map((item: any) => ({
        id: item.pins.id,
        name: item.pins.title,
        title: item.pins.title,
        description: item.pins.description,
        google_maps_url: item.pins.google_maps_url,
        category: item.pins.category,
        latitude: item.pins.latitude,
        longitude: item.pins.longitude
      })) || []
      
      setPackPins(pinsData)
      setShowDeliveryModal(true)
      
    } catch (err) {
      console.error('Error loading pack pins:', err)
      alert('Failed to load pack details. Please try again.')
    }
  }

  // Generate My Maps KML file
  const generateMyMapsKML = async () => {
    if (!selectedPack || packPins.length === 0) {
      throw new Error('No pack selected or no pins available')
    }

    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${selectedPack.title}</name>
    <description>${selectedPack.description}</description>
    ${packPins.map((pin, index) => `
    <Placemark>
      <name>${pin.name}</name>
      <description>${pin.description || 'No description available'}</description>
      <Point>
        <coordinates>${pin.longitude},${pin.latitude},0</coordinates>
      </Point>
    </Placemark>`).join('')}
  </Document>
</kml>`

    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedPack.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.kml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Generate individual Google Maps links
  const generateIndividualLinks = () => {
    return packPins.map(pin => ({
      id: pin.id,
      name: pin.name,
      description: pin.description,
      googleMapsUrl: pin.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pin.name)}`
    }))
  }

  // Open My Maps import page
  const openMyMapsImportPage = () => {
    window.open('https://www.google.com/maps/d/', '_blank')
  }

  // Mark place as saved (for individual links flow)
  const markPlaceAsSaved = (placeId: string) => {
    setSavedPlaces(prev => [...prev, placeId])
  }

  // Debug function to add test packs for testing purposes
  const addTestPack = async () => {
    try {
      // First, let's get an actual pack ID from the database
      const { data: packs, error } = await supabase
        .from('pin_packs')
        .select('id, title')
        .limit(1)

      if (error) throw error

      if (packs && packs.length > 0) {
        const testPackId = packs[0].id
        const existingPurchases = JSON.parse(localStorage.getItem('pinpacks_purchased') || '[]')
        
        if (!existingPurchases.includes(testPackId)) {
          const newPurchases = [...existingPurchases, testPackId]
          localStorage.setItem('pinpacks_purchased', JSON.stringify(newPurchases))
          
          // Reload the purchased packs
          loadPurchasedPacks()
          
          console.log(`Added test pack "${packs[0].title}" to your Pinventory!`)
        } else {
          console.log('This pack is already in your Pinventory!')
        }
      } else {
        console.log('No packs found in database. Please create a pack first by going to /create')
      }
    } catch (error) {
      console.error('Error adding test pack:', error)
    }
  }

  // Debug function to create a test order in the database
  const createTestOrder = async () => {
    try {
      // Get user email
      const userEmail = userProfile?.email
      if (!userEmail) {
        alert('No user email found. Please sign in first.')
        return
      }

      // Get a test pack
      const { data: packs, error } = await supabase
        .from('pin_packs')
        .select('id, title, price')
        .limit(1)

      if (error) throw error

      if (packs && packs.length > 0) {
        const testPack = packs[0]
        
        // Create order
        const createOrderResponse = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cartItems: [{
              id: testPack.id,
              title: testPack.title,
              price: testPack.price,
              city: 'Test City',
              country: 'Test Country',
              pin_count: 5
            }],
            totalAmount: testPack.price,
            processingFee: 0.50,
            userLocation: 'Test Location',
            userIp: '127.0.0.1',
            customerEmail: userEmail
          })
        })

        if (createOrderResponse.ok) {
          const { order } = await createOrderResponse.json()
          
          // Complete the order
          const completeOrderResponse = await fetch('/api/orders/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: order.id,
              paypalOrderId: 'test-order-' + Date.now(),
              paypalPayerId: 'test-payer-' + Date.now(),
              paypalPaymentId: 'test-payment-' + Date.now(),
              customerEmail: userEmail,
              customerName: 'Test User',
              paymentDetails: { test: true }
            })
          })

          if (completeOrderResponse.ok) {
            alert(`Test order created successfully! Order ID: ${order.id}`)
            // Reload purchased packs
            loadPurchasedPacks()
          } else {
            alert('Failed to complete test order')
          }
        } else {
          alert('Failed to create test order')
        }
      } else {
        alert('No packs found in database')
      }
    } catch (error) {
      console.error('Error creating test order:', error)
      alert('Error creating test order: ' + error)
    }
  }

  // Debug function to check database directly
  const checkDatabase = async () => {
    try {
      const userEmail = userProfile?.email
      if (!userEmail) {
        alert('No user email found. Please sign in first.')
        return
      }

      console.log('🔍 Checking database for user email:', userEmail)

      // Check if orders table exists and has data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .or(`user_email.eq.${userEmail},customer_email.eq.${userEmail}`)

      console.log('🔍 Orders for user:', { orders, ordersError })

      if (ordersError) {
        alert('Error checking orders: ' + ordersError.message)
        return
      }

      if (orders && orders.length > 0) {
        // Check order items for these orders
        const orderIds = orders.map(o => o.id)
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', orderIds)

        console.log('🔍 Order items:', { orderItems, itemsError })

        if (itemsError) {
          alert('Error checking order items: ' + itemsError.message)
          return
        }

        const packIds = orderItems?.map(item => item.pin_pack_id) || []
        console.log('🔍 Pack IDs from orders:', packIds)

        if (packIds.length > 0) {
          const { data: packs, error: packsError } = await supabase
            .from('pin_packs')
            .select('id, title')
            .in('id', packIds)

          console.log('🔍 Packs found:', { packs, packsError })
          alert(`Found ${orders.length} orders, ${orderItems?.length || 0} items, ${packs?.length || 0} packs`)
        } else {
          alert(`Found ${orders.length} orders but no order items`)
        }
      } else {
        alert('No orders found for this user')
      }
    } catch (error) {
      console.error('Error checking database:', error)
      alert('Error checking database: ' + error)
    }
  }

  // Debug function to link existing orders to PinCloud email
  const linkExistingOrders = async () => {
    try {
      const userEmail = userProfile?.email
      if (!userEmail) {
        alert('No user email found. Please sign in first.')
        return
      }

      console.log('🔗 Linking existing orders to PinCloud email:', userEmail)

      // Find orders that have customer_email but no user_email
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, customer_email, user_email')
        .is('user_email', null)
        .not('customer_email', 'is', null)

      console.log('🔗 Orders to link:', { orders, ordersError })

      if (ordersError) {
        alert('Error finding orders to link: ' + ordersError.message)
        return
      }

      if (orders && orders.length > 0) {
        // Update these orders to set user_email
        const { error: updateError } = await supabase
          .from('orders')
          .update({ user_email: userEmail })
          .is('user_email', null)

        if (updateError) {
          alert('Error updating orders: ' + updateError.message)
          return
        }

        alert(`Successfully linked ${orders.length} orders to your PinCloud email!`)
        
        // Reload purchased packs
        loadPurchasedPacks()
      } else {
        alert('No orders found that need linking')
      }
    } catch (error) {
      console.error('Error linking orders:', error)
      alert('Error linking orders: ' + error)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
                  <CloudLoader size="lg" text="Loading your collection..." />
        </div>
      </div>
    )
  }

  // Show authentication required message
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-100 mb-6">
            <Package className="h-8 w-8 text-coral-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in required</h3>
          <p className="text-gray-600 text-lg mb-8">Please sign in to view your purchased packs.</p>
          <button 
            onClick={() => router.push('/auth')}
            className="btn-primary"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Your Pinventory
              </h1>
              <p className="text-gray-600 text-lg">
                All your purchased pin packs in one place
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-coral-500">
                  {Object.keys(groupedPacks).length}
                </div>
                <div className="text-sm text-gray-500">
                  {Object.keys(groupedPacks).length === 1 ? 'country' : 'countries'} available
                </div>
              </div>
              <button
                onClick={syncWithDatabase}
                disabled={loading}
                className="btn-secondary flex items-center text-sm px-4 py-2"
                title="Clear cache and sync with database records only"
              >
                <Package className="h-4 w-4 mr-2" />
                {loading ? 'Syncing...' : 'Sync with DB'}
              </button>
            </div>
          </div>
        </div>

        {/* Country Grouped Packs */}
        {Object.keys(groupedPacks).length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-6">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No packs purchased yet</h3>
            <p className="text-gray-600 mb-8">
              Start exploring and purchase your first pin pack to see it here!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/browse')}
                className="btn-primary"
              >
                Browse Pin Packs
              </button>
              <button
                onClick={syncWithDatabase}
                disabled={loading}
                className="btn-secondary"
                title="Clear cache and reload only database purchases"
              >
                <Package className="h-4 w-4 mr-2" />
                {loading ? 'Syncing...' : 'Sync with Database'}
              </button>
              <button
                onClick={addTestPack}
                className="btn-secondary"
              >
                Add Test Pack (Debug)
              </button>
              <button
                onClick={createTestOrder}
                className="btn-secondary"
              >
                Create Test Order (Debug)
              </button>
              <button
                onClick={checkDatabase}
                className="btn-secondary"
              >
                Check Database (Debug)
              </button>
              <button
                onClick={linkExistingOrders}
                className="btn-secondary"
              >
                Link Existing Orders (Debug)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(groupedPacks).sort().map((country) => (
              <div key={country} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Country Header */}
                <button
                  onClick={() => toggleCountry(country)}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left border-b border-gray-200"
                >
                  <div className="flex items-center">
                    <div className="flex items-center mr-4">
                      <MapPin className="h-5 w-5 text-coral-500 mr-2" />
                      <h2 className="text-xl font-semibold text-gray-900">{country}</h2>
                    </div>
                    <span className="bg-coral-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                      {groupedPacks[country].length} {groupedPacks[country].length === 1 ? 'pack' : 'packs'}
                    </span>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                    expandedCountries[country] ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Country Packs */}
                {expandedCountries[country] && (
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {groupedPacks[country].map((pack) => {
                        return (
                          <div 
                            key={pack.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 group relative"
                          >
                            
                            {/* Big hover pin */}
                            <div className="absolute top-4 right-4 pointer-events-none z-10">
                              <MapPin className="w-12 h-12 text-coral-500 opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                            </div>

                            {/* Clickable Pack Card */}
                            <div className="p-6 relative z-20">
                              {/* Header with thumbnail and basic info */}
                              <div className="flex items-start space-x-4 mb-4">
                                {/* Thumbnail */}
                                <div className="w-16 h-16 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                                  <img 
                                    src={packImages[pack.id] || "/google-maps-bg.svg"}
                                    alt="Pack thumbnail"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                                  <div className="absolute bottom-1 right-1">
                                    <span className="bg-black/50 backdrop-blur-sm text-white px-1 py-0.5 rounded text-xs font-medium">
                                      {pack.pin_count}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Pack info */}
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                                    {pack.title}
                                  </h3>
                                  <div className="flex items-center text-gray-600 mb-2">
                                    <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                                    <span className="text-sm">{pack.city}, {pack.country} • {pack.pin_count} places</span>
                                  </div>
                                  <div className="flex items-center text-xs text-gray-500 mb-1">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Added {new Date(pack.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="mt-4 flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openInGoogleMaps(pack)
                                  }}
                                  className="flex-1 btn-secondary text-xs py-2 flex items-center justify-center"
                                >
                                  <MapPin className="h-3 w-3 mr-1" />
                                  Maps
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.location.href = `/pinventory/${pack.id}`
                                  }}
                                  className="flex-1 btn-primary text-xs py-2 flex items-center justify-center"
                                >
                                  <Package className="h-3 w-3 mr-1" />
                                  Details
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Delivery Modal */}
      {showDeliveryModal && selectedPack && (
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
                      className="w-full p-6 border-2 border-coral-200 bg-coral-50 hover:bg-coral-100 rounded-2xl text-left transition-colors"
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
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Option 2: Regular Google Maps */}
                  <button
                    onClick={() => setDeliveryStep('manual')}
                    className="w-full p-6 border-2 border-gray-200 hover:border-gray-300 rounded-2xl text-left transition-colors"
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
                        </div>
                      </div>
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
                      Get all {packPins.length} places with descriptions in one organized map
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
                          alert(error instanceof Error ? error.message : 'Failed to export')
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
                      Easy checklist to save all {packPins.length} places individually
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
                              {index + 1}/{packPins.length}
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
                        {savedPlaces.length} of {packPins.length} places saved
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(savedPlaces.length / packPins.length) * 100}%` }}
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
                      {savedPlaces.length === packPins.length ? 'All Done!' : 'Close'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
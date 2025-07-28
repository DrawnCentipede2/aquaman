'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, Save, ArrowLeft, Trash2, Plus, Upload, DollarSign, FileText, Image, X, Tag, Search, Download, Heart } from 'lucide-react'
import CloudLoader from '@/components/CloudLoader'
import { supabase } from '@/lib/supabase'
import type { PinPack } from '@/lib/supabase'
import { getPackDisplayImage } from '@/lib/utils'
import { STANDARD_CATEGORIES } from '@/lib/categories'
import { useToast } from '@/components/ui/toast'
import { Toaster } from '@/components/ui/toaster'
import { logger } from '@/lib/logger'

export default function EditPackPage() {
  const params = useParams()
  const router = useRouter()
  const packId = params.id as string
  const { showToast } = useToast()
  
  // File input ref for image uploads
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State for the pack being edited
  const [pack, setPack] = useState<PinPack | null>(null)
  const [pins, setPins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [packImage, setPackImage] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    city: '',
    country: '',
    creator_location: ''
  })

  // Category state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Available categories for packs - now using standardized categories
  const availableCategories = STANDARD_CATEGORIES

  // Photo editing state
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [mainImageIndex, setMainImageIndex] = useState<number>(-1)

  // Places editing state
  const [placesInput, setPlacesInput] = useState('')
  const [isFetchingPlaceDetails, setIsFetchingPlaceDetails] = useState(false)

  // Google Maps list editing state
  const [googleMapsList, setGoogleMapsList] = useState<{
    id: string
    title: string
    url: string
    description: string
  } | null>(null)
  const [googleMapsListUrl, setGoogleMapsListUrl] = useState('')

  // Number of places state
  const [numberOfPlaces, setNumberOfPlaces] = useState('')

  // Load pack details when component mounts
  useEffect(() => {
    if (packId) {
      loadPackDetails()
    }
  }, [packId])

  // Load pack details and pins
  const loadPackDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get the pack details
      const { data: packData, error: packError } = await supabase
        .from('pin_packs')
        .select('*')
        .eq('id', packId)
        .single()

      if (packError) throw packError
      if (!packData) throw new Error('Pack not found')

      setPack(packData)
      setFormData({
        title: packData.title || '',
        description: packData.description || '',
        price: packData.price || 0,
        city: packData.city || '',
        country: packData.country || '',
        creator_location: packData.creator_location || ''
      })

      // Load existing categories
      setSelectedCategories(packData.categories || [])

      // Load number of places
      setNumberOfPlaces(packData.pin_count?.toString() || '')

      // Load pack image
      const imageUrl = await getPackDisplayImage(packId)
      setPackImage(imageUrl)

      // Load existing photos (you'll need to implement this based on your photo storage)
      // For now, we'll set an empty array and let users add new photos
      setUploadedImages([])
      setMainImageIndex(-1)

      // Load pins for this pack
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
            created_at
          )
        `)
        .eq('pin_pack_id', packId)

      if (pinsError) {
        logger.warn('Error loading pins:', pinsError)
        setPins([])
      } else {
        const pinsData = packPinsData?.map((item: any) => ({
          id: item.pins.id,
          title: item.pins.title,
          description: item.pins.description,
          google_maps_url: item.pins.google_maps_url,
          category: item.pins.category,
          latitude: item.pins.latitude,
          longitude: item.pins.longitude,
          created_at: item.pins.created_at
        })) || []
        
        setPins(pinsData)
      }

    } catch (error) {
      logger.error('Error loading pack:', error)
      setError('Failed to load pack details')
    } finally {
      setLoading(false)
    }
  }

  // Handle form input changes
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Category selection functions
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        // Remove category if already selected
        return prev.filter(c => c !== category)
      } else {
        // Add category if not already selected and under limit
        if (prev.length < 3) {
          return [...prev, category]
        }
        return prev // Don't add if already at limit
      }
    })
  }

  const removeCategory = (categoryToRemove: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== categoryToRemove))
  }

  // Photo handling functions
  const handleImageUpload = (files: FileList | null) => {
    if (!files) return
    
    setIsUploading(true)
    const newImages: string[] = []
    let processedCount = 0
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          newImages.push(result)
          processedCount++
          
          if (processedCount === files.length) {
            setUploadedImages(prev => {
              const updatedImages = [...prev, ...newImages].slice(0, 10) // Max 10 images
              
              // Automatically set the first image as main if no main image is selected
              if (mainImageIndex === -1 && updatedImages.length > 0) {
                setMainImageIndex(0)
              }
              
              return updatedImages
            })
            setIsUploading(false)
          }
        }
        reader.readAsDataURL(file)
      } else {
        processedCount++
        if (processedCount === files.length) {
          setIsUploading(false)
        }
      }
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleImageUpload(e.dataTransfer.files)
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const updatedImages = prev.filter((_, i) => i !== index)
      
      // Adjust main image index if needed
      if (mainImageIndex === index) {
        // If main image was removed, set the first remaining image as main
        if (updatedImages.length > 0) {
          setMainImageIndex(0)
        } else {
          setMainImageIndex(-1) // No images left
        }
      } else if (mainImageIndex > index) {
        // If main image is after the removed image, adjust the index
        setMainImageIndex(mainImageIndex - 1)
      }
      
      return updatedImages
    })
  }

  const setMainImage = (index: number) => {
    setMainImageIndex(index)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  // Place fetching functions
  const fetchPlaceDetails = async (url: string) => {
    try {
      // Extract place ID from Google Maps URL
      const placeId = extractQueryFromUrl(url)
      if (!placeId) return null

      // Call Google Places API (you'll need to implement this)
      const response = await fetch(`/api/places/details?placeId=${placeId}`)
      if (!response.ok) return null

      const data = await response.json()
      return data
    } catch (error) {
      logger.error('Error fetching place details:', error)
      return null
    }
  }

  const extractQueryFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url)
      
      // Handle different Google Maps URL formats
      if (urlObj.hostname === 'maps.app.goo.gl') {
        // Short URL - we'll need to follow the redirect
        return null // For now, return null as we need to handle redirects
      }
      
      if (urlObj.hostname.includes('google.com') && urlObj.pathname.includes('/maps/place/')) {
        // Regular Google Maps URL
        const pathParts = urlObj.pathname.split('/')
        const placeIndex = pathParts.findIndex(part => part === 'place')
        if (placeIndex !== -1 && pathParts[placeIndex + 1]) {
          return pathParts[placeIndex + 1]
        }
      }
      
      return null
    } catch (error) {
      logger.error('Error extracting place ID:', error)
      return null
    }
  }

  const isUrlAlreadyImported = (url: string): boolean => {
    return pins.some(pin => pin.google_maps_url === url)
  }

  const handlePlacesInputChange = (value: string) => {
    setPlacesInput(value)
  }

  const addSinglePlace = async () => {
    if (!placesInput.trim()) return

    // Check if URL is already imported
    if (isUrlAlreadyImported(placesInput)) {
      showToast('This place has already been imported. Please try a different URL.', 'info')
      return
    }

    setIsFetchingPlaceDetails(true)
    try {
      // Fetch place details from Google Maps API
      const placeDetails = await fetchPlaceDetails(placesInput)
      
      let pinData: any
      
      if (placeDetails) {
        // Use fetched data from Google Maps API
        pinData = {
          title: placeDetails.name || 'Imported Place',
          description: placeDetails.formatted_address || 'Place imported from Google Maps',
          google_maps_url: placesInput,
          category: 'other',
          latitude: placeDetails.geometry?.location?.lat || 0,
          longitude: placeDetails.geometry?.location?.lng || 0,
          rating: placeDetails.rating,
          rating_count: placeDetails.user_ratings_total,
          business_type: placeDetails.types?.[0] || 'establishment'
        }
      } else {
        // Fallback to basic pin if API fails
        pinData = {
          title: 'Imported Place',
          description: 'Place imported from Google Maps',
          google_maps_url: placesInput,
          category: 'other',
          latitude: 0,
          longitude: 0
        }
      }
      
      setPins(prev => [...prev, pinData])
      setPlacesInput('')
      showToast('Place imported successfully!', 'success')
      
    } catch (error) {
      logger.error('Error adding place:', error)
      showToast('Error importing place. Please try again.', 'error')
    } finally {
      setIsFetchingPlaceDetails(false)
    }
  }

  // Google Maps list functions
  const isGoogleMapsListUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      // Check if it's a Google Maps short URL (maps.app.goo.gl)
      if (urlObj.hostname === 'maps.app.goo.gl') {
        return true
      }
      // Check if it's a regular Google Maps URL with list indicators
      if (urlObj.hostname.includes('google') && urlObj.pathname.includes('maps')) {
        // Look for list indicators in the URL
        const listIndicators = ['/list/', '/saved/', '/collections/']
        return listIndicators.some(indicator => urlObj.pathname.includes(indicator))
      }
      return false
    } catch (error) {
      return false
    }
  }

  const importFromGoogleMapsList = async () => {
    if (!googleMapsListUrl.trim()) return

    // Validate that it's a Google Maps list URL
    if (!isGoogleMapsListUrl(googleMapsListUrl)) {
      showToast('This doesn\'t look like a Google Maps list URL. Please use a list URL like maps.app.goo.gl/...', 'error')
      return
    }

    // Check if list URL is already imported
    const isListAlreadyImported = googleMapsList !== null
    if (isListAlreadyImported) {
      showToast('This Google Maps list has already been imported. Please try a different list.', 'info')
      return
    }

    try {
      // Create a new list entry
      const newList = {
        id: Date.now().toString(),
        title: 'Imported Google Maps List',
        url: googleMapsListUrl,
        description: 'List imported from Google Maps'
      }
      
      setGoogleMapsList(newList)
      setGoogleMapsListUrl('')
      showToast('Google Maps list imported successfully!', 'success')
      
    } catch (error) {
      logger.error('Error importing from list:', error)
      showToast('Error importing Google Maps list. Please try again.', 'error')
    }
  }

  const removeGoogleMapsList = () => {
    setGoogleMapsList(null)
  }

  // Save pack changes
  const saveChanges = async () => {
    // Validation checks
    if (!formData.title.trim()) {
      showToast('Please enter a pack title', 'error')
      return
    }

    if (!numberOfPlaces || Number(numberOfPlaces) < 1) {
      showToast('Please specify the number of places in your pack', 'error')
      return
    }

    if (uploadedImages.length === 0) {
      showToast('Please upload at least one photo for your pack', 'error')
      return
    }

    if (pins.length === 0) {
      showToast('Please add at least one place to your pack', 'error')
      return
    }

    if (pins.length !== Number(numberOfPlaces)) {
      showToast(`You specified ${numberOfPlaces} places but added ${pins.length} places. Please add the correct number of places.`, 'error')
      return
    }

    // Check that all places have valid Google Maps URLs
    const placesWithValidUrls = pins.filter(pin => pin.google_maps_url && pin.google_maps_url.trim() !== '')
    if (placesWithValidUrls.length !== Number(numberOfPlaces)) {
      const missingUrls = Number(numberOfPlaces) - placesWithValidUrls.length
      showToast(`Missing URLs for ${missingUrls} place(s). Please ensure all places have valid Google Maps URLs.`, 'error')
      return
    }

    if (!googleMapsList) {
      showToast('Please import a Google Maps list for your pack', 'error')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSaveSuccess(false)
      setSaveError(false)

      const { error } = await supabase
        .from('pin_packs')
        .update({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          city: formData.city,
          country: formData.country,
          creator_location: formData.creator_location,
          categories: selectedCategories,
          pin_count: Number(numberOfPlaces)
        })
        .eq('id', packId)

      if (error) throw error

      logger.log('Pack updated successfully! ')
      
      // Show success animation
      setSaveSuccess(true)
      
      // Hide success animation after 2 seconds
      setTimeout(() => {
        setSaveSuccess(false)
      }, 2000)
      
    } catch (error) {
      logger.error('Error saving changes:', error)
      setError('Failed to save changes. Please try again.')
      
      // Show error animation
      setSaveError(true)
      
      // Hide error animation after 2 seconds
      setTimeout(() => {
        setSaveError(false)
      }, 2000)
    } finally {
      setSaving(false)
    }
  }

  // Delete a pin from the pack
  const deletePin = async (pinId: string, pinTitle: string) => {
    const confirmed = confirm(`Are you sure you want to remove "${pinTitle}" from this pack?`)
    if (!confirmed) return

    try {
      // Remove the pin-pack relationship
      await supabase
        .from('pin_pack_pins')
        .delete()
        .eq('pin_pack_id', packId)
        .eq('pin_id', pinId)

      // Update local state
      setPins(pins.filter(pin => pin.id !== pinId))
      logger.log('Pin removed successfully!')
      
    } catch (error) {
      logger.error('Error deleting pin:', error)
      logger.log('Failed to remove pin. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
                  <CloudLoader size="lg" text="Loading pack details..." />
        </div>
      </div>
    )
  }

  if (error || !pack) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
            <FileText className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Pack</h3>
          <p className="text-gray-600 text-lg mb-8">{error || 'Pack not found or access denied.'}</p>
          <button 
            onClick={() => router.push('/manage')}
            className="btn-primary"
          >
            Back to Manage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-25">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/manage')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Manage
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={saveChanges}
                disabled={saving}
                className="btn-primary flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-top-2 duration-300">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Changes saved successfully!</span>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {saveError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-top-2 duration-300">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Failed to save changes. Please try again.</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Edit Form */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Basic Information */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FileText className="h-6 w-6 mr-3 text-coral-500" />
                Basic Information
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pack Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
                    placeholder="Enter pack title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
                    placeholder="Describe your pack..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
                      placeholder="City name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
                      placeholder="Country name..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
                        placeholder="0"
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Set to 0 for free packs</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Places
                    </label>
                    <input
                      type="number"
                      value={numberOfPlaces}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        if (inputValue === '' || (Number(inputValue) >= 1 && Number(inputValue) <= 20)) {
                          setNumberOfPlaces(inputValue)
                        }
                      }}
                      min="1"
                      max="20"
                      step="1"
                      placeholder="5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coral-500 focus:border-coral-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <p className="text-sm text-gray-500 mt-2">Maximum 20 places</p>
                  </div>
                </div>

                {/* Categories Section */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-coral-500" />
                    Categories
                  </label>
                  <p className="text-sm text-gray-500 mb-4">Select up to 3 categories that best describe your pack</p>
                  
                  {/* Available Categories */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleCategoryToggle(category)}
                        disabled={selectedCategories.length >= 3 && !selectedCategories.includes(category)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                          selectedCategories.includes(category)
                            ? 'bg-coral-500 text-white border-coral-500'
                            : selectedCategories.length >= 3 && !selectedCategories.includes(category)
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-coral-300'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  
                  {selectedCategories.length >= 3 && (
                    <p className="text-sm text-gray-500 mt-2">Maximum 3 categories selected</p>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Editing Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Image className="h-6 w-6 mr-3 text-coral-500" />
                Photos
              </h2>
              
              {/* Main Upload Area */}
              <div 
                className={`border-2 border-dashed border-sky-200 bg-sky-50 rounded-xl mb-6 cursor-pointer hover:border-sky-300 hover:bg-sky-100 transition-colors ${
                  mainImageIndex >= 0 && uploadedImages[mainImageIndex] 
                    ? 'p-0 h-96' // No padding, fixed height when showing main image
                    : 'p-12 text-center' // Padding and center text when showing upload interface
                }`}
                onClick={openFileDialog}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <svg className="h-8 w-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Uploading...</h3>
                  </div>
                ) : mainImageIndex >= 0 && uploadedImages[mainImageIndex] ? (
                  // Show main image
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <img 
                      src={uploadedImages[mainImageIndex]} 
                      alt="Main image"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="bg-white bg-opacity-90 rounded-lg px-4 py-2">
                        <p className="text-sm font-medium text-gray-900">Click to upload more images</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full px-2 py-1">
                      <span className="text-xs font-medium text-gray-900">Main</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Images</h3>
                    <p className="text-gray-500 text-sm">or Drag & Drop</p>
                  </>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
              />

              {/* Image Grid */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className={`w-full h-24 object-cover rounded-lg cursor-pointer transition-all ${
                          mainImageIndex === index 
                            ? 'ring-2 ring-coral-500 ring-offset-2' 
                            : 'hover:opacity-80'
                        }`}
                        onClick={() => setMainImage(index)}
                      />
                      
                      {/* Remove button */}
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      
                      {/* Main image indicator */}
                      {mainImageIndex === index && (
                        <div className="absolute top-1 left-1 bg-coral-500 text-white text-xs px-2 py-1 rounded-full">
                          Main
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>



            {/* Google Maps List Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Download className="h-6 w-6 mr-3 text-coral-500" />
                Google Maps List
              </h2>
              
              {!googleMapsList ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Maps List URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={googleMapsListUrl}
                      onChange={(e) => setGoogleMapsListUrl(e.target.value)}
                      placeholder="Paste Google Maps list URL..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
                    />
                    <button
                      onClick={importFromGoogleMapsList}
                      className="px-4 py-3 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
                    >
                      Import
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{googleMapsList.title}</h4>
                      <p className="text-sm text-gray-600">{googleMapsList.description}</p>
                    </div>
                    <button
                      onClick={removeGoogleMapsList}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Places in Pack */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <MapPin className="h-6 w-6 mr-3 text-coral-500" />
                  Places in Pack ({pins.length})
                </h2>
              </div>

              {/* Add Places Section */}
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Places</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={placesInput}
                    onChange={(e) => handlePlacesInputChange(e.target.value)}
                    placeholder="Paste Google Maps place URL..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
                  />
                  <button
                    onClick={addSinglePlace}
                    disabled={isFetchingPlaceDetails || !placesInput.trim()}
                    className="px-4 py-3 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isFetchingPlaceDetails ? (
                      <>
                        <svg className="h-4 w-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Place
                      </>
                    )}
                  </button>
                </div>
              </div>

              {pins.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No places yet</h3>
                  <p className="text-gray-500 mb-6">Add some amazing places to your pack using the form above</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pins.map((pin, index) => (
                    <div key={pin.id} className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-coral-500 text-white rounded-full text-xs font-bold">
                              {index + 1}
                            </span>
                            <h4 className="text-lg font-medium text-gray-900 truncate">
                              {pin.title}
                            </h4>
                          </div>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {pin.description || 'No description'}
                          </p>
                          {pin.google_maps_url && (
                            <a
                              href={pin.google_maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-coral-500 hover:text-coral-600 text-sm font-medium"
                            >
                              View on Google Maps →
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => deletePin(pin.id, pin.title)}
                          className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Pack Preview */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pack Preview</h3>
              
              {/* Preview Card */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 relative">
                  <img 
                    src={packImage || "/google-maps-bg.svg"}
                    alt="Map background"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  
                  <div className="absolute top-2 left-2">
                    <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold text-gray-900">
                      {formData.price === 0 ? 'Free' : `$${formData.price}`}
                    </span>
                  </div>
                  
                  <div className="absolute bottom-2 right-2">
                    <span className="bg-coral-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                      {pins.length} places
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 truncate mb-1">
                    {formData.title || 'Untitled Pack'}
                  </h4>
                  <p className="text-sm text-gray-500 mb-2 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {formData.city || 'Unknown'}, {formData.country || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {formData.description || 'No description provided'}
                  </p>
                  
                  {/* Categories in Preview */}
                  {selectedCategories.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {selectedCategories.slice(0, 2).map((category) => (
                          <span
                            key={category}
                            className="inline-block px-2 py-1 rounded text-xs font-medium bg-coral-100 text-coral-800"
                          >
                            {category}
                          </span>
                        ))}
                        {selectedCategories.length > 2 && (
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            +{selectedCategories.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pack Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pack Statistics</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Downloads</span>
                  <span className="text-sm font-medium text-gray-900">{pack.download_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Places</span>
                  <span className="text-sm font-medium text-gray-900">{pins.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(pack.created_at).toLocaleDateString()}
                  </span>
                </div>

              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-gray-25 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h3>
              <p className="text-sm text-gray-700 mb-4">
                Permanently delete this pack. This action cannot be undone.
              </p>
              <button
                onClick={() => {
                  const confirmed = confirm(
                    `⚠️ Are you sure you want to delete "${pack.title}"?\n\n` +
                    `This will permanently remove the pack and all its data.\n` +
                    `This action cannot be undone!`
                  )
                  if (confirmed) {
                    // Redirect to manage page with delete action
                    router.push('/manage?delete=' + packId)
                  }
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Pack
              </button>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
} 
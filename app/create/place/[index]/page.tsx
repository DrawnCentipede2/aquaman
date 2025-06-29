'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { MapPin, Save, ArrowLeft, Upload, Globe, Star, Clock, Phone, ExternalLink, Trash2, ChevronUp, ChevronDown, Tag, Building, HelpCircle, X, Image as ImageIcon, Plus } from 'lucide-react'

// Interface for a single pin (same as in main create page)
interface Pin {
  title: string
  description: string
  google_maps_url: string
  category: string
  latitude: number
  longitude: number
  rating?: number
  rating_count?: number
  business_type?: string
  place_city?: string
  place_country?: string
  zip_code?: string
  address?: string
  phone?: string
  website?: string
  current_opening_hours?: {
    open_now: boolean
    weekday_text: string[]
  }
  business_status?: string
  reviews?: Array<{
    author_name: string
    rating: number
    text: string
    time: number
  }>
  photos?: string[]
  fetching?: boolean
  needs_manual_edit?: boolean
}

export default function IndividualPlacePage() {
  const router = useRouter()
  const params = useParams()
  const placeIndex = parseInt(params.index as string)
  
  const [pin, setPin] = useState<Pin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  // Add state for hiding/showing the overview section
  const [showOverview, setShowOverview] = useState(true)
  // Add state for showing help modal
  const [showHelpModal, setShowHelpModal] = useState(false)
  // Photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load the place data from localStorage on component mount
  useEffect(() => {
    const loadPlaceData = () => {
      try {
        const savedPins = localStorage.getItem('pinpacks_create_pins')
        if (savedPins) {
          const pins: Pin[] = JSON.parse(savedPins)
          if (pins[placeIndex]) {
            setPin(pins[placeIndex])
          } else {
            // Place not found, redirect back
            router.push('/create')
          }
        } else {
          // No pins found, redirect back
          router.push('/create')
        }
      } catch (error) {
        console.error('Error loading place data:', error)
        router.push('/create')
      } finally {
        setIsLoading(false)
      }
    }

    loadPlaceData()
  }, [placeIndex, router])

  // Update pin state - only allow updating description and photos
  const updatePin = (updatedPin: Partial<Pin>) => {
    if (!pin) return
    
    // Only allow updates to description and photos (user-editable content)
    const allowedUpdates = {
      description: updatedPin.description,
      photos: updatedPin.photos
    }
    
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
    )
    
    const newPin = { ...pin, ...filteredUpdates }
    setPin(newPin)
    
    // Save to localStorage immediately when user makes changes
    savePinToStorage(newPin)
  }

  // Helper function to save pin data to localStorage
  const savePinToStorage = (updatedPin: Pin) => {
    try {
      const savedPins = localStorage.getItem('pinpacks_create_pins')
      if (savedPins) {
        const pins: Pin[] = JSON.parse(savedPins)
        pins[placeIndex] = updatedPin
        localStorage.setItem('pinpacks_create_pins', JSON.stringify(pins))
        console.log('Pin saved successfully to localStorage', { placeIndex, title: updatedPin.title })
      } else {
        console.error('No saved pins found in localStorage - cannot save individual pin changes')
        console.log('You may need to go back to the main create page and re-add this place')
      }
    } catch (error) {
      console.error('Error saving place data:', error)
    }
  }

  // Save and go back to main page - now with proper saving
  const saveAndGoBack = () => {
    if (!pin) return
    
    setIsSaving(true)
    
    // Ensure the current pin data is saved
    savePinToStorage(pin)
    
    // Small delay to show saving state and ensure localStorage write completes
    setTimeout(() => {
      setIsSaving(false)
      router.push('/create')
    }, 800)
  }

  // Delete this place
  const deletePlace = () => {
    if (confirm('Are you sure you want to delete this place? This action cannot be undone.')) {
      try {
        const savedPins = localStorage.getItem('pinpacks_create_pins')
        if (savedPins) {
          const pins: Pin[] = JSON.parse(savedPins)
          pins.splice(placeIndex, 1) // Remove the place at this index
          localStorage.setItem('pinpacks_create_pins', JSON.stringify(pins))
        }
        router.push('/create')
      } catch (error) {
        console.error('Error deleting place:', error)
      }
    }
  }

  // Helper functions for display
  const formatBusinessStatus = (status: string) => {
    const statusMap: {[key: string]: { label: string, color: string }} = {
      'OPERATIONAL': { label: 'Open', color: 'text-green-600' },
      'CLOSED_TEMPORARILY': { label: 'Temporarily Closed', color: 'text-yellow-600' },
      'CLOSED_PERMANENTLY': { label: 'Permanently Closed', color: 'text-red-600' },
    }
    return statusMap[status] || { label: status || 'Unknown', color: 'text-gray-600' }
  }

  // Helper function to format category for display
  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Helper function to format opening hours
  const formatOpeningHours = (hours: { open_now: boolean, weekday_text: string[] }) => {
    if (!hours.weekday_text || hours.weekday_text.length === 0) {
      return hours.open_now ? 'Open now' : 'Closed now'
    }
    
    const today = new Date().getDay()
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const todayHours = hours.weekday_text.find(day => day.includes(dayNames[today]))
    
    return todayHours || (hours.open_now ? 'Open now' : 'Closed now')
  }

  // Photo upload helper functions
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Compress image to reduce payload size
  const compressImage = (file: File, maxWidth: number = 600, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img
        
        // Only resize if image is larger than maxWidth
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
          } else {
            if (height > maxWidth) {
              width = (width * maxWidth) / height
              height = maxWidth
            }
          }
        }
        
        // Set canvas dimensions
        canvas.width = width
        canvas.height = height
        
        // Draw image on canvas and compress
        ctx!.drawImage(img, 0, 0, width, height)
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploadingPhoto(true)
    
    try {
      const newPhotos: string[] = []
      
      // Process each selected file
      for (let i = 0; i < Math.min(files.length, 5); i++) { // Limit to 5 photos
        const file = files[i]
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`File "${file.name}" is not an image. Please select only image files.`)
          continue
        }
        
        // Validate file size (max 10MB before compression)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Please select images smaller than 10MB.`)
          continue
        }
        
        // Compress image to reduce payload size
        const compressedBase64 = await compressImage(file, 600, 0.7)
        newPhotos.push(compressedBase64)
      }
      
      if (newPhotos.length > 0) {
        const currentPhotos = pin?.photos || []
        const updatedPhotos = [...currentPhotos, ...newPhotos].slice(0, 5) // Max 5 photos total
        updatePin({ photos: updatedPhotos })
        
        if (newPhotos.length === 1) {
          alert(`✅ Photo uploaded and compressed successfully!`)
        } else {
          alert(`✅ ${newPhotos.length} photos uploaded and compressed successfully!`)
        }
      }
    } catch (error) {
      console.error('Error uploading photos:', error)
      alert('Error uploading photos. Please try again.')
    } finally {
      setIsUploadingPhoto(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removePhoto = (indexToRemove: number) => {
    if (!pin?.photos) return
    
    const updatedPhotos = pin.photos.filter((_, index) => index !== indexToRemove)
    updatePin({ photos: updatedPhotos })
  }

  const triggerPhotoUpload = () => {
    fileInputRef.current?.click()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-100 mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading place details...</p>
        </div>
      </div>
    )
  }

  if (!pin) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Place Not Found</h1>
          <p className="text-gray-600 mb-6">The place you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/create')}
            className="btn-primary"
          >
            Back to Create Pack
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-25">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header - Remove buttons from here */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {pin.title || 'Edit Place'}
          </h1>
          {pin.address && (
            <p className="text-gray-600 mt-1">{pin.address}</p>
          )}
        </div>

        <div className="space-y-8">
          
          {/* Enhanced Place Information Overview */}
          <div className="card-airbnb p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-coral-500" />
                Place Overview (From Google Maps)
              </h2>
              <button
                onClick={() => setShowOverview(!showOverview)}
                className="flex items-center text-coral-600 hover:text-coral-700 transition-colors"
              >
                {showOverview ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show Details
                  </>
                )}
              </button>
            </div>
            
            {showOverview && (
              <>
                {/* Main Stats Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {pin.rating && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Star className="h-5 w-5 text-yellow-400 mr-2" />
                        <span className="font-semibold">Rating</span>
                      </div>
                      <p className="text-lg font-bold text-coral-600">
                        {pin.rating}/5
                        {pin.rating_count && <span className="text-sm text-gray-600 ml-2">({pin.rating_count} reviews)</span>}
                      </p>
                    </div>
                  )}
                  
                  {pin.category && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Tag className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="font-semibold">Category</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCategory(pin.category)}
                      </p>
                    </div>
                  )}
                  
                  {pin.business_status && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Building className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="font-semibold">Status</span>
                      </div>
                      <p className={`font-medium ${formatBusinessStatus(pin.business_status).color}`}>
                        {formatBusinessStatus(pin.business_status).label}
                      </p>
                    </div>
                  )}
                  
                  {pin.current_opening_hours && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Clock className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="font-semibold">Hours</span>
                      </div>
                      <p className="text-sm">
                        {pin.current_opening_hours.open_now ? '🟢 Open now' : '🔴 Closed now'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Details */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Location Details */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-coral-500" />
                      Location Details
                    </h3>
                    <div className="text-sm space-y-1 ml-6">
                      {pin.address && <p><span className="font-medium">Address:</span> {pin.address}</p>}
                      {pin.place_city && <p><span className="font-medium">City:</span> {pin.place_city}</p>}
                      {pin.place_country && <p><span className="font-medium">Country:</span> {pin.place_country}</p>}
                      {pin.zip_code && <p><span className="font-medium">ZIP Code:</span> {pin.zip_code}</p>}
                    </div>
                  </div>

                  {/* Business Details */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <Building className="h-4 w-4 mr-2 text-coral-500" />
                      Business Details
                    </h3>
                    <div className="text-sm space-y-1 ml-6">
                      {pin.business_type && <p><span className="font-medium">Type:</span> {formatCategory(pin.business_type)}</p>}
                      {pin.phone && (
                        <p>
                          <span className="font-medium">Phone:</span>{' '}
                          <a href={`tel:${pin.phone}`} className="text-blue-600 hover:text-blue-800">
                            {pin.phone}
                          </a>
                        </p>
                      )}
                      {pin.website && (
                        <p>
                          <span className="font-medium">Website:</span>{' '}
                          <a
                            href={pin.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Visit Website
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Opening Hours Detail */}
                {pin.current_opening_hours && pin.current_opening_hours.weekday_text && pin.current_opening_hours.weekday_text.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 flex items-center mb-3">
                      <Clock className="h-4 w-4 mr-2 text-coral-500" />
                      Opening Hours
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 ml-6">
                      <div className="grid md:grid-cols-2 gap-2 text-sm">
                        {pin.current_opening_hours.weekday_text.map((dayHours, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="font-medium">{dayHours.split(': ')[0]}:</span>
                            <span>{dayHours.split(': ')[1] || 'Closed'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Links */}
                <div className="flex flex-wrap gap-3">
                  {pin.website && (
                    <a
                      href={pin.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Visit Website
                    </a>
                  )}
                  
                  {pin.google_maps_url && (
                    <a
                      href={pin.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      View on Google Maps
                    </a>
                  )}
                  
                  {pin.phone && (
                    <a
                      href={`tel:${pin.phone}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call {pin.phone}
                    </a>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Personal Recommendation - This is the main editable section */}
          <div className="card-airbnb p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Personal Recommendation</h2>
            
            <div>
              <div className="flex items-center mb-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Why are you recommending this place?
                </label>
                <button
                  onClick={() => setShowHelpModal(true)}
                  className="ml-2 text-gray-400 hover:text-coral-500 transition-colors"
                  title="Click for writing tips"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>
              
              <textarea
                value={pin.description}
                onChange={(e) => updatePin({ description: e.target.value })}
                placeholder="Share your personal insights!"
                rows={5}
                className="input-airbnb w-full resize-none"
              />
            </div>
          </div>

          {/* Photos Section */}
          <div className="card-airbnb p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Photos</h2>
              {pin.photos && pin.photos.length > 0 && (
                <span className="text-sm text-gray-500">
                  {pin.photos.length}/5 photos
                </span>
              )}
            </div>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
            />
            
            {/* Photo grid or upload area */}
            {pin.photos && pin.photos.length > 0 ? (
              <div className="space-y-4">
                {/* Existing photos grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {pin.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={photo}
                          alt={`Photo ${index + 1} of ${pin.title}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Remove button */}
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
                        title="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Add more photos button (if less than 5) */}
                  {pin.photos.length < 5 && (
                    <button
                      onClick={triggerPhotoUpload}
                      disabled={isUploadingPhoto}
                      className="aspect-square border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-coral-400 transition-colors flex flex-col items-center justify-center group disabled:opacity-50"
                    >
                      {isUploadingPhoto ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-coral-500"></div>
                      ) : (
                        <>
                          <Plus className="h-6 w-6 text-gray-400 group-hover:text-coral-500 mb-1" />
                          <span className="text-xs text-gray-500 group-hover:text-coral-600">Add Photo</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                {/* Upload instructions */}
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    💡 Add your own photos to help travelers see what to expect. Max 5 photos, 5MB each.
                  </p>
                </div>
              </div>
            ) : (
              /* Initial upload area when no photos */
              <div 
                onClick={triggerPhotoUpload}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 hover:border-coral-400 transition-colors cursor-pointer"
              >
                {isUploadingPhoto ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mb-4"></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Uploading Photos...</h3>
                    <p className="text-gray-600">Please wait while we process your images</p>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your Photos</h3>
                    <p className="text-gray-600 mb-4">
                      Share your own photos of this place to help travelers know what to expect
                    </p>
                    <div className="btn-secondary inline-flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Photos
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      Supports JPG, PNG, WebP • Max 5 photos • 5MB per photo
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Reviews Preview (if available) */}
          {pin.reviews && pin.reviews.length > 0 && (
            <div className="card-airbnb p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Reviews from Google</h2>
              
              <div className="space-y-4">
                {pin.reviews.slice(0, 3).map((review: any, index: number) => (
                  <div key={index} className="border-l-4 border-coral-200 pl-4 py-2">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-medium text-gray-900">{review.author_name}</span>
                      <div className="flex items-center">
                        {Array.from({ length: review.rating }, (_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{review.text}</p>
                  </div>
                ))}
                
                {pin.reviews.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{pin.reviews.length - 3} more reviews available on Google Maps
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons - Moved to bottom */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-200">
            <button
              onClick={deletePlace}
              className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium text-red-600 bg-white hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete Place
            </button>
            
            <button
              onClick={saveAndGoBack}
              disabled={isSaving}
              className="btn-primary px-6 py-2 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Save & Back
                </div>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Writing Tips & Questions to Consider</h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3 text-gray-900">
                <p>What's your favorite dish/drink here?</p>
                <p>Is it better for couples, families, or solo travelers?</p>
                <p>Best time to visit (morning, evening, season)?</p>
                <p>What makes this place special to you?</p>
                <p>Any insider tips or local secrets?</p>
                <p>How does it compare to similar places?</p>
                <p>What should people expect (atmosphere, service, etc.)?</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
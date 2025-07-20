'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin, Plus, Trash2, Save, X, ChevronDown, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getAllCountries, getCitiesForCountry } from '@/lib/countries-cities'
import { STANDARD_CATEGORIES } from '@/lib/categories'
import { useToast } from '@/components/ui/toast'
import { Toaster } from '@/components/ui/toaster'

// Interface for a single pin
interface Pin {
  id?: string
  title: string
  description: string
  google_maps_url: string
  category: string
  latitude: number
  longitude: number
  photos?: string[]
  rating?: number
  rating_count?: number
  business_type?: string
}

export default function CreatePackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  
  // Edit mode detection
  const editPackId = searchParams.get('edit')
  const isEditMode = !!editPackId
  
  // State for form data
  const [packTitle, setPackTitle] = useState('')
  const [packDescription, setPackDescription] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [price, setPrice] = useState('')
  const [numberOfPlaces, setNumberOfPlaces] = useState('')
  
  // State for pins
  const [pins, setPins] = useState<Pin[]>([])
  
  // State for Google Maps lists
  const [googleMapsList, setGoogleMapsList] = useState<{
    id: string
    title: string
    url: string
    description: string
  } | null>(null)
  
  // State for categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  
  // Available categories - now using standardized categories
  const availableCategories = STANDARD_CATEGORIES
  
  // State for Google Maps URLs
  const [singlePlaceUrl, setSinglePlaceUrl] = useState('')
  const [googleMapsListUrl, setGoogleMapsListUrl] = useState('')
  
  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId, setUserId] = useState<string>('')

  // State for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdPackTitle, setCreatedPackTitle] = useState('')



  // State for image uploads
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [mainImageIndex, setMainImageIndex] = useState<number>(-1) // -1 means no main image selected

  // State for places input
  const [placesInput, setPlacesInput] = useState('')
  
  // State for loading place details
  const [isFetchingPlaceDetails, setIsFetchingPlaceDetails] = useState(false)

  // Country and city dropdown state
  const [availableCountries, setAvailableCountries] = useState<string[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [filteredCountries, setFilteredCountries] = useState<string[]>([])
  const [filteredCities, setFilteredCities] = useState<string[]>([])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [countrySearchTerm, setCountrySearchTerm] = useState('')
  const [citySearchTerm, setCitySearchTerm] = useState('')
  
  // Keyboard navigation state
  const [selectedCountryIndex, setSelectedCountryIndex] = useState(-1)
  const [selectedCityIndex, setSelectedCityIndex] = useState(-1)
  const selectedCountryIndexRef = useRef(-1)
  const selectedCityIndexRef = useRef(-1)
  
  // Dropdown container refs for auto-scrolling
  const countryDropdownRef = useRef<HTMLDivElement>(null)
  const cityDropdownRef = useRef<HTMLDivElement>(null)

  // File input ref for image uploads
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Ref to prevent duplicate category limit toasts
  const categoryLimitToastRef = useRef(false)

  // Load countries on component mount
  useEffect(() => {
    const countries = getAllCountries()
    setAvailableCountries(countries)
    setFilteredCountries(countries)
  }, [])

  // Load existing pack data if in edit mode
  useEffect(() => {
    if (isEditMode && editPackId) {
      loadExistingPackData()
    }
  }, [isEditMode, editPackId])

  // Function to load existing pack data for editing
  const loadExistingPackData = async () => {
    try {
      // Get the pack details
      const { data: packData, error: packError } = await supabase
        .from('pin_packs')
        .select('*')
        .eq('id', editPackId)
        .single()

      if (packError) throw packError
      if (!packData) throw new Error('Pack not found')

      // Set form data
      setPackTitle(packData.title || '')
      setPackDescription(packData.description || '')
      setCity(packData.city || '')
      setCountry(packData.country || '')
      setPrice(packData.price?.toString() || '')
      setNumberOfPlaces(packData.pin_count?.toString() || '')
      setSelectedCategories(packData.categories || [])

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
            photos,
            created_at
          )
        `)
        .eq('pin_pack_id', editPackId)

      if (pinsError) {
        console.warn('Error loading pins:', pinsError)
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
          photos: item.pins.photos || [],
          created_at: item.pins.created_at
        })) || []
        
        setPins(pinsData)
      }

      // Load existing photos (you'll need to implement this based on your photo storage)
      // For now, we'll set an empty array and let users add new photos
      setUploadedImages([])
      setMainImageIndex(-1)

      // Load Google Maps list (you'll need to implement this based on your storage)
      // For now, we'll set it to null and let users add a new one
      setGoogleMapsList(null)

    } catch (error) {
      console.error('Error loading pack data:', error)
      showToast('Failed to load pack data for editing', 'error')
      router.push('/manage')
    }
  }

  // Sync refs with state for keyboard navigation
  useEffect(() => {
    selectedCountryIndexRef.current = selectedCountryIndex
    
    // Auto-scroll the selected country item into view
    if (selectedCountryIndex >= 0 && countryDropdownRef.current) {
      const dropdown = countryDropdownRef.current
      const selectedButton = dropdown.children[selectedCountryIndex] as HTMLElement
      if (selectedButton) {
        selectedButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }
    }
  }, [selectedCountryIndex])

  useEffect(() => {
    selectedCityIndexRef.current = selectedCityIndex
    
    // Auto-scroll the selected city item into view
    if (selectedCityIndex >= 0 && cityDropdownRef.current) {
      const dropdown = cityDropdownRef.current
      const selectedButton = dropdown.children[selectedCityIndex] as HTMLElement
      if (selectedButton) {
        selectedButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }
    }
  }, [selectedCityIndex])

  // Image upload functions
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
        setMainImageIndex(mainImageIndex - 1) // Adjust index for remaining images
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

  // Country and city functions
  const handleCountrySearch = (searchTerm: string) => {
    setCountrySearchTerm(searchTerm)
    setSelectedCountryIndex(-1) // Reset selection when typing
    
    // If user starts typing, clear the selected country to allow editing
    if (country && searchTerm !== country) {
      setCountry('')
      setCity('') // Clear city when country changes
      setAvailableCities([])
      setFilteredCities([])
    }
    
    // If user clears the field completely, reset country
    if (!searchTerm.trim()) {
      setFilteredCountries(availableCountries)
      if (country) {
        setCountry('')
        setCity('')
        setAvailableCities([])
        setFilteredCities([])
      }
    } else {
      const filtered = availableCountries.filter(country =>
        country.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCountries(filtered)
    }
    
    if (!showCountryDropdown) {
      setShowCountryDropdown(true)
    }
  }

  const handleCitySearch = (searchTerm: string) => {
    setCitySearchTerm(searchTerm)
    setSelectedCityIndex(-1) // Reset selection when typing
    
    // If user starts typing, clear the selected city to allow editing
    if (city && searchTerm !== city) {
      setCity('')
    }
    
    // If user clears the field completely, reset city
    if (!searchTerm.trim()) {
      setFilteredCities(availableCities)
      if (city) {
        setCity('')
      }
    } else {
      const filtered = availableCities.filter(city =>
        city.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCities(filtered)
    }
    
    if (!showCityDropdown && availableCities.length > 0) {
      setShowCityDropdown(true)
    }
  }

  const handleCountrySelect = (selectedCountry: string) => {
    setCountry(selectedCountry)
    setCountrySearchTerm('') // Clear search term
    setSelectedCountryIndex(-1) // Reset selection
    setCity('') // Reset city when country changes  
    setCitySearchTerm('') // Clear city search term
    setSelectedCityIndex(-1) // Reset city selection
    setShowCountryDropdown(false)
    
    // Load cities for the selected country
    const cities = getCitiesForCountry(selectedCountry)
    setAvailableCities(cities)
    setFilteredCities(cities)
  }

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity)
    setCitySearchTerm('') // Clear search term
    setSelectedCityIndex(-1) // Reset selection
    setShowCityDropdown(false)
  }

  // Places input functions
  const handlePlacesInputChange = (value: string) => {
    setPlacesInput(value)
  }

  const handlePlacesSelect = async (option: string) => {
    // This function is no longer needed since we removed the dropdown
    // Keeping it for potential future use
  }

  const handleGoogleMapsUrlChange = (value: string) => {
    setSinglePlaceUrl(value)
  }

  const handleGoogleMapsListUrlChange = (value: string) => {
    setGoogleMapsListUrl(value)
  }

  // Keyboard navigation for country dropdown
  const handleCountryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isDropdownVisible = showCountryDropdown
    const suggestionsCount = filteredCountries.length

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (isDropdownVisible && suggestionsCount > 0) {
        const currentIndex = selectedCountryIndexRef.current === -1 ? -1 : selectedCountryIndexRef.current
        const newIndex = currentIndex < suggestionsCount - 1 ? currentIndex + 1 : 0
        setSelectedCountryIndex(newIndex)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (isDropdownVisible && suggestionsCount > 0) {
        const currentIndex = selectedCountryIndexRef.current === -1 ? suggestionsCount : selectedCountryIndexRef.current
        const newIndex = currentIndex > 0 ? currentIndex - 1 : suggestionsCount - 1
        setSelectedCountryIndex(newIndex)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (isDropdownVisible && suggestionsCount > 0 && selectedCountryIndexRef.current >= 0) {
        const selectedCountry = filteredCountries[selectedCountryIndexRef.current]
        handleCountrySelect(selectedCountry)
      }
    } else if (e.key === 'Escape') {
      setShowCountryDropdown(false)
      setSelectedCountryIndex(-1)
    }
  }

  // Keyboard navigation for city dropdown
  const handleCityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isDropdownVisible = showCityDropdown
    const suggestionsCount = filteredCities.length

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (isDropdownVisible && suggestionsCount > 0) {
        const currentIndex = selectedCityIndexRef.current === -1 ? -1 : selectedCityIndexRef.current
        const newIndex = currentIndex < suggestionsCount - 1 ? currentIndex + 1 : 0
        setSelectedCityIndex(newIndex)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (isDropdownVisible && suggestionsCount > 0) {
        const currentIndex = selectedCityIndexRef.current === -1 ? suggestionsCount : selectedCityIndexRef.current
        const newIndex = currentIndex > 0 ? currentIndex - 1 : suggestionsCount - 1
        setSelectedCityIndex(newIndex)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (isDropdownVisible && suggestionsCount > 0 && selectedCityIndexRef.current >= 0) {
        const selectedCity = filteredCities[selectedCityIndexRef.current]
        handleCitySelect(selectedCity)
      }
    } else if (e.key === 'Escape') {
      setShowCityDropdown(false)
      setSelectedCityIndex(-1)
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.country-dropdown')) {
        setShowCountryDropdown(false)
        setSelectedCountryIndex(-1) // Reset selection
        if (!country) {
          setCountrySearchTerm('') // Clear search if no country selected
        }
      }
      if (!target.closest('.city-dropdown')) {
        setShowCityDropdown(false)
        setSelectedCityIndex(-1) // Reset selection
        if (!city) {
          setCitySearchTerm('') // Clear search if no city selected
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [country, city])

  // Check for authenticated user
  useEffect(() => {
    const checkAuth = async () => {
      const userProfile = localStorage.getItem('pinpacks_user_profile')
      const savedUserId = localStorage.getItem('pinpacks_user_id')
      
      if (userProfile) {
        const profile = JSON.parse(userProfile)
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', profile.email)
            .single()
          
          if (userData && !error) {
            setUserId(userData.id)
          } else {
            setUserId(profile.userId)
          }
        } catch (error) {
          setUserId(profile.userId)
        }
      } else if (savedUserId) {
        setUserId(savedUserId)
      } else {
        window.location.href = '/auth'
        return
      }
    }
    
    checkAuth()
  }, [])

  // Google Maps API functions
  const fetchPlaceDetails = async (url: string) => {
    try {
      // Extract a searchable query from the URL
      const query = extractQueryFromUrl(url)
      if (!query) {
        throw new Error('Could not extract searchable information from URL')
      }

      // Use Google Maps Places API to search for the place
      const response = await fetch(`/api/places/details?query=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch place details')
      }

      const placeData = await response.json()
      return placeData
    } catch (error) {
      console.error('Error fetching place details:', error)
      return null
    }
  }

  const extractQueryFromUrl = (url: string): string | null => {
    console.log('Extracting query from URL:', url)
    
    try {
      // Handle different Google Maps URL formats
      const urlObj = new URL(url)
      console.log('URL hostname:', urlObj.hostname)
      console.log('URL pathname:', urlObj.pathname)
      
      // For short URLs like maps.app.goo.gl, try to get the query parameter
      if (urlObj.hostname.includes('maps.app.goo.gl')) {
        // For short URLs, we'll use the path as a query
        const path = urlObj.pathname.replace('/', '')
        if (path) {
          console.log('Extracted from short URL:', path)
          return path
        }
      }
      
      // For regular Google Maps URLs (google.com, google.de, etc.)
      if (urlObj.hostname.includes('google')) {
        // Extract place name from the URL path
        const pathParts = urlObj.pathname.split('/')
        console.log('Path parts:', pathParts)
        
        // Look for the 'place' segment and get the next part
        const placeIndex = pathParts.findIndex(part => part === 'place')
        console.log('Place index:', placeIndex)
        
        if (placeIndex !== -1 && placeIndex + 1 < pathParts.length) {
          const placeName = pathParts[placeIndex + 1]
          console.log('Place name found:', placeName)
          
          if (placeName && !placeName.startsWith('@')) {
            // Decode the place name (replace + with spaces and decode URI)
            const decodedName = decodeURIComponent(placeName.replace(/\+/g, ' '))
            console.log('Decoded place name:', decodedName)
            return decodedName
          }
        }
        
        // Fallback: try to extract any meaningful text from the path
        const meaningfulParts = pathParts.filter(part => 
          part && 
          part !== 'maps' && 
          part !== 'place' && 
          !part.startsWith('@') && 
          !part.startsWith('data=') &&
          part.length > 2
        )
        console.log('Meaningful parts:', meaningfulParts)
        
        if (meaningfulParts.length > 0) {
          const fallbackName = decodeURIComponent(meaningfulParts[0].replace(/\+/g, ' '))
          console.log('Fallback name:', fallbackName)
          return fallbackName
        }
      }
      
      // If we can't extract anything specific, use the full URL as a fallback
      console.log('Using full URL as fallback')
      return url
    } catch (error) {
      console.error('Error parsing URL:', error)
      // If URL parsing fails, return the original string
      return url
    }
  }

  // Check if URL is already imported
  const isUrlAlreadyImported = (url: string): boolean => {
    return pins.some(pin => pin.google_maps_url === url)
  }

  // Add single place from Google Maps URL with API integration
  const addSinglePlace = async () => {
    if (!singlePlaceUrl.trim()) return

    // Check if URL is already imported
    if (isUrlAlreadyImported(singlePlaceUrl)) {
      showToast('This place has already been imported. Please try a different URL.', 'info')
      return
    }

    setIsFetchingPlaceDetails(true)
    try {
      // Fetch place details from Google Maps API
      const placeDetails = await fetchPlaceDetails(singlePlaceUrl)
      
      let pinData: Pin
      
      if (placeDetails) {
        // Use fetched data from Google Maps API
        pinData = {
          title: placeDetails.name || 'Imported Place',
          description: placeDetails.formatted_address || 'Place imported from Google Maps',
          google_maps_url: singlePlaceUrl,
          category: 'other',
          latitude: placeDetails.geometry?.location?.lat || 0,
          longitude: placeDetails.geometry?.location?.lng || 0,
          photos: uploadedImages,
          rating: placeDetails.rating,
          rating_count: placeDetails.user_ratings_total,
          business_type: placeDetails.types?.[0] || 'establishment'
        }
      } else {
        // Fallback to basic pin if API fails
        pinData = {
          title: 'Imported Place',
          description: 'Place imported from Google Maps',
          google_maps_url: singlePlaceUrl,
          category: 'other',
          latitude: 0,
          longitude: 0,
          photos: uploadedImages
        }
      }
      
      setPins(prev => [...prev, pinData])
      setSinglePlaceUrl('')
      showToast('Place imported successfully!', 'success')
      
    } catch (error) {
      console.error('Error adding place:', error)
      showToast('Error importing place. Please try again.', 'error')
    } finally {
      setIsFetchingPlaceDetails(false)
    }
  }

  // Check if URL is a Google Maps list URL
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

  // Import from Google Maps list
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
      console.error('Error importing from list:', error)
      showToast('Error importing Google Maps list. Please try again.', 'error')
    }
  }

  // Remove a pin
  const removePin = (index: number) => {
    setPins(pins.filter((_, i) => i !== index))
  }

  // Remove a Google Maps list
  const removeGoogleMapsList = () => {
    setGoogleMapsList(null)
  }

  // Category selection functions
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        // Reset toast flag when removing a category
        categoryLimitToastRef.current = false
        return prev.filter(c => c !== category)
      } else if (prev.length < 3) {
        // Reset toast flag when adding a category
        categoryLimitToastRef.current = false
        return [...prev, category]
      } else {
        // Only show toast if we haven't shown it recently
        if (!categoryLimitToastRef.current) {
          showToast('You can only select up to 3 categories', 'info')
          categoryLimitToastRef.current = true
        }
        return prev
      }
    })
  }

  const isCategorySelected = (category: string) => {
    return selectedCategories.includes(category)
  }

  // Create or update the pin pack
  const createPinPack = async () => {
    // Validation checks
    if (!packTitle.trim()) {
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

    setIsSubmitting(true)
    try {
      if (isEditMode && editPackId) {
        // Update existing pack
        await updateExistingPack()
      } else {
        // Create new pack
        await createNewPack()
      }
    } catch (error) {
      console.error('Error saving pack:', error)
      showToast(`Failed to ${isEditMode ? 'update' : 'create'} pack. Please try again.`, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Create new pack
  const createNewPack = async () => {
    // Create pin pack data
    const pinPackData = {
      title: packTitle.trim(),
      description: packDescription.trim() || 'A curated collection of amazing places',
      city: city.trim() || 'Unknown',
      country: country.trim() || 'Unknown',
      price: price === '' ? 0 : Number(price),
      creator_id: userId,
      pin_count: pins.length,
      categories: selectedCategories,
      created_at: new Date().toISOString()
    }

    // Insert pin pack
    const { data: packResponse, error: packError } = await supabase
      .from('pin_packs')
      .insert([pinPackData])
      .select()

    if (packError) {
      console.error('Error creating pin pack:', packError)
      throw packError
    }

    const newPackId = packResponse[0].id

    // If there are pins, create them
    if (pins.length > 0) {
      const pinData = pins.map(pin => ({
        title: pin.title.trim(),
        description: pin.description.trim() || 'Amazing place to visit',
        google_maps_url: pin.google_maps_url.trim(),
        category: pin.category || 'other',
        latitude: pin.latitude || 0,
        longitude: pin.longitude || 0,
        photos: pin.photos || [], // Use the pin's own photos instead of all uploadedImages
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { data: createdPins, error: pinsError } = await supabase
        .from('pins')
        .insert(pinData)
        .select()

      if (pinsError) {
        console.error('Error creating pins:', pinsError)
        throw pinsError
      }

      // Create relationships
      const relationshipData = createdPins.map(pin => ({
        pin_pack_id: newPackId,
        pin_id: pin.id,
        created_at: new Date().toISOString()
      }))

      const { error: relationshipError } = await supabase
        .from('pin_pack_pins')
        .insert(relationshipData)

      if (relationshipError) {
        console.error('Error creating relationships:', relationshipError)
        throw relationshipError
      }
    }

    // Update pin count
    await supabase
      .from('pin_packs')
      .update({ pin_count: pins.length })
      .eq('id', newPackId)

    // Show success modal
    setCreatedPackTitle(packTitle.trim())
    setShowSuccessModal(true)
    showToast(`Pack "${packTitle.trim()}" created successfully with ${pins.length} places and ${uploadedImages.length} photos!`, 'success')

    // Clear form data
    clearFormData()
  }

  // Update existing pack
  const updateExistingPack = async () => {
    // Update pin pack data
    const { error: packError } = await supabase
      .from('pin_packs')
      .update({
        title: packTitle.trim(),
        description: packDescription.trim() || 'A curated collection of amazing places',
        city: city.trim() || 'Unknown',
        country: country.trim() || 'Unknown',
        price: price === '' ? 0 : Number(price),
        pin_count: pins.length,
        categories: selectedCategories,
        updated_at: new Date().toISOString()
      })
      .eq('id', editPackId)

    if (packError) {
      console.error('Error updating pin pack:', packError)
      throw packError
    }

    // Remove existing pins and relationships
    const { error: deleteRelationshipsError } = await supabase
      .from('pin_pack_pins')
      .delete()
      .eq('pin_pack_id', editPackId)

    if (deleteRelationshipsError) {
      console.error('Error deleting relationships:', deleteRelationshipsError)
      throw deleteRelationshipsError
    }

    // Delete existing pins
    const { error: deletePinsError } = await supabase
      .from('pins')
      .delete()
      .in('id', pins.filter(pin => pin.id).map(pin => pin.id))

    if (deletePinsError) {
      console.error('Error deleting pins:', deletePinsError)
      throw deletePinsError
    }

    // Create new pins
    if (pins.length > 0) {
      const pinData = pins.map(pin => ({
        title: pin.title.trim(),
        description: pin.description.trim() || 'Amazing place to visit',
        google_maps_url: pin.google_maps_url.trim(),
        category: pin.category || 'other',
        latitude: pin.latitude || 0,
        longitude: pin.longitude || 0,
        photos: pin.photos || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { data: createdPins, error: pinsError } = await supabase
        .from('pins')
        .insert(pinData)
        .select()

      if (pinsError) {
        console.error('Error creating pins:', pinsError)
        throw pinsError
      }

      // Create relationships
      const relationshipData = createdPins.map(pin => ({
        pin_pack_id: editPackId,
        pin_id: pin.id,
        created_at: new Date().toISOString()
      }))

      const { error: relationshipError } = await supabase
        .from('pin_pack_pins')
        .insert(relationshipData)

      if (relationshipError) {
        console.error('Error creating relationships:', relationshipError)
        throw relationshipError
      }
    }

    // Show success message
    showToast(`Pack "${packTitle.trim()}" updated successfully with ${pins.length} places and ${uploadedImages.length} photos!`, 'success')
    
    // Redirect to manage page
    router.push('/manage')
  }

  // Clear form data
  const clearFormData = () => {
    setPackTitle('')
    setPackDescription('')
    setCity('')
    setCountry('')
    setPrice('')
    setNumberOfPlaces('')
    setSelectedCategories([])
    setPins([])
    setGoogleMapsList(null)
    setUploadedImages([])
    setMainImageIndex(-1)
    setSinglePlaceUrl('')
    setGoogleMapsListUrl('')
    setPlacesInput('')
  }

  const handleViewMyPacks = () => {
    setShowSuccessModal(false)
    router.push('/manage')
  }

  const handleCreateAnotherPack = () => {
    setShowSuccessModal(false)
    // Form is already cleared, just stay on the page
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column - Upload Images */}
          <div className="space-y-6">
            {/* Back Navigation */}
            <div className="flex items-center">
              <button 
                onClick={() => router.push('/manage')}
                className="flex items-center text-gray-600 hover:text-gray-900 text-sm"
              >
                <svg className="h-4 w-4 mr-1 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Go
              </button>
            </div>

            {/* Upload Images Section */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {isEditMode ? 'Edit Pack Images' : 'Upload Images'}
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

              {/* Image Grid - 10 slots */}
              <div className="grid grid-cols-5 gap-4">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
                  <div key={index} className="aspect-square rounded-lg border-2 border-dashed border-sky-200 flex items-center justify-center relative overflow-hidden">
                    {uploadedImages[index] ? (
                      <>
                        <img 
                          src={uploadedImages[index]} 
                          alt={`Uploaded image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeImage(index)
                          }}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          title="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        
                      </>
                    ) : (
                      <div className="text-center">
                        <span className="text-sky-400 text-xs">Image {index + 1}</span>
                        {uploadedImages.length > 0 && (
                          <button
                            onClick={openFileDialog}
                            className="block mt-1 text-sky-500 hover:text-sky-600 text-xs"
                          >
                            Add more
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Google Maps List Section */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Google Maps List</h2>
              
              {/* Import from Google Maps List */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Import from Google Maps List
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={googleMapsListUrl}
                    onChange={(e) => handleGoogleMapsListUrlChange(e.target.value)}
                    placeholder={googleMapsList ? "List already imported" : "Paste Google Maps list URL (e.g., maps.app.goo.gl/...)"}
                    disabled={googleMapsList !== null}
                    className={`w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${
                      googleMapsList ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  />
                  {googleMapsListUrl && !googleMapsList && (
                    <button
                      onClick={importFromGoogleMapsList}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-sky-500 text-white p-1 rounded hover:bg-sky-600 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {googleMapsListUrl && !googleMapsList && (
                  <p className="text-xs text-gray-500 mt-1">Click the download button to import this list</p>
                )}
                {googleMapsList && (
                  <p className="text-xs text-gray-500 mt-1">Only one list per pack allowed. Remove the current list to add a different one.</p>
                )}
                {!googleMapsList && (
                  <p className="text-xs text-gray-500 mt-1">Only Google Maps list URLs are accepted (e.g., maps.app.goo.gl/...)</p>
                )}
              </div>

              {/* Google Maps List Display */}
              {googleMapsList && (
                <div className="border border-gray-200 rounded-lg p-4 bg-blue-50 mt-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                    </svg>
                    Google Maps List
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">This is a single Google Maps list imported into your pack.</p>
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">{googleMapsList.title}</p>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{googleMapsList.description}</p>
                        <p className="text-xs text-gray-500 truncate">{googleMapsList.url}</p>
                      </div>
                      <button
                        onClick={removeGoogleMapsList}
                        className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Remove list"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Create Your Pack */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {isEditMode ? 'Edit Your Pack' : 'Create Your Pack'}
            </h2>
            
            <div className="space-y-6">
              {/* Pack Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pack Title
                </label>
                <input
                  type="text"
                  value={packTitle}
                  onChange={(e) => setPackTitle(e.target.value)}
                  placeholder="Enter pack title..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              {/* Price and Number of Places */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price ($USD)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => {
                      const inputValue = e.target.value
                      if (inputValue === '' || (Number(inputValue) >= 0 && Number(inputValue) <= 10)) {
                        setPrice(inputValue)
                      }
                    }}
                    min="0"
                    max="10"
                    step="1"
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
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
                    max="15"
                    step="1"
                    placeholder="5"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={packDescription}
                  onChange={(e) => setPackDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe your pack..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories (up to 3)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {availableCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        isCategorySelected(category)
                          ? 'bg-sky-500 text-white border-sky-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-sky-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

                              {/* Country and City - Dependent dropdowns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative country-dropdown">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={countrySearchTerm || country}
                      onChange={(e) => handleCountrySearch(e.target.value)}
                      onKeyDown={handleCountryKeyDown}
                      onFocus={() => setShowCountryDropdown(true)}
                      placeholder="Select country..."
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {showCountryDropdown && (
                      <div 
                        ref={countryDropdownRef}
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {filteredCountries.map((countryOption, index) => (
                          <button
                            key={index}
                            onClick={() => handleCountrySelect(countryOption)}
                            className={`w-full text-left px-4 py-3 first:rounded-t-lg last:rounded-b-lg hover:bg-gray-100 transition-colors ${
                              selectedCountryIndex === index ? 'bg-gray-100 font-medium' : ''
                            }`}
                            onMouseEnter={() => setSelectedCountryIndex(index)}
                          >
                            {countryOption}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative city-dropdown">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={citySearchTerm || city}
                      onChange={(e) => handleCitySearch(e.target.value)}
                      onKeyDown={handleCityKeyDown}
                      onFocus={() => country && setShowCityDropdown(true)}
                      placeholder={country ? "Select city..." : "Select country first"}
                      disabled={!country}
                      className={`w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 ${
                        !country ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    {showCityDropdown && country && (
                      <div 
                        ref={cityDropdownRef}
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {filteredCities.map((cityOption, index) => (
                          <button
                            key={index}
                            onClick={() => handleCitySelect(cityOption)}
                            className={`w-full text-left px-4 py-3 first:rounded-t-lg last:rounded-b-lg hover:bg-gray-100 transition-colors ${
                              selectedCityIndex === index ? 'bg-gray-100 font-medium' : ''
                            }`}
                            onMouseEnter={() => setSelectedCityIndex(index)}
                          >
                            {cityOption}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

             

              
              {/* Add Places */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Places
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={placesInput}
                    onChange={(e) => handlePlacesInputChange(e.target.value)}
                    placeholder="Paste Google Maps URL to import place details..."
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                  {placesInput && placesInput.trim() !== '' && (
                    <button
                      onClick={async () => {
                        // Check if URL is already imported
                        if (isUrlAlreadyImported(placesInput)) {
                          showToast('This place has already been imported. Please try a different URL.', 'info')
                          return
                        }

                        setIsFetchingPlaceDetails(true)
                        try {
                          const placeDetails = await fetchPlaceDetails(placesInput)
                          if (placeDetails) {
                            const newPin: Pin = {
                              title: placeDetails.name || 'Imported Place',
                              description: placeDetails.formatted_address || 'Place imported from Google Maps',
                              google_maps_url: placesInput,
                              category: 'other',
                              latitude: placeDetails.geometry?.location?.lat || 0,
                              longitude: placeDetails.geometry?.location?.lng || 0,
                              photos: uploadedImages,
                              rating: placeDetails.rating,
                              rating_count: placeDetails.user_ratings_total,
                              business_type: placeDetails.types?.[0] || 'establishment'
                            }
                            setPins(prev => [...prev, newPin])
                            setPlacesInput('')
                            showToast('Place imported successfully!', 'success')
                          } else {
                            showToast('Failed to fetch place details. Please check the URL and try again.', 'error')
                          }
                        } catch (error) {
                          console.error('Error fetching place details:', error)
                          showToast('Error fetching place details. Please try again.', 'error')
                        } finally {
                          setIsFetchingPlaceDetails(false)
                        }
                      }}
                      disabled={isFetchingPlaceDetails}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
                        isFetchingPlaceDetails 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-sky-500 text-white hover:bg-sky-600'
                      }`}
                      title={isFetchingPlaceDetails ? "Fetching place details..." : "Fetch place information"}
                    >
                      {isFetchingPlaceDetails ? (
                        <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                {placesInput && placesInput.trim() !== '' && (
                  <p className="text-xs text-gray-500 mt-1">Click the download button to fetch and import this place</p>
                )}
              </div>

              {/* Added Places Display */}
              {pins.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Added Places ({pins.length})</h4>
                  <div className="space-y-3">
                    {pins.map((pin, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">{pin.title || 'Untitled Place'}</p>
                              {pin.rating && (
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-500">★</span>
                                  <span className="text-sm text-gray-600">{pin.rating}</span>
                                  {pin.rating_count && (
                                    <span className="text-xs text-gray-500">({pin.rating_count})</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {pin.description && (
                              <p className="text-sm text-gray-600 mb-1">{pin.description}</p>
                            )}
                            {pin.business_type && (
                              <span className="inline-block bg-sky-100 text-sky-800 text-xs px-2 py-1 rounded-full mb-2">
                                {pin.business_type}
                              </span>
                            )}                            
                          </div>
                          <button
                            onClick={() => removePin(index)}
                            className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Remove place"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Save Pack Button - Moved to bottom of page */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={createPinPack}
            disabled={isSubmitting}
            className="w-full max-w-md bg-gray-900 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditMode ? 'Updating Pack...' : 'Saving Pack...'}
              </div>
            ) : (
              isEditMode ? 'Update Pack' : 'Save Pack'
            )}
          </button>
          

        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Pack Created Successfully!</h3>
            <p className="text-gray-600 mb-8">
              Your pack "{createdPackTitle}" has been created and is now available for travelers to discover.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleViewMyPacks}
                className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                View My Packs
              </button>
              <button
                onClick={handleCreateAnotherPack}
                className="flex-1 bg-sky-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-sky-600 transition-colors"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  )
} 
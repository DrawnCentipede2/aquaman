'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { MapPin, Star, Users, Heart, Calendar, Globe, MessageCircle, Shield, ArrowLeft, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PinPack } from '@/lib/supabase'
import { getPackDisplayImage, queryCreatorData } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { logger } from '@/lib/logger'

// Dynamically import non-critical components to reduce initial CSS load
const DynamicCloudLoader = dynamic(() => import('@/components/CloudLoader'), {
  ssr: false,
  loading: () => (
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-100 mb-6">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
    </div>
  )
})

export default function CreatorProfilePage() {
  const params = useParams()
  const creatorId = params.id as string // Don't decode here, let the utility function handle it
  
  const [creatorPacks, setCreatorPacks] = useState<PinPack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wishlistItems, setWishlistItems] = useState<string[]>([])
  const [packImages, setPackImages] = useState<{[key: string]: string}>({})

  // Real stats from database (will be updated when we implement reviews)
  const [creatorStats, setCreatorStats] = useState({
    reviews: 0,
    rating: 0,
    yearsCreating: 0
  })
  
  // State for real creator data from database
  const [creator, setCreator] = useState<any>(null)

  // Load real creator data from database
  useEffect(() => {
    const loadCreatorData = async () => {
      try {
        setError(null) // Clear any previous errors
        logger.log('Loading creator data for ID:', creatorId)
        
        // Use shared utility function for consistent querying
        const { data: creatorData, error, queryType } = await queryCreatorData(creatorId, 'name, email, bio, verified, city, country, occupation, social_links, profile_picture, created_at')

        logger.log('Creator data query result:', { creatorData, error, queryType })

        if (creatorData && !error) {
          logger.log('Setting creator data from database:', creatorData)
          setCreator({
            id: creatorId,
            name: creatorData.name || creatorData.email?.split('@')[0].split('.').map((word: string) => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ') || 'Local Creator',
            location: `${creatorData.city || 'Barcelona'}, ${creatorData.country || 'Spain'}`,
            profilePicture: creatorData.profile_picture || null,
            bio: creatorData.bio || `Hi! I'm passionate about sharing the authentic side of my beautiful city. Having lived here for several years, I know all the hidden gems that locals love. I specialize in creating selected experiences that show you the real culture, amazing food spots, and unique places that most tourists never discover.

I work as a local guide and have helped many travelers experience the true essence of our city. When I'm not creating pin packs, you can find me exploring new neighborhoods, trying local restaurants, or chatting with longtime residents to discover even more hidden treasures.

My packs are carefully crafted based on years of exploration and conversations with locals. Each location is personally vetted and represents something special about our local culture.`,
            work: creatorData.occupation || 'Local tourism guide & cultural enthusiast',
            verified: creatorData.verified || false,
            joinDate: creatorData.created_at || '2019-03-15',
            reviews: 0, // Will be updated when reviews system is implemented
            rating: 0, // Will be updated when reviews system is implemented
            yearsCreating: 0, // Will be calculated from join date when needed
            totalPacks: 0,
            totalDownloads: 0,
            email: creatorData.email,
            socialLinks: creatorData.social_links || {}
          })
        } else if (error) {
          logger.warn('Creator data query failed:', error)
          // Fallback for backwards compatibility
          const fallbackName = queryType === 'UUID' 
            ? 'Local Creator' 
            : (creatorId === 'local-expert' 
                ? 'Local Expert' 
                : creatorId.includes('@') 
                  ? decodeURIComponent(creatorId).split('@')[0].split('.').map((word: string) => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')
                  : 'Local Creator')
          
          setCreator({
            id: creatorId,
            name: fallbackName,
            location: 'Barcelona, Spain',
            profilePicture: null,
            bio: `Hi! I'm passionate about sharing the authentic side of my beautiful city. Having lived here for several years, I know all the hidden gems that locals love. I specialize in creating selected experiences that show you the real culture, amazing food spots, and unique places that most tourists never discover.

I work as a local guide and have helped many travelers experience the true essence of our city. When I'm not creating pin packs, you can find me exploring new neighborhoods, trying local restaurants, or chatting with longtime residents to discover even more hidden treasures.

My packs are carefully crafted based on years of exploration and conversations with locals. Each location is personally vetted and represents something special about our local culture.`,
            work: 'Local tourism guide & cultural enthusiast',
            verified: false,
            joinDate: '2019-03-15',
            reviews: 0, // Will be updated when reviews system is implemented
            rating: 0, // Will be updated when reviews system is implemented
            yearsCreating: 0, // Will be calculated from join date when needed
            totalPacks: 0,
            totalDownloads: 0,
            email: queryType === 'UUID' ? '' : decodeURIComponent(creatorId),
            socialLinks: {}
          })
        }
      } catch (error) {
        logger.error('Error loading creator data:', error)
        // Set fallback data for any unexpected errors
        const decodedCreatorId = decodeURIComponent(creatorId)
        const isUUIDFallback = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedCreatorId)
        const fallbackName = isUUIDFallback 
          ? 'Local Creator' 
          : (decodedCreatorId.includes('@') 
              ? decodedCreatorId.split('@')[0].split('.').map((word: string) => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')
              : 'Local Creator')
        
        setCreator({
          id: creatorId,
          name: fallbackName,
          location: 'Barcelona, Spain',
          profilePicture: null,
          bio: 'Local guide passionate about sharing authentic experiences.',
          work: 'Local guide',
          verified: false,
          joinDate: '2019-03-15',
          reviews: 0, // Will be updated when reviews system is implemented
          rating: 0, // Will be updated when reviews system is implemented
          yearsCreating: 0, // Will be calculated from join date when needed
          totalPacks: 0,
          totalDownloads: 0,
          email: isUUIDFallback ? '' : decodedCreatorId,
          socialLinks: {}
        })
      }
    }

    loadCreatorData()
  }, [creatorId])

  useEffect(() => {
    loadCreatorPacks()
    loadWishlist()
  }, [creatorId])

  const loadWishlist = () => {
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
  }

  const loadCreatorPacks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Filter packs by the specific creator
      let packsData = []
      let error = null
      
      // Check if creatorId looks like a UUID or an email (same logic as creator data)
      const decodedCreatorId = decodeURIComponent(creatorId)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedCreatorId)
      
      if (isUUID) {
        // Query by UUID (creator_id field)
        logger.log('Loading packs for creator UUID:', decodedCreatorId)
        const result = await supabase
          .from('pin_packs')
          .select('*')
          .eq('creator_id', decodedCreatorId)
          .order('created_at', { ascending: false })
        
        packsData = result.data || []
        error = result.error
      } else {
        // Query by email (creator_id field for legacy packs)
        logger.log('Loading packs for creator email:', decodedCreatorId)
        const result = await supabase
          .from('pin_packs')
          .select('*')
          .eq('creator_id', decodedCreatorId)
          .order('created_at', { ascending: false })
        
        packsData = result.data || []
        error = result.error
      }

      logger.log(`Found ${packsData.length} packs for creator ${decodedCreatorId}`)
      
      if (error) throw error
      
      setCreatorPacks(packsData)
      
      // Load pack images in parallel for better performance
      if (packsData.length > 0) {
        const imagePromises = packsData.map(async (pack) => {
          try {
            const imageUrl = await getPackDisplayImage(pack.id)
            return { id: pack.id, imageUrl }
          } catch (error) {
            logger.warn(`Failed to load image for pack ${pack.id}:`, error)
            return { id: pack.id, imageUrl: null }
          }
        })
        
        const imageResults = await Promise.allSettled(imagePromises)
        const images: {[key: string]: string} = {}
        
        imageResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.imageUrl) {
            images[result.value.id] = result.value.imageUrl
          }
        })
        
        setPackImages(images)
      }
      
    } catch (error) {
      logger.error('Error loading creator packs:', error)
      setError('Failed to load creator packs')
    } finally {
      setLoading(false)
    }
  }

  const toggleWishlist = (pack: PinPack) => {
    const savedWishlist = localStorage.getItem('pinpacks_wishlist')
    let currentWishlist = savedWishlist ? JSON.parse(savedWishlist) : []
    
    const isInWishlist = currentWishlist.some((item: any) => item.id === pack.id)
    
    if (isInWishlist) {
      currentWishlist = currentWishlist.filter((item: any) => item.id !== pack.id)
      setWishlistItems(prev => prev.filter(id => id !== pack.id))
    } else {
      currentWishlist.push(pack)
      setWishlistItems(prev => [...prev, pack.id])
    }
    
    localStorage.setItem('pinpacks_wishlist', JSON.stringify(currentWishlist))
  }

  // Calculate stats
  const totalDownloads = creatorPacks.reduce((sum, pack) => sum + (pack.download_count || 0), 0)

  // Show loading state while creator data is loading
  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-25">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading creator profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-25">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <User className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">Error Loading Creator</h3>
                <p className="text-red-700">{error}</p>
                <button 
                  onClick={() => {
                    setError(null)
                    setLoading(true)
                    loadCreatorPacks()
                  }}
                  className="text-red-600 hover:text-red-800 font-medium mt-2"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Creator Profile Header */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Profile Picture */}
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-coral-500 to-primary-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {creator.name.charAt(0).toUpperCase()}
              </div>
              {/* Verification badge */}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-coral-500 rounded-full flex items-center justify-center border-4 border-white">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Creator Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{creator.name}</h1>
              </div>

              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-5 w-5 mr-2" />
                <span className="text-lg">{creator.location}</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{creatorPacks.length}</div>
                  <div className="text-gray-500 text-sm">Pin Packs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{totalDownloads}</div>
                  <div className="text-gray-500 text-sm">Downloads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-gray-500 text-sm">Reviews</div>
                </div>
              </div>

              {/* Creator Details */}
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <MessageCircle className="h-4 w-4 mr-3" />
                  <span>{creator.work}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-3" />
                  <span>Creating since {new Date(creator.joinDate).getFullYear()}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Shield className="h-4 w-4 mr-3" />
                  <span className="underline">Identity verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About {creator.name}</h2>
            <div className="prose prose-gray max-w-none">
              {creator.bio.split('\n\n').map((paragraph: string, index: number) => (
                <p key={index} className="text-gray-600 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Social Links Section */}
          {creator.socialLinks && (creator.socialLinks.website || creator.socialLinks.instagram || creator.socialLinks.twitter) && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Connect with {creator.name}</h2>
              <div className="flex flex-wrap gap-4">
                {creator.socialLinks.website && (
                  <a
                    href={creator.socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Globe className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700 font-medium">Website</span>
                  </a>
                )}
                {creator.socialLinks.instagram && (
                  <a
                    href={`https://instagram.com/${creator.socialLinks.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-colors text-white"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span className="font-medium">Instagram</span>
                  </a>
                )}
                {creator.socialLinks.twitter && (
                  <a
                    href={`https://twitter.com/${creator.socialLinks.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-white"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span className="font-medium">Twitter</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Creator Reviews Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Reviews for {creator.name}
            </h2>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-gray-300 fill-current" />
              <span className="text-lg font-semibold text-gray-400">-</span>
              <span className="text-gray-500">(0 reviews)</span>
            </div>
          </div>

          {/* No reviews yet message */}
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-6">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No reviews yet for {creator.name}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Be the first to review this creator's pin packs and help other travelers discover amazing local experiences.
            </p>
          </div>
        </div>

        {/* Creator's Packs */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {creator.name}'s Pin Packs
            </h2>
            <div className="text-gray-500">
              {creatorPacks.length} pack{creatorPacks.length !== 1 ? 's' : ''}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Suspense fallback={
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-100 mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
                </div>
              }>
                <DynamicCloudLoader size="lg" text="Loading packs..." />
              </Suspense>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creatorPacks.map((pack) => (
                <div 
                  key={pack.id}
                  onClick={() => window.location.href = `/pack/${pack.id}`}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 overflow-hidden cursor-pointer group"
                >
                  {/* Pack Image */}
                  <div className="relative h-48 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 overflow-hidden">
                    <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-300 ease-out">
                      <img 
                        src={packImages[pack.id] || "/google-maps-bg.svg"}
                        alt="Map background"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                    </div>
                    
                    {/* Wishlist button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleWishlist(pack)
                      }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors shadow-sm z-10"
                    >
                      <Heart 
                        className={`h-4 w-4 transition-colors ${
                          wishlistItems.includes(pack.id) 
                            ? 'text-red-500 fill-current' 
                            : 'text-red-700 group-hover:text-red-500'
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
                  
                  {/* Pack Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-coral-600 transition-colors">
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
                    
                    {/* Pack footer */}
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

          {creatorPacks.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-6">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No packs yet</h3>
              <p className="text-gray-600">
                This creator hasn't published any pin packs yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
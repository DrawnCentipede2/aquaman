'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MapPin, Star, Users, Heart, Calendar, Globe, MessageCircle, Shield, ArrowLeft, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PinPack } from '@/lib/supabase'
import { getPackDisplayImage, queryCreatorData } from '@/lib/utils'

export default function CreatorProfilePage() {
  const params = useParams()
  const creatorId = params.id as string // Don't decode here, let the utility function handle it
  
  const [creatorPacks, setCreatorPacks] = useState<PinPack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wishlistItems, setWishlistItems] = useState<string[]>([])
  const [packImages, setPackImages] = useState<{[key: string]: string}>({})

  // Static stats to avoid hydration errors
  const [creatorStats, setCreatorStats] = useState({
    reviews: 243,
    rating: 4.9,
    yearsCreating: 5
  })
  
  // State for real creator data from database
  const [creator, setCreator] = useState<any>(null)

  // Load real creator data from database
  useEffect(() => {
    const loadCreatorData = async () => {
      try {
        setError(null) // Clear any previous errors
        // Use shared utility function for consistent querying
        const { data: creatorData, error, queryType } = await queryCreatorData(creatorId)

        if (creatorData && !error) {
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
            reviews: creatorStats.reviews,
            rating: creatorStats.rating,
            yearsCreating: creatorStats.yearsCreating,
            totalPacks: 0,
            totalDownloads: 0,
            email: creatorData.email
          })
        } else if (error) {
          console.warn('Creator data query failed:', error)
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
            reviews: creatorStats.reviews,
            rating: creatorStats.rating,
            yearsCreating: creatorStats.yearsCreating,
            totalPacks: 0,
            totalDownloads: 0,
            email: queryType === 'UUID' ? '' : decodeURIComponent(creatorId)
          })
        }
      } catch (error) {
        console.error('Error loading creator data:', error)
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
          reviews: creatorStats.reviews,
          rating: creatorStats.rating,
          yearsCreating: creatorStats.yearsCreating,
          totalPacks: 0,
          totalDownloads: 0,
          email: isUUIDFallback ? '' : decodedCreatorId
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
        console.error('Error loading wishlist:', error)
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
        console.log('Loading packs for creator UUID:', decodedCreatorId)
        const result = await supabase
          .from('pin_packs')
          .select('*')
          .eq('creator_id', decodedCreatorId)
          .order('created_at', { ascending: false })
        
        packsData = result.data || []
        error = result.error
      } else {
        // Query by email (creator_id field for legacy packs)
        console.log('Loading packs for creator email:', decodedCreatorId)
        const result = await supabase
          .from('pin_packs')
          .select('*')
          .eq('creator_id', decodedCreatorId)
          .order('created_at', { ascending: false })
        
        packsData = result.data || []
        error = result.error
      }

      console.log(`Found ${packsData.length} packs for creator ${decodedCreatorId}`)
      
      if (error) throw error
      
      setCreatorPacks(packsData)
      
      // Load pack images in parallel for better performance
      if (packsData.length > 0) {
        const imagePromises = packsData.map(async (pack) => {
          try {
            const imageUrl = await getPackDisplayImage(pack.id)
            return { id: pack.id, imageUrl }
          } catch (error) {
            console.warn(`Failed to load image for pack ${pack.id}:`, error)
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
      console.error('Error loading creator packs:', error)
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
                <span className="bg-coral-100 text-coral-700 text-sm font-medium px-3 py-1 rounded-full">
                  Superhost
                </span>
              </div>

              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-5 w-5 mr-2" />
                <span className="text-lg">{creator.location}</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{creator.reviews}</div>
                  <div className="text-gray-500 text-sm">Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                    {creator.rating.toFixed(1)}
                    <Star className="h-5 w-5 text-yellow-400 fill-current ml-1" />
                  </div>
                  <div className="text-gray-500 text-sm">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{creatorPacks.length}</div>
                  <div className="text-gray-500 text-sm">Pin Packs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{totalDownloads}</div>
                  <div className="text-gray-500 text-sm">Downloads</div>
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
        </div>

        {/* Creator Reviews Section */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Reviews for {creator.name}
            </h2>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="text-lg font-semibold">{creator.rating.toFixed(1)}</span>
              <span className="text-gray-500">({creator.reviews} reviews)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Review 1 */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  SC
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Sarah Chen</h4>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">March 2024</p>
                  <p className="text-gray-700 leading-relaxed">
                    "{creator.name} created the most amazing pin pack for our Berlin trip! Every recommendation was spot-on. 
                    As a local expert, they really know the hidden gems that tourists never find. Highly recommend working with them!"
                  </p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  MR
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Miguel Rodriguez</h4>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">February 2024</p>
                  <p className="text-gray-700 leading-relaxed">
                    "Incredible local knowledge! {creator.name} responds quickly to questions and their pack descriptions are so detailed. 
                    You can tell they really care about giving travelers an authentic experience. Will definitely use their packs again!"
                  </p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  EW
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Emma Wilson</h4>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 4 }, (_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                      <Star className="h-4 w-4 text-gray-300 fill-current" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">January 2024</p>
                  <p className="text-gray-700 leading-relaxed">
                    "Really helpful recommendations from a true local. Some places were closed when I visited but overall the pack was great. 
                    {creator.name} clearly knows the city well and provides good context for each location."
                  </p>
                </div>
              </div>
            </div>

            {/* Review 4 */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  JD
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">James Davis</h4>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">December 2023</p>
                  <p className="text-gray-700 leading-relaxed">
                    "Outstanding service! {creator.name} went above and beyond to help us plan our itinerary. 
                    The pin pack saved us so much research time and led us to places we never would have found otherwise. True professional!"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Show more reviews button */}
          <div className="text-center mt-8">
            <button className="btn-secondary px-6 py-3 hover:border-coral-300 hover:text-coral-600">
              Show more reviews
            </button>
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-100 mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
              </div>
              <p className="text-gray-600">Loading packs...</p>
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
'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Download, Edit, Eye, MapPin, Star, Trash2, TrendingUp, Users, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Interface for pin pack with analytics
interface PinPackWithAnalytics {
  id: string
  title: string
  description: string
  price: number
  city: string
  country: string
  created_at: string
  creator_location: string
  creator_id: string
  pin_count: number
  download_count: number
  average_rating: number
  rating_count: number
  recent_downloads: number // Downloads in last 7 days
}

export default function ManagePage() {
  // State for user's pin packs
  const [userPacks, setUserPacks] = useState<PinPackWithAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>('')


  // Enhanced user identification with IP backup for better persistence
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Try to get existing user ID from localStorage
        let id = localStorage.getItem('pinpacks_user_id')
        
        if (!id) {
          // Get user's IP for backup identification
          try {
            const response = await fetch('https://ipapi.co/json/')
            const data = await response.json()
            const userIP = data.ip || 'unknown'
            const userLocation = `${data.city}, ${data.country_name}` || 'Unknown'
            
            // Create a more persistent user ID based on IP + timestamp + random
            const timestamp = Date.now()
            const random = Math.random().toString(36).substr(2, 6)
            id = `user_${userIP.replace(/\./g, '_')}_${timestamp}_${random}`
            
            // Store in localStorage with additional metadata
            localStorage.setItem('pinpacks_user_id', id)
            localStorage.setItem('pinpacks_user_ip', userIP)
            localStorage.setItem('pinpacks_user_location', userLocation)
            localStorage.setItem('pinpacks_user_created', new Date().toISOString())
            
            console.log('New user created:', { id, userIP, userLocation })
          } catch (err) {
            // Fallback if IP service fails
            const timestamp = Date.now()
            const random = Math.random().toString(36).substr(2, 9)
            id = `user_local_${timestamp}_${random}`
            localStorage.setItem('pinpacks_user_id', id)
            console.log('Fallback user created:', id)
          }
        } else {
          console.log('Existing user found:', id)
        }
        
        setUserId(id)
      } catch (err) {
        console.error('Error initializing user:', err)
        // Final fallback
        const fallbackId = 'user_' + Math.random().toString(36).substr(2, 9)
        localStorage.setItem('pinpacks_user_id', fallbackId)
        setUserId(fallbackId)
      }
    }
    
    initializeUser()
  }, [])

  // Load user's pin packs when user ID is available
  useEffect(() => {
    if (userId) {
      loadUserPacks()
    }
  }, [userId])

  // Function to load user's pin packs with analytics
  const loadUserPacks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading packs for user:', userId)
      
      // Try to get user's pin packs with new fields first
      let packs = []
      
      try {
        // Attempt with creator_id filter (new schema)
        const { data: newSchemaPacks, error: packsError } = await supabase
          .from('pin_packs')
          .select('*')
          .eq('creator_id', userId)
          .order('created_at', { ascending: false })

        if (packsError) throw packsError
        packs = newSchemaPacks || []
        
      } catch (creatorIdError) {
        console.log('creator_id column not found, trying IP-based fallback...')
        
        // Try IP-based lookup as secondary option
        const userIP = localStorage.getItem('pinpacks_user_ip')
        if (userIP) {
          const { data: ipBasedPacks, error: ipError } = await supabase
            .from('pin_packs')
            .select('*')
            .ilike('creator_location', `%${userIP}%`)
            .order('created_at', { ascending: false })

          if (!ipError && ipBasedPacks && ipBasedPacks.length > 0) {
            packs = ipBasedPacks
            console.log('Found packs based on IP:', ipBasedPacks.length)
          } else {
            console.log('No IP-based packs found, loading all packs as final fallback...')
            
            // Final fallback: load all packs (for older schema without creator_id)
            const { data: allPacks, error: allPacksError } = await supabase
              .from('pin_packs')
              .select('*')
              .order('created_at', { ascending: false })

            if (allPacksError) throw allPacksError
            packs = allPacks || []
          }
        } else {
          console.log('No IP found, loading all packs as fallback...')
          
          // Fallback: load all packs (for older schema without creator_id)
          const { data: allPacks, error: allPacksError } = await supabase
            .from('pin_packs')
            .select('*')
            .order('created_at', { ascending: false })

          if (allPacksError) throw allPacksError
          packs = allPacks || []
        }
      }

      console.log('Loaded packs:', packs)

      // For each pack, get recent download analytics
      const packsWithAnalytics: PinPackWithAnalytics[] = []
      
      for (const pack of packs || []) {
        // Get downloads from last 7 days
        const { data: recentDownloads } = await supabase
          .from('pack_downloads')
          .select('id')
          .eq('pin_pack_id', pack.id)
          .gte('downloaded_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

        packsWithAnalytics.push({
          ...pack,
          recent_downloads: recentDownloads?.length || 0
        })
      }

      setUserPacks(packsWithAnalytics)
    } catch (error) {
      setError('Failed to load your pin packs')
      console.error('Error loading user packs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Function to delete a pin pack
  const deletePinPack = async (packId: string, packTitle: string) => {
    const confirmed = confirm(
      `⚠️ Are you sure you want to delete "${packTitle}"?\n\n` +
      `This will permanently remove:\n` +
      `• The pin pack and all its pins\n` +
      `• All download history and analytics\n` +
      `• All ratings and reviews\n\n` +
      `This action cannot be undone!`
    )

    if (!confirmed) return

    try {
      console.log('Deleting pin pack:', packId)
      
      // Delete related data first
      // 1. Delete pin-pack relationships
      await supabase
        .from('pin_pack_pins')
        .delete()
        .eq('pin_pack_id', packId)

      // 2. Delete download records
      await supabase
        .from('pack_downloads')
        .delete()
        .eq('pin_pack_id', packId)

      // 3. Delete rating records
      await supabase
        .from('pack_ratings')
        .delete()
        .eq('pin_pack_id', packId)

      // 4. Finally delete the pin pack itself
      const { error } = await supabase
        .from('pin_packs')
        .delete()
        .eq('id', packId)

      if (error) throw error

      alert(`✅ "${packTitle}" has been deleted successfully!`)
      
      // Reload the packs list
      loadUserPacks()
    } catch (err) {
      alert('Failed to delete the pin pack. Please try again.')
      console.error('Error deleting pack:', err)
    }
  }

  // Function to edit a pin pack
  const editPinPack = (pack: PinPackWithAnalytics) => {
    const newTitle = prompt('Enter new title:', pack.title)
    if (!newTitle || newTitle === pack.title) return

    const newDescription = prompt('Enter new description:', pack.description)
    if (newDescription === null) return // User cancelled

    updatePinPack(pack.id, {
      title: newTitle,
      description: newDescription
    })
  }

  // Function to update a pin pack
  const updatePinPack = async (packId: string, updates: { title?: string, description?: string }) => {
    try {
      const { error } = await supabase
        .from('pin_packs')
        .update(updates)
        .eq('id', packId)

      if (error) throw error

      alert('✅ Pin pack updated successfully!')
      
      // Reload the packs list
      loadUserPacks()
    } catch (err) {
      alert('Failed to update the pin pack. Please try again.')
      console.error('Error updating pack:', err)
    }
  }



  // Function to get analytics summary
  const getAnalyticsSummary = () => {
    const totalPacks = userPacks.length
    const totalDownloads = userPacks.reduce((sum, pack) => sum + pack.download_count, 0)
    const totalRatings = userPacks.reduce((sum, pack) => sum + pack.rating_count, 0)
    const averageRating = totalRatings > 0 
      ? userPacks.reduce((sum, pack) => sum + (pack.average_rating * pack.rating_count), 0) / totalRatings
      : 0
    const recentDownloads = userPacks.reduce((sum, pack) => sum + pack.recent_downloads, 0)

    return {
      totalPacks,
      totalDownloads,
      totalRatings,
      averageRating,
      recentDownloads
    }
  }

  const analytics = getAnalyticsSummary()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your pin packs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-full">
              <BarChart3 className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 bg-clip-text text-transparent mb-4">
            Your Pin Packs
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Manage your pin packs, track performance, and see how travelers are discovering your local insights.
          </p>
        </div>

        {/* User Debug Panel */}
        <div className="bg-blue-50/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-blue-200 mb-8">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg mr-3">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-blue-800">Your User Profile (Debug Info)</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white/70 p-4 rounded-lg">
              <p><strong>User ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{userId}</code></p>
              <p className="mt-2"><strong>IP Address:</strong> {localStorage.getItem('pinpacks_user_ip') || 'Not available'}</p>
              <p className="mt-2"><strong>Location:</strong> {localStorage.getItem('pinpacks_user_location') || 'Not available'}</p>
            </div>
            <div className="bg-white/70 p-4 rounded-lg">
              <p><strong>Profile Created:</strong> {localStorage.getItem('pinpacks_user_created') ? new Date(localStorage.getItem('pinpacks_user_created')!).toLocaleString() : 'Not available'}</p>
              <p className="mt-2"><strong>Total Packs:</strong> {userPacks.length}</p>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-blue-600">
            💡 <strong>Note:</strong> Your profile is automatically saved based on your IP address and browser. 
            This ensures your pin packs persist even if you restart the server.
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
            <div className="flex items-center">
              <div className="bg-blue-500 p-3 rounded-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{analytics.totalPacks}</p>
                <p className="text-sm text-gray-600">Total Packs</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
            <div className="flex items-center">
              <div className="bg-green-500 p-3 rounded-lg">
                <Download className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{analytics.totalDownloads}</p>
                <p className="text-sm text-gray-600">Total Downloads</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
            <div className="flex items-center">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{analytics.averageRating.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Avg Rating</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
            <div className="flex items-center">
              <div className="bg-purple-500 p-3 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{analytics.totalRatings}</p>
                <p className="text-sm text-gray-600">Total Reviews</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
            <div className="flex items-center">
              <div className="bg-orange-500 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{analytics.recentDownloads}</p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
            </div>
          </div>
        </div>



        {/* Pin Packs List */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Pin Packs</h2>
            <a 
              href="/create"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Create New Pack
            </a>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {userPacks.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-24 w-24 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No pin packs yet</h3>
              <p className="text-gray-600 mb-6">Create your first pin pack to start sharing your local insights!</p>
              <a 
                href="/create"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 inline-flex items-center"
              >
                <MapPin className="h-5 w-5 mr-2" />
                Create Your First Pack
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {userPacks.map((pack) => (
                <div key={pack.id} className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{pack.title}</h3>
                          <p className="text-gray-600">{pack.city}, {pack.country}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editPinPack(pack)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                            title="Edit pack"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deletePinPack(pack.id, pack.title)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Delete pack"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{pack.description}</p>
                      
                      {/* Pack Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-lg font-bold text-blue-600">{pack.pin_count}</p>
                          <p className="text-xs text-blue-600">Pins</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-lg font-bold text-green-600">{pack.download_count}</p>
                          <p className="text-xs text-green-600">Downloads</p>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <div className="flex items-center justify-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <p className="text-lg font-bold text-yellow-600">
                              {pack.rating_count > 0 ? pack.average_rating.toFixed(1) : '-'}
                            </p>
                          </div>
                          <p className="text-xs text-yellow-600">{pack.rating_count} reviews</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-lg font-bold text-purple-600">{pack.recent_downloads}</p>
                          <p className="text-xs text-purple-600">This week</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        Created {new Date(pack.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
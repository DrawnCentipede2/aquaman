'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Download, Edit, Eye, MapPin, Star, Trash2, TrendingUp, Users, Calendar, Package, DollarSign } from 'lucide-react'
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

  // Check for authenticated user and use email-based system
  useEffect(() => {
    const checkAuth = () => {
      // Check if user is authenticated via new email system
      const userProfile = localStorage.getItem('pinpacks_user_profile')
      const savedUserId = localStorage.getItem('pinpacks_user_id')
      
      if (userProfile) {
        // User is authenticated via email system
        const profile = JSON.parse(userProfile)
        setUserId(profile.userId)
        console.log('Authenticated user found:', profile.email)
      } else if (savedUserId) {
        // User has old system ID - still allow them to use it
        setUserId(savedUserId)
        console.log('Legacy user found:', savedUserId)
      } else {
        // No authentication found - redirect to sign in
        alert('Please sign in first to view your pin packs')
        window.location.href = '/auth'
        return
      }
    }
    
    checkAuth()
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
        // First try with the exact creator_id match
        const { data: exactPacks, error: exactError } = await supabase
          .from('pin_packs')
          .select('*')
          .eq('creator_id', userId)
          .order('created_at', { ascending: false })

        if (exactError) throw exactError
        packs = exactPacks || []
        
        // If no packs found and user has email, try to find packs by email domain
        if (packs.length === 0) {
          const userEmail = localStorage.getItem('pinpacks_user_email')
          if (userEmail) {
            console.log('No packs found with exact user ID, trying email-based search...')
            const emailDomain = userEmail.split('@')[0] // Get part before @
            
            const { data: emailPacks, error: emailError } = await supabase
              .from('pin_packs')
              .select('*')
              .ilike('creator_id', `%${emailDomain}%`)
              .order('created_at', { ascending: false })

            if (!emailError && emailPacks) {
              packs = emailPacks
              console.log(`Found ${emailPacks.length} packs via email search`)
            }
          }
        }
        
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

      // 2. Delete pins
      await supabase
        .from('pins')
        .delete()
        .eq('pack_id', packId)

      // 3. Delete downloads
      await supabase
        .from('pack_downloads')
        .delete()
        .eq('pin_pack_id', packId)

      // 4. Delete the pin pack itself
      const { error: deleteError } = await supabase
        .from('pin_packs')
        .delete()
        .eq('id', packId)

      if (deleteError) throw deleteError

      // Update local state
      setUserPacks(userPacks.filter(pack => pack.id !== packId))
      alert('Pin pack deleted successfully! 🗑️')
      
    } catch (error) {
      console.error('Error deleting pin pack:', error)
      alert('Failed to delete pin pack. Please try again.')
    }
  }

  // Function to edit pin pack - opens edit page in new tab
  const editPinPack = (pack: PinPackWithAnalytics) => {
    // Open the edit page in a new tab for comprehensive editing
    window.open(`/edit/${pack.id}`, '_blank')
  }

  // Function to update pin pack
  const updatePinPack = async (packId: string, updates: { title?: string, description?: string }) => {
    try {
      const { error } = await supabase
        .from('pin_packs')
        .update(updates)
        .eq('id', packId)

      if (error) throw error

      // Update local state
      setUserPacks(userPacks.map(pack => 
        pack.id === packId ? { ...pack, ...updates } : pack
      ))
      
      alert('Pin pack updated successfully! ✅')
    } catch (error) {
      console.error('Error updating pin pack:', error)
      alert('Failed to update pin pack. Please try again.')
    }
  }

  // Function to get analytics summary
  const getAnalyticsSummary = () => {
    const totalPacks = userPacks.length
    const totalDownloads = userPacks.reduce((sum, pack) => sum + (pack.download_count || 0), 0)
    const totalRecentDownloads = userPacks.reduce((sum, pack) => sum + pack.recent_downloads, 0)
    const totalEarnings = userPacks.reduce((sum, pack) => sum + (pack.price * (pack.download_count || 0)), 0)
    
    return { totalPacks, totalDownloads, totalRecentDownloads, totalEarnings }
  }

  const analytics = getAnalyticsSummary()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-100 mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading your pin packs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-4">
                <Package className="h-8 w-8 text-coral-500 mr-3" />
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                  Manage Your Packs
                </h1>
              </div>
              <p className="text-xl text-gray-600">
                Track performance and manage your pin pack collections
              </p>
            </div>
            <a 
              href="/create"
              className="btn-primary flex items-center"
            >
              <Package className="h-4 w-4 mr-2" />
              Create New Pack
            </a>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-airbnb p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-coral-100 rounded-full flex items-center justify-center mr-4">
                <Package className="h-6 w-6 text-coral-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Packs</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalPacks}</p>
              </div>
            </div>
          </div>

          <div className="card-airbnb p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <Download className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Downloads</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalDownloads}</p>
              </div>
            </div>
          </div>

          <div className="card-airbnb p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Recent Downloads</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalRecentDownloads}</p>
                <p className="text-xs text-gray-400">Last 7 days</p>
              </div>
            </div>
          </div>

          <div className="card-airbnb p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                <DollarSign className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">${analytics.totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="card-airbnb p-6 mb-8 bg-red-50 border border-red-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">Error</h3>
                <p className="text-red-700">{error}</p>
                <button 
                  onClick={loadUserPacks}
                  className="text-red-600 hover:text-red-800 font-medium mt-2"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pin Packs Grid */}
        {userPacks.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No pin packs yet</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Create your first pin pack and start sharing your favorite places with travelers.
            </p>
            <a 
              href="/create"
              className="btn-primary inline-flex items-center text-lg px-8 py-4"
            >
              <Package className="h-5 w-5 mr-2" />
              Create Your First Pack
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userPacks.map((pack) => (
              <div 
                key={pack.id} 
                className="card-airbnb card-airbnb-hover group cursor-pointer"
                onClick={() => window.open(`/pack/${pack.id}`, '_blank')}
              >
                {/* Pack Image with Google Maps Background */}
                <div className="h-48 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 relative overflow-hidden">
                  <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                    <img 
                      src="/google-maps-bg.svg"
                      alt="Map background"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                  
                  {/* Price Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                      {pack.price === 0 ? 'Free' : `$${pack.price}`}
                    </span>
                  </div>

                  {/* Pin Count */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-coral-500 text-white px-2 py-1 rounded-lg text-sm font-medium">
                      {pack.pin_count} pins
                    </span>
                  </div>

                  {/* Recent Activity Badge */}
                  {pack.recent_downloads > 0 && (
                    <div className="absolute bottom-3 left-3">
                      <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {pack.recent_downloads} recent
                      </span>
                    </div>
                  )}
                </div>

                {/* Pack Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
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
                    {pack.description || 'No description provided'}
                  </p>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Download className="h-3 w-3 mr-1" />
                      <span>{pack.download_count || 0} downloads</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{new Date(pack.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        editPinPack(pack)
                      }}
                      className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`/pack/${pack.id}`, '_blank')
                      }}
                      className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deletePinPack(pack.id, pack.title)
                      }}
                      className="px-3 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 
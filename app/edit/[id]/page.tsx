'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, Save, ArrowLeft, Trash2, Plus, Upload, DollarSign, FileText, Image, X } from 'lucide-react'
import CloudLoader from '@/components/CloudLoader'
import { supabase } from '@/lib/supabase'
import type { PinPack } from '@/lib/supabase'

export default function EditPackPage() {
  const params = useParams()
  const router = useRouter()
  const packId = params.id as string

  // State for the pack being edited
  const [pack, setPack] = useState<PinPack | null>(null)
  const [pins, setPins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    city: '',
    country: '',
    creator_location: ''
  })

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
          created_at: item.pins.created_at
        })) || []
        
        setPins(pinsData)
      }

    } catch (error) {
      console.error('Error loading pack:', error)
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

  // Save pack changes
  const saveChanges = async () => {
    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('pin_packs')
        .update({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          city: formData.city,
          country: formData.country,
          creator_location: formData.creator_location,
          updated_at: new Date().toISOString()
        })
        .eq('id', packId)

      if (error) throw error

      alert('Pack updated successfully! ✅')
      
    } catch (error) {
      console.error('Error saving changes:', error)
      setError('Failed to save changes. Please try again.')
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
      alert('Pin removed successfully!')
      
    } catch (error) {
      console.error('Error deleting pin:', error)
      alert('Failed to remove pin. Please try again.')
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
                onClick={() => window.open(`/pack/${packId}`, '_blank')}
                className="btn-secondary"
              >
                Preview Pack
              </button>
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
              </div>
            </div>

            {/* Places in Pack */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <MapPin className="h-6 w-6 mr-3 text-coral-500" />
                  Places in Pack ({pins.length})
                </h2>
                <button
                  onClick={() => router.push('/create')}
                  className="btn-secondary flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Places
                </button>
              </div>

              {pins.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No places yet</h3>
                  <p className="text-gray-500 mb-6">Add some amazing places to your pack</p>
                  <button
                    onClick={() => router.push('/create')}
                    className="btn-primary"
                  >
                    Add Your First Place
                  </button>
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
                    src="/google-maps-bg.svg"
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
                {pack.updated_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(pack.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h3>
              <p className="text-sm text-red-700 mb-4">
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
    </div>
  )
} 
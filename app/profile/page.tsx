'use client'

import { useState, useEffect } from 'react'
import { User, Mail, MapPin, Phone, Globe, Shield, Save, Trash2, Camera, Verified, Triangle, Edit3, Eye, EyeOff, Building, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getAllCountries, getCitiesForCountry } from '@/lib/countries-cities'
import CloudLoader from '@/components/CloudLoader'
import { useToast } from '@/components/ui/toast'
import { logger } from '@/lib/logger'

interface UserProfile {
  id?: string
  name?: string
  email: string
  bio?: string
  phone?: string
  country?: string
  city?: string
  occupation?: string
  verified?: boolean
  verification_method?: string
  profile_visibility?: 'public' | 'limited' | 'private'
  marketing_emails?: boolean
  social_links?: {
    website?: string
    instagram?: string
    twitter?: string
  }
}

export default function ProfilePage() {
  const { showToast } = useToast()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Form fields
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    email: '',
    bio: '',
    phone: '',
    country: '',
    city: '',
    occupation: '',
    profile_visibility: 'public',
    marketing_emails: true,
    social_links: {
      website: '',
      instagram: '',
      twitter: ''
    }
  })
  
  // Location data
  const [availableCountries, setAvailableCountries] = useState<string[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])
  
  // Load countries on mount
  useEffect(() => {
    const countries = getAllCountries()
    setAvailableCountries(countries)
  }, [])

  // Load cities when country changes
  useEffect(() => {
    if (formData.country) {
      const cities = getCitiesForCountry(formData.country)
      setAvailableCities(cities)
    } else {
      setAvailableCities([])
    }
  }, [formData.country])

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    const savedProfile = localStorage.getItem('pinpacks_user_profile')
    if (!savedProfile) {
      // No profile found, redirect to sign in
      window.location.href = '/auth'
      return
    }

    try {
      const localProfile = JSON.parse(savedProfile)
      
      // Try to fetch full profile from database
      const { data: dbProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', localProfile.email)
        .maybeSingle()

      if (error) {
        logger.error('Error fetching profile from database:', error)
      }

      // Merge local storage profile with database profile
      const mergedProfile: UserProfile = {
        email: localProfile.email,
        name: dbProfile?.name || localProfile.name || '',
        bio: dbProfile?.bio || '',
        phone: dbProfile?.phone || '',
        country: dbProfile?.country || '',
        city: dbProfile?.city || '',
        occupation: dbProfile?.occupation || '',
        verified: dbProfile?.verified || false,
        verification_method: dbProfile?.verification_method || '',
        profile_visibility: dbProfile?.profile_visibility || 'public',
        marketing_emails: dbProfile?.marketing_emails !== undefined ? dbProfile.marketing_emails : true,
        social_links: dbProfile?.social_links || { website: '', instagram: '', twitter: '' }
      }

      setUserProfile(mergedProfile)
      setFormData(mergedProfile)
      
    } catch (error) {
      logger.error('Error parsing user profile:', error)
      window.location.href = '/auth'
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
    }))
  }

  const handleSaveProfile = async () => {
    if (!formData.email?.trim()) {
      showToast('Please enter a valid email address', 'error')
      return
    }

    setIsSaving(true)
    try {
      logger.log('Saving profile data:', formData)
      
      // Prepare profile data for database
      const profileData = {
        email: formData.email.trim(),
        name: formData.name?.trim() || null,
        phone: formData.phone?.trim() || null,
        country: formData.country || null,
        city: formData.city || null,
        bio: formData.bio?.trim() || null,
        occupation: formData.occupation?.trim() || null,
        profile_visibility: formData.profile_visibility || 'public',
        marketing_emails: formData.marketing_emails !== undefined ? formData.marketing_emails : true,
        social_links: formData.social_links || {},
        updated_at: new Date().toISOString()
      }

      logger.log('Attempting to save to database:', profileData)
      
      // First, check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', formData.email.trim())
        .maybeSingle()

      logger.log('Existing user check:', { existingUser, checkError })

      let saveResult
      if (existingUser) {
        // Update existing user
        logger.log('Updating existing user with ID:', existingUser.id)
        saveResult = await supabase
          .from('users')
          .update(profileData)
          .eq('id', existingUser.id)
          .select()
      } else {
        // Insert new user
        logger.log('Creating new user')
        saveResult = await supabase
          .from('users')
          .insert([profileData])
          .select()
      }

      logger.log('Database save result:', saveResult)

      if (saveResult.error) {
        logger.error('Database save error:', saveResult.error)
        showToast(`Profile save failed: ${saveResult.error.message || 'Unknown database error'}. Please try again or contact support if the issue persists.`, 'error')
        return
      }

      // Verify the data was saved by fetching it back
      const { data: verifyData, error: verifyError } = await supabase
        .from('users')
        .select('*')
        .eq('email', formData.email.trim())
        .single()

      logger.log('Verification query result:', { verifyData, verifyError })

      if (verifyError) {
        logger.warn('Could not verify saved data:', verifyError)
      } else {
        logger.log('Successfully verified saved data:', verifyData)
      }

      // Prepare profile data for localStorage (simplified version)
      const localStorageProfile = {
        email: formData.email.trim(),
        name: formData.name?.trim() || '',
        phone: formData.phone?.trim() || '',
        country: formData.country || '',
        city: formData.city || '',
        bio: formData.bio?.trim() || '',
        occupation: formData.occupation?.trim() || '',
        profile_visibility: formData.profile_visibility || 'public',
        marketing_emails: formData.marketing_emails !== undefined ? formData.marketing_emails : true,
        social_links: formData.social_links || { website: '', instagram: '', twitter: '' },
        updated_at: new Date().toISOString()
      }

      logger.log('Saving to localStorage:', localStorageProfile)
      
      // Save to localStorage
      localStorage.setItem('pinpacks_user_profile', JSON.stringify(localStorageProfile))
      
      // Update local state
      setUserProfile(localStorageProfile)
      
      // Trigger storage event to update navigation
      window.dispatchEvent(new Event('storage'))
      
      showToast('Profile updated successfully!', 'success')
      logger.log('Profile updated successfully!')
      logger.log('Profile save completed successfully')
      
    } catch (err) {
      logger.error('Profile update error:', err)
      showToast(`Failed to update profile: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again or contact support if the issue persists.`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const requestVerification = () => {
    showToast('Verification request submitted! Our team will review your profile and contact you within 2-3 business days.', 'info')
  }

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    try {
      // Mark account as deleted in database
      await supabase
        .from('users')
        .update({ 
          account_status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('email', userProfile?.email)

      // Clear all user data from localStorage
      const keysToRemove = [
        'pinpacks_user_profile', 'pinpacks_user_id', 'pinpacks_user_email',
        'pinpacks_user_type', 'pinpacks_user_ip', 'pinpacks_user_location',
        'pinpacks_create_pins', 'pinpacks_create_pack_details', 'pinpacks_wishlist'
      ]
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Trigger storage event to update navigation
      window.dispatchEvent(new Event('storage'))
      
      showToast('Your account has been deleted. You will be redirected to the homepage.', 'success')
      window.location.href = '/'
      
    } catch (error) {
      logger.error('Error deleting account:', error)
      showToast('Failed to delete account. Please try again or contact support.', 'error')
    }
  }

  const handleLogout = () => {
    const confirmLogout = confirm('Are you sure you want to sign out?')
    if (confirmLogout) {
      // Clear all user data from localStorage
      localStorage.removeItem('pinpacks_user_profile')
      localStorage.removeItem('pinpacks_user_id')
      localStorage.removeItem('pinpacks_user_email')
      localStorage.removeItem('pinpacks_user_type')
      localStorage.removeItem('pinpacks_user_ip')
      localStorage.removeItem('pinpacks_user_location')
      
      // Trigger storage event to update navigation
      window.dispatchEvent(new Event('storage'))
      
      window.location.href = '/'
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-25">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <CloudLoader size="xl" text="Loading your profile..." />
          </div>
        </div>
      </div>
    )
  }

  // If no user profile (shouldn't happen due to redirect above)
  if (!userProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-25">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-coral-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {formData.name?.charAt(0).toUpperCase() || formData.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              {userProfile.verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-coral-500 rounded-full flex items-center justify-center">
                  <Verified className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Profile
          </h1>
          <p className="text-xl text-gray-600">
            Manage your personal information and account settings
          </p>
        </div>

        {/* Main Profile Form */}
        <div className="space-y-8">
          
          {/* Basic Information */}
          <div className="card-airbnb p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <User className="h-6 w-6 text-primary-500 mr-3" />
              Basic Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your full name"
                  className="input-airbnb w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  className="input-airbnb w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="input-airbnb w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Occupation
                </label>
                <input
                  type="text"
                  value={formData.occupation || ''}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  placeholder="Local guide, photographer, etc."
                  className="input-airbnb w-full"
                />
              </div>
            </div>

            {/* Bio Section */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                About You
              </label>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell travelers about yourself, your local knowledge, and what makes your recommendations special..."
                rows={4}
                className="input-airbnb w-full resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {(formData.bio || '').length}/500 characters
              </p>
            </div>
          </div>

          {/* Location Information */}
          <div className="card-airbnb p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <MapPin className="h-6 w-6 text-primary-500 mr-3" />
              Location
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Country
                </label>
                <select
                  value={formData.country || ''}
                  onChange={(e) => {
                    handleInputChange('country', e.target.value)
                    handleInputChange('city', '') // Reset city when country changes
                  }}
                  className="input-airbnb w-full"
                >
                  <option value="">Select a country</option>
                  {availableCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  City
                </label>
                <select
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  disabled={!formData.country}
                  className="input-airbnb w-full disabled:opacity-50"
                >
                  <option value="">Select a city</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>


          {/* Social Links */}
          <div className="card-airbnb p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Globe className="h-6 w-6 text-primary-500 mr-3" />
              Social Links
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.social_links?.website || ''}
                  onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                  placeholder="https://pincloud.co"
                  className="input-airbnb w-full"
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={formData.social_links?.instagram || ''}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    placeholder="@username"
                    className="input-airbnb w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Twitter
                  </label>
                  <input
                    type="text"
                    value={formData.social_links?.twitter || ''}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    placeholder="@username"
                    className="input-airbnb w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="card-airbnb p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Shield className="h-6 w-6 text-primary-500 mr-3" />
              Account Verification
            </h2>
            
            <div className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
              {userProfile.verified ? (
                <>
                  <div className="w-10 h-10 bg-coral-500 rounded-full flex items-center justify-center">
                    <Verified className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Verified Creator</h3>
                    <p className="text-gray-600">
                      Your account has been verified as a local creator.
                      {userProfile.verification_method && (
                        <span className="block text-sm mt-1">
                          Verified via: {userProfile.verification_method}
                        </span>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Not Verified</h3>
                    <p className="text-gray-600 mb-3">
                      Get verified as a local creator to build trust with travelers and increase your pack visibility.
                    </p>
                    <button
                      onClick={requestVerification}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      Request Verification
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>


          {/* Save Button */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleSaveProfile}
              disabled={isSaving || !formData.email?.trim()}
              className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <CloudLoader size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>

          {/* Account Management */}
          <div className="card-airbnb p-6 border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Management</h2>
            
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Delete Account</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Permanently remove your account and all data
                  </p>
                </div>
                
                <div>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-xs text-gray-500 hover:text-red-600 underline transition-colors"
                    >
                      Delete account
                    </button>
                  ) : (
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-2">Are you sure?</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
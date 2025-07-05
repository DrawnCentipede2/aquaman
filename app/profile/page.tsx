'use client'

import { useState, useEffect } from 'react'
import { User, Mail, MapPin, ShoppingBag, Store, Settings, LogOut, Save } from 'lucide-react'
import CloudLoader from '@/components/CloudLoader'

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [userType, setUserType] = useState<'buyer' | 'seller'>('buyer')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load user profile on component mount
  useEffect(() => {
    const loadUserProfile = () => {
      const savedProfile = localStorage.getItem('pinpacks_user_profile')
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile)
          setUserProfile(profile)
          setEmail(profile.email || '')
          setUserType(profile.userType || 'buyer')
        } catch (error) {
          console.error('Error parsing user profile:', error)
          // Redirect to sign in if profile is corrupted
          window.location.href = '/auth'
        }
      } else {
        // No profile found, redirect to sign in
        window.location.href = '/auth'
      }
      setIsLoading(false)
    }
    
    loadUserProfile()
  }, [])

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!email.trim()) {
      alert('Please enter a valid email address')
      return
    }

    setIsSaving(true)
    try {
      // Update the user profile with new information
      const updatedProfile = {
        ...userProfile,
        email: email.trim().toLowerCase(),
        userId: email.trim().toLowerCase(),
        userType: userType,
        lastUpdated: new Date().toISOString()
      }

      // Save to localStorage
      localStorage.setItem('pinpacks_user_profile', JSON.stringify(updatedProfile))
      localStorage.setItem('pinpacks_user_id', updatedProfile.userId)
      localStorage.setItem('pinpacks_user_email', updatedProfile.email)
      localStorage.setItem('pinpacks_user_type', updatedProfile.userType)

      setUserProfile(updatedProfile)
      
      // Trigger storage event to update navigation
      window.dispatchEvent(new Event('storage'))
      
      alert('✅ Profile updated successfully!')
    } catch (err) {
      alert('Failed to update profile. Please try again.')
      console.error('Profile update error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Logout function
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
      
      alert('👋 You have been signed out.')
      window.location.href = '/'
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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

  const isBuyer = userType === 'buyer'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-full">
              <User className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-800 bg-clip-text text-transparent mb-4">
            Profile Settings
          </h1>
          <p className="text-xl text-gray-600">
            Manage your account preferences and settings
          </p>
        </div>

        {/* Profile Information Card */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Settings className="h-6 w-6 mr-2 text-blue-500" />
            Account Information
          </h2>
          
          <div className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This is used to identify your account and sync your data
              </p>
            </div>

            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Buyer Option */}
                <button
                  type="button"
                  onClick={() => setUserType('buyer')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    userType === 'buyer'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Buyer</div>
                  <div className="text-xs mt-1">Browse & download pin packs</div>
                </button>

                {/* Seller Option */}
                <button
                  type="button"
                  onClick={() => setUserType('seller')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    userType === 'seller'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Store className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-sm font-medium">Seller</div>
                  <div className="text-xs mt-1">Create & sell pin packs</div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {isBuyer 
                  ? 'As a buyer, you can browse and download pin packs. Seller features will be hidden.'
                  : 'As a seller, you can create and manage pin packs. You also have access to buyer features.'
                }
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving || !email.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
              >
                {isSaving ? (
                  <>
                    <CloudLoader size="sm" className="mr-2" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Account Details Card */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Details</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Current Email</label>
                <p className="text-lg text-gray-900">{userProfile.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Account Type</label>
                <p className="text-lg text-gray-900 flex items-center">
                  {userProfile.userType === 'buyer' ? (
                    <>
                      <ShoppingBag className="h-5 w-5 mr-2 text-blue-500" />
                      Buyer
                    </>
                  ) : (
                    <>
                      <Store className="h-5 w-5 mr-2 text-green-500" />
                      Seller
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Member Since</label>
                <p className="text-lg text-gray-900">{new Date(userProfile.created).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Location</label>
                <p className="text-lg text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                  {userProfile.location}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <a 
            href="/dashboard"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg px-8 py-4 rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 inline-flex items-center justify-center"
          >
            <User className="h-5 w-5 mr-2" />
            Go to Dashboard
          </a>
          {userType === 'seller' && (
            <a 
              href="/create"
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg px-8 py-4 rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 inline-flex items-center justify-center"
            >
              <Store className="h-5 w-5 mr-2" />
              Create Pin Pack
            </a>
          )}
        </div>

        {/* Sign Out Button */}
        <div className="text-center">
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-800 font-medium px-6 py-2 border border-red-300 rounded-lg hover:bg-red-50 transition-colors inline-flex items-center"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
} 
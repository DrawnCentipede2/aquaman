'use client'

import { useState, useEffect } from 'react'
import { User, MapPin, ShoppingBag, Store, Heart, Download, Eye, Settings, Plus } from 'lucide-react'

export default function DashboardPage() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication and load user profile
  useEffect(() => {
    const loadUserProfile = () => {
      const savedProfile = localStorage.getItem('pinpacks_user_profile')
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile)
          setUserProfile(profile)
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // If no user profile (shouldn't happen due to redirect above)
  if (!userProfile) {
    return null
  }

  const userType = userProfile.userType || 'buyer'
  const isBuyer = userType === 'buyer'
  const isSeller = userType === 'seller'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full ${
              isBuyer 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                : 'bg-gradient-to-r from-green-500 to-emerald-600'
            }`}>
              {isBuyer ? <ShoppingBag className="h-12 w-12 text-white" /> : <Store className="h-12 w-12 text-white" />}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
            Welcome to Your Dashboard
          </h1>
                      <p className="text-xl text-gray-600">
              {isBuyer 
                ? 'Discover and manage your favorite experiences' 
                : 'Manage your experience collections and track your performance'
              }
            </p>
          <div className="mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isBuyer 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {isBuyer ? <ShoppingBag className="h-4 w-4 mr-1" /> : <Store className="h-4 w-4 mr-1" />}
              {isBuyer ? 'Buyer Account' : 'Seller Account'}
            </span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {isBuyer ? (
            // Buyer Stats
            <>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                <div className="flex items-center">
                  <Heart className="h-8 w-8 text-red-500 mr-3" />
                                  <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-600">Liked Experiences</p>
                </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                <div className="flex items-center">
                  <Download className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-sm text-gray-600">Downloaded</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-sm text-gray-600">Saved Places</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Seller Stats
            <>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                <div className="flex items-center">
                  <Store className="h-8 w-8 text-green-500 mr-3" />
                                  <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-600">Experiences Created</p>
                </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                <div className="flex items-center">
                  <Download className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-sm text-gray-600">Total Downloads</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-purple-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-sm text-gray-600">Views This Month</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <a 
              href="/profile"
              className="text-rose-500 hover:text-rose-600 font-medium text-sm"
            >
              Switch to {isBuyer ? 'Seller' : 'Buyer'} →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isBuyer ? (
              // Buyer Actions - Focused on discovery and personal management
              <>
                <a 
                  href="/browse"
                  className="group p-6 border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-center"
                >
                  <MapPin className="h-10 w-10 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold text-blue-900 mb-1">Discover Experiences</p>
                  <p className="text-sm text-blue-700">Browse curated local collections</p>
                </a>
                <a 
                  href="/profile"
                  className="group p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
                >
                  <Settings className="h-10 w-10 text-gray-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold text-gray-900 mb-1">Account Settings</p>
                  <p className="text-sm text-gray-600">Manage your preferences</p>
                </a>
                <div className="group p-6 border border-purple-200 bg-purple-50 rounded-xl text-center">
                  <Heart className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                  <p className="font-semibold text-purple-900 mb-1">Saved Favorites</p>
                  <p className="text-sm text-purple-700">Coming in next update</p>
                </div>
                <div className="group p-6 border border-orange-200 bg-orange-50 rounded-xl text-center">
                  <Download className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                  <p className="font-semibold text-orange-900 mb-1">My Downloads</p>
                  <p className="text-sm text-orange-700">Track your explored places</p>
                </div>
              </>
            ) : (
              // Seller Actions - Focused on creation and business management
              <>
                <a 
                  href="/create"
                  className="group p-6 border border-green-200 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-center"
                >
                  <Plus className="h-10 w-10 text-green-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold text-green-900 mb-1">Create Experience</p>
                  <p className="text-sm text-green-700">Add a new collection</p>
                </a>
                <a 
                  href="/manage"
                  className="group p-6 border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-center"
                >
                  <Store className="h-10 w-10 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold text-blue-900 mb-1">Manage Collections</p>
                  <p className="text-sm text-blue-700">Edit your experiences</p>
                </a>
                <a 
                  href="/profile"
                  className="group p-6 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
                >
                  <Settings className="h-10 w-10 text-gray-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold text-gray-900 mb-1">Guide Profile</p>
                  <p className="text-sm text-gray-600">Update your guide info</p>
                </a>
                <div className="group p-6 border border-purple-200 bg-purple-50 rounded-xl text-center">
                  <Eye className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                  <p className="font-semibold text-purple-900 mb-1">Analytics</p>
                  <p className="text-sm text-purple-700">Track performance</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500 mb-2">
              {isBuyer ? "No activity yet" : "No experience activity yet"}
            </p>
            <p className="text-gray-400">
              {isBuyer 
                ? "Start browsing experiences to see your activity here" 
                : "Create your first experience collection to start tracking activity"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
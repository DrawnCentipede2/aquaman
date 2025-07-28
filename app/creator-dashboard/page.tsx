'use client'

import { useState, useEffect } from 'react'
import { Plus, Package, Settings, TrendingUp, DollarSign, Users, Eye, Star, MapPin, Calendar, BarChart3, Edit3, Trash2, ArrowLeft } from 'lucide-react'
import CloudLoader from '@/components/CloudLoader'
import Link from 'next/link'

export default function CreatorDashboard() {
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPacks: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalViews: 0,
    avgRating: 0
  })

  // Load user profile and creator stats
  useEffect(() => {
    const loadCreatorData = () => {
      const savedProfile = localStorage.getItem('pinpacks_user_profile')
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile)
          setUserProfile(profile)
          
          // Mock stats for now - in real app, fetch from API
          setStats({
            totalPacks: 3,
            totalSales: 47,
            totalRevenue: 235.50,
            totalViews: 1250,
            avgRating: 4.8
          })
        } catch (error) {
          console.error('Error parsing user profile:', error)
          window.location.href = '/auth'
        }
      } else {
        window.location.href = '/auth'
      }
      setIsLoading(false)
    }
    
    loadCreatorData()
  }, [])

  // Handle marking user as creator-eligible and registered
  useEffect(() => {
    // Mark user as creator eligible when they visit dashboard
    localStorage.setItem('pinpacks_has_created_packs', 'true')
    // Register user as a creator when they access the dashboard
    localStorage.setItem('pinpacks_is_registered_creator', 'true')
    
    // Trigger storage event to update navigation
    window.dispatchEvent(new Event('storage'))
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
              <div className="text-center">
        <CloudLoader size="xl" text="Loading your creator dashboard..." />
      </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-25">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/browse"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Browse
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage your pin packs and track your performance</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {userProfile?.name || userProfile?.email?.split('@')[0] || 'Creator'}
                </div>
                <div className="text-xs text-coral-600 font-medium">Creator</div>
              </div>
              <div className="w-10 h-10 bg-coral-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {userProfile?.name?.charAt(0).toUpperCase() || userProfile?.email?.charAt(0).toUpperCase() || 'C'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Create Pack Card */}
          <Link 
            href="/create"
            className="group bg-gradient-to-br from-coral-500 to-coral-600 rounded-2xl p-8 text-white hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Plus className="h-7 w-7 text-white" />
              </div>
              <div className="text-white/80 group-hover:text-white transition-colors">
                <span className="text-sm font-medium">Get Started</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">Create New Pack</h3>
            <p className="text-white/90 text-lg">
              Share your local expertise and create amazing pin collections for travelers
            </p>
          </Link>

          {/* Manage Packs Card */}
          <Link 
            href="/manage"
            className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 text-white hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Settings className="h-7 w-7 text-white" />
              </div>
              <div className="text-white/80 group-hover:text-white transition-colors">
                <span className="text-sm font-medium">{stats.totalPacks} Packs</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">Manage Packs</h3>
            <p className="text-white/90 text-lg">
              Edit, update, and manage your existing pin pack collections
            </p>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Overview</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {/* Total Packs */}
            <div className="text-center">
              <div className="w-12 h-12 bg-coral-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Package className="h-6 w-6 text-coral-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalPacks}</div>
              <div className="text-sm text-gray-600">Total Packs</div>
            </div>

            {/* Total Sales */}
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalSales}</div>
              <div className="text-sm text-gray-600">Total Sales</div>
            </div>

            {/* Total Revenue */}
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">${stats.totalRevenue}</div>
              <div className="text-sm text-gray-600">Revenue</div>
            </div>

            {/* Total Views */}
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Views</div>
            </div>

            {/* Avg Rating */}
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.avgRating}</div>
              <div className="text-sm text-gray-600">Avg Rating</div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Packs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Your Recent Packs</h3>
              <Link 
                href="/manage"
                className="text-coral-600 hover:text-coral-700 font-medium text-sm"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {/* Mock pack items */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-coral-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-coral-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Hidden Gems of Barcelona</h4>
                  <p className="text-sm text-gray-600">Created 3 days ago • 12 pins</p>
                </div>
                <div className="flex space-x-2">
                  <button className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <Edit3 className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-coral-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-coral-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Tokyo Food Adventure</h4>
                  <p className="text-sm text-gray-600">Created 1 week ago • 18 pins</p>
                </div>
                <div className="flex space-x-2">
                  <button className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <Edit3 className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Creator Resources */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Creator Resources</h3>
            
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Analytics Dashboard</h4>
                  <p className="text-sm text-gray-600">Track detailed performance metrics</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Creator Community</h4>
                  <p className="text-sm text-gray-600">Connect with other creators</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Content Calendar</h4>
                  <p className="text-sm text-gray-600">Plan your pack releases</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
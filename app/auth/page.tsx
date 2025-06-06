'use client'

import { useState, useEffect } from 'react'
import { User, Mail, MapPin, ArrowRight } from 'lucide-react'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check if user is already logged in
  useEffect(() => {
    const savedProfile = localStorage.getItem('pinpacks_user_profile')
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile))
    }
  }, [])

  // Simple email-based authentication
  const handleAuth = async () => {
    if (!email.trim()) {
      alert('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      // Get user's IP and location for enhanced profile
      const response = await fetch('https://ipapi.co/json/')
      const locationData = await response.json()
      
      // Create user profile
      const userProfile = {
        email: email.trim().toLowerCase(),
        userId: `user_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
        ip: locationData.ip || 'unknown',
        location: `${locationData.city}, ${locationData.country_name}` || 'Unknown',
        created: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }

      // Save to localStorage
      localStorage.setItem('pinpacks_user_profile', JSON.stringify(userProfile))
      localStorage.setItem('pinpacks_user_id', userProfile.userId)
      localStorage.setItem('pinpacks_user_email', userProfile.email)
      localStorage.setItem('pinpacks_user_ip', userProfile.ip)
      localStorage.setItem('pinpacks_user_location', userProfile.location)

      setUserProfile(userProfile)
      
      alert(`✅ Welcome! You're now logged in as ${userProfile.email}`)
    } catch (err) {
      alert('Failed to authenticate. Please try again.')
      console.error('Auth error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('pinpacks_user_profile')
    localStorage.removeItem('pinpacks_user_id')
    localStorage.removeItem('pinpacks_user_email')
    localStorage.removeItem('pinpacks_user_ip')
    localStorage.removeItem('pinpacks_user_location')
    setUserProfile(null)
    setEmail('')
    alert('👋 You have been logged out.')
  }

  // If user is logged in, show profile
  if (userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-full">
                <User className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-800 bg-clip-text text-transparent mb-4">
              Welcome Back!
            </h1>
            <p className="text-xl text-gray-600">
              You're successfully authenticated and ready to manage your pin packs.
            </p>
          </div>

          {/* User Profile Card */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-lg text-gray-900">{userProfile.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <p className="text-lg text-gray-900">{userProfile.location}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Member Since</label>
                  <p className="text-lg text-gray-900">{new Date(userProfile.created).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">User ID</label>
                  <p className="text-sm font-mono text-gray-700 bg-gray-100 p-2 rounded">{userProfile.userId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a 
              href="/manage"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg px-8 py-4 rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 inline-flex items-center justify-center"
            >
              <MapPin className="h-5 w-5 mr-2" />
              Manage Your Pins
              <ArrowRight className="h-5 w-5 ml-2" />
            </a>
            <a 
              href="/create"
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg px-8 py-4 rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 inline-flex items-center justify-center"
            >
              <MapPin className="h-5 w-5 mr-2" />
              Create New Pack
            </a>
          </div>

          {/* Logout Button */}
          <div className="text-center">
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-800 font-medium px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Login form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
              <User className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
            Sign In
          </h1>
          <p className="text-xl text-gray-600">
            Enter your email to access your pin packs
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
          <div className="space-y-6">
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
                  onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                We'll use this to identify your account and link your pin packs
              </p>
            </div>

            <button
              onClick={handleAuth}
              disabled={isLoading || !email.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                <>
                  <User className="h-5 w-5 mr-2" />
                  Sign In
                </>
              )}
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">✨ How It Works</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Enter your email to create/access your account</li>
              <li>• All your pin packs will be linked to this email</li>
              <li>• No password needed - simple email-based authentication</li>
              <li>• Your data is saved locally and synced with your email</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 
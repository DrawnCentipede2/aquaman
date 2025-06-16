'use client'

import { useState, useEffect } from 'react'
import { User, Mail, MapPin, ArrowRight, LogOut, Settings } from 'lucide-react'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check if user is already logged in
  useEffect(() => {
    const checkInitialAuth = () => {
      setIsCheckingAuth(true)
      const savedProfile = localStorage.getItem('pinpacks_user_profile')
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile))
      }
      setIsCheckingAuth(false)
    }
    
    checkInitialAuth()
  }, [])

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-100 mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
          </div>
          <p className="text-gray-600 text-lg">Checking your profile...</p>
        </div>
      </div>
    )
  }

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
        userId: email.trim().toLowerCase(),
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
      
      // Trigger storage event to update navigation
      window.dispatchEvent(new Event('storage'))
      
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
    
    // Trigger storage event to update navigation
    window.dispatchEvent(new Event('storage'))
  }

  // If user is logged in, show profile
  if (userProfile) {
    return (
      <div className="min-h-screen bg-gray-25">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-coral-500 mb-6">
              <div className="text-2xl font-bold text-white">
                {userProfile.email.charAt(0).toUpperCase()}
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Welcome back!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              You're all set to create amazing pin packs and share your favorite places with travelers.
            </p>
          </div>

          {/* Profile Card */}
          <div className="card-airbnb max-w-2xl mx-auto mb-8">
            <div className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-coral-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
                  {userProfile.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {userProfile.email.split('@')[0]}
                  </h2>
                  <p className="text-gray-600">{userProfile.email}</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Location
                  </label>
                  <p className="text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {userProfile.location}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Member since
                  </label>
                  <p className="text-gray-600">
                    {new Date(userProfile.created).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Create Pin Pack */}
            <a 
              href="/create"
              className="card-airbnb card-airbnb-hover group p-8 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-100 mb-4 group-hover:bg-coral-200 transition-colors">
                <MapPin className="h-8 w-8 text-coral-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-coral-600 transition-colors">
                Create Pin Pack
              </h3>
              <p className="text-gray-600 mb-4">
                Share your favorite local spots with travelers around the world.
              </p>
              <div className="flex items-center justify-center text-coral-500 font-medium">
                <span>Get started</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>

            {/* Manage Pins */}
            <a 
              href="/manage"
              className="card-airbnb card-airbnb-hover group p-8 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 group-hover:bg-gray-200 transition-colors">
                <Settings className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                Manage Your Pins
              </h3>
              <p className="text-gray-600 mb-4">
                View, edit, and manage all your pin packs in one place.
              </p>
              <div className="flex items-center justify-center text-gray-500 font-medium">
                <span>Manage pins</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </a>
          </div>

          {/* Logout */}
          <div className="text-center">
            <button
              onClick={handleLogout}
              className="btn-secondary inline-flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Login form - Airbnb-inspired design
  return (
    <div className="min-h-screen bg-gray-25 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-500 mb-6">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Welcome to PinPacks
          </h1>
          <p className="text-gray-600">
            Sign in to create and manage your pin packs
          </p>
        </div>

        {/* Login Card */}
        <div className="card-airbnb">
          <div className="p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="input-airbnb pl-10 w-full"
                    onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                  />
                </div>
              </div>

              <button
                onClick={handleAuth}
                disabled={isLoading || !email.trim()}
                className="w-full btn-primary py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Continue
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            We'll use this email to create your profile and manage your pin packs.
          </p>
        </div>
      </div>
    </div>
  )
} 
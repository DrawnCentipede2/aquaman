'use client'

import { useState, useEffect } from 'react'
import { User, Mail, ShoppingBag, Store, ArrowRight } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [userType, setUserType] = useState<'buyer' | 'seller'>('buyer')
  const [isLoading, setIsLoading] = useState(false)

  // Check if user is already logged in and redirect
  useEffect(() => {
    const savedProfile = localStorage.getItem('pinpacks_user_profile')
    if (savedProfile) {
      // User is already logged in, redirect to dashboard
      window.location.href = '/dashboard'
    }
  }, [])

  // Handle user authentication with user type selection
  const handleSignIn = async () => {
    if (!email.trim()) {
      alert('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      // Get user's IP and location for enhanced profile
      const response = await fetch('https://ipapi.co/json/')
      const locationData = await response.json()
      
      // Create user profile with selected user type
      const userProfile = {
        email: email.trim().toLowerCase(),
        userId: email.trim().toLowerCase(),
        userType: userType, // Store the selected user type
        ip: locationData.ip || 'unknown',
        location: `${locationData.city}, ${locationData.country_name}` || 'Unknown',
        created: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }

      // Save to localStorage
      localStorage.setItem('pinpacks_user_profile', JSON.stringify(userProfile))
      localStorage.setItem('pinpacks_user_id', userProfile.userId)
      localStorage.setItem('pinpacks_user_email', userProfile.email)
      localStorage.setItem('pinpacks_user_type', userProfile.userType)
      localStorage.setItem('pinpacks_user_ip', userProfile.ip)
      localStorage.setItem('pinpacks_user_location', userProfile.location)
      
      // Trigger storage event to update navigation
      window.dispatchEvent(new Event('storage'))
      
      // Redirect to dashboard after successful sign in
      alert(`✅ Welcome! You're now signed in as a ${userType}.`)
      window.location.href = '/dashboard'
    } catch (err) {
      alert('Failed to sign in. Please try again.')
      console.error('Sign in error:', err)
    } finally {
      setIsLoading(false)
    }
  }

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
            Join PinPacks and start discovering amazing places
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
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
                  onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                I want to join as a...
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
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleSignIn}
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
                  Sign In as {userType === 'buyer' ? 'Buyer' : 'Seller'}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </button>
          </div>

          {/* Information Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">✨ How It Works</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Enter your email to create your account</li>
              <li>• Choose if you want to buy or sell pin packs</li>
              <li>• No password needed - simple email-based authentication</li>
              <li>• You can change your account type later in your profile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 
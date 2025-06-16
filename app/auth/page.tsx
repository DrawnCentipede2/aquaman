'use client'

import { useState, useEffect } from 'react'
import { User, Mail, MapPin, ArrowRight, LogOut, CreditCard, Globe, DollarSign, HelpCircle, Settings, Bell } from 'lucide-react'

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

  // Simple email-based sign in for existing users
  const handleSignIn = async () => {
    if (!email.trim()) {
      alert('Please enter your email address')
      return
    }

    setIsLoading(true)
    try {
      // For now, we'll simulate checking if user exists
      // In a real app, you'd check against a database
      const existingProfile = localStorage.getItem(`pinpacks_profile_${email.trim().toLowerCase()}`)
      
      if (existingProfile) {
        // User exists, sign them in
        const profile = JSON.parse(existingProfile)
        profile.lastLogin = new Date().toISOString()
        
        localStorage.setItem('pinpacks_user_profile', JSON.stringify(profile))
        localStorage.setItem('pinpacks_user_id', profile.userId)
        localStorage.setItem('pinpacks_user_email', profile.email)
        
        setUserProfile(profile)
        window.dispatchEvent(new Event('storage'))
      } else {
        // User doesn't exist, redirect to signup
        alert('No account found with this email. Please create a new account.')
        window.location.href = '/signup'
        return
      }
      
    } catch (err) {
      alert('Failed to sign in. Please try again.')
      console.error('Sign in error:', err)
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
                {userProfile.name?.charAt(0).toUpperCase() || userProfile.email.charAt(0).toUpperCase()}
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Account Settings
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Manage your profile, payment methods, and preferences
            </p>
          </div>

          {/* Profile Card */}
          <div className="card-airbnb max-w-2xl mx-auto mb-8">
            <div className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-coral-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
                  {userProfile.name?.charAt(0).toUpperCase() || userProfile.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {userProfile.name || userProfile.email.split('@')[0]}
                  </h2>
                  <p className="text-gray-600">{userProfile.email}</p>
                  <span className="inline-block bg-coral-100 text-coral-700 text-xs font-semibold px-2 py-1 rounded-full mt-1">
                    Verified Member
                  </span>
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

          {/* Account Settings Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {/* Payment Methods */}
            <div className="card-airbnb card-airbnb-hover group p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3 group-hover:bg-green-200 transition-colors">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                Payment Methods
              </h3>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                Manage your credit cards, PayPal, and other payment options.
              </p>
              <div className="flex items-center text-green-600 font-medium text-sm">
                <span>Manage payments</span>
                <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Language & Region */}
            <div className="card-airbnb card-airbnb-hover group p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3 group-hover:bg-blue-200 transition-colors">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                Language & Region
              </h3>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                Set your preferred language, currency, and time zone.
              </p>
              <div className="flex items-center text-blue-600 font-medium text-sm">
                <span>Update preferences</span>
                <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Currency Settings */}
            <div className="card-airbnb card-airbnb-hover group p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-3 group-hover:bg-yellow-200 transition-colors">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-yellow-600 transition-colors">
                Currency
              </h3>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                Choose your preferred currency for prices and payments.
              </p>
              <div className="flex items-center text-yellow-600 font-medium text-sm">
                <span>Change currency</span>
                <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Notifications */}
            <div className="card-airbnb card-airbnb-hover group p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-3 group-hover:bg-purple-200 transition-colors">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                Notifications
              </h3>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                Control how and when you receive notifications from us.
              </p>
              <div className="flex items-center text-purple-600 font-medium text-sm">
                <span>Manage notifications</span>
                <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Privacy & Security */}
            <div className="card-airbnb card-airbnb-hover group p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3 group-hover:bg-gray-200 transition-colors">
                <Settings className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                Privacy & Security
              </h3>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                Update your privacy settings and security preferences.
              </p>
              <div className="flex items-center text-gray-600 font-medium text-sm">
                <span>Security settings</span>
                <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Support */}
            <div className="card-airbnb card-airbnb-hover group p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-coral-100 mb-3 group-hover:bg-coral-200 transition-colors">
                <HelpCircle className="h-6 w-6 text-coral-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-coral-600 transition-colors">
                Support
              </h3>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                Get help, contact us, or visit our help center.
              </p>
              <div className="flex items-center text-coral-500 font-medium text-sm">
                <span>Get support</span>
                <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
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

  // Sign in form for existing users
  return (
    <div className="min-h-screen bg-gray-25 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-500 mb-6">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Welcome back
          </h1>
          <p className="text-gray-600">
            Sign in to your PinPacks account
          </p>
        </div>

        {/* Sign In Card */}
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
                    onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                  />
                </div>
              </div>

              <button
                onClick={handleSignIn}
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
                    Sign in
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/signup" className="text-coral-500 hover:text-coral-600 font-medium">
              Create one here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 
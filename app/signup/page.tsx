'use client'

import { useState } from 'react'
import { User, Mail, ArrowRight } from 'lucide-react'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Handle form submission
  const handleSignUp = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      // Get user's IP and location for enhanced profile
      const response = await fetch('https://ipapi.co/json/')
      const locationData = await response.json()
      
      // Create user profile
      const userProfile = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        userId: formData.email.trim().toLowerCase(),
        ip: locationData.ip || 'unknown',
        location: `${locationData.city}, ${locationData.country_name}` || 'Unknown',
        created: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }

      // Save to localStorage
      localStorage.setItem('PinCloud_user_profile', JSON.stringify(userProfile))
      localStorage.setItem('PinCloud_user_id', userProfile.userId)
      localStorage.setItem('PinCloud_user_email', userProfile.email)
      localStorage.setItem('PinCloud_user_ip', userProfile.ip)
      localStorage.setItem('PinCloud_user_location', userProfile.location)
      
      // Also save the profile with email as key for signin to find
      localStorage.setItem(`PinCloud_profile_${userProfile.email}`, JSON.stringify(userProfile))

      // Trigger storage event to update navigation
      window.dispatchEvent(new Event('storage'))
      
      // Redirect to browse page
      window.location.href = '/browse'
      
    } catch (err) {
      alert('Failed to create profile. Please try again.')
      console.error('Sign up error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-25 flex items-center justify-center">
      <div className="max-w-lg w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-500 mb-6">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Create your profile
          </h1>
          <p className="text-gray-600">
            Join PinCloud and start sharing or discovering amazing places
          </p>
        </div>

        {/* Sign Up Card */}
        <div className="card-airbnb">
          <div className="p-8">
            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="input-airbnb pl-10 w-full"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="input-airbnb pl-10 w-full"
                  />
                </div>
              </div>

              {/* Sign Up Button */}
              <button
                onClick={handleSignUp}
                disabled={isLoading || !formData.name.trim() || !formData.email.trim()}
                className="w-full btn-primary py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating profile...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    Create profile
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/auth" className="text-primary-500 hover:text-primary-600 font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 
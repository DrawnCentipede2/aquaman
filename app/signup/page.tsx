'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import CloudLoader from '@/components/CloudLoader'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast'
import { logger } from '@/lib/logger'

export default function SignUpPage() {
  const router = useRouter()
  const { showToast } = useToast()
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
      showToast('Please fill in all fields', 'error')
      return
    }

    setIsLoading(true)
    try {
      logger.log('🔐 Starting signup process for:', formData.email)
      
      // Create user profile in database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          email: formData.email.trim().toLowerCase(),
          name: formData.name.trim(),
          created_at: new Date().toISOString()
        }])
        .select()

      if (userError) {
        logger.error('User creation error:', userError)
        throw userError
      }

      logger.log('✅ User created in database:', userData)

      // Save to localStorage for immediate access
      const userProfile = {
        email: formData.email.trim().toLowerCase(),
        name: formData.name.trim(),
        userType: 'buyer', // Default to buyer
        created_at: new Date().toISOString()
      }

      logger.log('💾 Saving user profile to localStorage:', userProfile)
      
      localStorage.setItem('pinpacks_user_profile', JSON.stringify(userProfile))
      localStorage.setItem('pinpacks_user_id', userProfile.email)
      localStorage.setItem('pinpacks_user_email', userProfile.email)
      localStorage.setItem('pinpacks_user_type', 'buyer')

      // Clear any existing purchased packs from localStorage for new accounts
      // This ensures new users don't see old pack data from previous sessions
      localStorage.removeItem('pinpacks_purchased')
      logger.log('🧹 Cleared existing purchased packs from localStorage for new account')

      // Verify the profile was saved correctly
      const savedProfile = localStorage.getItem('pinpacks_user_profile')
      logger.log('🔍 Verification - Saved profile from localStorage:', savedProfile)

      // Check if user came from sell page (indicated by referrer or URL parameter)
      const cameFromSell = document.referrer.includes('/sell') || window.location.search.includes('from=sell')
      
      if (cameFromSell) {
        // Mark user as creator eligible and registered since they came from sell page
        localStorage.setItem('pinpacks_has_created_packs', 'true')
        localStorage.setItem('pinpacks_is_registered_creator', 'true')
        logger.log('🎯 User came from sell page, marked as creator')
      }

      logger.log('📡 Triggering storage event to update navigation')
      // Trigger storage event to update navigation
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'pinpacks_user_profile',
        newValue: JSON.stringify(userProfile)
      }))
      
      // Also trigger custom authentication event for immediate notification
      window.dispatchEvent(new CustomEvent('custom-auth-event'))
      logger.log('📡 Triggering custom authentication event')

      // Add a small delay to ensure localStorage is properly saved and Navigation component has time to process
      logger.log('⏳ Adding delay to ensure profile is properly loaded...')
      await new Promise(resolve => setTimeout(resolve, 500))

      // Verify profile is still there after delay
      const profileAfterDelay = localStorage.getItem('pinpacks_user_profile')
      logger.log('🔍 Verification after delay - Profile still in localStorage:', profileAfterDelay)

      logger.log('🚀 Redirecting to browse page')
      // Redirect to browse page
      router.push('/browse')
      
    } catch (err) {
      showToast('Failed to create profile. Please try again.', 'error')
      logger.error('❌ Sign up error:', err)
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
                    <CloudLoader size="sm" className="mr-2" />
                    <span>Creating profile...</span>
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
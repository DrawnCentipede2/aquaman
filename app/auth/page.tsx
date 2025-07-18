'use client'

import { useState, useEffect } from 'react'
import { User, Mail, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [attempts, setAttempts] = useState(0)

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
      console.log('Please enter your email address')
      return
    }

    setIsLoading(true)
    try {
      // For now, we'll attempt to fetch user from Supabase
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .single()

      if (userError && userError.code !== 'PGRST116') {
        console.error('Supabase select error:', userError)
        throw userError
      }

      if (userRow) {
        // Update last_login timestamp
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userRow.id)

        const profile = {
          name: userRow.name || 'User',
          email: userRow.email,
          userId: userRow.id,
          location: userRow.location,
          ip: userRow.ip,
          created: userRow.created_at,
          lastLogin: new Date().toISOString()
        }

        localStorage.setItem('pinpacks_user_profile', JSON.stringify(profile))
        localStorage.setItem('pinpacks_user_id', profile.userId)
        localStorage.setItem('pinpacks_user_email', profile.email)
        localStorage.setItem('pinpacks_user_location', profile.location || '')
        localStorage.setItem('pinpacks_user_ip', profile.ip || '')

        setUserProfile(profile)
        window.dispatchEvent(new Event('storage'))
        window.location.href = '/browse'
        return
      }

      // Fallback to old localStorage profile (legacy)
      const existingProfile = localStorage.getItem(`pinpacks_profile_${email.trim().toLowerCase()}`)
      if (existingProfile) {
        const profile = JSON.parse(existingProfile)
        profile.lastLogin = new Date().toISOString()
        localStorage.setItem('pinpacks_user_profile', JSON.stringify(profile))
        localStorage.setItem('pinpacks_user_id', profile.userId)
        localStorage.setItem('pinpacks_user_email', profile.email)
        setUserProfile(profile)
        window.dispatchEvent(new Event('storage'))
        window.location.href = '/browse'
        return
      }
      
      // If we reached here, user not found in DB or legacy storage
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      if (newAttempts >= 3) {
        if (confirm('We still could not find an account with that email.\n\nWould you like to create a new account?')) {
          window.location.href = '/signup'
        } else {
          setEmail('')
        }
      } else {
        console.log('No account found with that email. Please double-check the address and try again.')
        setEmail('')
      }
      return
      
    } catch (err) {
      console.log('Failed to sign in. Please try again.')
      console.error('Sign in error:', err)
    } finally {
      setIsLoading(false)
    }
  }



  // If user is already logged in, redirect to browse page
  if (userProfile) {
    window.location.href = '/browse'
    return null
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
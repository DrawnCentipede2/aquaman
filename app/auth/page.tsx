'use client'

import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const [isProcessing, setIsProcessing] = useState(true)

  // After OAuth redirect back to this page, capture the Supabase user session,
  // ensure a corresponding row exists in `users`, persist a minimal profile in localStorage,
  // then redirect into the app.
  useEffect(() => {
    const bootstrapFromSession = async () => {
      try {
        const { data: userResult } = await supabase.auth.getUser()
        const user = userResult?.user

        if (!user) {
          setIsProcessing(false)
          return
        }

        const email = (user.email || '').toLowerCase()
        const name = (user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'User') as string
        const avatarUrl = (user.user_metadata?.avatar_url || '') as string

        // Upsert user profile (requires INSERT/UPDATE RLS policies that match email claim)
        await supabase
          .from('users')
          .upsert({
            email,
            name,
            profile_picture: avatarUrl,
            last_login: new Date().toISOString()
          }, { onConflict: 'email' })

        // Load the full row (including id) to store locally
        const { data: row } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()

        const profile = {
          name,
          email,
          userId: row?.id || user.id,
          lastLogin: new Date().toISOString()
        }

        localStorage.setItem('pinpacks_user_profile', JSON.stringify(profile))
        localStorage.setItem('pinpacks_user_id', profile.userId)
        localStorage.setItem('pinpacks_user_email', profile.email)

        // Clear any legacy keys from older flows
        localStorage.removeItem('pinpacks_purchased')

        window.dispatchEvent(new Event('storage'))
        window.location.href = '/browse'
      } catch {
        setIsProcessing(false)
      }
    }

    bootstrapFromSession()
  }, [])

  const handleGoogleSignIn = async () => {
    // Redirect back to this page so the effect above can process the session
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth` : undefined
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    })
  }

  return (
    <div className="min-h-screen bg-gray-25 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-500 mb-6">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Sign in</h1>
          <p className="text-gray-600">Use your Google account to continue</p>
        </div>

        <div className="card-airbnb">
          <div className="p-8">
            <button
              onClick={handleGoogleSignIn}
              disabled={isProcessing}
              className="w-full btn-primary py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue with Google
            </button>
            {!isProcessing && (
              <p className="text-xs text-gray-500 mt-4 text-center">
                Having trouble? Refresh and try again.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
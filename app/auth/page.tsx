'use client'

import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const [isProcessing, setIsProcessing] = useState(true)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

        await postLoginBootstrap()
      } catch {
        setIsProcessing(false)
      }
    }

    bootstrapFromSession()
  }, [])

  const postLoginBootstrap = async () => {
    try {
      const { data: userResult } = await supabase.auth.getUser()
      const user = userResult?.user
      if (!user) return

      const normalizedEmail = (user.email || '').toLowerCase()
      const displayName = (user.user_metadata?.full_name || user.user_metadata?.name || normalizedEmail.split('@')[0] || 'User') as string
      const avatarUrl = (user.user_metadata?.avatar_url || '') as string

      await supabase
        .from('users')
        .upsert({
          email: normalizedEmail,
          name: displayName,
          profile_picture: avatarUrl,
          last_login: new Date().toISOString()
        }, { onConflict: 'email' })

      const { data: row } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .single()

      const profile = {
        name: displayName,
        email: normalizedEmail,
        userId: row?.id || user.id,
        lastLogin: new Date().toISOString()
      }

      localStorage.setItem('pinpacks_user_profile', JSON.stringify(profile))
      localStorage.setItem('pinpacks_user_id', profile.userId)
      localStorage.setItem('pinpacks_user_email', profile.email)

      localStorage.removeItem('pinpacks_purchased')

      window.dispatchEvent(new Event('storage'))
      window.location.href = '/browse'
    } catch (e) {
      // If anything fails, just allow UI to remain
      setIsProcessing(false)
    }
  }

  const handleGoogleSignIn = async () => {
    // Redirect back to this page so the effect above can process the session
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth` : undefined
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    })
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data?.user) {
        await postLoginBootstrap()
      } else {
        setError('Sign in failed. Please try again.')
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      })
      if (error) {
        // If email is already registered, instruct to sign in
        if ((error as any)?.status === 400 && (error.message || '').toLowerCase().includes('already')) {
          setError('This email is already registered. Please sign in instead.')
          return
        }
        // Some providers may still send a confirmation email even if API responds 500
        if ((error as any)?.status >= 500) {
          setMessage('If you received a confirmation email, follow the link to finish creating your account. If not, please try again in a moment.')
          return
        }
        throw error
      }
      // If email confirmation is enabled, there may be no session yet
      if (data?.user && data?.session) {
        await postLoginBootstrap()
      } else {
        setIsProcessing(false)
        // Show guidance to check email
        setMessage('Check your email to confirm your account. Then sign in to continue.')
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to create account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-25 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-500 mb-6">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Welcome</h1>
          <p className="text-gray-600">Sign in or create an account</p>
        </div>

        <div className="card-airbnb">
          <div className="p-6">
            <div className="flex items-center justify-center space-x-6">
              <button
                className={`text-sm font-medium ${mode === 'signin' ? 'text-coral-600' : 'text-gray-500'} hover:text-coral-600`}
                onClick={() => setMode('signin')}
                disabled={isProcessing}
              >
                Sign in
              </button>
              <span className="text-gray-300">|</span>
              <button
                className={`text-sm font-medium ${mode === 'signup' ? 'text-coral-600' : 'text-gray-500'} hover:text-coral-600`}
                onClick={() => setMode('signup')}
                disabled={isProcessing}
              >
                Create account
              </button>
            </div>
          </div>

          <div className="px-6 pb-2">
            {error && (
              <div className="mb-4 text-sm text-red-600 text-center">{error}</div>
            )}
            {message && !error && (
              <div className="mb-4 text-sm text-gray-700 text-center">{message}</div>
            )}
          </div>

          <div className="px-6 pb-6">
            {mode === 'signin' ? (
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full input"
                    placeholder="you@example.com"
                    disabled={isProcessing || submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full input"
                    placeholder="••••••••"
                    disabled={isProcessing || submitting}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full btn-primary py-3"
                  disabled={isProcessing || submitting}
                >
                  {submitting ? 'Signing in...' : 'Sign in with email'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full input"
                    placeholder="Jane Doe"
                    disabled={isProcessing || submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full input"
                    placeholder="you@example.com"
                    disabled={isProcessing || submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full input"
                    placeholder="At least 6 characters"
                    disabled={isProcessing || submitting}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full btn-primary py-3"
                  disabled={isProcessing || submitting}
                >
                  {submitting ? 'Creating account...' : 'Create account with email'}
                </button>
              </form>
            )}
          </div>

          <div className="p-6 pt-0">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={isProcessing}
                className="w-full btn-secondary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {/* Google G icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 31.7 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.4 2.9l5.7-5.7C33.6 7 28.9 5 24 5 12.4 5 3 14.4 3 26s9.4 21 21 21 21-9.4 21-21c0-1.9-.2-3.7-.6-5.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.9 15.4 19.1 13 24 13c2.8 0 5.4 1.1 7.4 2.9l5.7-5.7C33.6 7 28.9 5 24 5 16.2 5 9.6 9.2 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 47c5.2 0 9.9-2 13.4-5.3l-6.2-5.2C29.1 38.7 26.7 39.5 24 39.5c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 42.8 16.2 47 24 47z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.1-3.7 5.5-6.7 6.7l6.2 5.2C36.1 41 45 36 45 26c0-1.9-.2-3.7-.6-5.5z"/>
                </svg>
                Sign in with Google
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
    </div>
  )
}
'use client'

import { User } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function SignUpPage() {
  const handleGoogleSignIn = async () => {
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth` : undefined
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    })
  }

  return (
    <div className="min-h-screen bg-gray-25 flex items-center justify-center">
      <div className="max-w-lg w-full mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-500 mb-6">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Create your profile</h1>
          <p className="text-gray-600">Use Google to create your account</p>
        </div>

        <div className="card-airbnb">
          <div className="p-8">
            <button
              onClick={handleGoogleSignIn}
              className="w-full btn-primary py-4 text-base"
            >
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
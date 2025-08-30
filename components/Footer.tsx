'use client'

import React, { useEffect, useState, useCallback } from 'react'

// Lightweight auth check using localStorage (same key used across app)
const getInitialAuth = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    return !!localStorage.getItem('pinpacks_user_profile')
  } catch {
    return false
  }
}

export default function Footer() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  const checkAuth = useCallback(() => {
    const next = getInitialAuth()
    setIsAuthenticated(next)
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === 'pinpacks_user_profile' ||
        e.key === 'PinCloud_user_profile'
      ) {
        checkAuth()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [checkAuth])

  const handleProtectedLink = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAuthenticated) {
      e.preventDefault()
      // Ask Navigation to open its existing login popup
      window.dispatchEvent(new Event('open-login-popup'))
    }
  }

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              About
            </h3>
            <ul className="space-y-3">
              <li><a href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">How it works</a></li>
              <li><a href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">Our mission</a></li>
              <li><a href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">Careers</a></li>
            </ul>
          </div>
          
          {/* Community Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Community
            </h3>
            <ul className="space-y-3">
              <li><a href="/browse" className="text-gray-600 hover:text-gray-900 transition-colors">Browse packs</a></li>
              <li>
                <a
                  href="/create"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={handleProtectedLink}
                >
                  Create a pack
                </a>
              </li>
              <li>
                <a
                  href="/manage"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={handleProtectedLink}
                >
                  Your pins
                </a>
              </li>
            </ul>
          </div>
          
          {/* Support Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li><a href="/help" className="text-gray-600 hover:text-gray-900 transition-colors">Help center</a></li>
              <li><a href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact us</a></li>
            </ul>
          </div>
        </div>
        
        {/* Footer bottom */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-600 mb-4 md:mb-0">
            &copy; 2024 PinCloud. Connecting travelers with local insights.
          </div>
          <div className="flex space-x-6 text-sm text-gray-600">
            <a href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-gray-900 transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}



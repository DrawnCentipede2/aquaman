'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User, Plus, Search } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const userProfileData = localStorage.getItem('pinpacks_user_profile')
      if (userProfileData) {
        setUserProfile(JSON.parse(userProfileData))
        setIsAuthenticated(true)
      } else {
        setUserProfile(null)
        setIsAuthenticated(false)
      }
    }
    
    checkAuth()
    
    // Listen for storage changes (when user signs in/out)
    window.addEventListener('storage', checkAuth)
    
    return () => window.removeEventListener('storage', checkAuth)
  }, [])

  // Function to determine if a path is active
  const isActivePath = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  // Get navigation link classes with Airbnb styling
  const getLinkClasses = (path: string) => {
    const baseClasses = "px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full hover:bg-gray-100 relative"
    if (isActivePath(path)) {
      return `${baseClasses} text-coral-500 bg-coral-50 hover:bg-coral-100`
    }
    return `${baseClasses} text-gray-700 hover:text-gray-900`
  }

  // Handle Create Pack click - redirect to login if not authenticated
  const handleCreatePackClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault()
      window.location.href = '/auth'
    }
    // If authenticated, let the normal link work
  }

  return (
    <nav className="flex items-center space-x-1">
      {/* Main navigation links - removed Browse Packs since it's on home page */}
      <div className="hidden md:flex items-center space-x-1">
        <a href="/" className={getLinkClasses('/')}>
          Home
        </a>
        <a href="/about" className={getLinkClasses('/about')}>
          About
        </a>
        <a href="/manage" className={getLinkClasses('/manage')}>
          Your Pins
        </a>
      </div>

      {/* Right side actions - Different based on authentication */}
      <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-gray-200">
        {!isAuthenticated ? (
          <>
            {/* Not authenticated - Show Sign In and Create Pack (redirects to login) */}
            <a 
              href="/auth" 
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </a>

            <a 
              href="/create" 
              onClick={handleCreatePackClick}
              className="inline-flex items-center space-x-2 btn-primary text-sm font-semibold shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Create Pack</span>
            </a>
          </>
        ) : (
          <>
            {/* Authenticated - Show only Profile */}
            <a 
              href="/auth" 
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <div className="w-8 h-8 bg-coral-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {userProfile?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900">
                  {userProfile?.email?.split('@')[0] || 'Profile'}
                </div>
                <div className="text-xs text-gray-500">
                  Profile & Settings
                </div>
              </div>
              <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
            </a>
          </>
        )}
      </div>

      {/* Mobile menu button - only show on mobile */}
      <div className="md:hidden ml-4">
        <button 
          className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
          onClick={() => {
            // Toggle mobile menu (you can implement this later)
            console.log('Mobile menu toggle')
          }}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </nav>
  )
} 
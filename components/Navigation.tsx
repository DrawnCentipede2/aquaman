'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Navigation() {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const userProfile = localStorage.getItem('pinpacks_user_profile')
      setIsAuthenticated(!!userProfile)
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

  // Get navigation link classes
  const getLinkClasses = (path: string) => {
    const baseClasses = "px-3 py-2 font-medium transition-all duration-200 relative"
    if (isActivePath(path)) {
      return `${baseClasses} text-primary-600 border-b-2 border-primary-600`
    }
    return `${baseClasses} text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg`
  }

  // Get Create Pack button classes
  const getCreateButtonClasses = () => {
    const baseClasses = "btn-primary transition-all duration-200"
    if (isActivePath('/create')) {
      return `${baseClasses} bg-primary-700 shadow-lg transform scale-105`
    }
    return baseClasses
  }

  return (
    <nav className="flex space-x-2">
      <a href="/" className={getLinkClasses('/')}>
        Home
      </a>
      <a href="/browse" className={getLinkClasses('/browse')}>
        Browse Packs
      </a>
      <a href="/about" className={getLinkClasses('/about')}>
        About Us
      </a>
      <a href="/manage" className={getLinkClasses('/manage')}>
        Your Pins
      </a>
      <a href={isAuthenticated ? "/auth" : "/auth"} className={getLinkClasses('/auth')}>
        {isAuthenticated ? 'Profile' : 'Profile'}
        {isAuthenticated && (
          <span className="ml-1 inline-block w-2 h-2 bg-green-400 rounded-full"></span>
        )}
      </a>
      <a href="/create" className={getCreateButtonClasses()}>
        Create Pack
      </a>
    </nav>
  )
} 
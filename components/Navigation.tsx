'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { User, Plus, Heart, ShoppingCart, Package, Settings, ChevronDown, Globe, DollarSign, Bell, HelpCircle, LogOut, X, Check, CreditCard, Shield, Lock } from 'lucide-react'

// Function to check authentication status immediately
const getInitialAuthState = () => {
  if (typeof window === 'undefined') return { isAuthenticated: false, userProfile: null }
  
  try {
    const userProfileData = localStorage.getItem('pinpacks_user_profile')
    if (userProfileData) {
      const parsedProfile = JSON.parse(userProfileData)
      return { isAuthenticated: true, userProfile: parsedProfile }
    }
  } catch (error) {
    console.warn('Error parsing initial auth state:', error)
    // Clean up corrupted data
    localStorage.removeItem('pinpacks_user_profile')
  }
  
  return { isAuthenticated: false, userProfile: null }
}

export default function Navigation() {
  const pathname = usePathname()
  
  // Track if component has mounted to prevent hydration mismatch
  const [isMounted, setIsMounted] = useState(false)
  
  // Initialize with false to match server-side rendering
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  // Login popup state
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  
  // Modal states for settings popups
  const [showCurrencyModal, setShowCurrencyModal] = useState(false)
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [selectedRegion, setSelectedRegion] = useState('United States')
  
  // Creator status tracking
  const [isCreatorEligible, setIsCreatorEligible] = useState(false)

  // Currency options
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' }
  ]

  // Language and region options
  const languages = [
    { code: 'en', name: 'English', regions: ['United States', 'United Kingdom', 'Canada', 'Australia'] },
    { code: 'es', name: 'Español', regions: ['Spain', 'Mexico', 'Argentina', 'Colombia'] },
    { code: 'fr', name: 'Français', regions: ['France', 'Canada', 'Belgium', 'Switzerland'] },
    { code: 'de', name: 'Deutsch', regions: ['Germany', 'Austria', 'Switzerland'] },
    { code: 'it', name: 'Italiano', regions: ['Italy', 'Switzerland'] },
    { code: 'pt', name: 'Português', regions: ['Brazil', 'Portugal'] },
    { code: 'ja', name: '日本語', regions: ['Japan'] },
    { code: 'ko', name: '한국어', regions: ['South Korea'] },
    { code: 'zh', name: '中文', regions: ['China', 'Taiwan', 'Hong Kong'] }
  ]

  // Check authentication and load preferences on mount
  useEffect(() => {
    // Mark component as mounted
    setIsMounted(true)
    
    // Check authentication state after mounting
    const initialAuthState = getInitialAuthState()
    setIsAuthenticated(initialAuthState.isAuthenticated)
    setUserProfile(initialAuthState.userProfile)
    
    // Load saved preferences if user is authenticated
    if (initialAuthState.isAuthenticated) {
      const savedCurrency = localStorage.getItem('pinpacks_currency') || 'USD'
      const savedLanguage = localStorage.getItem('pinpacks_language') || 'English'
      const savedRegion = localStorage.getItem('pinpacks_region') || 'United States'
      const hasCreatedPacks = localStorage.getItem('pinpacks_has_created_packs') === 'true'
      
      setSelectedCurrency(savedCurrency)
      setSelectedLanguage(savedLanguage)
      setSelectedRegion(savedRegion)
      setIsCreatorEligible(hasCreatedPacks)
    }
    
    // Listen for storage changes (when user signs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pinpacks_user_profile') {
        console.log('User profile storage changed, updating auth state')
        const newAuthState = getInitialAuthState()
        setIsAuthenticated(newAuthState.isAuthenticated)
        setUserProfile(newAuthState.userProfile)
        
        // Load preferences if newly authenticated
        if (newAuthState.isAuthenticated) {
          const savedCurrency = localStorage.getItem('pinpacks_currency') || 'USD'
          const savedLanguage = localStorage.getItem('pinpacks_language') || 'English'
          const savedRegion = localStorage.getItem('pinpacks_region') || 'United States'
          const hasCreatedPacks = localStorage.getItem('pinpacks_has_created_packs') === 'true'
          
          setSelectedCurrency(savedCurrency)
          setSelectedLanguage(savedLanguage)
          setSelectedRegion(savedRegion)
          setIsCreatorEligible(hasCreatedPacks)
        }
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('profile-dropdown')
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const currencyModal = document.getElementById('currency-modal')
      const languageModal = document.getElementById('language-modal')
      const paymentModal = document.getElementById('payment-modal')
      const privacyModal = document.getElementById('privacy-modal')
      const loginPopup = document.getElementById('login-popup')
      
      if (currencyModal && !currencyModal.contains(event.target as Node)) {
        setShowCurrencyModal(false)
      }
      if (languageModal && !languageModal.contains(event.target as Node)) {
        setShowLanguageModal(false)
      }
      if (paymentModal && !paymentModal.contains(event.target as Node)) {
        setShowPaymentModal(false)
      }
      if (privacyModal && !privacyModal.contains(event.target as Node)) {
        setShowPrivacyModal(false)
      }
      if (loginPopup && !loginPopup.contains(event.target as Node)) {
        setShowLoginPopup(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Function to determine if a path is active
  const isActivePath = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  // Get navigation link classes with animated coral underline
  const getLinkClasses = (path: string) => {
    const baseClasses = "px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full relative nav-link"
    if (isActivePath(path)) {
      return `${baseClasses} text-gray-900 nav-link-active`
    }
    return `${baseClasses} text-gray-700 hover:text-gray-900`
  }

  // Handle logout function
  const handleLogout = () => {
    localStorage.removeItem('pinpacks_user_profile')
    localStorage.removeItem('pinpacks_user_id')
    localStorage.removeItem('pinpacks_user_email')
    localStorage.removeItem('pinpacks_user_ip')
    localStorage.removeItem('pinpacks_user_location')
    localStorage.removeItem('pinpacks_has_created_packs')
    setUserProfile(null)
    setIsAuthenticated(false)
    setIsDropdownOpen(false)
    setIsCreatorEligible(false)
    
    // Trigger storage event to update navigation
    window.dispatchEvent(new Event('storage'))
    
    // Redirect to home page
    window.location.href = '/'
  }

  // Handle protected actions (show login popup if not authenticated)
  const handleProtectedAction = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    if (isAuthenticated) {
      window.location.href = href
    } else {
      setShowLoginPopup(true)
    }
  }

  // Handle currency selection
  const handleCurrencySelect = (currency: any) => {
    setSelectedCurrency(currency.code)
    localStorage.setItem('pinpacks_currency', currency.code)
    setShowCurrencyModal(false)
    // You could also trigger a global event here to update prices throughout the app
    window.dispatchEvent(new CustomEvent('currencyChanged', { detail: currency }))
  }

  // Handle language selection
  const handleLanguageSelect = (language: any, region: string) => {
    setSelectedLanguage(language.name)
    setSelectedRegion(region)
    localStorage.setItem('pinpacks_language', language.name)
    localStorage.setItem('pinpacks_region', region)
    setShowLanguageModal(false)
    // You could also trigger a global event here to update language throughout the app
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language, region } }))
  }



  // Show loading state during hydration to prevent mismatch
  if (!isMounted) {
    return (
      <nav className="flex items-center space-x-1">
        {/* Loading state - show buyer mode by default during hydration */}
        <div className="hidden md:flex items-center space-x-1">
          <a href="/browse" className={getLinkClasses('/browse')}>
            Browse
          </a>
          
          <a 
            href="/wishlist" 
            className={getLinkClasses('/wishlist')}
            onClick={(e) => {
              e.preventDefault()
              // During loading, just prevent default - no popup yet
            }}
          >
            <Heart className="h-4 w-4 inline mr-1" />
            Wishlist
          </a>
          
          <a 
            href="/cart" 
            className={getLinkClasses('/cart')}
            onClick={(e) => {
              e.preventDefault()
              // During loading, just prevent default - no popup yet
            }}
          >
            <ShoppingCart className="h-4 w-4 inline mr-1" />
            Cart
          </a>

          <a href="/sell" className={getLinkClasses('/sell')}>
            <DollarSign className="h-4 w-4 inline mr-1" />
            Sell like a local
          </a>
        </div>
        
        {/* Right side actions - Identical Profile button during loading */}
        <div 
          className="flex items-center space-x-3 ml-6 pl-6 border-l border-gray-200" 
          style={{ 
            opacity: 1, 
            visibility: 'visible',
            display: 'flex'
          } as React.CSSProperties}
        >
          {/* Identical Profile button - prevents any visual change */}
          <div className="relative">
            <button
              onClick={() => {}} // No functionality during loading
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '9999px',
                opacity: 1,
                color: '#374151',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                border: 'none',
                outline: 'none'
              } as React.CSSProperties}
            >
              <div 
                style={{ 
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444', // Same red color
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}
              >
                                 <User style={{ width: '1rem', height: '1rem' }} />
               </div>
               <div 
                 className="hidden sm:block"
                 style={{
                   fontSize: '0.875rem',
                   fontWeight: '500',
                   color: '#111827'
                 } as React.CSSProperties}
               >
                 Profile
               </div>
               <ChevronDown 
                 style={{ 
                   width: '1rem', 
                   height: '1rem',
                   color: '#6b7280'
                 }}
              />
            </button>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <>
      <nav className="flex items-center space-x-1">
        {/* Main navigation links - consistent for all users */}
        <div className="hidden md:flex items-center space-x-1">
          <a href="/browse" className={getLinkClasses('/browse')}>
            Browse
          </a>
          
          <a 
            href="/wishlist" 
            className={getLinkClasses('/wishlist')}
            onClick={(e) => handleProtectedAction(e, '/wishlist')}
          >
            <Heart className="h-4 w-4 inline mr-1" />
            Wishlist
          </a>
          
          <a 
            href="/cart" 
            className={getLinkClasses('/cart')}
            onClick={(e) => handleProtectedAction(e, '/cart')}
          >
            <ShoppingCart className="h-4 w-4 inline mr-1" />
            Cart
          </a>

          {/* Only show "Sell like a local" if user hasn't created packs yet */}
          {!isCreatorEligible && (
            <a href="/sell" className={getLinkClasses('/sell')}>
              <DollarSign className="h-4 w-4 inline mr-1" />
              Sell like a local
            </a>
          )}
        </div>

        {/* Right side actions - Consistent Profile button for all users */}
        <div 
          className="flex items-center space-x-3 ml-6 pl-6 border-l border-gray-200" 
          style={{ 
            opacity: 1, 
            visibility: 'visible',
            display: 'flex'
          } as React.CSSProperties}
        >
          {/* Single Profile button - completely static, no loading states */}
          <div className="relative" id="profile-dropdown">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '9999px',
                transition: 'background-color 0.2s',
                opacity: 1,
                color: '#374151',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                border: 'none',
                outline: 'none'
              } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div 
                style={{ 
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444', // Red color instead of orange
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}
              >
                <User style={{ width: '1rem', height: '1rem' }} />
              </div>
              <div 
                className="hidden sm:block"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#111827'
                } as React.CSSProperties}
              >
                Profile
              </div>
              <ChevronDown 
                style={{ 
                  width: '1rem', 
                  height: '1rem',
                  color: '#6b7280',
                  transition: 'transform 0.2s',
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </button>

            {/* Dropdown Menu - Different content based on authentication */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                {!isAuthenticated ? (
                  <>
                    {/* Not authenticated - Show login options */}
                    <div className="px-4 py-3 border-b border-gray-100 text-center">
                      <div className="w-12 h-12 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="h-6 w-6 text-coral-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Join PinPacks
                      </h3>
                      <p className="text-xs text-gray-600">
                        Sign in to access your account
                      </p>
                    </div>
                    
                    <div className="py-2 space-y-1">
                      <a
                        href="/auth"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="h-4 w-4 mr-3 text-gray-500" />
                        Sign In
                      </a>
                      
                      <a
                        href="/signup"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-coral-600 hover:bg-coral-50 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-3 text-coral-500" />
                        Create Account
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                                        {/* Authenticated - Show profile section */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-coral-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {userProfile?.name?.charAt(0).toUpperCase() || userProfile?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">
                            {userProfile?.name || userProfile?.email?.split('@')[0] || 'User'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {userProfile?.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Creator Dashboard Link */}
                    <div className="py-2">
                      <a
                        href="/creator-dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-3 text-gray-500" />
                        Creator Dashboard
                      </a>
                      
                      <div className="border-t border-gray-100 my-2"></div>
                    </div>

                    {/* Quick Settings - Only essential items */}
                    <div className="py-2">
                      {/* Currency - Quick selector */}
                      <button
                        onClick={() => {
                          setShowCurrencyModal(true)
                          setIsDropdownOpen(false)
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-3 text-gray-500" />
                          Currency
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {currencies.find(c => c.code === selectedCurrency)?.code || 'USD'}
                        </span>
                      </button>
                      
                      {/* Language & Region - Quick selector */}
                      <button
                        onClick={() => {
                          setShowLanguageModal(true)
                          setIsDropdownOpen(false)
                        }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-3 text-gray-500" />
                          Language
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {selectedLanguage.split(' ')[0]}
                        </span>
                      </button>
                      
                      <div className="border-t border-gray-100 my-2"></div>
                      
                      {/* Pinventory */}
                      <a
                        href="/pinventory"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Package className="h-4 w-4 mr-3 text-gray-500" />
                        Pinventory
                      </a>
                      
                      {/* Payment Methods */}
                      <button
                        onClick={() => {
                          setShowPaymentModal(true)
                          setIsDropdownOpen(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <CreditCard className="h-4 w-4 mr-3 text-gray-500" />
                        Payment Methods
                      </button>
                      
                      {/* Privacy & Security */}
                      <button
                        onClick={() => {
                          setShowPrivacyModal(true)
                          setIsDropdownOpen(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Shield className="h-4 w-4 mr-3 text-gray-500" />
                        Privacy & Security
                      </button>
                      
                      {/* Notifications */}
                      <button
                        onClick={() => {
                          alert('Notification preferences:\n\n• Email notifications: ON\n• Push notifications: OFF\n• Marketing emails: ON\n\nFeature coming soon!')
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Bell className="h-4 w-4 mr-3 text-gray-500" />
                        Notifications
                      </button>
                      
                      {/* Support */}
                      <Link 
                        href="/help"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <HelpCircle className="h-4 w-4 mr-3 text-gray-500" />
                        Support
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
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

      {/* Currency Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl" id="currency-modal">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Choose Currency</h2>
              <button
                onClick={() => setShowCurrencyModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Currency List */}
            <div className="overflow-y-auto max-h-[60vh] p-4">
              <div className="space-y-2">
                {currencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => handleCurrencySelect(currency)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                      selectedCurrency === currency.code
                        ? 'bg-coral-50 border-2 border-coral-200'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-700">
                        {currency.symbol}
                      </span>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{currency.name}</div>
                        <div className="text-sm text-gray-500">{currency.code}</div>
                      </div>
                    </div>
                    {selectedCurrency === currency.code && (
                      <Check className="h-5 w-5 text-coral-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl" id="language-modal">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Language & Region</h2>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Language List */}
            <div className="overflow-y-auto max-h-[60vh] p-4">
              <div className="space-y-4">
                {languages.map((language) => (
                  <div key={language.code} className="space-y-2">
                    <h3 className="font-medium text-gray-900 text-sm">{language.name}</h3>
                    <div className="space-y-1">
                      {language.regions.map((region) => (
                        <button
                          key={`${language.code}-${region}`}
                          onClick={() => handleLanguageSelect(language, region)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                            selectedLanguage === language.name && selectedRegion === region
                              ? 'bg-coral-50 border-2 border-coral-200'
                              : 'hover:bg-gray-50 border-2 border-transparent'
                          }`}
                        >
                          <div className="text-left">
                            <div className="font-medium text-gray-900">{region}</div>
                            <div className="text-sm text-gray-500">{language.name}</div>
                          </div>
                          {selectedLanguage === language.name && selectedRegion === region && (
                            <Check className="h-5 w-5 text-coral-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl" id="payment-modal">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Payment Methods</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Payment Methods Content */}
            <div className="overflow-y-auto max-h-[60vh] p-6">
              <div className="space-y-4">
                {/* Current Payment Methods */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 text-sm">Your Payment Methods</h3>
                  
                  {/* Sample Payment Method */}
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">•••• •••• •••• 4242</div>
                        <div className="text-sm text-gray-500">Expires 12/25</div>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Default
                    </span>
                  </div>
                </div>

                {/* Add New Payment Method */}
                <div className="pt-4 border-t border-gray-100">
                  <button className="w-full flex items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-coral-300 hover:bg-coral-50 transition-colors">
                    <Plus className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-600 font-medium">Add New Payment Method</span>
                  </button>
                </div>

                {/* Payment Settings */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <h3 className="font-medium text-gray-900 text-sm">Settings</h3>
                  
                  <div className="space-y-2">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Auto-save payment methods</span>
                      <div className="w-10 h-6 bg-coral-500 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
                      </div>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Require CVV for purchases</span>
                      <div className="w-10 h-6 bg-coral-500 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
                      </div>
                    </label>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Security Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl" id="privacy-modal">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Privacy & Security</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Privacy & Security Content */}
            <div className="overflow-y-auto max-h-[60vh] p-6">
              <div className="space-y-6">
                {/* Account Security */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 text-sm flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Account Security
                  </h3>
                  
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <span className="text-sm text-gray-700">Change Password</span>
                      <span className="text-xs text-gray-500">Last changed 30 days ago</span>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <span className="text-sm text-gray-700">Two-Factor Authentication</span>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Off</span>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <span className="text-sm text-gray-700">Active Sessions</span>
                      <span className="text-xs text-gray-500">2 devices</span>
                    </button>
                  </div>
                </div>

                {/* Privacy Settings */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 text-sm flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Privacy Settings
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Profile visible to others</span>
                      <div className="w-10 h-6 bg-gray-300 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
                      </div>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Allow data for analytics</span>
                      <div className="w-10 h-6 bg-coral-500 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
                      </div>
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Personalized recommendations</span>
                      <div className="w-10 h-6 bg-coral-500 rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Data Management */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 text-sm">Data Management</h3>
                  
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <span className="text-sm text-gray-700">Download your data</span>
                      <span className="text-xs text-gray-500">Export all data</span>
                    </button>
                    
                    <button className="w-full flex items-center justify-between p-3 border border-red-200 rounded-xl hover:bg-red-50 transition-colors text-red-600">
                      <span className="text-sm">Delete account</span>
                      <span className="text-xs">Permanent</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  We take your privacy seriously. Read our{' '}
                  <button className="text-coral-500 hover:underline">Privacy Policy</button>{' '}
                  and{' '}
                  <button className="text-coral-500 hover:underline">Terms of Service</button>{' '}
                  for more details.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Required Popup */}
      {showLoginPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" id="login-popup">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Sign in required</h2>
              <button
                onClick={() => setShowLoginPopup(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-coral-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Join PinPacks to continue
                </h3>
                <p className="text-gray-600 mb-6">
                  Sign in to access your wishlist, cart, and start collecting amazing local experiences.
                </p>
                
                <div className="space-y-3">
                  <a
                    href="/auth"
                    className="w-full flex items-center justify-center px-4 py-3 bg-coral-600 text-white rounded-xl hover:bg-coral-700 transition-colors font-semibold"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </a>
                  
                  <a
                    href="/signup"
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Account
                  </a>
                </div>
                
                <p className="text-xs text-gray-500 mt-4">
                  You can browse packs without signing in, but you'll need an account to save favorites and make purchases.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 
'use client'

import { useState, useEffect, useRef } from 'react'
import { DollarSign, Users, Globe, Star, TrendingUp, CheckCircle, Heart, MapPin, Package, ArrowRight, Play, ChevronDown, ChevronUp, BarChart3, Target, Shield, Clock, Coffee, Camera, Utensils, Car } from 'lucide-react'

// Hook for counter animation - counts from 0 to target value
const useCounterAnimation = (targetValue: number, duration: number = 2000, shouldStart: boolean = false) => {
  const [currentValue, setCurrentValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!shouldStart || isAnimating) return

    setIsAnimating(true)
    let startTime: number | null = null
    let animationId: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      // Use easeOut animation for smooth effect
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(easeOut * targetValue)
      
      setCurrentValue(current)
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate)
      } else {
        setCurrentValue(targetValue)
        setIsAnimating(false)
      }
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [targetValue, duration, shouldStart, isAnimating])

  // If animation hasn't started yet, show the target value instead of 0
  // This prevents showing zeros while waiting for intersection observer
  return shouldStart ? currentValue : targetValue
}

// Custom hook for scroll animations
const useScrollAnimation = (threshold = 0.1, rootMargin = '0px 0px -50px 0px') => {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Keep observing so animations can repeat if element goes out and comes back
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return { elementRef, isVisible }
}

// Animated section wrapper component
const AnimatedSection = ({ 
  children, 
  className = '', 
  delay = 0,
  threshold = 0.1 
}: { 
  children: React.ReactNode
  className?: string
  delay?: number
  threshold?: number
}) => {
  const { elementRef, isVisible } = useScrollAnimation(threshold)

  return (
    <div
      ref={elementRef}
      className={`transition-all duration-700 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      } ${className}`}
      style={{
        transitionDelay: isVisible ? `${delay}ms` : '0ms'
      }}
    >
      {children}
    </div>
  )
}

// Animated stat component with counter animation
const AnimatedStat = ({ 
  value, 
  label, 
  shouldStart = false,
  delay = 0 
}: { 
  value: string
  label: string
  shouldStart?: boolean
  delay?: number
}) => {
  // Parse numeric value from string (e.g., "25,000+" -> 25000)
  const parseValue = (val: string): number => {
    // Handle decimal values (like ratings)
    if (val.includes('.') && !val.includes('M') && !val.includes('K')) {
      return parseFloat(val) * 10 // Multiply by 10 for smoother animation
    }
    
    // Remove symbols and convert to number
    const cleanValue = val.replace(/[+$,MK]/g, '')
    const numValue = parseFloat(cleanValue)
    
    // Handle multipliers
    if (val.includes('M')) {
      return numValue * 1000000
    } else if (val.includes('K')) {
      return numValue * 1000
    }
    return numValue
  }

  // Format number back to display format
  const formatValue = (num: number, originalFormat: string): string => {
    if (originalFormat.includes('M')) {
      return `$${(num / 1000000).toFixed(1)}M+`
    } else if (originalFormat.includes('.') && !originalFormat.includes('M') && !originalFormat.includes('K')) {
      return (num / 10).toFixed(1) // For ratings like 4.8
    } else if (originalFormat.includes('K') || (num >= 1000 && originalFormat.includes('+'))) {
      return `${Math.floor(num / 1000).toLocaleString()},${String(num % 1000).padStart(3, '0')}+`
    } else if (originalFormat.includes('$')) {
      return `$${num.toLocaleString()}+`
    }
    return num.toLocaleString() + (originalFormat.includes('+') ? '+' : '')
  }

  const targetValue = parseValue(value)
  const animatedValue = useCounterAnimation(
    targetValue, 
    2000 + delay, // Stagger animation timing
    shouldStart
  )

  return (
    <div>
      <div className="text-3xl md:text-4xl font-bold">
        {formatValue(animatedValue, value)}
      </div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  )
}

// Function to get initial user location to prevent hydration mismatch
const getInitialLocation = () => {
  if (typeof window === 'undefined') return 'your city'
  
  try {
    const userProfile = localStorage.getItem('pinpacks_user_profile')
    if (userProfile) {
      const profile = JSON.parse(userProfile)
      return profile.location || 'your city'
    }
  } catch (error) {
    console.warn('Error parsing user profile for location:', error)
  }
  
  return 'your city'
}

export default function SellPage() {
  const [userLocation, setUserLocation] = useState(getInitialLocation())
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [shouldAnimateStats, setShouldAnimateStats] = useState(false)

  // Remove sticky navigation behavior for sell page (normal scrolling)
  useEffect(() => {
    const header = document.querySelector('header')
    if (header) {
      header.classList.remove('sticky', 'top-0')
      header.style.position = 'relative'
    }

    // Cleanup function to restore sticky navigation when leaving page
    const cleanup = () => {
      if (header) {
        header.classList.add('sticky', 'top-0')
        header.style.position = ''
      }
    }

    return cleanup
  }, [])

  // Listen for location changes (when user updates profile in another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pinpacks_user_profile') {
        const newLocation = getInitialLocation()
        setUserLocation(newLocation)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Testimonials data - Real seller feedback examples
  const testimonials = [
    {
      name: "Maria Santos",
      location: "Barcelona, Spain",
      earnings: "$2,400",
      period: "last month",
      text: "I never thought sharing my favorite local spots could earn me this much! The platform is so easy to use and travelers really appreciate authentic recommendations.",
      avatar: "MS",
      packs: 8,
      rating: 4.9
    },
    {
      name: "James Chen",
      location: "Tokyo, Japan", 
      earnings: "$3,200",
      period: "last month",
      text: "As a local photographer, I love showing visitors the hidden gems tourists never see. It's rewarding both financially and personally.",
      avatar: "JC",
      packs: 12,
      rating: 5.0
    },
    {
      name: "Sophie Martin",
      location: "Paris, France",
      earnings: "$1,800",
      period: "last month", 
      text: "Started as a side project, now it's become a significant income source. The community of travelers is amazing and so grateful.",
      avatar: "SM",
      packs: 6,
      rating: 4.8
    }
  ]

  // FAQ data - Common questions from potential sellers
  const faqs = [
    {
      question: "How much can I really earn?",
      answer: "Earnings vary by location and effort, but our top sellers earn $1,000-$5,000 monthly. Most active sellers in popular cities earn $300-$1,500 per month. Your earnings depend on pack quality, pricing, and local demand."
    },
    {
      question: "What makes a good pin pack?",
      answer: "Great packs include 5-15 carefully curated places with detailed descriptions, insider tips, and personal stories. Focus on specific themes like 'hidden coffee shops,' 'sunset spots,' or 'local food gems' rather than generic tourist attractions."
    },
    {
      question: "How do I get paid?",
      answer: "We process payments monthly via PayPal or bank transfer. You keep 80% of each sale, and we handle all payment processing, customer service, and platform maintenance."
    },
    {
      question: "Do I need to be a tour guide or travel expert?",
      answer: "Not at all! You just need to know your city well and have passion for sharing great places. Many of our top sellers are locals who simply love their neighborhood and want to help visitors experience it authentically."
    },
    {
      question: "How long does it take to create a pack?",
      answer: "Most sellers spend 1-3 hours creating their first pack. Once you get the hang of it, new packs can be created in 30-60 minutes. The key is focusing on places you already know and love."
    },
    {
      question: "What if I don't get any sales?",
      answer: "We provide marketing support, SEO optimization, and promotional opportunities to help your packs get discovered. Plus, our community team offers personalized tips to improve your pack performance."
    }
  ]

  // Company stats - Impressive numbers to build trust
  const stats = {
    packsCreated: "25,000+",
    travelersHelped: "150,000+",
    citiesCovered: "500+", 
    totalEarnings: "$2.5M+",
    averageRating: "4.8"
  }

  // Intersection observer for stats animation - improved triggering
  const statsRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !shouldAnimateStats) {
          console.log('Stats section is visible, starting animation!')
          setShouldAnimateStats(true)
        }
      },
      {
        threshold: 0.1, // Trigger when only 10% of stats section is visible  
        rootMargin: '0px 0px -50px 0px' // Start animation earlier
      }
    )

    if (statsRef.current) {
      observer.observe(statsRef.current)
    }

    return () => observer.disconnect()
  }, [shouldAnimateStats])

  return (
    <div className="min-h-screen bg-gray-25 sell-page">
      {/* Hero Section - Immediate load, no animation needed */}
      <div className="bg-gradient-to-br from-coral-500 via-coral-400 to-orange-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Turn your local knowledge into income
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Share the places you love in {userLocation} and earn money helping travelers discover authentic experiences
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button className="bg-white text-coral-500 hover:bg-gray-50 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center transform hover:scale-105">
                <DollarSign className="h-5 w-5 mr-2" />
                Start Earning Today
              </button>
              <button className="bg-coral-600 hover:bg-coral-700 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center transform hover:scale-105">
                <Play className="h-5 w-5 mr-2" />
                Watch How It Works
              </button>
            </div>

            {/* Quick stats with counter animation */}
            <div 
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              <AnimatedStat 
                value={stats.packsCreated} 
                label="Packs Created" 
                shouldStart={shouldAnimateStats}
                delay={0}
              />
              <AnimatedStat 
                value={stats.travelersHelped} 
                label="Travelers Helped" 
                shouldStart={shouldAnimateStats}
                delay={200}
              />
              <AnimatedStat 
                value={stats.totalEarnings} 
                label="Paid to Locals" 
                shouldStart={shouldAnimateStats}
                delay={400}
              />
              <AnimatedStat 
                value={stats.averageRating} 
                label="Average Rating" 
                shouldStart={shouldAnimateStats}
                delay={600}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Potential Section - Show different earning tiers */}
      <AnimatedSection className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection delay={100}>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                How much could you earn in {userLocation}?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Your earning potential depends on your city's tourism, your pack quality, and how active you are
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Casual Seller Tier */}
            <AnimatedSection delay={200}>
              <div className="bg-gray-50 rounded-2xl p-8 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Coffee className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Casual Seller</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$200-$500</div>
                <div className="text-gray-600 mb-6">per month</div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 2-3 high-quality packs</li>
                  <li>• Focus on your neighborhood</li>
                  <li>• Update monthly</li>
                  <li>• Perfect for beginners</li>
                </ul>
              </div>
            </AnimatedSection>

            {/* Active Local Tier - Most Popular */}
            <AnimatedSection delay={300}>
              <div className="bg-coral-50 border-2 border-coral-200 rounded-2xl p-8 text-center relative transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-coral-500 text-white px-4 py-1 rounded-full text-sm font-bold">Most Popular</span>
                </div>
                <div className="w-16 h-16 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="h-8 w-8 text-coral-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Active Local</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$800-$2,000</div>
                <div className="text-gray-600 mb-6">per month</div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 6-10 themed packs</li>
                  <li>• Cover different areas</li>
                  <li>• Regular updates</li>
                  <li>• Engage with customers</li>
                </ul>
              </div>
            </AnimatedSection>

            {/* Super Host Tier */}
            <AnimatedSection delay={400}>
              <div className="bg-green-50 rounded-2xl p-8 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Super Host</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$2,500+</div>
                <div className="text-gray-600 mb-6">per month</div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 15+ premium packs</li>
                  <li>• City-wide coverage</li>
                  <li>• Weekly updates</li>
                  <li>• Customer relationships</li>
                </ul>
              </div>
            </AnimatedSection>
          </div>

          {/* Earnings Calculator CTA */}
          <AnimatedSection delay={500}>
            <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to find out your earning potential?</h3>
              <p className="text-gray-300 mb-6">Get a personalized estimate based on your location and interests</p>
              <button className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105">
                Calculate My Earnings
              </button>
            </div>
          </AnimatedSection>
        </div>
      </AnimatedSection>

      {/* Why Sell With Us Section - Key benefits */}
      <AnimatedSection className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection delay={100}>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Why choose our platform?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We've built the best platform for locals to monetize their knowledge and help travelers
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Revenue Share */}
            <AnimatedSection delay={200}>
              <div className="bg-white rounded-xl p-8 shadow-sm transform transition-all duration-300 hover:scale-105 hover:shadow-md">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">80% Revenue Share</h3>
                <p className="text-gray-600">Keep most of what you earn. We only take 20% to cover platform costs, payments, and support.</p>
              </div>
            </AnimatedSection>

            {/* Global Reach */}
            <AnimatedSection delay={300}>
              <div className="bg-white rounded-xl p-8 shadow-sm transform transition-all duration-300 hover:scale-105 hover:shadow-md">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Global Reach</h3>
                <p className="text-gray-600">Your packs are marketed to millions of travelers worldwide through our platform and partners.</p>
              </div>
            </AnimatedSection>

            {/* Full Support */}
            <AnimatedSection delay={400}>
              <div className="bg-white rounded-xl p-8 shadow-sm transform transition-all duration-300 hover:scale-105 hover:shadow-md">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Full Support</h3>
                <p className="text-gray-600">We handle payments, customer service, disputes, and provide marketing tools to help you succeed.</p>
              </div>
            </AnimatedSection>

            {/* Flexible Schedule */}
            <AnimatedSection delay={500}>
              <div className="bg-white rounded-xl p-8 shadow-sm transform transition-all duration-300 hover:scale-105 hover:shadow-md">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Flexible Schedule</h3>
                <p className="text-gray-600">Work on your own time. Create packs when convenient and update them as often as you like.</p>
              </div>
            </AnimatedSection>

            {/* Make Impact */}
            <AnimatedSection delay={600}>
              <div className="bg-white rounded-xl p-8 shadow-sm transform transition-all duration-300 hover:scale-105 hover:shadow-md">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Make Impact</h3>
                <p className="text-gray-600">Help travelers have authentic experiences while supporting your local community and businesses.</p>
              </div>
            </AnimatedSection>

            {/* Growing Market */}
            <AnimatedSection delay={700}>
              <div className="bg-white rounded-xl p-8 shadow-sm transform transition-all duration-300 hover:scale-105 hover:shadow-md">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                  <TrendingUp className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Growing Market</h3>
                <p className="text-gray-600">Travel is booming and demand for authentic local experiences is at an all-time high.</p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </AnimatedSection>

      {/* What Packs Are Welcome - Guide content types */}
      <AnimatedSection className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection delay={100}>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                What kind of packs do travelers love?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                The best packs focus on specific themes and include places with stories, context, and insider tips
              </p>
            </div>
          </AnimatedSection>

          {/* Pack Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <AnimatedSection delay={200}>
              <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-xl p-6 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Utensils className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-3">Food & Drink</h3>
                <p className="text-sm text-gray-600">Hidden restaurants, local bars, street food gems, coffee shops locals love</p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-6 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Camera className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-3">Photo Spots</h3>
                <p className="text-sm text-gray-600">Instagram-worthy views, sunset points, hidden murals, architecture gems</p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-6 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <MapPin className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-3">Neighborhoods</h3>
                <p className="text-sm text-gray-600">Local markets, community centers, parks where residents actually hang out</p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={500}>
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Star className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-3">Experiences</h3>
                <p className="text-sm text-gray-600">Cultural activities, workshops, events, seasonal celebrations</p>
              </div>
            </AnimatedSection>
          </div>

          {/* Pack Creation Tips */}
          <AnimatedSection delay={600}>
            <div className="mt-12 bg-gray-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Pack Creation Tips</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    What works well:
                  </h4>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Specific themes ("Best breakfast spots in SoHo")</li>
                    <li>• Personal stories and context for each place</li>
                    <li>• 5-15 carefully curated locations</li>
                    <li>• Insider tips (best time to visit, what to order)</li>
                    <li>• Places that reflect local culture</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="h-5 w-5 text-orange-500 mr-2" />
                    Areas to improve:
                  </h4>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Generic tourist attractions without context</li>
                    <li>• Too many locations (overwhelming)</li>
                    <li>• Vague descriptions without personality</li>
                    <li>• Outdated information or closed places</li>
                    <li>• Duplicate content from other sources</li>
                  </ul>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </AnimatedSection>

      {/* Seller Testimonials - Social proof */}
      <AnimatedSection className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection delay={100}>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                What our sellers say
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Join thousands of locals who are already earning money sharing their favorite places
              </p>
            </div>
          </AnimatedSection>

          {/* Testimonial Carousel */}
          <AnimatedSection delay={200}>
            <div className="bg-white rounded-2xl p-8 text-gray-900 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <button 
                  onClick={() => setCurrentTestimonial(currentTestimonial === 0 ? testimonials.length - 1 : currentTestimonial - 1)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 transform hover:scale-110"
                >
                  <ChevronDown className="h-6 w-6 rotate-90" />
                </button>
                
                <div className="text-center flex-1">
                  <div className="w-16 h-16 bg-coral-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 transform transition-all duration-300 hover:scale-110">
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <blockquote className="text-xl italic mb-6">
                    "{testimonials[currentTestimonial].text}"
                  </blockquote>
                  <div className="font-bold text-lg">{testimonials[currentTestimonial].name}</div>
                  <div className="text-gray-600 mb-2">{testimonials[currentTestimonial].location}</div>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {testimonials[currentTestimonial].earnings} {testimonials[currentTestimonial].period}
                    </span>
                    <span className="flex items-center">
                      <Package className="h-4 w-4 mr-1" />
                      {testimonials[currentTestimonial].packs} packs
                    </span>
                    <span className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-500" />
                      {testimonials[currentTestimonial].rating}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setCurrentTestimonial((currentTestimonial + 1) % testimonials.length)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 transform hover:scale-110"
                >
                  <ChevronDown className="h-6 w-6 -rotate-90" />
                </button>
              </div>

              {/* Testimonial Dots */}
              <div className="flex justify-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 transform hover:scale-125 ${
                      index === currentTestimonial ? 'bg-coral-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </AnimatedSection>

      {/* FAQ Section - Address common concerns */}
      <AnimatedSection className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection delay={100}>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to know about becoming a seller
              </p>
            </div>
          </AnimatedSection>

          {/* FAQ Accordion */}
          <AnimatedSection delay={200}>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-xl shadow-sm border border-gray-200 transform transition-all duration-300 hover:shadow-md animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-all duration-200 rounded-xl"
                  >
                    <span className="font-semibold text-gray-900">{faq.question}</span>
                    <div className="transform transition-transform duration-200">
                      {openFAQ === index ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </button>
                  {openFAQ === index && (
                    <div className="px-6 pb-4 animate-fade-in">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </AnimatedSection>

      {/* Final Call to Action - Get started */}
      <AnimatedSection className="py-20 bg-gradient-to-r from-coral-500 to-orange-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <AnimatedSection delay={100}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to start earning?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join {stats.packsCreated.replace('+', '')} other locals who are already making money sharing their favorite places
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={200}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button className="bg-white text-coral-500 hover:bg-gray-50 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center transform hover:scale-105">
                <ArrowRight className="h-5 w-5 mr-2" />
                Get Started Now
              </button>
              <button className="bg-coral-600 hover:bg-coral-700 border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center transform hover:scale-105">
                <Users className="h-5 w-5 mr-2" />
                Join Community
              </button>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={300}>
            <p className="text-sm opacity-75">
              No upfront costs • Start earning in 24 hours • Full support included
            </p>
          </AnimatedSection>
        </div>
      </AnimatedSection>
    </div>
  )
} 
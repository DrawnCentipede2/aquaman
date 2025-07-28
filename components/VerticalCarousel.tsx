'use client'

import { useState, useEffect } from 'react'
import { MapPin, Heart, Mountain, Building, Utensils, Camera, Music, ArrowDown, ArrowUp } from 'lucide-react'
import { STANDARD_CATEGORIES, CATEGORY_DESCRIPTIONS, CATEGORY_COLORS, CATEGORY_BG_COLORS } from '@/lib/categories'

// Category data with poetic descriptions - now using standardized categories
const categories = [
  {
    id: 'romantic',
    name: 'Romantic',
    icon: Heart,
    description: CATEGORY_DESCRIPTIONS['Romantic'],
    color: CATEGORY_COLORS['Romantic'],
    bgColor: CATEGORY_BG_COLORS['Romantic']
  },
  {
    id: 'adventure',
    name: 'Adventure',
    icon: Mountain,
    description: CATEGORY_DESCRIPTIONS['Adventure'],
    color: CATEGORY_COLORS['Adventure'],
    bgColor: CATEGORY_BG_COLORS['Adventure']
  },
  {
    id: 'cultural',
    name: 'Cultural',
    icon: Building,
    description: CATEGORY_DESCRIPTIONS['Cultural'],
    color: CATEGORY_COLORS['Cultural'],
    bgColor: CATEGORY_BG_COLORS['Cultural']
  },
  {
    id: 'food-drink',
    name: 'Food & Drink',
    icon: Utensils,
    description: CATEGORY_DESCRIPTIONS['Food & Drink'],
    color: CATEGORY_COLORS['Food & Drink'],
    bgColor: CATEGORY_BG_COLORS['Food & Drink']
  },
  {
    id: 'nightlife',
    name: 'Nightlife',
    icon: Music,
    description: CATEGORY_DESCRIPTIONS['Nightlife'],
    color: CATEGORY_COLORS['Nightlife'],
    bgColor: CATEGORY_BG_COLORS['Nightlife']
  },
  {
    id: 'family',
    name: 'Family',
    icon: MapPin,
    description: CATEGORY_DESCRIPTIONS['Family'],
    color: CATEGORY_COLORS['Family'],
    bgColor: CATEGORY_BG_COLORS['Family']
  }
]

export default function VerticalCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)

  // Auto-scroll effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isScrolling) {
        setCurrentIndex((prev) => (prev + 1) % categories.length)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isScrolling])

  // Manual scroll handlers
  const scrollToNext = () => {
    setIsScrolling(true)
    setCurrentIndex((prev) => (prev + 1) % categories.length)
    setTimeout(() => setIsScrolling(false), 1000)
  }

  const scrollToPrev = () => {
    setIsScrolling(true)
    setCurrentIndex((prev) => (prev - 1 + categories.length) % categories.length)
    setTimeout(() => setIsScrolling(false), 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background gradient that shifts with scroll */}
      <div className="absolute inset-0 transition-all duration-1000 ease-out">
        <div className={`absolute inset-0 ${categories[currentIndex].bgColor} opacity-30`}></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/70 mb-4">
                <MapPin className="h-12 w-12 text-sky-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                PinCloud
              </h1>
            </div>
            
            {/* Tagline */}
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Drift through selected experiences and discover the world through local eyes
            </p>

            {/* Scroll indicator */}
            <div className="mt-8 animate-bounce">
              <ArrowDown className="h-6 w-6 text-sky-600 mx-auto" />
            </div>
          </div>
        </section>

        {/* Vertical Carousel */}
        <section className="flex-1 relative px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-6xl mx-auto h-full">
            
            {/* Carousel Container */}
            <div className="relative h-full flex items-center">
              
              {/* Current Category Display */}
              <div className="w-full">
                {categories.map((category, index) => {
                  const Icon = category.icon
                  const isActive = index === currentIndex
                  
                  return (
                    <div
                      key={category.id}
                      className={`
                        absolute inset-0 flex items-center justify-center
                        transition-all duration-1000 ease-out
                        ${isActive 
                          ? 'opacity-100 transform translate-y-0' 
                          : 'opacity-0 transform translate-y-20'
                        }
                      `}
                    >
                      <div className="text-center max-w-4xl mx-auto">
                        
                        {/* Floating Icon */}
                        <div className="relative mb-8">
                          <div className={`
                            w-32 h-32 bg-gradient-to-r ${category.color} 
                            rounded-full flex items-center justify-center mx-auto
                            shadow-2xl animate-float
                            transition-all duration-1000
                            ${isActive ? 'scale-100' : 'scale-75'}
                          `}>
                            <Icon className="h-16 w-16 text-white" />
                          </div>
                          
                          {/* Floating pin effect */}
                          <div className="absolute -top-4 -right-4">
                            <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-white/60 flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-sky-600" />
                            </div>
                          </div>
                        </div>

                        {/* Category Title */}
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 transition-all duration-1000">
                          {category.name}
                        </h2>

                        {/* Poetic Description */}
                        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8 transition-all duration-1000">
                          {category.description}
                        </p>

                        {/* Action Button */}
                        <button className={`
                          bg-gradient-to-r ${category.color} text-white 
                          font-semibold px-8 py-4 rounded-2xl 
                          shadow-xl hover:shadow-2xl
                          transition-all duration-300 
                          transform hover:scale-105 active:scale-95
                          flex items-center space-x-3 mx-auto
                        `}>
                          <span>View Maps</span>
                          <ArrowUp className="h-5 w-5 rotate-45" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Navigation Controls */}
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2 space-y-4">
                <button
                  onClick={scrollToPrev}
                  className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-white/60 flex items-center justify-center hover:bg-white transition-all duration-200"
                >
                  <ArrowUp className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={scrollToNext}
                  className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-white/60 flex items-center justify-center hover:bg-white transition-all duration-200"
                >
                  <ArrowDown className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Progress Indicators */}
              <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
                <div className="flex flex-col space-y-2">
                  {categories.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsScrolling(true)
                        setCurrentIndex(index)
                        setTimeout(() => setIsScrolling(false), 1000)
                      }}
                      className={`
                        w-3 h-3 rounded-full transition-all duration-300
                        ${index === currentIndex 
                          ? 'bg-sky-600 scale-125' 
                          : 'bg-gray-300 hover:bg-gray-400'
                        }
                      `}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Category Preview Strip */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-4">
                {categories.map((category, index) => {
                  const Icon = category.icon
                  const isActive = index === currentIndex
                  
                  return (
                    <div
                      key={category.id}
                      className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center
                        transition-all duration-500 cursor-pointer
                        ${isActive 
                          ? 'bg-white/90 shadow-xl scale-110' 
                          : 'bg-white/60 hover:bg-white/80'
                        }
                      `}
                      onClick={() => {
                        setIsScrolling(true)
                        setCurrentIndex(index)
                        setTimeout(() => setIsScrolling(false), 1000)
                      }}
                    >
                      <Icon className={`h-6 w-6 ${isActive ? 'text-sky-600' : 'text-gray-500'}`} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-20 bg-white/90 backdrop-blur-sm border-t border-white/60 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-gray-600 text-sm">
              © 2024 PinCloud. Explore the world, one pin at a time.
            </div>
            <div className="flex space-x-6">
              <button className="text-sky-600 hover:text-sky-700 font-medium transition-colors">
                Browse All Maps
              </button>
              <button className="text-sky-600 hover:text-sky-700 font-medium transition-colors">
                Create Your Map
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
} 
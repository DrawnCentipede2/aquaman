'use client'

import { useState } from 'react'
import { Coffee, Heart, Mountain, Camera, Music, Utensils, Building, MapPin, Star } from 'lucide-react'

// Category data with descriptions
const categories = [
  { 
    id: 'hidden-cafes', 
    name: 'Hidden Cafés', 
    icon: Coffee, 
    description: 'Cozy spots off the beaten path',
    color: 'bg-amber-50 border-amber-200 text-amber-700'
  },
  { 
    id: 'romantic-spots', 
    name: 'Romantic Spots', 
    icon: Heart, 
    description: 'Perfect for intimate moments',
    color: 'bg-rose-50 border-rose-200 text-rose-700'
  },
  { 
    id: 'adventure-trails', 
    name: 'Adventure Trails', 
    icon: Mountain, 
    description: 'Thrilling outdoor experiences',
    color: 'bg-orange-50 border-orange-200 text-orange-700'
  },
  { 
    id: 'photo-ops', 
    name: 'Photo Ops', 
    icon: Camera, 
    description: 'Picture-perfect locations',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-700'
  },
  { 
    id: 'live-music', 
    name: 'Live Music', 
    icon: Music, 
    description: 'Vibrant music scenes',
    color: 'bg-purple-50 border-purple-200 text-purple-700'
  },
  { 
    id: 'local-eats', 
    name: 'Local Eats', 
    icon: Utensils, 
    description: 'Authentic culinary experiences',
    color: 'bg-green-50 border-green-200 text-green-700'
  },
  { 
    id: 'cultural-sites', 
    name: 'Cultural Sites', 
    icon: Building, 
    description: 'Arts, history & local life',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
  },
  { 
    id: 'secret-spots', 
    name: 'Secret Spots', 
    icon: MapPin, 
    description: 'Local secrets revealed',
    color: 'bg-slate-50 border-slate-200 text-slate-700'
  }
]

export default function MinimalistGrid() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-white">
      <div className="relative min-h-screen flex flex-col">
        
        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-sky-50 rounded-2xl border border-sky-200 mb-6">
                <MapPin className="h-10 w-10 text-sky-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                PinCloud
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Discover curated collections of amazing places, organized by experience
              </p>
            </div>
          </div>
        </section>

        {/* Category Grid */}
        <section className="flex-1 px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-6xl mx-auto">
            
            {/* Grid Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Choose Your Experience
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Each category contains carefully curated maps from locals who know their cities best
              </p>
            </div>

            {/* Category Grid - 4x2 layout */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {categories.map((category, index) => {
                const Icon = category.icon
                const isHovered = hoveredCategory === category.id

                return (
                  <div
                    key={category.id}
                    className={`
                      group cursor-pointer
                      animate-fade-in-up
                    `}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onMouseEnter={() => setHoveredCategory(category.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    {/* Category Card */}
                    <div className={`
                      relative h-48 rounded-2xl border-2 
                      transition-all duration-500 ease-out
                      ${category.color}
                      ${isHovered 
                        ? 'shadow-2xl scale-105 -translate-y-2 border-opacity-100' 
                        : 'shadow-lg hover:shadow-xl border-opacity-60'
                      }
                    `}>
                      
                      {/* Card Content */}
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                        
                        {/* Icon */}
                        <div className={`
                          w-16 h-16 rounded-2xl flex items-center justify-center mb-4
                          transition-all duration-500
                          ${isHovered ? 'scale-110' : 'scale-100'}
                        `}>
                          <Icon className="h-8 w-8" />
                        </div>
                        
                        {/* Category Name */}
                        <h3 className="text-lg font-semibold mb-2 transition-all duration-300">
                          {category.name}
                        </h3>
                        
                        {/* Description - fades in on hover */}
                        <div className={`
                          transition-all duration-500 ease-out
                          ${isHovered 
                            ? 'opacity-100 transform translate-y-0' 
                            : 'opacity-0 transform translate-y-2'
                          }
                        `}>
                          <p className="text-sm leading-relaxed">
                            {category.description}
                          </p>
                        </div>
                      </div>

                      {/* Subtle glow effect */}
                      <div className={`
                        absolute inset-0 rounded-2xl 
                        transition-opacity duration-500
                        ${isHovered ? 'opacity-20' : 'opacity-0'}
                        bg-gradient-to-br from-white/50 to-transparent
                      `}></div>

                      {/* Hover indicator */}
                      {isHovered && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                          <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16">
              <div className="inline-flex items-center space-x-4">
                <button className="
                  bg-sky-600 hover:bg-sky-700 text-white 
                  font-semibold px-8 py-3 rounded-xl 
                  transition-all duration-200 
                  shadow-lg hover:shadow-xl 
                  transform hover:scale-105 active:scale-95
                ">
                  Browse All Categories
                </button>
                <button className="
                  bg-white hover:bg-gray-50 text-sky-600 
                  font-semibold px-8 py-3 rounded-xl 
                  border-2 border-sky-600
                  transition-all duration-200 
                  shadow-lg hover:shadow-xl 
                  transform hover:scale-105 active:scale-95
                ">
                  Create Your Map
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Brand */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <MapPin className="h-6 w-6 text-sky-600" />
                  <span className="text-xl font-bold text-gray-900">PinCloud</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Discover amazing places through curated collections from locals who know their cities best.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
                <div className="space-y-2 text-sm">
                  <a href="#" className="block text-gray-600 hover:text-sky-600 transition-colors">Browse Maps</a>
                  <a href="#" className="block text-gray-600 hover:text-sky-600 transition-colors">Create Map</a>
                  <a href="#" className="block text-gray-600 hover:text-sky-600 transition-colors">About Us</a>
                </div>
              </div>

              {/* Stats */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Community</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span>10,000+ curated maps</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-sky-600" />
                    <span>500+ cities worldwide</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  )
} 
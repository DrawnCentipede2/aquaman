'use client'

import { useState, useEffect } from 'react'
import { MapPin, Heart, Coffee, Mountain, Camera, Music, Utensils, Building } from 'lucide-react'

// Category data with icons and descriptions
const categories = [
  { id: 'adventure', name: 'Adventure', icon: Mountain, description: 'Thrilling outdoor experiences', color: 'from-orange-400 to-red-500' },
  { id: 'chill', name: 'Chill', icon: Coffee, description: 'Relaxing spots to unwind', color: 'from-blue-400 to-indigo-500' },
  { id: 'romance', name: 'Romance', icon: Heart, description: 'Perfect for couples', color: 'from-pink-400 to-rose-500' },
  { id: 'culture', name: 'Culture', icon: Building, description: 'Arts, history & local life', color: 'from-purple-400 to-violet-500' },
  { id: 'food', name: 'Food & Drink', icon: Utensils, description: 'Culinary adventures', color: 'from-green-400 to-emerald-500' },
  { id: 'photography', name: 'Photography', icon: Camera, description: 'Picture-perfect locations', color: 'from-cyan-400 to-teal-500' },
  { id: 'music', name: 'Music & Arts', icon: Music, description: 'Creative vibes & venues', color: 'from-yellow-400 to-amber-500' },
  { id: 'hidden', name: 'Hidden Gems', icon: MapPin, description: 'Local secrets revealed', color: 'from-slate-400 to-gray-500' }
]

export default function FloatingCloudPins() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Parallax effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-100 to-indigo-50 relative overflow-hidden">
      {/* Background cloud wisps */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-32 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-48 h-24 bg-white/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-20 w-56 h-28 bg-white/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-20 right-10 w-40 h-20 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '6s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="text-center space-y-8 max-w-5xl mx-auto">
            {/* PinCloud Logo */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-28 h-28 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/70 mb-6">
                <MapPin className="h-12 w-12 text-sky-600" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
                PinCloud
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Pluck the perfect pin from the clouds and discover amazing places curated by locals
              </p>
            </div>
          </div>
        </section>

        {/* Floating Cloud Pins Area */}
        <section className="relative flex-1 px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-7xl mx-auto relative h-full">
            
            {/* Category Clouds */}
            <div className="absolute inset-0">
              {categories.map((category, index) => {
                const Icon = category.icon
                const isHovered = hoveredCategory === category.id
                const isSelected = selectedCategory === category.id

                // Calculate position with parallax effect
                const basePosition = {
                  top: `${20 + (index * 8)}%`,
                  left: `${10 + (index * 10)}%`
                }

                const parallaxOffset = {
                  x: mousePosition.x * (index * 0.1),
                  y: mousePosition.y * (index * 0.1)
                }

                return (
                  <div
                    key={category.id}
                    className="absolute transition-all duration-700 ease-out cursor-pointer group"
                    style={{
                      top: basePosition.top,
                      left: basePosition.left,
                      transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`
                    }}
                    onMouseEnter={() => setHoveredCategory(category.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {/* Cloud Pin */}
                    <div className={`
                      relative
                      ${isHovered ? 'scale-125 -translate-y-3' : 'scale-100'}
                      ${isSelected ? 'scale-150 -translate-y-6' : ''}
                      transition-all duration-500 ease-out
                    `}>
                      
                      {/* Cloud shape with gradient */}
                      <div className={`
                        bg-white/80 backdrop-blur-md 
                        border-2 border-white/60 
                        rounded-[80px] px-8 py-6 
                        shadow-2xl hover:shadow-3xl
                        transition-all duration-500
                        min-w-[160px] text-center
                        group-hover:bg-white/95
                      `}>
                        
                        {/* Cloud texture - multiple overlapping circles */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-0 left-0 w-12 h-12 bg-white/60 rounded-full"></div>
                          <div className="absolute top-0 right-0 w-10 h-10 bg-white/60 rounded-full"></div>
                          <div className="absolute bottom-0 left-1/4 w-16 h-16 bg-white/60 rounded-full"></div>
                          <div className="absolute top-1/3 right-1/3 w-8 h-8 bg-white/60 rounded-full"></div>
                          <div className="absolute bottom-1/4 left-1/2 w-6 h-6 bg-white/60 rounded-full"></div>
                        </div>
                        
                        {/* Category content */}
                        <div className="relative z-10 space-y-3">
                          {/* Icon with gradient background */}
                          <div className={`
                            w-12 h-12 bg-gradient-to-r ${category.color} 
                            rounded-2xl flex items-center justify-center mx-auto 
                            shadow-lg group-hover:shadow-xl 
                            transition-all duration-300
                          `}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          
                          {/* Category name */}
                          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                            {category.name}
                          </h3>
                          
                          {/* Description - appears on hover */}
                          {isHovered && (
                            <p className="text-sm text-gray-600 mt-2 animate-fade-in">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Glow effect */}
                      <div className={`
                        absolute inset-0 bg-gradient-to-r ${category.color} 
                        rounded-[80px] opacity-0 group-hover:opacity-30 
                        blur-2xl transition-opacity duration-500 -z-10
                      `}></div>

                      {/* Drifting animation */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="w-full h-full animate-float" style={{ animationDelay: `${index * 0.5}s` }}>
                          <svg className="w-full h-full" viewBox="0 0 200 200">
                            <path
                              d="M20,100 Q50,80 80,100 T140,100"
                              stroke="rgba(59, 130, 246, 0.3)"
                              strokeWidth="2"
                              strokeDasharray="8,8"
                              fill="none"
                              className="animate-pulse"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-white/60">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            {category.name} Collections
                          </h4>
                          <p className="text-gray-600 text-sm mb-3">
                            {category.description}
                          </p>
                          <button className="bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-sky-600 hover:to-blue-700 transition-all duration-200">
                            Explore Maps
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-20 bg-white/90 backdrop-blur-sm border-t border-white/60 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-gray-600 text-sm">
              © 2024 PinCloud. Discover the world through local eyes.
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
          50% { transform: translateY(-10px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
} 
'use client'

import { useState } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

// Category data for the floating clouds
const categories = [
  { id: 'couples', name: 'Couples', position: 'top-left' },
  { id: 'family', name: 'Family', position: 'top-right' },
  { id: 'adventure', name: 'Adventure', position: 'left' },
  { id: 'culture', name: 'Culture', position: 'right' },
  { id: 'food', name: 'Food & Drink', position: 'bottom-left' },
  { id: 'relaxation', name: 'Relaxation', position: 'bottom-right' }
]

export default function CategorySelectorWireframe() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-white relative overflow-hidden">
      {/* Grid alignment guides - visible only in development */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Vertical grid lines */}
        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-gray-200/30"></div>
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200/30"></div>
        <div className="absolute left-3/4 top-0 bottom-0 w-px bg-gray-200/30"></div>
        
        {/* Horizontal grid lines */}
        <div className="absolute top-1/3 left-0 right-0 h-px bg-gray-200/30"></div>
        <div className="absolute top-2/3 left-0 right-0 h-px bg-gray-200/30"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* PinCloud Logo Placeholder */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60 mb-4">
                <span className="text-2xl font-bold text-sky-600">PC</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                PinCloud
              </h1>
            </div>
            
            {/* Tagline Placeholder */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Discover amazing places through selected collections from locals who know their cities best
            </p>
          </div>
        </section>

        {/* Floating Category Elements Area */}
        <section className="relative flex-1 px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto relative h-full">
            
            {/* Category Clouds */}
            <div className="absolute inset-0">
              {categories.map((category) => {
                const getPosition = () => {
                  switch(category.position) {
                    case 'top-left': return 'top-10 left-10'
                    case 'top-right': return 'top-10 right-10'
                    case 'left': return 'top-1/2 left-5 -translate-y-1/2'
                    case 'right': return 'top-1/2 right-5 -translate-y-1/2'
                    case 'bottom-left': return 'bottom-10 left-10'
                    case 'bottom-right': return 'bottom-10 right-10'
                    default: return 'top-10 left-10'
                  }
                }

                const isHovered = hoveredCategory === category.id
                const isSelected = selectedCategory === category.id

                return (
                  <div
                    key={category.id}
                    className={`absolute ${getPosition()} transition-all duration-500 ease-out`}
                    onMouseEnter={() => setHoveredCategory(category.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {/* Cloud Shape */}
                    <div className={`
                      relative cursor-pointer group
                      ${isHovered ? 'scale-110 -translate-y-2' : 'scale-100'}
                      ${isSelected ? 'scale-125 -translate-y-4' : ''}
                      transition-all duration-300 ease-out
                    `}>
                      
                      {/* Semi-transparent outlined cloud shape */}
                      <div className="
                        bg-white/60 backdrop-blur-sm 
                        border-2 border-sky-300/50 
                        rounded-[60px] px-6 py-4 
                        shadow-lg hover:shadow-xl
                        transition-all duration-300
                        min-w-[120px] text-center
                      ">
                        {/* Cloud texture - overlapping circles for realistic shape */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-0 left-0 w-8 h-8 bg-white/40 rounded-full"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 bg-white/40 rounded-full"></div>
                          <div className="absolute bottom-0 left-1/3 w-10 h-10 bg-white/40 rounded-full"></div>
                          <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-white/40 rounded-full"></div>
                        </div>
                        
                        {/* Category Label */}
                        <div className="relative z-10">
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                            {category.name}
                          </span>
                        </div>
                      </div>

                      {/* Hover Expansion Arrow */}
                      {isHovered && !isSelected && (
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 animate-pulse">
                          <div className="flex items-center space-x-1 text-sky-600">
                            <span className="text-xs font-medium">Expand</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </div>
                        </div>
                      )}

                      {/* Click Transition Arrow */}
                      {isSelected && (
                        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                          <div className="flex items-center space-x-2 text-sky-600 animate-bounce">
                            <span className="text-xs font-medium">View Maps</span>
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Drifting Motion Lines */}
                    <div className="absolute inset-0 pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 200 200">
                        <path
                          d="M20,100 Q50,80 80,100 T140,100"
                          stroke="rgba(59, 130, 246, 0.2)"
                          strokeWidth="1"
                          strokeDasharray="5,5"
                          fill="none"
                          className="animate-pulse"
                        />
                      </svg>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Map Collection Area Placeholder */}
            {selectedCategory && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 transition-all duration-500 ease-out">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/60 max-w-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {categories.find(c => c.id === selectedCategory)?.name} Collections
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Discover selected maps and recommendations for {categories.find(c => c.id === selectedCategory)?.name.toLowerCase()} experiences
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-20 bg-white/80 backdrop-blur-sm border-t border-white/60 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            
            {/* Browse Maps Button */}
            <button className="
              bg-sky-600 hover:bg-sky-700 text-white 
              font-semibold px-8 py-3 rounded-lg 
              transition-all duration-200 
              shadow-md hover:shadow-lg 
              transform hover:scale-105 active:scale-95
              flex items-center space-x-2
            ">
              <span>Browse Maps</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Sell Your Map Button */}
            <button className="
              bg-white hover:bg-gray-50 text-sky-600 
              font-semibold px-8 py-3 rounded-lg 
              border-2 border-sky-600
              transition-all duration-200 
              shadow-md hover:shadow-lg 
              transform hover:scale-105 active:scale-95
              flex items-center space-x-2
            ">
              <span>Sell Your Map</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </div>

      {/* Spacing Annotations - visible only in development */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Hero spacing */}
        <div className="absolute top-1/4 left-4 text-xs text-gray-400">
          Hero spacing: 20vh
        </div>
        
        {/* Category area spacing */}
        <div className="absolute top-1/2 left-4 text-xs text-gray-400">
          Category area: 40vh
        </div>
        
        {/* Footer spacing */}
        <div className="absolute bottom-4 left-4 text-xs text-gray-400">
          Footer spacing: 8vh
        </div>
      </div>
    </div>
  )
} 
'use client'

import { MapPin, Users, Shield, Globe, Heart, Search, Star } from 'lucide-react'

export default function LandingPage() {
  // Mock testimonials data for the landing page
  const testimonials = [
    {
      name: "Alex Rodriguez",
      location: "Traveled to Barcelona",
      text: "Found the most authentic tapas places through local recommendations. My best trip ever!",
      rating: 5,
      avatar: "AR"
    },
    {
      name: "Sarah Kim",
      location: "Explored Tokyo",
      text: "The local recommendations helped me discover hidden neighborhoods I never would have found.",
      rating: 5,
      avatar: "SK"
    },
    {
      name: "Emma Thompson",
      location: "Traveled to Tokyo",
      text: "Authentic recommendations from real locals made my trip unforgettable. No more tourist traps - just real experiences.",
      rating: 5,
      avatar: "ET"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Airbnb-inspired Hero Section */}
      <div className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-br from-coral-50 via-white to-gray-50 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-coral-200 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-primary-200 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Hero content */}
          <div className="space-y-8 animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
              Find amazing places
              <br />
              <span className="text-primary-500">created by locals</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover authentic travel experiences through curated pin collections from people who know their cities best.
            </p>

            {/* Enhanced Airbnb-style search bar with subtle highlighting */}
            <div className="mt-12 max-w-2xl mx-auto">
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  const searchInput = e.currentTarget.querySelector('input') as HTMLInputElement
                  const searchQuery = searchInput.value.trim()
                  // Redirect to browse page with search query
                  window.location.href = searchQuery 
                    ? `/browse?search=${encodeURIComponent(searchQuery)}`
                    : '/browse'
                }}
                className="bg-white/95 backdrop-blur-sm rounded-full shadow-airbnb hover:shadow-airbnb-hover border border-gray-300/80 hover:border-coral-300/60 p-2 flex items-center w-full transition-all duration-300 ring-2 ring-coral-100/50 hover:ring-coral-200/60"
                style={{ 
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 90, 95, 0.08), 0 0 20px rgba(255, 90, 95, 0.05)'
                }}
              >
                {/* Search input section */}
                <div className="flex-1 flex items-center pl-4 pr-2">
                  <Search className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Where do you want to explore?"
                    className="flex-1 border-none outline-none text-gray-700 text-lg placeholder-gray-400 bg-transparent w-full py-2"
                  />
                </div>
                
                {/* Circular search button - text only */}
                <button 
                  type="submit"
                  className="bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-full transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95 flex items-center justify-center h-12 px-6 ml-2"
                  style={{ minWidth: '100px' }}
                >
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden">Go</span>
                </button>
              </form>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-500 mb-1">50+</div>
                <div className="text-gray-600 font-medium">Pin Packs</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-500 mb-1">100%</div>
                <div className="text-gray-600 font-medium">Made by locals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-500 mb-1">Free</div>
                <div className="text-gray-600 font-medium">During Beta</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How PinCloud works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, authentic, and created by the people who know best.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mb-6 group-hover:bg-primary-200 transition-colors">
                <Users className="h-10 w-10 text-primary-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Locals create</h3>
              <p className="text-gray-600 leading-relaxed">
                Real people who live in these places share their favorite hidden gems and authentic experiences.
              </p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mb-6 group-hover:bg-primary-200 transition-colors">
                <Shield className="h-10 w-10 text-primary-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">We verify</h3>
              <p className="text-gray-600 leading-relaxed">
                We ensure all recommendations come from verified locals to guarantee authentic experiences.
              </p>
            </div>

            <div className="text-center group">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mb-6 group-hover:bg-primary-200 transition-colors">
                <Globe className="h-10 w-10 text-primary-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">You explore</h3>
              <p className="text-gray-600 leading-relaxed">
                Download collections directly to your phone and explore cities like a local with one-click Google Maps.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-gray-25">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Loved by travelers worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what people are saying about their local discovery experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 group hover:shadow-md transition-all duration-200">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-coral-500 text-white rounded-full flex items-center justify-center text-lg font-semibold mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center mb-4">
                  {Array.from({ length: testimonial.rating }, (_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  ))}
                </div>
                
                <p className="text-gray-700 leading-relaxed">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 gradient-coral">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 text-shadow">
            Ready to explore like a local?
          </h2>
          <p className="text-xl text-white/90 mb-12 text-shadow">
            Join thousands discovering authentic places through local recommendations.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
                            <a href="/browse" className="btn-secondary bg-white text-primary-500 hover:bg-gray-50 inline-flex items-center text-lg px-8 py-4">
              <Globe className="h-5 w-5 mr-2" />
              Browse destinations
            </a>
            <a 
              href="/create" 
              onClick={(e) => {
                const userProfile = localStorage.getItem('PinCloud_user_profile')
                if (!userProfile) {
                  e.preventDefault()
                  window.location.href = '/signup'
                }
              }}
                              className="btn-outline border-white text-white hover:bg-white hover:text-primary-500 inline-flex items-center text-lg px-8 py-4"
            >
              <Heart className="h-5 w-5 mr-2" />
              Create Pack
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 
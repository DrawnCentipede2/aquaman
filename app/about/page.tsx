'use client'

import { MapPin, Users, Globe, Heart, Target, Lightbulb, Star, CheckCircle } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
              <Heart className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-6">
            About Google Pins
          </h1>
          <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Connecting travelers with authentic local experiences, one pin at a time.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-lg mr-4">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              We believe travel should be about <strong>authentic experiences</strong>, not tourist traps. 
              Our mission is to connect curious travelers with knowledgeable locals who can share 
              the hidden gems that make their cities special.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Every pin pack is created by someone who actually lives in that city, ensuring you get 
              genuine recommendations that only locals would know about.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20">
            <div className="space-y-6">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Authentic Local Knowledge</h3>
                  <p className="text-gray-600">Every recommendation comes from real locals who know their cities inside out.</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Curated Collections</h3>
                  <p className="text-gray-600">Thoughtfully organized pin packs for specific experiences, not random lists.</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Easy Integration</h3>
                  <p className="text-gray-600">Seamlessly works with Google Maps - no new apps to learn or download.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Problem We're Solving */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-red-500 to-orange-600 p-3 rounded-lg">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">The Problem We're Solving</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Travel planning shouldn't be overwhelming, and tourism shouldn't be generic.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Problems */}
            <div className="bg-red-50/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-red-200">
              <h3 className="text-2xl font-bold text-red-800 mb-6">❌ Current Problems</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-red-700">Generic travel guides with the same recommendations for everyone</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-red-700">Tourist traps that locals would never visit</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-red-700">Hours spent researching and planning without local context</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-red-700">No way for locals to monetize their knowledge</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-red-700">Missing out on hidden gems only locals know about</p>
                </div>
              </div>
            </div>

            {/* Solutions */}
            <div className="bg-green-50/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-green-200">
              <h3 className="text-2xl font-bold text-green-800 mb-6">✅ Our Solution</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-green-700">Curated pin collections from verified locals</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-green-700">Authentic experiences that locals actually recommend</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-green-700">Instant access to organized, themed recommendations</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-green-700">Opportunity for locals to earn from their expertise</p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-green-700">Direct integration with Google Maps for easy navigation</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-lg">
                <Globe className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple for travelers, rewarding for locals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* For Travelers */}
            <div className="bg-blue-50/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-blue-200 text-center">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-full w-fit mx-auto mb-6">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-blue-800 mb-4">For Travelers</h3>
              <div className="space-y-3 text-blue-700">
                <p>🔍 Browse pin packs by city or theme</p>
                <p>💰 Purchase curated collections (many are free!)</p>
                <p>📍 Instantly open in Google Maps</p>
                <p>🗺️ Navigate to authentic local spots</p>
              </div>
            </div>

            {/* For Locals */}
            <div className="bg-green-50/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-green-200 text-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 rounded-full w-fit mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-green-800 mb-4">For Locals</h3>
              <div className="space-y-3 text-green-700">
                <p>📝 Create pin packs of your favorite spots</p>
                <p>💡 Share your local knowledge and insights</p>
                <p>💵 Earn money from your recommendations</p>
                <p>🌟 Help travelers have authentic experiences</p>
              </div>
            </div>

            {/* Technology */}
            <div className="bg-purple-50/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-purple-200 text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-full w-fit mx-auto mb-6">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-purple-800 mb-4">The Tech</h3>
              <div className="space-y-3 text-purple-700">
                <p>🗺️ Built on Google Maps for reliability</p>
                <p>📱 Works on all devices seamlessly</p>
                <p>⚡ Instant access - no app downloads</p>
                <p>🔄 Easy sharing and collaboration</p>
              </div>
            </div>
          </div>
        </div>

        {/* Our Vision */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-12 rounded-3xl shadow-xl border border-indigo-200">
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-full">
                <Globe className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Vision</h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed mb-8">
              We envision a world where every traveler can experience destinations like a local, 
              and every local can share their passion for their city while earning from their expertise. 
              No more generic tourism - just authentic, meaningful connections between people and places.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <a 
                href="/browse" 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg px-8 py-4 rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 inline-flex items-center justify-center"
              >
                <MapPin className="h-5 w-5 mr-2" />
                Start Exploring
              </a>
              <a 
                href="/create" 
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg px-8 py-4 rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 inline-flex items-center justify-center"
              >
                <Users className="h-5 w-5 mr-2" />
                Share Your City
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
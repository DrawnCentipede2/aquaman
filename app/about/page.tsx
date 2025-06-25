'use client'

import { MapPin, Users, Globe, Heart, Target, Lightbulb, Star, CheckCircle, ArrowRight } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-25">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              About Google Pins
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Connecting travelers with authentic local experiences through curated pin collections that showcase the hidden gems only locals know about.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-gray-25 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center mb-6">
                <div className="bg-coral-500 p-3 rounded-2xl mr-4">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-gray-900">Our Mission</h2>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                We believe travel should be about authentic experiences, not tourist traps. 
                Our mission is to connect curious travelers with knowledgeable locals who can share 
                the hidden gems that make their cities special.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Every pin pack is created by someone who actually lives in that city, ensuring you get 
                genuine recommendations that only locals would know about.
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="bg-coral-100 p-2 rounded-xl mr-4 mt-1">
                    <CheckCircle className="h-6 w-6 text-coral-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">Authentic Local Knowledge</h3>
                    <p className="text-gray-600">Every recommendation comes from real locals who know their cities inside out.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-coral-100 p-2 rounded-xl mr-4 mt-1">
                    <CheckCircle className="h-6 w-6 text-coral-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">Curated Collections</h3>
                    <p className="text-gray-600">Thoughtfully organized pin packs for specific experiences, not random lists.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-coral-100 p-2 rounded-xl mr-4 mt-1">
                    <CheckCircle className="h-6 w-6 text-coral-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">Easy Integration</h3>
                    <p className="text-gray-600">Seamlessly works with Google Maps - no new apps to learn or download.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem We're Solving */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="bg-coral-500 p-4 rounded-2xl">
                <Lightbulb className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">The Problem We're Solving</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Travel planning shouldn't be overwhelming, and tourism shouldn't be generic.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Problems */}
            <div className="bg-red-50 p-10 rounded-3xl border border-red-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Current Problems</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-red-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                  <p className="text-gray-600 text-lg text-left">Generic travel guides with the same recommendations for everyone</p>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-red-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                  <p className="text-gray-600 text-lg text-left">Tourist traps that locals would never visit</p>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-red-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                  <p className="text-gray-600 text-lg text-left">Hours spent researching and planning without local context</p>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-red-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                  <p className="text-gray-600 text-lg text-left">No way for locals to monetize their knowledge</p>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-red-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                  <p className="text-gray-600 text-lg text-left">Missing out on hidden gems only locals know about</p>
                </div>
              </div>
            </div>

            {/* Solutions */}
            <div className="bg-green-50 p-10 rounded-3xl border border-green-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Our Solution</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-red-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                  <p className="text-gray-600 text-lg text-left">Curated pin collections from verified locals</p>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-red-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                  <p className="text-gray-600 text-lg text-left">Authentic experiences that locals actually recommend</p>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-red-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                  <p className="text-gray-600 text-lg text-left">Instant access to organized, themed recommendations</p>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-red-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                  <p className="text-gray-600 text-lg text-left">Opportunity for locals to earn from their expertise</p>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 bg-red-400 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                  <p className="text-gray-600 text-lg text-left">Direct integration with Google Maps for easy navigation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-25 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="bg-coral-500 p-4 rounded-2xl">
                <Globe className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple for travelers, rewarding for locals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* For Travelers */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="bg-coral-500 p-4 rounded-2xl w-fit mx-auto mb-6">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">For Travelers</h3>
              <div className="space-y-4 text-gray-600">
                <p className="text-lg">Browse pin packs by city or theme</p>
                <p className="text-lg">Purchase curated collections (many are free!)</p>
                <p className="text-lg">Instantly open in Google Maps</p>
                <p className="text-lg">Navigate to authentic local spots</p>
              </div>
            </div>

            {/* For Locals */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="bg-coral-500 p-4 rounded-2xl w-fit mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">For Locals</h3>
              <div className="space-y-4 text-gray-600">
                <p className="text-lg">Create pin packs of your favorite spots</p>
                <p className="text-lg">Share your local knowledge and insights</p>
                <p className="text-lg">Earn money from your recommendations</p>
                <p className="text-lg">Help travelers have authentic experiences</p>
              </div>
            </div>

            {/* Technology */}
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="bg-coral-500 p-4 rounded-2xl w-fit mx-auto mb-6">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">The Technology</h3>
              <div className="space-y-4 text-gray-600">
                <p className="text-lg">Built on Google Maps for reliability</p>
                <p className="text-lg">Works on all devices seamlessly</p>
                <p className="text-lg">Instant access - no app downloads</p>
                <p className="text-lg">Easy sharing and collaboration</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Vision & CTA */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="max-w-4xl mx-auto mb-12">
              <div className="flex justify-center mb-8">
                <div className="bg-coral-500 p-4 rounded-2xl">
                  <Heart className="h-12 w-12 text-white" />
                </div>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Vision</h2>
              <p className="text-xl text-gray-600 leading-relaxed mb-12">
                We envision a world where every traveler can experience destinations like a local, 
                and every local can share their passion for their city while earning from their expertise. 
                No more generic tourism - just authentic, meaningful connections between people and places.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <a 
                  href="/browse" 
                  className="bg-coral-500 hover:bg-coral-600 text-white font-semibold text-lg px-8 py-4 rounded-2xl transition-all duration-200 inline-flex items-center justify-center group"
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  Start Exploring
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
                <a 
                  href="/sell" 
                  className="bg-white border-2 border-coral-500 text-coral-500 hover:bg-coral-50 font-semibold text-lg px-8 py-4 rounded-2xl transition-all duration-200 inline-flex items-center justify-center group"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Sell like a Local
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
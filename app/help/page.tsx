'use client'

import { useState, useEffect } from 'react'
import { Search, Book, CreditCard, MessageCircle, Settings, RefreshCw, DollarSign, Shield, HelpCircle, ChevronRight, Clock, Mail, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTopics, setFilteredTopics] = useState<any[]>([])

  // Help topics with detailed information
  const helpTopics = [
    {
      id: 'plan-search-book',
      title: 'Plan, search and book',
      icon: MapPin,
      description: 'Find and book the perfect pin packs for your destination',
      articles: [
        'How to search for pin packs',
        'Understanding pack categories',
        'Booking process step-by-step',
        'Tips for choosing the right pack'
      ]
    },
    {
      id: 'packs-information',
      title: 'Packs information',
      icon: Book,
      description: 'Everything you need to know about pin packs',
      articles: [
        'What are pin packs?',
        'How to read pack details',
        'Understanding pack ratings',
        'Digital vs physical packs'
      ]
    },
    {
      id: 'booking-confirmation',
      title: 'Booking confirmation, voucher and packs',
      icon: MessageCircle,
      description: 'Managing your bookings and accessing your purchased packs',
      articles: [
        'Where to find booking confirmations',
        'How to access purchased packs',
        'Voucher redemption process',
        'Resending confirmation emails'
      ]
    },
    {
      id: 'packs-management',
      title: 'Packs management',
      icon: Settings,
      description: 'Managing your pin pack collection and preferences',
      articles: [
        'Organizing your purchased packs',
        'Adding packs to wishlists',
        'Sharing packs with friends',
        'Pack usage tracking'
      ]
    },
    {
      id: 'cancellation',
      title: 'Cancellation',
      icon: RefreshCw,
      description: 'Cancellation policies and procedures',
      articles: [
        'Cancellation policy overview',
        'How to cancel a booking',
        'Refund timeline and process',
        'Emergency cancellations'
      ]
    },
    {
      id: 'payment-refunds',
      title: 'Payment and refunds',
      icon: CreditCard,
      description: 'Payment methods, billing, and refund information',
      articles: [
        'Accepted payment methods',
        'Payment security and protection',
        'Refund policy and process',
        'Billing statement questions'
      ]
    },
    {
      id: 'data-privacy',
      title: 'Data and privacy',
      icon: Shield,
      description: 'Your privacy rights and data protection',
      articles: [
        'Privacy policy overview',
        'Data collection and usage',
        'Managing privacy settings',
        'Deleting your account and data'
      ]
    },
    {
      id: 'about-pinpacks',
      title: 'About PinPacks',
      icon: HelpCircle,
      description: 'Learn more about our platform and mission',
      articles: [
        'What is PinPacks?',
        'Our mission and values',
        'How we support local communities',
        'Platform safety and trust'
      ]
    }
  ]

  // Quick help links
  const quickLinks = [
    { title: 'Contact Support', icon: Mail, action: '/contact' }
  ]

  // Filter topics based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTopics(helpTopics)
    } else {
      const filtered = helpTopics.filter(topic =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.articles.some(article => 
          article.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      setFilteredTopics(filtered)
    }
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              How can we help you?
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Search our help center or browse topics below
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for topic, like 'booking', 'payment', or 'cancellation'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-coral-500 focus:border-coral-500 shadow-sm"
                />
              </div>
              
              {/* Search Results Count */}
              {searchQuery && (
                <p className="text-sm text-gray-600 mt-3">
                  {filteredTopics.length} topic{filteredTopics.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Help Topics */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {searchQuery ? 'Search Results' : 'Browse by topic'}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {filteredTopics.map((topic) => {
                const IconComponent = topic.icon
                return (
                  <div
                    key={topic.id}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer group"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-coral-100 rounded-lg flex items-center justify-center group-hover:bg-coral-200 transition-colors">
                        <IconComponent className="h-6 w-6 text-coral-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-coral-600 transition-colors">
                          {topic.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                          {topic.description}
                        </p>
                        
                        {/* Article List */}
                        <ul className="space-y-2">
                          {topic.articles.slice(0, 3).map((article: string, index: number) => (
                            <li key={index} className="flex items-center text-sm text-gray-700 hover:text-coral-600 cursor-pointer">
                              <ChevronRight className="h-3 w-3 mr-2 text-gray-400" />
                              {article}
                            </li>
                          ))}
                          {topic.articles.length > 3 && (
                            <li className="text-sm text-coral-600 font-medium cursor-pointer hover:text-coral-700">
                              View all {topic.articles.length} articles →
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* No Results */}
            {searchQuery && filteredTopics.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try searching with different keywords or browse our topics above.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-coral-600 hover:text-coral-700 font-medium"
                >
                  Clear search and view all topics
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - Quick Help */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Need immediate help?
              </h3>
              
              <div className="space-y-3">
                {quickLinks.map((link, index) => {
                  const IconComponent = link.icon
                  return (
                    <Link
                      key={index}
                      href={link.action}
                      className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-coral-200 hover:bg-coral-50 transition-colors group"
                    >
                      <IconComponent className="h-5 w-5 text-gray-400 group-hover:text-coral-600 mr-3" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-coral-700">
                        {link.title}
                      </span>
                    </Link>
                  )
                })}
              </div>

              {/* Response Time */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-800">
                    <strong>Avg. response time:</strong> Usually within 24 hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Articles Section */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Popular Articles
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">
                How to book your first pin pack
              </h3>
              <p className="text-sm text-gray-600">
                A step-by-step guide to finding and booking the perfect local experiences.
              </p>
            </div>
            
            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">
                Understanding our cancellation policy
              </h3>
              <p className="text-sm text-gray-600">
                Learn about free cancellation periods and refund processes.
              </p>
            </div>
            
            <div className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">
                Getting the most from your pin packs
              </h3>
              <p className="text-sm text-gray-600">
                Tips and tricks to maximize your local travel experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
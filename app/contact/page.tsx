'use client'

import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Send, ArrowLeft, CheckCircle, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default function ContactSupport() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false)

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('subject-dropdown')
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setShowSubjectDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    // Basic validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all required fields (Name, Email, Subject, and Message).')
      setIsSubmitting(false)
      return
    }

    try {
      // Create the email content
      const emailContent = {
        to: 'help.pinpacks@gmail.com',
        subject: `Contact Form: ${formData.subject || 'Support Request'}`,
        message: `
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone || 'Not provided'}
Location: ${formData.location || 'Not provided'}
Subject: ${formData.subject || 'General inquiry'}

Message:
${formData.message}

---
This message was sent from the PinPacks contact form.
        `
      }

      // Send email via API route
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailContent),
      })

      if (response.ok) {
        setIsSubmitted(true)
        
        // Scroll to top to show success message
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          location: '',
          subject: '',
          message: ''
        })
      } else {
        throw new Error('Failed to send message')
      }
    } catch (err) {
      setError('Failed to send message. Please try again or contact us directly at help.pinpacks@gmail.com')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Subject options
  const subjectOptions = [
    'General inquiry',
    'Booking issue',
    'Payment problem',
    'Account assistance',
    'Pack management',
    'Technical support',
    'Feedback or suggestion',
    'Other'
  ]

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for contacting us. We'll get back to you as soon as possible.
          </p>
          <div className="space-y-3">
            <Link 
              href="/help"
              className="block w-full bg-coral-600 text-white py-3 px-4 rounded-lg hover:bg-coral-700 transition-colors font-medium"
            >
              Back to Help Center
            </Link>
            <button
              onClick={() => setIsSubmitted(false)}
              className="block w-full text-coral-600 py-3 px-4 border border-coral-600 rounded-lg hover:bg-coral-50 transition-colors font-medium"
            >
              Send Another Message
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Link 
              href="/help"
              className="flex items-center text-coral-600 hover:text-coral-700 transition-colors mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Help Center
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Contact Support
            </h1>
            <p className="text-xl text-gray-600">
              We're here to help! Send us a message and we'll get back to you soon.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Get in Touch
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-coral-600 mt-1 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">carlos.jmz.mtz@gmail.com</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Send className="h-5 w-5 text-coral-600 mt-1 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Response Time</p>
                    <p className="text-sm text-gray-600">Usually within 24 hours</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  What to Include
                </h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Detailed description of your issue</li>
                  <li>• Steps you've already tried</li>
                  <li>• Screenshots if applicable</li>
                  <li>• Your booking reference (if relevant)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* Name and Email */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500 outline-none transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500 outline-none transition-colors"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                {/* Phone and Location */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
                      Phone Number <span className="text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500 outline-none transition-colors"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-900 mb-2">
                      Location <span className="text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500 outline-none transition-colors"
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-2">
                    Subject *
                  </label>
                  <div className="relative" id="subject-dropdown">
                    <button
                      type="button"
                      onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500 outline-none transition-all bg-white hover:border-gray-400"
                    >
                      <span className={formData.subject ? 'text-gray-900' : 'text-gray-500'}>
                        {formData.subject || 'Select a subject'}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                        showSubjectDropdown ? 'rotate-180' : ''
                      }`} />
                    </button>
                    
                    {/* Custom dropdown menu */}
                    {showSubjectDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-xl z-[9999] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                        <div className="py-1 max-h-60 overflow-y-auto">
                          {subjectOptions.map((subject) => (
                            <button
                              key={subject}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, subject }))
                                setShowSubjectDropdown(false)
                              }}
                              className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-b border-gray-50 last:border-b-0 ${
                                formData.subject === subject 
                                  ? 'text-coral-600 bg-coral-50 hover:bg-coral-100' 
                                  : 'text-gray-900 bg-white hover:bg-gray-50 hover:text-gray-700'
                              }`}
                            >
                              {subject}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-coral-500 outline-none transition-colors resize-vertical"
                    placeholder="Please describe your issue or question in detail..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center px-8 py-3 bg-coral-600 text-white rounded-lg hover:bg-coral-700 focus:ring-2 focus:ring-coral-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-top-transparent mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
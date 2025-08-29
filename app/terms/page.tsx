'use client'

import { Shield, Users, CreditCard, Globe, AlertTriangle, CheckCircle } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-25">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-100 mb-6">
              <Shield className="h-8 w-8 text-coral-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          
          {/* Introduction */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to PinCloud ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our platform 
              that connects travelers with local experiences through curated pin collections. By accessing or using our service, 
              you agree to be bound by these Terms.
            </p>
          </div>

          {/* Definitions */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Definitions</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>"Service"</strong> refers to the PinCloud platform, including our website and mobile applications.
              </div>
              <div>
                <strong>"User"</strong> refers to anyone who accesses or uses our Service.
              </div>
              <div>
                <strong>"Creator"</strong> refers to users who create and publish pin packs.
              </div>
              <div>
                <strong>"Traveler"</strong> refers to users who purchase and use pin packs.
              </div>
              <div>
                <strong>"Pin Pack"</strong> refers to a curated collection of location pins with descriptions and recommendations.
              </div>
            </div>
          </div>

          {/* Account Terms */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Terms</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Account Creation:</strong> You must provide accurate and complete information when creating an account.
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Account Security:</strong> You are responsible for maintaining the security of your account credentials.
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Age Requirement:</strong> You must be at least 18 years old to use our Service.
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>One Account:</strong> You may only maintain one account per email address.
                </div>
              </div>
            </div>
          </div>

          {/* Creator Responsibilities */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Creator Responsibilities</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start">
                <Users className="h-5 w-5 text-coral-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Authentic Content:</strong> All pin packs must contain authentic, firsthand recommendations from locals.
                </div>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>No Misleading Information:</strong> Do not include false, misleading, or outdated information.
                </div>
              </div>
              <div className="flex items-start">
                <Shield className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Respect Privacy:</strong> Do not include private residences or restricted areas without permission.
                </div>
              </div>
              <div className="flex items-start">
                <Globe className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Local Knowledge:</strong> Only create packs for areas you have personally visited and know well.
                </div>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payment and Pricing</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start">
                <CreditCard className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Pricing:</strong> All prices are displayed in USD and include applicable taxes.
                </div>
              </div>
              <div className="flex items-start">
                <CreditCard className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Payment Processing:</strong> Payments are processed securely through PayPal.
                </div>
              </div>
              <div className="flex items-start">
                <CreditCard className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Refunds:</strong> Digital products are non-refundable unless required by law.
                </div>
              </div>
              <div className="flex items-start">
                <CreditCard className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Creator Revenue:</strong> Creators receive 70% of the sale price after processing fees.
                </div>
              </div>
            </div>
          </div>

          {/* Prohibited Content */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Prohibited Content</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Illegal Activities:</strong> No content promoting illegal activities or dangerous behavior.
                </div>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Discrimination:</strong> No content that discriminates based on race, religion, gender, etc.
                </div>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Commercial Promotion:</strong> No direct promotion of businesses you own or are affiliated with.
                </div>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Private Property:</strong> No locations that require trespassing or violate privacy.
                </div>
              </div>
            </div>
          </div>

          {/* Intellectual Property */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>Your Content:</strong> You retain ownership of content you create, but grant us a license to use it.
              </div>
              <div>
                <strong>Our Platform:</strong> Our platform, design, and technology are protected by intellectual property laws.
              </div>
              <div>
                <strong>Third-Party Content:</strong> Respect copyright and trademark rights of third parties.
              </div>
              <div>
                <strong>License Grant:</strong> By creating content, you grant us a worldwide, non-exclusive license to display it.
              </div>
            </div>
          </div>

          {/* Privacy and Data */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Privacy and Data</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>Data Collection:</strong> We collect data as described in our Privacy Policy.
              </div>
              <div>
                <strong>Data Usage:</strong> We use your data to provide and improve our Service.
              </div>
              <div>
                <strong>Data Sharing:</strong> We do not sell your personal data to third parties.
              </div>
              <div>
                <strong>Data Security:</strong> We implement reasonable security measures to protect your data.
              </div>
            </div>
          </div>

          {/* Disclaimers */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>Service Availability:</strong> We do not guarantee uninterrupted access to our Service.
              </div>
              <div>
                <strong>Content Accuracy:</strong> We do not verify the accuracy of user-generated content.
              </div>
              <div>
                <strong>Travel Safety:</strong> Users are responsible for their own safety when visiting recommended locations.
              </div>
              <div>
                <strong>Third-Party Services:</strong> We are not responsible for third-party services like Google Maps.
              </div>
            </div>
          </div>

          {/* Limitation of Liability */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>Maximum Liability:</strong> Our total liability shall not exceed the amount you paid us in the past 12 months.
              </div>
              <div>
                <strong>Excluded Damages:</strong> We are not liable for indirect, incidental, or consequential damages.
              </div>
              <div>
                <strong>Force Majeure:</strong> We are not liable for events beyond our reasonable control.
              </div>
            </div>
          </div>

          {/* Termination */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Termination</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>Your Right:</strong> You may terminate your account at any time.
              </div>
              <div>
                <strong>Our Right:</strong> We may terminate accounts that violate these Terms.
              </div>
              <div>
                <strong>Effect:</strong> Upon termination, your access to the Service will cease immediately.
              </div>
              <div>
                <strong>Survival:</strong> Certain provisions survive termination, including payment obligations.
              </div>
            </div>
          </div>

          {/* Changes to Terms */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>Updates:</strong> We may update these Terms from time to time.
              </div>
              <div>
                <strong>Notification:</strong> We will notify you of significant changes via email or in-app notification.
              </div>
              <div>
                <strong>Continued Use:</strong> Continued use after changes constitutes acceptance of new Terms.
              </div>
            </div>
          </div>

          {/* Governing Law */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Governing Law</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>Jurisdiction:</strong> These Terms are governed by the laws of [Your Jurisdiction].
              </div>
              <div>
                <strong>Disputes:</strong> Disputes will be resolved in the courts of [Your Jurisdiction].
              </div>
              <div>
                <strong>Severability:</strong> If any provision is found unenforceable, the remaining provisions remain in effect.
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>Questions:</strong> If you have questions about these Terms, please contact us:
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div>Email: info@pincloud.com</div>
                <div>Address: Berlin, Germany</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
} 
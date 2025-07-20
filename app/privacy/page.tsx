'use client'

import { Shield, Eye, Lock, Users, Globe, Database, Bell, Settings } from 'lucide-react'

export default function PrivacyPage() {
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
              Privacy Policy
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
              At PinCloud ("we," "our," or "us"), we respect your privacy and are committed to protecting your personal data. 
              This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform 
              that connects travelers with local experiences through curated pin collections.
            </p>
          </div>

          {/* Information We Collect */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Information You Provide</h3>
            <div className="space-y-3 text-gray-700 mb-6">
              <div className="flex items-start">
                <Users className="h-5 w-5 text-coral-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Account Information:</strong> Name, email address, and profile details when you create an account
                </div>
              </div>
              <div className="flex items-start">
                <Users className="h-5 w-5 text-coral-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Content:</strong> Pin packs, reviews, ratings, and other content you create
                </div>
              </div>
              <div className="flex items-start">
                <Users className="h-5 w-5 text-coral-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Communications:</strong> Messages you send to us or other users
                </div>
              </div>
              <div className="flex items-start">
                <Users className="h-5 w-5 text-coral-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Payment Information:</strong> Payment details processed securely through PayPal
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Information We Collect Automatically</h3>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start">
                <Database className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Usage Data:</strong> How you interact with our platform, pages visited, and features used
                </div>
              </div>
              <div className="flex items-start">
                <Database className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers
                </div>
              </div>
              <div className="flex items-start">
                <Database className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Location Data:</strong> General location information (city/country level) for content personalization
                </div>
              </div>
            </div>
          </div>

          {/* How We Use Your Information */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start">
                <Eye className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Provide Our Service:</strong> To deliver pin packs, process payments, and maintain your account
                </div>
              </div>
              <div className="flex items-start">
                <Eye className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Personalize Experience:</strong> To show relevant content and recommendations based on your location and preferences
                </div>
              </div>
              <div className="flex items-start">
                <Eye className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Communicate:</strong> To send important updates, respond to inquiries, and provide customer support
                </div>
              </div>
              <div className="flex items-start">
                <Eye className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Improve Our Service:</strong> To analyze usage patterns and enhance our platform
                </div>
              </div>
              <div className="flex items-start">
                <Eye className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Ensure Security:</strong> To detect and prevent fraud, abuse, and security threats
                </div>
              </div>
              <div className="flex items-start">
                <Eye className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Comply with Law:</strong> To meet legal obligations and respond to lawful requests
                </div>
              </div>
            </div>
          </div>

          {/* Information Sharing */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>We Do Not Sell Your Data:</strong> We do not sell, rent, or trade your personal information to third parties.
              </div>
              <div>
                <strong>Service Providers:</strong> We may share data with trusted service providers who help us operate our platform:
              </div>
              <div className="ml-6 space-y-2">
                <div>• Payment processors (PayPal) for secure payment processing</div>
                <div>• Cloud hosting providers (Supabase) for data storage</div>
                <div>• Analytics services to understand platform usage</div>
                <div>• Customer support tools to assist you</div>
              </div>
              <div>
                <strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and safety.
              </div>
              <div>
                <strong>Business Transfers:</strong> In case of merger or acquisition, your data may be transferred to the new entity.
              </div>
            </div>
          </div>

          {/* Data Security */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start">
                <Lock className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Encryption:</strong> We use industry-standard encryption to protect your data in transit and at rest
                </div>
              </div>
              <div className="flex items-start">
                <Lock className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Access Controls:</strong> We implement strict access controls and authentication measures
                </div>
              </div>
              <div className="flex items-start">
                <Lock className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Regular Audits:</strong> We conduct regular security assessments and updates
                </div>
              </div>
              <div className="flex items-start">
                <Lock className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Employee Training:</strong> Our team is trained on data protection and security best practices
                </div>
              </div>
            </div>
          </div>

          {/* Data Retention */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>Account Data:</strong> We retain your account information as long as your account is active
              </div>
              <div>
                <strong>Content:</strong> Your created content is retained unless you delete it or your account is deleted
              </div>
              <div>
                <strong>Usage Data:</strong> We retain usage data for up to 2 years for analytics and service improvement
              </div>
              <div>
                <strong>Payment Data:</strong> Payment information is retained as required by law and for financial records
              </div>
              <div>
                <strong>Deletion:</strong> You can request deletion of your data, and we will process it within 30 days
              </div>
            </div>
          </div>

          {/* Your Rights */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start">
                <Settings className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Access:</strong> You can request a copy of the personal data we hold about you
                </div>
              </div>
              <div className="flex items-start">
                <Settings className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Correction:</strong> You can update or correct your personal information in your account settings
                </div>
              </div>
              <div className="flex items-start">
                <Settings className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Deletion:</strong> You can request deletion of your account and associated data
                </div>
              </div>
              <div className="flex items-start">
                <Settings className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Portability:</strong> You can request a copy of your data in a machine-readable format
                </div>
              </div>
              <div className="flex items-start">
                <Settings className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Objection:</strong> You can object to certain processing of your personal data
                </div>
              </div>
              <div className="flex items-start">
                <Settings className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Withdrawal:</strong> You can withdraw consent for data processing where applicable
                </div>
              </div>
            </div>
          </div>

          {/* Cookies and Tracking */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>Essential Cookies:</strong> We use necessary cookies to provide core functionality
              </div>
              <div>
                <strong>Analytics Cookies:</strong> We use analytics cookies to understand how our platform is used
              </div>
              <div>
                <strong>Third-Party Cookies:</strong> Some third-party services (like Google Maps) may set their own cookies
              </div>
              <div>
                <strong>Cookie Control:</strong> You can control cookies through your browser settings
              </div>
            </div>
          </div>

          {/* International Transfers */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start">
                <Globe className="h-5 w-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Global Service:</strong> Our service is available worldwide, and data may be processed in different countries
                </div>
              </div>
              <div className="flex items-start">
                <Globe className="h-5 w-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Data Protection:</strong> We ensure adequate protection for international data transfers
                </div>
              </div>
              <div className="flex items-start">
                <Globe className="h-5 w-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>EU Transfers:</strong> For EU users, we ensure transfers meet GDPR requirements
                </div>
              </div>
            </div>
          </div>

          {/* Children's Privacy */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>Age Requirement:</strong> Our service is not intended for children under 18 years old
              </div>
              <div>
                <strong>No Collection:</strong> We do not knowingly collect personal information from children under 18
              </div>
              <div>
                <strong>Parental Rights:</strong> If you believe we have collected data from a child, please contact us immediately
              </div>
            </div>
          </div>

          {/* Changes to Privacy Policy */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>Updates:</strong> We may update this Privacy Policy from time to time
              </div>
              <div>
                <strong>Notification:</strong> We will notify you of significant changes via email or in-app notification
              </div>
              <div>
                <strong>Continued Use:</strong> Continued use after changes constitutes acceptance of the updated policy
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>Questions:</strong> If you have questions about this Privacy Policy or our data practices, please contact us:
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div>Email: privacy@pincloud.com</div>
                <div>Data Protection Officer: dpo@pincloud.com</div>
                <div>Address: [Your Business Address]</div>
                <div>Phone: [Your Phone Number]</div>
              </div>
              <div>
                <strong>EU Representative:</strong> For EU users, you can also contact our EU representative at [EU Representative Details]
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
} 
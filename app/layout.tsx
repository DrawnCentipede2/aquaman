import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'
import PinCloudLogo from '@/components/PinCloudLogo'
import { ToastProvider } from '@/components/ui/toast'
import PerformanceMonitor from '@/components/PerformanceMonitor'
import { Inter } from 'next/font/google'

// Optimize font loading
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true
})

export const metadata: Metadata = {
  title: 'PinCloud - Local Travel Pins by Locals',
  description: 'Discover authentic travel spots through selected pin packs created by locals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-25 font-sans">
        <PerformanceMonitor />
        <ToastProvider>
          {/* Main application wrapper */}
          <div className="flex flex-col min-h-screen">
            {/* Airbnb-inspired navigation header */}
            <header className="bg-white shadow-card border-b border-gray-100 sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                  {/* Logo section with Airbnb-style branding */}
                  <div className="flex items-center">
                    <a 
                      href="/" 
                      className="flex items-center space-x-2 text-primary-500 hover:text-primary-600 transition-colors duration-200 cursor-pointer group"
                      title="Go to home page"
                    >
                      <div>
                        {/* PinCloud logo with pins raining from cloud */}
                        <PinCloudLogo className="h-8 w-8" animate={false} />
                      </div>
                      <span className="text-2xl font-bold tracking-tight">
                        PinCloud
                      </span>
                    </a>
                    <span 
                      id="tagline" 
                      className="ml-3 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hidden sm:inline-block transition-opacity duration-300"
                    >
                      by locals, for travelers
                    </span>
                  </div>

                  {/* Center Search Bar - Only show on browse page */}
                  <div className="flex-1 max-w-2xl mx-8 hidden md:block" id="header-search-container">
                    {/* This will be populated by the browse page */}
                  </div>
                  
                  {/* Navigation */}
                  <Navigation />
                </div>
              </div>
            </header>

            {/* Main content area with Airbnb spacing */}
            <main className="flex-1">
              {children}
            </main>

            {/* Airbnb-inspired footer */}
            <footer className="bg-gray-50 border-t border-gray-200 mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                  {/* About Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                      About
                    </h3>
                    <ul className="space-y-3">
                      <li><a href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">How it works</a></li>
                      <li><a href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">Our mission</a></li>
                      <li><a href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">Careers</a></li>
                    </ul>
                  </div>
                  
                  {/* Community Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                      Community
                    </h3>
                    <ul className="space-y-3">
                      <li><a href="/browse" className="text-gray-600 hover:text-gray-900 transition-colors">Browse packs</a></li>
                      <li><a href="/create" className="text-gray-600 hover:text-gray-900 transition-colors">Create a pack</a></li>
                      <li><a href="/manage" className="text-gray-600 hover:text-gray-900 transition-colors">Your pins</a></li>
                    </ul>
                  </div>
                  
                  {/* Support Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                      Support
                    </h3>
                    <ul className="space-y-3">
                      <li><a href="/help" className="text-gray-600 hover:text-gray-900 transition-colors">Help center</a></li>
                      <li><a href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact us</a></li>
                      <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Safety</a></li>
                    </ul>
                  </div>
                  
                  {/* Connect Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                      Connect
                    </h3>
                    <ul className="space-y-3">
                      <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Newsletter</a></li>
                      <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Social media</a></li>
                      <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Blog</a></li>
                    </ul>
                  </div>
                </div>
                
                {/* Footer bottom */}
                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
                  <div className="text-sm text-gray-600 mb-4 md:mb-0">
                    &copy; 2024 PinCloud. Connecting travelers with local insights.
                  </div>
                  <div className="flex space-x-6 text-sm text-gray-600">
                    <a href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</a>
                    <a href="/terms" className="hover:text-gray-900 transition-colors">Terms</a>
                    <a href="#" className="hover:text-gray-900 transition-colors">Sitemap</a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </ToastProvider>
      </body>
    </html>
  )
} 
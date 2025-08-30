import type { Metadata } from 'next'
import './globals.css'
import dynamic from 'next/dynamic'
import { Inter } from 'next/font/google'

// Lazy load heavy components to reduce initial bundle size
const Navigation = dynamic(() => import('@/components/Navigation'), {
  ssr: true,
  loading: () => <div className="h-20 bg-white shadow-card border-b border-gray-100" />
})

const PinCloudLogo = dynamic(() => import('@/components/PinCloudLogo'), {
  ssr: true
})

const ToastProvider = dynamic(() => import('@/components/ui/toast').then(mod => ({ default: mod.ToastProvider })), {
  ssr: true
})
const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: true
})

// Only load PerformanceMonitor in development or when explicitly needed
const PerformanceMonitor = dynamic(() => import('@/components/PerformanceMonitor'), {
  ssr: false,
  loading: () => null
})

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
        {process.env.NODE_ENV === 'development' && <PerformanceMonitor />}
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
                        <div className="rounded-lg p-2">
                          <PinCloudLogo className="h-12 w-auto" animate={false} />
                        </div>
                      </div>
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
                    {/* Search bar will be dynamically inserted here by the browse page */}
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

            {/* Footer */}
            <Footer />
          </div>
        </ToastProvider>
      </body>
    </html>
  )
} 
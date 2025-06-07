import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'PinPacks - Local Travel Pins by Locals',
  description: 'Discover authentic travel spots through curated pin packs created by locals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {/* Main application wrapper */}
        <div className="flex flex-col min-h-screen">
          {/* Navigation header */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-primary-600">
                    🗺️ PinPacks
                  </h1>
                  <span className="ml-2 text-sm text-gray-500">
                    by locals, for travelers
                  </span>
                </div>
                <Navigation />
              </div>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center text-gray-600">
                <p>&copy; 2024 PinPacks. Connecting travelers with local insights.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
} 
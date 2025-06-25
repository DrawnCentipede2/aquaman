'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { useState } from 'react'
import { MapPin, Home, Compass, User, Settings, LogOut } from 'lucide-react'

interface NavbarProps {
  userRole: 'buyer' | 'seller'
}

export default function Navbar({ userRole: initialRole }: NavbarProps) {
  const [userRole, setUserRole] = useState(initialRole)
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  const buyerNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/browse', label: 'Explore', icon: Compass },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  const sellerNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/manage', label: 'Manage Packs', icon: MapPin },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  const navItems = userRole === 'buyer' ? buyerNavItems : sellerNavItems

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">Pin Packs</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User Controls */}
          <div className="flex items-center space-x-4">
            {/* Role Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Buyer</span>
              <Switch
                checked={userRole === 'seller'}
                onCheckedChange={(checked: boolean) => setUserRole(checked ? 'seller' : 'buyer')}
              />
              <span className="text-sm text-gray-600">Seller</span>
            </div>

            {/* Settings and Logout */}
            <Link href="/settings" className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
              <Settings className="h-5 w-5" />
            </Link>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
} 
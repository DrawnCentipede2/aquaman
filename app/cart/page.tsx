'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, MapPin, Trash2, Plus, Minus, CreditCard, ArrowRight } from 'lucide-react'

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('pinpacks_cart')
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }
    setLoading(false)
  }, [])

  const removeFromCart = (itemId: string) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId)
    setCartItems(updatedCart)
    localStorage.setItem('pinpacks_cart', JSON.stringify(updatedCart))
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(itemId)
      return
    }
    
    const updatedCart = cartItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    )
    setCartItems(updatedCart)
    localStorage.setItem('pinpacks_cart', JSON.stringify(updatedCart))
  }

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-25 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-coral-100 mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading your cart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <ShoppingCart className="h-8 w-8 text-coral-500 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Your Cart
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl">
            Review your selected pin packs and proceed to checkout when ready.
          </p>
        </div>

        {/* Empty State */}
        {cartItems.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
              <ShoppingCart className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Browse our amazing pin packs and add some to your cart.
            </p>
            <a 
              href="/browse"
              className="btn-primary inline-flex items-center text-lg px-8 py-4"
            >
              <MapPin className="h-5 w-5 mr-2" />
              Browse Pin Packs
            </a>
          </div>
        )}

        {/* Cart Content */}
        {cartItems.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="card-airbnb p-6">
                    <div className="flex items-center space-x-4">
                      {/* Image placeholder */}
                      <div className="w-24 h-24 bg-gradient-to-br from-coral-100 to-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        <div className="absolute bottom-1 right-1">
                          <span className="bg-black/50 text-white px-1 py-0.5 rounded text-xs">
                            {item.pin_count} pins
                          </span>
                        </div>
                      </div>

                      {/* Item details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {item.city}, {item.country}
                        </p>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      {/* Price and controls */}
                      <div className="flex flex-col items-end space-y-3">
                        <div className="text-lg font-bold text-gray-900">
                          ${item.price}
                        </div>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Minus className="h-4 w-4 text-gray-600" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          >
                            <Plus className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card-airbnb p-6 sticky top-4">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Subtotal ({cartItems.reduce((total, item) => total + item.quantity, 0)} {cartItems.reduce((total, item) => total + item.quantity, 0) === 1 ? 'item' : 'items'})
                    </span>
                    <span className="font-medium">${getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing fee</span>
                    <span className="font-medium">$0.99</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${(getTotal() + 0.99).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button className="w-full btn-primary py-4 text-base mb-4">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Checkout
                </button>

                <div className="text-center">
                  <a 
                    href="/browse" 
                    className="text-coral-500 hover:text-coral-600 font-medium inline-flex items-center"
                  >
                    <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
                    Continue shopping
                  </a>
                </div>

                {/* Security note */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 text-center">
                    🔒 Secure checkout with 256-bit SSL encryption
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
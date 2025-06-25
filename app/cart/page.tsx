'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, MapPin, Trash2, Plus, Minus, CreditCard, ArrowRight, Check, AlertCircle } from 'lucide-react'
import PayPalCheckout from '@/components/PayPalCheckout'

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPayPal, setShowPayPal] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [paymentMessage, setPaymentMessage] = useState('')

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

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + item.price, 0)
  }

  // Handle successful PayPal payment
  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      setPaymentStatus('processing')
      setPaymentMessage('Processing your payment...')

      // First create the order in our database
      const createOrderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: cartItems,
          totalAmount: getTotal(),
          processingFee: 0.99,
          userLocation: 'Unknown', // You can get this from browser if needed
          userIp: 'Unknown' // You can get this from server if needed
        })
      })

      if (!createOrderResponse.ok) {
        throw new Error('Failed to create order')
      }

      const { order } = await createOrderResponse.json()

      // Then complete the order with PayPal details
      const response = await fetch('/api/orders/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          paypalOrderId: paymentData.orderID,
          paypalPayerId: paymentData.payerID,
          paypalPaymentId: paymentData.details?.id,
          customerEmail: paymentData.details?.payer?.email_address,
          customerName: paymentData.details?.payer?.name?.given_name + ' ' + 
                      (paymentData.details?.payer?.name?.surname || ''),
          paymentDetails: paymentData.details
        })
      })

      if (response.ok) {
        // Payment successful - clear cart and show success
        setPaymentStatus('success')
        setPaymentMessage('Payment successful! Your pin packs are now available.')
        localStorage.removeItem('pinpacks_cart')
        setCartItems([])
        
        // Redirect to a success page or show download links after a delay
        setTimeout(() => {
          window.location.href = '/pinventory'
        }, 3000)
      } else {
        throw new Error('Failed to complete order')
      }
    } catch (error) {
      console.error('Payment completion error:', error)
      setPaymentStatus('error')
      setPaymentMessage('Payment completed but there was an issue processing your order. Please contact support.')
    }
  }

  // Handle PayPal payment errors
  const handlePaymentError = (error: any) => {
    console.error('PayPal payment error:', error)
    setPaymentStatus('error')
    setPaymentMessage('Payment failed. Please try again or contact support if the issue persists.')
  }

  // Start checkout process
  const handleCheckout = () => {
    setShowPayPal(true)
    setPaymentStatus('idle')
    setPaymentMessage('')
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
                  <div key={item.id} className="card-airbnb p-6 group hover:shadow-lg transition-all duration-200 cursor-pointer"
                       onClick={() => window.location.href = `/pack/${item.id}`}>
                    <div className="flex items-center space-x-4">
                      {/* Image placeholder - Google Maps style background */}
                      <div className="w-24 h-24 bg-gradient-to-br from-coral-100 via-coral-50 to-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                        {/* Inner container that scales - maintains boundaries */}
                        <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300 ease-out">
                          {/* Google Maps background */}
                          <img 
                            src="/google-maps-bg.svg"
                            alt="Map background"
                            className="absolute inset-0 w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-lg"></div>
                        </div>
                        <div className="absolute bottom-1 right-1 z-10">
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
                        


                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFromCart(item.id)
                          }}
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
                      Subtotal ({cartItems.length} {cartItems.length === 1 ? 'pack' : 'packs'})
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

                {/* Payment Status Messages */}
                {paymentMessage && (
                  <div className={`p-4 rounded-lg mb-4 ${
                    paymentStatus === 'success' 
                      ? 'bg-green-50 border border-green-200' 
                      : paymentStatus === 'error'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <div className="flex items-center">
                      {paymentStatus === 'success' && <Check className="h-5 w-5 text-green-500 mr-2" />}
                      {paymentStatus === 'error' && <AlertCircle className="h-5 w-5 text-red-500 mr-2" />}
                      <p className={`text-sm ${
                        paymentStatus === 'success' 
                          ? 'text-green-800' 
                          : paymentStatus === 'error'
                          ? 'text-red-800'
                          : 'text-blue-800'
                      }`}>
                        {paymentMessage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Checkout Button or PayPal Component */}
                {!showPayPal ? (
                  <button 
                    onClick={handleCheckout}
                    className="w-full btn-primary py-3 text-base mb-4 flex items-center justify-center"
                    disabled={paymentStatus === 'processing' || paymentStatus === 'success'}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Proceed to Checkout
                  </button>
                ) : (
                  <div className="mb-4">
                    <PayPalCheckout
                      cartItems={cartItems}
                      totalAmount={getTotal()}
                      processingFee={0.99}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                    
                    {/* Back to cart button */}
                    <button
                      onClick={() => setShowPayPal(false)}
                      className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                      disabled={paymentStatus === 'processing'}
                    >
                      ← Back to cart
                    </button>
                  </div>
                )}

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
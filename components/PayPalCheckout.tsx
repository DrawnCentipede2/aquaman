'use client'

import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { useState } from 'react'
import { XCircle, Check, Loader2 } from 'lucide-react'
import CloudLoader from '@/components/CloudLoader'

// PayPal checkout component interface
interface PayPalCheckoutProps {
  cartItems: any[]
  totalAmount: number
  processingFee: number
  onSuccess: (orderData: any) => void
  onError: (error: any) => void
}

// Individual PayPal buttons component (inside the PayPal provider)
function PayPalButtonsComponent({ 
  cartItems, 
  totalAmount, 
  processingFee, 
  onSuccess, 
  onError 
}: PayPalCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Calculate final total including processing fee
  const finalTotal = (totalAmount + processingFee).toFixed(2)
  
  return (
    <div className="space-y-4">
      {/* Processing state overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <CloudLoader size="md" text="Processing your payment..." />
          </div>
        </div>
      )}
      
      {/* PayPal Buttons */}
      <PayPalButtons
        style={{
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal',
          height: 40
        }}
        
        // Create order on PayPal
        createOrder={async (data, actions) => {
          try {
            setIsProcessing(true)
            
            // Create order with PayPal
            return await actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: finalTotal,
                    currency_code: 'USD',
                    breakdown: {
                      item_total: {
                        currency_code: 'USD',
                        value: totalAmount.toFixed(2)
                      },
                      handling: {
                        currency_code: 'USD',
                        value: processingFee.toFixed(2)
                      }
                    }
                  },
                  items: cartItems.map(item => ({
                    name: item.title,
                    unit_amount: {
                      currency_code: 'USD',
                      value: item.price.toFixed(2)
                    },
                    quantity: '1',
                    description: `${item.city}, ${item.country} - ${item.pin_count} pins`
                  })),
                  description: `Google Pins Pack Purchase - ${cartItems.length} pack(s)`
                }
              ],
              intent: 'CAPTURE'
            })
          } catch (error) {
            console.error('Error creating PayPal order:', error)
            setIsProcessing(false)
            onError(error)
            throw error
          }
        }}
        
        // Handle successful payment
        onApprove={async (data, actions) => {
          try {
            // Capture the payment
            const details = await actions.order?.capture()
            
            if (details) {
              // Call our success handler with payment details
              await onSuccess({
                orderID: data.orderID,
                payerID: data.payerID,
                details: details,
                cartItems: cartItems,
                totalAmount: finalTotal
              })
            }
          } catch (error) {
            console.error('Error capturing PayPal payment:', error)
            onError(error)
          } finally {
            setIsProcessing(false)
          }
        }}
        
        // Handle payment errors
        onError={(error) => {
          console.error('PayPal payment error:', error)
          setIsProcessing(false)
          onError(error)
        }}
        
        // Handle cancelled payments
        onCancel={(data) => {
          console.log('PayPal payment cancelled:', data)
          setIsProcessing(false)
        }}
      />
    </div>
  )
}

// Main PayPal checkout component with provider
export default function PayPalCheckout(props: PayPalCheckoutProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const environment = process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT || 'sandbox'
  
  // Check if PayPal is configured
  if (!clientId) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center mb-2">
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
          <h3 className="font-medium text-red-800">PayPal Not Configured</h3>
        </div>
        <p className="text-red-700 text-sm">
          PayPal client ID is missing. Please check your environment configuration.
        </p>
      </div>
    )
  }
  
  return (
    <div className="relative">
      <PayPalScriptProvider
        options={{
          clientId: clientId,
          currency: 'USD',
          intent: 'capture',
          // Use sandbox or live environment
          ...(environment === 'sandbox' && { 'disable-funding': 'credit,card' })
        }}
      >
        <PayPalButtonsComponent {...props} />
      </PayPalScriptProvider>
    </div>
  )
} 
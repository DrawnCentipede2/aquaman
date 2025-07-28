'use client'

import { useEffect, useState } from 'react'
import { Check, MapPin, ArrowRight, ShoppingBag } from 'lucide-react'

interface PaymentSuccessModalProps {
  isOpen: boolean
  packsCount: number
  onViewPacks: () => void
  onKeepBrowsing: () => void
}

export default function PaymentSuccessModal({ 
  isOpen, 
  packsCount, 
  onViewPacks, 
  onKeepBrowsing 
}: PaymentSuccessModalProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Small delay to allow modal to fade in first
      setTimeout(() => setShowContent(true), 300)
    } else {
      setShowContent(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Modal backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Modal content */}
        <div className={`
          bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 relative overflow-hidden
          transform transition-all duration-500 ease-out
          ${showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}>
          {/* Falling pins animation container */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Generate multiple falling pins */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute text-coral-500"
                style={{
                  left: `${Math.random() * 100}%`,
                  animation: `fall-${i % 4} ${2.5 + Math.random() * 1.5}s ease-in infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                  fontSize: `${15 + Math.random() * 15}px`
                }}
              >
                <MapPin className="w-8 h-8" />
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 p-8 text-center">
            {/* Success checkmark with animation */}
            <div className={`
              inline-flex items-center justify-center w-20 h-20 rounded-full 
              bg-green-100 mb-6 transform transition-all duration-700 ease-out
              ${showContent ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}
            `}>
              <Check className="w-10 h-10 text-green-600" />
            </div>

            {/* Success message */}
            <h2 className={`
              text-3xl font-bold text-gray-900 mb-3 transform transition-all duration-500 ease-out delay-200
              ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}>
              Payment Successful!
            </h2>

            {/* Thank you message */}
            <p className={`
              text-gray-600 text-lg mb-2 transform transition-all duration-500 ease-out delay-300
              ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}>
              Thank you for your purchase!
            </p>

            {/* Order details */}
            <div className={`
              bg-coral-50 rounded-lg p-4 mb-8 transform transition-all duration-500 ease-out delay-400
              ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}>
              <div className="flex items-center justify-center text-coral-700">
                <ShoppingBag className="w-5 h-5 mr-2" />
                <span className="font-semibold">
                  {packsCount} Pin Pack{packsCount !== 1 ? 's' : ''} Purchased
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className={`
              space-y-3 transform transition-all duration-500 ease-out delay-500
              ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}>
              {/* Primary action - View packs */}
              <button
                onClick={onViewPacks}
                className="w-full btn-primary flex items-center justify-center text-lg py-4 font-semibold"
              >
                <MapPin className="w-5 h-5 mr-2" />
                View My Packs
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>

              {/* Secondary action - Keep browsing */}
              <button
                onClick={onKeepBrowsing}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-colors duration-200"
              >
                Keep Browsing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS animations for falling pins */}
      <style jsx>{`
        @keyframes fall-0 {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0.8;
          }
          100% {
            transform: translateY(400px) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes fall-1 {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0.9;
          }
          100% {
            transform: translateY(450px) rotate(-360deg);
            opacity: 0;
          }
        }
        @keyframes fall-2 {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0.7;
          }
          100% {
            transform: translateY(420px) rotate(180deg);
            opacity: 0;
          }
        }
        @keyframes fall-3 {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0.8;
          }
          100% {
            transform: translateY(480px) rotate(-180deg);
            opacity: 0;
          }
        }
        
        .animate-fall-0 {
          animation: fall-0 3s ease-in infinite;
        }
        .animate-fall-1 {
          animation: fall-1 3.5s ease-in infinite;
        }
        .animate-fall-2 {
          animation: fall-2 2.8s ease-in infinite;
        }
        .animate-fall-3 {
          animation: fall-3 3.2s ease-in infinite;
        }
      `}</style>
    </>
  )
} 
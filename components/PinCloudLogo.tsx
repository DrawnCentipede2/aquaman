'use client'

import React from 'react'

interface PinCloudLogoProps {
  className?: string
  animate?: boolean
}

export default function PinCloudLogo({ className = "h-8 w-8", animate = false }: PinCloudLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cloud shape */}
      <path
        d="M25 45c-8 0-15-7-15-15s7-15 15-15c2-10 11-18 22-18s20 8 22 18c8 0 15 7 15 15s-7 15-15 15H25z"
        fill="currentColor"
        className="opacity-80"
      />
      
      {/* Pins falling from cloud */}
      <g className={animate ? "animate-bounce" : ""}>
        {/* Pin 1 */}
        <circle
          cx="30"
          cy="55"
          r="3"
          fill="currentColor"
          className="opacity-90"
        />
        <path
          d="M30 58 L30 68 L32 66 L30 68 L28 66 L30 68"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-90"
        />
        
        {/* Pin 2 */}
        <circle
          cx="50"
          cy="65"
          r="3"
          fill="currentColor"
          className="opacity-90"
        />
        <path
          d="M50 68 L50 78 L52 76 L50 78 L48 76 L50 78"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-90"
        />
        
        {/* Pin 3 */}
        <circle
          cx="70"
          cy="55"
          r="3"
          fill="currentColor"
          className="opacity-90"
        />
        <path
          d="M70 58 L70 68 L72 66 L70 68 L68 66 L70 68"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-90"
        />
      </g>
      
      {/* Additional small pins for dynamic effect */}
      <g className={animate ? "animate-pulse" : ""}>
        <circle cx="40" cy="60" r="1.5" fill="currentColor" className="opacity-70" />
        <circle cx="60" cy="58" r="1.5" fill="currentColor" className="opacity-70" />
        <circle cx="35" cy="70" r="1.5" fill="currentColor" className="opacity-60" />
        <circle cx="65" cy="70" r="1.5" fill="currentColor" className="opacity-60" />
      </g>
    </svg>
  )
} 
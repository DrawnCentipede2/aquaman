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
      
      {/* Google Maps–style pin on top of the cloud */}
      <g className={animate ? "animate-bounce" : ""}>
        {/* Pin head */}
        <circle cx="50" cy="28" r="7" fill="currentColor" />
        {/* Pin body */}
        <path
          d="M50 35 C47 40 44 46 50 55 C56 46 53 40 50 35 Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
} 
'use client'

import React from 'react'

interface PinCloudLogoProps {
  className?: string
  animate?: boolean
}

export default function PinCloudLogo({ className = "h-8 w-auto", animate = false }: PinCloudLogoProps) {
  return (
    <img
      src="/PinCloud_logo.svg"
      alt="PinCloud logo"
      className={className}
      loading="eager"
      decoding="async"
    />
  )
}
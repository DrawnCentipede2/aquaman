'use client'

import React from 'react'

interface CloudLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

export default function CloudLoader({ size = 'md', className = '', text }: CloudLoaderProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Main cloud */}
        <div className="absolute inset-0 animate-cloud-pulse">
          <svg viewBox="0 0 100 60" className="w-full h-full">
            <path
              d="M25 30c-8 0-15-7-15-15s7-15 15-15c2-10 11-18 22-18s20 8 22 18c8 0 15 7 15 15s-7 15-15 15H25z"
              fill="currentColor"
              className="opacity-60"
            />
          </svg>
        </div>
        
        {/* Floating small clouds */}
        <div className="absolute inset-0">
          <div className="absolute top-2 left-4 animate-cloud-float" style={{ animationDelay: '0s', animationDuration: '3s' }}>
            <svg viewBox="0 0 30 20" className="w-4 h-4 opacity-40">
              <path
                d="M8 12c-3 0-5-2-5-5s2-5 5-5c1-3 3-5 6-5s5 2 6 5c3 0 5 2 5 5s-2 5-5 5H8z"
                fill="currentColor"
              />
            </svg>
          </div>
          
          <div className="absolute top-1 right-6 animate-cloud-float" style={{ animationDelay: '1s', animationDuration: '3.5s' }}>
            <svg viewBox="0 0 25 15" className="w-3 h-3 opacity-50">
              <path
                d="M6 9c-2 0-4-2-4-4s2-4 4-4c1-2 2-3 4-3s3 1 4 3c2 0 4 2 4 4s-2 4-4 4H6z"
                fill="currentColor"
              />
            </svg>
          </div>
          
          <div className="absolute bottom-2 left-8 animate-cloud-float" style={{ animationDelay: '2s', animationDuration: '2.8s' }}>
            <svg viewBox="0 0 20 12" className="w-2.5 h-2.5 opacity-60">
              <path
                d="M5 7c-1.5 0-3-1.5-3-3s1.5-3 3-3c0.5-1.5 1-2 2-2s1.5 0.5 2 2c1.5 0 3 1.5 3 3s-1.5 3-3 3H5z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
        
        {/* Rain drops */}
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-1/4 animate-rain-drop" style={{ animationDelay: '0.2s', animationDuration: '1.5s' }}>
            <div className="w-1 h-2 bg-current opacity-70 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 left-1/2 animate-rain-drop" style={{ animationDelay: '0.6s', animationDuration: '1.5s' }}>
            <div className="w-1 h-2 bg-current opacity-70 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 right-1/4 animate-rain-drop" style={{ animationDelay: '1s', animationDuration: '1.5s' }}>
            <div className="w-1 h-2 bg-current opacity-70 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {text && (
        <p className="text-gray-600 text-sm mt-3 animate-pulse">{text}</p>
      )}
    </div>
  )
} 
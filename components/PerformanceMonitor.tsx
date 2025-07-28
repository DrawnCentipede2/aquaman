'use client'

import { useEffect } from 'react'

export default function PerformanceMonitor() {
  useEffect(() => {
    // Defer performance monitoring to avoid blocking LCP
    const initMonitoring = () => {
      // Monitor Core Web Vitals
      if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
        // Monitor Largest Contentful Paint (LCP) - Critical for LCP measurement
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          
          // Only log if LCP is poor to reduce console noise
          if (lastEntry.startTime > 2500) {
            console.warn('Poor LCP detected:', Math.round(lastEntry.startTime))
          } else {
            console.log('Good LCP:', Math.round(lastEntry.startTime))
          }
        })
        
        try {
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        } catch (e) {
          console.warn('LCP monitoring not supported')
        }

        // Defer non-critical monitoring to avoid blocking LCP
        const deferNonCriticalMonitoring = () => {
          // Monitor First Input Delay (FID) - Less critical for LCP
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry: any) => {
              const fid = entry.processingStart - entry.startTime
              if (fid > 100) {
                console.warn('Poor FID detected:', Math.round(fid))
              }
            })
          })
          
          try {
            fidObserver.observe({ entryTypes: ['first-input'] })
          } catch (e) {
            console.warn('FID monitoring not supported')
          }

          // Monitor Cumulative Layout Shift (CLS) - Less critical for LCP
          let clsValue = 0
          const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value
                if (clsValue > 0.1) {
                  console.warn('Poor CLS detected:', clsValue.toFixed(3))
                }
              }
            })
          })
          
          try {
            clsObserver.observe({ entryTypes: ['layout-shift'] })
          } catch (e) {
            console.warn('CLS monitoring not supported')
          }
        }

        // Use requestIdleCallback to defer non-critical monitoring
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(deferNonCriticalMonitoring, { timeout: 2000 })
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(deferNonCriticalMonitoring, 1000)
        }
      }

      // Monitor page load time - defer to avoid blocking LCP
      if (typeof window !== 'undefined') {
        const monitorPageLoad = () => {
          const loadTime = performance.now()
          if (loadTime > 3000) {
            console.warn('Slow page load detected:', Math.round(loadTime))
          } else {
            console.log('Fast page load:', Math.round(loadTime))
          }
        }

        if (document.readyState === 'complete') {
          // Page already loaded, monitor immediately
          monitorPageLoad()
        } else {
          // Wait for page load
          window.addEventListener('load', monitorPageLoad, { once: true })
        }
      }
    }

    // Defer initialization to avoid blocking initial render
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(initMonitoring, { timeout: 1000 })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(initMonitoring, 500)
    }
  }, [])

  return null // This component doesn't render anything
} 
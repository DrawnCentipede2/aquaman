'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import OptimizedPackCard from './OptimizedPackCard'

interface VirtualizedGridProps {
  items: any[]
  itemHeight: number
  containerHeight: number
  columns: number
  gap: number
  isAuthenticated: boolean
  wishlistItems: string[]
  onToggleWishlist: (pack: any) => void
  onShowLoginModal: () => void
  getGoogleMapsRating: (city: string, country: string, packTitle: string) => any
  shouldShowGoogleMapsRating: (pack: any) => boolean
}

export default function VirtualizedGrid({
  items,
  itemHeight,
  containerHeight,
  columns,
  gap,
  isAuthenticated,
  wishlistItems,
  onToggleWishlist,
  onShowLoginModal,
  getGoogleMapsRating,
  shouldShowGoogleMapsRating
}: VirtualizedGridProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const rowHeight = itemHeight + gap
  const totalRows = Math.ceil(items.length / columns)
  const totalHeight = totalRows * rowHeight

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / rowHeight)
    const visibleRows = Math.ceil(containerHeight / rowHeight) + 2 // Extra buffer
    const end = Math.min(start + visibleRows, totalRows)
    
    return {
      startRow: Math.max(0, start - 1), // Extra buffer above
      endRow: end,
      startIndex: Math.max(0, (start - 1) * columns),
      endIndex: Math.min(end * columns, items.length)
    }
  }, [scrollTop, rowHeight, containerHeight, totalRows, columns, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex)
  }, [items, visibleRange.startIndex, visibleRange.endIndex])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight }}>
        {/* Visible items container */}
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            transform: `translateY(${visibleRange.startRow * rowHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((pack, index) => (
            <OptimizedPackCard
              key={pack.id}
              pack={pack}
              isAuthenticated={isAuthenticated}
              isInWishlist={wishlistItems.includes(pack.id)}
              onToggleWishlist={onToggleWishlist}
              onShowLoginModal={onShowLoginModal}
              getGoogleMapsRating={getGoogleMapsRating}
              shouldShowGoogleMapsRating={shouldShowGoogleMapsRating}
              index={visibleRange.startIndex + index}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
import React, { useEffect, useRef, useState } from 'react'

interface GalleryModalProps {
  images: string[] // Array of base64 image strings
  startIndex: number // Index of the image to show first
  isOpen: boolean
  onClose: () => void
}

// Minimal, elegant modal with swipeable carousel
const GalleryModal: React.FC<GalleryModalProps> = ({ images, startIndex, isOpen, onClose }) => {
  const [current, setCurrent] = useState(startIndex)
  const modalRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  // Update current index if startIndex changes (e.g., when opening modal)
  useEffect(() => {
    if (isOpen) setCurrent(startIndex)
  }, [isOpen, startIndex])

  // Close modal on ESC key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, current])

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === modalRef.current) onClose()
  }

  // Carousel navigation
  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1))

  // Touch/swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta > 50) prev()
    if (delta < -50) next()
    touchStartX.current = null
  }

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
      tabIndex={-1}
    >
      {/* Modal content */}
      <div className="relative max-w-3xl w-full mx-4" style={{ aspectRatio: '4/3' }}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow"
          aria-label="Close gallery"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Left arrow */}
        {images.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow"
            aria-label="Previous image"
          >
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {/* Right arrow */}
        {images.length > 1 && (
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full p-2 shadow"
            aria-label="Next image"
          >
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {/* Single image display */}
        <div 
          className="w-full h-full bg-black rounded-xl overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={images[current]}
            alt={`Gallery image ${current + 1} of ${images.length}`}
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Image counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
          {current + 1} / {images.length}
        </div>
</div>
</div>
)
}
export default GalleryModal
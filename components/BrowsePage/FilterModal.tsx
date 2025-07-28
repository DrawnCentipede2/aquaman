'use client'

import { X } from 'lucide-react'
import { STANDARD_CATEGORIES } from '@/lib/categories'
import type { PinPack } from '@/lib/supabase'

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  categoryFilter: string
  setCategoryFilter: (category: string) => void
  starRatingFilter: string
  setStarRatingFilter: (rating: string) => void
  pinCountFilter: string
  setPinCountFilter: (count: string) => void
  clearFilters: () => void
  filteredPacks: PinPack[]
}

export default function FilterModal({
  isOpen,
  onClose,
  categoryFilter,
  setCategoryFilter,
  starRatingFilter,
  setStarRatingFilter,
  pinCountFilter,
  setPinCountFilter,
  clearFilters,
  filteredPacks
}: FilterModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-center rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute left-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-8">
          {/* Star Rating */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Star Rating</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="rating"
                  checked={starRatingFilter === 'all'}
                  onChange={() => setStarRatingFilter('all')}
                  className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">All ratings</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="rating"
                  checked={starRatingFilter === '4+'}
                  onChange={() => setStarRatingFilter('4+')}
                  className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">4+ stars</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="rating"
                  checked={starRatingFilter === '4.5+'}
                  onChange={() => setStarRatingFilter('4.5+')}
                  className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">4.5+ stars</span>
              </label>
            </div>
          </div>

          {/* Pin Count */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Size</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="pinCount"
                  checked={pinCountFilter === 'all'}
                  onChange={() => setPinCountFilter('all')}
                  className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">All sizes</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="pinCount"
                  checked={pinCountFilter === 'small'}
                  onChange={() => setPinCountFilter('small')}
                  className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Small (0-5)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="pinCount"
                  checked={pinCountFilter === 'medium'}
                  onChange={() => setPinCountFilter('medium')}
                  className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Medium (6-15)</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="pinCount"
                  checked={pinCountFilter === 'large'}
                  onChange={() => setPinCountFilter('large')}
                  className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Large (15+)</span>
              </label>
            </div>
          </div>

          {/* Travel Categories */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Travel Categories</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="category"
                  checked={categoryFilter === 'all'}
                  onChange={() => setCategoryFilter('all')}
                  className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">All categories</span>
              </label>
              {STANDARD_CATEGORIES.map(category => (
                <label key={category} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="category"
                    checked={categoryFilter === category}
                    onChange={() => setCategoryFilter(category)}
                    className="w-4 h-4 text-coral-500 border-gray-300 focus:ring-coral-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{category}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end rounded-b-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800 font-medium underline"
            >
              Clear all filters
            </button>
            <button
              onClick={onClose}
              className="btn-primary px-8 py-3"
            >
              Show {filteredPacks.length} places
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
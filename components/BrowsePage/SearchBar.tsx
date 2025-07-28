'use client'

import { Search } from 'lucide-react'

interface SearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onSearch: () => void
  // Optional suggestion props for enhanced search functionality
  suggestions?: string[]
  showSuggestions?: boolean
  selectedSuggestionIndex?: number
  onSuggestionClick?: (suggestion: string) => void
  onSuggestionIndexChange?: (index: number) => void
}

export default function SearchBar({ 
  searchTerm, 
  onSearchChange, 
  onSearch,
  suggestions = [],
  showSuggestions = false,
  selectedSuggestionIndex = -1,
  onSuggestionClick,
  onSuggestionIndexChange
}: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showSuggestions && selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        onSuggestionClick?.(suggestions[selectedSuggestionIndex])
      } else {
        onSearch()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (showSuggestions && suggestions.length > 0) {
        const nextIndex = selectedSuggestionIndex < suggestions.length - 1 ? selectedSuggestionIndex + 1 : 0
        onSuggestionIndexChange?.(nextIndex)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showSuggestions && suggestions.length > 0) {
        const prevIndex = selectedSuggestionIndex > 0 ? selectedSuggestionIndex - 1 : suggestions.length - 1
        onSuggestionIndexChange?.(prevIndex)
      }
    } else if (e.key === 'Escape') {
      onSuggestionIndexChange?.(-1)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-full max-w-md relative">
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 focus-within:border-coral-500 focus-within:ring-2 focus-within:ring-coral-500/20 transition-all">
          <Search className="h-4 w-4 text-gray-400 ml-3 mr-2" />
          <input
            type="text"
            placeholder="Search destinations, cities..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-none outline-none text-gray-700 text-sm placeholder-gray-400 bg-transparent py-3 pr-3"
            autoComplete="off"
          />
        </div>
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick?.(suggestion)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  index === selectedSuggestionIndex ? 'bg-coral-50 text-coral-600' : 'text-gray-700'
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
      <button 
        onClick={onSearch}
        className="bg-coral-500 hover:bg-coral-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
      >
        Search
      </button>
    </div>
  )
} 
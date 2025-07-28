'use client'

import { Search } from 'lucide-react'

interface SearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onSearch: () => void
}

export default function SearchBar({ searchTerm, onSearchChange, onSearch }: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch()
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
// Standard categories for PinCloud - used throughout the application
// These match the categories defined in the Supabase migration file

export const STANDARD_CATEGORIES = [
  'Adventure',
  'Food & Drink', 
  'Nightlife',
  'Cultural',
  'Family',
  'Romantic',
  'Business Travel',
  'Relaxation',
  'Solo Travel',
  'Friends Group',
  'Hidden Gems'
] as const

export type Category = typeof STANDARD_CATEGORIES[number]

// Category descriptions for UI components
export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  'Adventure': 'Thrilling trails and breathtaking vistas that awaken your inner explorer',
  'Food & Drink': 'Taste the soul of the city through authentic flavors and local traditions',
  'Nightlife': 'Where melodies meet memories in vibrant venues and intimate spaces',
  'Cultural': 'Ancient stories and modern creativity collide in these cultural havens',
  'Family': 'Perfect destinations for creating lasting memories with loved ones',
  'Romantic': 'Where love stories unfold in hidden corners and candlelit moments',
  'Business Travel': 'Professional destinations for work and networking',
  'Relaxation': 'Peaceful retreats for rejuvenation and wellness',
  'Solo Travel': 'Independent adventures for the free-spirited explorer',
  'Friends Group': 'Social destinations perfect for group experiences and celebrations',
  'Hidden Gems': 'Secret spots and local favorites that only insiders know about'
}

// Category icons for UI components
export const CATEGORY_ICONS: Record<Category, string> = {
  'Adventure': 'Mountain',
  'Food & Drink': 'Utensils',
  'Nightlife': 'Music',
  'Cultural': 'Building',
  'Family': 'Users',
  'Romantic': 'Heart',
  'Business Travel': 'Briefcase',
  'Relaxation': 'Leaf',
  'Solo Travel': 'User',
  'Friends Group': 'Users',
  'Hidden Gems': 'MapPin'
}

// Category colors for UI components
export const CATEGORY_COLORS: Record<Category, string> = {
  'Adventure': 'from-orange-400 to-red-500',
  'Food & Drink': 'from-green-400 to-emerald-500',
  'Nightlife': 'from-yellow-400 to-amber-500',
  'Cultural': 'from-purple-400 to-violet-500',
  'Family': 'from-blue-400 to-indigo-500',
  'Romantic': 'from-rose-400 to-pink-500',
  'Business Travel': 'from-gray-400 to-slate-500',
  'Relaxation': 'from-teal-400 to-cyan-500',
  'Solo Travel': 'from-indigo-400 to-purple-500',
  'Friends Group': 'from-pink-400 to-rose-500',
  'Hidden Gems': 'from-amber-400 to-orange-500'
}

// Category background colors for UI components
export const CATEGORY_BG_COLORS: Record<Category, string> = {
  'Adventure': 'bg-gradient-to-br from-orange-50 to-red-50',
  'Food & Drink': 'bg-gradient-to-br from-green-50 to-emerald-50',
  'Nightlife': 'bg-gradient-to-br from-yellow-50 to-amber-50',
  'Cultural': 'bg-gradient-to-br from-purple-50 to-violet-50',
  'Family': 'bg-gradient-to-br from-blue-50 to-indigo-50',
  'Romantic': 'bg-gradient-to-br from-rose-50 to-pink-50',
  'Business Travel': 'bg-gradient-to-br from-gray-50 to-slate-50',
  'Relaxation': 'bg-gradient-to-br from-teal-50 to-cyan-50',
  'Solo Travel': 'bg-gradient-to-br from-indigo-50 to-purple-50',
  'Friends Group': 'bg-gradient-to-br from-pink-50 to-rose-50',
  'Hidden Gems': 'bg-gradient-to-br from-amber-50 to-orange-50'
}

// Helper function to validate if a category is valid
export const isValidCategory = (category: string): category is Category => {
  return STANDARD_CATEGORIES.includes(category as Category)
}

// Helper function to get category description
export const getCategoryDescription = (category: string): string => {
  return CATEGORY_DESCRIPTIONS[category as Category] || 'Amazing place to visit'
}

// Helper function to get category icon
export const getCategoryIcon = (category: string): string => {
  return CATEGORY_ICONS[category as Category] || 'MapPin'
}

// Helper function to get category color
export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category as Category] || 'from-gray-400 to-gray-500'
}

// Helper function to get category background color
export const getCategoryBgColor = (category: string): string => {
  return CATEGORY_BG_COLORS[category as Category] || 'bg-gradient-to-br from-gray-50 to-gray-100'
} 
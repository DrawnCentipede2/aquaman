/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Airbnb-inspired color palette
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Main red
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        coral: {
          50: '#fff4f2',
          100: '#ffe7e2',
          200: '#ffcdcc',
          300: '#ffaaa5',
          400: '#ff7875',
          500: '#ff5a5f', // Airbnb coral
          600: '#e63946',
          700: '#c53030',
          800: '#9c2a2a',
          900: '#822727',
        },
        // Enhanced grays for better contrast
        gray: {
          25: '#fcfcfc',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        }
      },
      fontFamily: {
        sans: ['Circular', 'Cereal', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'airbnb': '0 6px 16px rgba(0, 0, 0, 0.12)',
        'airbnb-hover': '0 10px 28px rgba(0, 0, 0, 0.25)',
        'card': '0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 2px 4px rgba(0, 0, 0, 0.08), 0 16px 32px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      }
    },
  },
  plugins: [],
} 
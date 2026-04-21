/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
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
        },
        neon: {
          red: '#ff006e',
          pink: '#ff0080',
          purple: '#8338ec',
          blue: '#3a86ff',
          cyan: '#06ffa5',
          yellow: '#ffbe0b',
        }
      }
    },
  },
  plugins: [],
}

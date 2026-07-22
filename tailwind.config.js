/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#111315',
        card: '#181B20',
        border: '#2B3138',
        accent: {
          blue: '#3B82F6',
          green: '#22C55E',
          orange: '#F59E0B',
          purple: '#A855F7',
          teal: '#14B8A6',
          red: '#EF4444',
          gray: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans JP"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./renderer/**/*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#D32323',
          'red-dark': '#B01818',
          yellow: '#FFC72C',
          'yellow-dark': '#E0A800',
          cream: '#FFFDF9',
          dark: '#1C1917',
          gray: '#78716C',
          lightgray: '#F5F5F4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'touch': '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
        'touch-active': '0 2px 6px 0 rgba(0, 0, 0, 0.15)',
        'tray': '0 -10px 30px -5px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}

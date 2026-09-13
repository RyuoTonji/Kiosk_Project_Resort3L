/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./renderer/**/*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        resort: {
          sun: '#F59E0B',
          'sun-light': '#FBBF24',
          'sun-dark': '#D97706',
          ocean: '#0284C7',
          'ocean-light': '#38BDF8',
          'ocean-dark': '#0369A1',
          palm: '#10B981',
          'palm-light': '#34D399',
          'palm-dark': '#059669',
          sand: '#FEF3C7',
          sky: '#F0F9FF',
          charcoal: '#0F172A',
          slate: '#1E293B',
          warmwhite: '#FAFAF9'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'touch': '0 4px 14px 0 rgba(0, 0, 0, 0.08)',
        'touch-active': '0 1px 3px 0 rgba(0, 0, 0, 0.12)',
        'kiosk-card': '0 10px 25px -5px rgba(2, 132, 199, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'tray': '0 -10px 30px -5px rgba(15, 23, 42, 0.12)',
      }
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        resort: {
          "primary": "#F59E0B",
          "primary-content": "#0F172A",
          "secondary": "#0284C7",
          "secondary-content": "#FFFFFF",
          "accent": "#10B981",
          "accent-content": "#FFFFFF",
          "neutral": "#1E293B",
          "neutral-content": "#F8FAFC",
          "base-100": "#FFFFFF",
          "base-200": "#F8FAFC",
          "base-300": "#E2E8F0",
          "base-content": "#0F172A",
          "info": "#0EA5E9",
          "success": "#10B981",
          "warning": "#F59E0B",
          "error": "#EF4444",
        },
      },
    ],
    defaultTheme: "resort",
    logs: false,
  }
}

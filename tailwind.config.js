/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          950: '#eef2fb',
          900: '#ffffff',
          800: '#f0f5ff',
          700: '#d4e3f8',
          600: '#bdd0f0',
          500: '#8aaee0',
        },
        gold: {
          50:  '#eef4ff',
          100: '#dce8fd',
          200: '#b6cff7',
          300: '#6d9eeb',
          400: '#4a86e8',
          500: '#3a70cc',
          600: '#2d5aa8',
          700: '#1e3d80',
        },
        slate: {
          50: '#f8f9fc',
        }
      },
      boxShadow: {
        'gold': '0 0 0 1px rgba(74,134,232,0.25), 0 4px 24px rgba(74,134,232,0.10)',
        'card': '0 1px 3px rgba(74,134,232,0.08), 0 4px 16px rgba(74,134,232,0.06)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

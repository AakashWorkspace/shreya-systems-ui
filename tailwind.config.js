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
          950: '#0a0a0f',
          900: '#111118',
          800: '#1a1a24',
          700: '#252535',
          600: '#32324a',
          500: '#4a4a6a',
        },
        gold: {
          50:  '#fdf9ed',
          100: '#f9edcc',
          200: '#f2d98a',
          300: '#e8c048',
          400: '#d4a017',
          500: '#b8880f',
          600: '#9a6e0b',
          700: '#7a5508',
        },
        slate: {
          50: '#f8f9fc',
        }
      },
      boxShadow: {
        'gold': '0 0 0 1px rgba(212,160,23,0.3), 0 4px 24px rgba(212,160,23,0.1)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

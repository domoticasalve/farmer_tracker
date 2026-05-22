/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest:  '#1C3A0E',
        fern:    '#2D5016',
        sage: {
          DEFAULT: '#4A7C3F',
          50:  '#f0f7ee',
          100: '#dff0da',
          200: '#bde0b4',
          300: '#92c887',
          400: '#68ad5a',
          500: '#4A7C3F',
          600: '#3a6331',
          700: '#2D5016',
          800: '#234012',
          900: '#1C3A0E',
        },
        cream:     '#F7F3EC',
        parchment: '#EDE7D9',
        linen:     '#E2D9C8',
        earth:     '#8B5E3C',
        clay:      '#C4714A',
        water: {
          DEFAULT: '#4A8FA8',
          50:  '#edf5f8',
          100: '#d2e9f0',
          200: '#a6d3e1',
          300: '#72b8ce',
          400: '#4A8FA8',
          500: '#377a93',
          600: '#2a6278',
        },
        harvest:   '#D4840A',
        wheat:     '#E8C56A',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'sprout': 'sprout 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-up': 'fadeUp 0.3s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
      keyframes: {
        sprout: {
          '0%': { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      },
      boxShadow: {
        'card': '0 2px 12px rgba(28, 58, 14, 0.08)',
        'card-hover': '0 8px 24px rgba(28, 58, 14, 0.14)',
        'green': '0 4px 16px rgba(45, 80, 22, 0.25)',
      }
    },
  },
  plugins: [],
}

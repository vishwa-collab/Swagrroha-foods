/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff8f1',
          100: '#feeedb',
          200: '#fcd9b4',
          300: '#f9bd81',
          400: '#f59a4c',
          500: '#f27c24', // Primary orange (Swiggy / Swagrooha style)
          600: '#e36015',
          700: '#bc4714',
          800: '#953918',
          900: '#793117',
          950: '#41160a',
        },
        warmGold: '#FFD700',
        deepCharcoal: '#1A1A1A',
        cardBg: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      scale: {
        '108': '1.08',
        '112': '1.12',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      boxShadow: {
        'swiggy': '0 8px 30px rgba(0, 0, 0, 0.08)',
        'swiggy-hover': '0 20px 40px rgba(242, 124, 36, 0.18)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}

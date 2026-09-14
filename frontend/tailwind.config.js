// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#BFA06A",
          50: "#FBF8F2",
          100: "#F5EDD9",
          200: "#E8D9B5",
          300: "#D4C08A",
          400: "#BFA06A",
          500: "#A88B52",
          600: "#8C7341",
          700: "#6B5832",
          800: "#4A3D23",
          900: "#2A2420",
        },
        background: "#FBF8F2",
        ivory: "#FBF8F2",
        cream: "#F5EDD9",
        text: "#2A2420",
        muted: "#7A6E62",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
        lg: '16px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(42, 36, 32, 0.07), 0 1px 6px -2px rgba(42, 36, 32, 0.04)',
        'card': '0 4px 25px -5px rgba(42, 36, 32, 0.08), 0 2px 10px -5px rgba(42, 36, 32, 0.04)',
        'elevated': '0 10px 40px -10px rgba(42, 36, 32, 0.12), 0 4px 15px -5px rgba(42, 36, 32, 0.06)',
        'glow': '0 0 30px rgba(191, 160, 106, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

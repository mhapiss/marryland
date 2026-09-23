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
          DEFAULT: "#6B8F71",
          50: "#F0F5F1",
          100: "#D5E5D7",
          200: "#B3D1B7",
          300: "#8FB996",
          400: "#6B8F71",
          500: "#5A7D60",
          600: "#486B4E",
          700: "#375A3D",
          800: "#264A2C",
          900: "#1A3620",
        },
        background: "#F5F8F5",
        ivory: "#F0F5F1",
        cream: "#E0EDE2",
        text: "#1E2D21",
        muted: "#5E7262",
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
        'soft': '0 2px 15px -3px rgba(30, 45, 33, 0.07), 0 1px 6px -2px rgba(30, 45, 33, 0.04)',
        'card': '0 4px 25px -5px rgba(30, 45, 33, 0.08), 0 2px 10px -5px rgba(30, 45, 33, 0.04)',
        'elevated': '0 10px 40px -10px rgba(30, 45, 33, 0.12), 0 4px 15px -5px rgba(30, 45, 33, 0.06)',
        'glow': '0 0 30px rgba(107, 143, 113, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-reverse': 'floatReverse 7s ease-in-out infinite',
        'image-pan': 'imagePan 30s alternate infinite ease-in-out',
        'gradient-shift': 'gradientShift 15s ease infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 20s linear infinite',
        'carousel-scroll': 'carouselScroll 30s linear infinite',
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
        floatReverse: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(10px) rotate(3deg)' },
        },
        imagePan: {
          '0%': { transform: 'scale(1.05) translate(0, 0)' },
          '100%': { transform: 'scale(1.15) translate(-1%, -1%)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        carouselScroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      }
    },
  },
  plugins: [],
};

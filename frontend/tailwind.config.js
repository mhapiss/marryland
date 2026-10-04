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
        kertas: "var(--kertas)",
        "kertas-tua": "var(--kertas-tua)",
        tinta: "var(--tinta)",
        "tinta-lembut": "var(--tinta-lembut)",
        merah: "var(--merah)",
        "merah-hover": "var(--merah-hover)",
        marun: "var(--marun)",
        "merah-tanda": "var(--merah-tanda)",
        garis: "var(--garis)",
        primary: {
          DEFAULT: "var(--merah)",
          hover: "var(--merah-hover)",
          50: "#FBECEB",
          100: "#F5D7D5",
          200: "#EAB0AC",
          300: "#DF8882",
          400: "#D56159",
          500: "var(--merah)",
          600: "var(--merah-hover)",
          700: "var(--marun)",
          800: "#2A0B09",
          900: "#1A0605",
        },
        background: "var(--kertas)",
        ivory: "var(--kertas-tua)",
        cream: "var(--kertas-tua)",
        text: "var(--tinta)",
        muted: "var(--tinta-lembut)",
        sukses: "var(--sukses-teks)",
        "sukses-bg": "var(--sukses-bg)",
        "sukses-garis": "var(--sukses-garis)",
        peringatan: "var(--peringatan-teks)",
        "peringatan-bg": "var(--peringatan-bg)",
        "peringatan-garis": "var(--peringatan-garis)",
        error: "var(--error-teks)",
        "error-bg": "var(--error-bg)",
        "error-garis": "var(--error-garis)",
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-display)', 'Georgia', 'serif'],
      },
      borderRadius: {
        none: '0px',
        DEFAULT: '2px',
        sm: '2px',
        md: '2px',
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
        '3xl': '4px',
        full: '9999px',
      },
      boxShadow: {
        none: 'none',
        soft: 'none',
        card: 'none',
        elevated: '0 10px 40px -10px rgba(43, 24, 21, 0.25)',
        glow: 'none',
        dialog: '0 10px 40px -10px rgba(43, 24, 21, 0.25)',
        menu: '0 8px 30px -5px rgba(43, 24, 21, 0.2)',
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

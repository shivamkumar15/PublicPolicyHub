/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pph: {
          primary: '#2563EB',
          accent: '#F97316',
          success: '#10B981',
          background: '#F8FAFC',
          text: '#111827',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'Segoe UI', 'sans-serif'],
        display: ['Inter', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        rise: {
          '0%': {
            opacity: '0',
            transform: 'translateY(18px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-6px)',
          },
        },
        drift: {
          '0%, 100%': {
            transform: 'translateX(-8%)',
          },
          '50%': {
            transform: 'translateX(20%)',
          },
        },
        'pulse-soft': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(255,255,255,0.08)',
            transform: 'translate(-50%, -50%) scale(1)',
          },
          '50%': {
            boxShadow: '0 0 0 14px rgba(255,255,255,0)',
            transform: 'translate(-50%, -50%) scale(1.04)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '200% 0',
          },
          '100%': {
            backgroundPosition: '-200% 0',
          },
        },
      },
      animation: {
        rise: 'rise 0.55s ease-out',
        float: 'float 5s ease-in-out infinite',
        drift: 'drift 3.8s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
};

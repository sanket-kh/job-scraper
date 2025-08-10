/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'zoom-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '80%': { opacity: '1', transform: 'scale(1.05)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'bounce-once': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'fade-in-slow': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.7s cubic-bezier(0.4,0,0.2,1) both',
        'slide-up': 'slide-up 0.7s cubic-bezier(0.4,0,0.2,1) both',
        'zoom-in': 'zoom-in 0.5s cubic-bezier(0.4,0,0.2,1) both',
        'pop-in': 'pop-in 0.5s cubic-bezier(0.4,0,0.2,1) both',
        'bounce-once': 'bounce-once 0.7s cubic-bezier(0.4,0,0.2,1) 1',
        'gradient-x': 'gradient-x 3s ease-in-out infinite',
        'fade-in-slow': 'fade-in-slow 1.5s cubic-bezier(0.4,0,0.2,1) both',
        'pulse-slow': 'pulse-slow 2.5s cubic-bezier(0.4,0,0.2,1) infinite',
        'float': 'float 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

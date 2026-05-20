/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366F1',
          50: '#F0F0FF',
          100: '#E0E0FF',
          200: '#C4C4FF',
          300: '#A5A5FF',
          400: '#8585FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        surface: '#F8FAFC',
        'text-primary': '#0F172A',
        'text-secondary': '#64748B',
      },
    },
  },
  plugins: [],
};

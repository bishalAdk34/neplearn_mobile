/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: '#800816',
        cream: '#FBF9F4',
        ink: '#4A1942',
        accent: '#6366F1',
        line: '#E5D5D0',
      },
    },
  },
  plugins: [],
};

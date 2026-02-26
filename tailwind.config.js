/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        doodle: {
          bg: '#FFFDF9',
          accent: '#FFDE59',
          border: '#1A1A1A',
          blue: '#91D0FF',
          'blue-light': '#E6F3FF',
          pink: '#FF91AD',
          'pink-light': '#FFF0F5',
          green: '#F0FFF4',
          editor: '#F3F4F6',
        },
      },
      fontFamily: {
        gaegu: ['Gaegu'],
        'gaegu-bold': ['Gaegu-Bold'],
      },
    },
  },
  plugins: [],
};

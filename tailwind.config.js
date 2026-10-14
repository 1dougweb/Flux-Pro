/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#000000',
          card: '#0a0a0a',
          surface: '#121212',
          border: '#262626',
          hover: '#171717',
          muted: '#737373',
          text: '#f5f5f5',
        },
        light: {
          bg: '#fcfcfc',
          card: '#ffffff',
          surface: '#f4f4f5',
          border: '#e4e4e7',
          hover: '#f4f4f5',
          muted: '#71717a',
          text: '#09090b',
        }
      }
    },
  },
  plugins: [],
}

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
          red: '#DC2626',
          darkRed: '#991B1B',
          amber: '#F59E0B',
          dark: '#0e0e11',
          card: '#141418',
          input: '#1b1b22',
          border: '#27272a',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        heading: ['Raleway', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

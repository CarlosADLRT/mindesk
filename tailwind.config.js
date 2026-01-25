/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB', // Blue 600
        primaryDark: '#1D4ED8',
        secondary: '#DBEAFE', // Blue 100
        accent: '#F97316', // Orange 500
        neutral: '#1E293B', // Slate 800
        surface: '#FFFFFF',
        background: '#F8FAFC', // Slate 50
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px -10px rgba(0,0,0,0.08)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        glow: '0 0 20px rgba(37, 99, 235, 0.18)',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./components/settings/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'brand-primary': 'var(--brand-primary, #005A9C)',
        'brand-primary-darker': 'var(--brand-primary-darker, #004B8A)',
        'brand-secondary': '#FDB813',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
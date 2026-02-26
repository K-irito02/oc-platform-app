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
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        glass: {
          surface: 'rgba(255, 255, 255, var(--glass-opacity))',
          border: 'rgba(255, 255, 255, var(--glass-border-opacity))',
        }
      },
      fontFamily: {
        sans: ['var(--font-family-base)', 'Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        glass: 'var(--glass-blur)',
      }
    },
  },
  plugins: [],
}

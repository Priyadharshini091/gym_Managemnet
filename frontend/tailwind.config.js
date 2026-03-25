/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#0f172a',
        accent: '#facc15',
        slatewarm: '#f8fafc',
        ink: '#111827',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 20px 55px -28px rgba(15, 23, 42, 0.28)',
      },
    },
  },
  plugins: [],
};

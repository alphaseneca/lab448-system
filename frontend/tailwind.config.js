/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#050b14',
        'bg-secondary': '#0a1526',
        'panel': 'rgba(255, 255, 255, 0.06)',
        'accent-primary': '#00AEEF',
        'accent-secondary': '#0088CC',
        'accent-hover': '#33beec',
        'text-primary': '#f8fafc',
        'text-secondary': '#94a3b8',
        'muted': '#64748b',
        'success': '#10b981',
        'warning': '#f59e0b',
        'danger': '#ef4444',
      }
    },
  },
  plugins: [],
}

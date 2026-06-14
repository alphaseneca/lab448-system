/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#050b14',
        'secondary': '#0a1526',
        'surface': 'rgba(255, 255, 255, 0.04)',
        'surface-hover': 'rgba(255, 255, 255, 0.08)',
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
      },
      textColor: {
        'primary': '#f8fafc',
        'secondary': '#94a3b8',
        'muted': '#64748b',
      }
    },
  },
  plugins: [],
}

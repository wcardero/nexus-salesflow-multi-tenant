/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/Layout.tsx",
    "./views/AdminDashboard.tsx",
    "./views/GestorDashboard.tsx",
    "./views/Login.tsx",
    "./views/ManagerDashboard.tsx",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#137fec',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        surface: {
          light: '#ffffff',
          dark: '#1a2632',
          background: '#f6f7f8'
        }
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

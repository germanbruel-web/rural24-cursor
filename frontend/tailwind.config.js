/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ====================================================================
      // COLORES - Paleta agro optimizada
      // ====================================================================
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#16a135',
          600: '#138a2c',
          700: '#0f7023',
          800: '#0c5a1c',
          900: '#094515',
        },
        secondary: {
          50: '#fef3c7',
          100: '#fde68a',
          200: '#fcd34d',
          300: '#fbbf24',
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        },
        success: '#16a135',
        warning: '#f59e0b',
        error: '#dc2626',
        info: '#3b82f6',
      },
      
      // ====================================================================
      // TIPOGRAFÍA
      // ====================================================================
      fontFamily: {
        heading: ['Raleway', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
        raleway: ['Raleway', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        sans: ['Roboto', 'sans-serif'],
      },
      
      // ====================================================================
      // ESPACIADO CUSTOM
      // ====================================================================
      spacing: {
        'mobile-safe': '1rem',
        'mobile-comfort': '1.25rem',
        'tablet-safe': '1.5rem',
        'desktop-safe': '2rem',
      },
      
      // ====================================================================
      // SOMBRAS PERSONALIZADAS
      // ====================================================================
      boxShadow: {
        'green': '0 4px 14px 0 rgba(22, 161, 53, 0.25)',
        'amber': '0 4px 14px 0 rgba(245, 158, 11, 0.25)',
      },
      
      // ====================================================================
      // ANIMACIONES
      // ====================================================================
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      
      // ====================================================================
      // Z-INDEX SYSTEM
      // ====================================================================
      zIndex: {
        'dropdown': '10',
        'sticky': '20',
        'fixed': '30',
        'modal-backdrop': '40',
        'modal': '50',
        'popover': '60',
        'tooltip': '70',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
  ],
  // ====================================================================
  // DARK MODE - Estrategia de clase
  // ====================================================================
  darkMode: 'class',
  
  theme: {
    extend: {
      // ====================================================================
      // COLORES SEMÁNTICOS - Sistema profesional con variables CSS
      // ====================================================================
      colors: {
        // Brand Principal (Verde Agro)
        brand: {
          50: 'rgb(var(--color-brand-50) / <alpha-value>)',
          100: 'rgb(var(--color-brand-100) / <alpha-value>)',
          200: 'rgb(var(--color-brand-200) / <alpha-value>)',
          300: 'rgb(var(--color-brand-300) / <alpha-value>)',
          400: 'rgb(var(--color-brand-400) / <alpha-value>)',
          500: 'rgb(var(--color-brand-500) / <alpha-value>)',
          600: 'rgb(var(--color-brand-600) / <alpha-value>)',
          700: 'rgb(var(--color-brand-700) / <alpha-value>)',
          800: 'rgb(var(--color-brand-800) / <alpha-value>)',
          900: 'rgb(var(--color-brand-900) / <alpha-value>)',
          950: 'rgb(var(--color-brand-950) / <alpha-value>)',
        },
        // Secundario (Tierra/Amber)
        secondary: {
          50: 'rgb(var(--color-secondary-50) / <alpha-value>)',
          100: 'rgb(var(--color-secondary-100) / <alpha-value>)',
          200: 'rgb(var(--color-secondary-200) / <alpha-value>)',
          300: 'rgb(var(--color-secondary-300) / <alpha-value>)',
          400: 'rgb(var(--color-secondary-400) / <alpha-value>)',
          500: 'rgb(var(--color-secondary-500) / <alpha-value>)',
          600: 'rgb(var(--color-secondary-600) / <alpha-value>)',
          700: 'rgb(var(--color-secondary-700) / <alpha-value>)',
          800: 'rgb(var(--color-secondary-800) / <alpha-value>)',
          900: 'rgb(var(--color-secondary-900) / <alpha-value>)',
          950: 'rgb(var(--color-secondary-950) / <alpha-value>)',
        },
        // Nature — Colores Secundarios (Agricultura & Naturaleza)
        nature: {
          mint: 'rgb(var(--color-nature-mint) / <alpha-value>)',
          lime: 'rgb(var(--color-nature-lime) / <alpha-value>)',
          crop: 'rgb(var(--color-nature-crop) / <alpha-value>)',
          meadow: 'rgb(var(--color-nature-meadow) / <alpha-value>)',
          leaf: 'rgb(var(--color-nature-leaf) / <alpha-value>)',
          moss: 'rgb(var(--color-nature-moss) / <alpha-value>)',
          canopy: 'rgb(var(--color-nature-canopy) / <alpha-value>)',
          evergreen: 'rgb(var(--color-nature-evergreen) / <alpha-value>)',
          air: 'rgb(var(--color-nature-air) / <alpha-value>)',
          wheat: 'rgb(var(--color-nature-wheat) / <alpha-value>)',
          corn: 'rgb(var(--color-nature-corn) / <alpha-value>)',
          harvest: 'rgb(var(--color-nature-harvest) / <alpha-value>)',
          sky: 'rgb(var(--color-nature-sky) / <alpha-value>)',
          daylight: 'rgb(var(--color-nature-daylight) / <alpha-value>)',
          water: 'rgb(var(--color-nature-water) / <alpha-value>)',
          teal: 'rgb(var(--color-nature-teal) / <alpha-value>)',
          gray: 'rgb(var(--color-nature-gray) / <alpha-value>)',
          clay: 'rgb(var(--color-nature-clay) / <alpha-value>)',
          stem: 'rgb(var(--color-nature-stem) / <alpha-value>)',
          soil: 'rgb(var(--color-nature-soil) / <alpha-value>)',
          barn: 'rgb(var(--color-nature-barn) / <alpha-value>)',
          brick: 'rgb(var(--color-nature-brick) / <alpha-value>)',
          farm: 'rgb(var(--color-nature-farm) / <alpha-value>)',
          compost: 'rgb(var(--color-nature-compost) / <alpha-value>)',
        },
        // Accent (Azul)
        accent: {
          50: 'rgb(var(--color-accent-50) / <alpha-value>)',
          100: 'rgb(var(--color-accent-100) / <alpha-value>)',
          200: 'rgb(var(--color-accent-200) / <alpha-value>)',
          300: 'rgb(var(--color-accent-300) / <alpha-value>)',
          400: 'rgb(var(--color-accent-400) / <alpha-value>)',
          500: 'rgb(var(--color-accent-500) / <alpha-value>)',
          600: 'rgb(var(--color-accent-600) / <alpha-value>)',
          700: 'rgb(var(--color-accent-700) / <alpha-value>)',
          800: 'rgb(var(--color-accent-800) / <alpha-value>)',
          900: 'rgb(var(--color-accent-900) / <alpha-value>)',
          950: 'rgb(var(--color-accent-950) / <alpha-value>)',
        },
        // Estados
        success: {
          50: 'rgb(var(--color-success-50) / <alpha-value>)',
          100: 'rgb(var(--color-success-100) / <alpha-value>)',
          500: 'rgb(var(--color-success-500) / <alpha-value>)',
          600: 'rgb(var(--color-success-600) / <alpha-value>)',
          700: 'rgb(var(--color-success-700) / <alpha-value>)',
        },
        warning: {
          50: 'rgb(var(--color-warning-50) / <alpha-value>)',
          100: 'rgb(var(--color-warning-100) / <alpha-value>)',
          500: 'rgb(var(--color-warning-500) / <alpha-value>)',
          600: 'rgb(var(--color-warning-600) / <alpha-value>)',
          700: 'rgb(var(--color-warning-700) / <alpha-value>)',
        },
        error: {
          50: 'rgb(var(--color-error-50) / <alpha-value>)',
          100: 'rgb(var(--color-error-100) / <alpha-value>)',
          500: 'rgb(var(--color-error-500) / <alpha-value>)',
          600: 'rgb(var(--color-error-600) / <alpha-value>)',
          700: 'rgb(var(--color-error-700) / <alpha-value>)',
        },
        info: {
          50: 'rgb(var(--color-info-50) / <alpha-value>)',
          100: 'rgb(var(--color-info-100) / <alpha-value>)',
          500: 'rgb(var(--color-info-500) / <alpha-value>)',
          600: 'rgb(var(--color-info-600) / <alpha-value>)',
          700: 'rgb(var(--color-info-700) / <alpha-value>)',
        },
        // Neutros con soporte dark mode
        neutral: {
          50: 'rgb(var(--color-neutral-50) / <alpha-value>)',
          100: 'rgb(var(--color-neutral-100) / <alpha-value>)',
          200: 'rgb(var(--color-neutral-200) / <alpha-value>)',
          300: 'rgb(var(--color-neutral-300) / <alpha-value>)',
          400: 'rgb(var(--color-neutral-400) / <alpha-value>)',
          500: 'rgb(var(--color-neutral-500) / <alpha-value>)',
          600: 'rgb(var(--color-neutral-600) / <alpha-value>)',
          700: 'rgb(var(--color-neutral-700) / <alpha-value>)',
          800: 'rgb(var(--color-neutral-800) / <alpha-value>)',
          900: 'rgb(var(--color-neutral-900) / <alpha-value>)',
          950: 'rgb(var(--color-neutral-950) / <alpha-value>)',
        },
        // Alias para compatibilidad
        primary: {
          50: 'rgb(var(--color-brand-50) / <alpha-value>)',
          100: 'rgb(var(--color-brand-100) / <alpha-value>)',
          200: 'rgb(var(--color-brand-200) / <alpha-value>)',
          300: 'rgb(var(--color-brand-300) / <alpha-value>)',
          400: 'rgb(var(--color-brand-400) / <alpha-value>)',
          500: 'rgb(var(--color-brand-500) / <alpha-value>)',
          600: 'rgb(var(--color-brand-600) / <alpha-value>)',
          700: 'rgb(var(--color-brand-700) / <alpha-value>)',
          800: 'rgb(var(--color-brand-800) / <alpha-value>)',
          900: 'rgb(var(--color-brand-900) / <alpha-value>)',
        },
      },
      
      // ====================================================================
      // TIPOGRAFÍA PROFESIONAL - Jerarquía Clara
      // ====================================================================
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'Raleway', 'system-ui', 'sans-serif'],
        body: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],      // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],  // 14px
        base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],          // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }], // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],  // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],   // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],   // 36px
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.03em' }],           // 48px
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.03em' }],        // 60px
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.04em' }],         // 72px
      },
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      
      // ====================================================================
      // BORDER RADIUS - Soft UI Style
      // ====================================================================
      borderRadius: {
        none: '0',
        sm: '0.25rem',      // 4px
        DEFAULT: '0.5rem',  // 8px
        md: '0.625rem',     // 10px
        lg: '0.75rem',      // 12px
        xl: '1rem',         // 16px
        '2xl': '1.25rem',   // 20px
        '3xl': '1.5rem',    // 24px
        '4xl': '2rem',      // 32px
        full: '9999px',
      },
      
      // ====================================================================
      // SOMBRAS CON PROFUNDIDAD - Soft Shadows
      // ====================================================================
      boxShadow: {
        // Sombras estándar
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        md: '0 6px 12px -2px rgb(0 0 0 / 0.10), 0 3px 7px -3px rgb(0 0 0 / 0.10)',
        lg: '0 10px 24px -3px rgb(0 0 0 / 0.12), 0 4px 10px -4px rgb(0 0 0 / 0.12)',
        xl: '0 20px 32px -5px rgb(0 0 0 / 0.15), 0 8px 14px -6px rgb(0 0 0 / 0.15)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.20)',
        // Sombras de color
        'brand': '0 4px 14px 0 rgb(var(--color-brand-600) / 0.25)',
        'brand-lg': '0 10px 24px -3px rgb(var(--color-brand-600) / 0.30)',
        'secondary': '0 4px 14px 0 rgb(var(--color-secondary-600) / 0.25)',
        'accent': '0 4px 14px 0 rgb(var(--color-accent-600) / 0.25)',
        // Sombras internas
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.04)',
        'inner-lg': 'inset 0 4px 8px 0 rgb(0 0 0 / 0.06)',
        none: 'none',
      },
      
      // ====================================================================
      // ESPACIADO PERSONALIZADO
      // ====================================================================
      spacing: {
        18: '4.5rem',   // 72px
        88: '22rem',    // 352px
        128: '32rem',   // 512px
        144: '36rem',   // 576px
        // Espaciado semántico
        'mobile-safe': '1rem',
        'mobile-comfort': '1.25rem',
        'tablet-safe': '1.5rem',
        'desktop-safe': '2rem',
      },
      
      // ====================================================================
      // ANIMACIONES PROFESIONALES
      // ====================================================================
      animation: {
        // Básicas
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'slide-in-down': 'slideInDown 0.3s ease-out',
        // Interacciones
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // Loading
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      
      // ====================================================================
      // Z-INDEX SYSTEM
      // ====================================================================
      zIndex: {
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        dropdown: '10',
        sticky: '20',
        fixed: '30',
        'modal-backdrop': '40',
        modal: '50',
        popover: '60',
        tooltip: '70',
        max: '9999',
      },
      
      // ====================================================================
      // TRANSICIONES
      // ====================================================================
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
        slower: '500ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

// ====================================================================
// DESIGN TOKENS - Sistema de diseño AgroBuscador
// Mobile-first, accesibilidad y performance
// ====================================================================

export const tokens = {
  // ====================================================================
  // COLORES - Paleta agro con semántica clara
  // ====================================================================
  colors: {
    // Brand primario (verde agro)
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#16a135',  // ← Principal
      600: '#138a2c',
      700: '#0f7023',
      800: '#0c5a1c',
      900: '#094515',
    },
    
    // Secundario (tierra/marrón)
    secondary: {
      50: '#fef3c7',
      100: '#fde68a',
      200: '#fcd34d',
      300: '#fbbf24',
      400: '#f59e0b',  // ← Accent
      500: '#d97706',
      600: '#b45309',
      700: '#92400e',
      800: '#78350f',
      900: '#451a03',
    },
    
    // Estados
    success: '#16a135',
    warning: '#f59e0b',
    error: '#dc2626',
    info: '#3b82f6',
    
    // Neutrales
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  
  // ====================================================================
  // ESPACIADO - Mobile-first progressive
  // ====================================================================
  spacing: {
    // Safe areas para mobile
    mobileSafe: '1rem',      // 16px - Mínimo toque iOS/Android
    mobileComfort: '1.25rem', // 20px - Comfortable tap
    tabletSafe: '1.5rem',     // 24px
    desktopSafe: '2rem',      // 32px
    
    // Container responsive
    container: {
      mobile: '1rem',   // 16px padding
      tablet: '1.5rem', // 24px padding
      desktop: '2rem',  // 32px padding
    },
    
    // Stack spacing (vertical rhythm)
    stack: {
      xs: '0.5rem',   // 8px
      sm: '0.75rem',  // 12px
      md: '1rem',     // 16px
      lg: '1.5rem',   // 24px
      xl: '2rem',     // 32px
      '2xl': '3rem',  // 48px
    },
  },
  
  // ====================================================================
  // TIPOGRAFÍA - Legibilidad mobile
  // ====================================================================
  typography: {
    fonts: {
      heading: "'Raleway', sans-serif",
      body: "'Roboto', sans-serif",
    },
    
    // Scale mobile-optimizada
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],     // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],    // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],   // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
    },
    
    // Pesos semánticos
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  // ====================================================================
  // BORDES Y RADIOS
  // ====================================================================
  borders: {
    width: {
      thin: '1px',
      default: '2px',
      thick: '3px',
    },
    radius: {
      sm: '0.375rem',  // 6px
      md: '0.5rem',    // 8px
      lg: '0.75rem',   // 12px
      xl: '1rem',      // 16px
      '2xl': '1.5rem', // 24px
      full: '9999px',
    },
  },
  
  // ====================================================================
  // SOMBRAS - Elevación progresiva
  // ====================================================================
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    green: '0 4px 14px 0 rgba(22, 161, 53, 0.25)',  // Shadow verde brand
    amber: '0 4px 14px 0 rgba(245, 158, 11, 0.25)', // Shadow amber accent
  },
  
  // ====================================================================
  // TRANSICIONES - Performance optimizada
  // ====================================================================
  transitions: {
    duration: {
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
    },
    timing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // ====================================================================
  // BREAKPOINTS - Mobile-first
  // ====================================================================
  breakpoints: {
    sm: '640px',   // Phones landscape
    md: '768px',   // Tablets
    lg: '1024px',  // Laptops
    xl: '1280px',  // Desktops
    '2xl': '1536px', // Large screens
  },
  
  // ====================================================================
  // Z-INDEX - Stack context claro
  // ====================================================================
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
  },
} as const;

// ====================================================================
// UTILIDADES - Helpers para componentes
// ====================================================================

export const utils = {
  // Container responsive
  container: "w-full max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8",
  
  // Stacks (layouts verticales/horizontales)
  stackVertical: "flex flex-col gap-4 lg:gap-6",
  stackHorizontal: "flex flex-row gap-4 lg:gap-6",
  
  // Cards comunes
  card: "bg-white rounded-xl border-2 border-gray-200 p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow",
  cardInteractive: "bg-white rounded-xl border-2 border-gray-200 p-4 lg:p-6 shadow-sm hover:shadow-lg hover:border-primary-500 transition-all cursor-pointer",
  
  // Inputs base
  input: "w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all",
  inputError: "w-full px-4 py-3 border-2 border-error rounded-lg focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent transition-all",
  
  // Estados de loading
  spinner: "inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin",
  skeleton: "animate-pulse bg-gray-200 rounded",
  
  // Badges
  badge: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
  
  // Gradientes brand
  gradientPrimary: "bg-gradient-to-r from-primary-500 to-primary-600",
  gradientSecondary: "bg-gradient-to-r from-secondary-400 to-secondary-500",
  gradientBackground: "bg-gradient-to-br from-gray-50 to-gray-100",
} as const;

// ====================================================================
// RESPONSIVE HELPERS
// ====================================================================

export const responsive = {
  // Visibilidad por breakpoint
  mobileOnly: "block md:hidden",
  tabletUp: "hidden md:block",
  desktopUp: "hidden lg:block",
  
  // Grids responsive
  grid2: "grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6",
  grid3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6",
  grid4: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6",
  
  // Text alignment
  textCenterMobile: "text-center md:text-left",
  
  // Padding progressive
  paddingResponsive: "px-4 md:px-6 lg:px-8",
  paddingYResponsive: "py-4 md:py-6 lg:py-8",
} as const;

export type Tokens = typeof tokens;
export type Utils = typeof utils;
export type Responsive = typeof responsive;

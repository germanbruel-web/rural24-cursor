/**
 * BaseLayout - Layout Base Mobile First
 * 
 * Layout fundamental del proyecto que usa el Design System Rural24.
 * Proporciona estructura consistente para todas las páginas:
 * - Header sticky
 * - Contenido principal con container responsive
 * - Footer
 * - Soporte para dark mode
 * 
 * @example
 * ```tsx
 * <BaseLayout>
 *   <h1>Mi Página</h1>
 *   <p>Contenido...</p>
 * </BaseLayout>
 * ```
 */

import React from 'react';
import { Header } from '../Header';
import { Footer } from '../Footer';

interface BaseLayoutProps {
  /** Contenido de la página */
  children: React.ReactNode;
  
  /** Función de navegación heredada del App.tsx */
  onNavigate: (page: any) => void;
  
  /** Padding personalizado del contenedor (por defecto: 'default') */
  padding?: 'none' | 'sm' | 'default' | 'lg';
  
  /** Ancho máximo del contenedor (por defecto: '7xl') */
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl' | '4xl';
  
  /** Mostrar header (por defecto: true) */
  showHeader?: boolean;
  
  /** Mostrar footer (por defecto: true) */
  showFooter?: boolean;
  
  /** Clase adicional para el contenedor principal */
  containerClassName?: string;
  
  /** Color de fondo de la página */
  backgroundColor?: 'white' | 'gray' | 'transparent';
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  onNavigate,
  padding = 'default',
  maxWidth = '7xl',
  showHeader = true,
  showFooter = true,
  containerClassName = '',
  backgroundColor = 'gray',
}) => {
  // Mapear padding a clases Tailwind (Mobile First)
  const paddingClasses = {
    none: '',
    sm: 'px-3 py-3 sm:px-4 sm:py-4',
    default: 'px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12',
    lg: 'px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16',
  };

  // Mapear maxWidth a clases Tailwind
  const maxWidthClasses = {
    full: 'max-w-full',
    '7xl': 'max-w-[1400px]',
    '6xl': 'max-w-6xl',
    '5xl': 'max-w-5xl',
    '4xl': 'max-w-4xl',
  };

  // Mapear backgroundColor a clases Tailwind
  const bgClasses = {
    white: 'bg-white dark:bg-gray-900',
    gray: 'bg-gray-50 dark:bg-gray-900',
    transparent: 'bg-transparent',
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Sticky */}
      {showHeader && <Header onNavigate={onNavigate} />}

      {/* Contenido Principal */}
      <main className={`flex-1 ${bgClasses[backgroundColor]}`}>
        <div 
          className={`
            ${maxWidthClasses[maxWidth]} 
            ${paddingClasses[padding]} 
            mx-auto 
            w-full
            ${containerClassName}
          `}
        >
          {children}
        </div>
      </main>

      {/* Footer */}
      {showFooter && <Footer onCategoryClick={() => {}} />}
    </div>
  );
};

/**
 * Variante sin padding para páginas que necesitan control total
 */
export const BaseLayoutNoPadding: React.FC<Omit<BaseLayoutProps, 'padding'>> = (props) => (
  <BaseLayout {...props} padding="none" />
);

/**
 * Variante full width para páginas que ocupan todo el ancho
 */
export const BaseLayoutFullWidth: React.FC<Omit<BaseLayoutProps, 'maxWidth'>> = (props) => (
  <BaseLayout {...props} maxWidth="full" />
);

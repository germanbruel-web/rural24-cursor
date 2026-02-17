/**
 * Button Atom - Componente de botón base del Design System
 * Implementa variantes, tamaños y estados usando CVA
 */

import React, { forwardRef } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../../../design-system/utils';
import { Loader2 } from 'lucide-react';

/**
 * Variantes del botón usando CVA (Class Variance Authority)
 */
const buttonVariants = cva(
  // Estilos base compartidos por todas las variantes
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'rounded-lg',
  ],
  {
    variants: {
      /**
       * Variantes de estilo
       */
      variant: {
        primary: [
          'bg-primary-600 text-white',
          'hover:bg-primary-700',
          'active:bg-primary-800',
          'focus-visible:ring-primary-500',
          'shadow-sm hover:shadow-md',
        ],
        secondary: [
          'bg-gray-100 text-gray-900',
          'hover:bg-gray-200',
          'active:bg-gray-300',
          'focus-visible:ring-gray-400',
        ],
        outline: [
          'border-2 border-primary-600 text-primary-600',
          'hover:bg-primary-50',
          'active:bg-primary-100',
          'focus-visible:ring-primary-500',
        ],
        ghost: [
          'text-gray-700',
          'hover:bg-gray-100',
          'active:bg-gray-200',
          'focus-visible:ring-gray-400',
        ],
        danger: [
          'bg-red-600 text-white',
          'hover:bg-red-700',
          'active:bg-red-800',
          'focus-visible:ring-red-500',
          'shadow-sm hover:shadow-md',
        ],
        success: [
          'bg-brand-600 text-white',
          'hover:bg-brand-500',
          'active:bg-brand-700',
          'focus-visible:ring-brand-400',
          'shadow-sm hover:shadow-md',
        ],
        link: [
          'text-primary-600 underline-offset-4',
          'hover:underline',
          'focus-visible:ring-primary-500',
          'p-0',
        ],
      },
      /**
       * Tamaños del botón
       */
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        xl: 'h-14 px-8 text-xl',
        icon: 'h-10 w-10 p-0',
      },
      /**
       * Ancho completo
       */
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

/**
 * Propiedades del componente Button
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Estado de carga del botón
   * Muestra un spinner y deshabilita la interacción
   */
  loading?: boolean;
  
  /**
   * Contenido del botón
   */
  children?: React.ReactNode;
  
  /**
   * Icono a la izquierda del texto
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Icono a la derecha del texto
   */
  rightIcon?: React.ReactNode;
  
  /**
   * Texto alternativo para accesibilidad
   */
  'aria-label'?: string;
}

/**
 * Componente Button
 * Botón accesible y configurable con variantes y estados
 * 
 * @example
 * ```tsx
 * // Botón primario básico
 * <Button>Guardar</Button>
 * 
 * // Botón secundario con loading
 * <Button variant="secondary" loading>
 *   Cargando...
 * </Button>
 * 
 * // Botón con iconos
 * <Button leftIcon={<Save />} rightIcon={<ArrowRight />}>
 *   Guardar y Continuar
 * </Button>
 * 
 * // Botón peligroso deshabilitado
 * <Button variant="danger" disabled>
 *   Eliminar
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      disabled = false,
      children,
      leftIcon,
      rightIcon,
      type = 'button',
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-busy={loading}
        aria-disabled={isDisabled}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        {...props}
      >
        {loading && (
          <Loader2 
            className="animate-spin" 
            size={size === 'sm' ? 14 : size === 'lg' ? 20 : size === 'xl' ? 24 : 16}
            aria-hidden="true"
          />
        )}
        
        {!loading && leftIcon && (
          <span className="inline-flex" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        {children && <span>{children}</span>}
        
        {!loading && rightIcon && (
          <span className="inline-flex" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };
export default Button;

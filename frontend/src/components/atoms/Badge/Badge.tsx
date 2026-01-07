/**
 * Badge Atom Component
 * Indicador visual compacto para estados, categorías y notificaciones
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../design-system/utils';
import { X } from 'lucide-react';

const badgeVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 border border-brand-200 dark:border-brand-800',
        secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-800',
        success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300 border border-success-200 dark:border-success-800',
        warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300 border border-warning-200 dark:border-warning-800',
        danger: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300 border border-danger-200 dark:border-danger-800',
        neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700',
        outline: 'bg-transparent text-neutral-700 dark:text-neutral-300 border-2 border-neutral-300 dark:border-neutral-600',
      },
      size: {
        sm: 'text-xs px-2 py-0.5 rounded-md gap-1',
        md: 'text-sm px-2.5 py-1 rounded-lg gap-1.5',
        lg: 'text-base px-3 py-1.5 rounded-lg gap-2',
      },
      dot: {
        true: 'pl-1.5',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
      dot: false,
    },
  }
);

const dotVariants = cva('rounded-full', {
  variants: {
    variant: {
      primary: 'bg-brand-500',
      secondary: 'bg-secondary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      danger: 'bg-danger-500',
      neutral: 'bg-neutral-500',
      outline: 'bg-neutral-500',
    },
    size: {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5',
    },
  },
  defaultVariants: {
    variant: 'neutral',
    size: 'md',
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Mostrar dot de estado a la izquierda */
  dot?: boolean;
  /** Icono a la izquierda del texto */
  leftIcon?: React.ReactNode;
  /** Icono a la derecha del texto */
  rightIcon?: React.ReactNode;
  /** Hacer el badge removible (muestra X) */
  removable?: boolean;
  /** Callback cuando se remueve */
  onRemove?: () => void;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      dot,
      leftIcon,
      rightIcon,
      removable,
      onRemove,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, dot }), className)}
        {...props}
      >
        {/* Dot indicator */}
        {dot && <span className={dotVariants({ variant, size })} />}
        
        {/* Left Icon */}
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        
        {/* Content */}
        {children && <span>{children}</span>}
        
        {/* Right Icon */}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        
        {/* Remove button */}
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-full"
            aria-label="Remove badge"
          >
            <X size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

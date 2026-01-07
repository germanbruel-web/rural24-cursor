/**
 * Input Atom Component
 * Componente de entrada de texto flexible con validación y estados
 */

import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../design-system/utils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const inputVariants = cva(
  // Base styles
  'flex w-full rounded-lg border font-body text-base transition-all duration-200 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        outlined: 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
        filled: 'bg-neutral-100 dark:bg-neutral-800 border-transparent focus:bg-white dark:focus:bg-neutral-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
        ghost: 'bg-transparent border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-800 focus:border-brand-500',
      },
      size: {
        sm: 'h-9 px-3 py-1.5 text-sm',
        md: 'h-10 px-4 py-2 text-base',
        lg: 'h-12 px-5 py-3 text-lg',
      },
      status: {
        default: '',
        error: 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20 dark:border-danger-400',
        success: 'border-success-500 focus:border-success-500 focus:ring-success-500/20 dark:border-success-400',
      },
    },
    defaultVariants: {
      variant: 'outlined',
      size: 'md',
      status: 'default',
    },
  }
);

const iconWrapperVariants = cva('absolute top-1/2 -translate-y-1/2 flex items-center pointer-events-none', {
  variants: {
    position: {
      left: 'left-3',
      right: 'right-3',
    },
    size: {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Icono a la izquierda del input */
  leftIcon?: React.ReactNode;
  /** Icono a la derecha del input */
  rightIcon?: React.ReactNode;
  /** Texto de ayuda debajo del input */
  helperText?: string;
  /** Mensaje de error (automáticamente pone status="error") */
  error?: string;
  /** Mensaje de éxito (automáticamente pone status="success") */
  success?: string;
  /** Wrapper className para contenedor completo */
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      status,
      leftIcon,
      rightIcon,
      helperText,
      error,
      success,
      wrapperClassName,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    // Determinar status automáticamente basado en error/success
    const computedStatus = error ? 'error' : success ? 'success' : status;

    // Generar ID único si no se provee (para accesibilidad)
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const helperTextId = helperText || error || success ? `${inputId}-helper` : undefined;

    // Calcular padding dinámico basado en iconos
    const paddingClass = cn(
      leftIcon && (size === 'sm' ? 'pl-9' : size === 'lg' ? 'pl-12' : 'pl-10'),
      (rightIcon || computedStatus === 'error' || computedStatus === 'success') &&
        (size === 'sm' ? 'pr-9' : size === 'lg' ? 'pr-12' : 'pr-10')
    );

    // Icono de status automático
    const statusIcon = computedStatus === 'error' 
      ? <AlertCircle className="text-danger-500" />
      : computedStatus === 'success'
      ? <CheckCircle2 className="text-success-500" />
      : null;

    return (
      <div className={cn('w-full', wrapperClassName)}>
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className={iconWrapperVariants({ position: 'left', size })}>
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(inputVariants({ variant, size, status: computedStatus }), paddingClass, className)}
            aria-invalid={computedStatus === 'error' ? 'true' : 'false'}
            aria-describedby={helperTextId}
            {...props}
          />

          {/* Right Icon or Status Icon */}
          {(rightIcon || statusIcon) && (
            <div className={iconWrapperVariants({ position: 'right', size })}>
              {statusIcon || rightIcon}
            </div>
          )}
        </div>

        {/* Helper Text / Error / Success Message */}
        {(helperText || error || success) && (
          <p
            id={helperTextId}
            className={cn(
              'mt-1.5 text-sm transition-colors duration-200',
              error && 'text-danger-600 dark:text-danger-400',
              success && 'text-success-600 dark:text-success-400',
              !error && !success && 'text-neutral-600 dark:text-neutral-400'
            )}
          >
            {error || success || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

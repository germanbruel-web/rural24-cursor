/**
 * Switch Atom - Componente de switch toggle del Design System
 * Implementa variantes, tamaños y estados usando CVA
 */

import React, { forwardRef } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../../../design-system/utils';

const switchVariants = cva(
  [
    'peer inline-flex shrink-0 cursor-pointer items-center rounded-full',
    'border-2 border-transparent transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'bg-gray-200',
  ],
  {
    variants: {
      variant: {
        primary: [
          'data-[state=checked]:bg-primary-600',
          'focus-visible:ring-primary-500',
        ],
        secondary: [
          'data-[state=checked]:bg-gray-600',
          'focus-visible:ring-gray-400',
        ],
      },
      size: {
        sm: 'h-4 w-7',
        md: 'h-5 w-9',
        lg: 'h-6 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

const switchThumbVariants = cva(
  [
    'pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform',
  ],
  {
    variants: {
      size: {
        sm: 'h-3 w-3 data-[state=checked]:translate-x-3',
        md: 'h-4 w-4 data-[state=checked]:translate-x-4',
        lg: 'h-5 w-5 data-[state=checked]:translate-x-5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof switchVariants> {
  label?: string;
  helperText?: string;
  error?: boolean;
  errorMessage?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      variant,
      size,
      label,
      helperText,
      error,
      errorMessage,
      disabled,
      checked,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <label
            htmlFor={inputId}
            className={cn(
              'relative inline-flex items-center',
              disabled && 'cursor-not-allowed'
            )}
          >
            <input
              type="checkbox"
              ref={ref}
              id={inputId}
              disabled={disabled}
              checked={checked}
              className="sr-only peer"
              {...props}
            />
            <div
              className={cn(
                switchVariants({ variant, size }),
                'peer-checked:bg-primary-600',
                error && 'ring-2 ring-red-500',
                className
              )}
            >
              <span
                className={cn(
                  switchThumbVariants({ size }),
                  checked && 'translate-x-4'
                )}
                data-state={checked ? 'checked' : 'unchecked'}
              />
            </div>
          </label>
          
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                'text-sm font-medium text-gray-700 cursor-pointer select-none',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {label}
            </label>
          )}
        </div>

        {helperText && !error && (
          <p className="text-xs text-gray-500 ml-12">{helperText}</p>
        )}

        {error && errorMessage && (
          <p className="text-xs text-red-600 ml-12">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export { switchVariants };
export default Switch;

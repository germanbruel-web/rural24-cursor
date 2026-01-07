/**
 * Radio Atom - Componente de radio button del Design System
 * Implementa variantes, tamaños y estados usando CVA
 */

import React, { forwardRef } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../../../design-system/utils';

const radioVariants = cva(
  [
    'peer h-4 w-4 shrink-0 rounded-full border border-gray-300',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        primary: [
          'border-primary-600',
          'checked:border-primary-600 checked:border-[5px]',
          'focus-visible:ring-primary-500',
        ],
        secondary: [
          'border-gray-400',
          'checked:border-gray-600 checked:border-[5px]',
          'focus-visible:ring-gray-400',
        ],
      },
      size: {
        sm: 'h-3 w-3 checked:border-[4px]',
        md: 'h-4 w-4 checked:border-[5px]',
        lg: 'h-5 w-5 checked:border-[6px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof radioVariants> {
  label?: string;
  helperText?: string;
  error?: boolean;
  errorMessage?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
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
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            type="radio"
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              radioVariants({ variant, size }),
              'cursor-pointer appearance-none',
              error && 'border-red-500',
              className
            )}
            {...props}
          />
          
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
          <p className="text-xs text-gray-500 ml-6">{helperText}</p>
        )}

        {error && errorMessage && (
          <p className="text-xs text-red-600 ml-6">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export { radioVariants };
export default Radio;

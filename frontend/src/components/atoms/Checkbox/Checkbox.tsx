/**
 * Checkbox Atom - Componente de checkbox del Design System
 * Implementa variantes, tamaños y estados usando CVA
 */

import React, { forwardRef } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../../../design-system/utils';
import { Check } from 'lucide-react';

const checkboxVariants = cva(
  [
    'peer h-4 w-4 shrink-0 rounded-sm border border-gray-300',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'transition-all duration-200',
    'cursor-pointer appearance-none',
  ],
  {
    variants: {
      variant: {
        primary: [
          'border-gray-300',
          'checked:bg-[#16a135] checked:border-[#16a135]',
          'hover:border-[#16a135]',
          'focus-visible:ring-green-500',
        ],
        secondary: [
          'border-gray-300',
          'checked:bg-gray-600 checked:border-gray-600',
          'hover:border-gray-400',
          'focus-visible:ring-gray-400',
        ],
      },
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof checkboxVariants> {
  label?: string;
  helperText?: string;
  error?: boolean;
  errorMessage?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
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
    const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="relative inline-flex items-center">
            <input
              type="checkbox"
              ref={ref}
              id={inputId}
              disabled={disabled}
              className={cn(
                checkboxVariants({ variant, size }),
                error && 'border-red-500 checked:bg-red-500 checked:border-red-500',
                className
              )}
              {...props}
            />
            <Check
              className={cn(
                'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                'pointer-events-none text-white',
                'opacity-0 peer-checked:opacity-100',
                'transition-opacity duration-150',
                size === 'sm' && 'h-2 w-2',
                size === 'md' && 'h-3 w-3',
                size === 'lg' && 'h-4 w-4'
              )}
              strokeWidth={3}
            />
          </div>
          
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

Checkbox.displayName = 'Checkbox';

export { checkboxVariants };
export default Checkbox;

/**
 * Label Atom Component
 * Etiqueta accesible para inputs y form controls
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../design-system/utils';

const labelVariants = cva(
  'font-medium transition-colors duration-200 select-none',
  {
    variants: {
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
      required: {
        true: "after:content-['*'] after:ml-1 after:text-danger-500",
        false: '',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed',
        false: 'cursor-pointer',
      },
    },
    defaultVariants: {
      size: 'md',
      required: false,
      disabled: false,
    },
  }
);

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  /** ID del input asociado (mejora accesibilidad) */
  htmlFor?: string;
  /** Texto opcional de ayuda debajo del label */
  description?: string;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, size, required, disabled, children, description, htmlFor, ...props }, ref) => {
    return (
      <div className="inline-flex flex-col gap-1">
        <label
          ref={ref}
          htmlFor={htmlFor}
          className={cn(
            labelVariants({ size, required, disabled }),
            'text-neutral-700 dark:text-neutral-200',
            className
          )}
          {...props}
        >
          {children}
        </label>
        
        {description && (
          <span className={cn(
            'text-sm text-neutral-600 dark:text-neutral-400',
            disabled && 'opacity-50'
          )}>
            {description}
          </span>
        )}
      </div>
    );
  }
);

Label.displayName = 'Label';

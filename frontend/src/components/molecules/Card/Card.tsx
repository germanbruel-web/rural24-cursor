/**
 * Card Molecule - Componente contenedor del Design System
 * Diseño basado en las cards de ExampleMigratedPage
 * Features: variantes, padding, dark mode, hover effects
 */

import React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../../../design-system/utils';

const cardVariants = cva(
  [
    'rounded-lg overflow-hidden transition-shadow',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-white dark:bg-gray-800',
          'shadow-md hover:shadow-lg',
        ],
        outlined: [
          'bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          'hover:border-gray-300 dark:hover:border-gray-600',
        ],
        elevated: [
          'bg-white dark:bg-gray-800',
          'shadow-lg hover:shadow-xl',
        ],
        ghost: [
          'bg-transparent',
          'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        ],
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Sub-componentes opcionales para estructura semántica
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('border-b border-gray-200 dark:border-gray-700 px-6 py-4', className)}
    {...props}
  >
    {children}
  </div>
);
CardHeader.displayName = 'CardHeader';

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={cn('p-4', className)} {...props}>
    {children}
  </div>
);
CardBody.displayName = 'CardBody';

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={cn('border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50', className)}
    {...props}
  >
    {children}
  </div>
);
CardFooter.displayName = 'CardFooter';

export { cardVariants };
export default Card;

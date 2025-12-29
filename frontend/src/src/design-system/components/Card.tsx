// ====================================================================
// CARD - Component library mobile-first
// ====================================================================

import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white border-2 border-gray-200 shadow-sm',
  elevated: 'bg-white border-2 border-gray-200 shadow-lg',
  outlined: 'bg-white border-2 border-gray-300',
  interactive: 'bg-white border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-primary-500 cursor-pointer transition-all',
};

const paddingStyles = {
  none: '',
  sm: 'p-3 md:p-4',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'rounded-xl overflow-hidden';
    const variantClass = variantStyles[variant];
    const paddingClass = paddingStyles[padding];
    
    const combinedClassName = `${baseClasses} ${variantClass} ${paddingClass} ${className}`.trim();
    
    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ====================================================================
// CARD SUB-COMPONENTS
// ====================================================================

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`border-b-2 border-gray-100 pb-4 mb-4 ${className}`.trim()} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <h3 className={`text-lg md:text-xl font-bold text-gray-900 ${className}`.trim()} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`.trim()} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`border-t-2 border-gray-100 pt-4 mt-4 ${className}`.trim()} {...props}>
    {children}
  </div>
);

// ====================================================================
// BADGE - Component library mobile-first
// ====================================================================

import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  error: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'neutral',
      size = 'md',
      dot = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'inline-flex items-center gap-1.5 font-semibold rounded-full border';
    const variantClass = variantStyles[variant];
    const sizeClass = sizeStyles[size];
    
    const combinedClassName = `${baseClasses} ${variantClass} ${sizeClass} ${className}`.trim();
    
    return (
      <span ref={ref} className={combinedClassName} {...props}>
        {dot && (
          <span className={`w-1.5 h-1.5 rounded-full ${
            variant === 'success' ? 'bg-green-500' :
            variant === 'warning' ? 'bg-amber-500' :
            variant === 'error' ? 'bg-red-500' :
            variant === 'info' ? 'bg-blue-500' :
            'bg-gray-500'
          }`} />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

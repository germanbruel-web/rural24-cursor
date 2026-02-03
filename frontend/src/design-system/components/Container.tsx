// ====================================================================
// CONTAINER - Component library mobile-first
// ====================================================================

import React from 'react';

export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  centered?: boolean;
  children: React.ReactNode;
}

const sizeStyles: Record<ContainerSize, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-[1400px]',
  full: 'max-w-full',
};

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      size = 'xl',
      centered = true,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'w-full px-4 md:px-6 lg:px-8';
    const sizeClass = sizeStyles[size];
    const centerClass = centered ? 'mx-auto' : '';
    
    const combinedClassName = `${baseClasses} ${sizeClass} ${centerClass} ${className}`.trim();
    
    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

// ====================================================================
// STACK - Component library mobile-first
// Layout primitivo para spacing consistente
// ====================================================================

import React from 'react';

export type StackDirection = 'vertical' | 'horizontal';
export type StackSpacing = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: StackDirection;
  spacing?: StackSpacing;
  align?: StackAlign;
  justify?: StackJustify;
  wrap?: boolean;
  children: React.ReactNode;
}

const spacingStyles: Record<StackSpacing, string> = {
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  '2xl': 'gap-12',
};

const alignStyles: Record<StackAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyStyles: Record<StackJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      direction = 'vertical',
      spacing = 'md',
      align = 'stretch',
      justify = 'start',
      wrap = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'flex';
    const directionClass = direction === 'vertical' ? 'flex-col' : 'flex-row';
    const spacingClass = spacingStyles[spacing];
    const alignClass = alignStyles[align];
    const justifyClass = justifyStyles[justify];
    const wrapClass = wrap ? 'flex-wrap' : '';
    
    const combinedClassName = `${baseClasses} ${directionClass} ${spacingClass} ${alignClass} ${justifyClass} ${wrapClass} ${className}`.trim();
    
    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {children}
      </div>
    );
  }
);

Stack.displayName = 'Stack';

// ====================================================================
// SHORTCUTS
// ====================================================================

export const VStack: React.FC<Omit<StackProps, 'direction'>> = (props) => (
  <Stack direction="vertical" {...props} />
);

export const HStack: React.FC<Omit<StackProps, 'direction'>> = (props) => (
  <Stack direction="horizontal" {...props} />
);

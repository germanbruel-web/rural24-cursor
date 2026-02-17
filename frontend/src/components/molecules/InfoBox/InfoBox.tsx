/**
 * InfoBox - Componente para mensajes informativos con iconos
 * Reemplaza emoticons por iconos Lucide semánticamente correctos
 * 
 * @example
 * <InfoBox variant="success" icon={CheckCircle} title="¡Listo!">
 *   Tu aviso fue publicado exitosamente
 * </InfoBox>
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info 
} from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../design-system/utils';

// ====================================================================
// VARIANTS CON CVA
// ====================================================================
const infoBoxVariants = cva(
  // Base styles
  'flex items-start gap-3 p-4 sm:p-5 rounded-xl border-2 transition-all',
  {
    variants: {
      variant: {
        success: 'bg-brand-50 border-brand-200 text-brand-800',
        error: 'bg-red-50 border-red-200 text-red-900',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
        info: 'bg-blue-50 border-blue-200 text-blue-900',
      },
      size: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      variant: 'info',
      size: 'md',
    },
  }
);

const iconVariants = cva('flex-shrink-0 mt-0.5', {
  variants: {
    variant: {
      success: 'text-brand-600',
      error: 'text-red-600',
      warning: 'text-yellow-600',
      info: 'text-blue-600',
    },
    size: {
      sm: 'w-5 h-5',
      md: 'w-6 h-6',
      lg: 'w-7 h-7',
    },
  },
  defaultVariants: {
    variant: 'info',
    size: 'md',
  },
});

// ====================================================================
// TYPES
// ====================================================================
export interface InfoBoxProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof infoBoxVariants> {
  /** Icono personalizado (opcional, usa default según variant) */
  icon?: LucideIcon;
  /** Título opcional (bold) */
  title?: string;
  /** Contenido del mensaje */
  children: React.ReactNode;
}

// ====================================================================
// COMPONENT
// ====================================================================
export const InfoBox = React.forwardRef<HTMLDivElement, InfoBoxProps>(
  ({ variant, size, icon: CustomIcon, title, children, className, ...props }, ref) => {
    // Default icons por variant
    const DefaultIcon = {
      success: CheckCircle,
      error: AlertCircle,
      warning: AlertTriangle,
      info: Info,
    }[variant || 'info'];

    const Icon = CustomIcon || DefaultIcon;

    return (
      <div
        ref={ref}
        className={cn(infoBoxVariants({ variant, size }), className)}
        {...props}
      >
        <Icon className={iconVariants({ variant, size })} />
        
        <div className="flex-1 space-y-1">
          {title && (
            <p className="font-bold">
              {title}
            </p>
          )}
          <div className={title ? 'text-sm' : ''}>
            {children}
          </div>
        </div>
      </div>
    );
  }
);

InfoBox.displayName = 'InfoBox';

export default InfoBox;

/**
 * TipsCard - Tarjeta para mostrar tips con bullets e iconos
 * Ideal para instrucciones paso a paso o recomendaciones
 * 
 * @example
 * <TipsCard 
 *   icon={Camera} 
 *   title="Tips para mejores fotos"
 *   variant="info"
 * >
 *   <TipsCard.Item icon={Smartphone}>
 *     GIRA TU CELULAR HORIZONTALMENTE (modo paisaje)
 *   </TipsCard.Item>
 *   <TipsCard.Item icon={Sun}>
 *     Usá buena luz natural
 *   </TipsCard.Item>
 * </TipsCard>
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Lightbulb, Check } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../design-system/utils';

// ====================================================================
// VARIANTS
// ====================================================================
const tipsCardVariants = cva(
  'flex items-start gap-3 p-5 sm:p-6 rounded-xl border-2',
  {
    variants: {
      variant: {
        default: 'bg-gray-50 border-gray-200',
        blue: 'bg-blue-50 border-blue-200',
        green: 'bg-green-50 border-green-200',
        yellow: 'bg-yellow-50 border-yellow-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const iconContainerVariants = cva('flex-shrink-0 mt-0.5', {
  variants: {
    variant: {
      default: 'text-gray-600',
      blue: 'text-blue-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

// ====================================================================
// TYPES
// ====================================================================
export interface TipsCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tipsCardVariants> {
  /** Icono principal (default: Lightbulb) */
  icon?: LucideIcon;
  /** Título de la tarjeta */
  title?: string;
  /** Items (usar TipsCard.Item) */
  children: React.ReactNode;
}

export interface TipsItemProps extends React.HTMLAttributes<HTMLLIElement> {
  /** Icono del item (default: Check) */
  icon?: LucideIcon;
  /** Texto en bold (opcional) */
  strong?: boolean;
  /** Contenido del item */
  children: React.ReactNode;
}

// ====================================================================
// COMPONENT
// ====================================================================
export const TipsCard = React.forwardRef<HTMLDivElement, TipsCardProps>(
  ({ variant, icon: CustomIcon, title, children, className, ...props }, ref) => {
    const Icon = CustomIcon || Lightbulb;

    return (
      <div
        ref={ref}
        className={cn(tipsCardVariants({ variant }), className)}
        {...props}
      >
        <Icon className={cn(iconContainerVariants({ variant }), 'w-6 h-6')} />
        
        <div className="flex-1">
          {title && (
            <p className="font-bold text-gray-900 mb-2">{title}</p>
          )}
          <ul className="text-sm text-gray-700 space-y-2">
            {children}
          </ul>
        </div>
      </div>
    );
  }
);

// ====================================================================
// SUBCOMPONENT: TipsCard.Item
// ====================================================================
const TipsItem = React.forwardRef<HTMLLIElement, TipsItemProps>(
  ({ icon: CustomIcon, strong = false, children, className, ...props }, ref) => {
    const Icon = CustomIcon || Check;

    return (
      <li
        ref={ref}
        className={cn('flex items-start gap-2', className)}
        {...props}
      >
        <Icon className="w-4 h-4 flex-shrink-0 mt-0.5 text-current" />
        <span className={strong ? 'font-bold' : ''}>
          {children}
        </span>
      </li>
    );
  }
);

TipsItem.displayName = 'TipsItem';
TipsCard.displayName = 'TipsCard';

// ====================================================================
// COMPOSITE TYPE
// ====================================================================
type TipsCardComponent = typeof TipsCard & {
  Item: typeof TipsItem;
};

// Attach subcomponent
(TipsCard as TipsCardComponent).Item = TipsItem;

export default TipsCard as TipsCardComponent;

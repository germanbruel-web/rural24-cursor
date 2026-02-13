/**
 * ProductCard Organism - Card profesional de productos
 * Usa Card del Design System + lógica específica de productos
 * Variantes: featured (homepage) y compact (resultados)
 */

import React, { useState } from 'react';
import { MapPin, Tag } from 'lucide-react';
import type { Product } from '../../../../types';
import { Card } from '../../molecules/Card';
import { Badge } from '../../atoms/Badge';
import { Button } from '../../atoms/Button';
import { useProductImage, getProductLabel } from '../../../hooks/useProductImage';
import { getAdDetailUrl } from '../../../utils/slugUtils';
import { cn } from '../../../design-system/utils';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../../../constants/defaultImages';
import { navigateTo } from '../../../hooks/useNavigate';
import { optimizeCloudinaryUrl } from '../../../utils/imageOptimizer';

interface ProductCardProps {
  product: Product;
  variant?: 'featured' | 'compact';
  onViewDetail?: (adId: string) => void;
  showBadges?: boolean;
  showLocation?: boolean;
  /** Mostrar provincia además de localidad (ej: en página de detalle) */
  showProvince?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  variant = 'featured',
  onViewDetail,
  showBadges = true,
  showLocation = true,
  showProvince = false,
  className,
}) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = useProductImage(product);
  const cardLabel = getProductLabel(product);
  
  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';

  // Optimizar imagen de Cloudinary (2MB → 80KB, -96%)
  const optimizedImageUrl = optimizeCloudinaryUrl(
    imageError ? DEFAULT_PLACEHOLDER_IMAGE : imageUrl,
    { 
      width: isFeatured ? 800 : 600,
      quality: 'auto:good',
      crop: 'limit'
    }
  );

  // Formateo de precio
  const formatPrice = (price?: number, currency?: string) => {
    if (!price || price <= 0) return 'Consultar';
    
    const formatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    
    const symbol = currency === 'USD' ? 'USD' : '$';
    return `${symbol} ${formatted}`;
  };

  // Navegación con slug SEO (usar product.slug si está disponible)
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevenir navegación si se hace click en botones
    if ((e.target as HTMLElement).closest('button')) return;
    
    if (product.slug) {
      navigateTo(`/ad/${product.slug}`);
    } else if (product.id && product.title) {
      // Usar short_id si está disponible, sino fallback a UUID
      const url = getAdDetailUrl(product.title, product.id, product.short_id);
      navigateTo(url.replace('#', ''));
    } else if (onViewDetail && product.id) {
      onViewDetail(product.id);
    }
  };

  return (
    <Card
      variant="default"
      padding="none"
      className={cn(
        'group cursor-pointer overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-[3px] hover:shadow-lg hover:border-[#16a135]',
        isFeatured && 'h-full',
        isCompact && 'h-auto',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Imagen con overlay */}
      <div className={cn(
        'relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200',
        isFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]'
      )}>
        <img
          src={optimizedImageUrl}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
        
        {/* Gradient overlay en hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badge contextual: Ganadería=Edad, Otros=Nuevo/Usado */}
        {(() => {
          // Combinar attributes + dynamic_fields
          const attrs = {
            ...(product.attributes || {}),
            ...((product as any).dynamic_fields || {})
          };
          const isGanaderia = product.category?.toLowerCase().includes('ganader');
          
          // GANADERÍA: mostrar Edad
          if (isGanaderia) {
            const edad = attrs.edad || attrs.age;
            if (!edad) return null;
            return (
              <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">
                {edad}
              </span>
            );
          }
          
          // OTROS: mostrar Nuevo/Usado
          const condition = (product as any).condition || attrs.condicion || attrs.estado || attrs.condition;
          if (!condition) return null;
          
          const condLower = String(condition).toLowerCase();
          const isNew = condLower.includes('nuevo') || condLower === 'new';
          const isUsed = condLower.includes('usado') || condLower === 'used';
          
          if (!isNew && !isUsed) return null;
          
          return (
            <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">
              {isNew ? 'Nuevo' : 'Usado'}
            </span>
          );
        })()}

      </div>

      {/* Contenido */}
      <div className={cn(
        'flex flex-col',
        isFeatured ? 'p-5 gap-3' : 'p-4 gap-2'
      )}>
        {/* Label: Subcategoría · Marca · Modelo */}
        {cardLabel && (
          <div className={cn(
            'flex items-center gap-1.5 text-gray-600',
            isFeatured ? 'text-xs' : 'text-[11px]'
          )}>
            <Tag size={isFeatured ? 12 : 10} className="text-gray-400 flex-shrink-0" />
            <span className="font-medium truncate">{cardLabel}</span>
          </div>
        )}

        {/* Título */}
        <h3 className={cn(
          'font-bold text-gray-900 dark:text-white line-clamp-2',
          'group-hover:text-[#16a135] transition-colors',
          isFeatured ? 'text-base leading-tight min-h-[2.5rem]' : 'text-sm leading-snug min-h-[2rem]'
        )}>
          {product.title}
        </h3>

        {/* Precio destacado */}
        <div>
          <div className={cn(
            'inline-block bg-gradient-to-r from-green-50 to-emerald-50',
            'border-l-4 border-[#16a135] rounded-lg',
            isFeatured ? 'px-3 py-1.5' : 'px-2.5 py-1'
          )}>
            <p className={cn(
              'font-black text-green-700',
              isFeatured ? 'text-base' : 'text-sm'
            )}>
              {formatPrice(product.price, product.currency)}
            </p>
          </div>
        </div>

        {/* Ubicación - Inteligente: localidad siempre, provincia opcional */}
        {showLocation && (product.location || product.province) && (
          <div className={cn(
            'flex items-center gap-1.5 text-gray-500',
            isFeatured ? 'text-xs' : 'text-[11px]',
            'mt-auto'
          )}>
            <MapPin size={isFeatured ? 14 : 12} className="flex-shrink-0 text-gray-400" />
            <span className="truncate">
              {(() => {
                // Prioridad: localidad primero, luego provincia
                const parts: string[] = [];
                if (product.location && product.location !== 'Sin ubicación') {
                  parts.push(product.location);
                }
                if (showProvince && product.province) {
                  parts.push(product.province);
                }
                // Si no hay localidad pero sí provincia, mostrar provincia
                if (parts.length === 0 && product.province) {
                  parts.push(product.province);
                }
                return parts.join(', ') || 'Sin ubicación';
              })()}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar si cambia el ID del producto o las props de visualización
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.variant === nextProps.variant &&
    prevProps.showBadges === nextProps.showBadges &&
    prevProps.showLocation === nextProps.showLocation &&
    prevProps.showProvince === nextProps.showProvince
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

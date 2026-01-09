/**
 * ProductCard Organism - Card profesional de productos
 * Usa Card del Design System + lógica específica de productos
 * Variantes: featured (homepage) y compact (resultados)
 */

import React, { useState } from 'react';
import { MapPin, Star, Tag } from 'lucide-react';
import type { Product } from '../../../../types';
import { Card } from '../../molecules/Card';
import { Badge } from '../../atoms/Badge';
import { Button } from '../../atoms/Button';
import { useProductImage, getProductLabel } from '../../../hooks/useProductImage';
import { getAdDetailUrl } from '../../../utils/slugUtils';
import { cn } from '../../../design-system/utils';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../../../constants/defaultImages';

interface ProductCardProps {
  product: Product;
  variant?: 'featured' | 'compact';
  onViewDetail?: (adId: string) => void;
  showBadges?: boolean;
  showLocation?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant = 'featured',
  onViewDetail,
  showBadges = true,
  showLocation = true,
  className,
}) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = useProductImage(product);
  const cardLabel = getProductLabel(product);
  
  // Debug log
  console.log('[ProductCard] Debug:', {
    id: product.id,
    category: product.category,
    subcategory: product.subcategory,
    brand: product.brand,
    model: product.model,
    attributes: product.attributes,
    cardLabel
  });
  
  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';

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

  // Navegación con slug SEO
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevenir navegación si se hace click en botones
    if ((e.target as HTMLElement).closest('button')) return;
    
    if (product.id && product.title) {
      const url = getAdDetailUrl(product.title, product.id);
      window.location.hash = url;
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
        'transform transition-all duration-300',
        'hover:-translate-y-1 hover:border-[#16a135]',
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
          src={imageError ? DEFAULT_PLACEHOLDER_IMAGE : imageUrl}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={() => setImageError(true)}
        />
        
        {/* Gradient overlay en hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges destacados */}
        {showBadges && product.isSponsored && isFeatured && (
          <Badge
            variant="primary"
            size="sm"
            leftIcon={<Star size={12} />}
            className="absolute top-2 left-2 backdrop-blur-sm bg-opacity-95"
          >
            Premium
          </Badge>
        )}
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

        {/* Badges: Atributos dinámicos relevantes */}
        {showBadges && (
          <div className="flex flex-wrap gap-2">
            {/* Extraer badges según categoría */}
            {(() => {
              const badges: Array<{ label: string; value: string }> = [];
              const attrs = product.attributes || {};
              
              // MAQUINARIAS: Marca, Modelo, Año, Condición
              if (product.category?.toLowerCase().includes('maquinaria')) {
                if (attrs.marca || product.brand) badges.push({ label: 'Marca', value: String(attrs.marca || product.brand) });
                if (attrs.modelo || product.model) badges.push({ label: 'Modelo', value: String(attrs.modelo || product.model) });
                if (attrs.año || attrs.year || (product as any).year) badges.push({ label: 'Año', value: String(attrs.año || attrs.year || (product as any).year) });
                if (attrs.condicion || attrs.estado) badges.push({ label: 'Estado', value: String(attrs.condicion || attrs.estado) });
              }
              // GANADERÍA: Raza, Edad, Peso, Cantidad
              else if (product.category?.toLowerCase().includes('ganader')) {
                if (attrs.raza || attrs.breed) badges.push({ label: 'Raza', value: String(attrs.raza || attrs.breed) });
                if (attrs.edad || attrs.age) badges.push({ label: 'Edad', value: String(attrs.edad || attrs.age) });
                if (attrs.peso || attrs.weight) badges.push({ label: 'Peso', value: String(attrs.peso || attrs.weight) + ' kg' });
                if (attrs.cantidad || attrs.quantity) badges.push({ label: 'Cantidad', value: String(attrs.cantidad || attrs.quantity) });
              }
              // OTROS: Genérico
              else {
                if (product.brand) badges.push({ label: 'Marca', value: product.brand });
                if (product.model) badges.push({ label: 'Modelo', value: product.model });
                if ((product as any).year) badges.push({ label: 'Año', value: String((product as any).year) });
              }
              
              // Limitar badges: featured = 4, compact = 2
              const maxBadges = isFeatured ? 4 : 2;
              
              return badges.slice(0, maxBadges).map((badge, idx) => (
                <span 
                  key={idx}
                  className={cn(
                    "inline-flex items-center gap-1 bg-gray-100 text-gray-800 font-bold rounded-full border border-gray-200",
                    isFeatured ? "text-[10px] px-2.5 py-1" : "text-[9px] px-2 py-0.5"
                  )}
                >
                  <div className={cn(
                    "rounded-full bg-[#16a135]",
                    isFeatured ? "w-1.5 h-1.5" : "w-1 h-1"
                  )} />
                  {badge.value}
                </span>
              ));
            })()}
          </div>
        )}

        {/* Ubicación */}
        {showLocation && product.location && (
          <div className={cn(
            'flex items-center gap-1.5 text-gray-500',
            isFeatured ? 'text-xs' : 'text-[11px]',
            'mt-auto'
          )}>
            <MapPin size={isFeatured ? 14 : 12} className="flex-shrink-0" />
            <span className="truncate">{product.location}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProductCard;

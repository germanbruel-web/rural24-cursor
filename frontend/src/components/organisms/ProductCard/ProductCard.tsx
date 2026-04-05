/**
 * ProductCard Organism - Card profesional de productos
 * Usa Card del Design System + lógica específica de productos
 * Variantes: featured (homepage) y compact (resultados)
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Tag, Share2 } from 'lucide-react';
import type { Product } from '../../../../types';
import { Card } from '../../molecules/Card';
import { useProductImage, getProductLabel } from '../../../hooks/useProductImage';
import { getAdDetailUrl } from '../../../utils/slugUtils';
import { cn } from '../../../design-system/utils';
import { getCategoryPlaceholder } from '../../../services/categoryPlaceholderCache';
import { navigateTo } from '../../../hooks/useNavigate';
import { getImageVariant } from '../../../utils/imageOptimizer';
import { FavoriteButton } from '../../favorites/FavoriteButton';
import { ShareModal } from '../../molecules/ShareModal/ShareModal';
import { EmpleoModal } from '../../molecules/EmpleoModal/EmpleoModal';
import { EmpleoCard } from './EmpleoCard';
import { useGlobalSetting } from '../../../hooks/useGlobalSetting';

function CountdownBadge({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState<string | null>(null);
  const thresholdHours = useGlobalSetting<number>('card_countdown_threshold_hours', 48);
  const thresholdMs = thresholdHours * 60 * 60 * 1000;

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0 || diff > thresholdMs) { setLabel(null); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(`${h}h ${m}m ${s}s`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, thresholdMs]);

  if (!label) return null;
  return (
    <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold text-white bg-black/60 backdrop-blur-sm rounded leading-none">
      {label}
    </span>
  );
}

interface ProductCardProps {
  product: Product;
  variant?: 'featured' | 'compact';
  onViewDetail?: (adId: string) => void;
  showLocation?: boolean;
  showProvince?: boolean;
  /** @deprecated Badges eliminados — prop ignorado por compatibilidad */
  showBadges?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  variant = 'featured',
  onViewDetail,
  showLocation = true,
  showProvince = false,
  className,
}) => {
  const [imageError, setImageError] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const imageUrl = useProductImage(product);
  const cardLabel = getProductLabel(product);
  const colorCategorySlugs = useGlobalSetting<string[]>('card_color_category_slugs', ['servicios', 'empleos']);

  const isFeatured = variant === 'featured';
  const isCompact = variant === 'compact';

  const shareUrl = `${window.location.origin}${window.location.pathname}#/ad/${product.slug || product.id}`;

  // Detectar categorías sin foto de portada (configurable desde global_settings)
  const catSlug = product.category_slug?.toLowerCase() ?? '';
  const isColorCard = colorCategorySlugs.includes(catSlug);
  const bgColor = isColorCard ? ((product.attributes?.bg_color as string) || '#FFFFFF') : null;

  // Optimizar imagen con crop inteligente por variante
  const optimizedImageUrl = getImageVariant(
    imageError ? getCategoryPlaceholder((product as any).category_id) : imageUrl,
    isFeatured ? 'detail' : 'card'
  );

  // Formateo de precio
  const formatPrice = (price?: number, currency?: string) => {
    if (!price || price <= 0) return '—';
    
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

  // Empleos: card especializada con modal de contacto sin login
  if (catSlug === 'empleos') {
    return <EmpleoCard product={product} className={className} />;
  }

  return (
    <Card
      variant="default"
      padding="none"
      className={cn(
        'group cursor-pointer overflow-hidden',
        'transition-all duration-300 ease-out',
        isColorCard
          ? 'hover:scale-[1.02] hover:shadow-md'
          : 'hover:-translate-y-[3px] hover:shadow-lg hover:border-brand-600',
        isFeatured && 'h-full',
        isCompact && 'h-auto',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Imagen / Color de fondo */}
      <div className={cn(
        'relative w-full overflow-hidden',
        isFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]',
        !isColorCard && 'bg-gradient-to-br from-gray-100 to-gray-200'
      )}
        style={isColorCard ? { backgroundColor: bgColor! } : undefined}
      >
        {isColorCard ? (
          /* Card de color: avatar circular centrado */
          <div className="absolute inset-0 flex items-center justify-center">
            {product.user_avatar_url ? (
              <img
                src={product.user_avatar_url}
                alt={product.title}
                className={cn(
                  'rounded-full object-cover border-4',
                  isFeatured ? 'w-20 h-20' : 'w-16 h-16',
                  'shadow-md',
                  catSlug === 'servicios'
                    ? 'border-transparent ring-2 ring-offset-2 ring-brand-500'
                    : 'border-gray-300'
                )}
                style={catSlug === 'servicios' ? {
                  borderImage: 'linear-gradient(135deg, #84cc16, #4ade80) 1',
                } : undefined}
              />
            ) : (
              <div className={cn(
                'rounded-full bg-gray-200 flex items-center justify-center text-gray-400',
                isFeatured ? 'w-20 h-20' : 'w-16 h-16'
              )}>
                <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              </div>
            )}
          </div>
        ) : (
          <img
            src={optimizedImageUrl}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
        
        {/* Gradient overlay en hover — solo cards con imagen */}
        {!isColorCard && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}

        {/* Badge countdown — top-left */}
        {product.featured_expires_at && (
          <div className="absolute top-2 left-2">
            <CountdownBadge expiresAt={product.featured_expires_at} />
          </div>
        )}

        {/* Favorito — top-right, solo cards con imagen */}
        {product.id && !isColorCard && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <FavoriteButton adId={product.id} />
          </div>
        )}

        {/* Badge contextual: Ganadería=Edad, Otros=Nuevo/Usado */}
        {(() => {
          // Combinar attributes + dynamic_fields
          const attrs = {
            ...(product.attributes || {}),
            ...((product as any).dynamic_fields || {})
          };
          const isHacienda = product.category_slug === 'hacienda';

          // INMOBILIARIA: mostrar tipo de operación (Venta, Alquiler, etc.)
          const isInmobiliaria = (product as any).category_slug === 'inmobiliaria-rural';
          if (isInmobiliaria) {
            const opRaw = attrs.tipo_de_operacion;
            if (!opRaw) return null;
            const opStr = String(opRaw);
            const op = opStr.includes('-') || opStr.includes('_')
              ? opStr.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
              : opStr.charAt(0).toUpperCase() + opStr.slice(1);
            return (
              <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">
                {op}
              </span>
            );
          }

          // HACIENDA: mostrar Edad como badge
          if (isHacienda) {
            const edadRaw = attrs.edad || attrs.edad_meses || attrs.age;
            if (!edadRaw) return null;
            const edadStr = String(edadRaw);
            const edad = edadStr.includes('-') || edadStr.includes('_')
              ? edadStr.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
              : edadStr;
            return (
              <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">
                {edad}
              </span>
            );
          }
          
          // OTROS: mostrar Nuevo/Usado (normalizado por adaptAdToProduct)
          const condition = product.condition;
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
        isFeatured ? 'p-3 sm:p-5 gap-2 sm:gap-3' : 'p-3 gap-1.5'
      )}>
        {/* Label: Subcategoría · Marca · Modelo */}
        {cardLabel && (
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-600">
            <Tag size={10} className="text-gray-400 flex-shrink-0" />
            <span className="font-medium truncate">{cardLabel}</span>
          </div>
        )}

        {/* Título — siempre 2 líneas reservadas */}
        <h3 className={cn(
          'font-bold text-gray-900 dark:text-white line-clamp-2 transition-colors',
          !isColorCard && 'group-hover:text-brand-600',
          isFeatured
            ? 'text-sm sm:text-base leading-tight min-h-[2.5rem] sm:min-h-[3rem]'
            : 'text-sm leading-snug min-h-[2.5rem]'
        )}>
          {product.title}
        </h3>

        {/* Precio — oculto para empleos/servicios */}
        {!isColorCard && (
          <div>
            {/* Mobile */}
            <p className="sm:hidden text-xs font-semibold text-gray-700">
              {formatPrice(product.price, product.currency)}
              {product.price_unit && product.price && product.price > 0 && (
                <span className="text-[10px] text-gray-400 font-normal ml-1">
                  /{product.price_unit.replace(/-/g, ' ')}
                </span>
              )}
            </p>
            {/* Desktop */}
            <div className={cn(
              'hidden sm:inline-block bg-gradient-to-r from-brand-50 to-emerald-50',
              'border-l-4 border-brand-600 rounded-lg',
              isFeatured ? 'px-3 py-1.5' : 'px-2.5 py-1'
            )}>
              <p className={cn('font-black text-brand-600', isFeatured ? 'text-base' : 'text-sm')}>
                {formatPrice(product.price, product.currency)}
              </p>
              {product.price_unit && product.price && product.price > 0 && (
                <p className="text-[10px] text-brand-500 font-medium leading-none mt-0.5">
                  por {product.price_unit.replace(/-/g, ' ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer: solo provincia + compartir */}
        <div className={cn('flex items-center justify-between gap-1 mt-auto text-[10px] sm:text-xs')}>
          {showLocation && product.province ? (
            <div className="flex items-center gap-1 text-gray-400 min-w-0">
              <MapPin size={10} className="flex-shrink-0" />
              <span className="truncate">{product.province}</span>
            </div>
          ) : <div />}

          {product.id && !isColorCard && (
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShareOpen(true); }}
              aria-label="Compartir aviso"
              className="flex-shrink-0 p-1 text-gray-400 hover:text-brand-600 transition-colors rounded"
            >
              <Share2 size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title={product.title}
        url={shareUrl}
      />

    </Card>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;


import React from 'react';
import type { Product } from '../../types';
import { GemIcon } from './IconComponents';
import { VerifiedBadge } from './UserBadges';
import { getCardLabel } from '../utils/cardLabelHelpers';

interface ProductCardProps {
  product: Product;
  onViewDetail?: (adId: string) => void;
}

const EnrichedDataItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex items-center text-xs text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">
        <span className="font-semibold mr-1">{label}:</span>
        <span>{value}</span>
    </div>
);

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetail }) => {

  const formatPrice = (price?: number, currency?: string) => {
    if (price === undefined || price === null) return 'Consultar';
    
    // Si el precio es 0 o negativo, mostrar "Consultar"
    if (price <= 0) return 'Consultar';
    
    // Formatear solo el número con separadores de miles
    const formattedNumber = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    
    // Determinar símbolo según moneda
    const symbol = currency === 'USD' ? 'USD' : '$';
    
    return `${symbol} ${formattedNumber}`;
  };

  // Extrae el nombre de la empresa desde la URL
  const getSourceName = (url?: string): string => {
    if (!url) return 'la fuente';
    const urlLower = url.toLowerCase();
    if (urlLower.includes('agrofy')) return 'Agrofy';
    if (urlLower.includes('agroa')) return 'AgroAds';
    if (urlLower.includes('todoagro')) return 'TodoAgro';
    if (urlLower.includes('mercadolibre')) return 'MercadoLibre';
    if (urlLower.includes('deremate')) return 'DeRemate';
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
      return 'la fuente';
    }
  };
  
  const hasEnrichedData = product.enrichedData && Object.keys(product.enrichedData).length > 0;
  const isPremium = product.isPremium || product.isSponsored;
  const sourceName = getSourceName(product.sourceUrl);
  const cardLabel = getCardLabel(product);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl h-full border-t">
      {/* Imagen del producto */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        <img 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          src={
            product.imageUrl || 
            product.imageUrls?.[0] || 
            product.image_urls?.[0] || 
            (product as any).images?.[0] ||
            '/images/preview-image.webp'
          } 
          alt={product.title}
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== window.location.origin + '/images/preview-image.webp') {
              target.src = '/images/preview-image.webp';
            }
          }}
        />
        
        {/* Badge IA - Solo si tiene datos enriquecidos */}
        {hasEnrichedData && (
          <div className="absolute top-2 left-2 flex items-center bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            <GemIcon className="w-4 h-4 mr-1" />
            <span>IA</span>
          </div>
        )}
      </div>

      {/* Badge de CATEGORÍA - Posicionado mitad imagen/mitad afuera, después del div de imagen */}
      <div className="relative">
        {product.category && (
          <div className="absolute left-4 -top-3 z-10">
            <span className="bg-black text-white text-[9px] px-2 py-1 rounded shadow-lg uppercase">
              {product.category}
            </span>
          </div>
        )}
      </div>

      {/* Contenido del card - padding-top extra para badge de categoría */}
      <div className="p-4 pt-6 flex flex-col flex-grow">
        {/* Etiqueta dinámica: Subcategoría · Atributos */}
        {cardLabel && (
          <div className="text-xs text-gray-600 font-medium mb-2 flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="truncate">{cardLabel}</span>
          </div>
        )}

        {/* Título */}
        <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-[#16a135] transition-colors line-clamp-2">
          {product.title}
        </h3>

        {/* Ubicación: Ciudad y Provincia */}
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
          <svg className="w-4 h-4 flex-shrink-0 text-[#16a135]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>
            {product.location || 'Ubicación no especificada'}
          </span>
        </div>

        {/* Badge de verificación */}
        {product.seller && (
          <div className="flex flex-wrap gap-2 mb-3">
            <VerifiedBadge 
              verified={product.seller.email_verified} 
              size="sm" 
              showLabel={false}
            />
          </div>
        )}

        {/* Descripción */}
        <p className="text-gray-600 text-sm flex-grow mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Precio */}
        <div className="mb-3">
          <p className={`text-xl font-bold ${isPremium ? 'text-[#e5a21f]' : 'text-[#16a135]'}`}>
            {formatPrice(product.price, product.currency)}
          </p>
          {product.updatedAt && (
            <p className="text-xs text-gray-400 mt-1">
              Actualizado {new Date(product.updatedAt).toLocaleDateString('es-AR')}
            </p>
          )}
        </div>
        
        {/* Botones de acción */}
        <div className="mt-auto space-y-2">
          {/* Avisos con user_id (Premium o FREE): Navegar a página de detalle */}
          {product.user_id && (
            <button
              onClick={() => {
                console.log('🔍 Navegando a página de detalle para:', product.id, product.title);
                window.location.hash = `#/ad/${product.id}`;
              }}
              className="w-full bg-[#16a135] hover:bg-[#0e7d25] text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Ver Detalles
            </button>
          )}
          
          {/* Link "Ver en..." - Solo para avisos scrapeados */}
          {!product.user_id && product.sourceUrl && (
            <a 
              href={product.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 text-sm font-semibold text-[#16a135] hover:text-[#128c2c] transition-colors group/link w-full"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Ver en {sourceName}</span>
              <svg className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};



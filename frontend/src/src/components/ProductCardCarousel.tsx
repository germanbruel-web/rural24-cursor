import React from 'react';
import type { Product } from '../../types';
import { GemIcon } from './IconComponents';
import { getCardLabel } from '../utils/cardLabelHelpers';

interface ProductCardCarouselProps {
  product: Product;
}

export const ProductCardCarousel: React.FC<ProductCardCarouselProps> = ({ product }) => {
  const hasEnrichedData = product.enrichedData && Object.keys(product.enrichedData).length > 0;
  const isPremium = product.isPremium || product.isSponsored;

  // Debug: Verificar datos del producto
  console.log('🎴 ProductCardCarousel render:', {
    id: product.id,
    title: product.title,
    user_id: product.user_id,
    hasSeller: !!product.seller,
    isPremium
  });

  // Extraer nombre de la empresa de la URL
  const getSourceName = (url?: string) => {
    if (!url) return 'fuente externa';
    try {
      const hostname = new URL(url).hostname;
      if (hostname.includes('agrofy')) return 'Agrofy';
      if (hostname.includes('agroads') || hostname.includes('agroad')) return 'AgroAds';
      if (hostname.includes('todoagro')) return 'TodoAgro';
      if (hostname.includes('mercadolibre') || hostname.includes('mercadolibre')) return 'MercadoLibre';
      if (hostname.includes('deremate')) return 'DeRemate';
      // Extraer nombre del dominio
      const parts = hostname.replace('www.', '').split('.');
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch {
      return 'fuente externa';
    }
  };

  const sourceName = getSourceName(product.sourceUrl);
  const cardLabel = getCardLabel(product);

  const formatPrice = (price?: number, currency?: string) => {
    if (!price || price <= 0) return 'Consultar';
    const formatted = new Intl.NumberFormat('es-AR').format(price);
    const symbol = currency === 'USD' ? 'USD' : '$';
    return `${symbol} ${formatted}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl h-full border-t">
      {/* Imagen del producto */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
        <img 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          src={product.image_urls?.[0] || product.imageUrls?.[0] || product.imageUrl || 'https://via.placeholder.com/400x300?text=Sin+imagen'} 
          alt={product.title}
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/400x300?text=Sin+imagen';
          }}
        />
        
        {/* Badge IA - Solo si tiene datos enriquecidos */}
        {hasEnrichedData && (
          <div className="absolute bottom-2 right-2 flex items-center bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
            <GemIcon className="w-3 h-3 mr-0.5" />
            <span>IA</span>
          </div>
        )}
      </div>

      {/* Contenido del card */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Etiqueta dinámica: Subcategoría · Atributos */}
        {cardLabel && (
          <div className="text-xs text-gray-600 font-medium mb-2 flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="truncate">{cardLabel}</span>
          </div>
        )}

        {/* Título clickeable */}
        {product.user_id ? (
          <a href={`#/ad/${product.id}`}>
            <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-[#16a135] transition-colors line-clamp-2 cursor-pointer" style={{ minHeight: '3.5rem' }}>
              {product.title}
            </h3>
          </a>
        ) : (
          <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">
            <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-[#16a135] transition-colors line-clamp-2 cursor-pointer" style={{ minHeight: '3.5rem' }}>
              {product.title}
            </h3>
          </a>
        )}

        {/* Precio */}
        <div className="mb-3">
          <p className="text-lg font-bold text-green-600">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>

        {/* Píldoras verdes: Marca - Modelo */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {product.brand && (
            <span className="badge-pill bg-transparent text-gray-800 text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ borderLeft: '2px solid #386539' }}>
              {product.brand}
            </span>
          )}
          {product.model && (
            <span className="badge-pill bg-transparent text-gray-800 text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ borderLeft: '2px solid #169834' }}>
              {product.model}
            </span>
          )}
        </div>

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
        
        {/* Botón/Link según tipo de aviso */}
        <div className="mt-auto">
          {/* Avisos Premium/Free con user_id: "Ver detalles" navega a página de detalle */}
          {product.user_id ? (
            <a
              href={`#/ad/${product.id}`}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#16a135] hover:text-[#128c2c] transition-colors group/link w-full"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Ver detalles</span>
              <svg className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          ) : (
            /* Avisos scrapeados: Link "Ver en..." */
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



import React from 'react';
import { MapPin } from 'lucide-react';
import type { Product } from '../../types';
import { getCardLabel } from '../utils/cardLabelHelpers';
import { getAdDetailUrl } from '../utils/slugUtils';

interface UnifiedAdCardProps {
  product: Product;
  onViewDetail?: (adId: string) => void;
}

export const UnifiedAdCard: React.FC<UnifiedAdCardProps> = ({ product, onViewDetail }) => {
  const formatPrice = (price?: number, currency?: string) => {
    if (price === undefined || price === null) return 'Consultar';
    if (price <= 0) return 'Consultar';
    
    const formattedNumber = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    
    const symbol = currency === 'USD' ? 'USD' : '$';
    return `${symbol} ${formattedNumber}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `Actualizado ${date.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })}`;
  };

  const handleClick = () => {
    console.log('🎯 UnifiedAdCard - handleClick:', {
      title: product.title,
      id: product.id,
      sourceUrl: product.sourceUrl,
      hasOnViewDetail: !!onViewDetail
    });
    
    // Navegar con slug amigable
    if (product.id && product.title) {
      const url = getAdDetailUrl(product.title, product.id);
      console.log('🔗 Navegando con slug:', url);
      window.location.hash = url;
    } else if (onViewDetail && product.id) {
      // Fallback: usar callback si existe
      console.log('🔗 Navegando a aviso ID (fallback):', product.id);
      onViewDetail(product.id);
    } else {
      console.warn('⚠️ No se pudo manejar click:', { hasOnViewDetail: !!onViewDetail, hasId: !!product.id });
    }
  };

  // Extraer primera imagen desde múltiples posibles campos
  const getImageUrl = () => {
    // 1. imageUrl directo (ya procesado)
    if (product.imageUrl && product.imageUrl !== '/images/preview-image.webp') {
      return product.imageUrl;
    }
    
    // 2. imageUrls array
    if (product.imageUrls?.length > 0) {
      const first = product.imageUrls[0];
      if (typeof first === 'string' && first) return first;
      if (typeof first === 'object' && first?.url) return first.url;
    }
    
    // 3. image_urls array
    if (product.image_urls?.length > 0) {
      const first = product.image_urls[0];
      if (typeof first === 'string' && first) return first;
      if (typeof first === 'object' && (first as any)?.url) return (first as any).url;
    }
    
    // 4. images array (puede ser string o {url, sort_order})
    if ((product as any).images?.length > 0) {
      const first = (product as any).images[0];
      if (typeof first === 'string' && first) return first;
      if (typeof first === 'object' && first?.url) return first.url;
    }
    
    // 5. Fallback a foto genérica (foto-portada por categoría en el futuro)
    // Por ahora usar imagen genérica estándar
    return '/images/preview-image.webp';
  };
  
  const imageUrl = getImageUrl();
  const cardLabel = getCardLabel(product);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col h-full border border-gray-100 hover:border-[#16a135] transform hover:-translate-y-1">
      {/* Imagen */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <img 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          src={imageUrl}
          alt={product.title}
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== window.location.origin + '/images/preview-image.webp') {
              target.src = '/images/preview-image.webp';
            }
          }}
        />
        {/* Overlay gradient en hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Contenido */}
      <div className="p-5 flex flex-col flex-grow">
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
        <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-base leading-tight group-hover:text-[#16a135] transition-colors" style={{ minHeight: '2.5rem' }}>
          {product.title}
        </h3>

      {/* Precio con fondo destacado */}
      <div className="mb-4">
        <div className="inline-block bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1.5 rounded-lg border-l-4 border-[#16a135]">
          <p className="text-base font-black text-green-700">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
      </div>

      {/* Píldoras verdes: Marca - Modelo */}
      <div className="flex flex-wrap gap-2 mb-4">
        {product.brand && (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-gray-200">
            <div className="w-1.5 h-1.5 rounded-full bg-[#16a135]"></div>
            {product.brand}
          </span>
        )}
        {product.model && (
          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-gray-200">
            <div className="w-1.5 h-1.5 rounded-full bg-[#16a135]"></div>
            {product.model}
          </span>
        )}
      </div>

        {/* Ubicación - Solo Provincia */}
        {product.province && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 bg-gray-50 px-3 py-2 rounded-lg">
            <MapPin className="w-4 h-4 text-[#16a135] flex-shrink-0" />
            <span className="line-clamp-1 font-medium">{product.province}</span>
          </div>
        )}

      {/* Botón Ver Detalles / Ver en Sitio */}
      <button
          onClick={handleClick}
          className="group/btn w-full bg-gradient-to-r from-[#16a135] to-[#138a2c] hover:from-[#138a2c] hover:to-[#0f7023] text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-between gap-2 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
        >
          <span className="flex items-center gap-2">
            Ver Detalles
          </span>
          <svg className="w-5 h-5 transition-transform duration-200 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

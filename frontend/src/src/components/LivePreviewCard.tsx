// ====================================================================
// LIVE PREVIEW CARD - Vista previa en tiempo real del aviso
// Se actualiza automáticamente al completar el formulario
// ====================================================================

import React from 'react';
import { MapPin, DollarSign, CheckCircle, Tag, Package } from 'lucide-react';

interface LivePreviewCardProps {
  formData: {
    title?: string;
    description?: string;
    price?: string;
    currency?: string;
    province?: string;
    locality?: string;
    photos?: string[];
    attributes?: Record<string, any>;
    category?: { display_name: string };
    subcategory?: { display_name: string };
  };
}

export const LivePreviewCard: React.FC<LivePreviewCardProps> = ({ formData }) => {
  const {
    title = '',
    description = '',
    price = '',
    currency = 'ARS',
    province = '',
    locality = '',
    photos = [],
    attributes = {},
    category,
    subcategory,
  } = formData;

  const formatPrice = (value: string, curr: string) => {
    if (!value || parseFloat(value) <= 0) return 'A consultar';
    const formatted = new Intl.NumberFormat('es-AR').format(parseFloat(value));
    return `${curr} $${formatted}`;
  };

  const hasContent = title || description || price || photos.length > 0 || province;
  const attributeCount = Object.keys(attributes).filter(key => attributes[key]).length;

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold opacity-90">Vista Previa</p>
            <p className="text-xs opacity-75">Así verán tu aviso</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {!hasContent ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Completá el formulario
            </p>
            <p className="text-xs text-gray-500">
              El preview se actualizará en tiempo real
            </p>
          </div>
        ) : (
          <>
            {/* Image */}
            {photos.length > 0 ? (
              <div className="relative aspect-[16/9] bg-gray-100 rounded-xl overflow-hidden">
                <img
                  src={photos[0]}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {photos.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {photos.length} fotos
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">Sin fotos aún</p>
                </div>
              </div>
            )}

            {/* Category Tags */}
            {(category || subcategory) && (
              <div className="flex flex-wrap gap-2">
                {category && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                    <Tag className="w-3 h-3" />
                    {category.display_name}
                  </span>
                )}
                {subcategory && (
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                    {subcategory.display_name}
                  </span>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
                {title || (
                  <span className="text-gray-400 italic">Escribe un título...</span>
                )}
              </h3>
            </div>

            {/* Price */}
            {price && parseFloat(price) > 0 && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(price, currency)}
                </p>
              </div>
            )}

            {/* Location */}
            {province && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="font-medium">
                  {province}{locality && `, ${locality}`}
                </span>
              </div>
            )}

            {/* Description Preview */}
            {description && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-700 line-clamp-3">
                  {description}
                </p>
              </div>
            )}

            {/* Attributes Count */}
            {attributeCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium">
                  {attributeCount} característica{attributeCount !== 1 ? 's' : ''} agregada{attributeCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          ✨ Los cambios se reflejan automáticamente
        </p>
      </div>
    </div>
  );
};

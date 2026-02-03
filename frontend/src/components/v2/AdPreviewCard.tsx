// ============================================================================
// AD PREVIEW CARD - Vista previa en tiempo real del aviso
// ============================================================================

import React from 'react';

interface AdPreviewCardProps {
  form: any;
  formData?: Record<string, any>;
}

export const AdPreviewCard: React.FC<AdPreviewCardProps> = ({ formData = {} }) => {

  // Extraer datos relevantes
  const title = formData.title || 'Título del aviso aparecerá aquí...';
  const description = formData.description || 'Complete el formulario para ver la descripción...';
  const price = formData.price || 0;
  const currency = formData.currency || 'ARS';
  const brand = formData.brand_name || formData.brand || '';
  const model = formData.model_name || formData.model || '';
  const year = formData.year || '';
  const city = formData.city || '';
  const province = formData.province || '';
  const tags = formData.tags || [];

  // Formatear precio
  const formatPrice = (value: number) => {
    if (!value || value === 0) return 'Consultar precio';
    const currencySymbol = currency === 'USD' ? 'US$' : '$';
    return `${currencySymbol} ${value.toLocaleString('es-AR')}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#16a135] text-white p-4 rounded-t-lg">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Vista Previa
        </h3>
        <p className="text-sm text-green-100 mt-1">Así se verá tu aviso en el listado</p>
      </div>

      {/* Card Preview */}
      <div className="bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
        {/* Imagen placeholder */}
        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 h-48 flex items-center justify-center">
          {brand && model ? (
            <div className="text-center">
              <div className="text-6xl mb-2">🚜</div>
              <p className="text-gray-600 font-medium">{brand}</p>
              <p className="text-gray-500 text-sm">{model}</p>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">La imagen aparecerá aquí</p>
            </div>
          )}
          
          {/* Badge de condición */}
          {formData.condition === 'nuevo' && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              ¡NUEVO!
            </div>
          )}
          {formData.condition === 'usado_excelente' && (
            <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              IMPECABLE
            </div>
          )}
        </div>

        {/* Contenido del card */}
        <div className="p-4">
          {/* Precio */}
          <div className="text-2xl font-bold text-green-600 mb-2">
            {formatPrice(price)}
          </div>

          {/* Título */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {title}
          </h3>

          {/* Descripción */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
            {description}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.slice(0, 4).map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 4 && (
                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                  +{tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Ubicación y año */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>
                {city && province ? `${city}, ${province}` : province || city || 'Ubicación'}
              </span>
            </div>
            {year && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{year}</span>
              </div>
            )}
          </div>

          {/* Botón acción */}
          <button className="w-full mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors">
            Ver Detalles
          </button>
        </div>
      </div>

      {/* Info adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <p className="text-blue-800 flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong>Esta es una vista previa</strong> de cómo se verá tu aviso en el listado. 
            Los usuarios verán la ficha técnica completa al hacer click en "Ver Detalles".
          </span>
        </p>
      </div>
    </div>
  );
};

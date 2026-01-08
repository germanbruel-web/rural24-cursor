/**
 * AdPreviewCard - Vista previa EXACTA de cómo quedará el aviso publicado
 * 
 * CLON 100% de AdDetail.tsx
 * Usado en: Wizard PublicarAviso (Step 6)
 * 
 * Garantiza WYSIWYG: What You See Is What You Get
 */

import React, { useState } from 'react';
import { MapPin, Calendar, Tag } from 'lucide-react';

export interface AdPreviewData {
  title: string;
  description: string;
  price?: number | null;
  currency: 'ARS' | 'USD';
  province: string;
  city?: string | null;
  images: Array<{ url: string; path?: string }>;
  category?: { id: string; name?: string; display_name?: string };
  subcategory?: { id: string; name?: string; display_name?: string };
  attributes?: Record<string, any>;
}

interface AdPreviewCardProps {
  data: AdPreviewData;
}

export const AdPreviewCard: React.FC<AdPreviewCardProps> = ({ data }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // DEBUGGING: Ver qué datos recibe el componente
  console.log('==============================================');
  console.log('🖼️ AdPreviewCard - Datos recibidos:');
  console.log('==============================================');
  console.log('📦 data completo:', data);
  console.log('📸 images:', data.images);
  console.log('📸 images length:', data.images?.length);
  console.log('📸 Primera imagen:', data.images?.[0]);
  console.log('🏷️ category:', data.category);
  console.log('🏷️ subcategory:', data.subcategory);
  console.log('==============================================');

  const hasImages = data.images && data.images.length > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Galería de imágenes - EXACTO A AdDetail */}
      {hasImages ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="relative aspect-video bg-gray-100">
            <img
              src={data.images[currentImageIndex].url}
              alt={`${data.title} - Imagen ${currentImageIndex + 1}`}
              className="w-full h-full object-contain"
              onError={(e) => {
                console.error('❌ Error cargando imagen:', data.images[currentImageIndex].url);
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="18"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
              }}
            />
            
            {data.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(prev => 
                    prev === 0 ? data.images.length - 1 : prev - 1
                  )}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => setCurrentImageIndex(prev => 
                    prev === data.images.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {data.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails - EXACTO A AdDetail */}
          {data.images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto">
              {data.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    index === currentImageIndex ? 'border-green-600' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Fallback cuando NO hay imágenes
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-yellow-900 mb-2">
            Sin imágenes para mostrar
          </p>
          <p className="text-sm text-yellow-700">
            Vuelve al Step 4 para subir imágenes
          </p>
        </div>
      )}

      {/* Información principal - EXACTO A AdDetail */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {/* Categoría */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Tag className="w-4 h-4" />
              <span>{data.category?.display_name || data.category?.name}</span>
              {data.subcategory && (
                <>
                  <span>›</span>
                  <span>{data.subcategory.display_name || data.subcategory.name}</span>
                </>
              )}
            </div>
            
            {/* Título */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2 break-words overflow-wrap">{data.title}</h1>
          </div>

          {/* Precio */}
          {data.price && (
            <div className="text-right">
              <div className="text-sm text-gray-600">Precio</div>
              <div className="text-3xl font-bold text-green-600">
                {data.currency === 'USD' ? 'USD ' : '$'}
                {data.price.toLocaleString('es-AR')}
              </div>
            </div>
          )}
        </div>

        {/* Ubicación y fecha */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>
              {data.province}
              {data.city && `, ${data.city}`}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Se publicará hoy</span>
          </div>
        </div>

        {/* Descripción */}
        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h2>
          <p className="text-gray-700 whitespace-pre-wrap break-words overflow-wrap">{data.description}</p>
        </div>
      </div>

      {/* Características técnicas - EXACTO A AdDetail */}
      {data.attributes && Object.keys(data.attributes).length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Características técnicas
          </h2>
          
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(data.attributes).map(([key, value]) => {
              if (!value && value !== 0 && value !== false) return null;

              let displayValue: string;
              if (Array.isArray(value)) {
                displayValue = value.join(', ');
              } else if (typeof value === 'boolean') {
                displayValue = value ? 'Sí' : 'No';
              } else {
                displayValue = String(value);
              }

              // Convertir slug a label legible
              const label = key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());

              return (
                <div key={key} className="border-b border-gray-200 pb-3">
                  <dt className="text-sm font-medium text-gray-600 mb-1">
                    {label}
                  </dt>
                  <dd className="text-base text-gray-900">
                    {displayValue}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}

      {/* Badge de confirmación - Solo en preview */}
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ¿Todo se ve bien?
            </h3>
            <p className="text-gray-700 mb-3">
              Así es como se verá tu aviso una vez publicado. Verifica que toda la información sea correcta.
            </p>
            <p className="text-sm text-gray-600">
              Haz clic en <strong>"PUBLICAR AVISO"</strong> para que tu aviso sea visible al público.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

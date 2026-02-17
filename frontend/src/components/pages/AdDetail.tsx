import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { getFieldsForAd, FieldConfig } from '../../config/adFieldsConfig';
import { getFieldsForSubcategory } from '../../services/formConfigService';
import { MapPin, Phone, Calendar, DollarSign, Tag } from 'lucide-react';
import { normalizeImages, type NormalizedImage } from '../../utils/imageHelpers';
import { ContactVendorButton } from '../ContactVendorButton';
import { UserFeaturedAdsBar } from '../sections/UserFeaturedAdsBar';

interface AdDetailProps {
  adId: string;
}

interface Ad {
  id: string;
  title: string;
  description: string;
  location: string;
  price?: number;
  phone: string;
  user_id: string; // ID del vendedor
  dynamic_fields: Record<string, any>;
  created_at: string;
  categories: { name: string; display_name: string };
  subcategories: { name: string; display_name: string };
  brands?: { display_name: string };
  models?: { display_name: string };
  operation_types: { display_name: string };
  images?: NormalizedImage[]; // Usar tipo normalizado
}

export const AdDetail: React.FC<AdDetailProps> = ({ adId }) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadAd();
  }, [adId]);

  const loadAd = async () => {
    try {
      // QUERY SIMPLIFICADO - Sin JOINs problemáticos
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', adId)
        .single();

      if (error) throw error;

      console.log('📦 Datos del aviso:', data);
      console.log('📸 Columna images raw:', data.images);
      console.log('📸 Tipo de images:', typeof data.images);
      console.log('📸 Es array?:', Array.isArray(data.images));

      // NORMALIZACIÓN DE IMÁGENES
      const normalizedImages = normalizeImages(data.images);
      console.log('🖼️ Imágenes normalizadas:', normalizedImages);
      console.log('🖼️ Primera imagen URL:', normalizedImages[0]?.url);

      // Obtener subcategoría y categoría por separado
      let subcategoryData = null;
      let categoryData = null;

      if (data.subcategory_id) {
        const { data: subcat } = await supabase
          .from('subcategories')
          .select('name, display_name, category_id')
          .eq('id', data.subcategory_id)
          .single();
        subcategoryData = subcat;

        if (subcat?.category_id) {
          const { data: cat } = await supabase
            .from('categories')
            .select('name, display_name')
            .eq('id', subcat.category_id)
            .single();
          categoryData = cat;
        }
      }

      setAd({
        ...data,
        images: normalizedImages,
        categories: categoryData,
        subcategories: subcategoryData
      });
    } catch (error) {
      console.error('Error al cargar aviso:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFieldValue = (field: FieldConfig, value: any) => {
    if (!value && value !== 0) return '—';

    switch (field.type) {
      case 'select':
      case 'radio':
        const option = field.options?.find(opt => opt.value === value);
        return option?.label || value;
      
      case 'checkbox':
        return value ? 'Sí' : 'No';
      
      case 'number':
        return field.unit ? `${value} ${field.unit}` : value;
      
      case 'tel':
        return (
          <a href={`tel:${value}`} className="text-brand-500 hover:underline">
            {value}
          </a>
        );
      
      case 'url':
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">
            {value}
          </a>
        );
      
      default:
        return value;
    }
  };

  const renderDynamicFields = () => {
    if (!ad) return null;

    const categoryName = ad.categories.name;
    const subcategoryName = ad.subcategories.name;
    
    // Intenta obtener fields desde backend (nueva implementación)
    // Si falla, usa getFieldsForAd hardcoded (fallback)
    const [fields, setFields] = useState<FieldConfig[]>([]);
    const [fieldsLoaded, setFieldsLoaded] = useState(false);

    useEffect(() => {
      const loadFields = async () => {
        try {
          // Primero intenta desde backend
          const dynamicFields = await getFieldsForSubcategory(ad.subcategory_id);
          setFields(dynamicFields);
          console.log('✅ Usando configuración de formulario desde backend');
        } catch (error) {
          // Fallback al hardcoded
          console.warn('⚠️ Fallback a configuración hardcoded:', error);
          const fallbackFields = getFieldsForAd(categoryName, subcategoryName);
          setFields(fallbackFields);
        } finally {
          setFieldsLoaded(true);
        }
      };
      
      loadFields();
    }, [ad.subcategory_id, categoryName, subcategoryName]);

    if (!fieldsLoaded) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      );
    }

    // Filtrar solo los campos dinámicos que tienen valor
    const dynamicFieldsToShow = fields.filter(field => {
      // Excluir campos universales que ya se muestran arriba
      const universalFields = ['title', 'description', 'location', 'price', 'phone', 'images'];
      if (universalFields.includes(field.name)) return false;

      // Excluir campos de selección de categoría/marca/modelo
      const catalogFields = ['operation_type_id', 'category_id', 'subcategory_id', 'brand_id', 'model_id'];
      if (catalogFields.includes(field.name)) return false;

      // Incluir si tiene valor en formData o dynamic_fields
      const value = ad[field.name as keyof Ad] || ad.dynamic_fields[field.name];
      return value !== undefined && value !== null && value !== '';
    });

    if (dynamicFieldsToShow.length === 0) return null;

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Características técnicas</h2>
        
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dynamicFieldsToShow.map(field => {
            const value = ad[field.name as keyof Ad] || ad.dynamic_fields[field.name];
            
            return (
              <div key={field.name} className="border-b border-gray-200 pb-3">
                <dt className="text-sm font-medium text-gray-600 mb-1">
                  {field.label}
                </dt>
                <dd className="text-base text-gray-900">
                  {renderFieldValue(field, value)}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Aviso no encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Galería de imágenes */}
      {ad.images && ad.images.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="relative aspect-video bg-gray-100">
            <img
              src={ad.images[currentImageIndex].url}
              alt={`${ad.title} - Imagen ${currentImageIndex + 1}`}
              className="w-full h-full object-contain"
            />
            
            {ad.images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(prev => 
                    prev === 0 ? ad.images!.length - 1 : prev - 1
                  )}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => setCurrentImageIndex(prev => 
                    prev === ad.images!.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {ad.images.map((_, index) => (
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

          {/* Thumbnails */}
          {ad.images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto">
              {ad.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    index === currentImageIndex ? 'border-brand-500' : 'border-gray-200'
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
      )}

      {/* Información principal */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Tag className="w-4 h-4" />
              <span>{ad.operation_types.display_name}</span>
              <span>›</span>
              <span>{ad.categories.display_name}</span>
              <span>›</span>
              <span>{ad.subcategories.display_name}</span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{ad.title}</h1>
            
            {(ad.brands || ad.models) && (
              <div className="text-lg text-gray-700">
                {ad.brands?.display_name} {ad.models?.display_name}
              </div>
            )}
          </div>

          {ad.price && (
            <div className="text-right">
              <div className="text-sm text-gray-600">Precio</div>
              <div className="text-3xl font-bold text-brand-500">
                ${ad.price.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{ad.location}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Publicado {new Date(ad.created_at).toLocaleDateString('es-AR')}</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{ad.description}</p>
        </div>
      </div>

      {/* Características técnicas */}
      {renderDynamicFields()}

      {/* Contacto */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Contacto</h2>
        
        <ContactVendorButton
          adId={ad.id}
          adOwnerId={ad.user_id}
          adTitle={ad.title}
          vendorPhone={ad.phone}
        />
      </div>

      {/* Avisos Destacados (Carrusel) */}
      <UserFeaturedAdsBar
        categoryId={(ad as any).category_id}
        className="mt-2"
      />
    </div>
  );
};

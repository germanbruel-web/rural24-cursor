import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { MapPin, Calendar, Tag } from 'lucide-react';
import { normalizeImages, type NormalizedImage } from '../../utils/imageHelpers';
import { ContactVendorButton } from '../ContactVendorButton';
import { UserFeaturedAdsBar } from '../sections/UserFeaturedAdsBar';
import { getFormForContext } from '../../services/v2/formsService';
import { getOptionListItemsForSelect } from '../../services/v2/optionListsService';
import type { CompleteFormV2, FormFieldV2 } from '../../types/v2';

interface AdDetailProps {
  adId: string;
}

interface Ad {
  id: string;
  title: string;
  description: string;
  location: string;
  price?: number;
  price_unit?: string;
  phone: string;
  user_id: string;
  category_id: string;
  subcategory_id?: string;
  operation_type_id?: string;
  attributes?: Record<string, any>;
  created_at: string;
  categories?: { name: string; display_name: string } | null;
  subcategories?: { name: string; display_name: string } | null;
  operation_types?: { display_name: string } | null;
  images?: NormalizedImage[];
}

// { option_list_id → { value → label } }
type OptionLabels = Record<string, Record<string, string>>;

export const AdDetail: React.FC<AdDetailProps> = ({ adId }) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [form, setForm] = useState<CompleteFormV2 | null>(null);
  const [optionLabels, setOptionLabels] = useState<OptionLabels>({});

  useEffect(() => {
    loadAd();
  }, [adId]);

  useEffect(() => {
    if (!ad) return;
    loadFormAndLabels(ad);
  }, [ad?.id]);

  // ── Carga principal del aviso ──────────────────────────────

  const loadAd = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', adId)
        .single();

      if (error) throw error;

      const normalizedImages = normalizeImages(data.images);

      // Cargar subcategoría, categoría y tipo de operación en paralelo
      const [subcatResult, opTypeResult] = await Promise.all([
        data.subcategory_id
          ? supabase
              .from('subcategories')
              .select('name, display_name, category_id')
              .eq('id', data.subcategory_id)
              .single()
          : Promise.resolve({ data: null }),
        data.operation_type_id
          ? supabase
              .from('operation_types')
              .select('display_name')
              .eq('id', data.operation_type_id)
              .single()
          : Promise.resolve({ data: null }),
      ]);

      let categoryData = null;
      if (subcatResult.data?.category_id) {
        const { data: cat } = await supabase
          .from('categories')
          .select('name, display_name')
          .eq('id', subcatResult.data.category_id)
          .single();
        categoryData = cat;
      }

      setAd({
        ...data,
        images: normalizedImages,
        categories: categoryData,
        subcategories: subcatResult.data ?? null,
        operation_types: opTypeResult.data ?? null,
      });
    } catch (err) {
      console.error('Error al cargar aviso:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Carga del formulario v2 y resolución de labels ─────────

  const loadFormAndLabels = async (loadedAd: Ad) => {
    const loadedForm = await getFormForContext(
      loadedAd.category_id,
      loadedAd.subcategory_id
    );
    setForm(loadedForm);

    if (!loadedForm) return;

    // Recopilar option_list_id únicos
    const listIds = [
      ...new Set(
        loadedForm.fields
          .filter((f) => f.option_list_id)
          .map((f) => f.option_list_id as string)
      ),
    ];

    const labels: OptionLabels = {};
    await Promise.all(
      listIds.map(async (listId) => {
        const items = await getOptionListItemsForSelect(listId);
        labels[listId] = Object.fromEntries(items.map((i) => [i.value, i.label]));
      })
    );
    setOptionLabels(labels);
  };

  // ── Resolución de label para un campo y su valor ───────────

  const resolveFieldValue = (field: FormFieldV2, value: any): string => {
    if (value === null || value === undefined || value === '') return '';

    if (field.field_type === 'checkbox') return value ? 'Sí' : 'No';

    const strValue = String(value);

    // Opciones estáticas del campo
    if (field.options?.length) {
      const opt = field.options.find((o) => o.value === strValue);
      return opt?.label ?? strValue;
    }

    // Catálogo centralizado
    if (field.option_list_id && optionLabels[field.option_list_id]) {
      return optionLabels[field.option_list_id][strValue] ?? strValue;
    }

    // Sufijo numérico (ej: "250 HP")
    if (field.field_type === 'number' && (field.metadata as any)?.suffix) {
      return `${strValue} ${(field.metadata as any).suffix}`;
    }

    return strValue;
  };

  // ── Segmento 2: secciones del template v2 ─────────────────

  const renderFormSections = () => {
    const attrs = ad?.attributes;

    if (!attrs || Object.keys(attrs).length === 0) return null;

    // Fallback genérico si no hay template v2
    if (!form) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Información adicional
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(attrs).map(([key, val]) =>
              val !== null && val !== '' ? (
                <div key={key} className="border-b border-gray-100 pb-3">
                  <dt className="text-sm font-medium text-gray-500 mb-1">{key}</dt>
                  <dd className="text-base text-gray-900">{String(val)}</dd>
                </div>
              ) : null
            )}
          </dl>
        </div>
      );
    }

    // Agrupar campos por sección, filtrar sólo los que tienen valor
    const sectionedBlocks = form.sections
      .map((section) => ({
        section,
        fields: form.fields
          .filter((f) => f.section_id === section.id)
          .filter((f) => {
            const val = attrs[f.field_name];
            return val !== null && val !== undefined && val !== '';
          })
          .sort((a, b) => a.display_order - b.display_order),
      }))
      .filter((b) => b.fields.length > 0);

    // Campos sin sección asignada
    const unsectioned = form.fields
      .filter((f) => !f.section_id)
      .filter((f) => {
        const val = attrs[f.field_name];
        return val !== null && val !== undefined && val !== '';
      });

    if (sectionedBlocks.length === 0 && unsectioned.length === 0) return null;

    const renderFieldRow = (field: FormFieldV2) => {
      const displayValue = resolveFieldValue(field, attrs[field.field_name]);
      if (!displayValue) return null;
      return (
        <div key={field.field_name} className="border-b border-gray-100 pb-3">
          <dt className="text-sm font-medium text-gray-500 mb-1">
            {field.field_label}
          </dt>
          <dd className="text-base text-gray-900">{displayValue}</dd>
        </div>
      );
    };

    return (
      <>
        {sectionedBlocks.map(({ section, fields }) => (
          <div key={section.id} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {section.label}
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(renderFieldRow)}
            </dl>
          </div>
        ))}
        {unsectioned.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Otros datos
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unsectioned.map(renderFieldRow)}
            </dl>
          </div>
        )}
      </>
    );
  };

  // ── Estados de carga / error ───────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
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

  // ── Render principal ───────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      {/* ── Segmento 1: Hero ─────────────────────────────────── */}

      {/* Galería */}
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
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === 0 ? ad.images!.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === ad.images!.length - 1 ? 0 : prev + 1
                    )
                  }
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

          {ad.images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto">
              {ad.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    index === currentImageIndex
                      ? 'border-brand-600'
                      : 'border-gray-200'
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
            {/* Breadcrumb */}
            <div className="flex items-center flex-wrap gap-1.5 text-sm text-gray-500 mb-2">
              <Tag className="w-4 h-4 flex-shrink-0" />
              {ad.operation_types && (
                <>
                  <span>{ad.operation_types.display_name}</span>
                  <span>›</span>
                </>
              )}
              {ad.categories && (
                <>
                  <span>{ad.categories.display_name}</span>
                  <span>›</span>
                </>
              )}
              {ad.subcategories && (
                <span>{ad.subcategories.display_name}</span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">{ad.title}</h1>
          </div>

          {/* Precio */}
          {ad.price ? (
            <div className="text-right ml-4">
              <div className="text-sm text-gray-500">Precio</div>
              <div className="text-3xl font-bold text-brand-600">
                ${ad.price.toLocaleString('es-AR')}
              </div>
              {ad.price_unit && (
                <div className="text-sm text-gray-500 mt-0.5">
                  por {ad.price_unit.replace(/-/g, ' ')}
                </div>
              )}
            </div>
          ) : (
            <div className="text-right ml-4">
              <div className="text-sm text-gray-500">Precio</div>
              <div className="text-xl font-semibold text-gray-400">A convenir</div>
            </div>
          )}
        </div>

        {/* Meta: ubicación y fecha */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
          {ad.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{ad.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>
              Publicado {new Date(ad.created_at).toLocaleDateString('es-AR')}
            </span>
          </div>
        </div>

        {/* Descripción */}
        {ad.description && (
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{ad.description}</p>
          </div>
        )}
      </div>

      {/* ── Segmento 2: Secciones del template v2 ────────────── */}
      {renderFormSections()}

      {/* ── Segmento 3: Contacto + Featured Bar ──────────────── */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Contacto</h2>
        <ContactVendorButton
          adId={ad.id}
          adOwnerId={ad.user_id}
          adTitle={ad.title}
          vendorPhone={ad.phone}
        />
      </div>

      <UserFeaturedAdsBar categoryId={ad.category_id} className="mt-2" />
    </div>
  );
};

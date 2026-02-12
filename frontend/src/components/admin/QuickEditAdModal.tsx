// ====================================================================
// QUICK EDIT AD MODAL - Editor Completo de Avisos
// Mobile First + Design System Rural24 + 3 Columnas
// ====================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Save,
  Loader,
  CheckCircle,
  AlertCircle,
  FileText,
  MapPin,
  Settings,
  Image as ImageIcon,
  Tag,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { notify } from '../../utils/notifications';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { PROVINCES, LOCALITIES_BY_PROVINCE } from '../../constants/locations';
import { DynamicFormLoader } from '../forms/DynamicFormLoader';
import { SimpleImageUploader, UploadedImage } from '../SimpleImageUploader/SimpleImageUploader';
import { useAuth } from '../../contexts/AuthContext';

interface QuickEditAdModalProps {
  adId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Category {
  id: string;
  name: string;
  display_name: string;
}

interface Subcategory {
  id: string;
  name: string;
  display_name: string;
  category_id: string;
}

interface AdData {
  id: string;
  title: string;
  description: string;
  price: number | null;
  price_negotiable: boolean;
  currency: string;
  province: string | null;
  location: string | null;
  status: string;
  category_id: string;
  subcategory_id: string;
  brand_id?: string;
  model_id?: string;
  year?: number;
  condition?: string;
  attributes: Record<string, any>;
  images: string[];
  user_id: string;
}

export const QuickEditAdModal: React.FC<QuickEditAdModalProps> = ({
  adId,
  onClose,
  onSuccess,
}) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ad, setAd] = useState<AdData | null>(null);
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  // Catálogo
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [province, setProvince] = useState('');
  const [locality, setLocality] = useState('');
  const [status, setStatus] = useState('active');
  
  // Categoría / Subcategoría
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [originalSubcategoryId, setOriginalSubcategoryId] = useState('');
  
  // Atributos dinámicos
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({});
  const [expandedAttrGroup, setExpandedAttrGroup] = useState<string>('');
  
  // Imágenes
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // Permisos: admin/superadmin puede editar otros
  const canEditOthers = profile?.role === 'admin' || profile?.role === 'superadmin';

  useEffect(() => {
    loadCatalog();
    loadAd();
  }, [adId]);

  // Filtrar subcategorías cuando cambia categoría
  useEffect(() => {
    if (categoryId) {
      setFilteredSubcategories(subcategories.filter(s => s.category_id === categoryId));
    } else {
      setFilteredSubcategories([]);
    }
  }, [categoryId, subcategories]);

  const loadCatalog = async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        supabase.from('categories').select('id, name, display_name').eq('is_active', true).order('sort_order'),
        supabase.from('subcategories').select('id, name, display_name, category_id').eq('is_active', true).order('sort_order'),
      ]);
      
      if (catRes.data) setCategories(catRes.data);
      if (subRes.data) setSubcategories(subRes.data);
    } catch (error) {
      console.error('Error cargando catálogo:', error);
    }
  };

  const loadAd = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', adId)
        .single();

      if (error) throw error;

      setAd(data);
      // Pre-llenar formulario
      setTitle(data.title || '');
      setDescription(data.description || '');
      setPrice(data.price ? String(data.price) : '');
      setPriceNegotiable(data.price_negotiable || false);
      setCurrency(data.currency || 'ARS');
      setProvince(data.province || '');
      setLocality(data.location || '');
      setStatus(data.status || 'active');
      
      // Categoría y Subcategoría
      setCategoryId(data.category_id || '');
      setSubcategoryId(data.subcategory_id || '');
      setOriginalSubcategoryId(data.subcategory_id || '');
      
      // Atributos
      setAttributeValues(data.attributes || {});
      
      // Imágenes - convertir a formato UploadedImage
      if (data.images && Array.isArray(data.images)) {
        const imgs: UploadedImage[] = data.images.map((img: any, idx: number) => ({
          url: typeof img === 'string' ? img : img.url,
          path: typeof img === 'string' ? img.split('/').pop() : img.path,
          status: 'success' as const,
          progress: 100,
          sortOrder: idx,
          isPrimary: idx === 0,
        }));
        setUploadedImages(imgs);
      }
    } catch (error) {
      console.error('Error cargando aviso:', error);
      notify.error('Error cargando datos del aviso');
    } finally {
      setLoading(false);
    }
  };

  // Handler para cambio de categoría (limpia atributos si cambia subcategoría)
  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId);
    // Si cambia categoría, resetear subcategoría y atributos
    if (newCategoryId !== categoryId) {
      setSubcategoryId('');
      trackFieldChange('category_id');
    }
  };

  const handleSubcategoryChange = (newSubcategoryId: string) => {
    setSubcategoryId(newSubcategoryId);
    trackFieldChange('subcategory_id');
    
    // Si cambió subcategoría, limpiar atributos incompatibles
    if (newSubcategoryId !== originalSubcategoryId) {
      setAttributeValues({});
      trackFieldChange('attributes');
    }
  };

  const handleAttributeChange = (name: string, value: any) => {
    setAttributeValues(prev => ({ ...prev, [name]: value }));
    trackFieldChange('attributes');
  };

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
    trackFieldChange('images');
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Preparar imágenes para guardar
      const imagesToSave = uploadedImages
        .filter(img => img.status === 'success' && img.url)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(img => img.url);

      const updateData: Record<string, any> = {
        title: title.trim(),
        description: description.trim(),
        price: priceNegotiable ? null : (price ? parseInt(price) : null),
        price_negotiable: priceNegotiable,
        currency,
        province,
        location: locality,
        status,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        attributes: attributeValues,
        images: imagesToSave,
      };

      const { error } = await supabase
        .from('ads')
        .update(updateData)
        .eq('id', adId);

      if (error) throw error;

      notify.success('Cambios guardados exitosamente');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error guardando cambios:', error);
      notify.error(error.message || 'Error guardando cambios');
    } finally {
      setSaving(false);
    }
  };

  const trackFieldChange = (fieldName: string) => {
    setModifiedFields(prev => new Set(prev).add(fieldName));
  };

  // Helpers
  const getCategoryName = () => categories.find(c => c.id === categoryId)?.display_name || '';
  const getSubcategoryName = () => subcategories.find(s => s.id === subcategoryId)?.display_name || '';

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
        <div className="bg-white rounded-xl p-6 text-center">
          <Loader className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!ad) {
    return null;
  }

  const hasChanges = modifiedFields.size > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1400px] my-4">
        {/* Header - Compacto */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Editar Aviso</h2>
              <p className="text-xs text-gray-500 hidden sm:block">
                {getCategoryName()} &gt; {getSubcategoryName()}
              </p>
            </div>
          </div>
          
          {hasChanges && (
            <div className="flex items-center gap-1.5 text-xs text-primary-700 bg-primary-50 px-2 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              {modifiedFields.size} cambio{modifiedFields.size > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Body - 3 columnas Mobile First */}
        <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[75vh] overflow-y-auto">
          
          {/* Columna 1: Info Básica + Categoría */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 pb-1.5 border-b-2 border-primary-500 uppercase tracking-wide">
              <FileText className="w-4 h-4 text-primary-600" />
              Información Básica
            </h3>

            {/* Categoría */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                <select
                  value={categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    modifiedFields.has('category_id') ? 'border-primary-500 ring-1 ring-primary-100' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.display_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Subcategoría</label>
                <select
                  value={subcategoryId}
                  onChange={(e) => handleSubcategoryChange(e.target.value)}
                  disabled={!categoryId}
                  className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 ${
                    modifiedFields.has('subcategory_id') ? 'border-primary-500 ring-1 ring-primary-100' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar...</option>
                  {filteredSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.display_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Título <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  trackFieldChange('title');
                }}
                placeholder="Título del aviso"
                maxLength={100}
                className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                  modifiedFields.has('title') ? 'border-primary-500 ring-1 ring-primary-100' : 'border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-400 mt-0.5 text-right">{title.length}/100</p>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Descripción <span className="text-error">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  trackFieldChange('description');
                }}
                rows={4}
                maxLength={2000}
                placeholder="Describe tu producto..."
                className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 resize-none ${
                  modifiedFields.has('description') ? 'border-primary-500 ring-1 ring-primary-100' : 'border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-400 mt-0.5 text-right">{description.length}/2000</p>
            </div>
          </div>

          {/* Columna 2: Ubicación + Precio + Atributos */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 pb-1.5 border-b-2 border-primary-500 uppercase tracking-wide">
              <Settings className="w-4 h-4 text-primary-600" />
              Detalles y Precio
            </h3>

            {/* Ubicación */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Provincia</label>
                <select
                  value={province}
                  onChange={(e) => {
                    setProvince(e.target.value);
                    if (locality) {
                      setLocality('');
                      trackFieldChange('location');
                    }
                    trackFieldChange('province');
                  }}
                  className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                    modifiedFields.has('province') ? 'border-primary-500 ring-1 ring-primary-100' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar...</option>
                  {PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Localidad</label>
                <select
                  value={locality}
                  onChange={(e) => {
                    setLocality(e.target.value);
                    trackFieldChange('location');
                  }}
                  disabled={!province}
                  className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 ${
                    modifiedFields.has('location') ? 'border-primary-500 ring-1 ring-primary-100' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar...</option>
                  {/* Mostrar localidad actual si no está en la lista */}
                  {locality && !LOCALITIES_BY_PROVINCE[province]?.includes(locality) && (
                    <option value={locality}>{locality}</option>
                  )}
                  {LOCALITIES_BY_PROVINCE[province]?.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Precio */}
            <div className="bg-gray-50 rounded-lg p-2">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={priceNegotiable}
                  onChange={(e) => {
                    setPriceNegotiable(e.target.checked);
                    trackFieldChange('price_negotiable');
                  }}
                  className="w-3.5 h-3.5 text-primary-600 rounded"
                />
                <span className="text-xs font-medium text-gray-600">A Convenir</span>
              </label>

              {!priceNegotiable && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={price}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setPrice(value);
                        trackFieldChange('price');
                      }}
                      placeholder="Precio"
                      className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                        modifiedFields.has('price') ? 'border-primary-500 ring-1 ring-primary-100' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => {
                      setCurrency(e.target.value as 'ARS' | 'USD');
                      trackFieldChange('currency');
                    }}
                    className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      modifiedFields.has('currency') ? 'border-primary-500 ring-1 ring-primary-100' : 'border-gray-300'
                    }`}
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              )}
            </div>

            {/* Atributos Dinámicos */}
            {subcategoryId && (
              <div className="border border-gray-200 rounded-lg p-2 bg-white">
                <h4 className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  Atributos Técnicos
                </h4>
                <div className="max-h-[250px] overflow-y-auto">
                  <DynamicFormLoader
                    subcategoryId={subcategoryId}
                    values={attributeValues}
                    onChange={handleAttributeChange}
                    expandedGroup={expandedAttrGroup}
                    onGroupToggle={setExpandedAttrGroup}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Columna 3: Estado + Imágenes */}
          <div className="space-y-3 md:col-span-2 lg:col-span-1">
            <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5 pb-1.5 border-b-2 border-primary-500 uppercase tracking-wide">
              <ImageIcon className="w-4 h-4 text-primary-600" />
              Estado y Fotos
            </h3>

            {/* Estado */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado del aviso</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  trackFieldChange('status');
                }}
                className={`w-full px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                  modifiedFields.has('status') ? 'border-primary-500 ring-1 ring-primary-100' : 'border-gray-300'
                }`}
              >
                <option value="active">Activo (visible)</option>
                <option value="paused">Pausado (oculto)</option>
                <option value="sold">Vendido</option>
                <option value="draft">Borrador</option>
              </select>
            </div>

            {/* Imágenes - Editor Completo */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Fotos ({uploadedImages.filter(i => i.status === 'success').length}/8)
              </label>
              <SimpleImageUploader
                maxFiles={8}
                folder="ads"
                onImagesChange={handleImagesChange}
                existingImages={uploadedImages}
              />
            </div>

            {/* Info del aviso */}
            <div className="bg-gray-50 rounded-lg p-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">ID:</span>
                <code className="text-gray-700 font-mono">{ad.id.slice(-8)}</code>
              </div>
              {ad.user_id !== profile?.id && canEditOthers && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Usuario:</span>
                  <span className="text-gray-700">{ad.user_id.slice(-8)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Compacto */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Cerrar
            </button>
            {hasChanges && (
              <button
                onClick={() => {
                  if (window.confirm('¿Descartar cambios sin guardar?')) {
                    loadAd();
                    setModifiedFields(new Set());
                  }
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Deshacer
              </button>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

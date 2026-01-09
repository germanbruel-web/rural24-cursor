// ====================================================================
// QUICK EDIT AD MODAL - Edición Rápida Inline
// Optimizado para usuarios expertos que necesitan cambios rápidos
// ====================================================================

import React, { useState, useEffect } from 'react';
import { X, Save, Loader, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { notify } from '../../utils/notifications';
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { PROVINCES, LOCALITIES_BY_PROVINCE } from '../../constants/locations';

interface QuickEditAdModalProps {
  adId: string;
  onClose: () => void;
  onSuccess: () => void;
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
}

export const QuickEditAdModal: React.FC<QuickEditAdModalProps> = ({
  adId,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ad, setAd] = useState<AdData | null>(null);
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [province, setProvince] = useState('');
  const [locality, setLocality] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    loadAd();
  }, [adId]);

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
    } catch (error) {
      console.error('Error cargando aviso:', error);
      notify.error('Error cargando datos del aviso');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const updateData = {
        title: title.trim(),
        description: description.trim(),
        price: priceNegotiable ? null : (price ? parseInt(price) : null),
        price_negotiable: priceNegotiable,
        currency,
        province,
        location: locality,
        status,
      };

      const { error } = await supabase
        .from('ads')
        .update(updateData)
        .eq('id', adId);

      if (error) throw error;

      notify.success('✅ Cambios guardados exitosamente');
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

  const openFullEditor = () => {
    onClose();
    window.location.hash = `#/publicar-v3?edit=${adId}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <Loader className="w-8 h-8 animate-spin text-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (!ad) {
    return null;
  }

  const hasChanges = modifiedFields.size > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edición Rápida</h2>
              <p className="text-sm text-gray-500 mt-1">
                Modificá los campos que necesites y guardá los cambios
              </p>
            </div>
          </div>
          
          {hasChanges && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
              <CheckCircle className="w-4 h-4" />
              {modifiedFields.size} cambio{modifiedFields.size > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Body - 3 columnas */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto">
          {/* Columna 1: Información Básica */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 pb-2 border-b border-green-500 uppercase tracking-wide">
              📝 Información Básica
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título <span className="text-red-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  trackFieldChange('title');
                }}
                placeholder="Título del aviso"
                maxLength={100}
                className={modifiedFields.has('title') ? 'border-green-500 ring-2 ring-green-100' : ''}
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  trackFieldChange('description');
                }}
                rows={6}
                maxLength={2000}
                placeholder="Describe tu producto..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  modifiedFields.has('description') ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/2000</p>
            </div>
          </div>

          {/* Columna 2: Ubicación y Precio */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 pb-2 border-b border-green-500 uppercase tracking-wide">
              📍 Ubicación y Precio
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provincia
              </label>
              <select
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  setLocality('');
                  trackFieldChange('province');
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                  modifiedFields.has('province') ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-300'
                }`}
              >
                <option value="">Seleccionar provincia</option>
                {PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            {province && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localidad
                </label>
                <select
                  value={locality}
                  onChange={(e) => {
                    setLocality(e.target.value);
                    trackFieldChange('locality');
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    modifiedFields.has('locality') ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar localidad</option>
                  {LOCALITIES_BY_PROVINCE[province]?.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={priceNegotiable}
                  onChange={(e) => {
                    setPriceNegotiable(e.target.checked);
                    trackFieldChange('price_negotiable');
                  }}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  A Convenir (sin precio fijo)
                </span>
              </label>
            </div>

            {!priceNegotiable && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio
                  </label>
                  <Input
                    type="text"
                    value={price}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setPrice(value);
                      trackFieldChange('price');
                    }}
                    placeholder="50000"
                    className={modifiedFields.has('price') ? 'border-green-500 ring-2 ring-green-100' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => {
                      setCurrency(e.target.value as 'ARS' | 'USD');
                      trackFieldChange('currency');
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      modifiedFields.has('currency') ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-300'
                    }`}
                  >
                    <option value="ARS">ARS $</option>
                    <option value="USD">USD $</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Columna 3: Estado y Fotos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 pb-2 border-b border-green-500 uppercase tracking-wide">
              ⚙️ Estado y Fotos
            </h3>

            {/* Fotos del aviso */}
            {ad.images && ad.images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotos ({ad.images.length})
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ad.images.slice(0, 4).map((img: any, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={typeof img === 'string' ? img : img.url}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                          Principal
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {ad.images.length > 4 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    +{ad.images.length - 4} fotos más
                  </p>
                )}
                <p className="text-xs text-blue-600 mt-2">
                  💡 Para cambiar fotos, usá el editor completo
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado del aviso
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  trackFieldChange('status');
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                  modifiedFields.has('status') ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-300'
                }`}
              >
                <option value="active">✅ Activo (visible)</option>
                <option value="paused">⏸️ Pausado (oculto)</option>
                <option value="sold">✔️ Vendido</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    ¿Necesitás cambios mayores?
                  </p>
                  <p className="text-xs text-blue-700 mb-3">
                    Para cambiar categoría, atributos técnicos o fotos, usá el editor completo.
                  </p>
                  <button
                    onClick={openFullEditor}
                    className="text-sm text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1"
                  >
                    Abrir Editor Completo
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <code className="text-gray-900 font-mono text-xs">{ad.id}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Categoría:</span>
                <span className="text-gray-900">{ad.category_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Imágenes:</span>
                <span className="text-gray-900">{ad.images?.length || 0} fotos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cerrar
            </button>
            {hasChanges && (
              <button
                onClick={() => {
                  if (window.confirm('¿Descartar cambios sin guardar?')) {
                    onClose();
                  }
                }}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
              >
                Descartar cambios
              </button>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            variant="primary"
            className="px-6"
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

/**
 * CreateFeaturedModal.tsx
 * Modal para que SuperAdmin destaque avisos sin consumir créditos
 * 
 * Features:
 * 1. Buscar avisos por título o ID
 * 2. Seleccionar tier (ALTO/MEDIO/BÁSICO)
 * 3. Seleccionar fecha de inicio
 * 4. Preview antes de confirmar
 * 5. Badge "SuperAdmin - Sin cargo"
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Calendar,
  Home,
  SearchIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  FileText,
  Star,
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { notify } from '../../utils/notifications';
import type { FeaturedPlacement } from '../../services/userFeaturedService';

interface Ad {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  category_name: string;
  subcategory_name?: string;
  user_name: string;
  image_url?: string;
}

interface CreateFeaturedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateFeaturedModal({ isOpen, onClose, onSuccess }: CreateFeaturedModalProps) {
  const [step, setStep] = useState<'search' | 'configure' | 'preview'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Ad[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  
  // Configuración
  const [placement, setPlacement] = useState<FeaturedPlacement>('homepage');
  const [scheduledStart, setScheduledStart] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  const [creating, setCreating] = useState(false);

  // Reset al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setStep('search');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedAd(null);
      setPlacement('homepage');
      setScheduledStart(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  // Buscar avisos
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      notify.warning('Ingresá un término de búsqueda');
      return;
    }

    setSearching(true);
    try {
      // Búsqueda simple sin joins para evitar problemas de RLS
      const { data, error } = await supabase
        .from('ads')
        .select('id, title, price, currency, category_id, subcategory_id, user_id')
        .or(`title.ilike.%${searchQuery}%,id.eq.${searchQuery}`)
        .eq('status', 'active')
        .limit(10);

      if (error) throw error;

      const formatted = (data || []).map((ad: any) => ({
        id: ad.id,
        title: ad.title,
        price: ad.price,
        currency: ad.currency || '$',
        category_name: 'Ver detalles',
        subcategory_name: undefined,
        user_name: 'Usuario',
      }));

      setSearchResults(formatted);

      if (formatted.length === 0) {
        notify.info('No se encontraron avisos activos');
      }
    } catch (error) {
      console.error('Error searching ads:', error);
      notify.error('Error al buscar avisos');
    } finally {
      setSearching(false);
    }
  };

  // Seleccionar aviso
  const handleSelectAd = (ad: Ad) => {
    setSelectedAd(ad);
    setStep('configure');
  };

  // Crear featured ad
  const handleCreate = async () => {
    if (!selectedAd) return;

    setCreating(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('No autenticado');

      const { data, error } = await supabase.rpc('create_featured_ad', {
        p_ad_id: selectedAd.id,
        p_user_id: user.user.id,
        p_placement: placement,
        p_scheduled_start: scheduledStart,
      });

      if (error) throw error;

      const result = data?.[0];
      if (!result?.success) {
        throw new Error(result?.error_message || 'Error al crear destacado');
      }

      notify.success(result.error_message || 'Aviso destacado exitosamente');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating featured ad:', error);
      notify.error(error.message || 'Error al destacar aviso');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-emerald-50">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Destacar Nuevo Aviso
              </h2>
              <p className="text-sm text-emerald-600 font-medium">
                SuperAdmin - Sin consumir créditos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className={`${step === 'search' ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
              1. Buscar Aviso
            </span>
            <span className="text-gray-300">→</span>
            <span className={`${step === 'configure' ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
              2. Configurar
            </span>
            <span className="text-gray-300">→</span>
            <span className={`${step === 'preview' ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
              3. Confirmar
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'search' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Buscar por título o ID del aviso..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {searching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <SearchIcon className="w-5 h-5" />
                      Buscar
                    </>
                  )}
                </button>
              </div>

              {/* Resultados */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 font-medium">
                    {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}:
                  </p>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {searchResults.map((ad) => (
                      <button
                        key={ad.id}
                        onClick={() => handleSelectAd(ad)}
                        className="w-full p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left"
                      >
                        <h3 className="font-medium text-gray-900 mb-1">{ad.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>{ad.price ? `${ad.currency} ${ad.price.toLocaleString()}` : 'Sin precio'}</span>
                          <span>•</span>
                          <span>{ad.category_name}</span>
                          <span>•</span>
                          <span>{ad.user_name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'configure' && selectedAd && (
            <div className="space-y-6">
              {/* Aviso seleccionado */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Aviso seleccionado</p>
                <h3 className="font-medium text-gray-900">{selectedAd.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedAd.category_name} {selectedAd.subcategory_name && `→ ${selectedAd.subcategory_name}`}
                </p>
              </div>

              {/* Placement — 3 tiers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Nivel de Destacado
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPlacement('homepage')}
                    className={`p-4 border-2 rounded-lg transition-all ${placement === 'homepage' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Home className={`w-6 h-6 mx-auto mb-2 ${placement === 'homepage' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <p className={`font-bold text-sm ${placement === 'homepage' ? 'text-emerald-900' : 'text-gray-700'}`}>ALTO</p>
                    <p className="text-[10px] text-gray-500 mt-1">Inicio + Resultados + Detalle</p>
                  </button>
                  <button
                    onClick={() => setPlacement('results')}
                    className={`p-4 border-2 rounded-lg transition-all ${placement === 'results' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <SearchIcon className={`w-6 h-6 mx-auto mb-2 ${placement === 'results' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <p className={`font-bold text-sm ${placement === 'results' ? 'text-emerald-900' : 'text-gray-700'}`}>MEDIO</p>
                    <p className="text-[10px] text-gray-500 mt-1">Resultados + Detalle</p>
                  </button>
                  <button
                    onClick={() => setPlacement('detail')}
                    className={`p-4 border-2 rounded-lg transition-all ${placement === 'detail' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <FileText className={`w-6 h-6 mx-auto mb-2 ${placement === 'detail' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <p className={`font-bold text-sm ${placement === 'detail' ? 'text-emerald-900' : 'text-gray-700'}`}>BÁSICO</p>
                    <p className="text-[10px] text-gray-500 mt-1">Solo en detalle</p>
                  </button>
                </div>
              </div>

              {/* Fecha de inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Duración: 15 días (según configuración global)
                </p>
              </div>

              {/* Badge informativo */}
              <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-emerald-900">SuperAdmin - Sin cargo</p>
                  <p className="text-emerald-700 mt-1">
                    Este destacado NO consumirá créditos del usuario ni afectará la facturación.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && selectedAd && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Confirmar Destacado
                </h3>
                <p className="text-gray-600">
                  Estás por destacar este aviso como SuperAdmin
                </p>
              </div>

              {/* Resumen */}
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Aviso</p>
                  <p className="font-medium text-gray-900">{selectedAd.title}</p>
                </div>
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Nivel</p>
                  <p className="font-medium text-gray-900">
                    {placement === 'homepage' ? 'Destacado ALTO (Inicio + Resultados + Detalle)' : placement === 'results' ? 'Destacado MEDIO (Resultados + Detalle)' : 'Destacado BÁSICO (Solo detalle)'}
                  </p>
                </div>
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Fecha de inicio</p>
                  <p className="font-medium text-gray-900">
                    {new Date(scheduledStart).toLocaleDateString('es-AR', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Costo</p>
                  <p className="font-medium text-emerald-600">Sin cargo (SuperAdmin)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            {step !== 'search' && (
              <button
                onClick={() => {
                  if (step === 'configure') setStep('search');
                  if (step === 'preview') setStep('configure');
                }}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Volver
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            {step === 'configure' && (
              <button
                onClick={() => setStep('preview')}
                className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors"
              >
                Continuar →
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-6 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Destacar Aviso
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

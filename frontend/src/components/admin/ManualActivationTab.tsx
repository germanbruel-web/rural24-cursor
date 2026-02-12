/**
 * ManualActivationTab.tsx
 * ⚠️ OBSOLETO (12-Feb-2026): Funcionalidad movida al tab "Destacados" con CreateFeaturedModal
 * 
 * [DEPRECADO] Tab para que SuperAdmin active featured ads manualmente SIN consumir créditos
 * Reemplazado por: CreateFeaturedModal.tsx que usa RPC create_featured_ad con detección de role='superadmin'
 * Este archivo se mantiene solo por referencia histórica.
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Star,
  Calendar,
  Home,
  Search as SearchIcon,
  Info,
  User,
  Tag,
  Sparkles
} from 'lucide-react';
import {
  manualActivateFeatured,
  type ManualActivationParams
} from '../../services/adminFeaturedService';
import { supabase } from '../../services/supabaseClient';
import type { FeaturedPlacement } from '../../services/userFeaturedService';

interface Ad {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  user_id: string;
  status: string;
  price: number;
  currency: string;
  images: any[];
  // JOINs
  category_name?: string;
  user_email?: string;
  user_full_name?: string;
}

const PLACEMENT_OPTIONS: { value: FeaturedPlacement; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'homepage',
    label: 'Homepage',
    description: 'Aparece en la sección destacada del inicio (max 10 por categoría)',
    icon: <Home className="w-5 h-5" />
  },
  {
    value: 'results',
    label: 'Resultados de Búsqueda',
    description: 'Primero cuando buscan en esa categoría (max 4 globales)',
    icon: <SearchIcon className="w-5 h-5" />
  },
  {
    value: 'detail',
    label: 'Página de Detalle',
    description: 'Avisos relacionados en detalle de otro aviso (max 6)',
    icon: <Star className="w-5 h-5" />
  }
];

export default function ManualActivationTab() {
  // Estados de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Ad[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Estados del formulario
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [placement, setPlacement] = useState<FeaturedPlacement>('homepage');
  const [scheduledStart, setScheduledStart] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [durationDays, setDurationDays] = useState(15);
  const [reason, setReason] = useState('');

  // Estados de envío
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotsInfo, setSlotsInfo] = useState<string | null>(null);

  // Búsqueda de avisos
  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      // Buscar por ID o título
      let query = supabase
        .from('ads')
        .select(`
          id, title, slug, category_id, user_id, status, price, currency, images,
          categories:category_id (name),
          users:user_id (email, full_name)
        `)
        .eq('status', 'active')
        .limit(10);

      // Si parece un UUID, buscar por ID exacto
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(searchQuery)) {
        query = query.eq('id', searchQuery);
      } else {
        // Buscar por título (case insensitive)
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error: searchError } = await query;

      if (searchError) throw searchError;

      // Transformar resultados
      const transformed = (data || []).map((ad: any) => ({
        ...ad,
        category_name: ad.categories?.name || 'Sin categoría',
        user_email: ad.users?.email || 'N/A',
        user_full_name: ad.users?.full_name || 'Usuario'
      }));

      setSearchResults(transformed);
      setShowResults(true);
    } catch (err: any) {
      console.error('❌ Error buscando avisos:', err);
      setError('Error al buscar avisos');
    } finally {
      setSearching(false);
    }
  };

  // Seleccionar aviso
  const handleSelectAd = (ad: Ad) => {
    setSelectedAd(ad);
    setShowResults(false);
    setSearchQuery(ad.title);
    setSuccess(false);
    setError(null);
  };

  // Limpiar selección
  const handleClearSelection = () => {
    setSelectedAd(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setSuccess(false);
    setError(null);
    setSlotsInfo(null);
  };

  // Activar featured manual
  const handleActivate = async () => {
    if (!selectedAd) {
      setError('Debes seleccionar un aviso');
      return;
    }

    if (!reason.trim()) {
      setError('Debes proporcionar un motivo para la activación manual');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const params: ManualActivationParams = {
        ad_id: selectedAd.id,
        placement,
        scheduled_start: scheduledStart,
        duration_days: durationDays,
        reason: reason.trim()
      };

      const result = await manualActivateFeatured(params);

      if (result.success) {
        setSuccess(true);
        setSlotsInfo(
          `✅ Featured activado. Slots restantes: ${result.slots_remaining || 'N/A'}`
        );

        // Limpiar formulario después de 3 segundos
        setTimeout(() => {
          handleClearSelection();
          setReason('');
        }, 3000);
      } else {
        setError(result.error || 'Error al activar featured');
      }
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Error al activar featured');
    } finally {
      setSubmitting(false);
    }
  };

  // Efecto para búsqueda automática (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2 && !selectedAd) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-emerald-600" />
          <h3 className="text-xl font-bold text-gray-900">
            Activación Manual de Featured
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Destaca avisos manualmente <strong>SIN consumir créditos</strong> del usuario.
          Útil para promociones especiales, clientes VIP o casos excepcionales.
        </p>
      </div>

      {/* Paso 1: Buscar Aviso */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-emerald-600" />
          1. Buscar Aviso
        </h4>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowResults(true);
            }}
            placeholder="Buscar por ID o título del aviso..."
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            disabled={selectedAd !== null}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {searching ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Resultados de búsqueda */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {searchResults.map((ad) => (
                <button
                  key={ad.id}
                  onClick={() => handleSelectAd(ad)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Imagen */}
                    {ad.images && ad.images[0] ? (
                      <img
                        src={ad.images[0]}
                        alt={ad.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <Star className="w-6 h-6 text-gray-400" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {ad.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        <Tag className="w-3 h-3 inline mr-1" />
                        {ad.category_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        <User className="w-3 h-3 inline mr-1" />
                        {ad.user_full_name} ({ad.user_email})
                      </p>
                    </div>

                    {/* Precio */}
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
                        {ad.currency} {ad.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 uppercase">
                        {ad.status}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Aviso seleccionado */}
        {selectedAd && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-emerald-800">
                ✅ Aviso Seleccionado
              </p>
              <button
                onClick={handleClearSelection}
                className="text-sm text-emerald-700 hover:text-emerald-900 underline"
              >
                Cambiar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Título:</span>
                <p className="font-medium text-gray-900 truncate">
                  {selectedAd.title}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Categoría:</span>
                <p className="font-medium text-gray-900">
                  {selectedAd.category_name}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Usuario:</span>
                <p className="font-medium text-gray-900 truncate">
                  {selectedAd.user_full_name}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium text-gray-900 text-xs truncate">
                  {selectedAd.user_email}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Paso 2: Configuración */}
      {selectedAd && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-emerald-600" />
            2. Configurar Destacado
          </h4>

          <div className="space-y-4">
            {/* Placement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación del Destacado *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PLACEMENT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPlacement(option.value)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      placement === option.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {option.icon}
                      <span className="font-semibold text-gray-900">
                        {option.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Fecha y Duración */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración (días) *
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={7}>7 días</option>
                  <option value={14}>14 días</option>
                  <option value={15}>15 días</option>
                  <option value={21}>21 días</option>
                  <option value={28}>28 días</option>
                  <option value={30}>30 días</option>
                </select>
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo de Activación Manual *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Promoción especial día del campo, Cliente VIP, Acuerdo comercial, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este motivo se registrará en la auditoría del sistema
              </p>
            </div>

            {/* Info de slots */}
            {slotsInfo && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">{slotsInfo}</p>
              </div>
            )}

            {/* Alertas */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-800">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-green-800">
                    ¡Activación Exitosa!
                  </p>
                  <p className="text-sm text-green-700">
                    El aviso fue destacado sin consumir créditos del usuario
                  </p>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleClearSelection}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                onClick={handleActivate}
                disabled={submitting || !selectedAd || !reason.trim()}
                className="flex-1 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Activando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Activar sin Crédito
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Información Importante</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Los featured manuales <strong>NO consumen créditos</strong> del usuario</li>
              <li>Se registran en auditoría con el motivo proporcionado</li>
              <li>Respetan los límites de slots por ubicación</li>
              <li>Pueden programarse para fecha futura o iniciar inmediatamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

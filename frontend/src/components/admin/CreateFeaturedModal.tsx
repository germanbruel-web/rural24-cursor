/**
 * CreateFeaturedModal.tsx
 * SuperAdmin — Destacar un aviso individual con sistema de TIERS.
 * Usa manualActivateFeatured (misma ruta que BulkVisibilityModal)
 * para evitar ambigüedad en RPC create_featured_ad.
 */

import { useState, useEffect } from 'react';
import {
  X,
  Search,
  Loader2,
  Shield,
  Zap,
  Star,
  TrendingDown,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { notify } from '../../utils/notifications';
import { manualActivateFeatured } from '../../services/adminFeaturedService';

type Tier = 'alta' | 'media' | 'baja';

const TIER_OPTIONS: Array<{
  value: Tier;
  label: string;
  description: string;
  placements: string[];
  icon: React.ReactNode;
  border: string;
  badge: string;
}> = [
  {
    value: 'alta',
    label: 'ALTA',
    description: 'Homepage · Resultados · Detalle',
    placements: ['homepage', 'results', 'detail'],
    icon: <Zap className="w-4 h-4" />,
    border: 'border-amber-400 bg-amber-50',
    badge: 'bg-amber-500 text-white',
  },
  {
    value: 'media',
    label: 'MEDIA',
    description: 'Homepage · Resultados',
    placements: ['homepage', 'results'],
    icon: <Star className="w-4 h-4" />,
    border: 'border-blue-400 bg-blue-50',
    badge: 'bg-blue-500 text-white',
  },
  {
    value: 'baja',
    label: 'BAJA',
    description: 'Solo Detalle del aviso',
    placements: ['detail'],
    icon: <TrendingDown className="w-4 h-4" />,
    border: 'border-gray-300 bg-gray-50',
    badge: 'bg-gray-500 text-white',
  },
];

interface SearchAd {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  category_name: string;
}

interface PreSelectedAd {
  id: string;
  title: string;
  price?: number | null;
  currency?: string;
  category_name?: string;
  [key: string]: any;
}

interface CreateFeaturedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preSelectedAd?: PreSelectedAd;
}

export default function CreateFeaturedModal({
  isOpen,
  onClose,
  onSuccess,
  preSelectedAd,
}: CreateFeaturedModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchAd[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedAd, setSelectedAd] = useState<SearchAd | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [scheduledStart, setScheduledStart] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [durationDays, setDurationDays] = useState(15);
  const [submitting, setSubmitting] = useState(false);

  // Preselected ad (desde AllAdsTab al tocar estrellita)
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedTier(null);
      setScheduledStart(new Date().toISOString().split('T')[0]);
      setDurationDays(15);
      setSubmitting(false);
      if (preSelectedAd) {
        setSelectedAd({
          id: preSelectedAd.id,
          title: preSelectedAd.title,
          price: preSelectedAd.price ?? null,
          currency: preSelectedAd.currency ?? 'ARS',
          category_name: preSelectedAd.category_name ?? '',
        });
      } else {
        setSelectedAd(null);
      }
    }
  }, [isOpen, preSelectedAd]);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let query = supabase
        .from('ads')
        .select('id, title, price, currency')
        .eq('status', 'active')
        .limit(10);

      if (uuidRegex.test(q)) {
        query = query.eq('id', q);
      } else {
        query = query.ilike('title', `%${q}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setSearchResults(
        (data || []).map((a: any) => ({
          id: a.id,
          title: a.title,
          price: a.price,
          currency: a.currency || 'ARS',
          category_name: '',
        }))
      );
    } catch {
      notify.error('Error al buscar avisos');
    } finally {
      setSearching(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedAd || !selectedTier) return;
    const tierOption = TIER_OPTIONS.find((t) => t.value === selectedTier)!;

    setSubmitting(true);
    let ok = 0;
    let fail = 0;

    for (const placement of tierOption.placements) {
      const result = await manualActivateFeatured({
        ad_id: selectedAd.id,
        placement: placement as any,
        tier: selectedTier,
        scheduled_start: scheduledStart,
        duration_days: durationDays,
        reason: `SuperAdmin — tier ${selectedTier.toUpperCase()}`,
      });
      if (result.success) ok++;
      else fail++;
    }

    setSubmitting(false);

    if (ok > 0) {
      notify.success(`Aviso destacado en ${ok} placement${ok > 1 ? 's' : ''} ✓`);
      onSuccess();
    } else {
      notify.error('No se pudo destacar el aviso');
    }
  };

  if (!isOpen) return null;

  const tierOption = TIER_OPTIONS.find((t) => t.value === selectedTier);
  const canConfirm = !!selectedAd && !!selectedTier;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-900">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">Destacar Aviso</h2>
              <p className="text-xs text-gray-400">SuperAdmin · Sin cargo al usuario</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-700 text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Búsqueda (solo si no hay preseleccionado) */}
          {!preSelectedAd && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aviso a destacar
              </label>
              {selectedAd ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{selectedAd.title}</p>
                    <p className="text-xs text-gray-500">{selectedAd.currency} {selectedAd.price?.toLocaleString() ?? '—'}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedAd(null); setSearchResults([]); }}
                    className="text-xs text-gray-400 hover:text-gray-700 underline"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Título o ID del aviso..."
                        className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={searching || !searchQuery.trim()}
                      className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:bg-gray-200 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Buscar
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2 border rounded-xl overflow-hidden divide-y max-h-48 overflow-y-auto">
                      {searchResults.map((ad) => (
                        <button
                          key={ad.id}
                          onClick={() => setSelectedAd(ad)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-900 truncate">{ad.title}</p>
                          <p className="text-xs text-gray-400 font-mono">{ad.id}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Aviso preseleccionado */}
          {preSelectedAd && selectedAd && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">Aviso</p>
              <p className="font-semibold text-gray-900 text-sm">{selectedAd.title}</p>
              {selectedAd.price && (
                <p className="text-xs text-gray-500">{selectedAd.currency} {selectedAd.price.toLocaleString()}</p>
              )}
            </div>
          )}

          {/* Selector de Tier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de visibilidad</label>
            <div className="grid grid-cols-3 gap-2">
              {TIER_OPTIONS.map((option) => {
                const selected = selectedTier === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedTier(option.value)}
                    className={`border-2 rounded-xl p-3 text-left transition-all ${
                      selected ? option.border : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${option.badge}`}>
                        {option.icon}
                        {option.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight">{option.description}</p>
                    {selected && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 mt-1.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fecha inicio</label>
              <input
                type="date"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duración</label>
              <div className="flex gap-2">
                {[15, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDurationDays(d)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      durationDays === d
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen + Confirmar */}
          {canConfirm && tierOption && (
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Tier <strong>{selectedTier?.toUpperCase()}</strong> · {tierOption.placements.length} placement{tierOption.placements.length > 1 ? 's' : ''} · {durationDays} días
              </span>
              <span className="text-emerald-600 font-semibold">Sin cargo</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting || !canConfirm}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Aplicando...</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> Destacar aviso</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

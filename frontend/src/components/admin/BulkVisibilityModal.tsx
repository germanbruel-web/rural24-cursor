/**
 * BulkVisibilityModal — SuperAdmin ONLY
 * Destacado masivo (o individual) usando sistema de TIERS.
 * Soporta:
 *  - Modo bulk: lista de avisos con checkboxes
 *  - Modo single: preSelectedAd cargado desde AllAdsTab (botón Destacar por fila)
 *  - Duración en días (15/30) o minutos (8/10/30/40/50/60) con input libre
 *  - force_reactivate: sobreescribe destacados activos sin duplicar
 */
import { useMemo, useState, type ReactNode } from 'react';
import { X, Check, Zap, Star, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import type { Ad } from '../../../types';
import { manualActivateFeatured } from '../../services/adminFeaturedService';

type Tier = 'alta' | 'media' | 'baja';
type DurationUnit = 'dias' | 'minutos';

interface TierOption {
  value: Tier;
  label: string;
  description: string;
  placements: string[];
  icon: ReactNode;
  color: string;
  border: string;
}

const TIER_OPTIONS: TierOption[] = [
  {
    value: 'alta',
    label: 'ALTA',
    description: 'Homepage + Resultados + Detalle',
    placements: ['homepage', 'results', 'detail'],
    icon: <Zap className="w-4 h-4" />,
    color: 'bg-amber-500 text-white',
    border: 'border-amber-400 bg-amber-50',
  },
  {
    value: 'media',
    label: 'MEDIA',
    description: 'Homepage + Resultados',
    placements: ['homepage', 'results'],
    icon: <Star className="w-4 h-4" />,
    color: 'bg-blue-500 text-white',
    border: 'border-blue-400 bg-blue-50',
  },
  {
    value: 'baja',
    label: 'BAJA',
    description: 'Solo Detalle del aviso',
    placements: ['detail'],
    icon: <TrendingDown className="w-4 h-4" />,
    color: 'bg-gray-500 text-white',
    border: 'border-gray-300 bg-gray-50',
  },
];

const MIN_PRESETS = [8, 10, 30, 40, 50, 60];
const DAY_PRESETS = [15, 30];

interface FeaturedInfo {
  featured_id: string;
  placement: string;
  status: string;
  expires_at?: string;
}

export interface PreSelectedAd {
  id: string;
  title: string;
}

interface BulkVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  ads: Ad[];
  featuredMap: Record<string, FeaturedInfo[]>;
  onApplied: () => void;
  preSelectedAd?: PreSelectedAd | null;
}

export default function BulkVisibilityModal({
  isOpen,
  onClose,
  ads,
  featuredMap,
  onApplied,
  preSelectedAd,
}: BulkVisibilityModalProps) {
  const isSingleMode = !!preSelectedAd;

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    preSelectedAd ? [preSelectedAd.id] : []
  );
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [scheduledStart, setScheduledStart] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('dias');
  const [durationValue, setDurationValue] = useState<number>(15);
  const [forceReactivate, setForceReactivate] = useState(false);
  const [reason, setReason] = useState<string>('Asignación manual SuperAdmin');
  const [submitting, setSubmitting] = useState(false);
  const [resultText, setResultText] = useState<string>('');

  // Sincronizar preSelectedAd cuando cambia (modal reutilizado)
  const prevPreSelected = useMemo(() => preSelectedAd?.id, [preSelectedAd]);
  useMemo(() => {
    if (preSelectedAd) setSelectedIds([preSelectedAd.id]);
  }, [prevPreSelected]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectableAds = useMemo(
    () => ads.filter((ad) => ad.status === 'active'),
    [ads]
  );

  const toggleId = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = () => {
    if (selectedIds.length === selectableAds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableAds.map((a) => a.id));
    }
  };

  const tierOption = TIER_OPTIONS.find((t) => t.value === selectedTier);

  const applyBulk = async () => {
    if (selectedIds.length === 0 || !selectedTier || !tierOption) return;
    setSubmitting(true);
    setResultText('');

    let ok = 0;
    let fail = 0;
    let skipped = 0;

    for (const adId of selectedIds) {
      const current = featuredMap[adId] || [];
      const activePlacements = new Set(current.map((f) => f.placement));

      for (const placement of tierOption.placements) {
        if (!forceReactivate && activePlacements.has(placement)) {
          skipped += 1;
          continue;
        }

        const result = await manualActivateFeatured({
          ad_id: adId,
          placement: placement as 'homepage' | 'results' | 'detail',
          tier: selectedTier,
          scheduled_start: scheduledStart,
          duration_days: durationUnit === 'dias' ? durationValue : 1,
          duration_minutes: durationUnit === 'minutos' ? durationValue : undefined,
          force_reactivate: forceReactivate,
          reason: `[${selectedTier.toUpperCase()}] ${reason}`,
        });

        if (result.success) ok += 1;
        else fail += 1;
      }
    }

    setSubmitting(false);
    setResultText(`Aplicados: ${ok} | Fallidos: ${fail} | Omitidos (ya activos): ${skipped}`);
    onApplied();
  };

  if (!isOpen) return null;

  const canApply = selectedIds.length > 0 && selectedTier !== null;
  const durationLabel = durationUnit === 'dias'
    ? `${durationValue} día${durationValue !== 1 ? 's' : ''}`
    : `${durationValue} min`;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
      <div className={`w-full bg-white rounded-2xl shadow-2xl overflow-hidden ${isSingleMode ? 'max-w-2xl' : 'max-w-5xl'}`}>
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-900">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isSingleMode ? 'Destacar Aviso' : 'Destacar Avisos — Bulk'}
            </h3>
            <p className="text-xs text-gray-400">Solo SuperAdmin · Sin cargo al usuario</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-700 text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Single-mode: aviso info */}
        {isSingleMode && preSelectedAd && (
          <div className="px-5 pt-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">Aviso</p>
              <p className="font-semibold text-gray-900 text-sm">{preSelectedAd.title}</p>
            </div>
          </div>
        )}

        <div className={`grid gap-4 p-4 ${isSingleMode ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-3'}`}>
          {/* Col 1 — Avisos (solo bulk mode) */}
          {!isSingleMode && (
            <div className="border rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-emerald-600 text-white font-bold flex items-center justify-between">
                <span>1. Avisos ({selectedIds.length}/{selectableAds.length})</span>
                <button
                  onClick={toggleAll}
                  className="text-xs underline opacity-80 hover:opacity-100"
                >
                  {selectedIds.length === selectableAds.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
              </div>
              <div className="max-h-[360px] overflow-y-auto p-3 space-y-1.5">
                {selectableAds.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No hay avisos activos disponibles
                  </p>
                )}
                {selectableAds.map((ad) => {
                  const isChecked = selectedIds.includes(ad.id);
                  const hasFeatured = (featuredMap[ad.id] || []).length > 0;
                  return (
                    <label
                      key={ad.id}
                      className={`flex items-start gap-2 border rounded-lg p-2 cursor-pointer transition-colors ${
                        isChecked ? 'bg-emerald-50 border-emerald-300' : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleId(ad.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{ad.title}</p>
                        <p className="text-xs text-gray-400 truncate">{(ad as any).category || 'Sin categoría'}</p>
                        {hasFeatured && (
                          <span className="text-xs text-amber-600 font-medium">⚡ Ya tiene destacado</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Col 2 — Tier + Duración */}
          <div className="border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-blue-600 text-white font-bold">
              {isSingleMode ? '1.' : '2.'} Nivel de Visibilidad
            </div>
            <div className="p-3 space-y-2">
              {TIER_OPTIONS.map((option) => {
                const selected = selectedTier === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedTier(option.value)}
                    className={`w-full text-left border-2 rounded-xl p-3 transition-all ${
                      selected ? option.border + ' border-2' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${option.color}`}>
                        {option.icon}
                        {option.label}
                      </span>
                      {selected && <Check className="w-4 h-4 text-emerald-600 ml-auto" />}
                    </div>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </button>
                );
              })}

              {/* Fecha inicio */}
              <div className="pt-3 border-t space-y-2">
                <label className="block text-xs font-medium text-gray-600">Fecha inicio</label>
                <input
                  type="date"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="w-full border rounded-sm px-2 py-1.5 text-sm"
                />

                {/* Toggle días / minutos */}
                <div className="flex gap-1">
                  {(['dias', 'minutos'] as DurationUnit[]).map((u) => (
                    <button
                      key={u}
                      onClick={() => {
                        setDurationUnit(u);
                        setDurationValue(u === 'dias' ? 15 : 60);
                      }}
                      className={`flex-1 py-1 rounded border text-xs font-medium transition-colors ${
                        durationUnit === u
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {u === 'dias' ? 'Días' : 'Minutos'}
                    </button>
                  ))}
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-1">
                  {(durationUnit === 'dias' ? DAY_PRESETS : MIN_PRESETS).map((v) => (
                    <button
                      key={v}
                      onClick={() => setDurationValue(v)}
                      className={`px-2 py-0.5 rounded border text-xs font-medium transition-colors ${
                        durationValue === v
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {v}{durationUnit === 'dias' ? 'd' : 'm'}
                    </button>
                  ))}
                </div>

                {/* Input libre entero */}
                <input
                  type="number"
                  min={1}
                  value={durationValue}
                  onChange={(e) => setDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full border rounded-sm px-2 py-1.5 text-sm"
                  placeholder={durationUnit === 'dias' ? 'días' : 'minutos'}
                />
              </div>
            </div>
          </div>

          {/* Col 3 — Resumen y Aplicación */}
          <div className="border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-orange-500 text-white font-bold">
              {isSingleMode ? '2.' : '3.'} Resumen y Aplicación
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm text-gray-700">
                {!isSingleMode && (
                  <div className="flex justify-between">
                    <span>Avisos seleccionados</span>
                    <span className="font-bold">{selectedIds.length}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Nivel</span>
                  <span className="font-bold">{selectedTier ? selectedTier.toUpperCase() : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Placements</span>
                  <span className="font-bold">{tierOption ? tierOption.placements.length : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duración</span>
                  <span className="font-bold">{durationLabel}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Cargo al usuario</span>
                  <span className="font-bold">Ninguno</span>
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Motivo (interno)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full border rounded-sm px-2 py-1.5 text-sm resize-none"
                  placeholder="Motivo administrativo"
                />
              </div>

              {/* Force reactivate toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setForceReactivate(!forceReactivate)}
                  className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${forceReactivate ? 'bg-amber-500' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${forceReactivate ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Re-activar (sobreescribir)
                  </p>
                  <p className="text-[10px] text-gray-400">Expira el destacado activo y crea uno nuevo</p>
                </div>
              </label>

              <button
                onClick={applyBulk}
                disabled={submitting || !canApply}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-xl font-semibold transition-colors"
              >
                {submitting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aplicando...
                  </span>
                ) : isSingleMode ? (
                  'Destacar aviso'
                ) : (
                  `Destacar ${selectedIds.length} aviso${selectedIds.length !== 1 ? 's' : ''}`
                )}
              </button>

              {resultText && (
                <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 leading-relaxed">
                  {resultText}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

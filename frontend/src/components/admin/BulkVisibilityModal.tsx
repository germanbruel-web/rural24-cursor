/**
 * BulkVisibilityModal — SuperAdmin ONLY
 * Destacado masivo de avisos usando sistema de TIERS (alta/media/baja).
 * Reemplaza el modal legacy con placement + créditos.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { X, Check, Zap, Star, TrendingDown, Loader2 } from 'lucide-react';
import type { Ad } from '../../../types';
import { manualActivateFeatured } from '../../services/adminFeaturedService';

type Tier = 'alta' | 'media' | 'baja';

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

interface FeaturedInfo {
  featured_id: string;
  placement: string;
  status: string;
  expires_at?: string;
}

interface BulkVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  ads: Ad[];
  featuredMap: Record<string, FeaturedInfo[]>;
  onApplied: () => void;
}

export default function BulkVisibilityModal({
  isOpen,
  onClose,
  ads,
  featuredMap,
  onApplied,
}: BulkVisibilityModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  const [scheduledStart, setScheduledStart] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [durationDays, setDurationDays] = useState<number>(15);
  const [reason, setReason] = useState<string>('Asignación masiva SuperAdmin');
  const [submitting, setSubmitting] = useState(false);
  const [resultText, setResultText] = useState<string>('');

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
        if (activePlacements.has(placement)) {
          skipped += 1;
          continue;
        }

        const result = await manualActivateFeatured({
          ad_id: adId,
          placement: placement as any,
          tier: selectedTier,
          scheduled_start: scheduledStart,
          duration_days: durationDays,
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

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-900">
          <div>
            <h3 className="text-lg font-bold text-white">Destacar Avisos — Bulk</h3>
            <p className="text-xs text-gray-400">Solo SuperAdmin · Sin cargo al usuario</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-700 text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          {/* Col 1 — Avisos */}
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
                      <p className="text-xs text-gray-400 truncate">{ad.category || 'Sin categoría'}</p>
                      {hasFeatured && (
                        <span className="text-xs text-amber-600 font-medium">⚡ Ya tiene destacado</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Col 2 — Tier */}
          <div className="border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-blue-600 text-white font-bold">
              2. Nivel de Visibilidad
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

              <div className="pt-3 border-t space-y-2">
                <label className="block text-xs font-medium text-gray-600">Fecha inicio</label>
                <input
                  type="date"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                />
                <label className="block text-xs font-medium text-gray-600">Duración (días)</label>
                <div className="flex gap-2">
                  {[15, 30].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDurationDays(d)}
                      className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                        durationDays === d
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {d} días
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Col 3 — Resumen */}
          <div className="border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-orange-500 text-white font-bold">
              3. Resumen y Aplicación
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Avisos seleccionados</span>
                  <span className="font-bold">{selectedIds.length}</span>
                </div>
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
                  <span className="font-bold">{durationDays} días</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Cargo al usuario</span>
                  <span className="font-bold">Ninguno</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Motivo (interno)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm resize-none"
                  placeholder="Motivo administrativo"
                />
              </div>

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

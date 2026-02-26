import { useMemo, useState, type ReactNode } from 'react';
import { X, Check, Home, Search, FileText, Loader2 } from 'lucide-react';
import type { Ad } from '../../../types';
import { manualActivateFeatured } from '../../services/adminFeaturedService';
import type { FeaturedPlacement } from '../../services/userFeaturedService';

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

const COSTS: Record<FeaturedPlacement, number> = {
  homepage: 6,
  results: 2,
  detail: 1,
};

const OPTIONS: Array<{ value: FeaturedPlacement; label: string; icon: ReactNode }> = [
  { value: 'homepage', label: 'Homepage', icon: <Home className="w-4 h-4" /> },
  { value: 'results', label: 'Resultados', icon: <Search className="w-4 h-4" /> },
  { value: 'detail', label: 'Detalle', icon: <FileText className="w-4 h-4" /> },
];

function getLevel(selectedPlacements: FeaturedPlacement[]): string {
  if (selectedPlacements.length >= 3) return 'ALTO (Premium)';
  if (selectedPlacements.length === 2) return 'MEDIO';
  if (selectedPlacements.length === 1) return 'BAJO';
  return 'Sin nivel';
}

export default function BulkVisibilityModal({
  isOpen,
  onClose,
  ads,
  featuredMap,
  onApplied,
}: BulkVisibilityModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedPlacements, setSelectedPlacements] = useState<FeaturedPlacement[]>([]);
  const [scheduledStart, setScheduledStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState<number>(15);
  const [reason, setReason] = useState<string>('Asignación masiva por SuperAdmin');
  const [submitting, setSubmitting] = useState(false);
  const [resultText, setResultText] = useState<string>('');

  const selectableAds = useMemo(
    () => ads.filter((ad) => ad.status === 'active'),
    [ads]
  );

  const totalCostPerAd = selectedPlacements.reduce((sum, p) => sum + COSTS[p], 0);
  const totalCost = totalCostPerAd * selectedIds.length;
  const level = getLevel(selectedPlacements);

  const toggleId = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const togglePlacement = (placement: FeaturedPlacement) => {
    setSelectedPlacements((prev) =>
      prev.includes(placement) ? prev.filter((p) => p !== placement) : [...prev, placement]
    );
  };

  const applyBulk = async () => {
    if (selectedIds.length === 0 || selectedPlacements.length === 0) return;
    setSubmitting(true);
    setResultText('');

    let ok = 0;
    let fail = 0;
    let skipped = 0;

    for (const adId of selectedIds) {
      const current = featuredMap[adId] || [];
      const activePlacements = new Set(current.map((f) => f.placement));

      for (const placement of selectedPlacements) {
        if (activePlacements.has(placement)) {
          skipped += 1;
          continue;
        }

        const result = await manualActivateFeatured({
          ad_id: adId,
          placement,
          scheduled_start: scheduledStart,
          duration_days: durationDays,
          reason,
        });

        if (result.success) ok += 1;
        else fail += 1;
      }
    }

    setSubmitting(false);
    setResultText(`Aplicado: ${ok} | Fallidos: ${fail} | Omitidos: ${skipped}`);
    onApplied();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Asignar Visibilidad (Bulk)</h3>
            <p className="text-sm text-gray-600">SuperAdmin - selección masiva de avisos</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
          <div className="border rounded-xl">
            <div className="px-4 py-3 bg-emerald-600 text-white font-bold rounded-t-xl">
              1. Seleccionar Avisos ({selectedIds.length})
            </div>
            <div className="max-h-[380px] overflow-y-auto p-3 space-y-2">
              {selectableAds.map((ad) => (
                <label key={ad.id} className="flex items-start gap-2 border rounded-lg p-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(ad.id)}
                    onChange={() => toggleId(ad.id)}
                    className="mt-1"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ad.title}</p>
                    <p className="text-xs text-gray-500 truncate">{ad.category || 'Sin categoría'}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="border rounded-xl">
            <div className="px-4 py-3 bg-blue-600 text-white font-bold rounded-t-xl">
              2. Configurar Ubicaciones
            </div>
            <div className="p-3 space-y-2">
              {OPTIONS.map((option) => {
                const selected = selectedPlacements.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => togglePlacement(option.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border ${
                      selected ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {option.icon}
                      {option.label}
                    </span>
                    {selected && <Check className="w-4 h-4 text-blue-700" />}
                  </button>
                );
              })}

              <div className="pt-3 border-t mt-3 space-y-2">
                <label className="block text-xs font-medium text-gray-600">Fecha inicio</label>
                <input
                  type="date"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                />
                <label className="block text-xs font-medium text-gray-600">Duración (días)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value || 15))}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="border rounded-xl">
            <div className="px-4 py-3 bg-orange-500 text-white font-bold rounded-t-xl">
              3. Resumen y Aplicación
            </div>
            <div className="p-4 space-y-3">
              <div className="text-sm text-gray-700">
                <p>Avisos: <span className="font-bold">{selectedIds.length}</span></p>
                <p>Nivel: <span className="font-bold">{level}</span></p>
                <p>Costo / aviso: <span className="font-bold">{totalCostPerAd} créditos</span></p>
                <p>Total estimado: <span className="font-bold">{totalCost} créditos</span></p>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-2 py-1.5 text-sm"
                placeholder="Motivo administrativo"
              />
              <button
                onClick={applyBulk}
                disabled={submitting || selectedIds.length === 0 || selectedPlacements.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-2.5 rounded-lg font-semibold"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aplicando...
                  </span>
                ) : (
                  'Aplicar Visibilidad'
                )}
              </button>
              {resultText && <p className="text-xs text-gray-600">{resultText}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

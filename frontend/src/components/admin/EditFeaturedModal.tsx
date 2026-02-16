/**
 * EditFeaturedModal.tsx
 * Modal para que SuperAdmin edite fechas y configuración de un featured ad
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Home,
  Search,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit2
} from 'lucide-react';
import {
  editFeatured,
  type EditFeaturedParams,
  type AdminFeaturedAd
} from '../../services/adminFeaturedService';
import type { FeaturedPlacement } from '../../services/userFeaturedService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  featured: AdminFeaturedAd;
  onSuccess?: () => void;
}

const PLACEMENT_OPTIONS: { value: FeaturedPlacement; label: string; icon: React.ReactNode }[] = [
  { value: 'homepage', label: 'Destacado ALTO', icon: <Home className="w-4 h-4" /> },
  { value: 'results', label: 'Destacado MEDIO', icon: <Search className="w-4 h-4" /> },
  { value: 'detail', label: 'Destacado BÁSICO', icon: <Star className="w-4 h-4" /> }
];

export default function EditFeaturedModal({ isOpen, onClose, featured, onSuccess }: Props) {
  const [scheduledStart, setScheduledStart] = useState('');
  const [durationDays, setDurationDays] = useState(15);
  const [placement, setPlacement] = useState<FeaturedPlacement>('homepage');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Inicializar valores del featured
  useEffect(() => {
    if (isOpen && featured) {
      setScheduledStart(featured.scheduled_start || '');
      setDurationDays(featured.duration_days || 15);
      setPlacement(featured.placement);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, featured]);

  // Validar que no esté expirado o cancelado
  const canEdit = featured.status !== 'expired' && featured.status !== 'cancelled';

  // Calcular nueva fecha de expiración
  const calculateNewExpiry = () => {
    if (!scheduledStart) return 'N/A';
    const start = new Date(scheduledStart);
    const expiry = new Date(start);
    expiry.setDate(expiry.getDate() + durationDays);
    return expiry.toISOString().split('T')[0];
  };

  // Detectar cambios
  const hasChanges = () => {
    return (
      scheduledStart !== featured.scheduled_start ||
      durationDays !== featured.duration_days ||
      placement !== featured.placement
    );
  };

  // Manejar edición
  const handleEdit = async () => {
    if (!hasChanges()) {
      setError('No hay cambios para guardar');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const params: EditFeaturedParams = {
        id: featured.id
      };

      // Solo enviar campos que cambiaron
      if (scheduledStart !== featured.scheduled_start) {
        params.scheduled_start = scheduledStart;
      }
      if (durationDays !== featured.duration_days) {
        params.duration_days = durationDays;
      }
      if (placement !== featured.placement) {
        params.placement = placement;
      }

      const result = await editFeatured(params);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'Error al editar featured');
      }
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Error al editar featured');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(to right, #386539, #169834)' }}>
          <div className="flex items-center gap-3">
            <Edit2 className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">
              Editar Featured Ad
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Info del aviso */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Aviso:</span>
                <p className="font-semibold text-gray-900 truncate">
                  {featured.ad_title}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Usuario:</span>
                <p className="font-semibold text-gray-900 truncate">
                  {featured.user_full_name}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Categoría:</span>
                <p className="font-semibold text-gray-900">
                  {featured.category_name}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Estado:</span>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  featured.status === 'active' ? 'bg-brand-100 text-brand-700' :
                  featured.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {featured.status}
                </span>
              </div>
            </div>
          </div>

          {/* Validación estado */}
          {!canEdit ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                ⚠️ No se puede editar un featured {featured.status}
              </p>
            </div>
          ) : (
            <>
              {/* Placement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {PLACEMENT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPlacement(option.value)}
                      className={`p-3 border-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                        placement === option.value
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option.icon}
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (días)
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400"
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

              {/* Preview nueva expiración */}
              <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg">
                <p className="text-sm text-brand-700">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Nueva fecha de expiración: <strong>{calculateNewExpiry()}</strong>
                </p>
              </div>

              {/* Cambios detectados */}
              {hasChanges() && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-semibold mb-1">
                    Cambios detectados:
                  </p>
                  <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
                    {scheduledStart !== featured.scheduled_start && (
                      <li>Fecha inicio: {featured.scheduled_start} → {scheduledStart}</li>
                    )}
                    {durationDays !== featured.duration_days && (
                      <li>Duración: {featured.duration_days} → {durationDays} días</li>
                    )}
                    {placement !== featured.placement && (
                      <li>Ubicación: {featured.placement} → {placement}</li>
                    )}
                  </ul>
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
                <div className="p-4 bg-brand-50 border border-brand-200 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-brand-700">
                      ✅ Cambios guardados exitosamente
                    </p>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEdit}
                  disabled={submitting || !hasChanges()}
                  className="flex-1 px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" style={{ backgroundColor: '#386539' }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

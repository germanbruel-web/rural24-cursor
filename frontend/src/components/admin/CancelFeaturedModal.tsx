/**
 * CancelFeaturedModal.tsx
 * Modal para que SuperAdmin cancele un featured ad con/sin reembolso
 * Calcula reembolso proporcional automáticamente
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Calendar,
  RotateCcw,
  Ban
} from 'lucide-react';
import {
  cancelFeaturedWithRefund,
  type CancelFeaturedParams,
  type AdminFeaturedAd
} from '../../services/adminFeaturedService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  featured: AdminFeaturedAd;
  onSuccess?: () => void;
}

export default function CancelFeaturedModal({ isOpen, onClose, featured, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [refundCredits, setRefundCredits] = useState(true);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [refundInfo, setRefundInfo] = useState<{
    amount: number;
    applied: boolean;
  } | null>(null);

  // Calcular información de reembolso
  const calculateRefundInfo = () => {
    if (!featured.credit_consumed || !featured.expires_at) {
      return { canRefund: false, amount: 0, daysRemaining: 0, totalDays: 0 };
    }

    const now = new Date();
    const expiry = new Date(featured.expires_at);
    const daysRemaining = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = featured.duration_days || 15;
    const creditsSpent = featured.credit_consumed ? (featured.credits_spent || 1) : 0;

    // Calcular reembolso proporcional (redondeo hacia arriba)
    const refundAmount = daysRemaining > 0 
      ? Math.ceil((daysRemaining / totalDays) * creditsSpent)
      : 0;

    return {
      canRefund: daysRemaining > 0 && creditsSpent > 0,
      amount: refundAmount,
      daysRemaining,
      totalDays
    };
  };

  const refundCalc = calculateRefundInfo();

  // Resetear estados al abrir
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setRefundCredits(refundCalc.canRefund); // Auto-activar si es elegible
      setError(null);
      setSuccess(false);
      setRefundInfo(null);
    }
  }, [isOpen, featured]);

  // Validar estado
  const canCancel = featured.status === 'active' || featured.status === 'pending';

  // Manejar cancelación
  const handleCancel = async () => {
    if (!reason.trim() || reason.trim().length < 5) {
      setError('El motivo debe tener al menos 5 caracteres');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const params: CancelFeaturedParams = {
        id: featured.id,
        reason: reason.trim(),
        refund_credits: refundCredits && refundCalc.canRefund
      };

      const result = await cancelFeaturedWithRefund(params);

      if (result.success) {
        setSuccess(true);
        setRefundInfo(result.refund || null);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Error al cancelar featured');
      }
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError(err.message || 'Error al cancelar featured');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">
              Cancelar Featured Ad
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
                <span className="text-gray-600">Email:</span>
                <p className="font-semibold text-gray-900 text-xs truncate">
                  {featured.user_email}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Placement:</span>
                <p className="font-semibold text-gray-900 capitalize">
                  {featured.placement}
                </p>
              </div>
            </div>
          </div>

          {/* Validación estado */}
          {!canCancel ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                ⚠️ No se puede cancelar un featured {featured.status}
              </p>
            </div>
          ) : (
            <>
              {/* Info de reembolso */}
              {refundCalc.canRefund ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <RotateCcw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900 mb-2">
                        Reembolso Proporcional Disponible
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-blue-700">Días totales:</span>
                          <p className="font-medium text-blue-900">
                            {refundCalc.totalDays} días
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-700">Días restantes:</span>
                          <p className="font-medium text-blue-900">
                            {refundCalc.daysRemaining} días
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-700">Créditos consumidos:</span>
                          <p className="font-medium text-blue-900">
                            {featured.credits_spent || 1} créditos
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-700">Reembolso calculado:</span>
                          <p className="font-bold text-blue-900 text-lg">
                            {refundCalc.amount} créditos
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Checkbox reembolso */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={refundCredits}
                      onChange={(e) => setRefundCredits(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-blue-900">
                      Reembolsar {refundCalc.amount} créditos al usuario
                    </span>
                  </label>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                  <Ban className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">
                      Sin reembolso disponible
                    </p>
                    <p className="text-sm text-gray-600">
                      {!featured.credit_consumed
                        ? 'Este featured no consumió créditos (activación manual)'
                        : 'Este featured ya expiró o no tiene días restantes'}
                    </p>
                  </div>
                </div>
              )}

              {/* Motivo de cancelación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de Cancelación *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Imagen inapropiada, Contenido no permitido, Error de activación, Solicitud del usuario..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 5 caracteres. Este motivo se registrará en la auditoría y será visible para el equipo.
                </p>
              </div>

              {/* Advertencia */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">
                    ⚠️ Acción Irreversible
                  </p>
                  <p className="text-sm text-yellow-800">
                    Una vez cancelado, el featured dejará de aparecer en la plataforma inmediatamente.
                    {refundCredits && refundCalc.canRefund && (
                      <> Los créditos se reembolsarán automáticamente a la cuenta del usuario.</>
                    )}
                  </p>
                </div>
              </div>

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
                      ✅ Featured cancelado exitosamente
                    </p>
                    {refundInfo && refundInfo.applied && (
                      <p className="text-sm text-brand-600 mt-1">
                        {refundInfo.amount} créditos reembolsados
                      </p>
                    )}
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
                  No, Mantener Featured
                </button>
                <button
                  onClick={handleCancel}
                  disabled={submitting || !reason.trim() || reason.trim().length < 5}
                  className="flex-1 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <Ban className="w-5 h-5" />
                      Sí, Cancelar Featured
                      {refundCredits && refundCalc.canRefund && ` (${refundCalc.amount} créditos)`}
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

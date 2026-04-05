/**
 * SuperAdminCreditsConfig.tsx
 * Panel de configuración de créditos para superadmin
 * Mobile First - Design System RURAL24
 */

import React, { useEffect, useState } from 'react';
import { Settings, Loader2, CheckCircle2, AlertCircle, Save, RotateCcw } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface GlobalConfig {
  credit_base_price: number;  // Precio en ARS de 1 crédito
  featured_durations: Array<{
    duration_days: number;
    credits_needed: number;
    label: string;
  }>;
  promo_credits_for_new_users: number;
  promo_credits_expire_days: number;
}

export const SuperAdminCreditsConfig: React.FC = () => {
  const [config, setConfig] = useState<GlobalConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<GlobalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('global_settings')
        .select('key, value')
        .in('key', [
          'credit_base_price',
          'featured_durations',
          'promo_credits_for_new_users',
          'promo_credits_expire_days'
        ]);

      if (err) throw err;

      const configObj: any = {};
      data?.forEach(item => {
        // global_settings.value es JSONB: llega pre-parseado
        configObj[item.key] = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
      });

      setConfig(configObj);
      setOriginalConfig(JSON.parse(JSON.stringify(configObj)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeCreditPrice = (newPrice: number) => {
    if (config) {
      setConfig({
        ...config,
        credit_base_price: newPrice
      });
      setSuccess(false);
    }
  };

  const handleChangePromoDays = (days: number) => {
    if (config) {
      setConfig({
        ...config,
        promo_credits_expire_days: days
      });
      setSuccess(false);
    }
  };

  const handleChangePromoCredits = (credits: number) => {
    if (config) {
      setConfig({
        ...config,
        promo_credits_for_new_users: credits
      });
      setSuccess(false);
    }
  };

  const handleChangeDurationCredits = (
    durationIndex: number,
    newCredits: number
  ) => {
    if (config && config.featured_durations) {
      const updated = [...config.featured_durations];
      updated[durationIndex] = {
        ...updated[durationIndex],
        credits_needed: newCredits
      };
      setConfig({
        ...config,
        featured_durations: updated
      });
      setSuccess(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Actualizar cada configuración
      const updates = [
        {
          key: 'credit_base_price',
          value: config.credit_base_price.toString()
        },
        {
          key: 'featured_durations',
          value: JSON.stringify(config.featured_durations)
        },
        {
          key: 'promo_credits_for_new_users',
          value: config.promo_credits_for_new_users.toString()
        },
        {
          key: 'promo_credits_expire_days',
          value: config.promo_credits_expire_days.toString()
        }
      ];

      for (const update of updates) {
        const { error: err } = await supabase
          .from('global_settings')
          .update({ value: JSON.stringify(update.value) })
          .eq('key', update.key);

        if (err) throw err;
      }

      setOriginalConfig(JSON.parse(JSON.stringify(config)));
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(originalConfig ? JSON.parse(JSON.stringify(originalConfig)) : null);
    setSuccess(false);
  };

  const isDirty = JSON.stringify(config) !== JSON.stringify(originalConfig);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-red-700">
        No se pudo cargar la configuración
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ============================================
          HEADER
          ============================================ */}
      <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <Settings className="w-7 h-7 sm:w-9 sm:h-9 text-brand-600" />
        <h1 className="text-2xl sm:text-4xl font-black text-gray-800">
          Configuración de Créditos
        </h1>
      </div>

      {/* ============================================
          ERRORES
          ============================================ */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* ============================================
          SUCCESS
          ============================================ */}
      {success && (
        <div className="bg-brand-50 border border-green-300 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-brand-600">
              Configuración guardada exitosamente
            </p>
          </div>
        </div>
      )}

      {/* ============================================
          TARJETA 1: PRECIO BASE POR CRÉDITO
          ============================================ */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
          💰 Precio Base por Crédito
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Este es el precio que paga un usuario por cada crédito.
          </p>

          <div className="bg-brand-50 p-4 sm:p-6 rounded-xl border border-brand-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Precio (ARS)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-brand-600">$</span>
              <input
                type="number"
                value={config.credit_base_price}
                onChange={(e) => handleChangeCreditPrice(parseFloat(e.target.value))}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                min="0"
                step="100"
              />
            </div>

            <div className="mt-4 p-3 bg-white rounded-lg border border-brand-200">
              <p className="text-xs text-gray-600 mb-2">
                <strong>Ejemplo de precios automatizados:</strong>
              </p>
              <ul className="space-y-1 text-xs text-gray-700 ml-2">
                <li>• 1 crédito = ${config.credit_base_price.toLocaleString('es-AR')}</li>
                <li>• 2 créditos = ${(config.credit_base_price * 2).toLocaleString('es-AR')}</li>
                <li>• 3 créditos = ${(config.credit_base_price * 3).toLocaleString('es-AR')}</li>
                <li>• 4 créditos = ${(config.credit_base_price * 4).toLocaleString('es-AR')}</li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
            ⚠️ Cambiar este valor afectará todos los precios de compra de créditos
          </p>
        </div>
      </div>

      {/* ============================================
          TARJETA 2: DURACIONES DE DESTACADO
          ============================================ */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
          ⏱️ Duraciones de Destacado Disponibles
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Define qué duraciones pueden elegir los usuarios y cuántos créditos cuesta cada una.
          </p>

          <div className="space-y-4">
            {config.featured_durations.map((duration, idx) => (
              <div key={duration.duration_days} className="bg-blue-50 p-4 sm:p-6 rounded-xl border border-blue-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Duración
                    </label>
                    <input
                      type="text"
                      value={duration.label}
                      disabled
                      className="w-full py-2 px-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Días
                    </label>
                    <input
                      type="number"
                      value={duration.duration_days}
                      disabled
                      className="w-full py-2 px-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Créditos Requeridos
                    </label>
                    <input
                      type="number"
                      value={duration.credits_needed}
                      onChange={(e) =>
                        handleChangeDurationCredits(idx, parseInt(e.target.value))
                      }
                      className="w-full py-2 px-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm font-bold text-blue-700"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <div className="mt-3 p-2 bg-white rounded border border-blue-200 text-xs text-gray-600">
                  Precio: ${(config.credit_base_price * duration.credits_needed).toLocaleString('es-AR')}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
            💡 Las duraciones (7, 14, 21, 28 días) y créditos mínimos (1-4) son fijos. Solo modifica los créditos requeridos.
          </p>
        </div>
      </div>

      {/* ============================================
          TARJETA 3: PROMOCIÓN PARA NUEVOS USUARIOS
          ============================================ */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
          🎁 Créditos Gratis para Nuevos Usuarios
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Cuando un usuario se registra, recibe automáticamente estos créditos gratis.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-amber-50 p-4 sm:p-6 rounded-xl border border-amber-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Créditos a Regalar
              </label>
              <input
                type="number"
                value={config.promo_credits_for_new_users}
                onChange={(e) => handleChangePromoCredits(parseInt(e.target.value))}
                className="w-full py-3 px-4 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent text-lg font-bold text-amber-700"
                min="0"
                max="20"
              />
              <p className="mt-3 text-xs text-gray-600">
                Valor equivalente: <strong>${(config.credit_base_price * config.promo_credits_for_new_users).toLocaleString('es-AR')}</strong>
              </p>
            </div>

            <div className="bg-purple-50 p-4 sm:p-6 rounded-xl border border-purple-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expiran en (días)
              </label>
              <input
                type="number"
                value={config.promo_credits_expire_days}
                onChange={(e) => handleChangePromoDays(parseInt(e.target.value))}
                className="w-full py-3 px-4 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-lg font-bold text-purple-700"
                min="1"
                max="365"
              />
              <p className="mt-3 text-xs text-gray-600">
                Los créditos promos vencen después de este tiempo si no se usan.
              </p>
            </div>
          </div>

          <div className="bg-brand-50 p-4 rounded-lg border border-brand-200 text-sm text-brand-600">
            <strong>Resumen de promos:</strong> Cada nuevo usuario recibe <strong>{config.promo_credits_for_new_users} créditos gratis</strong> (valor ${(config.credit_base_price * config.promo_credits_for_new_users).toLocaleString('es-AR')}) que caducan en <strong>{config.promo_credits_expire_days} días</strong>.
          </div>
        </div>
      </div>

      {/* ============================================
          BOTONES
          ============================================ */}
      <div className="sticky bottom-0 bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-200 flex gap-3 sm:gap-4">
        <button
          onClick={handleReset}
          disabled={!isDirty || saving}
          className={`flex-1 py-3 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
            isDirty && !saving
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          Deshacer
        </button>

        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className={`flex-1 py-3 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
            isDirty && !saving
              ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          <Save className="w-4 h-4 sm:w-5 sm:h-5" />
          Guardar Cambios
        </button>
      </div>
    </div>
  );
};

export default SuperAdminCreditsConfig;

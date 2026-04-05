/**
 * SubscriptionPanel - Mi Plan
 * Flujos: Membresía · Adicionales · Cupones
 * Sin wallet / sin cargar saldo — pagos solo vía MP o cupón
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Ticket,
  AlertCircle,
  Crown,
  RefreshCw,
  Plus,
  Minus,
  Building2,
} from 'lucide-react';
import { validateCoupon, redeemCoupon } from '../../services/creditsService';
import { supabase } from '../../services/supabaseClient';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { Card } from '../molecules/Card';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';

// ── helpers ──────────────────────────────────────────────────────────────────
function formatARS(n: number) {
  return `$${n.toLocaleString('es-AR')}`;
}

const BADGE_GRADIENT: Record<string, string> = {
  gray:   'from-gray-500 to-gray-600',
  green:  'from-brand-600 to-brand-700',
  blue:   'from-blue-500 to-blue-600',
  purple: 'from-purple-500 to-purple-600',
  gold:   'from-yellow-500 to-yellow-600',
};

// ── componente cupón inline ───────────────────────────────────────────────────
function CouponSection({ onRedeemed }: { onRedeemed: () => void }) {
  const [code, setCode]           = useState('');
  const [validating, setValidating] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [preview, setPreview]     = useState<any>(null);
  const [error, setError]         = useState<string | null>(null);
  const [done, setDone]           = useState(false);
  const [doneMsg, setDoneMsg]     = useState('');

  const handleValidate = async () => {
    if (!code.trim()) return;
    setValidating(true);
    setError(null);
    setPreview(null);
    const result = await validateCoupon(code.trim().toUpperCase());
    setValidating(false);
    if (!result.valid) {
      setError(result.error || 'Cupón inválido');
    } else {
      setPreview(result);
    }
  };

  const handleRedeem = async () => {
    setRedeeming(true);
    setError(null);
    const result = await redeemCoupon(code.trim().toUpperCase());
    setRedeeming(false);
    if (!result.success) {
      setError(result.error || 'Error al canjear');
    } else {
      setDoneMsg(result.message || '¡Cupón canjeado!');
      setDone(true);
      onRedeemed();
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 p-3 bg-brand-50 border border-brand-200 rounded-lg text-sm text-brand-700">
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
        {doneMsg}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setPreview(null);
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
          placeholder="CÓDIGO DE CUPÓN"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-brand-600 focus:border-transparent"
        />
        <button
          onClick={handleValidate}
          disabled={!code.trim() || validating}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          {validating ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Validar'}
        </button>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}

      {preview && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg space-y-2">
          <p className="text-sm text-gray-700">{preview.description}</p>
          <div className="flex flex-wrap gap-2">
            {preview.arsAmount > 0 && (
              <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs rounded-full font-medium">
                +{formatARS(preview.arsAmount)} para adicionales
              </span>
            )}
            {preview.membershipPlanName && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium flex items-center gap-1">
                <Crown className="w-3 h-3" />
                {preview.membershipPlanName} · {preview.membershipDays} días
              </span>
            )}
          </div>
          <button
            onClick={handleRedeem}
            disabled={redeeming}
            className="w-full py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {redeeming ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirmar canje'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── panel principal ───────────────────────────────────────────────────────────
export const SubscriptionPanel: React.FC = () => {
  const { profile } = useAuth();
  const { plan, loading: planLoading } = usePlanFeatures();

  const [myAdsCount, setMyAdsCount]       = useState(0);
  const [myCompaniesCount, setMyCompaniesCount] = useState(0);
  const [loading, setLoading]             = useState(true);
  const [extraAds, setExtraAds]           = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { if (!silent) setLoading(false); return; }

    const [{ count: adsCount }, { count: companiesCount }] = await Promise.all([
      supabase
        .from('ads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['active', 'pending']),
      supabase
        .from('business_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id),
    ]);

    setMyAdsCount(adsCount ?? 0);
    setMyCompaniesCount(companiesCount ?? 0);
    if (!silent) setLoading(false);
  };

  const isPremium          = plan.planName !== 'free';
  const hasCompanySlot     = plan.canHaveCompanyProfile && plan.maxCompanyProfiles > 0;
  const canCreateCompany   = hasCompanySlot && myCompaniesCount < plan.maxCompanyProfiles;
  const adsMax        = plan.maxAds;
  const adsProgress   = adsMax ? Math.min((myAdsCount / adsMax) * 100, 100) : 0;
  const adsOverLimit  = adsMax !== null && myAdsCount >= adsMax;
  const gradientClass = BADGE_GRADIENT[plan.badgeColor] ?? BADGE_GRADIENT.green;
  const extraTotal    = extraAds * plan.extraAdPriceArs;

  if (loading || planLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mi Plan</h1>
        <p className="text-sm text-gray-500 mt-1">Membresía, adicionales y cupones</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">

        {/* ── COL IZQUIERDA: PLAN ACTUAL (3/5) ── */}
        <div className="lg:col-span-3 space-y-4">

          <Card variant="outlined" padding="lg" className="hover:shadow-lg transition-shadow">
            {/* Badge + nombre */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${gradientClass} rounded-lg flex items-center justify-center`}>
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{plan.displayName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="success" size="sm">Activo</Badge>
                    {plan.badgeText && (
                      <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-gray-100 text-gray-600">
                        {plan.badgeText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contador de avisos */}
            {adsMax !== null ? (
              <div className="mb-5">
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-gray-600">Avisos activos</span>
                  <span className={`font-semibold ${adsOverLimit ? 'text-red-600' : 'text-gray-900'}`}>
                    {myAdsCount} / {adsMax}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${adsOverLimit ? 'bg-red-500' : 'bg-brand-600'}`}
                    style={{ width: `${adsProgress}%` }}
                  />
                </div>
                {adsOverLimit && (
                  <p className="text-xs text-red-500 mt-1">Límite alcanzado. Eliminá un aviso o sumá adicionales.</p>
                )}
              </div>
            ) : (
              <div className="mb-5 flex items-center gap-2 text-sm text-brand-600">
                <CheckCircle className="w-4 h-4" />
                <span>{myAdsCount} avisos activos — sin límite</span>
              </div>
            )}

            {/* Feature flags */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              {[
                { label: `Hasta ${adsMax ?? '∞'} avisos`, active: true },
                { label: 'Chat con compradores',            active: plan.hasInbox },
                { label: 'Botón WhatsApp',                  active: plan.canShowWhatsapp },
                { label: 'Oficina Virtual',                 active: plan.hasVirtualOffice },
                { label: 'Analytics',                       active: plan.hasAnalytics },
                { label: 'Soporte prioritario',             active: plan.hasPrioritySupport },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  {item.active
                    ? <CheckCircle className="w-4 h-4 text-brand-600 flex-shrink-0" />
                    : <XCircle    className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                  <span className={item.active ? 'text-gray-700' : 'text-gray-400'}>{item.label}</span>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* ── COL DERECHA: ACCIONES (2/5) ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* MEMBRESÍA */}
          {!isPremium && (
            <Card variant="outlined" padding="md">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4 text-brand-600" />
                Membresía Premium
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                10 avisos · Servicios · WhatsApp · Oficina Virtual
              </p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-black text-gray-900">{formatARS(plan.priceMonthly || 9900)}</span>
                <span className="text-sm text-gray-500">/mes</span>
              </div>
              <button
                disabled
                className="w-full py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Próximamente
              </button>
              <p className="text-xs text-gray-400 mt-2 text-center">Podés activar Premium con un cupón ahora mismo</p>
            </Card>
          )}

          {/* ADICIONALES */}
          {isPremium && (
            <Card variant="outlined" padding="md">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-600" />
                Avisos adicionales
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {formatARS(plan.extraAdPriceArs)} por aviso extra
              </p>
              {/* Selector cantidad */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setExtraAds(v => Math.max(1, v - 1))}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-black text-gray-900 w-8 text-center">{extraAds}</span>
                <button
                  onClick={() => setExtraAds(v => v + 1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold text-gray-700 ml-2">{formatARS(extraTotal)}</span>
              </div>
              <button
                disabled
                className="w-full py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Próximamente
              </button>
            </Card>
          )}

          {/* SIGUIENTE DESBLOQUEO — empresa */}
          {isPremium && canCreateCompany && (
            <Card variant="outlined" padding="md" className="border-brand-200 bg-brand-50/40">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-600" />
                Crear tu empresa
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Tu plan incluye hasta {plan.maxCompanyProfiles} perfil{plan.maxCompanyProfiles > 1 ? 'es' : ''} de empresa.
                {myCompaniesCount > 0 && ` Tenés ${myCompaniesCount} creado${myCompaniesCount > 1 ? 's' : ''}.`}
              </p>
              <a
                href="#/mis-empresas"
                className="w-full py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-500 flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Ir a Mis Empresas
              </a>
            </Card>
          )}

          {/* CUPONES */}
          <Card variant="outlined" padding="md">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-brand-600" />
              Canjear cupón
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Activá membresía Premium o sumá crédito para adicionales.
            </p>
            <CouponSection onRedeemed={() => loadData(true)} />
          </Card>

        </div>
      </div>
    </div>
  );
};

export default SubscriptionPanel;

/**
 * SubscriptionPanel - Mi Plan
 * Gestión de Suscripción + Créditos de Publicidad
 * Design System RURAL24 - Mobile First
 * Reescritura P4: datos dinámicos desde subscription_plans via usePlanFeatures
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Coins,
  ShoppingCart,
  Gift,
  Clock,
  Loader2,
  TrendingUp,
  CheckCircle,
  XCircle,
  Building,
  BarChart2,
  Headphones,
  Phone,
  ArrowRight,
  Star,
} from 'lucide-react';
import {
  getCreditsConfig,
  getCreditTransactions
} from '../../services/creditsService';
import { getWalletBalance } from '../../services/walletService';
import { supabase } from '../../services/supabaseClient';
import BuyCreditsModal from '../modals/BuyCreditsModal';
import RedeemCouponModal from '../modals/RedeemCouponModal';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';

// Design System Components
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Card, CardHeader, CardBody } from '../molecules/Card';

// Mapa de badge_color → clases Tailwind
const BADGE_COLOR_CLASSES: Record<string, string> = {
  gray:   'bg-gray-100 text-gray-600',
  green:  'bg-brand-100 text-brand-600',
  blue:   'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  gold:   'bg-yellow-100 text-yellow-600',
  red:    'bg-red-100 text-red-600',
};

const BADGE_GRADIENT: Record<string, string> = {
  gray:   'from-gray-500 to-gray-600',
  green:  'from-brand-600 to-brand-700',
  blue:   'from-blue-500 to-blue-600',
  purple: 'from-purple-500 to-purple-600',
  gold:   'from-yellow-500 to-yellow-600',
  red:    'from-red-500 to-red-600',
};

function formatARS(amount: number): string {
  return `$${amount.toLocaleString('es-AR')}`;
}

export const SubscriptionPanel: React.FC = () => {
  const { profile } = useAuth();
  const { plan, loading: planLoading } = usePlanFeatures();

  const [config, setConfig] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [myAdsCount, setMyAdsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Modales
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const [showRedeemCouponModal, setShowRedeemCouponModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setLoading(false);
      return;
    }
    setUserId(authUser.id);

    const [configData, transData, walletData, adsResult] = await Promise.all([
      getCreditsConfig(),
      getCreditTransactions(authUser.id, 5),
      getWalletBalance(authUser.id),
      supabase
        .from('ads')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', authUser.id)
        .in('status', ['active', 'pending']),
    ]);

    setConfig(configData);
    setTransactions(transData);
    setWalletBalance(walletData?.virtual_balance ?? 0);
    setMyAdsCount(adsResult.count ?? 0);
    setLoading(false);
  };

  const isPremium = plan.planName !== 'free';

  // Progreso de avisos
  const adsMax = plan.maxAds;
  const adsProgress = adsMax !== null ? Math.min((myAdsCount / adsMax) * 100, 100) : 0;
  const adsOverLimit = adsMax !== null && myAdsCount >= adsMax;

  // CTA contextual
  let ctaLabel = '';
  let ctaIcon = <ArrowRight className="w-4 h-4" />;
  let ctaHash = '#/upgrade';
  if (!isPremium) {
    ctaLabel = `Pasar a Premium — ${formatARS(9900)}/mes`;
    ctaHash = '#/subscription';
  } else if (isPremium && plan.maxCompanyProfiles === 0) {
    ctaLabel = 'Activar Oficina Virtual';
    ctaHash = '#/mis-empresas';
  } else {
    ctaLabel = 'Sumar Avisos Extra';
  }

  const gradientClass = BADGE_GRADIENT[plan.badgeColor] ?? BADGE_GRADIENT.green;
  const badgeColorClass = BADGE_COLOR_CLASSES[plan.badgeColor] ?? BADGE_COLOR_CLASSES.gray;

  if (loading || planLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mi Plan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona tu suscripción y créditos
        </p>
      </div>

      {/* GRID PRINCIPAL - 2 COLUMNAS */}
      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">

        {/* COLUMNA IZQUIERDA: PLAN + CRÉDITOS (3/5) */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">

          {/* PLAN ACTUAL — dinámico */}
          <Card variant="outlined" padding="lg" className="hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${gradientClass} rounded-lg flex items-center justify-center`}>
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{plan.displayName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="success" size="sm">Activo</Badge>
                    {plan.badgeText && (
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${badgeColorClass}`}>
                        {plan.badgeText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {!isPremium && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { window.location.hash = ctaHash; }}
                  className="text-brand-600 hover:text-brand-700 text-sm"
                >
                  Mejorar plan
                </Button>
              )}
            </div>

            {/* Contador de avisos */}
            {adsMax !== null ? (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Avisos activos</span>
                  <span className={`text-sm font-semibold ${adsOverLimit ? 'text-red-600' : 'text-gray-900'}`}>
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
                  <p className="text-xs text-red-500 mt-1">Límite alcanzado. Eliminá un aviso o sumá más capacidad.</p>
                )}
              </div>
            ) : (
              <div className="mb-4 flex items-center gap-2 text-sm text-brand-600">
                <CheckCircle className="w-4 h-4" />
                <span>{myAdsCount} avisos activos — sin límite</span>
              </div>
            )}

            {/* Feature flags dinámicos */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { label: `Hasta ${adsMax ?? '∞'} avisos`, active: true },
                { label: 'Chat con compradores', active: plan.hasInbox },
                { label: 'Botón WhatsApp', active: plan.canShowWhatsapp },
                { label: 'Oficina Virtual', active: plan.hasVirtualOffice },
                { label: 'Analytics', active: plan.hasAnalytics },
                { label: 'Soporte prioritario', active: plan.hasPrioritySupport },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {item.active ? (
                    <CheckCircle className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  )}
                  <span className={item.active ? 'text-gray-700' : 'text-gray-400'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            {(!isPremium || adsOverLimit) && (
              <button
                onClick={() => {
                  if (isPremium && adsOverLimit) {
                    setShowBuyCreditsModal(true);
                  } else {
                    window.location.hash = ctaHash;
                  }
                }}
                className={`mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-colors bg-gradient-to-r ${gradientClass} text-white hover:opacity-90`}
              >
                {ctaIcon}
                {ctaLabel}
              </button>
            )}
          </Card>

          {/* BALANCE WALLET — saldo ARS */}
          <Card variant="elevated" padding="none" className="overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-2">
                <p className="text-cyan-100 text-xs sm:text-sm font-medium uppercase tracking-wide">
                  Saldo para publicidad
                </p>
                <Coins className="w-5 h-5 text-white/60" />
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl sm:text-5xl font-black text-white leading-none">
                  {formatARS(walletBalance)}
                </span>
              </div>

              <p className="text-cyan-100 text-xs sm:text-sm">
                Disponible para destacar avisos
              </p>

              <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 gap-3">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={() => setShowBuyCreditsModal(true)}
                  className="bg-white text-cyan-600 hover:bg-cyan-50"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Cargar saldo
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => setShowRedeemCouponModal(true)}
                  className="border-white/40 text-white hover:bg-white/10"
                >
                  <Gift className="w-4 h-4" />
                  Cupón
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* COLUMNA DERECHA: PAQUETES + HISTORIAL (2/5) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">

          {/* PAQUETES — usa precio dinámico del plan */}
          {config && (
            <Card variant="outlined" padding="md">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-brand-600" />
                Cargar saldo
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[2500, 5000, 10000, 20000].map(amount => {
                  const isPopular = amount === 10000;
                  return (
                    <Card
                      key={amount}
                      variant="ghost"
                      padding="sm"
                      className={`cursor-pointer transition-all hover:scale-105 text-center border-2 ${
                        isPopular
                          ? 'border-brand-600 bg-brand-50'
                          : 'border-gray-200 hover:border-brand-300'
                      }`}
                      onClick={() => setShowBuyCreditsModal(true)}
                    >
                      {isPopular && (
                        <Badge variant="success" size="sm" className="mb-1 w-full justify-center text-xs">
                          Popular
                        </Badge>
                      )}
                      <div className="text-lg font-black text-brand-600">{formatARS(amount)}</div>
                      <div className="text-xs text-gray-500 mt-0.5">ARS</div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ÚLTIMOS MOVIMIENTOS */}
          {transactions.length > 0 && (
            <Card variant="outlined" padding="md">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                Movimientos
              </h3>

              <div className="space-y-2">
                {transactions.slice(0, 4).map(tx => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {tx.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString('es-AR', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={tx.amount > 0 ? 'success' : 'danger'}
                      size="sm"
                    >
                      {tx.amount > 0 ? '+' : ''}{formatARS(Math.abs(tx.amount))}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* INFO — precio aviso extra */}
          <Card variant="ghost" padding="sm" className="bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700 space-y-1">
                <p className="font-semibold text-blue-900">Tu plan incluye:</p>
                <p>
                  <span className="font-medium">{adsMax ?? '∞'} avisos activos</span> simultáneos
                </p>
                {plan.extraAdPriceArs > 0 && (
                  <p>Aviso adicional: <span className="font-medium">{formatARS(plan.extraAdPriceArs)}</span> c/u</p>
                )}
                {plan.priceMonthly === 0 && (
                  <p className="text-brand-600 font-medium">Acceso gratuito durante el lanzamiento</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* MODALES */}
      <BuyCreditsModal
        isOpen={showBuyCreditsModal}
        onClose={() => setShowBuyCreditsModal(false)}
        onSuccess={() => {
          setShowBuyCreditsModal(false);
          loadData();
        }}
      />

      <RedeemCouponModal
        isOpen={showRedeemCouponModal}
        onClose={() => setShowRedeemCouponModal(false)}
        onSuccess={() => {
          setShowRedeemCouponModal(false);
          loadData();
        }}
      />
    </div>
  );
};

export default SubscriptionPanel;

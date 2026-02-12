/**
 * SubscriptionPanel - Mi Plan
 * Gestión de Suscripción + Créditos de Publicidad
 * Design System RURAL24 - Mobile First
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Sparkles, 
  Coins, 
  ShoppingCart, 
  Gift, 
  CheckCircle,
  Clock,
  Zap,
  Loader2,
  Info,
  Star,
  Image,
  LayoutGrid,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  getUserCredits,
  getCreditsConfig,
  getCreditTransactions
} from '../../services/creditsService';
import { supabase } from '../../services/supabaseClient';
import BuyCreditsModal from '../modals/BuyCreditsModal';
import RedeemCouponModal from '../modals/RedeemCouponModal';

// Design System Components
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { Card, CardHeader, CardBody } from '../molecules/Card';

export const SubscriptionPanel: React.FC = () => {
  const { profile } = useAuth();
  const [credits, setCredits] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
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
    setUser(authUser);

    const [creditsData, configData, transData] = await Promise.all([
      getUserCredits(authUser.id),
      getCreditsConfig(),
      getCreditTransactions(authUser.id, 5)
    ]);

    setCredits(creditsData);
    setConfig(configData);
    setTransactions(transData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      {/* ============================================
          HEADER MINIMALISTA
          ============================================ */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mi Plan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona tu suscripción y créditos
        </p>
      </div>

      {/* ============================================
          GRID PRINCIPAL - 2 COLUMNAS
          ============================================ */}
      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
        
        {/* ============================================
            COLUMNA IZQUIERDA: PLAN + CRÉDITOS (3/5)
            ============================================ */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          
          {/* MI PLAN ACTUAL - Card Minimalista */}
          <Card variant="outlined" padding="lg" className="hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Plan Starter</h2>
                  <Badge variant="success" size="sm" className="mt-1">
                    Activo
                  </Badge>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="text-gray-400 cursor-not-allowed"
              >
                Próximamente
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { label: 'Avisos', value: '∞', icon: <CheckCircle className="w-4 h-4" /> },
                { label: 'Mensajes', value: '∞', icon: <CheckCircle className="w-4 h-4" /> },
                { label: 'Categorías', value: '∞', icon: <CheckCircle className="w-4 h-4" /> },
                { label: 'Soporte', value: '24/7', icon: <CheckCircle className="w-4 h-4" /> }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className="text-green-600">{item.icon}</div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Banner lanzamiento compacto */}
            <Card variant="ghost" padding="sm" className="mt-4 bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Etapa de lanzamiento:</strong> Acceso gratuito para todos
                </p>
              </div>
            </Card>
          </Card>

          {/* BALANCE DE CRÉDITOS - Estilo Fintech */}
          <Card variant="elevated" padding="none" className="overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-2">
                <p className="text-cyan-100 text-xs sm:text-sm font-medium uppercase tracking-wide">
                  Balance de Créditos
                </p>
                <Coins className="w-5 h-5 text-white/60" />
              </div>
              
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl sm:text-6xl font-black text-white leading-none">
                  {credits?.balance || 0}
                </span>
                <span className="text-lg sm:text-xl text-cyan-100 font-medium">
                  créditos
                </span>
              </div>

              <p className="text-cyan-100 text-xs sm:text-sm">
                1 crédito = 7 días de visibilidad destacada
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
                  Comprar
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

        {/* ============================================
            COLUMNA DERECHA: PAQUETES + HISTORIAL (2/5)
            ============================================ */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          
          {/* PAQUETES DE CRÉDITOS - Grid compacto */}
          <Card variant="outlined" padding="md">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              Paquetes
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {config && [1, 2, 3, 4].map(qty => {
                const price = config.credit_base_price * qty;
                const isPopular = qty === 3;
                return (
                  <Card
                    key={qty}
                    variant="ghost"
                    padding="sm"
                    className={`cursor-pointer transition-all hover:scale-105 text-center border-2 ${
                      isPopular
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                    onClick={() => setShowBuyCreditsModal(true)}
                  >
                    {isPopular && (
                      <Badge variant="success" size="sm" className="mb-1 w-full justify-center text-xs">
                        Popular
                      </Badge>
                    )}
                    <div className="text-2xl font-black text-green-600">{qty}</div>
                    <div className="text-xs text-gray-500 mb-1">
                      {qty === 1 ? 'crédito' : 'créditos'}
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      ${price.toLocaleString('es-AR')}
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>

          {/* ÚLTIMOS MOVIMIENTOS - Lista compacta */}
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
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* INFO RÁPIDA - Equivalencias */}
          <Card variant="ghost" padding="sm" className="bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700 space-y-1">
                <p className="font-semibold text-blue-900">Equivalencias:</p>
                {config && [
                  { credits: 1, days: 7 },
                  { credits: 2, days: 15 },
                  { credits: 3, days: 30 },
                  { credits: 4, days: 60 }
                ].map(({ credits, days }) => (
                  <p key={credits}>
                    <span className="font-medium">{credits} {credits === 1 ? 'crédito' : 'créditos'}</span> = {days} días
                  </p>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ============================================
          MODALES
          ============================================ */}
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
        onSuccess={(creditsGranted, newBalance) => {
          setShowRedeemCouponModal(false);
          loadData();
        }}
      />
    </div>
  );
};

export default SubscriptionPanel;

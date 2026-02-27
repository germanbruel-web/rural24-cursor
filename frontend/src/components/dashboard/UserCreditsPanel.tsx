/**
 * UserCreditsPanel.tsx
 * Dashboard de créditos del usuario
 * Mobile First - Design System RURAL24
 */

import React, { useEffect, useState } from 'react';
import { Coins, ShoppingCart, History, Gift, TrendingUp, Loader2 } from 'lucide-react';
import {
  getUserCredits,
  getCreditTransactions,
  getCreditsConfig,
  calculateCreditPrice
} from '../../services/creditsService';
import { supabase } from '../../services/supabaseClient';
import BuyCreditsModal from '../modals/BuyCreditsModal';
import RedeemCouponModal from '../modals/RedeemCouponModal';

interface Props {
  userId?: string;
  onOpenBuyCredits?: () => void;
}

export const UserCreditsPanel: React.FC<Props> = ({ userId, onOpenBuyCredits }) => {
  const [credits, setCredits] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Estados para modales
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const [showRedeemCouponModal, setShowRedeemCouponModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    
    // Usar el userId pasado como prop o obtenerlo de auth
    let currentUserId = userId;
    
    if (!currentUserId) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }
      currentUserId = authUser.id;
      setUser(authUser);
    }

    const [creditsData, transData, configData] = await Promise.all([
      getUserCredits(currentUserId),
      getCreditTransactions(currentUserId, 20),
      getCreditsConfig()
    ]);

    setCredits(creditsData);
    setTransactions(transData);
    setConfig(configData);
    setLoading(false);
  };

  if (loading || !credits || !config) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ============================================
          HEADER CON BALANCE
          ============================================ */}
      <div className="bg-gradient-to-br from-brand-600 to-emerald-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-brand-100 text-xs sm:text-sm mb-2 flex items-center gap-2">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
              SALDO DISPONIBLE
            </p>
            <div className="flex items-baseline gap-2 sm:gap-3">
              <span className="text-4xl sm:text-6xl font-black leading-none">
                {credits.balance}
              </span>
              <span className="text-lg sm:text-2xl font-semibold text-brand-100">
                ARS
              </span>
            </div>
            {credits.monthly_allowance > 0 && (
              <p className="text-brand-100 text-xs sm:text-sm mt-3">
                🎁 Recibís {credits.monthly_allowance} ARS cada mes
              </p>
            )}
          </div>

          <div className="text-right">
            <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 text-white/30 mb-3 ml-auto" />
            <p className="text-xs sm:text-sm text-brand-100 leading-relaxed">
              <span className="block">1 Crédito = {config.featured_durations[0].label}</span>
              <span className="block">4 Créditos = {config.featured_durations[3].label}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ============================================
          COMPRAR CRÉDITOS
          ============================================ */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 text-brand-600" />
          Cargar saldo
        </h3>

        {/* Grid de paquetes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {[1, 2, 3, 4].map(qty => {
            const price = config.credit_base_price * qty;
            const isRecommended = qty === 3;
            
            return (
              <button
                key={qty}
                onClick={() => setShowBuyCreditsModal(true)}
                className={`p-3 sm:p-6 rounded-xl border-2 transition-all text-center ${
                  isRecommended
                    ? 'border-brand-600 bg-brand-50 shadow-lg scale-100 hover:scale-105'
                    : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                }`}
              >
                {isRecommended && (
                  <div className="text-xs sm:text-sm font-bold text-brand-600 mb-1">
                    ⭐ MEJOR
                  </div>
                )}
                <div className="text-2xl sm:text-4xl font-black text-brand-600 mb-1">
                  {qty}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mb-2">
                  {qty === 1 ? 'destacado' : 'destacados'}
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-800">
                  ${price.toLocaleString('es-AR')}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowBuyCreditsModal(true)}
          className="w-full py-3 sm:py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <ShoppingCart className="w-5 h-5" />
          Cargar saldo
        </button>
      </section>

      {/* ============================================
          CANJEAR CUPÓN
          ============================================ */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 sm:p-8 shadow-lg border border-amber-200">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <Gift className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" />
          Canjear Cupón
        </h3>
        
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          ¿Tenés un cupón de descuento o promoción? Canjealo acá para sumar saldo a tu cuenta.
        </p>

        <button
          onClick={() => setShowRedeemCouponModal(true)}
          className="w-full py-3 sm:py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <Gift className="w-5 h-5" />
          Canjear Cupón
        </button>
      </section>

      {/* ============================================
          HISTORIAL DE TRANSACCIONES
          ============================================ */}
      <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <History className="w-6 h-6 sm:w-7 sm:h-7 text-gray-600" />
          Historial de Movimientos
        </h3>

        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm">
            No tenés movimientos todavía
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors gap-2 sm:gap-4 text-sm sm:text-base"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  {tx.type === 'purchase' && (
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-brand-600 flex-shrink-0" />
                  )}
                  {tx.type === 'spend' && (
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                  )}
                  {tx.type === 'promo_grant' && (
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 flex-shrink-0" />
                  )}
                  {tx.type === 'monthly_grant' && (
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  )}

                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className={`font-bold ${tx.amount > 0 ? 'text-brand-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} ARS
                  </p>
                  <p className="text-xs text-gray-500">
                    Saldo: {tx.balance_after} ARS
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============================================
          MODALES
          ============================================ */}
      <BuyCreditsModal
        isOpen={showBuyCreditsModal}
        onClose={() => setShowBuyCreditsModal(false)}
        onSuccess={() => {
          setShowBuyCreditsModal(false);
          loadData(); // Recargar datos para actualizar el balance
        }}
      />

      <RedeemCouponModal
        isOpen={showRedeemCouponModal}
        onClose={() => setShowRedeemCouponModal(false)}
        onSuccess={(creditsGranted, newBalance) => {
          setShowRedeemCouponModal(false);
          loadData(); // Recargar datos para actualizar el balance
        }}
      />
    </div>
  );
};

export default UserCreditsPanel;

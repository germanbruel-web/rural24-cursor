/**
 * FeaturedAdModal.tsx
 * Modal para que usuarios destaquen sus propios avisos
 * 
 * Flujo:
 * 1. Seleccionar placements en layout 3 columnas (ALTO/MEDIO/BÁSICO) — multi-select
 * 2. Elegir fecha de inicio (calendario con disponibilidad)
 * 3. Confirmar y consumir créditos
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Home,
  Search,
  FileText,
  Zap,
  Clock,
  Info,
  Gift,
  Check,
  ShoppingCart,
  Ticket
} from 'lucide-react';
import BuyCreditsModal from '../modals/BuyCreditsModal';
import RedeemCouponModal from '../modals/RedeemCouponModal';
import { 
  getUserCredits, 
  getMonthlyAvailability,
  createUserFeaturedAd,
  checkPromoStatus,
  claimPromoCredits,
  getFeaturedSettings,
  type FeaturedPlacement,
  type AvailabilityCheck,
  type MonthlyAvailabilityDay,
  type UserFeaturedCredits,
  type PromoStatus
} from '../../services/userFeaturedService';

interface FeaturedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: {
    id: string;
    title: string;
    category_id?: string;
    subcategory_id?: string;
    category_name?: string;
    images?: any[];
  };
  onSuccess?: () => void;
}

interface PlacementOption {
  value: FeaturedPlacement;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
}

const PLACEMENT_OPTIONS: PlacementOption[] = [
  {
    value: 'homepage',
    label: 'Destacado ALTO',
    shortLabel: 'ALTO',
    icon: <Home className="w-6 h-6" />,
    description: 'Inicio + Resultados + Detalle'
  },
  {
    value: 'results',
    label: 'Destacado MEDIO',
    shortLabel: 'MEDIO',
    icon: <Search className="w-6 h-6" />,
    description: 'Resultados + Detalle'
  },
  {
    value: 'detail',
    label: 'Destacado BÁSICO',
    shortLabel: 'BÁSICO',
    icon: <FileText className="w-6 h-6" />,
    description: 'Solo en detalle de avisos similares'
  }
];

// Defaults (se sobreescriben con config del servidor)
const DEFAULT_CREDIT_COSTS: Record<FeaturedPlacement, number> = {
  homepage: 6,
  results: 2,
  detail: 1
};

const DEFAULT_DURATION_DAYS = 15;

export default function FeaturedAdModal({ isOpen, onClose, ad, onSuccess }: FeaturedAdModalProps) {
  // Estados
  const [step, setStep] = useState<'placement' | 'date' | 'confirm'>('placement');
  const [selectedPlacements, setSelectedPlacements] = useState<FeaturedPlacement[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [credits, setCredits] = useState<UserFeaturedCredits | null>(null);
  const [availability, setAvailability] = useState<AvailabilityCheck | null>(null);
  const [monthAvailability, setMonthAvailability] = useState<MonthlyAvailabilityDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Config cargada del servidor
  const [creditCosts, setCreditCosts] = useState<Record<FeaturedPlacement, number>>(DEFAULT_CREDIT_COSTS);
  const [durationDays, setDurationDays] = useState<number>(DEFAULT_DURATION_DAYS);
  
  // Estados de promoción
  const [promoStatus, setPromoStatus] = useState<PromoStatus | null>(null);
  const [claimingPromo, setClaimingPromo] = useState(false);

  // Sub-modals de créditos
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);

  // Costo total de placements seleccionados
  const totalCost = selectedPlacements.reduce((sum, p) => sum + creditCosts[p], 0);

  // Cargar créditos y promoción al abrir
  useEffect(() => {
    if (isOpen) {
      loadCredits();
      loadPromoStatus();
      loadSettings();
      setStep('placement');
      setSelectedPlacements([]);
      setSelectedDate('');
      setSelectedMonth(new Date());
      setAvailability(null);
      setMonthAvailability([]);
      setError(null);
    }
  }, [isOpen]);

  // Cargar disponibilidad mensual al cambiar placements o mes
  useEffect(() => {
    if (selectedPlacements.length > 0 && ad.category_id && step === 'date') {
      loadCombinedMonthAvailability();
    }
  }, [selectedPlacements, selectedMonth, ad.category_id, step]);

  // Limpiar fecha si cambia el mes
  useEffect(() => {
    if (!selectedDate) return;
    const current = new Date(`${selectedDate}T12:00:00`);
    if (current.getFullYear() !== selectedMonth.getFullYear() || current.getMonth() !== selectedMonth.getMonth()) {
      setSelectedDate('');
      setAvailability(null);
    }
  }, [selectedMonth, selectedDate]);

  // Actualizar disponibilidad del día seleccionado
  useEffect(() => {
    if (!selectedDate) return;
    const selectedDay = new Date(`${selectedDate}T12:00:00`).getDate();
    const dayInfo = monthAvailability.find(day => day.day === selectedDay);
    if (dayInfo) {
      setAvailability({
        is_available: dayInfo.is_available,
        slots_total: dayInfo.slots_total,
        slots_used: dayInfo.slots_used,
        slots_available: dayInfo.slots_available,
        next_available_date: dayInfo.is_available ? selectedDate : null
      });
    }
  }, [selectedDate, monthAvailability]);

  const loadPromoStatus = async () => {
    const { data } = await checkPromoStatus();
    setPromoStatus(data);
  };

  const loadSettings = async () => {
    try {
      const settings = await getFeaturedSettings();
      setCreditCosts({
        homepage: 6,
        results: 2,
        detail: 1,
      });
      setDurationDays(settings.durationDays || DEFAULT_DURATION_DAYS);
    } catch (e) {
      // Fallback a defaults
    }
  };

  const handleClaimPromo = async () => {
    setClaimingPromo(true);
    const result = await claimPromoCredits();
    if (result.success) {
      await loadCredits();
      await loadPromoStatus();
    } else {
      setError(result.message);
    }
    setClaimingPromo(false);
  };

  const loadCredits = async () => {
    setLoading(true);
    const { data, error } = await getUserCredits();
    if (error) {
      setError('Error al cargar créditos');
    } else {
      setCredits(data);
    }
    setLoading(false);
  };

  /**
   * Cargar disponibilidad combinada para TODOS los placements seleccionados.
   * Un día es "disponible" sólo si TODOS los placements tienen slot libre.
   */
  const loadCombinedMonthAvailability = async () => {
    if (selectedPlacements.length === 0 || !ad.category_id) return;

    setCheckingAvailability(true);
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;

    try {
      // Cargar disponibilidad para cada placement en paralelo
      const results = await Promise.all(
        selectedPlacements.map(placement =>
          getMonthlyAvailability(placement, ad.category_id!, year, month)
        )
      );

      // Combinar: un día es disponible solo si TODOS los placements lo son
      const firstResult = results[0]?.data || [];
      const combined: MonthlyAvailabilityDay[] = firstResult.map(dayInfo => {
        const allAvailable = results.every(r => {
          const match = r.data.find(d => d.day === dayInfo.day);
          return match?.is_available ?? false;
        });
        return {
          ...dayInfo,
          is_available: allAvailable,
          // Mostrar el mínimo de slots disponibles entre todos los placements
          slots_available: Math.min(
            ...results.map(r => {
              const match = r.data.find(d => d.day === dayInfo.day);
              return match?.slots_available ?? 0;
            })
          )
        };
      });

      setMonthAvailability(combined);
    } catch (e) {
      setError('Error al cargar disponibilidad');
      setMonthAvailability([]);
    }
    setCheckingAvailability(false);
  };

  const togglePlacement = (placement: FeaturedPlacement) => {
    setSelectedPlacements(prev => 
      prev.includes(placement) 
        ? prev.filter(p => p !== placement)
        : [...prev, placement]
    );
  };

  const handleContinueToDate = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setSelectedMonth(new Date());
    setStep('date');
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleConfirm = async () => {
    if (selectedPlacements.length === 0 || !selectedDate) return;
    
    setSubmitting(true);
    setError(null);
    
    // Crear un featured ad por cada placement seleccionado
    const errors: string[] = [];
    for (const placement of selectedPlacements) {
      const { data, error } = await createUserFeaturedAd(
        ad.id,
        placement,
        selectedDate
      );
      if (error || !data?.success) {
        errors.push(`${PLACEMENT_OPTIONS.find(o => o.value === placement)?.shortLabel}: ${data?.error_message || error?.message || 'Error'}`);
      }
    }
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      setSubmitting(false);
      if (errors.length < selectedPlacements.length) {
        // Parcialmente exitoso
        onSuccess?.();
      }
      return;
    }
    
    setSubmitting(false);
    onSuccess?.();
    onClose();
  };

  // Calcular fecha mínima (hoy) y máxima (30 días)
  const minDate = new Date();
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const hasCategoryData = Boolean(ad.category_id && ad.subcategory_id);

  if (!isOpen) return null;

  const creditsAvailable = credits?.credits_available ?? 0;
  const hasCredits = creditsAvailable > 0;
  const hasEnoughCredits = creditsAvailable >= totalCost;
  const resultingLevel =
    selectedPlacements.length >= 3
      ? 'ALTO (Premium)'
      : selectedPlacements.length === 2
      ? 'MEDIO'
      : selectedPlacements.length === 1
      ? 'BASICO'
      : 'Sin nivel';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header — Verde #386539 */}
        <div className="bg-[#386539] px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Destacar Aviso</h3>
                <p className="text-sm text-white/80">Aumentá la visibilidad de tu publicación</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Créditos disponibles + Acciones */}
        <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#169834]" />
            <span className="text-sm text-gray-600">Tus créditos:</span>
            <span className={`text-xl font-bold ${hasCredits ? 'text-[#169834]' : 'text-red-500'}`}>
              {loading ? '...' : creditsAvailable}
            </span>
            <span className="text-xs text-gray-400">disponibles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowBuyModal(true)}
              className="flex items-center gap-1 bg-brand-600 hover:bg-brand-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Comprar
            </button>
            <button
              onClick={() => setShowCouponModal(true)}
              className="flex items-center gap-1 bg-white border border-[#386539] text-[#386539] hover:bg-brand-50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <Ticket className="w-3.5 h-3.5" />
              Cupón
            </button>
          </div>
        </div>

        {/* Aviso seleccionado */}
        <div className="px-6 py-3 bg-brand-50 border-b">
          <p className="text-sm text-gray-600">Aviso a destacar:</p>
          <p className="font-semibold text-gray-900 truncate">{ad.title}</p>
          {ad.category_name && (
            <p className="text-xs text-gray-500">Categoría: {ad.category_name}</p>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#169834]" />
            </div>
          ) : !hasCredits ? (
            /* Sin créditos */
            <div className="text-center py-6">
              {promoStatus?.can_claim && (
                <div className="mb-6 p-4 bg-gradient-to-r from-brand-50 to-emerald-50 border-2 border-brand-200 rounded-xl">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Gift className="w-6 h-6 text-brand-600" />
                    <span className="font-bold text-brand-700">¡Promoción de Lanzamiento!</span>
                  </div>
                  <p className="text-sm text-brand-600 mb-3">
                    {promoStatus.promo_message || `Reclamá ${promoStatus.credits_available} créditos GRATIS`}
                  </p>
                  <button
                    onClick={handleClaimPromo}
                    disabled={claimingPromo}
                    className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:bg-green-400 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                  >
                    {claimingPromo ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Reclamando...
                      </>
                    ) : (
                      <>
                        <Gift className="w-5 h-5" />
                        Reclamar {promoStatus.credits_available} créditos gratis
                      </>
                    )}
                  </button>
                </div>
              )}

              {promoStatus?.already_claimed && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  Ya reclamaste tus créditos de promoción
                </div>
              )}

              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Sin créditos disponibles</h4>
              <p className="text-gray-600 mb-4">
                Necesitás créditos disponibles para destacar tu aviso.
              </p>
              <button 
                onClick={() => setShowBuyModal(true)}
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-bold transition-colors"
              >
                <Zap className="w-5 h-5" />
                Comprar creditos
              </button>
            </div>
          ) : step === 'placement' ? (
            <div className="space-y-4">
              {!hasCategoryData && (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Categoria y subcategoria requeridas</p>
                    <p className="text-xs mt-0.5">Este aviso debe tener categoria y subcategoria asignadas.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="border rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-emerald-600 text-white text-sm font-bold">
                    1. Aviso Seleccionado
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{ad.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{ad.category_name || 'Sin categoria'}</p>
                    <p className="text-xs text-gray-500 mt-2">1 aviso seleccionado</p>
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-blue-600 text-white text-sm font-bold">
                    2. Configurar Ubicaciones
                  </div>
                  <div className="p-3 space-y-2">
                    {PLACEMENT_OPTIONS.map((option) => {
                      const isSelected = selectedPlacements.includes(option.value);
                      const canAfford = creditsAvailable >= creditCosts[option.value];
                      const isDisabled = !hasCategoryData || !canAfford;

                      return (
                        <button
                          key={option.value}
                          onClick={() => !isDisabled && togglePlacement(option.value)}
                          disabled={isDisabled}
                          className={`w-full text-left px-3 py-2 rounded-lg border flex items-center justify-between ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : isDisabled
                              ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span className="flex items-center gap-2 text-sm font-medium">
                            {option.icon}
                            {option.label}
                          </span>
                          <span className="text-xs font-bold text-gray-700">{creditCosts[option.value]} cred.</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-orange-500 text-white text-sm font-bold">
                    3. Resumen y Precio
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-sm text-gray-700">
                      Nivel resultante: <span className="font-bold">{resultingLevel}</span>
                    </p>
                    <p className="text-sm text-gray-700">
                      Precio por aviso: <span className="font-bold">{totalCost} creditos</span>
                    </p>
                    <p className="text-xs text-gray-500">Disponibles: {creditsAvailable} creditos</p>
                    {!hasEnoughCredits && selectedPlacements.length > 0 && (
                      <p className="text-xs text-red-500">No tenes creditos suficientes</p>
                    )}
                    <button
                      onClick={handleContinueToDate}
                      disabled={selectedPlacements.length === 0 || !hasEnoughCredits}
                      className="w-full mt-2 bg-brand-600 hover:bg-brand-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-bold transition-colors"
                    >
                      Elegir fecha de inicio
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : step === 'date' ? (
            /* ═══════════════════════════════════════════
               PASO 2: Elegir fecha
               ═══════════════════════════════════════════ */
            <div className="space-y-5">
              <button 
                onClick={() => setStep('placement')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← Cambiar ubicación
              </button>

              {/* Resumen de placements seleccionados */}
              <div className="p-3 bg-brand-50 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedPlacements.map(p => {
                    const opt = PLACEMENT_OPTIONS.find(o => o.value === p);
                    return (
                      <span key={p} className="text-xs font-bold bg-[#169834] text-white px-2 py-0.5 rounded-full">
                        {opt?.shortLabel}
                      </span>
                    );
                  })}
                </div>
                <span className="text-sm font-bold text-[#169834]">
                  {totalCost} créd.
                </span>
              </div>

              {/* Calendario */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="w-4 h-4" />
                    {selectedMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))}
                      className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))}
                      className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-xs text-center text-gray-500 mb-2">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                    <div key={day} className="py-1">{day}</div>
                  ))}
                </div>

                {checkingAvailability ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-[#169834] mr-2" />
                    <span className="text-sm text-gray-600">Cargando disponibilidad...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const year = selectedMonth.getFullYear();
                      const month = selectedMonth.getMonth();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const firstDay = new Date(year, month, 1).getDay();
                      const offset = (firstDay + 6) % 7;

                      const cells = [] as React.JSX.Element[];
                      for (let i = 0; i < offset; i += 1) {
                        cells.push(<div key={`empty-${i}`} />);
                      }

                      for (let day = 1; day <= daysInMonth; day += 1) {
                        const date = new Date(year, month, day, 12, 0, 0);
                        const isBeforeMin = date < new Date(minDate.toDateString());
                        const isAfterMax = date > maxDate;
                        const dayInfo = monthAvailability.find((item) => item.day === day);
                        const isAvailable = Boolean(dayInfo?.is_available);
                        const isDisabled = isBeforeMin || isAfterMax || !isAvailable;
                        const isoDate = date.toISOString().split('T')[0];
                        const isSelected = selectedDate === isoDate;

                        cells.push(
                          <button
                            key={`day-${day}`}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => handleDateChange(isoDate)}
                            className={`h-9 rounded-md text-sm font-medium transition-colors ${
                              isSelected
                                ? 'bg-[#169834] text-white'
                                : isDisabled
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                            }`}
                            title={
                              isDisabled
                                ? 'Sin disponibilidad'
                                : `Disponibles: ${dayInfo?.slots_available ?? 0}`
                            }
                          >
                            {day}
                          </button>
                        );
                      }

                      return cells;
                    })()}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-brand-200" /> Disponible
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-gray-200" /> Ocupado
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Tu aviso estará destacado por {durationDays} días desde esta fecha
                </p>
              </div>

              {/* Disponibilidad */}
              {availability && (
                <div className={`p-4 rounded-xl ${availability.is_available ? 'bg-brand-50 border border-brand-200' : 'bg-red-50 border border-red-200'}`}>
                  {availability.is_available ? (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-brand-700">¡Lugar disponible!</p>
                        <p className="text-sm text-brand-600">
                          {availability.slots_available} de {availability.slots_total} lugares libres
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-800">Sin lugares disponibles</p>
                        <p className="text-sm text-red-700">Todos los slots están ocupados para esta fecha.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botón Aceptar — siempre visible */}
              <button
                onClick={() => setStep('confirm')}
                disabled={!selectedDate || !availability?.is_available || checkingAvailability}
                className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {checkingAvailability ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verificando disponibilidad...
                  </>
                ) : !selectedDate ? (
                  'Seleccioná una fecha'
                ) : !availability?.is_available ? (
                  'Fecha no disponible'
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Aceptar y Continuar
                  </>
                )}
              </button>
            </div>
          ) : (
            /* ═══════════════════════════════════════════
               PASO 3: Confirmar
               ═══════════════════════════════════════════ */
            <div className="space-y-5">
              <button 
                onClick={() => setStep('date')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← Cambiar fecha
              </button>

              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <h4 className="font-bold text-gray-900 text-center mb-4">Resumen</h4>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Aviso:</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[200px] truncate">{ad.title}</span>
                </div>
                
                <div className="py-2 border-b border-gray-200">
                  <span className="text-gray-600">Ubicaciones:</span>
                  <div className="mt-2 space-y-1">
                    {selectedPlacements.map(p => {
                      const opt = PLACEMENT_OPTIONS.find(o => o.value === p);
                      return (
                        <div key={p} className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-[#169834] text-white px-2 py-0.5 rounded-full">
                              {opt?.shortLabel}
                            </span>
                            {opt?.label}
                          </span>
                          <span className="text-gray-600">{creditCosts[p]} créd.</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Fecha inicio:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { 
                      weekday: 'short',
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Duración:</span>
                  <span className="font-semibold text-gray-900">{durationDays} días</span>
                </div>
                
                <div className="flex justify-between items-center py-2 bg-[#386539]/10 -mx-5 px-5 rounded-b-xl">
                  <span className="text-gray-700 font-medium">Costo total:</span>
                  <span className="font-bold text-xl text-[#386539]">
                    {totalCost} crédito{totalCost > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Si tu fecha de inicio es hoy, el aviso se activará inmediatamente. 
                  Si elegiste una fecha futura, se activará automáticamente ese día.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Botón confirmar */}
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5" />
                    Confirmar y Destacar
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500">
                Se descontarán {totalCost} crédito{totalCost > 1 ? 's' : ''} de tu cuenta
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sub-modal: Comprar Créditos */}
      <BuyCreditsModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        onSuccess={() => {
          loadCredits();
          setShowBuyModal(false);
        }}
      />

      {/* Sub-modal: Canjear Cupón */}
      <RedeemCouponModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        onSuccess={() => {
          loadCredits();
          setShowCouponModal(false);
        }}
      />
    </div>
  );
}

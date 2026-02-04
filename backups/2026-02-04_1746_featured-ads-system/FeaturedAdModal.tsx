/**
 * FeaturedAdModal.tsx
 * Modal para que usuarios destaquen sus propios avisos
 * 
 * Flujo:
 * 1. Muestra créditos disponibles
 * 2. Seleccionar placement (homepage/resultados)
 * 3. Elegir fecha de inicio
 * 4. Ver disponibilidad en tiempo real
 * 5. Confirmar y consumir crédito
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
  Zap,
  Clock,
  Info,
  Gift
} from 'lucide-react';
import { 
  getUserCredits, 
  checkAvailability, 
  createUserFeaturedAd,
  checkPromoStatus,
  claimPromoCredits,
  type FeaturedPlacement,
  type AvailabilityCheck,
  type UserFeaturedCredits,
  type PromoStatus
} from '../../services/userFeaturedService';

interface FeaturedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: {
    id: string;
    title: string;
    category_id: string;
    category_name?: string;
    images?: any[];
  };
  onSuccess?: () => void;
}

const PLACEMENT_OPTIONS: { value: FeaturedPlacement; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'homepage',
    label: 'Página Principal',
    icon: <Home className="w-5 h-5" />,
    description: 'Tu aviso aparece en la sección destacada del inicio'
  },
  {
    value: 'results',
    label: 'Resultados de Búsqueda',
    icon: <Search className="w-5 h-5" />,
    description: 'Aparece primero cuando buscan en tu categoría'
  }
];

export default function FeaturedAdModal({ isOpen, onClose, ad, onSuccess }: FeaturedAdModalProps) {
  // Estados
  const [step, setStep] = useState<'placement' | 'date' | 'confirm'>('placement');
  const [selectedPlacement, setSelectedPlacement] = useState<FeaturedPlacement | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [credits, setCredits] = useState<UserFeaturedCredits | null>(null);
  const [availability, setAvailability] = useState<AvailabilityCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Estados de promoción
  const [promoStatus, setPromoStatus] = useState<PromoStatus | null>(null);
  const [claimingPromo, setClaimingPromo] = useState(false);

  // Cargar créditos y promoción al abrir
  useEffect(() => {
    if (isOpen) {
      loadCredits();
      loadPromoStatus();
      setStep('placement');
      setSelectedPlacement(null);
      setSelectedDate('');
      setAvailability(null);
      setError(null);
    }
  }, [isOpen]);

  // Verificar disponibilidad cuando cambian placement o fecha
  useEffect(() => {
    if (selectedPlacement && selectedDate && ad.category_id) {
      checkSlotAvailability();
    }
  }, [selectedPlacement, selectedDate]);

  const loadPromoStatus = async () => {
    console.log('🎁 [FeaturedAdModal] Cargando estado de promoción...');
    const { data, error } = await checkPromoStatus();
    console.log('🎁 [FeaturedAdModal] Promo status:', { data, error });
    setPromoStatus(data);
  };

  const handleClaimPromo = async () => {
    setClaimingPromo(true);
    console.log('🎁 [FeaturedAdModal] Reclamando créditos...');
    const result = await claimPromoCredits();
    console.log('🎁 [FeaturedAdModal] Resultado claim:', result);
    if (result.success) {
      // Recargar créditos y estado de promo
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
    console.log('💳 [FeaturedAdModal] Créditos:', { data, error });
    if (error) {
      setError('Error al cargar créditos');
    } else {
      setCredits(data);
    }
    setLoading(false);
  };

  const checkSlotAvailability = async () => {
    if (!selectedPlacement || !selectedDate || !ad.category_id) return;
    
    setCheckingAvailability(true);
    const { data, error } = await checkAvailability(
      selectedPlacement,
      ad.category_id,
      selectedDate
    );
    
    if (error) {
      setError('Error al verificar disponibilidad');
    } else {
      setAvailability(data);
    }
    setCheckingAvailability(false);
  };

  const handlePlacementSelect = (placement: FeaturedPlacement) => {
    setSelectedPlacement(placement);
    // Setear fecha de hoy por defecto
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setStep('date');
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleConfirm = async () => {
    if (!selectedPlacement || !selectedDate) return;
    
    setSubmitting(true);
    setError(null);
    
    const { data, error } = await createUserFeaturedAd(
      ad.id,
      selectedPlacement,
      selectedDate
    );
    
    if (error || !data?.success) {
      setError(data?.error_message || error?.message || 'Error al destacar aviso');
      setSubmitting(false);
      return;
    }
    
    setSubmitting(false);
    onSuccess?.();
    onClose();
  };

  // Calcular fecha mínima (hoy)
  const minDate = new Date().toISOString().split('T')[0];
  // Fecha máxima: 30 días adelante
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  if (!isOpen) return null;

  const creditsAvailable = credits?.credits_available ?? 0;
  const hasCredits = creditsAvailable > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-4">
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

        {/* Créditos disponibles */}
        <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-gray-600">Tus créditos:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${hasCredits ? 'text-green-600' : 'text-red-500'}`}>
              {loading ? '...' : creditsAvailable}
            </span>
            <span className="text-sm text-gray-500">disponibles</span>
          </div>
        </div>

        {/* Aviso seleccionado */}
        <div className="px-6 py-3 bg-blue-50 border-b">
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
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : !hasCredits ? (
            /* Sin créditos - Mostrar promoción si está disponible */
            <div className="text-center py-6">
              {/* Banner promocional si está activo y puede reclamar */}
              {promoStatus?.can_claim && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Gift className="w-6 h-6 text-green-600" />
                    <span className="font-bold text-green-800">🎉 ¡Promoción de Lanzamiento!</span>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    {promoStatus.promo_message || `Reclamá ${promoStatus.credits_available} créditos GRATIS`}
                  </p>
                  <button
                    onClick={handleClaimPromo}
                    disabled={claimingPromo}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-xl font-bold transition-colors"
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
                  {promoStatus.promo_end_date && (
                    <p className="text-xs text-green-600 mt-2">
                      Válido hasta {new Date(promoStatus.promo_end_date).toLocaleDateString('es-AR')}
                    </p>
                  )}
                </div>
              )}

              {/* Mensaje de ya reclamó */}
              {promoStatus?.already_claimed && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  ✅ Ya reclamaste tus créditos de promoción
                </div>
              )}

              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Sin créditos disponibles</h4>
              <p className="text-gray-600 mb-4">
                Necesitás al menos 1 crédito para destacar tu aviso.
              </p>
              <a 
                href="#/pricing"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold transition-colors"
              >
                <Zap className="w-5 h-5" />
                Comprar créditos
              </a>
            </div>
          ) : step === 'placement' ? (
            /* Paso 1: Elegir placement */
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                ¿Dónde querés destacar tu aviso?
              </h4>
              
              {PLACEMENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePlacementSelect(option.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all text-left flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 bg-gray-100 group-hover:bg-amber-100 rounded-lg flex items-center justify-center text-gray-500 group-hover:text-amber-600 transition-colors">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900">{option.label}</h5>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : step === 'date' ? (
            /* Paso 2: Elegir fecha */
            <div className="space-y-5">
              <button 
                onClick={() => setStep('placement')}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← Cambiar ubicación
              </button>

              <div className="p-4 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  {PLACEMENT_OPTIONS.find(o => o.value === selectedPlacement)?.icon}
                  <span className="font-semibold text-gray-900">
                    {PLACEMENT_OPTIONS.find(o => o.value === selectedPlacement)?.label}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Fecha de inicio
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Tu aviso estará destacado por 15 días desde esta fecha
                </p>
              </div>

              {/* Disponibilidad */}
              {checkingAvailability ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-500 mr-2" />
                  <span className="text-sm text-gray-600">Verificando disponibilidad...</span>
                </div>
              ) : availability && (
                <div className={`p-4 rounded-xl ${availability.is_available ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {availability.is_available ? (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-800">¡Lugar disponible!</p>
                        <p className="text-sm text-green-700">
                          {availability.slots_available} de {availability.slots_total} lugares libres
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-800">Sin lugares disponibles</p>
                        <p className="text-sm text-red-700">
                          Todos los slots están ocupados para esta fecha.
                          {availability.next_available_date && (
                            <> Próxima fecha disponible: <strong>{new Date(availability.next_available_date).toLocaleDateString('es-AR')}</strong></>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botón continuar */}
              {availability?.is_available && (
                <button
                  onClick={() => setStep('confirm')}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  Continuar
                  <CheckCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            /* Paso 3: Confirmar */
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
                
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Ubicación:</span>
                  <span className="font-semibold text-gray-900">
                    {PLACEMENT_OPTIONS.find(o => o.value === selectedPlacement)?.label}
                  </span>
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
                  <span className="font-semibold text-gray-900">15 días</span>
                </div>
                
                <div className="flex justify-between items-center py-2 bg-amber-100 -mx-5 px-5 rounded-b-xl">
                  <span className="text-gray-700 font-medium">Costo:</span>
                  <span className="font-bold text-xl text-amber-700">1 crédito</span>
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
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
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
                Se descontará 1 crédito de tu cuenta
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

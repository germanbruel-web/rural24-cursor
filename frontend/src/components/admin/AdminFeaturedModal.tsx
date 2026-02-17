/**
 * AdminFeaturedModal.tsx
 * ⚠️ OBSOLETO (12-Feb-2026): Reemplazado por CreateFeaturedModal.tsx
 * 
 * [DEPRECADO] Modal para que SuperAdmin destaque un aviso con calendario
 * Reemplazado por: CreateFeaturedModal.tsx (wizard de 3 pasos) que usa el mismo RPC pero con mejor UX
 * Este archivo se mantiene solo por referencia histórica.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Home,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Star,
  Sparkles,
  Info
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { notify } from '../../utils/notifications';
import type { FeaturedPlacement } from '../../services/userFeaturedService';

// ============================================================
// TYPES
// ============================================================

interface AdRow {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  subcategory_id: string | null;
  user_id: string;
  seller_name?: string;
  featured_ad_id?: string;
  featured_placement?: string;
  featured_status?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ad: AdRow;
  onSuccess?: () => void;
}

interface MonthDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
  slotsAvailable: number;
  slotsTotal: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const PLACEMENT_OPTIONS: { value: FeaturedPlacement; label: string; description: string; icon: React.ReactNode; credits: number }[] = [
  {
    value: 'homepage',
    label: 'Homepage',
    description: 'Aparece en la sección destacada del inicio',
    icon: <Home className="w-5 h-5" />,
    credits: 4
  },
  {
    value: 'results',
    label: 'Resultados de Búsqueda',
    description: 'Primero cuando buscan en esa categoría',
    icon: <Search className="w-5 h-5" />,
    credits: 1
  }
];

const DURATION_DAYS = 30;
const MAX_SLOTS_PER_CATEGORY = 10;

// ============================================================
// COMPONENT
// ============================================================

export default function AdminFeaturedModal({ isOpen, onClose, ad, onSuccess }: Props) {
  // Estados
  const [step, setStep] = useState<'placement' | 'date' | 'confirm'>('placement');
  const [placement, setPlacement] = useState<FeaturedPlacement>('homepage');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [monthAvailability, setMonthAvailability] = useState<Record<string, { available: number; total: number }>>({});
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setStep('placement');
      setPlacement('homepage');
      setSelectedDate('');
      setSelectedMonth(new Date());
      setMonthAvailability({});
      setError(null);
    }
  }, [isOpen]);

  // Cargar disponibilidad del mes al cambiar placement o mes
  useEffect(() => {
    if (isOpen && ad.category_id) {
      loadMonthAvailability();
    }
  }, [isOpen, placement, selectedMonth, ad.category_id]);

  // ============================================================
  // LOAD AVAILABILITY
  // ============================================================

  const loadMonthAvailability = async () => {
    if (!ad.category_id) return;
    
    setLoading(true);
    try {
      const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      
      // Obtener featured_ads activos/pendientes para esta categoría y placement
      const { data: featuredAds } = await supabase
        .from('featured_ads')
        .select('scheduled_start, expires_at')
        .eq('category_id', ad.category_id)
        .eq('placement', placement)
        .in('status', ['active', 'pending'])
        .gte('expires_at', monthStart.toISOString())
        .lte('scheduled_start', monthEnd.toISOString());

      // Calcular ocupación por día
      const availability: Record<string, { available: number; total: number }> = {};
      
      for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        const count = (featuredAds || []).filter(fa => {
          const start = new Date(fa.scheduled_start);
          const end = new Date(fa.expires_at);
          return d >= start && d <= end;
        }).length;
        
        availability[dateKey] = {
          available: MAX_SLOTS_PER_CATEGORY - count,
          total: MAX_SLOTS_PER_CATEGORY
        };
      }
      
      setMonthAvailability(availability);
    } catch (err) {
      console.error('Error loading availability:', err);
    }
    setLoading(false);
  };

  // ============================================================
  // CALENDAR HELPERS
  // ============================================================

  const calendarDays = useMemo((): MonthDay[] => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: MonthDay[] = [];

    // Días del mes anterior para completar la primera semana
    const firstWeekday = firstDay.getDay() || 7; // Lunes = 1
    for (let i = firstWeekday - 1; i > 0; i--) {
      const date = new Date(year, month, 1 - i);
      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isPast: date < today,
        slotsAvailable: 0,
        slotsTotal: MAX_SLOTS_PER_CATEGORY
      });
    }

    // Días del mes actual
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateKey = date.toISOString().split('T')[0];
      const avail = monthAvailability[dateKey] || { available: MAX_SLOTS_PER_CATEGORY, total: MAX_SLOTS_PER_CATEGORY };
      
      days.push({
        date,
        day: d,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: dateKey === selectedDate,
        isPast: date < today,
        slotsAvailable: avail.available,
        slotsTotal: avail.total
      });
    }

    // Días del mes siguiente para completar la última semana
    const remaining = 42 - days.length; // 6 semanas
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        day: i,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isPast: false,
        slotsAvailable: 0,
        slotsTotal: MAX_SLOTS_PER_CATEGORY
      });
    }

    return days;
  }, [selectedMonth, monthAvailability, selectedDate]);

  const prevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const selectDate = (day: MonthDay) => {
    if (!day.isCurrentMonth || day.isPast || day.slotsAvailable <= 0) return;
    setSelectedDate(day.date.toISOString().split('T')[0]);
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const handleSubmit = async () => {
    if (!selectedDate) {
      setError('Selecciona una fecha de inicio');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Verificar si ya existe un featured activo/pendiente para este ad + placement
      const { data: existing, error: checkError } = await supabase
        .from('featured_ads')
        .select('id, status')
        .eq('ad_id', ad.id)
        .eq('placement', placement)
        .in('status', ['active', 'pending', 'scheduled'])
        .maybeSingle();

      if (checkError) throw checkError;

      // Si existe, cancelarlo primero
      if (existing) {
        const { error: cancelError } = await supabase
          .from('featured_ads')
          .update({ status: 'cancelled' })
          .eq('id', existing.id);
        
        if (cancelError) throw cancelError;
      }

      // Calcular fecha de expiración
      const startDate = new Date(selectedDate);
      const expiresAt = new Date(startDate);
      expiresAt.setDate(expiresAt.getDate() + DURATION_DAYS);

      // Insertar en featured_ads (activación manual - sin créditos)
      const { error: insertError } = await supabase
        .from('featured_ads')
        .insert({
          ad_id: ad.id,
          user_id: ad.user_id,
          category_id: ad.category_id,
          placement,
          scheduled_start: selectedDate,
          expires_at: expiresAt.toISOString(),
          duration_days: DURATION_DAYS,
          status: 'active',
          manual_activated_by: (await supabase.auth.getUser()).data.user?.id,
          credit_consumed: false // Activación manual - no consume créditos
        });

      if (insertError) throw insertError;

      notify.success(`Aviso destacado en ${placement === 'homepage' ? 'Homepage' : 'Resultados'} hasta ${expiresAt.toLocaleDateString('es-AR')}`);
      onSuccess?.();
    } catch (err: any) {
      console.error('Error featuring ad:', err);
      setError(err.message || 'Error al destacar el aviso');
    }

    setSubmitting(false);
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (!isOpen) return null;

  const expiryDate = selectedDate 
    ? new Date(new Date(selectedDate).getTime() + DURATION_DAYS * 24 * 60 * 60 * 1000)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Destacar Aviso
            </h3>
            <p className="text-sm text-gray-500 mt-0.5 truncate max-w-[300px]">
              {ad.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Placement */}
          {step === 'placement' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Info className="w-4 h-4" />
                <span>Selecciona dónde mostrar el aviso destacado</span>
              </div>

              <div className="space-y-3">
                {PLACEMENT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPlacement(option.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      placement === option.value
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        placement === option.value ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{option.label}</p>
                          <span className="text-xs text-gray-500">{option.credits} créditos usuario</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Activación Manual</p>
                    <p className="text-amber-700">No se descontarán créditos al usuario</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep('date')}
                className="w-full mt-4 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-500 transition-colors"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Step 2: Date Selection */}
          {step === 'date' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('placement')}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Selecciona fecha de inicio (duración: {DURATION_DAYS} días)</span>
              </div>

              {/* Calendar */}
              <div className="border border-gray-200 rounded-xl p-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={prevMonth}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h4 className="font-medium text-gray-900">
                    {selectedMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                  </h4>
                  <button
                    onClick={nextMonth}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, idx) => {
                      const isAvailable = day.isCurrentMonth && !day.isPast && day.slotsAvailable > 0;
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => selectDate(day)}
                          disabled={!isAvailable}
                          className={`
                            aspect-square p-1 rounded-lg text-sm transition-all relative
                            ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                            ${day.isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                            ${day.isSelected ? 'bg-emerald-500 text-white font-bold' : ''}
                            ${day.isToday && !day.isSelected ? 'ring-2 ring-emerald-300' : ''}
                            ${isAvailable && !day.isSelected ? 'hover:bg-emerald-50 text-gray-900 cursor-pointer' : ''}
                            ${day.isCurrentMonth && !day.isPast && day.slotsAvailable <= 0 ? 'bg-red-50 text-red-300 cursor-not-allowed' : ''}
                          `}
                        >
                          <span>{day.day}</span>
                          {day.isCurrentMonth && !day.isPast && (
                            <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] ${
                              day.isSelected ? 'text-white/80' : 
                              day.slotsAvailable > 5 ? 'text-emerald-600' :
                              day.slotsAvailable > 0 ? 'text-amber-600' : 'text-red-400'
                            }`}>
                              {day.slotsAvailable}/{day.slotsTotal}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></div>
                    <span>Disponible</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-50 border border-red-200"></div>
                    <span>Lleno</span>
                  </div>
                </div>
              </div>

              {/* Selected Date Info */}
              {selectedDate && expiryDate && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-emerald-900">
                        {new Date(selectedDate).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <p className="text-xs text-emerald-700">
                        Hasta {expiryDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('confirm')}
                disabled={!selectedDate}
                className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('date')}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver
              </button>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="font-medium text-gray-900">Resumen</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Aviso:</span>
                    <span className="text-gray-900 font-medium truncate max-w-[200px]">{ad.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ubicación:</span>
                    <span className="text-gray-900 font-medium">
                      {placement === 'homepage' ? 'Homepage' : 'Resultados'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Inicio:</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(selectedDate).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duración:</span>
                    <span className="text-gray-900 font-medium">{DURATION_DAYS} días</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expira:</span>
                    <span className="text-gray-900 font-medium">
                      {expiryDate?.toLocaleDateString('es-AR')}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Créditos usuario:</span>
                    <span className="text-emerald-600 font-bold">
                      0 (Manual)
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-500 disabled:bg-brand-400 transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Destacando...
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5" />
                    Confirmar Destacado
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

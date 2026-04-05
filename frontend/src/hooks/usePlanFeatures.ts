import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

export interface PlanFeatures {
  // Identidad
  planId: string;
  planName: string;        // 'free' | 'premium'
  displayName: string;     // 'Plan Gratuito'
  badgeColor: string;      // 'gray' | 'green'
  iconName: string;
  badgeText: string;
  isFeatured: boolean;

  // Límites
  maxAds: number | null;           // null = ilimitado
  maxCompanyProfiles: number;
  maxFeaturedAds: number;
  maxContactsPerMonth: number | null;

  // Feature flags
  canHaveCompanyProfile: boolean;
  canShowWhatsapp: boolean;
  hasVirtualOffice: boolean;
  hasAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasInbox: boolean;
  hasPublicProfile: boolean;
  hasCatalog: boolean;

  // Precios
  priceMonthly: number;
  priceYearly: number;
  extraAdPriceArs: number;

  // Array de features textuales (para mostrar en UI)
  features: string[];
}

// Plan FREE por defecto — se usa antes de cargar o si no hay plan asignado
export const FREE_PLAN_FALLBACK: PlanFeatures = {
  planId: '',
  planName: 'free',
  displayName: 'Plan Gratuito',
  badgeColor: 'gray',
  iconName: 'gift',
  badgeText: 'Gratuito',
  isFeatured: false,
  maxAds: 3,
  maxCompanyProfiles: 0,
  maxFeaturedAds: 0,
  maxContactsPerMonth: null,
  canHaveCompanyProfile: false,
  canShowWhatsapp: false,
  hasVirtualOffice: false,
  hasAnalytics: false,
  hasPrioritySupport: false,
  hasInbox: true,
  hasPublicProfile: false,
  hasCatalog: false,
  priceMonthly: 0,
  priceYearly: 0,
  extraAdPriceArs: 2500,
  features: ['Hasta 3 avisos activos', 'Chat con compradores'],
};

export function mapRowToPlanFeatures(row: Record<string, any>): PlanFeatures {
  return {
    planId: row.id ?? '',
    planName: row.name ?? 'free',
    displayName: row.display_name ?? 'Plan Gratuito',
    badgeColor: row.badge_color ?? 'gray',
    iconName: row.icon_name ?? 'gift',
    badgeText: row.badge_text ?? '',
    isFeatured: row.is_featured ?? false,
    maxAds: row.max_ads ?? 3,
    maxCompanyProfiles: row.max_company_profiles ?? 0,
    maxFeaturedAds: row.max_featured_ads ?? 0,
    maxContactsPerMonth: row.max_contacts_per_month ?? null,
    canHaveCompanyProfile: row.can_have_company_profile ?? false,
    canShowWhatsapp: row.can_show_whatsapp ?? false,
    hasVirtualOffice: row.has_virtual_office ?? false,
    hasAnalytics: row.has_analytics ?? false,
    hasPrioritySupport: row.has_priority_support ?? false,
    hasInbox: row.has_inbox ?? true,
    hasPublicProfile: row.has_public_profile ?? false,
    hasCatalog: row.has_catalog ?? false,
    priceMonthly: row.price_monthly ?? 0,
    priceYearly: row.price_yearly ?? 0,
    extraAdPriceArs: row.extra_ad_price_ars ?? 2500,
    features: Array.isArray(row.features) ? row.features : [],
  };
}

/**
 * Lee el plan de suscripción del usuario actual desde subscription_plans.
 * - Si el usuario tiene subscription_plan_id → carga ese plan
 * - Si no tiene plan asignado → busca plan 'free' por name
 * - Mientras carga → devuelve FREE_PLAN_FALLBACK con loading: true
 */
export function usePlanFeatures(): { plan: PlanFeatures; loading: boolean } {
  const { profile } = useAuth();
  const [plan, setPlan] = useState<PlanFeatures>(FREE_PLAN_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      setLoading(true);

      try {
        // Determinar el slug del plan por role del usuario
        // role='premium'|'superadmin' → plan 'premium', role='free'|null → plan 'free'
        const targetSlug =
          profile?.role === 'premium' || profile?.role === 'superadmin'
            ? 'premium'
            : 'free';

        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('slug', targetSlug)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (!cancelled) {
          if (error || !data) {
            // Fallback por name si slug no está seteado aún
            const { data: dataByName } = await supabase
              .from('subscription_plans')
              .select('*')
              .eq('name', targetSlug)
              .eq('is_active', true)
              .limit(1)
              .single();
            setPlan(dataByName ? mapRowToPlanFeatures(dataByName) : FREE_PLAN_FALLBACK);
          } else {
            setPlan(mapRowToPlanFeatures(data));
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setPlan(FREE_PLAN_FALLBACK);
          setLoading(false);
        }
      }
    }

    // Solo cargar si el perfil ya está disponible (no mientras AuthContext carga)
    if (profile !== null) {
      loadPlan();
    } else if (profile === null) {
      // Sin usuario logueado → free fallback
      setPlan(FREE_PLAN_FALLBACK);
      setLoading(false);
    }

    return () => { cancelled = true; };
  }, [profile?.role]);

  return { plan, loading };
}

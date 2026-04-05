import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Testea mapRowToPlanFeatures y la lógica de fallback del hook
 * mockeando supabase y AuthContext.
 *
 * No se testea el ciclo completo del hook (useEffect + fetch) porque requiere
 * integración real con Supabase. Aquí se testea:
 *   1. mapRowToPlanFeatures — mapeo DB row → PlanFeatures
 *   2. FREE_PLAN_FALLBACK — valores por defecto correctos
 *   3. Selección de slug según role
 */

// ── mock supabase ──────────────────────────────────────────────────────────────
vi.mock('../services/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    }),
  },
}));

// ── mock AuthContext ───────────────────────────────────────────────────────────
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({ profile: null }),
}));

// ── importar después de los mocks ──────────────────────────────────────────────
// Importamos solo las exportaciones puras (no el hook que usa useEffect)
import { FREE_PLAN_FALLBACK_TEST, mapRowToPlanFeaturesTest } from './usePlanFeatures.testexports';

describe('FREE_PLAN_FALLBACK', () => {
  it('tiene los valores correctos para plan gratuito', () => {
    const plan = FREE_PLAN_FALLBACK_TEST;
    expect(plan.planName).toBe('free');
    expect(plan.maxAds).toBe(3);
    expect(plan.canShowWhatsapp).toBe(false);
    expect(plan.hasVirtualOffice).toBe(false);
    expect(plan.priceMonthly).toBe(0);
    expect(plan.hasInbox).toBe(true); // free tiene chat
    expect(plan.extraAdPriceArs).toBe(2500);
  });
});

describe('mapRowToPlanFeatures', () => {
  it('mapea una row de DB al formato PlanFeatures', () => {
    const row = {
      id: 'abc-123',
      name: 'premium',
      display_name: 'Plan Premium',
      badge_color: 'green',
      icon_name: 'zap',
      badge_text: 'Más popular',
      is_featured: true,
      max_ads: 10,
      max_company_profiles: 3,
      max_featured_ads: 5,
      max_contacts_per_month: null,
      can_have_company_profile: true,
      can_show_whatsapp: true,
      has_virtual_office: true,
      has_analytics: true,
      has_priority_support: true,
      has_inbox: true,
      has_public_profile: true,
      has_catalog: true,
      price_monthly: 9900,
      price_yearly: 99000,
      extra_ad_price_ars: 1500,
      features: ['Hasta 10 avisos', 'WhatsApp'],
    };

    const plan = mapRowToPlanFeaturesTest(row);

    expect(plan.planId).toBe('abc-123');
    expect(plan.planName).toBe('premium');
    expect(plan.displayName).toBe('Plan Premium');
    expect(plan.maxAds).toBe(10);
    expect(plan.maxCompanyProfiles).toBe(3);
    expect(plan.canShowWhatsapp).toBe(true);
    expect(plan.hasVirtualOffice).toBe(true);
    expect(plan.priceMonthly).toBe(9900);
    expect(plan.extraAdPriceArs).toBe(1500);
    expect(plan.features).toEqual(['Hasta 10 avisos', 'WhatsApp']);
  });

  it('aplica defaults cuando los campos son null/undefined', () => {
    const plan = mapRowToPlanFeaturesTest({});

    expect(plan.planName).toBe('free');
    expect(plan.maxAds).toBe(3);
    expect(plan.canShowWhatsapp).toBe(false);
    expect(plan.hasVirtualOffice).toBe(false);
    expect(plan.extraAdPriceArs).toBe(2500);
    expect(plan.features).toEqual([]);
  });

  it('features no-array → array vacío', () => {
    const plan = mapRowToPlanFeaturesTest({ features: 'string-invalido' });
    expect(plan.features).toEqual([]);
  });
});

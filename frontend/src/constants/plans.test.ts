import { describe, it, expect } from 'vitest';
import { canDoAction, hasPremiumFeatures } from './plans';
import type { PlanFeatures } from '../hooks/usePlanFeatures';

// ── fixtures ──────────────────────────────────────────────────────────────────

const FREE_PLAN: PlanFeatures = {
  planId: 'uuid-free',
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
  features: [],
};

const PREMIUM_PLAN: PlanFeatures = {
  ...FREE_PLAN,
  planId: 'uuid-premium',
  planName: 'premium',
  displayName: 'Plan Premium',
  badgeColor: 'green',
  iconName: 'zap',
  badgeText: 'Más popular',
  isFeatured: true,
  maxAds: 10,
  maxCompanyProfiles: 3,
  canHaveCompanyProfile: true,
  canShowWhatsapp: true,
  hasVirtualOffice: true,
  hasAnalytics: true,
  hasPrioritySupport: true,
  hasPublicProfile: true,
  hasCatalog: true,
  priceMonthly: 9900,
  priceYearly: 99000,
  extraAdPriceArs: 1500,
};

// ── canDoAction ────────────────────────────────────────────────────────────────

describe('canDoAction', () => {
  it('devuelve false si plan es null', () => {
    expect(canDoAction('show_whatsapp', null)).toBe(false);
    expect(canDoAction('virtual_office', null)).toBe(false);
    expect(canDoAction('extra_ads', null)).toBe(false);
  });

  describe('plan FREE', () => {
    it('show_whatsapp → false', () => expect(canDoAction('show_whatsapp', FREE_PLAN)).toBe(false));
    it('virtual_office → false', () => expect(canDoAction('virtual_office', FREE_PLAN)).toBe(false));
    it('analytics → false', () => expect(canDoAction('analytics', FREE_PLAN)).toBe(false));
    it('priority_support → false', () => expect(canDoAction('priority_support', FREE_PLAN)).toBe(false));
    it('company_profile → false', () => expect(canDoAction('company_profile', FREE_PLAN)).toBe(false));
    it('catalog → false', () => expect(canDoAction('catalog', FREE_PLAN)).toBe(false));
    it('extra_ads → false (priceMonthly = 0)', () => expect(canDoAction('extra_ads', FREE_PLAN)).toBe(false));
  });

  describe('plan PREMIUM', () => {
    it('show_whatsapp → true', () => expect(canDoAction('show_whatsapp', PREMIUM_PLAN)).toBe(true));
    it('virtual_office → true', () => expect(canDoAction('virtual_office', PREMIUM_PLAN)).toBe(true));
    it('analytics → true', () => expect(canDoAction('analytics', PREMIUM_PLAN)).toBe(true));
    it('priority_support → true', () => expect(canDoAction('priority_support', PREMIUM_PLAN)).toBe(true));
    it('company_profile → true', () => expect(canDoAction('company_profile', PREMIUM_PLAN)).toBe(true));
    it('catalog → true', () => expect(canDoAction('catalog', PREMIUM_PLAN)).toBe(true));
    it('extra_ads → true (priceMonthly > 0)', () => expect(canDoAction('extra_ads', PREMIUM_PLAN)).toBe(true));
  });
});

// ── hasPremiumFeatures ─────────────────────────────────────────────────────────

describe('hasPremiumFeatures', () => {
  it('superadmin siempre tiene acceso', () => {
    expect(hasPremiumFeatures({ role: 'superadmin' })).toBe(true);
  });

  it('role premium tiene acceso', () => {
    expect(hasPremiumFeatures({ role: 'premium' })).toBe(true);
  });

  it('user_type empresa tiene acceso', () => {
    expect(hasPremiumFeatures({ user_type: 'empresa' })).toBe(true);
  });

  it('plan_name que incluye "premium" tiene acceso', () => {
    expect(hasPremiumFeatures({ plan_name: 'plan_premium_mensual' })).toBe(true);
  });

  it('free sin empresa ni rol premium no tiene acceso', () => {
    expect(hasPremiumFeatures({ role: 'free', user_type: 'particular', plan_name: 'free' })).toBe(false);
  });

  it('objeto vacío no tiene acceso', () => {
    expect(hasPremiumFeatures({})).toBe(false);
  });
});

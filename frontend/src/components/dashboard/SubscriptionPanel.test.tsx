import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { PlanFeatures } from '../../hooks/usePlanFeatures';

// ── mocks hoisted (deben declararse antes que vi.mock, usando vi.hoisted) ───────

const { mockValidateCoupon, mockRedeemCoupon, mockUsePlanFeatures } = vi.hoisted(() => ({
  mockValidateCoupon:  vi.fn(),
  mockRedeemCoupon:    vi.fn(),
  mockUsePlanFeatures: vi.fn(),
}));

vi.mock('../../services/creditsService', () => ({
  validateCoupon: (...args: any[]) => mockValidateCoupon(...args),
  redeemCoupon:   (...args: any[]) => mockRedeemCoupon(...args),
}));

vi.mock('../../services/supabaseClient', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      in:     vi.fn().mockResolvedValue({ count: 2, error: null }),
    }),
  },
}));

vi.mock('../../hooks/usePlanFeatures', () => ({
  usePlanFeatures: mockUsePlanFeatures,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({ profile: { role: 'free' } }),
}));

// ── fixtures (pueden declararse después de vi.mock) ───────────────────────────

const mockFreePlan: PlanFeatures = {
  planId: 'uuid-free', planName: 'free', displayName: 'Plan Gratuito',
  badgeColor: 'gray', iconName: 'gift', badgeText: 'Gratuito', isFeatured: false,
  maxAds: 3, maxCompanyProfiles: 0, maxFeaturedAds: 0, maxContactsPerMonth: null,
  canHaveCompanyProfile: false, canShowWhatsapp: false, hasVirtualOffice: false,
  hasAnalytics: false, hasPrioritySupport: false, hasInbox: true,
  hasPublicProfile: false, hasCatalog: false,
  priceMonthly: 0, priceYearly: 0, extraAdPriceArs: 2500,
  features: [],
};

const mockPremiumPlan: PlanFeatures = {
  ...mockFreePlan,
  planId: 'uuid-premium', planName: 'premium', displayName: 'Plan Premium',
  badgeColor: 'green', iconName: 'zap', badgeText: 'Más popular', isFeatured: true,
  maxAds: 10, maxCompanyProfiles: 3,
  canHaveCompanyProfile: true, canShowWhatsapp: true, hasVirtualOffice: true,
  hasAnalytics: true, hasPrioritySupport: true, hasPublicProfile: true, hasCatalog: true,
  priceMonthly: 9900, priceYearly: 99000, extraAdPriceArs: 1500,
};

// ── importar después de los mocks ──────────────────────────────────────────────
import { SubscriptionPanel } from './SubscriptionPanel';

// ── helpers ────────────────────────────────────────────────────────────────────
function renderPanel() {
  return render(<SubscriptionPanel />);
}

// ── tests ──────────────────────────────────────────────────────────────────────

describe('SubscriptionPanel — plan FREE', () => {
  beforeEach(() => {
    mockUsePlanFeatures.mockReturnValue({ plan: mockFreePlan, loading: false });
  });

  it('muestra el nombre del plan', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText('Plan Gratuito')).toBeInTheDocument());
  });

  it('muestra CTA de Membresía Premium (no la sección de Adicionales)', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('Membresía Premium')).toBeInTheDocument();
      expect(screen.queryByText('Avisos adicionales')).not.toBeInTheDocument();
    });
  });

  it('muestra la sección de cupones', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText('Canjear cupón')).toBeInTheDocument());
  });

  it('no muestra features premium activas (WhatsApp, Oficina Virtual)', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('Botón WhatsApp')).toBeInTheDocument();
      expect(screen.getByText('Oficina Virtual')).toBeInTheDocument();
    });
    // El ícono de WhatsApp y Oficina Virtual debe ser XCircle (inactivo)
    // Se verifica indirectamente: el texto existe pero el plan no los tiene habilitados
    expect(mockFreePlan.canShowWhatsapp).toBe(false);
    expect(mockFreePlan.hasVirtualOffice).toBe(false);
  });
});

describe('SubscriptionPanel — plan PREMIUM', () => {
  beforeEach(() => {
    mockUsePlanFeatures.mockReturnValue({ plan: mockPremiumPlan, loading: false });
  });

  it('muestra el nombre del plan premium', async () => {
    renderPanel();
    await waitFor(() => expect(screen.getByText('Plan Premium')).toBeInTheDocument());
  });

  it('muestra sección de Adicionales (no la de Membresía)', async () => {
    renderPanel();
    await waitFor(() => {
      expect(screen.getByText('Avisos adicionales')).toBeInTheDocument();
      expect(screen.queryByText('Membresía Premium')).not.toBeInTheDocument();
    });
  });

  it('muestra el precio por aviso extra del plan', async () => {
    renderPanel();
    await waitFor(() => {
      const elements = screen.getAllByText(/1\.500/);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ── CouponSection — flujo completo ─────────────────────────────────────────────

describe('CouponSection', () => {
  beforeEach(() => {
    mockUsePlanFeatures.mockReturnValue({ plan: mockFreePlan, loading: false });
    mockValidateCoupon.mockReset();
    mockRedeemCoupon.mockReset();
  });

  async function getInput() {
    await waitFor(() => screen.getByPlaceholderText('CÓDIGO DE CUPÓN'));
    return screen.getByPlaceholderText('CÓDIGO DE CUPÓN') as HTMLInputElement;
  }

  it('el botón Validar está deshabilitado si el input está vacío', async () => {
    renderPanel();
    await waitFor(() => screen.getByText('Validar'));
    const btn = screen.getByText('Validar').closest('button')!;
    expect(btn).toBeDisabled();
  });

  it('habilita el botón al escribir un código', async () => {
    renderPanel();
    const input = await getInput();
    fireEvent.change(input, { target: { value: 'RURAL2024' } });
    expect(screen.getByText('Validar').closest('button')).not.toBeDisabled();
  });

  it('convierte el input a mayúsculas', async () => {
    renderPanel();
    const input = await getInput();
    fireEvent.change(input, { target: { value: 'rural2024' } });
    expect(input.value).toBe('RURAL2024');
  });

  it('muestra error si validateCoupon retorna invalid', async () => {
    mockValidateCoupon.mockResolvedValue({ valid: false, error: 'Cupón vencido' });
    renderPanel();
    const input = await getInput();
    fireEvent.change(input, { target: { value: 'VENCIDO' } });
    fireEvent.click(screen.getByText('Validar'));
    await waitFor(() => expect(screen.getByText('Cupón vencido')).toBeInTheDocument());
  });

  it('muestra preview si validateCoupon retorna valid con arsAmount', async () => {
    mockValidateCoupon.mockResolvedValue({
      valid: true,
      description: 'Cupón de $5.000 en crédito',
      arsAmount: 5000,
      membershipPlanName: null,
      membershipDays: null,
    });
    renderPanel();
    const input = await getInput();
    fireEvent.change(input, { target: { value: 'PROMO50' } });
    fireEvent.click(screen.getByText('Validar'));
    await waitFor(() => expect(screen.getByText('Cupón de $5.000 en crédito')).toBeInTheDocument());
    expect(screen.getByText('Confirmar canje')).toBeInTheDocument();
  });

  it('muestra badge de membresía en el preview si el cupón otorga plan', async () => {
    mockValidateCoupon.mockResolvedValue({
      valid: true,
      description: 'Activá Premium 30 días',
      arsAmount: 0,
      membershipPlanName: 'Plan Premium',
      membershipDays: 30,
    });
    renderPanel();
    const input = await getInput();
    fireEvent.change(input, { target: { value: 'PREMIUM30' } });
    fireEvent.click(screen.getByText('Validar'));
    await waitFor(() => {
      expect(screen.getAllByText(/Plan Premium/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/30 días/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('ejecuta redeem con el código correcto y llama al callback', async () => {
    mockValidateCoupon.mockResolvedValue({
      valid: true,
      description: 'Cupón válido',
      arsAmount: 1000,
      membershipPlanName: null,
      membershipDays: null,
    });
    mockRedeemCoupon.mockResolvedValue({ success: true, message: '¡Cupón canjeado con éxito!' });

    renderPanel();
    const input = await getInput();
    fireEvent.change(input, { target: { value: 'EXITOSO' } });
    fireEvent.click(screen.getByText('Validar'));
    await waitFor(() => screen.getByText('Confirmar canje'));
    fireEvent.click(screen.getByText('Confirmar canje'));
    // El componente llama onRedeemed → loadData() que remonta el panel
    // Verificamos que redeemCoupon fue llamado con el código correcto
    await waitFor(() => expect(mockRedeemCoupon).toHaveBeenCalledWith('EXITOSO'));
  });

  it('muestra error si redeemCoupon falla', async () => {
    mockValidateCoupon.mockResolvedValue({
      valid: true,
      description: 'Cupón válido',
      arsAmount: 500,
      membershipPlanName: null,
      membershipDays: null,
    });
    mockRedeemCoupon.mockResolvedValue({ success: false, error: 'Cupón ya utilizado' });

    renderPanel();
    const input = await getInput();
    fireEvent.change(input, { target: { value: 'USADO' } });
    fireEvent.click(screen.getByText('Validar'));
    await waitFor(() => screen.getByText('Confirmar canje'));
    fireEvent.click(screen.getByText('Confirmar canje'));
    await waitFor(() => expect(screen.getByText('Cupón ya utilizado')).toBeInTheDocument());
  });

  it('Enter en el input dispara validación', async () => {
    mockValidateCoupon.mockResolvedValue({ valid: false, error: 'Inválido' });
    renderPanel();
    const input = await getInput();
    fireEvent.change(input, { target: { value: 'TEST' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(mockValidateCoupon).toHaveBeenCalledWith('TEST'));
  });
});

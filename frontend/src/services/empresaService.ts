// ============================================================================
// EMPRESA SERVICE — Sprint 6B
// ============================================================================
// Multi-empresa por usuario. Usa RPC get_my_companies (Sprint 6A).
// CRUD sobre business_profiles + business_profile_members.
// ============================================================================

import { supabase } from './supabaseClient';

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface MyCompany {
  id: string;
  slug: string;
  company_name: string;
  logo_url: string | null;
  cover_url: string | null;
  tagline: string | null;
  description: string | null;
  is_verified: boolean;
  is_active: boolean;
  profile_views: number;
  show_on_ad_detail: boolean;
  owner_public: boolean;
  role: 'owner' | 'admin' | 'editor';
  ads_count: number;
  province: string | null;
  city: string | null;
}

export interface CreateEmpresaData {
  company_name: string;
  tagline?: string;
  description?: string;
  whatsapp?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  social_networks?: { facebook?: string; instagram?: string };
  province?: string;
  city?: string;
  category_id?: string;
  owner_public?: boolean;
  show_on_ad_detail?: boolean;
}

export interface UpdateEmpresaData extends Partial<CreateEmpresaData> {
  logo_url?: string;
  cover_url?: string;
}

// ── Tipo de error de límite de plan ───────────────────────────────────────

export class CompanyLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CompanyLimitError';
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildSlug(companyName: string): string {
  const base = companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base}-${Date.now().toString(36)}`;
}

// ── Queries ────────────────────────────────────────────────────────────────

/**
 * Devuelve todas las empresas del usuario autenticado con conteo de avisos.
 * Usa el RPC get_my_companies (Sprint 6A).
 */
export async function getMyCompanies(): Promise<MyCompany[]> {
  try {
    const { data, error } = await supabase.rpc('get_my_companies');
    if (error) throw error;
    return (data as MyCompany[]) ?? [];
  } catch (err) {
    console.error('Error getting companies:', err);
    return [];
  }
}

/**
 * Cuántas empresas puede tener el usuario según su plan.
 * Retorna 0 si es FREE, 1 si PREMIUM, etc.
 */
export async function getMaxCompaniesAllowed(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from('users')
      .select('subscription_plan_id, role')
      .eq('id', user.id)
      .single();

    if (error || !data) return 0;
    if (data.role === 'superadmin') return 99;

    if (!data.subscription_plan_id) return 0;

    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('max_company_profiles')
      .eq('id', data.subscription_plan_id)
      .single();

    return plan?.max_company_profiles ?? 0;
  } catch {
    return 0;
  }
}

// ── Mutaciones ─────────────────────────────────────────────────────────────

/**
 * Crea una nueva empresa para el usuario autenticado.
 * El trigger enforce_max_companies en DB controla el límite de plan.
 */
export async function createEmpresa(data: CreateEmpresaData): Promise<MyCompany> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  // 1. Insertar en business_profiles
  const { data: bp, error: bpErr } = await supabase
    .from('business_profiles')
    .insert({
      user_id: user.id,
      slug: buildSlug(data.company_name),
      company_name: data.company_name,
      tagline: data.tagline ?? null,
      description: data.description ?? null,
      whatsapp: data.whatsapp ?? null,
      website: data.website ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      social_networks: data.social_networks ?? {},
      province: data.province ?? null,
      city: data.city ?? null,
      category_id: data.category_id ?? null,
      owner_public: data.owner_public ?? false,
      show_on_ad_detail: data.show_on_ad_detail ?? true,
    })
    .select('id')
    .single();

  if (bpErr) {
    // El trigger COMPANY_LIMIT_REACHED lanza ERRCODE P0001
    if (bpErr.message?.includes('COMPANY_LIMIT_REACHED') || bpErr.code === 'P0001') {
      throw new CompanyLimitError(bpErr.message);
    }
    throw new Error('Error al crear empresa: ' + bpErr.message);
  }

  // 2. Insertar en business_profile_members como owner
  //    (El trigger enforce_max_companies valida el límite aquí)
  const { error: memErr } = await supabase
    .from('business_profile_members')
    .insert({ business_profile_id: bp.id, user_id: user.id, role: 'owner' });

  if (memErr) {
    // Rollback manual: eliminar el perfil si el member falla
    await supabase.from('business_profiles').delete().eq('id', bp.id);
    if (memErr.message?.includes('COMPANY_LIMIT_REACHED') || memErr.code === 'P0001') {
      throw new CompanyLimitError(memErr.message);
    }
    throw new Error('Error al registrar membresía: ' + memErr.message);
  }

  // 3. Retornar via RPC para obtener el shape completo (con ads_count, role, etc.)
  const { data: companies } = await supabase.rpc('get_my_companies');
  const created = (companies as MyCompany[])?.find(c => c.id === bp.id);
  if (!created) throw new Error('Empresa creada pero no se pudo recuperar');
  return created;
}

/**
 * Actualiza los datos de una empresa (solo el owner puede).
 */
export async function updateEmpresa(id: string, data: UpdateEmpresaData): Promise<void> {
  const { error } = await supabase
    .from('business_profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error('Error al actualizar empresa: ' + error.message);
}

/**
 * Activa o desactiva una empresa (is_active toggle).
 */
export async function toggleEmpresaActiva(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('business_profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error('Error al cambiar estado: ' + error.message);
}

/**
 * Elimina una empresa permanentemente (solo owner, acción destructiva).
 */
export async function deleteEmpresa(id: string): Promise<void> {
  const { error } = await supabase
    .from('business_profiles')
    .delete()
    .eq('id', id);

  if (error) throw new Error('Error al eliminar empresa: ' + error.message);
}

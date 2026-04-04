// ============================================================
// LOCATIONS SERVICE — Sprint 5A
// ============================================================
// Provincias y localidades desde DB (reemplaza constants/locations.ts).
// Cache en memoria para evitar queries repetidas.
// ============================================================

import { supabase } from '../supabaseClient';

// ─── TIPOS ────────────────────────────────────────────────────

export interface Province {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Locality {
  id: string;
  province_id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active?: boolean;
}

// ─── CACHE ────────────────────────────────────────────────────

let _provinces: Province[] | null = null;
const _localities: Record<string, Locality[]> = {};

// ─── PROVINCIAS ───────────────────────────────────────────────

export async function getProvinces(): Promise<Province[]> {
  if (_provinces) return _provinces;

  const { data, error } = await supabase
    .from('provinces')
    .select('id, name, slug, sort_order')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  _provinces = (data || []) as Province[];
  return _provinces;
}

// ─── LOCALIDADES ──────────────────────────────────────────────

export async function getLocalitiesByProvince(provinceId: string): Promise<Locality[]> {
  if (_localities[provinceId]) return _localities[provinceId];

  const { data, error } = await supabase
    .from('localities')
    .select('id, province_id, name, slug, sort_order')
    .eq('province_id', provinceId)
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  _localities[provinceId] = (data || []) as Locality[];
  return _localities[provinceId];
}

// ─── ADMIN ────────────────────────────────────────────────────

export async function createLocality(input: {
  province_id: string;
  name: string;
  slug: string;
}): Promise<Locality> {
  const { data, error } = await supabase
    .from('localities')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  // Invalidar cache de esa provincia
  delete _localities[input.province_id];
  return data as Locality;
}

export async function updateLocality(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('localities')
    .update({ name })
    .eq('id', id);

  if (error) throw error;
  // Invalidar todo el cache de localidades
  Object.keys(_localities).forEach((k) => delete _localities[k]);
}

export async function deleteLocality(id: string, provinceId: string): Promise<void> {
  const { error } = await supabase
    .from('localities')
    .delete()
    .eq('id', id);

  if (error) throw error;
  delete _localities[provinceId];
}

export async function toggleLocality(id: string, isActive: boolean, provinceId: string): Promise<void> {
  const { error } = await supabase
    .from('localities')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) throw error;
  delete _localities[provinceId];
}

// ─── HELPER ───────────────────────────────────────────────────

/** Genera slug a partir del nombre (para nuevas localidades) */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

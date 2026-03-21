/**
 * homeSectionsService — CMS-A
 * Obtiene y cachea las secciones dinámicas de la homepage.
 */

import { supabase } from '../supabaseClient';

export type SectionType = 'featured_grid' | 'category_carousel' | 'ad_list' | 'banner' | 'stats';

export interface HomeSection {
  id: string;
  type: SectionType;
  title: string;
  query_filter: Record<string, unknown>;
  display_config: Record<string, unknown>;
  active_schedule: { starts_at?: string; ends_at?: string } | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateHomeSectionInput {
  type: SectionType;
  title: string;
  query_filter?: Record<string, unknown>;
  display_config?: Record<string, unknown>;
  active_schedule?: { starts_at?: string; ends_at?: string } | null;
  sort_order?: number;
  is_active?: boolean;
}

// ---- Caché en memoria (TTL 60s) ----
let _cache: HomeSection[] | null = null;
let _cacheTs = 0;
const CACHE_TTL = 60_000;

/** Obtiene secciones activas (homepage pública) — usa caché 60s */
export async function getHomeComposition(): Promise<HomeSection[]> {
  if (_cache && Date.now() - _cacheTs < CACHE_TTL) return _cache;

  const { data, error } = await supabase.rpc('get_home_composition');
  if (error) throw error;

  _cache = (data ?? []) as HomeSection[];
  _cacheTs = Date.now();
  return _cache;
}

function invalidateCache() {
  _cache = null;
  _cacheTs = 0;
}

// ---- Admin CRUD (sin caché) ----

/** Todas las secciones sin filtro de is_active — para el panel admin */
export async function getAllHomeSections(): Promise<HomeSection[]> {
  const { data, error } = await supabase
    .from('home_sections')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as HomeSection[];
}

export async function createHomeSection(input: CreateHomeSectionInput): Promise<HomeSection> {
  const { data, error } = await supabase
    .from('home_sections')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  invalidateCache();
  return data as HomeSection;
}

export async function updateHomeSection(
  id: string,
  input: Partial<CreateHomeSectionInput>
): Promise<HomeSection> {
  const { data, error } = await supabase
    .from('home_sections')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  invalidateCache();
  return data as HomeSection;
}

export async function deleteHomeSection(id: string): Promise<void> {
  const { error } = await supabase.from('home_sections').delete().eq('id', id);
  if (error) throw error;
  invalidateCache();
}

export async function toggleHomeSectionActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('home_sections')
    .update({ is_active: isActive })
    .eq('id', id);
  if (error) throw error;
  invalidateCache();
}

/** Reordenar: actualiza sort_order en lote */
export async function reorderHomeSections(
  items: { id: string; sort_order: number }[]
): Promise<void> {
  const updates = items.map(({ id, sort_order }) =>
    supabase.from('home_sections').update({ sort_order }).eq('id', id)
  );
  await Promise.all(updates);
  invalidateCache();
}

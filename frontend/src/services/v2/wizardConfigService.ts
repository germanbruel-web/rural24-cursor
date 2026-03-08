// ============================================================
// WIZARD CONFIG SERVICE — Sprint 4F
// ============================================================
// Gestiona la configuración de steps del wizard de publicación.
// Permite controlar orden, visibilidad y labels desde el admin.
// ============================================================

import { supabase } from '../supabaseClient';

// ─── TIPOS ────────────────────────────────────────────────────

export interface WizardStep {
  key: string;          // 'categoria' | 'caracteristicas' | 'ubicacion' | 'fotos' | 'informacion' | 'revision'
  label: string;        // Título visible en el stepper
  description: string;  // Subtítulo
  icon: string;         // Nombre del icono Lucide
  visible: boolean;     // Si se muestra en el wizard
  order: number;        // Posición (1-based)
  locked: boolean;      // Si no puede ocultarse ni moverse (categoria y revision)
}

export interface WizardConfig {
  id: string;
  name: string;
  display_name: string;
  category_id: string | null;
  steps: WizardStep[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── STEPS DEFAULT (fallback si no hay DB) ────────────────────

export const DEFAULT_STEPS: WizardStep[] = [
  { key: 'categoria',       label: 'Categoría',         description: '¿Qué publicás?',        icon: 'Tag',          visible: true, order: 1, locked: true  },
  { key: 'caracteristicas', label: 'Características',   description: 'Detalles técnicos',      icon: 'Settings',     visible: true, order: 2, locked: false },
  { key: 'ubicacion',       label: 'Ubicación',         description: 'Dónde está',             icon: 'MapPin',       visible: true, order: 3, locked: false },
  { key: 'fotos',           label: 'Fotos',             description: 'Imágenes del aviso',     icon: 'Camera',       visible: true, order: 4, locked: false },
  { key: 'informacion',     label: 'Información',       description: 'Título y descripción',   icon: 'FileText',     visible: true, order: 5, locked: false },
  { key: 'revision',        label: 'Revisar y Publicar',description: 'Confirmar publicación',  icon: 'CheckCircle2', visible: true, order: 6, locked: true  },
];

// ─── READ ─────────────────────────────────────────────────────

/**
 * Obtiene la config de wizard para una categoría (o la default si no hay override).
 */
export async function getWizardConfig(categoryId?: string | null): Promise<WizardStep[]> {
  try {
    // Intentar config específica por categoría
    if (categoryId) {
      const { data: catConfig } = await supabase
        .from('wizard_configs')
        .select('steps')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .single();

      if (catConfig?.steps) {
        return sortVisible(catConfig.steps as WizardStep[]);
      }
    }

    // Fallback: config default
    const { data: defaultConfig } = await supabase
      .from('wizard_configs')
      .select('steps')
      .eq('name', 'default')
      .eq('is_active', true)
      .single();

    if (defaultConfig?.steps) {
      return sortVisible(defaultConfig.steps as WizardStep[]);
    }

    return sortVisible(DEFAULT_STEPS);
  } catch {
    return sortVisible(DEFAULT_STEPS);
  }
}

/** Obtiene todas las configs (para el admin) */
export async function getAllWizardConfigs(): Promise<WizardConfig[]> {
  const { data, error } = await supabase
    .from('wizard_configs')
    .select('*')
    .order('name');

  if (error) throw error;
  return (data || []) as WizardConfig[];
}

// ─── UPDATE ───────────────────────────────────────────────────

export async function updateWizardConfigSteps(
  configId: string,
  steps: WizardStep[]
): Promise<void> {
  const { error } = await supabase
    .from('wizard_configs')
    .update({ steps, updated_at: new Date().toISOString() })
    .eq('id', configId);

  if (error) throw error;
}

export async function createWizardConfig(input: {
  name: string;
  display_name: string;
  category_id?: string | null;
  steps?: WizardStep[];
}): Promise<WizardConfig> {
  const { data, error } = await supabase
    .from('wizard_configs')
    .insert({
      name: input.name,
      display_name: input.display_name,
      category_id: input.category_id || null,
      steps: input.steps ?? DEFAULT_STEPS,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as WizardConfig;
}

export async function deleteWizardConfig(id: string): Promise<void> {
  const { error } = await supabase
    .from('wizard_configs')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── HELPERS ──────────────────────────────────────────────────

function sortVisible(steps: WizardStep[]): WizardStep[] {
  return steps
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);
}

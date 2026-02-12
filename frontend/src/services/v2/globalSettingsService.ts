/**
 * Global Settings Service
 * Servicio para leer/escribir configuraciones globales del sistema
 * 
 * Las configuraciones se almacenan en la tabla global_settings
 * y pueden ser modificadas solo por SuperAdmin
 */

import { supabase } from '../supabaseClient';

// ============================================================================
// TIPOS
// ============================================================================

export interface GlobalSetting {
  id: string;
  key: string;
  value: any; // Se parsea según value_type
  category: string;
  display_name: string;
  description: string;
  value_type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  is_public: boolean;
  updated_at: string;
}

export interface SettingsByCategory {
  [category: string]: GlobalSetting[];
}

// ============================================================================
// CACHE
// ============================================================================

const CACHE_TTL = 10 * 60 * 1000; // 10 minutos para settings públicos
let settingsCache: { data: Map<string, any>; timestamp: number } = {
  data: new Map(),
  timestamp: 0
};

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Obtener un setting por key
 */
export async function getSetting<T = any>(key: string, defaultValue?: T): Promise<T> {
  // Check cache primero
  if (settingsCache.data.has(key) && Date.now() - settingsCache.timestamp < CACHE_TTL) {
    return settingsCache.data.get(key) as T;
  }

  const { data, error } = await supabase
    .from('global_settings')
    .select('value, value_type')
    .eq('key', key)
    .maybeSingle(); // Cambiado de .single() a .maybeSingle() para evitar error si no existe

  if (error) {
    console.warn(`Setting "${key}" error:`, error.message);
    return defaultValue as T;
  }

  if (!data) {
    console.warn(`Setting "${key}" not found, using default:`, defaultValue);
    return defaultValue as T;
  }

  const parsedValue = parseValue(data.value, data.value_type);
  settingsCache.data.set(key, parsedValue);
  settingsCache.timestamp = Date.now();

  return parsedValue as T;
}

/**
 * Obtener un setting como número
 */
export async function getSettingNumber(key: string, defaultValue: number = 0): Promise<number> {
  const value = await getSetting<number>(key, defaultValue);
  return typeof value === 'number' ? value : Number(value) || defaultValue;
}

/**
 * Obtener un setting como booleano
 */
export async function getSettingBool(key: string, defaultValue: boolean = false): Promise<boolean> {
  const value = await getSetting<boolean>(key, defaultValue);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
}

/**
 * Obtener todos los settings
 */
export async function getAllSettings(): Promise<GlobalSetting[]> {
  const { data, error } = await supabase
    .from('global_settings')
    .select('*')
    .order('category')
    .order('key');

  if (error) {
    console.error('Error getting all settings:', error);
    return [];
  }

  return (data || []).map(s => ({
    ...s,
    value: parseValue(s.value, s.value_type)
  }));
}

/**
 * Obtener settings agrupados por categoría
 */
export async function getSettingsByCategory(): Promise<SettingsByCategory> {
  const settings = await getAllSettings();
  
  return settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as SettingsByCategory);
}

/**
 * Obtener settings de una categoría específica
 */
export async function getSettingsForCategory(category: string): Promise<GlobalSetting[]> {
  const { data, error } = await supabase
    .from('global_settings')
    .select('*')
    .eq('category', category)
    .order('key');

  if (error) {
    console.error(`Error getting settings for category "${category}":`, error);
    return [];
  }

  return (data || []).map(s => ({
    ...s,
    value: parseValue(s.value, s.value_type)
  }));
}

/**
 * Actualizar un setting (solo SuperAdmin)
 */
export async function setSetting(key: string, value: any): Promise<boolean> {
  const { error } = await supabase
    .from('global_settings')
    .update({ 
      value: JSON.stringify(value),
      updated_at: new Date().toISOString()
    })
    .eq('key', key);

  if (error) {
    console.error(`Error updating setting "${key}":`, error);
    return false;
  }

  // Limpiar cache
  settingsCache.data.delete(key);
  
  return true;
}

/**
 * Actualizar múltiples settings
 */
export async function setSettings(settings: Record<string, any>): Promise<boolean> {
  const updates = Object.entries(settings).map(([key, value]) => ({
    key,
    value: JSON.stringify(value),
    updated_at: new Date().toISOString()
  }));

  // Upsert en lote (requiere unique constraint en key)
  for (const update of updates) {
    const { error } = await supabase
      .from('global_settings')
      .update({ value: update.value, updated_at: update.updated_at })
      .eq('key', update.key);
    
    if (error) {
      console.error(`Error updating setting "${update.key}":`, error);
      return false;
    }
  }

  // Limpiar cache completo
  settingsCache.data.clear();
  
  return true;
}

/**
 * Crear un nuevo setting (solo SuperAdmin)
 */
export async function createSetting(setting: Omit<GlobalSetting, 'id' | 'updated_at'>): Promise<boolean> {
  const { error } = await supabase
    .from('global_settings')
    .insert({
      key: setting.key,
      value: JSON.stringify(setting.value),
      category: setting.category,
      display_name: setting.display_name,
      description: setting.description,
      value_type: setting.value_type,
      is_public: setting.is_public
    });

  if (error) {
    console.error('Error creating setting:', error);
    return false;
  }

  return true;
}

// ============================================================================
// SETTINGS ESPECÍFICOS (Shortcuts tipados)
// ============================================================================

/**
 * Configuración de destacados
 */
export async function getFeaturedSettings() {
  return {
    maxPerCategory: await getSettingNumber('featured_max_per_category', 10),
    minDays: await getSettingNumber('featured_min_days', 7),
    maxDays: await getSettingNumber('featured_max_days', 30),
    pricePerDay: await getSettingNumber('featured_price_per_day', 500)
  };
}

/**
 * Verificar si el sitio está en mantenimiento
 */
export async function isMaintenanceMode(): Promise<boolean> {
  return await getSettingBool('site_maintenance_mode', false);
}

/**
 * Obtener plan por defecto para nuevos usuarios
 */
export async function getDefaultPlanName(): Promise<string> {
  return await getSetting<string>('new_user_default_plan', 'free');
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Parsear valor según su tipo
 */
function parseValue(value: any, valueType: string): any {
  if (value === null || value === undefined) return value;
  
  // Si ya viene parseado (JSONB)
  if (typeof value === 'object') return value;
  
  // Si es string, parsear
  const strValue = typeof value === 'string' ? value : String(value);
  
  switch (valueType) {
    case 'number':
      return Number(strValue);
    case 'boolean':
      return strValue.toLowerCase() === 'true';
    case 'json':
    case 'array':
      try {
        return JSON.parse(strValue);
      } catch {
        return strValue;
      }
    default:
      return strValue;
  }
}

/**
 * Limpiar cache (útil para testing)
 */
export function clearSettingsCache() {
  settingsCache.data.clear();
  settingsCache.timestamp = 0;
}

// ============================================================================
// CATEGORÍAS CONOCIDAS
// ============================================================================

export const SETTING_CATEGORIES = {
  GENERAL: 'general',
  PLANS: 'plans',
  FEATURED: 'featured',
  CONTACTS: 'contacts',
  ANALYTICS: 'analytics'
} as const;

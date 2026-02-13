/**
 * Hero CMS Service
 * Gestiona la configuración del Hero (video de fondo, imágenes, textos)
 * Solo SuperAdmin puede modificar. Todos pueden leer.
 */
import { supabase } from './supabaseClient';

// ============================================================================
// TIPOS
// ============================================================================

export type HeroBackgroundType = 'video' | 'image' | 'carousel';

export interface HeroConfig {
  // Tipo de fondo
  background_type: HeroBackgroundType;

  // Video (YouTube)
  video_url: string; // URL completa o ID de YouTube
  video_autoplay: boolean;
  video_muted: boolean;
  video_loop: boolean;

  // Imagen estática
  image_url: string;
  image_alt: string;

  // Overlay
  overlay_opacity: number; // 0-100
  overlay_color: string; // hex color

  // Textos del Hero
  title: string;
  subtitle: string;

  // Estado
  is_active: boolean;
  updated_at: string;
}

const DEFAULT_HERO_CONFIG: HeroConfig = {
  background_type: 'image',
  video_url: '',
  video_autoplay: true,
  video_muted: true,
  video_loop: true,
  image_url: '',
  image_alt: '',
  overlay_opacity: 40,
  overlay_color: '#000000',
  title: 'Encontrá lo que necesitás para tu campo',
  subtitle: 'Miles de productos agrícolas, maquinarias y servicios en un solo lugar',
  is_active: true,
  updated_at: new Date().toISOString(),
};

// Cache
let heroConfigCache: { data: HeroConfig | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Event para notificar cambios al Hero component
const HERO_CONFIG_CHANGED_EVENT = 'hero-config-changed';

/**
 * Suscribirse a cambios de la config del Hero
 */
export function onHeroConfigChanged(callback: () => void): () => void {
  window.addEventListener(HERO_CONFIG_CHANGED_EVENT, callback);
  return () => window.removeEventListener(HERO_CONFIG_CHANGED_EVENT, callback);
}

/**
 * Notificar que la config cambió
 */
function notifyHeroConfigChanged(): void {
  window.dispatchEvent(new Event(HERO_CONFIG_CHANGED_EVENT));
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extraer YouTube video ID de una URL o devolver el string si ya es un ID
 */
export function extractYouTubeId(input: string): string {
  if (!input) return '';

  const trimmed = input.trim();

  // Ya es un ID (11 chars alfanuméricos con - y _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // URLs de YouTube - soporta todos los formatos:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtube.com/watch?v=VIDEO_ID&feature=shared
  // https://m.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://youtu.be/VIDEO_ID?si=xxxxx
  // https://www.youtube.com/embed/VIDEO_ID
  // https://youtube.com/shorts/VIDEO_ID
  // https://www.youtube.com/v/VIDEO_ID
  // https://www.youtube.com/live/VIDEO_ID
  // youtube.com/watch?v=VIDEO_ID (sin protocolo)
  const patterns = [
    // watch?v= (con posibles parámetros antes o después)
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/,
    // youtu.be/VIDEO_ID (con posibles query params)
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // embed/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // shorts/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    // /v/VIDEO_ID (legacy)
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    // /live/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    // youtube-nocookie.com/embed/VIDEO_ID
    /(?:https?:\/\/)?(?:www\.)?youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }

  // Fallback: si contiene algo que parece un ID de 11 chars, intentar extraerlo
  const fallback = trimmed.match(/([a-zA-Z0-9_-]{11})/);
  if (fallback) return fallback[1];

  return trimmed;
}

/**
 * Construir URL de embed de YouTube
 */
export function buildYouTubeEmbedUrl(config: HeroConfig): string {
  const videoId = extractYouTubeId(config.video_url);
  if (!videoId) return '';

  const params = new URLSearchParams({
    controls: '0',
    showinfo: '0',
    modestbranding: '1',
    playsinline: '1',
    rel: '0',
    enablejsapi: '1',
    iv_load_policy: '3',
    disablekb: '1',
    fs: '0',
  });

  if (config.video_autoplay) params.set('autoplay', '1');
  if (config.video_muted) params.set('mute', '1');
  if (config.video_loop) {
    params.set('loop', '1');
    params.set('playlist', videoId);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

// ============================================================================
// CRUD
// ============================================================================

/**
 * Obtener la configuración del Hero
 */
export async function getHeroConfig(): Promise<HeroConfig> {
  // Check cache
  if (heroConfigCache.data && Date.now() - heroConfigCache.timestamp < CACHE_TTL) {
    return heroConfigCache.data;
  }

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'hero_config')
      .maybeSingle();

    if (error) {
      console.warn('Error fetching hero config:', error.message);
      return DEFAULT_HERO_CONFIG;
    }

    if (!data?.setting_value) {
      return DEFAULT_HERO_CONFIG;
    }

    const config = typeof data.setting_value === 'string'
      ? JSON.parse(data.setting_value)
      : data.setting_value;

    const merged = { ...DEFAULT_HERO_CONFIG, ...config };

    // Update cache
    heroConfigCache = { data: merged, timestamp: Date.now() };

    return merged;
  } catch (error) {
    console.error('Error parsing hero config:', error);
    return DEFAULT_HERO_CONFIG;
  }
}

/**
 * Guardar la configuración del Hero (solo SuperAdmin)
 */
export async function saveHeroConfig(config: Partial<HeroConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getHeroConfig();
    const updated: HeroConfig = {
      ...current,
      ...config,
      updated_at: new Date().toISOString(),
    };

    // Upsert en site_settings
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: 'hero_config',
        setting_value: JSON.stringify(updated),
        setting_type: 'json',
        section: 'content',
        description: 'Configuración del Hero principal (video/imagen de fondo, textos)',
      }, { onConflict: 'setting_key' });

    if (error) {
      console.error('Error saving hero config:', error);
      return { success: false, error: error.message };
    }

    // Clear cache and notify listeners
    heroConfigCache = { data: updated, timestamp: Date.now() };
    notifyHeroConfigChanged();

    return { success: true };
  } catch (error: any) {
    console.error('Error saving hero config:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Resetear configuración del Hero a valores por defecto
 */
export async function resetHeroConfig(): Promise<{ success: boolean; error?: string }> {
  return saveHeroConfig(DEFAULT_HERO_CONFIG);
}

/**
 * Limpiar caché del Hero
 */
export function clearHeroCache(): void {
  heroConfigCache = { data: null, timestamp: 0 };
}

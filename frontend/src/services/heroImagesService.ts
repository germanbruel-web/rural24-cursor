// src/services/heroImagesService.ts
import { supabase } from './supabaseClient';

export interface HeroImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_active: boolean;
  fade_duration: number;
  created_at: string;
  updated_at: string;
}

export interface CreateHeroImageInput {
  image_url: string;
  alt_text?: string;
  display_order?: number;
  fade_duration?: number;
}

export interface UpdateHeroImageInput {
  image_url?: string;
  alt_text?: string;
  display_order?: number;
  is_active?: boolean;
  fade_duration?: number;
}

/**
 * Obtener todas las imágenes del hero (admin)
 */
export async function getAllHeroImages(): Promise<HeroImage[]> {
  try {
    const { data, error } = await supabase
      .from('hero_images')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data as HeroImage[];
  } catch (error) {
    console.error('Error fetching hero images:', error);
    return [];
  }
}

/**
 * Obtener solo las imágenes activas (para mostrar en el hero)
 */
export async function getActiveHeroImages(): Promise<HeroImage[]> {
  try {
    const { data, error } = await supabase
      .from('hero_images')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data as HeroImage[];
  } catch (error) {
    console.error('Error fetching active hero images:', error);
    return [];
  }
}

/**
 * Crear nueva imagen del hero
 */
export async function createHeroImage(
  input: CreateHeroImageInput
): Promise<{ image: HeroImage | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('hero_images')
      .insert({
        image_url: input.image_url,
        alt_text: input.alt_text || null,
        display_order: input.display_order || 0,
        fade_duration: input.fade_duration || 5000,
        is_active: true,
      })
      .select()
      .single();

    if (error) return { image: null, error };
    return { image: data as HeroImage, error: null };
  } catch (error) {
    console.error('Error creating hero image:', error);
    return { image: null, error };
  }
}

/**
 * Actualizar imagen del hero
 */
export async function updateHeroImage(
  id: string,
  input: UpdateHeroImageInput
): Promise<{ image: HeroImage | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('hero_images')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) return { image: null, error };
    return { image: data as HeroImage, error: null };
  } catch (error) {
    console.error('Error updating hero image:', error);
    return { image: null, error };
  }
}

/**
 * Eliminar imagen del hero
 */
export async function deleteHeroImage(id: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('hero_images')
      .delete()
      .eq('id', id);

    if (error) return { error };
    return { error: null };
  } catch (error) {
    console.error('Error deleting hero image:', error);
    return { error };
  }
}

/**
 * Reordenar imágenes (actualizar display_order)
 */
export async function reorderHeroImages(
  updates: { id: string; display_order: number }[]
): Promise<{ error: any }> {
  try {
    const promises = updates.map(({ id, display_order }) =>
      supabase
        .from('hero_images')
        .update({ display_order })
        .eq('id', id)
    );

    await Promise.all(promises);
    return { error: null };
  } catch (error) {
    console.error('Error reordering hero images:', error);
    return { error };
  }
}

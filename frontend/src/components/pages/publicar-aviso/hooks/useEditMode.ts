import { useState, useEffect } from 'react';
import { supabase } from '../../../../services/supabaseClient';
import { notify } from '../../../../utils/notifications';
import { navigateTo } from '../../../../hooks/useNavigate';
import type { UploadedImage } from '../../../SimpleImageUploader/SimpleImageUploader';

export interface EditModeCallbacks {
  profile: { id: string; role?: string } | null;
  setSelectedCategory: (v: string) => void;
  setSelectedSubcategory: (v: string) => void;
  setExpandedCategory: (v: string) => void;
  setExpandedL2Sub: (v: string) => void;
  setAttributeValues: (v: Record<string, any>) => void;
  setProvince: (v: string) => void;
  setLocality: (v: string) => void;
  setUploadedImages: (v: UploadedImage[]) => void;
  setUploadedImagesRef: (v: UploadedImage[]) => void;
  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  setPrice: (v: string) => void;
  setCurrency: (v: 'ARS' | 'USD') => void;
  setPriceUnit: (v: string) => void;
  setCurrentStep: (v: number) => void;
  setLoading: (v: boolean) => void;
}

interface UseEditModeResult {
  isEditMode: boolean;
  editAdId: string | null;
}

export function useEditMode(callbacks: EditModeCallbacks): UseEditModeResult {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editAdId, setEditAdId] = useState<string | null>(null);

  async function loadAdForEdit(adId: string) {
    try {
      callbacks.setLoading(true);

      const { data: ad, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', adId)
        .single();

      if (error) throw error;

      if (ad.user_id !== callbacks.profile?.id && callbacks.profile?.role !== 'superadmin') {
        notify.error('No tienes permiso para editar este aviso');
        navigateTo('/my-ads');
        return;
      }

      callbacks.setSelectedCategory(ad.category_id || '');
      callbacks.setSelectedSubcategory(ad.subcategory_id || '');
      if (ad.category_id) callbacks.setExpandedCategory(ad.category_id);

      if (ad.subcategory_id) {
        const { data: subData } = await supabase
          .from('subcategories')
          .select('id, parent_id')
          .eq('id', ad.subcategory_id)
          .single();
        if (subData?.parent_id) {
          callbacks.setExpandedL2Sub(subData.parent_id);
        }
      }

      if (ad.attributes) {
        callbacks.setAttributeValues(ad.attributes);
      }

      callbacks.setProvince(ad.province || '');
      callbacks.setLocality(ad.location || '');

      if (ad.images && ad.images.length > 0) {
        const existingUploaded: UploadedImage[] = ad.images.map((img: any, index: number) => ({
          id: `existing-${index}`,
          file: null,
          url: typeof img === 'string' ? img : img.url,
          status: 'success' as const,
          progress: 100,
        }));
        callbacks.setUploadedImages(existingUploaded);
        callbacks.setUploadedImagesRef(existingUploaded);
      }

      callbacks.setTitle(ad.title || '');
      callbacks.setDescription(ad.description || '');
      callbacks.setPrice(ad.price ? String(ad.price) : '');
      callbacks.setCurrency(ad.currency || 'ARS');
      callbacks.setPriceUnit((ad as any).price_unit || '');

      callbacks.setCurrentStep(2);

      notify.success('Aviso cargado para edición');
    } catch (error: any) {
      console.error('Error cargando aviso:', error);
      notify.error('Error cargando aviso');
      navigateTo('/my-ads');
    } finally {
      callbacks.setLoading(false);
    }
  }

  async function detectEditMode() {
    const hash = window.location.hash;
    const editMatch = hash.match(/^#\/edit\/([a-f0-9-]+)$/);

    let editId: string | null = null;

    if (editMatch) {
      editId = editMatch[1];
    } else {
      const hashParts = hash.split('?');
      if (hashParts.length > 1) {
        const urlParams = new URLSearchParams(hashParts[1]);
        editId = urlParams.get('edit');
      }
    }

    if (editId) {
      setIsEditMode(true);
      setEditAdId(editId);
      await loadAdForEdit(editId);
    }
  }

  useEffect(() => {
    detectEditMode();

    const handleHashChange = () => {
      detectEditMode();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return { isEditMode, editAdId };
}

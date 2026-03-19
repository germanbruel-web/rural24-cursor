import { useState } from 'react';
import type { UploadedImage } from '../../../SimpleImageUploader/SimpleImageUploader';
import { supabase } from '../../../../services/supabaseClient';
import { adsApi } from '../../../../services/api';
import { notify } from '../../../../utils/notifications';
import { navigateTo } from '../../../../hooks/useNavigate';

interface SubmitParams {
  profile: { id: string; role?: string; province?: string; location?: string } | null;
  isEditMode: boolean;
  editAdId: string | null;
  selectedCategory: string;
  selectedSubcategory: string;
  selectedCategoryType: string;
  selectedPageType: 'particular' | 'empresa';
  selectedBusinessProfileId: string | null;
  title: string;
  description: string;
  price: string;
  currency: 'ARS' | 'USD';
  priceUnit: string;
  province: string;
  locality: string;
  attributeValues: Record<string, any>;
  uploadedImagesRef: React.MutableRefObject<UploadedImage[]>;
  draftId: string;
  onDraftDelete: () => void;
  onShowAuthModal: () => void;
  UUID_REGEX: RegExp;
  onSetCurrentStep: (step: number) => void;
}

export function useAdSubmit() {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(params: SubmitParams) {
    const {
      profile, isEditMode, editAdId,
      selectedCategory, selectedSubcategory, selectedCategoryType,
      selectedPageType, selectedBusinessProfileId,
      title, description, price, currency, priceUnit,
      province, locality, attributeValues,
      uploadedImagesRef, draftId,
      onDraftDelete, onShowAuthModal, UUID_REGEX, onSetCurrentStep,
    } = params;

    if (!profile) {
      onShowAuthModal();
      notify.warning('Debes iniciar sesión para publicar');
      return;
    }

    try {
      setSubmitting(true);

      const currentImages = uploadedImagesRef.current;

      if (currentImages.length > 0) {
        currentImages.forEach((_img, _index) => {});
      }

      const finalImages = currentImages
        .filter(img => {
          const isSuccess = img.status === 'success';
          if (!isSuccess) {}
          return isSuccess;
        })
        .map(img => {
          if (!img.url || !img.path) {
            console.error('[useAdSubmit] Imagen sin url o path:', img);
          }
          return {
            url: img.url,
            path: img.path,
            sortOrder: img.sortOrder ?? 999,
            isPrimary: img.isPrimary ?? false,
          };
        });

      if (finalImages.length === 0) {
        console.error('[useAdSubmit] NO IMAGES FOUND - Aborting submit');
        if (currentImages.length > 0) {
          const statuses = currentImages.map(img => img.status);
          notify.error(`Las imágenes no se subieron correctamente. Estados: ${statuses.join(', ')}`);
        } else {
          notify.error('Debes subir al menos una imagen');
        }
        return;
      }

      const cleanAttributes = attributeValues;

      const adData = {
        category_id: selectedCategory,
        subcategory_id: selectedSubcategory,
        category_type_id: selectedCategoryType || null,
        ad_type: selectedPageType === 'empresa' ? 'company' : 'particular',
        business_profile_id: selectedBusinessProfileId || null,
        title: title.trim(),
        description: description.trim(),
        price: price ? parseInt(price) : null,
        price_unit: priceUnit || null,
        price_negotiable: false,
        currency,
        location: locality || null,
        province,
        images: finalImages,
        attributes: cleanAttributes,
        status: 'active',
      };

      if (adData.price && adData.price > 9999999999) {
        notify.error('El precio máximo permitido es $9,999,999,999');
        return;
      }

      let resultId: string;

      if (isEditMode && editAdId) {
        const { data, error } = await supabase
          .from('ads')
          .update(adData)
          .eq('id', editAdId)
          .select()
          .single();

        if (error) {
          console.error('[useAdSubmit] Error UPDATE:', error);
          throw error;
        }

        resultId = data.slug || data.id;
        notify.success('Aviso actualizado exitosamente!');
      } else {
        if (editAdId && !isEditMode) {
          console.error('[useAdSubmit] WARNING: editAdId existe pero isEditMode es false!', { editAdId, isEditMode });
          notify.error('Error interno: modo de edición inconsistente. Recarga la página.');
          return;
        }

        if (!UUID_REGEX.test(selectedCategory) || !UUID_REGEX.test(selectedSubcategory)) {
          notify.error('Categoría o subcategoría inválida. Por favor seleccioná de nuevo.');
          onSetCurrentStep(1);
          return;
        }

        const finalProvince = province || profile.province || null;
        const finalCity = locality || profile.location || null;

        const createData = {
          user_id: profile.id,
          category_id: selectedCategory,
          subcategory_id: selectedSubcategory,
          category_type_id: selectedCategoryType || null,
          ad_type: selectedPageType === 'empresa' ? 'company' : 'particular',
          business_profile_id: selectedBusinessProfileId || null,
          title: title.trim(),
          description: description.trim(),
          price: price ? parseInt(price) : null,
          price_negotiable: false,
          currency,
          city: finalCity,
          province: finalProvince,
          images: finalImages,
          attributes: cleanAttributes,
          contact_phone: null,
          contact_email: null,
        };

        const ad = await adsApi.create(createData);

        resultId = ad.slug || ad.id;

        if (draftId) {
          onDraftDelete();
        }

        notify.success('Aviso publicado exitosamente!');
      }

      setTimeout(() => {
        navigateTo(`/ad/${resultId}`);
      }, 1000);

    } catch (error: any) {
      console.error('Error guardando aviso:', error);
      if (error?.fields) console.error('[useAdSubmit] Campos inválidos:', JSON.stringify(error.fields, null, 2));
      notify.error(error.message || 'Error guardando aviso');
    } finally {
      setSubmitting(false);
    }
  }

  return { handleSubmit, submitting };
}

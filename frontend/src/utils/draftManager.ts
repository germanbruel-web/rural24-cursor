/**
 * Draft Manager - Persistencia de borradores con localStorage
 * Arquitectura: Auto-save + State Recovery + URL Sync
 */

import type { UploadedImage } from '../components/SimpleImageUploader/SimpleImageUploader';

export interface DraftState {
  draftId: string;
  currentStep: number;
  lastModified: number;
  
  // Step 1
  selectedCategory: string;
  selectedSubcategory: string;
  selectedCategoryType: string;
  selectedPageType: string;
  
  // Step 2
  attributeValues: Record<string, any>;
  
  // Step 3
  province: string;
  locality: string;
  
  // Step 4
  uploadedImages: UploadedImage[];
  
  // Step 5
  title: string;
  description: string;
  price: string;
  currency: 'ARS' | 'USD';
}

const STORAGE_KEY_PREFIX = 'draft_ad_';
const ACTIVE_DRAFT_KEY = 'active_draft_id';

export class DraftManager {
  /**
   * Generar ID único para borrador
   */
  static generateDraftId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Guardar borrador en localStorage
   */
  static saveDraft(state: DraftState): void {
    try {
      const key = `${STORAGE_KEY_PREFIX}${state.draftId}`;
      localStorage.setItem(key, JSON.stringify({
        ...state,
        lastModified: Date.now()
      }));
      
      // Marcar como borrador activo
      localStorage.setItem(ACTIVE_DRAFT_KEY, state.draftId);
      
      if (import.meta.env.DEV) console.log('💾 Draft saved:', state.draftId, 'Step:', state.currentStep);
    } catch (error) {
      console.error('❌ Error saving draft:', error);
    }
  }

  /**
   * Cargar borrador desde localStorage
   */
  static loadDraft(draftId: string): DraftState | null {
    try {
      const key = `${STORAGE_KEY_PREFIX}${draftId}`;
      const data = localStorage.getItem(key);
      
      if (!data) return null;
      
      const draft = JSON.parse(data) as DraftState;
      if (import.meta.env.DEV) console.log('📂 Draft loaded:', draftId, 'Step:', draft.currentStep);
      
      return draft;
    } catch (error) {
      console.error('❌ Error loading draft:', error);
      return null;
    }
  }

  /**
   * Obtener ID del borrador activo
   */
  static getActiveDraftId(): string | null {
    return localStorage.getItem(ACTIVE_DRAFT_KEY);
  }

  /**
   * Eliminar borrador
   */
  static deleteDraft(draftId: string): void {
    try {
      const key = `${STORAGE_KEY_PREFIX}${draftId}`;
      localStorage.removeItem(key);
      
      // Si era el borrador activo, limpiar
      if (localStorage.getItem(ACTIVE_DRAFT_KEY) === draftId) {
        localStorage.removeItem(ACTIVE_DRAFT_KEY);
      }
      
      if (import.meta.env.DEV) console.log('🗑️ Draft deleted:', draftId);
    } catch (error) {
      console.error('❌ Error deleting draft:', error);
    }
  }

  /**
   * Limpiar borradores antiguos (más de 7 días)
   */
  static cleanOldDrafts(): void {
    try {
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            const draft = JSON.parse(data) as DraftState;
            if (now - draft.lastModified > maxAge) {
              localStorage.removeItem(key);
              if (import.meta.env.DEV) console.log('🧹 Old draft cleaned:', draft.draftId);
            }
          }
        }
      });
    } catch (error) {
      console.error('❌ Error cleaning old drafts:', error);
    }
  }

  /**
   * Listar todos los borradores
   */
  static listDrafts(): DraftState[] {
    const drafts: DraftState[] = [];
    
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            drafts.push(JSON.parse(data) as DraftState);
          }
        }
      });
      
      // Ordenar por última modificación (más reciente primero)
      return drafts.sort((a, b) => b.lastModified - a.lastModified);
    } catch (error) {
      console.error('❌ Error listing drafts:', error);
      return [];
    }
  }
}

/**
 * Hook para sincronizar URL con estado del draft
 */
export function updateDraftURL(draftId: string, step: number): void {
  const url = `#/publicar-aviso?draft=${draftId}&step=${step}`;
  window.history.replaceState(null, '', url);
  if (import.meta.env.DEV) console.log('🔗 URL updated:', url);
}

/**
 * Parsear URL para obtener draft ID y step
 */
export function parseDraftURL(): { draftId: string | null; step: number | null } {
  const hash = window.location.hash;
  const params = new URLSearchParams(hash.split('?')[1] || '');
  
  return {
    draftId: params.get('draft'),
    step: params.get('step') ? parseInt(params.get('step')!, 10) : null
  };
}

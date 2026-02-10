// ====================================================================
// PUBLICAR AVISO - Wizard con Atributos Dinámicos
// Mobile First + UX Profesional + Steps Intuitivos
// ====================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Tag,
  FileText,
  Settings,
  Camera,
  Eye,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Lock,
  CheckCircle,
  Smartphone,
  Sun,
  Image as ImageIcon,
  Layers,
  Move,
  Hash,
  Sparkles,
  Loader,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCategories, getSubcategories, getCategoryTypes } from '../../services/v2/formsService';
import type { Category, Subcategory, CategoryType } from '../../types/v2';
import { PROVINCES, LOCALITIES_BY_PROVINCE } from '../../constants/locations';
import { supabase } from '../../services/supabaseClient';
import { uploadService } from '../../services/uploadService';
import { notify } from '../../utils/notifications';
import AuthModal from '../auth/AuthModal';
import { adsApi } from '../../services/api';
import { uploadsApi } from '../../services/api';
import { SimpleImageUploader, UploadedImage } from '../SimpleImageUploader/SimpleImageUploader';
import { validateTitle, validateDescription } from '../../utils/contentValidator';
import type { ValidationResult } from '../../utils/contentValidator';
import { DraftManager, updateDraftURL, parseDraftURL, type DraftState } from '../../utils/draftManager';
import { navigateTo } from '../../hooks/useNavigate';

// Design System Components
import { Button } from '../../design-system/components/Button';
import { Card } from '../molecules/Card';
import { Input } from '../../design-system/components/Input';
import { AdPreviewCard } from '../shared/AdPreviewCard';
import type { AdPreviewData } from '../shared/AdPreviewCard';
import InfoBox from '../molecules/InfoBox/InfoBox';
import TipsCard from '../molecules/TipsCard/TipsCard';
import { AutoSaveIndicator } from '../molecules/AutoSaveIndicator';
import { DynamicFormLoader } from '../forms/DynamicFormLoader';
import { AutofillButton } from '../forms/AutofillButton';
import type { ContentContext } from '../../utils/contentGenerator';

// ====================================================================
// DESIGN SYSTEM RURAL24 - Estilos consistentes de formularios
// ====================================================================
const DS = {
  // Input/Select base - Design System RURAL24
  input: 'w-full px-4 py-3 text-base bg-white border-2 border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400',
  
  // Input con error
  inputError: 'w-full px-4 py-3 text-base bg-white border-2 border-error rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent placeholder:text-gray-400',
  
  // Label
  label: 'block text-sm font-semibold text-gray-700 mb-2',
  
  // Helper text
  helperText: 'mt-1.5 text-sm text-gray-500',
  
  // Error text
  errorText: 'mt-1.5 text-sm text-error flex items-center gap-1',
  
  // Checkbox
  checkbox: 'h-5 w-5 text-primary-500 border-2 border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all',
  
  // Card seleccionable
  cardSelectable: 'w-full p-4 sm:p-5 rounded-xl border-2 transition-all text-left',
  cardSelectableDefault: 'border-gray-200 hover:border-primary-400 hover:bg-primary-50',
  cardSelectableActive: 'border-primary-500 bg-primary-50 shadow-md',
};

// ====================================================================
// WIZARD STEPS
// ====================================================================
const STEPS = [
  { id: 1, title: 'Categoría', icon: Tag, description: '¿Qué publicas?' },
  { id: 2, title: 'Características', icon: Settings, description: 'Detalles técnicos' },
  { id: 3, title: 'Ubicación', icon: MapPin, description: 'Dónde está' },
  { id: 4, title: 'Fotos', icon: Camera, description: 'Imágenes' },
  { id: 5, title: 'Información', icon: FileText, description: 'Título y descripción' },
  { id: 6, title: 'Revisar y Publicar', icon: CheckCircle2, description: 'Confirmar publicación' },
];

// ====================================================================
// MAIN COMPONENT
// ====================================================================
export default function PublicarAviso() {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draftId, setDraftId] = useState<string>('');

  console.log('🎨 PublicarAviso renderizado, hash:', window.location.hash);

  // Modal de autenticación
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Categoría expandida (para accordion)
  const [expandedCategory, setExpandedCategory] = useState<string>('');
  
  // Grupo de atributos expandido (Step 2 - solo uno abierto a la vez)
  const [expandedAttributeGroup, setExpandedAttributeGroup] = useState<string>('');
  
  // Grupos completados (control secuencial)
  const [completedGroups, setCompletedGroups] = useState<Set<string>>(new Set());

  // Modo EDIT
  const [isEditMode, setIsEditMode] = useState(false);
  const [editAdId, setEditAdId] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Step 1: Categorías
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');

  // Step 2: Atributos dinámicos
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({});

  // Step 3: Ubicación
  const [province, setProvince] = useState('');
  const [locality, setLocality] = useState('');

  // Step 4: Fotos - NUEVO: usando SimpleImageUploader
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const uploadedImagesRef = useRef<UploadedImage[]>([]);

  // Step 5: Información (título/descripción generados)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceNegotiable, setPriceNegotiable] = useState(false);  // ✅ A Convenir
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [suggestedDescriptions, setSuggestedDescriptions] = useState<string[]>([]);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number | null>(null);
  const [selectedDescIndex, setSelectedDescIndex] = useState<number | null>(null);
  const [generatingContent, setGeneratingContent] = useState(false);  // ✅ Loading generación
  
  // Estados para validación anti-fraude en tiempo real
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [titleDebounceTimer, setTitleDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [descDebounceTimer, setDescDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Auto-save indicator
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  // ====================================================================
  // VALIDACIÓN ANTI-FRAUDE EN TIEMPO REAL
  // ====================================================================
  
  const handleTitleChange = (value: string) => {
    setTitle(value);
    
    // Limpiar timer anterior
    if (titleDebounceTimer) clearTimeout(titleDebounceTimer);
    
    // Validación con debounce de 400ms
    const timer = setTimeout(() => {
      const result = validateTitle(value);
      setTitleError(result.isValid ? null : result.error || null);
    }, 400);
    
    setTitleDebounceTimer(timer);
  };
  
  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    
    // Limpiar timer anterior
    if (descDebounceTimer) clearTimeout(descDebounceTimer);
    
    // Validación con debounce de 400ms
    const timer = setTimeout(() => {
      const result = validateDescription(value);
      setDescriptionError(result.isValid ? null : result.error || null);
    }, 400);
    
    setDescDebounceTimer(timer);
  };
  
  // ====================================================================
  // HELPERS PARA PRECIO SIN DECIMALES
  // ====================================================================
  
  /**
   * Limpia y formatea precio: solo números enteros
   */
  const cleanPrice = (value: string): string => {
    return value.replace(/[^\d]/g, '');
  };
  
  /**
   * Formatea precio con separador de miles
   */
  const formatPriceDisplay = (value: string): string => {
    if (!value) return '';
    const num = parseInt(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('es-AR');
  };
  
  /**
   * Formatea precio con moneda
   */
  const formatCurrency = (amount: string, curr: 'ARS' | 'USD'): string => {
    if (!amount) return '';
    const num = parseInt(amount);
    if (isNaN(num)) return '';
    
    if (curr === 'ARS') {
      return `$${num.toLocaleString('es-AR')}`;
    } else {
      return `USD ${num.toLocaleString('en-US')}`;
    }
  };
  
  // ====================================================================
  // GENERACIÓN DE CONTENIDO (TÍTULO + DESCRIPCIÓN)
  // ====================================================================
  
  /**
   * Genera título y descripción basado en datos del aviso
   * Llamada a backend API (futuro: LLM con contexto de categoría)
   */
  const handleGenerateContent = async () => {
    if (!selectedCategory || !selectedSubcategory) {
      notify.error('Selecciona categoría y subcategoría primero');
      return;
    }

    setGeneratingContent(true);
    setSuggestedTitles([]);
    setSuggestedDescriptions([]);

    try {
      // Construir contexto del aviso
      const categoryName = categories.find(c => c.id === selectedCategory)?.name || '';
      const subcategoryName = subcategories.find(s => s.id === selectedSubcategory)?.name || '';

      const context = {
        category_id: selectedCategory,
        subcategory_id: selectedSubcategory,
        category_name: categoryName,
        subcategory_name: subcategoryName,
        attributes: attributeValues,
        province,
        locality,
      };

      console.log('🪄 Generando contenido con contexto:', context);

      // Llamada al endpoint (futuro: backend con LLM)
      const response = await fetch('/api/ads/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });

      if (!response.ok) throw new Error('Error generando contenido');

      const data = await response.json();

      if (data.titles && data.titles.length > 0) {
        setSuggestedTitles(data.titles);
      }

      if (data.description) {
        setSuggestedDescriptions([data.description]);
      }

      notify.success('✨ Contenido generado exitosamente');
    } catch (error: any) {
      console.error('Error generando contenido:', error);
      notify.error('Error al generar contenido. Intenta manualmente.');
    } finally {
      setGeneratingContent(false);
    }
  };
  
  // ====================================================================
  // EFFECTS - Cargar datos
  // ====================================================================
  // ====================================================================
  // LIFECYCLE & INITIALIZATION
  // ====================================================================
  useEffect(() => {
    loadCategories();
    detectEditMode(); // ✅ Detectar modo edit al montar
    initializeOrRecoverDraft();
    cleanupOldDrafts();
    
    // Establecer provincia por defecto
    if (!province && PROVINCES.length > 0) {
      setProvince(PROVINCES[0]);
    }
    
    // Escuchar cambios en el hash para detectar modo edit
    const handleHashChange = () => {
      detectEditMode();
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  /**
   * Inicializar nuevo draft o recuperar existente desde URL
   */
  function initializeOrRecoverDraft() {
    const urlParams = parseDraftURL();
    
    // 1. Intentar recuperar desde URL
    if (urlParams.draftId) {
      const draft = DraftManager.loadDraft(urlParams.draftId);
      if (draft) {
        restoreDraftState(draft);
        console.log('✅ Draft recuperado desde URL:', urlParams.draftId);
        return;
      }
    }
    
    // 2. Intentar recuperar borrador activo
    const activeDraftId = DraftManager.getActiveDraftId();
    if (activeDraftId) {
      const draft = DraftManager.loadDraft(activeDraftId);
      if (draft) {
        restoreDraftState(draft);
        updateDraftURL(draft.draftId, draft.currentStep);
        console.log('✅ Draft activo recuperado:', activeDraftId);
        return;
      }
    }
    
    // 3. Crear nuevo draft
    const newDraftId = DraftManager.generateDraftId();
    setDraftId(newDraftId);
    updateDraftURL(newDraftId, 1);
    console.log('🆕 Nuevo draft creado:', newDraftId);
  }

  /**
   * Restaurar estado desde un draft guardado
   */
  function restoreDraftState(draft: DraftState) {
    setDraftId(draft.draftId);
    setCurrentStep(draft.currentStep);
    
    // Step 1
    setSelectedCategory(draft.selectedCategory);
    setSelectedSubcategory(draft.selectedSubcategory);
    
    // Step 2
    setAttributeValues(draft.attributeValues);
    
    // Step 3
    setProvince(draft.province);
    setLocality(draft.locality);
    
    // Step 4
    setUploadedImages(draft.uploadedImages);
    uploadedImagesRef.current = draft.uploadedImages;
    
    // Step 5
    setTitle(draft.title);
    setDescription(draft.description);
    setPrice(draft.price);
    setCurrency(draft.currency);
  }

  /**
   * Limpiar borradores antiguos (ejecutar solo una vez al montar)
   */
  function cleanupOldDrafts() {
    DraftManager.cleanOldDrafts();
  }

  // ====================================================================
  // AUTO-SAVE: Guardar cada cambio importante
  // ====================================================================
  useEffect(() => {
    if (!draftId) return;
    
    const currentState: DraftState = {
      draftId,
      currentStep,
      lastModified: Date.now(),
      selectedCategory,
      selectedSubcategory,
      attributeValues,
      province,
      locality,
      uploadedImages,
      title,
      description,
      price,
      currency
    };
    setLastSaved(Date.now());
    
    DraftManager.saveDraft(currentState);
    updateDraftURL(draftId, currentStep);
  }, [
    draftId,
    currentStep,
    selectedCategory,
    selectedSubcategory,
    attributeValues,
    province,
    locality,
    uploadedImages,
    title,
    description,
    price,
    currency
  ]);

  // Detectar si estamos en modo edición
  async function detectEditMode() {
    // Detectar desde hash: #/edit/:id
    const hash = window.location.hash;
    console.log('🔍 detectEditMode - hash actual:', hash);
    
    const editMatch = hash.match(/^#\/edit\/([a-f0-9-]+)$/);
    
    let editId: string | null = null;
    
    if (editMatch) {
      // Formato nuevo: #/edit/:id
      editId = editMatch[1];
      console.log('✅ Detectado modo edit (formato #/edit/:id):', editId);
    } else {
      // Formato legacy: ?edit=:id
      const hashParts = hash.split('?');
      if (hashParts.length > 1) {
        const urlParams = new URLSearchParams(hashParts[1]);
        editId = urlParams.get('edit');
        if (editId) {
          console.log('✅ Detectado modo edit (formato ?edit=:id):', editId);
        }
      }
    }
    
    if (editId) {
      setIsEditMode(true);
      setEditAdId(editId);
      await loadAdForEdit(editId);
    } else {
      console.log('ℹ️ No se detectó modo edit - modo creación');
    }
  }

  // Cargar datos del aviso para editar
  async function loadAdForEdit(adId: string) {
    try {
      setLoading(true);
      
      const { data: ad, error } = await supabase
        .from('ads')
        .select('*')
        .eq('id', adId)
        .single();

      if (error) throw error;

      // Validar permisos: solo dueño o superadmin
      if (ad.user_id !== profile?.id && profile?.role !== 'superadmin') {
        notify.error('No tienes permiso para editar este aviso');
        navigateTo('/my-ads');
        return;
      }

      // Pre-llenar Step 1: Categorías
      setSelectedCategory(ad.category_id || '');
      setSelectedSubcategory(ad.subcategory_id || '');
      
      // Pre-llenar Step 2: Atributos
      if (ad.attributes) {
        setAttributeValues(ad.attributes);
      }
      
      // Pre-llenar Step 3: Ubicación
      setProvince(ad.province || '');
      setLocality(ad.location || '');
      
      // Pre-llenar Step 4: Fotos existentes (convertir a formato UploadedImage)
      if (ad.images && ad.images.length > 0) {
        const existingUploaded: UploadedImage[] = ad.images.map((img: any, index: number) => ({
          id: `existing-${index}`,
          file: null,
          url: typeof img === 'string' ? img : img.url,
          status: 'success' as const,
          progress: 100
        }));
        setUploadedImages(existingUploaded);
      }
      
      // Pre-llenar Step 5: Información
      setTitle(ad.title || '');
      setDescription(ad.description || '');
      setPrice(ad.price ? String(ad.price) : '');
      setCurrency(ad.currency || 'ARS');
      
      notify.success('Aviso cargado para edición');
    } catch (error: any) {
      console.error('Error cargando aviso:', error);
      notify.error('Error cargando aviso');
      navigateTo('/my-ads');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedCategory) {
      loadSubcategories(selectedCategory);
    } else {
      setSubcategories([]);
      setSelectedSubcategory('');
    }
  }, [selectedCategory]);

  // ====================================================================
  // DATA LOADING
  // ====================================================================
  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data);
      
      // Seleccionar primera categoría por defecto si existe
      if (data.length > 0 && !selectedCategory) {
        setSelectedCategory(data[0].id);
        setExpandedCategory(data[0].id);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
      notify.error('Error cargando categorías');
    }
  }

  async function loadSubcategories(categoryId: string) {
    try {
      const data = await getSubcategories(categoryId);
      setSubcategories(data);
      
      // Seleccionar primera subcategoría por defecto si existe
      if (data.length > 0 && !selectedSubcategory) {
        setSelectedSubcategory(data[0].id);
      }
    } catch (error) {
      console.error('Error cargando subcategorías:', error);
    }
  }

  // ====================================================================
  // PHOTO HANDLING - Usando SimpleImageUploader component
  // ====================================================================
  function handleImagesChange(images: UploadedImage[]) {
    console.log('🚨🚨🚨 ====================================== 🚨🚨🚨');
    console.log(`[PublicarAviso] 📸 handleImagesChange CALLED`);
    console.log('🚨🚨🚨 ====================================== 🚨🚨🚨');
    console.log(`📊 Cantidad: ${images.length} images`);
    console.log('📦 Todas las imágenes recibidas:');
    images.forEach((img, idx) => {
      console.log(`  [${idx}]:`);
      console.log(`    ✓ URL: ${img.url}`);
      console.log(`    ✓ PATH: ${img.path}`);
      console.log(`    ✓ STATUS: ${img.status}`);
      console.log(`    ✓ PROGRESS: ${img.progress}%`);
    });
    
    console.log('🔄 Actualizando states...');
    setUploadedImages(images);
    uploadedImagesRef.current = images;
    
    console.log(`✅ STATE actualizado: ${images.length} images`);
    console.log(`✅ REF actualizado: ${uploadedImagesRef.current.length} images`);
    
    const successCount = images.filter(img => img.status === 'success').length;
    console.log(`🎯 Images con SUCCESS status: ${successCount}`);
    console.log('🚨🚨🚨 ====================================== 🚨🚨🚨');
  }

  // ====================================================================
  // AUTO-GENERATION
  // ====================================================================
  function generateSuggestions() {
    const categoryName = categories.find(c => c.id === selectedCategory)?.display_name || '';
    const subcategoryName = subcategories.find(s => s.id === selectedSubcategory)?.display_name || '';
    
    const adData = {
      category: categoryName,
      subcategory: subcategoryName,
      attributes: attributeValues,
      province,
      locality,
      price,
      currency,
    };
    
    // TODO: Re-implement AI title/description generation
    // const titles = generateTitles(adData, categoryName, subcategoryName, 5);
    // const descriptions = generateDescriptions(adData, categoryName, subcategoryName, 3);
    const titles: string[] = [];
    const descriptions: string[] = [];
    
    setSuggestedTitles(titles);
    setSuggestedDescriptions(descriptions);
    setSelectedTitleIndex(null);
    setSelectedDescIndex(null);
  }

  // ====================================================================
  // TITLE & DESCRIPTION - Manual Input Only
  // ====================================================================

  // Seleccionar título por índice (para futuras opciones de UI)
  function selectTitle(index: number) {
    if (index >= 0 && index < suggestedTitles.length) {
      setTitle(suggestedTitles[index]);
      setSelectedTitleIndex(index);
    }
  }

  // Seleccionar descripción por índice
  function selectDescription(index: number) {
    if (index >= 0 && index < suggestedDescriptions.length) {
      setDescription(suggestedDescriptions[index]);
      setSelectedDescIndex(index);
    }
  }

  // ====================================================================
  // NAVIGATION
  // ====================================================================
  function goNext() {
    // Validaciones por step
    if (currentStep === 1) {
      if (!selectedCategory || !selectedSubcategory) {
        notify.error('Selecciona categoría y subcategoría');
        return;
      }
    }

    if (currentStep === 2) {
      // DynamicFormLoader maneja sus propias validaciones
      // Por ahora permitimos continuar
    }

    if (currentStep === 3) {
      if (!province) {
        notify.error('Selecciona provincia');
        return;
      }
    }

    if (currentStep === 4) {
      // Validar que haya al menos 1 imagen subida con éxito
      const successImages = uploadedImagesRef.current.filter(img => img.status === 'success');
      if (successImages.length === 0) {
        notify.error('Debes subir al menos 1 foto para continuar');
        return;
      }
      console.log(`[PublicarAviso] ✅ Step 4 validación OK: ${successImages.length} imagen(es) lista(s)`);
    }

    if (currentStep === 5) {
      if (!title.trim() || !description.trim()) {
        notify.error('Completa título y descripción');
        return;
      }
      
      // 🔥 VALIDACIÓN ANTI-FRAUDE: Bloquear avance si hay errores
      if (titleError || descriptionError) {
        notify.error('Corrige los errores en título o descripción antes de continuar');
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  }

  function goBack() {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }

  // ====================================================================
  // SUBMIT (CREATE o UPDATE)
  // ====================================================================
  async function handleSubmit() {
    if (!profile) {
      setShowAuthModal(true);
      notify.warning('Debes iniciar sesión para publicar');
      return;
    }

    try {
      setSubmitting(true);

      console.log('=====================================================');
      console.log('[PublicarAviso] 🚀 INICIANDO SUBMIT');
      console.log('=====================================================');
      
      // 1. Las imágenes YA están subidas desde SimpleImageUploader
      // Leer desde el ref para evitar problemas de timing con el estado
      const currentImages = uploadedImagesRef.current;
      console.log(`[PublicarAviso] 📸 uploadedImagesRef.current.length: ${currentImages.length}`);
      console.log('[PublicarAviso] 📸 Images from ref:', JSON.stringify(currentImages, null, 2));
      
      // Validar estructura de imágenes ANTES de filtrar
      if (currentImages.length > 0) {
        console.log('[PublicarAviso] 🔍 Validando estructura de imágenes:');
        currentImages.forEach((img, index) => {
          console.log(`  Imagen ${index}:`, {
            hasUrl: !!img.url,
            hasPath: !!img.path,
            hasStatus: !!img.status,
            status: img.status,
            urlPreview: img.url?.substring(0, 50) + '...'
          });
        });
      }
      
      const finalImages = currentImages
        .filter(img => {
          const isSuccess = img.status === 'success';
          if (!isSuccess) {
            console.warn(`[PublicarAviso] ⚠️ Imagen filtrada (status: ${img.status}):`, img);
          }
          return isSuccess;
        })
        .map(img => {
          if (!img.url || !img.path) {
            console.error('[PublicarAviso] ❌ Imagen sin url o path:', img);
          }
          // ✅ PRESERVAR sortOrder e isPrimary para que las cards muestren la imagen correcta
          return { 
            url: img.url, 
            path: img.path,
            sortOrder: img.sortOrder ?? 999,  // Fallback para compatibilidad
            isPrimary: img.isPrimary ?? false  // Fallback para compatibilidad
          };
        });

      console.log(`[PublicarAviso] ✅ Images with success status: ${finalImages.length}`);
      console.log('[PublicarAviso] 📦 finalImages array:', JSON.stringify(finalImages, null, 2));

      if (finalImages.length === 0) {
        console.error('[PublicarAviso] ❌ NO IMAGES FOUND - Aborting submit');
        console.error('[PublicarAviso] 🔍 Images from ref at time of check:', currentImages);
        
        if (currentImages.length > 0) {
          // Hay imágenes pero ninguna con status success
          const statuses = currentImages.map(img => img.status);
          notify.error(`Las imágenes no se subieron correctamente. Estados: ${statuses.join(', ')}`);
        } else {
          notify.error('Debes subir al menos una imagen');
        }
        return;
      }

      // 2. Preparar datos - Enviar TODOS los atributos (incluso vacíos) para debugging
      const cleanAttributes = attributeValues; // TEMPORAL: Enviar todo sin limpiar
      
      console.log('🔍 DEBUG - attributeValues RAW:', attributeValues);
      console.log('🔍 DEBUG - cleanAttributes:', cleanAttributes);
      
      // NOTA: Lógica original comentada para debugging
      // const cleanAttributes = Object.entries(attributeValues).reduce((acc, [key, value]) => {
      //   if (value !== null && value !== undefined && value !== '') {
      //     acc[key] = value;
      //   }
      //   return acc;
      // }, {} as Record<string, any>);

      const adData = {
        category_id: selectedCategory,
        subcategory_id: selectedSubcategory,
        title: title.trim(),
        description: description.trim(),
        price: priceNegotiable ? null : (price ? parseInt(price) : null),  // ✅ Sin decimales
        price_negotiable: priceNegotiable,  // ✅ Nuevo campo
        currency,
        location: locality || null,
        province,
        images: finalImages, // ✅ Ahora incluye sortOrder e isPrimary para mostrar correctamente en cards
        attributes: cleanAttributes,  // ✅ Atributos limpios
        status: 'active',
      };

      console.log(isEditMode ? '📝 Datos a actualizar:' : '📦 Datos a insertar:', adData);
      console.log('🔍 DEBUG - isEditMode:', isEditMode, 'editAdId:', editAdId);
      
      // Validar precio
      if (adData.price && adData.price > 9999999999) {
        notify.error('El precio máximo permitido es $9,999,999,999');
        return;
      }

      let resultId: string;

      console.log('🔍 CHECKPOINT - Decidiendo flujo:', { isEditMode, editAdId, hasEditId: !!editAdId });

      if (isEditMode && editAdId) {
        // MODO UPDATE
        console.log('✅ Entrando en flujo UPDATE con ID:', editAdId);
        const { data, error } = await supabase
          .from('ads')
          .update(adData)
          .eq('id', editAdId)
          .select()
          .single();

        if (error) {
          console.error('❌ Error UPDATE:', error);
          throw error;
        }

        resultId = data.id;
        notify.success('Aviso actualizado exitosamente!');
      } else {
        // MODO CREATE - Usar nuevo BFF API
        console.log('✅ Entrando en flujo CREATE');
        
        // ⚠️ ALERTA: Si hay un editAdId pero isEditMode es false, algo está mal
        if (editAdId && !isEditMode) {
          console.error('⚠️ WARNING: editAdId existe pero isEditMode es false!', { editAdId, isEditMode });
          notify.error('Error interno: modo de edición inconsistente. Recarga la página.');
          return;
        }
        
        // Usar provincia/localidad del vendedor si no se especificó
        const finalProvince = province || profile.province || null;
        const finalCity = locality || profile.location || null;

        const createData = {
          user_id: profile.id,
          category_id: selectedCategory,
          subcategory_id: selectedSubcategory,
          title: title.trim(),
          description: description.trim(),
          price: priceNegotiable ? null : (price ? parseInt(price) : null),  // ✅ Sin decimales
          price_negotiable: priceNegotiable,  // ✅ Nuevo campo
          currency,
          city: finalCity,
          province: finalProvince,
          images: finalImages,
          attributes: cleanAttributes,
          contact_phone: null,
          contact_email: null,
        };

        console.log('📦 Enviando a BFF API:', JSON.stringify(createData, null, 2));
        console.log('📦 Tipo de images:', typeof createData.images);
        console.log('📦 Es array?:', Array.isArray(createData.images));
        console.log('📦 Primer elemento images:', createData.images[0]);

        const ad = await adsApi.create(createData);

        // Usar slug si está disponible, sino usar id
        resultId = ad.slug || ad.id;
        
        // ✅ Eliminar draft después de publicar exitosamente
        if (draftId) {
          DraftManager.deleteDraft(draftId);
          console.log('🗑️ Draft eliminado después de publicación exitosa');
        }
        
        notify.success('Aviso publicado exitosamente!');
      }
      
      // Redirigir al detalle usando el slug del aviso
      setTimeout(() => {
        navigateTo(`/ad/${resultId}`);
      }, 1000);

    } catch (error: any) {
      console.error('Error guardando aviso:', error);
      notify.error(error.message || 'Error guardando aviso');
    } finally {
      setSubmitting(false);
    }
  }

  // ====================================================================
  // RENDER
  // ====================================================================
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Header Mobile Compacto - Solo 1 sticky element */}
      <div className={`lg:hidden border-b sticky top-0 z-30 ${
        isEditMode 
          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="px-4 py-3">
          {/* Row 1: Volver + Título + Badge Edit */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Volver</span>
            </button>
            
            <h1 className="flex-1 text-center text-base font-bold text-gray-900 truncate">
              {isEditMode ? 'Editar Aviso' : 'Nuevo Aviso'}
            </h1>
            
            {isEditMode ? (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                EDIT
              </span>
            ) : (
              <AutoSaveIndicator lastSaved={lastSaved} />
            )}
          </div>
          
          {/* Row 2: Progress bar compacta */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span className="font-medium text-gray-900">{STEPS[currentStep - 1].title}</span>
              <span>{currentStep}/{STEPS.length}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="bg-green-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Stepper - Solo Desktop */}
      <div className={`hidden lg:block border-b-2 sticky top-0 z-20 ${
        isEditMode 
          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header con Auto-Save Indicator */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Editar Aviso' : 'Publicar Nuevo Aviso'}
            </h1>
            <div className="flex items-center gap-4">
              <AutoSaveIndicator lastSaved={lastSaved} />
              
              {/* Botón para limpiar draft */}
              {draftId && (
                <button
                  onClick={() => {
                    if (confirm('¿Empezar un nuevo aviso? Se perderán los cambios actuales.')) {
                      // Limpiar estados
                      setCurrentStep(1);
                      setSelectedCategory('');
                      setSelectedSubcategory('');
                      setAttributeValues({});
                      setProvince('');
                      setLocality('');
                      setUploadedImages([]);
                      setTitle('');
                      setDescription('');
                      setPrice('');
                      
                      // Crear nuevo draft
                      const newDraftId = DraftManager.generateDraftId();
                      setDraftId(newDraftId);
                      updateDraftURL(newDraftId, 1);
                      
                      // Limpiar accordion
                      setExpandedAttributeGroup('');
                      setCompletedGroups(new Set());
                      
                      notify.success('Nuevo aviso iniciado');
                    }
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  🆕 Nuevo
                </button>
              )}
            </div>
          </div>
          
          {/* Desktop Stepper */}
          <div className="hidden lg:flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const StepIcon = step.icon;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-green-500 text-white scale-110 shadow-lg shadow-green-200'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-sm font-semibold ${
                          isActive ? 'text-green-600' : 'text-gray-600'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>

                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 rounded-full transition-all ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-4 sm:py-6 bg-gray-50">
        {/* Layout: Full width sin preview lateral */}
        <div className="max-w-4xl mx-auto">
          <div>
            <div className="bg-white sm:bg-gray-100 rounded-xl sm:rounded-2xl shadow-sm sm:shadow-xl border sm:border-2 border-gray-200 sm:border-gray-300 overflow-hidden">
              <div className="p-4 sm:p-10 lg:p-12">
                {/* STEP 1: CATEGORÍA (OPTIMIZADO - ACCORDION INLINE) */}
                {currentStep === 1 && (
                  <div className="space-y-4 sm:space-y-8">
                    {/* Header - Oculto en mobile (ya está en el sticky header) */}
                    <div className="hidden sm:block">
                      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                        ¿Qué vas a publicar?
                      </h2>
                      <p className="text-base sm:text-lg text-gray-600">
                        Seleccioná la categoría y subcategoría de tu producto
                      </p>
                    </div>

                    {/* Grid de categorías con accordion */}
                    <div className="space-y-2 sm:space-y-4">
                      {categories.map((cat) => {
                        const isExpanded = expandedCategory === cat.id;
                        const isSelected = selectedCategory === cat.id;
                        
                        return (
                          <div key={cat.id} className="space-y-2 sm:space-y-3">
                            {/* Botón categoría - Compacto en mobile */}
                            <button
                              onClick={() => {
                                if (isExpanded) {
                                  setExpandedCategory('');
                                  setSelectedCategory('');
                                  setSelectedSubcategory('');
                                } else {
                                  setExpandedCategory(cat.id);
                                  setSelectedCategory(cat.id);
                                  setSelectedSubcategory('');
                                }
                              }}
                              className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all text-left ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50 shadow-md'
                                  : 'border-gray-200 hover:border-primary-400 hover:bg-primary-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-base sm:text-xl font-bold text-gray-900">
                                    {cat.display_name}
                                  </p>
                                  {/* Descripción oculta en mobile */}
                                  {cat.description && (
                                    <p className="hidden sm:block text-base sm:text-lg text-gray-600 mt-2">
                                      {cat.description}
                                    </p>
                                  )}
                                </div>
                                <ChevronRight
                                  className={`w-5 h-5 sm:w-6 sm:h-6 text-primary-600 flex-shrink-0 ml-2 sm:ml-3 transition-transform ${
                                    isExpanded ? 'rotate-90' : ''
                                  }`}
                                />
                              </div>
                            </button>

                            {/* Subcategorías (accordion) */}
                            {isExpanded && subcategories.length > 0 && (
                              <div className="space-y-2 sm:space-y-3 animate-fadeIn pl-2 sm:pl-0">
                                <p className="text-sm sm:text-lg font-bold text-green-700 mb-2 sm:mb-3">
                                  Elegí una subcategoría:
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                                  {subcategories.map((sub) => (
                                    <button
                                      key={sub.id}
                                      onClick={() => {
                                        setSelectedSubcategory(sub.id);
                                        // Auto-avanzar al step 2 con scroll suave
                                        setTimeout(() => {
                                          setCurrentStep(2);
                                          // DynamicFormLoader maneja la apertura de grupos automáticamente
                                          // Scroll suave al contenido
                                          window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }, 300);
                                      }}
                                      className="p-3 sm:p-5 rounded-lg sm:rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all text-left group"
                                    >
                                      <p className="text-sm sm:text-lg font-bold text-gray-900 group-hover:text-green-700">
                                        {sub.display_name}
                                      </p>
                                      {/* Descripción oculta en mobile */}
                                      {sub.description && (
                                        <p className="hidden sm:block text-sm sm:text-base text-gray-600 mt-1">
                                          {sub.description}
                                        </p>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

            {/* STEP 2: CARACTERÍSTICAS (Atributos Dinámicos) */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {/* Breadcrumb integrado en el formulario - Mobile First */}
                {selectedCategory && selectedSubcategory && (
                  <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                      <Tag className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-green-700 truncate">
                        {categories.find(c => c.id === selectedCategory)?.display_name}
                      </span>
                      <ChevronRight className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-green-800 truncate">
                        {subcategories.find(s => s.id === selectedSubcategory)?.display_name}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        setSelectedCategory('');
                        setSelectedSubcategory('');
                        setExpandedCategory('');
                      }}
                      className="text-xs text-green-600 hover:text-green-700 font-semibold hover:underline flex-shrink-0 ml-2"
                    >
                      Cambiar
                    </button>
                  </div>
                )}

                {/* DynamicFormLoader - Sin título redundante */}
                <DynamicFormLoader
                  subcategoryId={selectedSubcategory}
                  categoryName={selectedCategory || ''}
                  subcategoryName={subcategories.find(s => s.id === selectedSubcategory)?.display_name || ''}
                  values={attributeValues}
                  onChange={(name: string, value: any) => {
                    setAttributeValues(prev => ({
                      ...prev,
                      [name]: value,
                    }));
                  }}
                  errors={{}}
                  expandedGroup={expandedAttributeGroup}
                  onGroupToggle={setExpandedAttributeGroup}
                  completedGroups={completedGroups}
                />
              </div>
            )}

            {/* STEP 3: UBICACIÓN */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                    ¿Dónde está ubicado?
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600">
                    Indicá la ubicación para que los compradores te encuentren
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Provincia */}
                  <Card variant="default" padding="md">
                    <label className={DS.label}>
                      Provincia <span className="text-error">*</span>
                    </label>
                    <select
                      value={province}
                      onChange={(e) => {
                        setProvince(e.target.value);
                        setLocality('');
                      }}
                      className={DS.input}
                    >
                      <option value="">Seleccionar provincia</option>
                      {PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </Card>

                  {/* Localidad */}
                  <Card variant="default" padding="md">
                    <label className={DS.label}>
                      Localidad {province && <span className="text-error">*</span>}
                    </label>
                    {province ? (
                      <select
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        className={DS.input}
                      >
                        <option value="">Seleccionar localidad</option>
                        {(LOCALITIES_BY_PROVINCE[province] || []).map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-4 py-3 text-base rounded-lg border-2 border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed flex items-center">
                        Selecciona primero una provincia
                      </div>
                    )}
                  </Card>
                </div>

                <div className="flex items-start gap-3 p-5 sm:p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm sm:text-base text-blue-900">
                    <p className="font-bold mb-2">Tu privacidad es importante</p>
                    <p>
                      Solo se mostrará la provincia públicamente. Los detalles
                      específicos se compartirán solo cuando alguien se contacte contigo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: FOTOS */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Fotos
                  </h2>
                  {uploadedImages.filter(img => img.status === 'success').length > 0 && (
                    <span className="text-sm text-green-600 font-medium">
                      {uploadedImages.filter(img => img.status === 'success').length}/8
                    </span>
                  )}
                </div>

                {/* Simple Image Uploader Component */}
                <SimpleImageUploader
                  maxFiles={8}
                  folder="ads"
                  onImagesChange={handleImagesChange}
                  existingImages={uploadedImages}
                />
              </div>
            )}

            {/* STEP 5: INFORMACIÓN */}
            {currentStep === 5 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Información
                  </h2>
                </div>

                {/* Botón Autocompletar */}
                <AutofillButton
                  context={{
                    categoria: categories.find(c => c.id === selectedCategory)?.name || '',
                    categorySlug: categories.find(c => c.id === selectedCategory)?.slug || '',
                    subcategoria: subcategories.find(s => s.id === selectedSubcategory)?.display_name || '',
                    subcategorySlug: subcategories.find(s => s.id === selectedSubcategory)?.slug || '',
                    marca: attributeValues['marca'] as string,
                    modelo: attributeValues['modelo'] as string,
                    año: attributeValues['año'] as string,
                    condicion: attributeValues['condicion'] as string,
                    provincia: province,
                    localidad: locality,
                    atributos: Object.entries(attributeValues).reduce((acc, [key, val]) => {
                      if (typeof val === 'string') acc[key] = val;
                      return acc;
                    }, {} as Record<string, string>),
                  }}
                  currentTitle={title}
                  currentDescription={description}
                  onFill={(t, d) => {
                    setTitle(t);
                    setDescription(d);
                  }}
                />

                {/* Título */}
                <div className="space-y-1.5">
                  <label className={DS.label}>
                    Título del aviso <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Ej: Tractor John Deere 5070E con pala frontal"
                    maxLength={100}
                    className={titleError ? DS.inputError : DS.input}
                  />
                  <div className="flex items-center justify-between">
                    <p className={DS.helperText}>
                      {title.length}/100 caracteres
                    </p>
                    {titleError && (
                      <p className={DS.errorText}>
                        <AlertCircle className="w-4 h-4" />
                        Validando...
                      </p>
                    )}
                  </div>
                  {titleError ? (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-red-700">{titleError}</p>
                    </div>
                  ) : (
                    <InfoBox variant="info" size="sm">
                      Números y años permitidos. No incluir teléfonos, emails o sitios web.
                    </InfoBox>
                  )}
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <label className={DS.label}>
                    Descripción <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    placeholder="Describe tu producto con el mayor detalle posible. Incluye características, estado, año, etc."
                    rows={6}
                    maxLength={2000}
                    className={`${descriptionError ? DS.inputError : DS.input} min-h-[120px] resize-y`}
                  />
                  <div className="flex items-center justify-between">
                    <p className={DS.helperText}>
                      {description.length}/2000 caracteres
                    </p>
                    {descriptionError && (
                      <p className={DS.errorText}>
                        <AlertCircle className="w-4 h-4" />
                        Validando...
                      </p>
                    )}
                  </div>
                  {descriptionError ? (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border-2 border-error rounded-lg">
                      <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-red-700">{descriptionError}</p>
                    </div>
                  ) : (
                    <InfoBox variant="info" size="sm">
                      Números y años permitidos. No incluir teléfonos, emails o sitios web.
                    </InfoBox>
                  )}
                </div>

                {/* Precio */}
                <div className="space-y-4">
                  <label className={DS.label}>
                    Precio
                  </label>

                  {/* Checkbox: A Convenir */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={priceNegotiable}
                      onChange={(e) => {
                        setPriceNegotiable(e.target.checked);
                        if (e.target.checked) setPrice('');
                      }}
                      className={DS.checkbox}
                    />
                    <span className="text-base font-medium text-gray-700 group-hover:text-primary-600 transition-colors flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      A Convenir (no especificar precio)
                    </span>
                  </label>

                  {/* Input de precio - Solo si NO es "A Convenir" */}
                  {!priceNegotiable && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={formatPriceDisplay(price)}
                          onChange={(e) => setPrice(cleanPrice(e.target.value))}
                          placeholder="50000"
                          className={DS.input}
                        />
                        <p className={DS.helperText}>
                          Solo números enteros (sin centavos)
                        </p>
                      </div>

                      <div>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value as 'ARS' | 'USD')}
                          className={DS.input}
                        >
                          <option value="ARS">ARS $</option>
                          <option value="USD">USD $</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Preview del precio formateado */}
                  {price && !priceNegotiable && (
                    <div className="flex items-center gap-2 p-3 bg-primary-50 border-2 border-primary-200 rounded-lg">
                      <DollarSign className="w-5 h-5 text-primary-600" />
                      <span className="text-sm text-gray-700">
                        Se publicará como: <strong className="text-primary-700 text-lg">{formatCurrency(price, currency)}</strong>
                      </span>
                    </div>
                  )}

                  {priceNegotiable && (
                    <InfoBox variant="info" size="sm">
                      Se publicará como <strong>A Convenir</strong>
                    </InfoBox>
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: PREVIEW FINAL - Vista exacta de cómo quedará publicado */}
            {currentStep === 6 && (() => {
              // 🔍 SUPER DEBUG MODE - Ver TODO lo que tenemos
              console.log('🚨🚨🚨 ======================================');
              console.log('🎬 STEP 6 - SUPER DEBUG PREVIEW');
              console.log('🚨🚨🚨 ======================================');
              console.log('📦 uploadedImagesRef.current:', uploadedImagesRef.current);
              console.log('📦 uploadedImages state:', uploadedImages);
              console.log('📊 Longitudes - Ref:', uploadedImagesRef.current.length, '| State:', uploadedImages.length);
              
              // Mostrar TODAS las imágenes con su info completa
              uploadedImagesRef.current.forEach((img, idx) => {
                console.log(`📸 [${idx}] STATUS: ${img.status} | URL: ${img.url?.substring(0, 80)} | PATH: ${img.path}`);
              });
              
              const successImages = uploadedImagesRef.current.filter(img => img.status === 'success');
              console.log('✅ Success images FILTRADAS:', successImages.length);
              console.log('🖼️ Images para preview:', successImages.map(img => ({
                url: img.url?.substring(0, 60),
                hasUrl: !!img.url,
                hasPath: !!img.path,
                status: img.status
              })));
              console.log('======================================');
              
              return (
                <div className="space-y-6">
                  {/* Debug info - Solo en desarrollo */}
                  {successImages.length === 0 && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-red-900 mb-2">⚠️ Debug: Sin imágenes detectadas</p>
                          <ul className="text-sm text-red-800 space-y-1">
                            <li>• uploadedImagesRef: {uploadedImagesRef.current.length} imágenes</li>
                            <li>• uploadedImages state: {uploadedImages.length} imágenes</li>
                            <li>• Con status success: {successImages.length}</li>
                            <li>• Estados: {uploadedImagesRef.current.map(img => img.status).join(', ') || 'ninguno'}</li>
                          </ul>
                          <p className="text-sm text-red-700 mt-3">
                            <strong>Solución:</strong> Vuelve al Step 4 y asegúrate de que las imágenes tengan el check verde ✓
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <AdPreviewCard
                    data={{
                      title,
                      description,
                      price: priceNegotiable ? null : (price ? parseInt(price) : null),  // ✅ Sin decimales
                      price_negotiable: priceNegotiable,  // ✅ Mostrar si es "A Convenir"
                      currency,
                      province,
                      city: locality || null,
                      images: successImages.map(img => ({ url: img.url, path: img.path })),
                      category: categories.find(c => c.id === selectedCategory),
                      subcategory: subcategories.find(s => s.id === selectedSubcategory),
                      attributes: attributeValues,
                    }}
                  />
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  </div>

    {/* Actions */}
    <div className="px-6 sm:px-10 lg:px-12 py-6 bg-gray-50 border-t-2 border-gray-200 flex items-center justify-between gap-4">
            {/* Back */}
            {currentStep > 1 && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  goBack();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={submitting}
                leftIcon={<ChevronLeft className="w-5 h-5" />}
              >
                <span className="hidden sm:inline">Atrás</span>
              </Button>
            )}

            {/* Next / Submit */}
            <Button
              variant="primary"
              size="lg"
              fullWidth={currentStep === 1}
              onClick={() => {
                if (currentStep === 6) {
                  handleSubmit();
                } else {
                  goNext();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              disabled={submitting}
              loading={submitting}
              leftIcon={currentStep === 6 ? <CheckCircle2 className="w-6 h-6" /> : undefined}
              rightIcon={currentStep !== 6 ? <ChevronRight className="w-5 h-5" /> : undefined}
              className={currentStep === 1 ? 'ml-auto' : ''}
            >
              {submitting 
                ? (isEditMode ? 'Actualizando...' : 'Publicando...')
                : currentStep === 6 
                  ? (isEditMode ? 'ACTUALIZAR AVISO' : 'PUBLICAR AVISO')
                  : 'Continuar'
              }
            </Button>
    </div>

    {/* Modal de Autenticación */}
    <AuthModal 
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      initialView="login"
    />
  </div>
);
}

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
  CheckCircle2,
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
import { Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCategories, getSubcategories, getFormForContext } from '../../services/v2/formsService';
import type { Category, Subcategory, PriceConfig } from '../../types/v2';
import { getOptionListItemsByName } from '../../services/v2/optionListsService';
import { getProvinces, type Province } from '../../services/v2/locationsService';
import { supabase } from '../../services/supabaseClient';
import { uploadService } from '../../services/uploadService';
import { notify } from '../../utils/notifications';
import AuthModal from '../auth/AuthModal';
import { adsApi } from '../../services/api';
import { uploadsApi } from '../../services/api';
import type { UploadedImage } from '../SimpleImageUploader/SimpleImageUploader';
import { validateTitle, validateDescription } from '../../utils/contentValidator';
import type { ValidationResult } from '../../utils/contentValidator';
import { DraftManager, updateDraftURL, parseDraftURL, type DraftState } from '../../utils/draftManager';
import { navigateTo } from '../../hooks/useNavigate';

// Design System Components
import { Button } from '../../design-system/components/Button';
import { Input } from '../../design-system/components/Input';
import { AdPreviewCard } from '../shared/AdPreviewCard';
import type { AdPreviewData } from '../shared/AdPreviewCard';
import TipsCard from '../molecules/TipsCard/TipsCard';
import { AutoSaveIndicator } from '../molecules/AutoSaveIndicator';
import { getWizardConfig, DEFAULT_STEPS, type WizardStep } from '../../services/v2/wizardConfigService';
import { BlockRenderer } from '../wizard/BlockRenderer';
import type { WizardBlockProps } from '../wizard/wizardTypes';
import { ProfileGate } from '../dashboard/ProfileGate';
import { getMyCompanies } from '../../services/empresaService';
import { useAccount } from '../../contexts/AccountContext';

// ====================================================================
// WIZARD STEPS — icono map para config dinámica
// ====================================================================
const STEP_ICON_MAP: Record<string, React.FC<any>> = {
  Tag, Settings, MapPin, Camera, FileText, CheckCircle2,
};

// ====================================================================
// MAIN COMPONENT
// ====================================================================
export default function PublicarAviso() {
  const { profile } = useAuth();
  const { activeAccount } = useAccount();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardSteps, setWizardSteps] = useState<WizardStep[]>(DEFAULT_STEPS);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draftId, setDraftId] = useState<string>('');

  // Modal de autenticación
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Categoría expandida (para accordion)
  const [expandedCategory, setExpandedCategory] = useState<string>('');
  // L2 expandida en Step 1 para mostrar hijos L3
  const [expandedL2Sub, setExpandedL2Sub] = useState<string>('');
  // Nivel de navegación drill-down en mobile (Step 1)
  const [mobileNavLevel, setMobileNavLevel] = useState<1 | 2 | 3>(1);
  // Dirección de animación para drill-down mobile
  const [drillDirection, setDrillDirection] = useState<'forward' | 'back'>('forward');
  
  // Grupo de atributos expandido (Step 2 - solo uno abierto a la vez)
  const [expandedAttributeGroup, setExpandedAttributeGroup] = useState<string>('');
  
  // Grupos completados (control secuencial)
  const [completedGroups, setCompletedGroups] = useState<Set<string>>(new Set());

  // Modo EDIT
  const [isEditMode, setIsEditMode] = useState(false);
  const [editAdId, setEditAdId] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Step 1: Categorías
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedCategoryType] = useState<string>('');
  const [selectedPageType, setSelectedPageType] = useState<'particular' | 'empresa'>('particular');
  // ProfileGate — Sprint 7B
  const [showProfileGate, setShowProfileGate] = useState(false);
  const [pendingSubcategoryName, setPendingSubcategoryName] = useState<string>('');
  // Pre-selecciona empresa activa del AccountSwitcher al abrir el wizard
  const [selectedBusinessProfileId, setSelectedBusinessProfileId] = useState<string | null>(
    activeAccount.type === 'empresa' ? activeAccount.id : null
  );

  // Step 2: Atributos dinámicos
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>({});

  // Step 3: Ubicación
  const [province, setProvince] = useState('');
  const [locality, setLocality] = useState('');
  const [provinces, setProvinces] = useState<Province[]>([]);

  // Step 4: Fotos - NUEVO: usando SimpleImageUploader
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const uploadedImagesRef = useRef<UploadedImage[]>([]);

  // Step 5: Información (título/descripción generados)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [priceUnit, setPriceUnit] = useState('');
  const [priceConfig, setPriceConfig] = useState<PriceConfig | null>(null);
  const [priceUnitOptions, setPriceUnitOptions] = useState<{ value: string; label: string }[]>([]);
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

      // Llamada al endpoint (futuro: backend con LLM)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/ads/generate-content`, {
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

  // Cargar wizard config cuando cambia la categoría seleccionada
  useEffect(() => {
    getWizardConfig(selectedCategory || null).then(setWizardSteps);

    // Cargar price_config del template cuando cambia categoría/subcategoría
    if (selectedSubcategory) {
      getFormForContext(selectedCategory || undefined, selectedSubcategory)
        .then((form) => {
          const cfg = form?.price_config ?? null;
          setPriceConfig(cfg);
          setPriceUnit('');
          if (cfg?.units_list) {
            getOptionListItemsByName(cfg.units_list).then(setPriceUnitOptions).catch(() => setPriceUnitOptions([]));
          } else {
            setPriceUnitOptions([]);
          }
        })
        .catch(() => { setPriceConfig(null); setPriceUnitOptions([]); });
    } else {
      setPriceConfig(null);
      setPriceUnitOptions([]);
    }
  }, [selectedCategory, selectedSubcategory]);

  // Derivado: key del step actual
  const activeStepKey = wizardSteps[currentStep - 1]?.key ?? '';
  const activeStep    = wizardSteps[currentStep - 1];

  // Breadcrumb: derivar path L1 > L2 > L3 desde estado (sin hardcode)
  const selectedSubFull = subcategories.find(s => s.id === selectedSubcategory);
  const l2Sub = selectedSubFull?.parent_id
    ? subcategories.find(s => s.id === selectedSubFull.parent_id)
    : null;
  const breadcrumbSegments: string[] = [
    selectedCategory ? (categories.find(c => c.id === selectedCategory)?.display_name ?? '') : '',
    l2Sub?.display_name ?? '',
    selectedSubcategory ? (selectedSubFull?.display_name ?? '') : '',
  ].filter(Boolean) as string[];

  // Props del wizard para BlockRenderer — agrupa todo el estado que los bloques necesitan
  const wizardBlockProps: WizardBlockProps = {
    price, setPrice, currency, setCurrency, priceUnit, setPriceUnit, priceUnitOptions,
    province, setProvince, locality, setLocality, provinces,
    uploadedImages, uploadedImagesRef, onImagesChange: handleImagesChange,
    title, description, titleError, descriptionError,
    onTitleChange: handleTitleChange, onDescriptionChange: handleDescriptionChange,
    autoFillContext: {
      categoria:      categories.find(c => c.id === selectedCategory)?.name ?? '',
      categorySlug:   categories.find(c => c.id === selectedCategory)?.slug ?? '',
      subcategoria:   subcategories.find(s => s.id === selectedSubcategory)?.display_name ?? '',
      subcategorySlug: subcategories.find(s => s.id === selectedSubcategory)?.slug ?? '',
      marca:     attributeValues['marca'] as string,
      modelo:    attributeValues['modelo'] as string,
      año:       attributeValues['año'] as string,
      condicion: attributeValues['condicion'] as string,
      provincia:  province,
      localidad:  locality,
      atributos: Object.entries(attributeValues).reduce((acc, [k, v]) => {
        if (typeof v === 'string') acc[k] = v;
        return acc;
      }, {} as Record<string, string>),
    },
    selectedBusinessProfileId, onBusinessProfileChange: setSelectedBusinessProfileId,
    categoryId: selectedCategory, subcategoryId: selectedSubcategory,
    categoryDisplayName:   categories.find(c => c.id === selectedCategory)?.display_name ?? '',
    subcategoryDisplayName: subcategories.find(s => s.id === selectedSubcategory)?.display_name ?? '',
    selectedPageType,
    attributeValues, onAttributeChange: (name, value) => setAttributeValues(prev => ({ ...prev, [name]: value })),
    expandedGroup: expandedAttributeGroup, onGroupToggle: setExpandedAttributeGroup,
    completedGroups, categories, subcategories,
    onChangeCategory: () => {
      setCurrentStep(1);
      setSelectedCategory('');
      setSelectedSubcategory('');
      setSelectedPageType('particular');
      setExpandedCategory('');
      setExpandedL2Sub('');
      setMobileNavLevel(1);
      setShowProfileGate(false);
    },
  };

  // ====================================================================
  // LIFECYCLE & INITIALIZATION
  // ====================================================================
  useEffect(() => {
    loadCategories();
    detectEditMode(); // ✅ Detectar modo edit al montar
    initializeOrRecoverDraft();
    cleanupOldDrafts();
    
    // Cargar provincias desde DB
    getProvinces().then(setProvinces);
    
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
    // En modo edición no hay draft que recuperar — los datos vienen del aviso existente
    if (window.location.hash.match(/^#\/edit\//)) return;

    const urlParams = parseDraftURL();

    // 1. Intentar recuperar desde URL
    if (urlParams.draftId) {
      const draft = DraftManager.loadDraft(urlParams.draftId);
      if (draft) {
        restoreDraftState(draft);
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
        return;
      }
    }

    // 3. Crear nuevo draft
    const newDraftId = DraftManager.generateDraftId();
    setDraftId(newDraftId);
    updateDraftURL(newDraftId, 1);
  }

  /**
   * Restaurar estado desde un draft guardado
   */
  function restoreDraftState(draft: DraftState) {
    setDraftId(draft.draftId);
    setCurrentStep(draft.currentStep);
    
    // Step 1 - validar UUIDs del draft
    setSelectedCategory(UUID_REGEX.test(draft.selectedCategory) ? draft.selectedCategory : '');
    setSelectedSubcategory(UUID_REGEX.test(draft.selectedSubcategory) ? draft.selectedSubcategory : '');
    // selectedCategoryType ya no se usa en el wizard (nivel 3 eliminado)
    setSelectedPageType((draft.selectedPageType as 'particular' | 'empresa') || 'particular');
    
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
    setPriceUnit((draft as any).priceUnit || '');
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
    if (isEditMode) return; // En modo edición no auto-guardamos draft ni tocamos la URL

    const currentState: DraftState = {
      draftId,
      currentStep,
      lastModified: Date.now(),
      selectedCategory,
      selectedSubcategory,
      selectedCategoryType,
      selectedPageType,
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
    isEditMode,
    currentStep,
    selectedCategory,
    selectedSubcategory,
    selectedCategoryType,
    selectedPageType,
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
    
    const editMatch = hash.match(/^#\/edit\/([a-f0-9-]+)$/);
    
    let editId: string | null = null;
    
    if (editMatch) {
      // Formato nuevo: #/edit/:id
      editId = editMatch[1];
    } else {
      // Formato legacy: ?edit=:id
      const hashParts = hash.split('?');
      if (hashParts.length > 1) {
        const urlParams = new URLSearchParams(hashParts[1]);
        editId = urlParams.get('edit');
        if (editId) {
        }
      }
    }
    
    if (editId) {
      setIsEditMode(true);
      setEditAdId(editId);
      await loadAdForEdit(editId);
    } else {
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
      // Abrir el acordeón de la categoría correcta
      if (ad.category_id) setExpandedCategory(ad.category_id);

      // Si la subcategoría es L3 (tiene parent_id), abrir también el acordeón L2
      if (ad.subcategory_id) {
        const { data: subData } = await supabase
          .from('subcategories')
          .select('id, parent_id')
          .eq('id', ad.subcategory_id)
          .single();
        if (subData?.parent_id) {
          setExpandedL2Sub(subData.parent_id);
        }
      }

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
      setPriceUnit((ad as any).price_unit || '');

      // Avanzar al step 2 — la categoría ya está seleccionada
      setCurrentStep(2);

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
      // No auto-seleccionar ni auto-expandir: el usuario debe elegir
    } catch (error) {
      console.error('Error cargando categorías:', error);
      notify.error('Error cargando categorías');
    }
  }

  async function loadSubcategories(categoryId: string) {
    try {
      const data = await getSubcategories(categoryId);
      setSubcategories(data);
      // No auto-seleccionar: el usuario debe elegir la subcategoría
    } catch (error) {
      console.error('Error cargando subcategorías:', error);
    }
  }

  // ====================================================================
  // PHOTO HANDLING - Usando SimpleImageUploader component
  // ====================================================================
  function handleImagesChange(images: UploadedImage[]) {
    images.forEach((img, idx) => {
    });
    
    setUploadedImages(images);
    uploadedImagesRef.current = images;
    
    
    const successCount = images.filter(img => img.status === 'success').length;
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
    // Validaciones por step key
    if (activeStepKey === 'categoria') {
      if (!selectedCategory || !selectedSubcategory) {
        notify.error('Selecciona categoría y subcategoría');
        return;
      }
    }

    if (activeStepKey === 'caracteristicas') {
      if (!price) {
        notify.error('El precio es obligatorio');
        return;
      }
    }

    if (activeStepKey === 'ubicacion') {
      if (!province) {
        notify.error('Selecciona provincia');
        return;
      }
    }

    if (activeStepKey === 'fotos') {
      const successImages = uploadedImagesRef.current.filter(img => img.status === 'success');
      if (successImages.length === 0) {
        notify.error('Debes subir al menos 1 foto para continuar');
        return;
      }
    }

    if (activeStepKey === 'informacion') {
      if (!title.trim() || !description.trim()) {
        notify.error('Completa título y descripción');
        return;
      }
      if (title.trim().length < 10) {
        notify.error('El título debe tener al menos 10 caracteres');
        return;
      }
      if (description.trim().length < 20) {
        notify.error('La descripción debe tener al menos 20 caracteres');
        return;
      }
      if (titleError || descriptionError) {
        notify.error('Corrige los errores en título o descripción antes de continuar');
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, wizardSteps.length));
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

      
      // 1. Las imágenes YA están subidas desde SimpleImageUploader
      // Leer desde el ref para evitar problemas de timing con el estado
      const currentImages = uploadedImagesRef.current;
      
      // Validar estructura de imágenes ANTES de filtrar
      if (currentImages.length > 0) {
        currentImages.forEach((img, index) => {
        });
      }
      
      const finalImages = currentImages
        .filter(img => {
          const isSuccess = img.status === 'success';
          if (!isSuccess) {
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
        images: finalImages, // ✅ Ahora incluye sortOrder e isPrimary para mostrar correctamente en cards
        attributes: cleanAttributes,  // ✅ Atributos limpios
        status: 'active',
      };

      
      // Validar precio
      if (adData.price && adData.price > 9999999999) {
        notify.error('El precio máximo permitido es $9,999,999,999');
        return;
      }

      let resultId: string;

      if (isEditMode && editAdId) {
        // MODO UPDATE
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

        resultId = data.slug || data.id;
        notify.success('Aviso actualizado exitosamente!');
      } else {
        // MODO CREATE - Usar nuevo BFF API
        
        // ⚠️ ALERTA: Si hay un editAdId pero isEditMode es false, algo está mal
        if (editAdId && !isEditMode) {
          console.error('⚠️ WARNING: editAdId existe pero isEditMode es false!', { editAdId, isEditMode });
          notify.error('Error interno: modo de edición inconsistente. Recarga la página.');
          return;
        }

        // Validar UUIDs antes de enviar
        if (!UUID_REGEX.test(selectedCategory) || !UUID_REGEX.test(selectedSubcategory)) {
          notify.error('Categoría o subcategoría inválida. Por favor seleccioná de nuevo.');
          setCurrentStep(1);
          return;
        }

        // Usar provincia/localidad del vendedor si no se especificó
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

        // Usar slug si está disponible, sino usar id
        resultId = ad.slug || ad.id;
        
        // ✅ Eliminar draft después de publicar exitosamente
        if (draftId) {
          DraftManager.deleteDraft(draftId);
        }
        
        notify.success('Aviso publicado exitosamente!');
      }
      
      // Redirigir al detalle usando el slug del aviso
      setTimeout(() => {
        navigateTo(`/ad/${resultId}`);
      }, 1000);

    } catch (error: any) {
      console.error('Error guardando aviso:', error);
      if (error?.fields) console.error('❌ Campos inválidos:', JSON.stringify(error.fields, null, 2));
      notify.error(error.message || 'Error guardando aviso');
    } finally {
      setSubmitting(false);
    }
  }

  // ====================================================================
  // RENDER
  // ====================================================================

  function WizardBreadcrumb({ segments, onChangeCat }: { segments: string[]; onChangeCat?: () => void }) {
    if (segments.length === 0) return null;
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {segments.map((seg, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />}
            <span className={`text-xs ${i === segments.length - 1 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
              {seg}
            </span>
          </React.Fragment>
        ))}
        {onChangeCat && (
          <button
            onClick={onChangeCat}
            className="ml-1 text-xs text-brand-600 hover:underline font-medium flex-shrink-0"
          >
            Cambiar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 pb-20">
      {/* Header Mobile Compacto - Solo 1 sticky element */}
      <div className={`lg:hidden border-b sticky top-0 z-30 ${
        isEditMode
          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
          : 'bg-white border-gray-200'
      }`}>
        <div className="px-4 py-2.5 space-y-2">
          {/* Row 1: [spacer] + Título + Badge Edit */}
          <div className="flex items-center justify-between gap-3">
            <div className="w-10" />{/* spacer — navegación via botones del footer */}

            <h1 className="flex-1 text-center text-lg font-bold text-gray-900 truncate">
              {isEditMode ? 'Editar Aviso' : currentStep === 1 ? '¿Qué querés publicar?' : 'Armado del Aviso'}
            </h1>

            {isEditMode ? (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                  EDIT
                </span>
                <button
                  onClick={() => navigateTo('/my-ads')}
                  className="text-xs text-amber-700 underline underline-offset-2"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <AutoSaveIndicator lastSaved={lastSaved} />
            )}
          </div>

          {/* Row 2: Breadcrumb — visible cuando hay categoría seleccionada */}
          {breadcrumbSegments.length > 0 && (
            <WizardBreadcrumb
              segments={breadcrumbSegments}
              onChangeCat={currentStep > 1 ? wizardBlockProps.onChangeCategory : undefined}
            />
          )}

          {/* Row 3: Step label + description + counter */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="font-semibold text-gray-800 truncate pr-2">
              {activeStep?.label ?? ''}
              {activeStep?.description ? ` — ${activeStep.description}` : ''}
            </span>
            <span className="flex-shrink-0 text-xs text-gray-400">{currentStep}/{wizardSteps.length}</span>
          </div>

          {/* Row 4: Progress bar */}
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="bg-brand-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / wizardSteps.length) * 100}%` }}
            />
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
              {isEditMode ? 'Editar Aviso' : currentStep === 1 ? '¿Qué querés publicar?' : 'Armado del Aviso'}
            </h1>
            <div className="flex items-center gap-4">
              {isEditMode ? (
                <button
                  onClick={() => navigateTo('/my-ads')}
                  className="text-sm text-amber-700 underline underline-offset-2 font-medium"
                >
                  Cancelar edición
                </button>
              ) : (
                <AutoSaveIndicator lastSaved={lastSaved} />
              )}
              
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
          <div className="flex items-center justify-between">
            {wizardSteps.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;
              const StepIcon = STEP_ICON_MAP[step.icon] ?? Settings;

              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-brand-600 text-white'
                          : isActive
                          ? 'bg-brand-600 text-white scale-110 shadow-lg shadow-brand-200'
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
                      <p className={`text-sm font-semibold ${isActive ? 'text-brand-600' : 'text-gray-600'}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>

                  {index < wizardSteps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${isCompleted ? 'bg-brand-600' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Breadcrumb row desktop — solo si hay categoría seleccionada y paso > 1 */}
          {breadcrumbSegments.length > 0 && currentStep > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <WizardBreadcrumb
                segments={breadcrumbSegments}
                onChangeCat={wizardBlockProps.onChangeCategory}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-4 sm:py-6 bg-gray-50">
        {/* Layout: Full width sin preview lateral */}
        <div className="max-w-4xl mx-auto">
          <div>
            <div className="bg-white sm:bg-gray-100 rounded-none sm:rounded-lg shadow-none sm:shadow-xl border-0 sm:border-2 border-gray-200 sm:border-gray-300 overflow-hidden">
              <div className="p-3 sm:p-10 lg:p-12">
                {/* STEP 1: CATEGORÍA — selector 3 columnas: L1 | L2 | L3 */}
                {activeStepKey === 'categoria' && (
                  showProfileGate ? (
                    <ProfileGate
                      subcategoryDisplayName={pendingSubcategoryName}
                      onEmpresaCreated={(empresa) => {
                        setShowProfileGate(false);
                        setSelectedBusinessProfileId(empresa.id);
                        setCurrentStep(2);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  ) : (() => {
                    // Datos compartidos mobile + desktop
                    const l2Subs = subcategories.filter(s => !s.parent_id);
                    const childrenMap: Record<string, Subcategory[]> = {};
                    subcategories.filter(s => s.parent_id).forEach(s => {
                      if (!childrenMap[s.parent_id!]) childrenMap[s.parent_id!] = [];
                      childrenMap[s.parent_id!].push(s);
                    });
                    const l3Subs = expandedL2Sub ? (childrenMap[expandedL2Sub] || []) : [];
                    const showL3Col = l3Subs.length > 0;
                    const selectedCat = categories.find(c => c.id === selectedCategory);
                    const expandedL2Sub_data = l2Subs.find(s => s.id === expandedL2Sub);

                    const handleSelectLeaf = async (leafSub: Subcategory, parentSlug?: string) => {
                      const isServicioEmpresa = leafSub.slug === 'servicios' || leafSub.slug === 'empresas' || parentSlug === 'servicios' || parentSlug === 'empresas';
                      setSelectedSubcategory(leafSub.id);
                      setSelectedPageType(isServicioEmpresa ? 'empresa' : 'particular');
                      if (isServicioEmpresa) {
                        const empresas = await getMyCompanies();
                        if (empresas.length === 0) {
                          setPendingSubcategoryName(leafSub.display_name);
                          setShowProfileGate(true);
                          return;
                        }
                      }
                      setTimeout(() => {
                        setCurrentStep(2);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }, 200);
                    };

                    // Fila reutilizable para mobile
                    const MobileRow = ({ label, isActive, hasChildren, isSelected, isServicio, onClick }: {
                      label: string; isActive?: boolean; hasChildren?: boolean;
                      isSelected?: boolean; isServicio?: boolean; onClick: () => void;
                    }) => (
                      <button
                        onClick={onClick}
                        className={`w-full flex items-center gap-3 px-4 py-[14px] text-left transition-colors border-b border-gray-100 last:border-b-0 active:bg-gray-50 ${
                          isActive ? 'bg-brand-50' : 'bg-white'
                        }`}
                      >
                        {isServicio && <Building2 className="w-5 h-5 text-brand-500 flex-shrink-0" />}
                        <span className={`flex-1 text-base font-medium ${isActive ? 'text-brand-800' : 'text-gray-800'}`}>
                          {label}
                        </span>
                        {isSelected
                          ? <Check className="w-5 h-5 text-brand-600 flex-shrink-0" />
                          : <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-brand-500' : 'text-gray-300'}`} />
                        }
                      </button>
                    );

                    return (
                      <div className="space-y-4 sm:space-y-6">

                        {/* ── MOBILE: Drill-down navigation (< lg) ── */}
                        <div className="lg:hidden">
                          {/* Breadcrumb / volver */}
                          {mobileNavLevel > 1 && (
                            <button
                              onClick={() => {
                                setDrillDirection('back');
                                if (mobileNavLevel === 2) {
                                  setMobileNavLevel(1);
                                  setSelectedCategory('');
                                  setExpandedCategory('');
                                  setSelectedSubcategory('');
                                  setExpandedL2Sub('');
                                } else {
                                  setMobileNavLevel(2);
                                  setExpandedL2Sub('');
                                  setSelectedSubcategory('');
                                }
                              }}
                              className="flex items-center gap-1 text-brand-600 text-sm font-medium mb-3 py-1"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              {mobileNavLevel === 2 ? 'Categorías' : selectedCat?.display_name}
                            </button>
                          )}

                          {/* Título del nivel */}
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                            {mobileNavLevel === 1 && 'Seleccioná una categoría'}
                            {mobileNavLevel === 2 && selectedCat?.display_name}
                            {mobileNavLevel === 3 && expandedL2Sub_data?.display_name}
                          </p>

                          {/* Lista animada — key fuerza remount en cada nivel */}
                          <div
                            key={`mob-${mobileNavLevel}-${drillDirection}`}
                            className={`border border-gray-200 rounded-xl overflow-hidden divide-y-0 ${drillDirection === 'back' ? 'drill-enter-back' : 'drill-enter-forward'}`}
                          >
                            {/* NIVEL 1: Categorías */}
                            {mobileNavLevel === 1 && categories.map((cat) => (
                              <MobileRow
                                key={cat.id}
                                label={cat.display_name}
                                isActive={selectedCategory === cat.id}
                                hasChildren
                                onClick={() => {
                                  setDrillDirection('forward');
                                  setSelectedCategory(cat.id);
                                  setExpandedCategory(cat.id);
                                  setSelectedSubcategory('');
                                  setExpandedL2Sub('');
                                  setMobileNavLevel(2);
                                }}
                              />
                            ))}

                            {/* NIVEL 2: Subcategorías L2 */}
                            {mobileNavLevel === 2 && (
                              l2Subs.length === 0
                                ? <div className="p-4 text-sm text-gray-400 italic">Cargando...</div>
                                : l2Subs.map((sub) => {
                                    const hasChildren = (childrenMap[sub.id] || []).length > 0;
                                    const isServicio = sub.slug === 'servicios' || sub.slug === 'empresas';
                                    const isActive = hasChildren ? expandedL2Sub === sub.id : selectedSubcategory === sub.id;
                                    return (
                                      <MobileRow
                                        key={sub.id}
                                        label={sub.display_name}
                                        isActive={isActive}
                                        hasChildren={hasChildren}
                                        isSelected={!hasChildren && selectedSubcategory === sub.id}
                                        isServicio={isServicio}
                                        onClick={() => {
                                          if (hasChildren) {
                                            setDrillDirection('forward');
                                            setExpandedL2Sub(sub.id);
                                            setSelectedSubcategory('');
                                            setMobileNavLevel(3);
                                          } else {
                                            handleSelectLeaf(sub);
                                          }
                                        }}
                                      />
                                    );
                                  })
                            )}

                            {/* NIVEL 3: Tipos L3 */}
                            {mobileNavLevel === 3 && l3Subs.map((child) => {
                              const parentSlug = expandedL2Sub_data?.slug;
                              return (
                                <MobileRow
                                  key={child.id}
                                  label={child.display_name}
                                  isSelected={selectedSubcategory === child.id}
                                  onClick={() => handleSelectLeaf(child, parentSlug)}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* ── DESKTOP: Miller columns (lg+) ── */}
                        <div className="hidden lg:block">
                          <div className="mb-4">
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">¿Qué vas a publicar?</h2>
                            <p className="text-sm lg:text-base text-gray-500">
                              Seleccioná categoría → subcategoría{showL3Col ? ' → tipo' : ''}
                            </p>
                          </div>
                          <div className={`grid gap-0 border border-gray-200 rounded-xl overflow-hidden ${showL3Col ? 'grid-cols-3' : selectedCategory ? 'grid-cols-2' : 'grid-cols-1'}`}>

                            {/* COLUMNA 1 — L1 */}
                            <div className="flex flex-col border-r border-gray-200 bg-gray-50">
                              <div className="px-3 py-2 bg-gray-100 border-b border-gray-200">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</p>
                              </div>
                              <div className="flex flex-col overflow-y-auto max-h-[420px]">
                                {categories.map((cat) => {
                                  const isSelected = selectedCategory === cat.id;
                                  return (
                                    <button
                                      key={cat.id}
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedCategory(''); setSelectedSubcategory('');
                                          setExpandedCategory(''); setExpandedL2Sub('');
                                          setSelectedPageType('particular');
                                        } else {
                                          setSelectedCategory(cat.id); setExpandedCategory(cat.id);
                                          setSelectedSubcategory(''); setExpandedL2Sub('');
                                          setSelectedPageType('particular'); setShowProfileGate(false);
                                        }
                                      }}
                                      className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all border-b border-gray-100 last:border-b-0 ${
                                        isSelected ? 'bg-brand-600 text-white font-semibold' : 'hover:bg-white text-gray-800 hover:text-brand-700'
                                      }`}
                                    >
                                      <span className="text-sm font-medium">{cat.display_name}</span>
                                      {isSelected && <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-80" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* COLUMNA 2 — L2 */}
                            {selectedCategory && (
                              <div className={`flex flex-col ${showL3Col ? 'border-r border-gray-200' : ''} bg-white`}>
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subcategoría</p>
                                </div>
                                <div className="flex flex-col overflow-y-auto max-h-[420px]">
                                  {l2Subs.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-400 italic">Cargando...</div>
                                  ) : l2Subs.map((sub) => {
                                    const hasChildren = (childrenMap[sub.id] || []).length > 0;
                                    const isServicioEmpresa = sub.slug === 'servicios' || sub.slug === 'empresas';
                                    const isActive = hasChildren ? expandedL2Sub === sub.id : selectedSubcategory === sub.id;
                                    return (
                                      <button
                                        key={sub.id}
                                        onClick={() => {
                                          if (hasChildren) {
                                            setExpandedL2Sub(isActive ? '' : sub.id);
                                            setSelectedSubcategory('');
                                          } else {
                                            setExpandedL2Sub('');
                                            handleSelectLeaf(sub);
                                          }
                                        }}
                                        className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all border-b border-gray-100 last:border-b-0 ${
                                          isActive ? 'bg-brand-50 text-brand-800 font-semibold border-l-2 border-l-brand-500' : 'hover:bg-gray-50 text-gray-800 hover:text-brand-700'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          {isServicioEmpresa && <Building2 className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />}
                                          <span className="text-sm truncate">{sub.display_name}</span>
                                        </div>
                                        {hasChildren
                                          ? <ChevronRight className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                                          : isActive && <Check className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                                        }
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* COLUMNA 3 — L3 */}
                            {showL3Col && (
                              <div className="flex flex-col bg-white">
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {expandedL2Sub_data?.display_name ?? 'Tipo'}
                                  </p>
                                </div>
                                <div className="flex flex-col overflow-y-auto max-h-[420px]">
                                  {l3Subs.map((child) => {
                                    const parentSlug = expandedL2Sub_data?.slug;
                                    const isSelected = selectedSubcategory === child.id;
                                    return (
                                      <button
                                        key={child.id}
                                        onClick={() => handleSelectLeaf(child, parentSlug)}
                                        className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all border-b border-gray-100 last:border-b-0 ${
                                          isSelected ? 'bg-brand-600 text-white font-semibold' : 'hover:bg-gray-50 text-gray-800 hover:text-brand-700'
                                        }`}
                                      >
                                        <span className="text-sm">{child.display_name}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })()
                )}

            {/* STEPS 2-5: renderizados por BlockRenderer según config de wizard_configs */}
            {/* STEPS 2-5: driven por blocks de wizard_configs */}
            {activeStep && activeStep.blocks.length > 0 && (
              <div className="space-y-6">
                {[...activeStep.blocks]
                  .sort((a, b) => a.order - b.order)
                  .map(block => (
                    <BlockRenderer
                      key={block.type}
                      block={block}
                      wizardProps={wizardBlockProps}
                    />
                  ))
                }
              </div>
            )}

            {/* STEP 6: PREVIEW FINAL */}
            {activeStepKey === 'revision' && (() => {
              const successImages = uploadedImagesRef.current.filter(img => img.status === 'success');

              return (
                <div className="space-y-6">
                  <AdPreviewCard
                    data={{
                      title,
                      description,
                      price: price ? parseInt(price) : null,
                      price_unit: priceUnit || null,
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
    <div className="px-3 sm:px-10 lg:px-12 py-3 sm:py-6 bg-gray-50 border-t-2 border-gray-200 flex items-center justify-between gap-3">
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
                className="min-w-[56px] sm:min-w-[100px]"
              >
                <span className="hidden sm:inline">Atrás</span>
              </Button>
            )}

            {/* Next / Submit */}
            <Button
              variant="primary"
              size="lg"
              fullWidth={activeStepKey === 'categoria' || currentStep > 1}
              onClick={() => {
                if (activeStepKey === 'revision') {
                  handleSubmit();
                } else {
                  goNext();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              disabled={submitting}
              loading={submitting}
              leftIcon={activeStepKey === 'revision' ? <CheckCircle2 className="w-6 h-6" /> : undefined}
              rightIcon={activeStepKey !== 'revision' ? <ChevronRight className="w-5 h-5" /> : undefined}
              className={`text-base font-bold tracking-wide ${activeStepKey === 'categoria' ? 'ml-auto' : ''}`}
            >
              {submitting
                ? (isEditMode ? 'Actualizando...' : 'Publicando...')
                : activeStepKey === 'revision'
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

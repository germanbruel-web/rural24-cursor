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
import { Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCategories, getSubcategories, getFormForContext } from '../../services/v2/formsService';
import type { Category, Subcategory, PriceConfig } from '../../types/v2';
import { getOptionListItemsByName } from '../../services/v2/optionListsService';
import { getProvinces, getLocalitiesByProvince, type Province, type Locality } from '../../services/v2/locationsService';
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
import { getWizardConfig, DEFAULT_STEPS, type WizardStep } from '../../services/v2/wizardConfigService';
import { EmpresaSelectorWidget } from '../dashboard/EmpresaSelectorWidget';
import { ProfileGate } from '../dashboard/ProfileGate';
import { getMyCompanies } from '../../services/empresaService';
import { useAccount } from '../../contexts/AccountContext';

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
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');

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

  // Cargar localidades cuando cambia la provincia seleccionada
  useEffect(() => {
    if (!selectedProvinceId) { setLocalities([]); return; }
    getLocalitiesByProvince(selectedProvinceId).then(setLocalities);
  }, [selectedProvinceId]);

  // Derivado: key del step actual
  const activeStepKey = wizardSteps[currentStep - 1]?.key ?? '';

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

        resultId = data.id;
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
              <span className="font-medium text-gray-900">{wizardSteps[currentStep - 1]?.label ?? ''}</span>
              <span>{currentStep}/{wizardSteps.length}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="bg-brand-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / wizardSteps.length) * 100}%` }}
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
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-4 sm:py-6 bg-gray-50">
        {/* Layout: Full width sin preview lateral */}
        <div className="max-w-4xl mx-auto">
          <div>
            <div className="bg-white sm:bg-gray-100 rounded-xl sm:rounded-2xl shadow-sm sm:shadow-xl border sm:border-2 border-gray-200 sm:border-gray-300 overflow-hidden">
              <div className="p-4 sm:p-10 lg:p-12">
                {/* STEP 1: CATEGORÍA — 2 niveles: Categoría → Subcategoría → formulario */}
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
                  ) : (
                  <div className="space-y-4 sm:space-y-8">
                    <div className="hidden sm:block">
                      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                        ¿Qué vas a publicar?
                      </h2>
                      <p className="text-base sm:text-lg text-gray-600">
                        Seleccioná la categoría y subcategoría
                      </p>
                    </div>

                    <div className="space-y-2 sm:space-y-4">
                      {categories.map((cat) => {
                        const isExpanded = expandedCategory === cat.id;
                        const isSelected = selectedCategory === cat.id;
                        return (
                          <div key={cat.id} className="space-y-2 sm:space-y-3">
                            {/* Botón categoría */}
                            <button
                              onClick={() => {
                                if (isExpanded) {
                                  setExpandedCategory('');
                                  setSelectedCategory('');
                                  setSelectedSubcategory('');
                                  setSelectedPageType('particular');
                                  setShowProfileGate(false);
                                } else {
                                  setExpandedCategory(cat.id);
                                  setSelectedCategory(cat.id);
                                  setSelectedSubcategory('');
                                  setSelectedPageType('particular');
                                  setShowProfileGate(false);
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

                            {/* Subcategorías — click directo al formulario */}
                            {isExpanded && subcategories.length > 0 && (
                              <div className="space-y-2 animate-fadeIn pl-2 sm:pl-0">
                                <p className="text-sm sm:text-base font-bold text-brand-600 mb-2">
                                  Elegí una subcategoría:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {subcategories.map((sub) => {
                                    const isServicioEmpresa = sub.slug === 'servicios' || sub.slug === 'empresas';
                                    return (
                                      <button
                                        key={sub.id}
                                        onClick={async () => {
                                          setSelectedSubcategory(sub.id);
                                          setSelectedPageType(isServicioEmpresa ? 'empresa' : 'particular');

                                          if (isServicioEmpresa) {
                                            const empresas = await getMyCompanies();
                                            if (empresas.length === 0) {
                                              setPendingSubcategoryName(sub.display_name);
                                              setShowProfileGate(true);
                                              return; // no avanzar — gate bloqueante
                                            }
                                          }

                                          setTimeout(() => {
                                            setCurrentStep(2);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }, 200);
                                        }}
                                        className="w-full p-3 rounded-lg border-2 border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition-all text-left flex items-center justify-between group"
                                      >
                                        <div className="flex items-center gap-2">
                                          {isServicioEmpresa && <Building2 className="w-4 h-4 text-brand-600 flex-shrink-0" />}
                                          <span className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-brand-700">
                                            {sub.display_name}
                                          </span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-brand-400 flex-shrink-0 group-hover:text-brand-600 transition-colors" />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  )
                )}

            {/* STEP 2: CARACTERÍSTICAS (Atributos Dinámicos) */}
            {activeStepKey === 'caracteristicas' && (
              <div className="space-y-4">
                {/* Breadcrumb integrado en el formulario - Mobile First */}
                {selectedCategory && selectedSubcategory && (
                  <div className="flex items-center justify-between bg-gradient-to-r from-brand-50 to-emerald-50 border border-brand-200 rounded-lg px-3 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-wrap">
                      <Tag className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-brand-600 truncate">
                        {categories.find(c => c.id === selectedCategory)?.display_name}
                      </span>
                      <ChevronRight className="w-3 h-3 text-brand-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-brand-700 truncate flex items-center gap-1">
                        {selectedPageType === 'empresa' && <Building2 className="w-3 h-3" />}
                        {subcategories.find(s => s.id === selectedSubcategory)?.display_name}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        setSelectedCategory('');
                        setSelectedSubcategory('');
                        setSelectedPageType('particular');
                        setExpandedCategory('');
                        setShowProfileGate(false);
                      }}
                      className="text-xs text-brand-600 hover:text-brand-700 font-semibold hover:underline flex-shrink-0 ml-2"
                    >
                      Cambiar
                    </button>
                  </div>
                )}

                {/* DynamicFormLoader - Sin título redundante */}
                <DynamicFormLoader
                  subcategoryId={selectedSubcategory}
                  categoryId={selectedCategory || undefined}
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

                {/* Precio */}
                <div className="space-y-4">
                  <label className={DS.label}>
                    Precio <span className="text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Monto */}
                    <div className={priceUnitOptions.length > 0 ? 'sm:col-span-1' : 'sm:col-span-2'}>
                      <input
                        type="text"
                        value={formatPriceDisplay(price)}
                        onChange={(e) => setPrice(cleanPrice(e.target.value))}
                        placeholder="ej: 50000"
                        className={DS.input}
                      />
                      <p className={DS.helperText}>Solo números enteros</p>
                    </div>

                    {/* Moneda */}
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

                    {/* Unidad (solo si el template tiene price_config.units_list) */}
                    {priceUnitOptions.length > 0 && (
                      <div>
                        <select
                          value={priceUnit}
                          onChange={(e) => setPriceUnit(e.target.value)}
                          className={DS.input}
                        >
                          <option value="">Unidad...</option>
                          {priceUnitOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Preview */}
                  {price && (
                    <div className="flex items-center gap-2 p-3 bg-primary-50 border-2 border-primary-200 rounded-lg">
                      <DollarSign className="w-5 h-5 text-primary-600" />
                      <span className="text-sm text-gray-700">
                        Se publicará como:{' '}
                        <strong className="text-primary-700 text-lg">
                          {formatCurrency(price, currency)}
                          {priceUnit && priceUnitOptions.find(o => o.value === priceUnit)
                            ? ` ${priceUnitOptions.find(o => o.value === priceUnit)!.label}`
                            : ''}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Empresa selector (solo visible si el usuario tiene empresas activas) */}
                <EmpresaSelectorWidget
                  selectedId={selectedBusinessProfileId}
                  onChange={setSelectedBusinessProfileId}
                />
              </div>
            )}

            {/* STEP 3: UBICACIÓN */}
            {activeStepKey === 'ubicacion' && (
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
                      value={selectedProvinceId}
                      onChange={(e) => {
                        const prov = provinces.find((p) => p.id === e.target.value);
                        setSelectedProvinceId(e.target.value);
                        setProvince(prov?.name ?? '');
                        setLocality('');
                      }}
                      className={DS.input}
                    >
                      <option value="">Seleccionar provincia</option>
                      {provinces.map((prov) => (
                        <option key={prov.id} value={prov.id}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                  </Card>

                  {/* Localidad */}
                  <Card variant="default" padding="md">
                    <label className={DS.label}>
                      Localidad {selectedProvinceId && <span className="text-error">*</span>}
                    </label>
                    {selectedProvinceId ? (
                      <select
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        className={DS.input}
                      >
                        <option value="">Seleccionar localidad</option>
                        {localities.map((loc) => (
                          <option key={loc.id} value={loc.name}>
                            {loc.name}
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
            {activeStepKey === 'fotos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Fotos
                  </h2>
                  {uploadedImages.filter(img => img.status === 'success').length > 0 && (
                    <span className="text-sm text-brand-600 font-medium">
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
            {activeStepKey === 'informacion' && (
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
              fullWidth={activeStepKey === 'categoria'}
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
              className={activeStepKey === 'categoria' ? 'ml-auto' : ''}
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

// ====================================================================
// PUBLICAR AVISO V3 - Wizard con Atributos Dinámicos
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
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCategories, getSubcategories, getCategoryTypes } from '../../services/v2/formsService';
import { getAttributes } from '../../services/v2/attributesService';
import type { Category, Subcategory, CategoryType } from '../../types/v2';
import type { DynamicAttributeDB } from '../../services/v2/attributesService';
import { DynamicField } from '../DynamicField';
import type { DynamicAttribute } from '../../services/catalogService';
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

// Design System Components
import { Button } from '../../design-system/components/Button';
import { Card } from '../molecules/Card';
import { Input } from '../../design-system/components/Input';
import { AdPreviewCard } from '../shared/AdPreviewCard';
import type { AdPreviewData } from '../shared/AdPreviewCard';
import InfoBox from '../molecules/InfoBox/InfoBox';
import TipsCard from '../molecules/TipsCard/TipsCard';
import { AutoSaveIndicator } from '../molecules/AutoSaveIndicator';

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
  const [attributes, setAttributes] = useState<DynamicAttribute[]>([]);
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
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [suggestedDescriptions, setSuggestedDescriptions] = useState<string[]>([]);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number | null>(null);
  const [selectedDescIndex, setSelectedDescIndex] = useState<number | null>(null);
  
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
  // FUNCIONES DE VALIDACIÓN DE GRUPOS (100% DINÁMICO)
  // ====================================================================
  
  /**
   * Obtener orden de grupos dinámicamente basado en displayOrder de atributos
   */
  const getGroupsOrder = (attrs: DynamicAttribute[]): string[] => {
    const groupsMap = attrs.reduce((acc, attr) => {
      const group = attr.fieldGroup || 'general';
      if (!acc[group] || attr.displayOrder < acc[group]) {
        acc[group] = attr.displayOrder;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.keys(groupsMap).sort((a, b) => groupsMap[a] - groupsMap[b]);
  };
  
  /**
   * Validar si un grupo está completo (todos los campos requeridos llenos)
   */
  const isGroupComplete = (group: string, groupFields: DynamicAttribute[]): boolean => {
    const requiredFields = groupFields.filter(f => f.isRequired);
    
    // Si no hay campos requeridos, el grupo se considera auto-completado
    if (requiredFields.length === 0) return true;
    
    // Verificar que todos los campos requeridos tengan valor
    return requiredFields.every(field => {
      const value = attributeValues[field.slug];
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    });
  };
  
  /**
   * Verificar si un grupo está desbloqueado (secuencial)
   */
  const isGroupUnlocked = (group: string, attrs: DynamicAttribute[]): boolean => {
    const groupsOrder = getGroupsOrder(attrs);
    const groupIndex = groupsOrder.indexOf(group);
    
    // Primer grupo siempre desbloqueado
    if (groupIndex === 0) return true;
    
    // Verificar que todos los grupos anteriores estén completos
    for (let i = 0; i < groupIndex; i++) {
      const prevGroup = groupsOrder[i];
      const prevGroupFields = attrs.filter(a => (a.fieldGroup || 'general') === prevGroup);
      if (!isGroupComplete(prevGroup, prevGroupFields)) {
        return false;
      }
    }
    
    return true;
  };

  // ====================================================================
  // EFFECTS - Cargar datos
  // ====================================================================
  // ====================================================================
  // LIFECYCLE & INITIALIZATION
  // ====================================================================
  useEffect(() => {
    loadCategories();
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
        window.location.hash = '#/my-ads';
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
      window.location.hash = '#/my-ads';
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

  useEffect(() => {
    if (selectedSubcategory) {
      loadAttributes();
    } else {
      setAttributes([]);
    }
  }, [selectedSubcategory]);

  // Abrir automáticamente el primer grupo cuando se cargan atributos
  useEffect(() => {
    if (attributes.length > 0 && currentStep === 2 && !expandedAttributeGroup) {
      const groupsOrder = getGroupsOrder(attributes);
      if (groupsOrder.length > 0) {
        setExpandedAttributeGroup(groupsOrder[0]);
      }
    }
  }, [attributes, currentStep]);

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

  async function loadAttributes() {
    try {
      setLoading(true);
      
      const filters: any = {
        subcategoryId: selectedSubcategory,
        isActive: true,
      };
      
      const data = await getAttributes(filters);

      // Convertir al formato DynamicAttribute
      const formatted: DynamicAttribute[] = data.map((attr: DynamicAttributeDB) => ({
        id: attr.id,
        slug: attr.field_name,
        name: attr.field_label,
        description: attr.help_text || undefined,
        inputType: attr.field_type,
        dataType: attr.field_type,
        isRequired: attr.is_required,
        displayOrder: attr.sort_order,
        fieldGroup: attr.field_group || 'general',
        uiConfig: {
          label: attr.field_label,
          placeholder: attr.placeholder || undefined,
          prefix: attr.prefix || undefined,
          suffix: attr.suffix || undefined,
        },
        validations: {
          min: attr.min_value !== null ? attr.min_value : undefined,
          max: attr.max_value !== null ? attr.max_value : undefined,
        },
        isFilterable: false,
        isFeatured: false,
        options: Array.isArray(attr.field_options)
          ? attr.field_options.map((opt: string) => ({ value: opt, label: opt }))
          : [],
      }));

      setAttributes(formatted);
    } catch (error) {
      console.error('Error cargando atributos:', error);
    } finally {
      setLoading(false);
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
      // Validar atributos obligatorios
      const requiredAttrs = attributes.filter(a => a.isRequired);
      const missingAttrs = requiredAttrs.filter(a => !attributeValues[a.slug]);
      
      if (missingAttrs.length > 0) {
        notify.error(`Completa: ${missingAttrs.map(a => a.name).join(', ')}`);
        return;
      }
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
          return { url: img.url, path: img.path };
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

      // 2. Preparar datos (nota: adData solo se usa para UPDATE mode, CREATE usa estructura diferente)
      const adData = {
        category_id: selectedCategory,
        subcategory_id: selectedSubcategory,
        title: title.trim(),
        description: description.trim(),
        price: price ? parseFloat(price) : null,
        currency,
        location: locality || null,
        province,
        images: finalImages.map(img => img.url), // Para UPDATE, mantener compatibilidad
        attributes: attributeValues,
        status: 'active',
      };

      console.log(isEditMode ? '📝 Datos a actualizar:' : '📦 Datos a insertar:', adData);
      
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
        const createData = {
          user_id: profile.id,
          category_id: selectedCategory,
          subcategory_id: selectedSubcategory,
          title: title.trim(),
          description: description.trim(),
          price: price ? parseFloat(price) : null,
          currency,
          city: locality || null,
          province,
          images: finalImages,
          attributes: attributeValues,
          contact_phone: null,
          contact_email: null,
        };

        console.log('📦 Enviando a BFF API:', JSON.stringify(createData, null, 2));
        console.log('📦 Tipo de images:', typeof createData.images);
        console.log('📦 Es array?:', Array.isArray(createData.images));
        console.log('📦 Primer elemento images:', createData.images[0]);

        const ad = await adsApi.create(createData);

        resultId = ad.id;
        
        // ✅ Eliminar draft después de publicar exitosamente
        if (draftId) {
          DraftManager.deleteDraft(draftId);
          console.log('🗑️ Draft eliminado después de publicación exitosa');
        }
        
        notify.success('Aviso publicado exitosamente!');
      }
      
      // Redirigir al detalle
      setTimeout(() => {
        window.location.hash = `#/ad/${resultId}`;
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
      {/* Header Mobile con indicador de modo EDIT */}
      <div className={`lg:hidden border-b-2 sticky top-20 z-30 ${
        isEditMode 
          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Volver</span>
            </button>
            {isEditMode && (
              <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                EDITANDO
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className={`border-b-2 sticky top-40 lg:top-0 z-20 ${
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
            <AutoSaveIndicator lastSaved={lastSaved} />
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

          {/* Mobile Stepper */}
          <div className="lg:hidden">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">
                Paso {currentStep} de {STEPS.length}
              </p>
              <p className="text-sm text-gray-600">
                {Math.round((currentStep / STEPS.length) * 100)}%
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>
            <p className="text-center mt-3 font-semibold text-green-600">
              {STEPS[currentStep - 1].title}
            </p>
            <p className="text-center text-sm text-gray-500">
              {STEPS[currentStep - 1].description}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50">
        {/* Breadcrumb sticky - Desde Step 2 */}
        {currentStep >= 2 && selectedCategory && selectedSubcategory && (
          <div className="sticky top-56 lg:top-4 z-30 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl px-5 py-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-green-700">
                  <span>{categories.find(c => c.id === selectedCategory)?.display_name}</span>
                  <ChevronRight className="w-4 h-4" />
                  <span>{subcategories.find(s => s.id === selectedSubcategory)?.display_name}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setSelectedCategory('');
                  setSelectedSubcategory('');
                  setExpandedCategory('');
                }}
                className="text-sm text-green-600 hover:text-green-700 font-semibold hover:underline"
              >
                Cambiar
              </button>
            </div>
          </div>
        )}

        {/* Layout: Full width sin preview lateral */}
        <div className="max-w-4xl mx-auto">
          <div>
            <div className="bg-gray-100 rounded-2xl shadow-xl border-2 border-gray-300 overflow-hidden">
              <div className="p-6 sm:p-10 lg:p-12">
                {/* STEP 1: CATEGORÍA (OPTIMIZADO - ACCORDION INLINE) */}
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                        ¿Qué vas a publicar?
                      </h2>
                      <p className="text-base sm:text-lg text-gray-600">
                        Seleccioná la categoría y subcategoría de tu producto
                      </p>
                    </div>

                    {/* Grid de categorías con accordion */}
                    <div className="space-y-4">
                      {categories.map((cat) => {
                        const isExpanded = expandedCategory === cat.id;
                        const isSelected = selectedCategory === cat.id;
                        
                        return (
                          <div key={cat.id} className="space-y-3">
                            {/* Botón categoría */}
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
                              className={`w-full p-5 sm:p-6 rounded-xl border-2 transition-all text-left ${
                                isSelected
                                  ? 'border-green-500 bg-green-50 shadow-md'
                                  : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                                    {cat.icon && <span className="mr-3">{cat.icon}</span>}
                                    {cat.display_name}
                                  </p>
                                  {cat.description && (
                                    <p className="text-base sm:text-lg text-gray-600 mt-2">
                                      {cat.description}
                                    </p>
                                  )}
                                </div>
                                <ChevronRight
                                  className={`w-6 h-6 text-green-600 flex-shrink-0 ml-3 transition-transform ${
                                    isExpanded ? 'rotate-90' : ''
                                  }`}
                                />
                              </div>
                            </button>

                            {/* Subcategorías (accordion) */}
                            {isExpanded && subcategories.length > 0 && (
                              <div className="space-y-3 animate-fadeIn">
                                <p className="text-base sm:text-lg font-bold text-green-700 mb-3">
                                  Elegí una subcategoría:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {subcategories.map((sub) => (
                                    <button
                                      key={sub.id}
                                      onClick={() => {
                                        setSelectedSubcategory(sub.id);
                                        // Auto-avanzar al step 2 con scroll suave
                                        setTimeout(() => {
                                          setCurrentStep(2);
                                          // Abrir primer accordion automáticamente
                                          const firstGroup = Object.keys(
                                            attributes.reduce((acc, attr) => {
                                              const group = attr.fieldGroup || 'general';
                                              if (!acc[group]) acc[group] = [];
                                              return acc;
                                            }, {} as Record<string, any>)
                                          )[0];
                                          if (firstGroup) {
                                            setExpandedAttributeGroup(firstGroup);
                                          }
                                          // Scroll suave al contenido
                                          window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }, 300);
                                      }}
                                      className="p-4 sm:p-5 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all text-left group"
                                    >
                                      <p className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-green-700">
                                        {sub.display_name}
                                      </p>
                                      {sub.description && (
                                        <p className="text-sm sm:text-base text-gray-600 mt-1">
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
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                    Características técnicas
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600">
                    Completá los detalles específicos de tu producto
                  </p>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 mt-4">Cargando campos...</p>
                  </div>
                ) : attributes.length > 0 ? (
                  <div className="space-y-4">
                    {/* Agrupar y ordenar atributos dinámicamente */}
                    {(() => {
                      // Agrupar atributos
                      const grouped = attributes.reduce((acc, attr) => {
                        const group = attr.fieldGroup || 'general';
                        if (!acc[group]) acc[group] = [];
                        acc[group].push(attr);
                        return acc;
                      }, {} as Record<string, DynamicAttribute[]>);
                      
                      // Obtener orden dinámico
                      const groupsOrder = getGroupsOrder(attributes);
                      
                      // Mapear títulos dinámicamente (capitalizar nombre del grupo)
                      const getGroupTitle = (groupKey: string): string => {
                        const titles: Record<string, string> = {
                          general: 'Información General',
                          motor: 'Motor',
                          transmision: 'Transmisión',
                          dimensiones: 'Dimensiones',
                          hidraulica: 'Sistema Hidráulico',
                          cabina: 'Cabina y Confort',
                          neumaticos: 'Neumáticos',
                          toma_fuerza: 'Toma de Fuerza',
                          capacidades: 'Capacidades',
                          implementos: 'Implementos',
                          otros: 'Otros',
                        };
                        return titles[groupKey] || groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
                      };
                      
                      return groupsOrder.map((group, index) => {
                        const fields = grouped[group];
                        const isExpanded = expandedAttributeGroup === group;
                        const isUnlocked = isGroupUnlocked(group, attributes);
                        const isComplete = isGroupComplete(group, fields);
                        const requiredCount = fields.filter(f => f.isRequired).length;
                        
                        return (
                          <div 
                            key={group} 
                            className={`border-2 rounded-xl overflow-hidden transition-all ${
                              isUnlocked 
                                ? isComplete 
                                  ? 'border-green-300 bg-green-50/30' 
                                  : 'border-gray-200'
                                : 'border-gray-300 bg-gray-50 opacity-60'
                            }`}
                          >
                            <button
                              onClick={() => {
                                if (!isUnlocked) return; // No permitir abrir grupos bloqueados
                                setExpandedAttributeGroup(isExpanded ? '' : group);
                              }}
                              disabled={!isUnlocked}
                              className={`w-full p-5 sm:p-6 transition-all text-left ${
                                !isUnlocked
                                  ? 'cursor-not-allowed'
                                  : isExpanded
                                  ? 'bg-green-50 border-b-2 border-green-200'
                                  : 'bg-white hover:bg-green-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  {/* Ícono de estado */}
                                  {isComplete ? (
                                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                                  ) : !isUnlocked ? (
                                    <Lock className="w-6 h-6 text-gray-400 flex-shrink-0" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                  )}
                                  
                                  <div className="flex-1">
                                    <p className={`text-lg sm:text-xl font-bold ${
                                      isUnlocked ? 'text-gray-900' : 'text-gray-500'
                                    }`}>
                                      {getGroupTitle(group)}
                                    </p>
                                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                                      {requiredCount > 0 
                                        ? `${requiredCount} campo${requiredCount !== 1 ? 's' : ''} requerido${requiredCount !== 1 ? 's' : ''}`
                                        : `${fields.length} campo${fields.length !== 1 ? 's' : ''} opcional${fields.length !== 1 ? 'es' : ''}`
                                      }
                                    </p>
                                  </div>
                                </div>
                                
                                <ChevronRight
                                  className={`w-6 h-6 flex-shrink-0 ml-3 transition-transform ${
                                    isUnlocked ? 'text-green-600' : 'text-gray-400'
                                  } ${isExpanded ? 'rotate-90' : ''}`}
                                />
                              </div>
                            </button>

                            {isExpanded && isUnlocked && (
                              <div className="p-4 sm:p-5 bg-white space-y-4 animate-fadeIn">
                                {fields.map((attr) => (
                                  <DynamicField
                                    key={attr.slug}
                                    attribute={attr}
                                    value={attributeValues[attr.slug]}
                                    onChange={(value) => {
                                      setAttributeValues(prev => ({
                                        ...prev,
                                        [attr.slug]: value,
                                      }));
                                    }}
                                    error={undefined}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                    <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No hay campos específicos para esta categoría
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Puedes continuar al siguiente paso
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: UBICACIÓN */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    ¿Dónde está ubicado?
                  </h2>
                  <p className="text-gray-600">
                    Indicá la ubicación para que los compradores te encuentren
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Provincia */}
                  <Card variant="default" padding="md">
                    <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
                      <MapPin className="w-5 h-5 text-green-600" />
                      Provincia *
                    </label>
                    <select
                      value={province}
                      onChange={(e) => {
                        setProvince(e.target.value);
                        setLocality('');
                      }}
                      className="w-full px-4 py-3 text-base rounded-lg border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all bg-white"
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
                    <label className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
                      <MapPin className="w-5 h-5 text-green-600" />
                      Localidad {province && '*'}
                    </label>
                    {province ? (
                      <select
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        className="w-full px-5 py-5 text-base sm:text-lg rounded-xl border-2 border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all bg-white"
                      >
                        <option value="">Seleccionar localidad</option>
                        {(LOCALITIES_BY_PROVINCE[province] || []).map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-5 py-5 text-base sm:text-lg rounded-xl border-2 border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed flex items-center">
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
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                    Agregá fotos
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600">
                    Las fotos ayudan a vender más rápido. Máximo 8 fotos horizontales (16:9 o 4:3)
                  </p>
                  
                  {/* Contador de imágenes subidas */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">
                        {uploadedImages.filter(img => img.status === 'success').length} foto{uploadedImages.filter(img => img.status === 'success').length !== 1 ? 's' : ''} lista{uploadedImages.filter(img => img.status === 'success').length !== 1 ? 's' : ''} para publicar
                      </span>
                    </div>
                  )}
                </div>

                {/* Simple Image Uploader Component */}
                <SimpleImageUploader
                  maxFiles={8}
                  folder="ads"
                  onImagesChange={handleImagesChange}
                  existingImages={uploadedImages}
                />

                <TipsCard icon={Camera} title="Tips para mejores fotos" variant="blue">
                  <TipsCard.Item icon={Smartphone} strong>
                    GIRA TU CELULAR HORIZONTALMENTE (modo paisaje)
                  </TipsCard.Item>
                  <TipsCard.Item icon={Sun}>
                    Usá buena luz natural (evita fotos oscuras)
                  </TipsCard.Item>
                  <TipsCard.Item icon={ImageIcon}>
                    Mostrá el producto completo y detalles importantes
                  </TipsCard.Item>
                  <TipsCard.Item icon={Layers}>
                    La primera foto será la portada de tu aviso
                  </TipsCard.Item>
                  <TipsCard.Item icon={Move}>
                    Podés arrastrar para reordenar las fotos
                  </TipsCard.Item>
                  <TipsCard.Item icon={Hash}>
                    Máximo 8 fotos por aviso
                  </TipsCard.Item>
                </TipsCard>
              </div>
            )}

            {/* STEP 5: INFORMACIÓN */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                    Información del aviso
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600">
                    Título, descripción y precio
                  </p>
                </div>

                {/* Título */}
                <div className="space-y-2">
                  <label className="block text-lg font-bold text-gray-900">
                    Título del aviso <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Ej: Tractor John Deere 5070E con pala frontal"
                    maxLength={100}
                    className={`w-full px-5 py-5 text-base sm:text-lg rounded-xl border-2 transition-all ${
                      titleError
                        ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50'
                        : 'border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100'
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {title.length}/100 caracteres
                    </p>
                    {titleError && (
                      <p className="text-sm font-semibold text-red-600 flex items-center gap-1">
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
                      <strong>Permitido:</strong> Números y años.
                      <strong className="ml-2">NO permitido:</strong> Teléfonos, emails y sitios web.
                    </InfoBox>
                  )}
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <label className="block text-lg font-bold text-gray-900">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    placeholder="Describe tu producto con el mayor detalle posible. Incluye características, estado, año, etc."
                    rows={6}
                    maxLength={2000}
                    className={`w-full px-5 py-5 text-base sm:text-lg rounded-xl border-2 transition-all resize-none ${
                      descriptionError
                        ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50'
                        : 'border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100'
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {description.length}/2000 caracteres
                    </p>
                    {descriptionError && (
                      <p className="text-sm font-semibold text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        Validando...
                      </p>
                    )}
                  </div>
                  {descriptionError ? (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-red-700">{descriptionError}</p>
                    </div>
                  ) : (
                    <InfoBox variant="info" size="sm">
                      <strong>Permitido:</strong> Números y años.
                      <strong className="ml-2">NO permitido:</strong> Teléfonos, emails y sitios web.
                    </InfoBox>
                  )}
                </div>

                {/* Precio */}
                <div className="space-y-2">
                  <label className="block text-lg font-bold text-gray-900">
                    Precio (opcional)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0"
                        min="0"
                        max="9999999999"
                        step="0.01"
                        className="w-full px-5 py-5 text-base sm:text-lg rounded-xl border-2 border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                      />
                    </div>

                    <div>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as 'ARS' | 'USD')}
                        className="w-full px-5 py-5 text-base sm:text-lg rounded-xl border-2 border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                      >
                        <option value="ARS">ARS $</option>
                        <option value="USD">USD $</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-5 sm:p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-base text-blue-900">
                    Escribí un título claro y una descripción detallada para atraer más compradores.
                  </p>
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
                      price: price ? parseFloat(price) : null,
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

// ====================================================================
// PUBLICAR AVISO V3 - Wizard con Atributos Dinámicos
// Mobile First + UX Profesional + Steps Intuitivos
// ====================================================================

import React, { useState, useEffect } from 'react';
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
import { LivePreviewCard } from '../LivePreviewCard';
import { adsApi } from '../../services/api';
import { uploadsApi } from '../../services/api';

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
export default function PublicarAvisoV3() {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal de autenticación
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Preview modal (mobile)
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
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

  // Step 4: Fotos
  const [photos, setPhotos] = useState<File[]>([]);
  const [photosPreviews, setPhotosPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Step 5: Información (título/descripción generados)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [suggestedDescriptions, setSuggestedDescriptions] = useState<string[]>([]);
  const [selectedTitleIndex, setSelectedTitleIndex] = useState<number | null>(null);
  const [selectedDescIndex, setSelectedDescIndex] = useState<number | null>(null);

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
  useEffect(() => {
    loadCategories();
    detectEditMode();
  }, []);

  // Detectar si estamos en modo edición
  async function detectEditMode() {
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const editId = urlParams.get('edit');
    
    if (editId) {
      setIsEditMode(true);
      setEditAdId(editId);
      await loadAdForEdit(editId);
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
      
      // Pre-llenar Step 4: Fotos existentes
      if (ad.images && ad.images.length > 0) {
        setExistingImages(ad.images);
        setPhotosPreviews(ad.images);
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
    } catch (error) {
      console.error('Error cargando categorías:', error);
      notify.error('Error cargando categorías');
    }
  }

  async function loadSubcategories(categoryId: string) {
    try {
      const data = await getSubcategories(categoryId);
      setSubcategories(data);
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
  // PHOTO HANDLING
  // ====================================================================
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validar tamaño (5MB por archivo)
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        notify.error(`${file.name} es muy grande (máx 5MB)`);
        return false;
      }
      return true;
    });

    // Limitar a 10 fotos total
    const remainingSlots = 10 - photos.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      notify.warning(`Solo puedes subir ${remainingSlots} fotos más (máx 10)`);
    }

    // Crear previews
    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotosPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setPhotos(prev => [...prev, ...filesToAdd]);
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotosPreviews(prev => prev.filter((_, i) => i !== index));
  }

  function removeExistingImage(index: number) {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    setPhotosPreviews(prev => prev.filter((_, i) => i !== index));
    notify.success('Imagen eliminada (se guardará al actualizar)');
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
    
    const titles = generateTitles(adData, categoryName, subcategoryName, 5);
    const descriptions = generateDescriptions(adData, categoryName, subcategoryName, 3);
    
    setSuggestedTitles(titles);
    setSuggestedDescriptions(descriptions);
    setSelectedTitleIndex(null);
    setSelectedDescIndex(null);
  }

  function selectTitle(index: number) {
    setTitle(suggestedTitles[index]);
    setSelectedTitleIndex(index);
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

    if (currentStep === 5) {
      if (!title.trim() || !description.trim()) {
        notify.error('Completa título y descripción');
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
      notify.warning('⚠️ Debes iniciar sesión para publicar');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Subir fotos nuevas usando el nuevo API (Cloudinary via BFF)
      let uploadedImages: Array<{url: string, path: string}> = [];
      if (photos.length > 0) {
        setUploadingPhotos(true);
        try {
          uploadedImages = await uploadsApi.uploadMultiple(photos, 'ads');
          console.log('📸 Imágenes subidas a Cloudinary:', uploadedImages);
        } catch (error) {
          console.error('Error subiendo imágenes:', error);
          notify.error('Error al subir imágenes');
          setUploadingPhotos(false);
          return;
        }
        setUploadingPhotos(false);
      }

      // Combinar imágenes existentes + nuevas
      const finalImages = isEditMode 
        ? [...existingImages.map(url => ({url, path: url})), ...uploadedImages]
        : uploadedImages;

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
        notify.success('✅ Aviso actualizado exitosamente!');
      } else {
        // MODO CREATE - Usar nuevo BFF API
        const createData = {
          user_id: profile.id,
          category_id: selectedCategory,
          subcategory_id: selectedSubcategory,
          title: title.trim(),
          description: description.trim(),
          price: price ? parseFloat(price) : 0,
          currency,
          location: locality || null,
          province,
          images: finalImages,
          attributes: attributeValues,
        };

        console.log('📦 Enviando a BFF API:', createData);

        const ad = await adsApi.create(createData);

        resultId = ad.id;
        notify.success('✅ Aviso publicado exitosamente!');
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

        {/* Layout: 2 columnas en desktop */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Columna formulario */}
          <div className="lg:col-span-7">
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
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                    ¿Dónde está ubicado?
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600">
                    Indicá la ubicación para que los compradores te encuentren
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Provincia */}
                  <div className="border-2 border-gray-200 rounded-xl p-5 sm:p-6 bg-white hover:border-green-400 transition-all">
                    <label className="block text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      Provincia *
                    </label>
                    <select
                      value={province}
                      onChange={(e) => {
                        setProvince(e.target.value);
                        setLocality('');
                      }}
                      className="w-full px-5 py-5 text-base sm:text-lg rounded-xl border-2 border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all bg-white"
                    >
                      <option value="">Seleccionar provincia</option>
                      {PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Localidad */}
                  <div className={`border-2 rounded-xl p-5 sm:p-6 transition-all ${
                    province 
                      ? 'border-gray-200 bg-white hover:border-green-400' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <label className="block text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
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
                  </div>
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
                    Las fotos ayudan a vender más rápido (hasta 10 fotos)
                  </p>
                </div>

                {/* Upload Area - Card style */}
                <div className="border-2 border-gray-200 rounded-xl bg-white hover:border-green-400 transition-all overflow-hidden">
                  <input
                    type="file"
                    id="photo-upload"
                    multiple
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center gap-4 py-12 px-6"
                  >
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-all">
                      <Upload className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                        Subir fotos o tomar con la cámara
                      </p>
                      <p className="text-base sm:text-lg text-gray-600">
                        JPG, PNG o WEBP hasta 5MB cada una
                      </p>
                      <p className="text-sm text-green-600 font-semibold mt-3">
                        📸 En móviles: abre la cámara directamente
                      </p>
                    </div>
                  </label>
                </div>

                {/* Photo Previews */}
                {photosPreviews.length > 0 && (
                  <div className="border-2 border-gray-200 rounded-xl p-5 sm:p-6 bg-white">
                    <p className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-green-600" />
                      {photosPreviews.length} foto{photosPreviews.length !== 1 ? 's' : ''}{' '}
                      seleccionada{photosPreviews.length !== 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {photosPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                          />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
                              Principal
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      La primera foto será la principal. Arrastra para reordenar.
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-3 p-5 sm:p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                  <Camera className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm sm:text-base text-yellow-900">
                    <p className="font-bold mb-2">Consejos para mejores fotos</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-800">
                      <li>Usa buena iluminación natural</li>
                      <li>Muestra diferentes ángulos</li>
                      <li>Incluye detalles importantes</li>
                      <li>Evita marcas de agua o logos</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: INFORMACIÓN (Título y Descripción - UX Minimalista) */}
            {currentStep === 5 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                    Título y descripción
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600">
                    Generá automáticamente o escribí manualmente
                  </p>
                </div>

                {/* TÍTULO */}
                <div className="border-2 border-gray-200 rounded-xl p-5 sm:p-6 bg-white hover:border-green-400 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      Título *
                    </label>
                  </div>
                  
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Escribí un título descriptivo"
                    maxLength={100}
                    className="w-full px-5 py-5 text-base sm:text-lg rounded-xl border-2 border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {title.length}/100 caracteres
                  </p>
                </div>

                {/* DESCRIPCIÓN */}
                <div className="border-2 border-gray-200 rounded-xl p-5 sm:p-6 bg-white hover:border-green-400 transition-all">
                  <div className="mb-4">
                    <label className="block text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      Descripción *
                    </label>
                  </div>
                  
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe las características principales del producto"
                    rows={8}
                    maxLength={2000}
                    className="w-full px-5 py-5 text-base sm:text-lg rounded-xl border-2 border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {description.length}/2000 caracteres
                  </p>
                </div>

                {/* Precio */}
                <div className="border-2 border-gray-200 rounded-xl p-5 sm:p-6 bg-white hover:border-green-400 transition-all">
                  <label className="block text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
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
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-5 py-5 text-base sm:text-lg rounded-xl border-2 border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
                      >
                        <option value="ARS">ARS $</option>
                        <option value="USD">USD $</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-5 sm:p-6 bg-purple-50 border-2 border-purple-200 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm sm:text-base text-purple-900">
                    Los textos generados destacan beneficios para atraer compradores. Las specs técnicas se muestran en la ficha completa.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 6: REVISAR */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Revisar información
                  </h2>
                  <p className="text-gray-600">
                    Verifica que todo esté correcto antes de ver el preview
                  </p>
                </div>

                {/* Resumen */}
                <div className="space-y-4">
                  {/* Categoría */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                      Categoría
                    </p>
                    <p className="text-gray-900">
                      {categories.find(c => c.id === selectedCategory)?.display_name}
                      {' > '}
                      {subcategories.find(s => s.id === selectedSubcategory)?.display_name}
                    </p>
                  </div>

                  {/* Información */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                      Información
                    </p>
                    <p className="font-semibold text-gray-900 mb-2">{title}</p>
                    <p className="text-gray-700 text-sm mb-2">{description}</p>
                    {price && (
                      <p className="font-bold text-green-600 text-lg">
                        {currency} ${parseFloat(price).toLocaleString('es-AR')}
                      </p>
                    )}
                  </div>

                  {/* Características */}
                  {Object.keys(attributeValues).length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm font-semibold text-gray-600 mb-3">
                        Características
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(attributeValues).map(([key, value]) => {
                          const attr = attributes.find(a => a.slug === key);
                          if (!attr || !value) return null;

                          let displayValue = value;
                          if (Array.isArray(value)) {
                            displayValue = value.join(', ');
                          } else if (typeof value === 'boolean') {
                            displayValue = value ? 'Sí' : 'No';
                          }

                          return (
                            <div key={key}>
                              <p className="text-xs text-gray-600">{attr.name}</p>
                              <p className="text-sm font-medium text-gray-900">
                                {displayValue}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Ubicación */}
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                      Ubicación
                    </p>
                    <p className="text-gray-900">
                      {province}
                      {locality && `, ${locality}`}
                    </p>
                  </div>

                  {/* Fotos */}
                  {photosPreviews.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm font-semibold text-gray-600 mb-3">
                        Fotos ({photosPreviews.length})
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {photosPreviews.slice(0, 4).map((preview, index) => (
                          <img
                            key={index}
                            src={preview}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                        ))}
                        {photosPreviews.length > 4 && (
                          <div className="w-full h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            <p className="text-sm font-semibold text-gray-600">
                              +{photosPreviews.length - 4}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-900">
                    <p className="font-semibold mb-1">¿Todo se ve bien?</p>
                    <p>
                      Haz clic en "PUBLICAR AVISO" para que tu aviso sea visible al público.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 sm:px-10 lg:px-12 py-6 bg-gray-50 border-t-2 border-gray-200 flex items-center justify-between gap-4">
            {/* Back */}
            {currentStep > 1 && (
              <button
                onClick={() => {
                  goBack();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-5 text-base sm:text-lg bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Atrás</span>
              </button>
            )}

            {/* Next / Submit */}
            <button
              onClick={() => {
                if (currentStep === 6) {
                  handleSubmit();
                } else {
                  goNext();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              disabled={submitting || uploadingPhotos}
              className={`flex items-center gap-2 px-10 py-5 text-base sm:text-lg rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                currentStep === 6
                  ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-200 scale-105'
                  : 'bg-green-500 text-white hover:bg-green-600 shadow-green-200'
              } ${currentStep === 1 ? 'ml-auto' : ''}`}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isEditMode ? 'Actualizando...' : 'Publicando...'}</span>
                </>
              ) : uploadingPhotos ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Subiendo fotos...</span>
                </>
              ) : currentStep === 6 ? (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-lg">
                    {isEditMode ? 'ACTUALIZAR AVISO' : 'PUBLICAR AVISO'}
                  </span>
                </>
              ) : (
                <>
                  <span>Continuar</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Columna Preview Desktop - Sticky (solo steps 2-5) */}
      {currentStep >= 2 && currentStep <= 5 && (
        <div className="hidden lg:block lg:col-span-5">
          <div className="sticky top-24">
            <LivePreviewCard
              formData={{
                title,
                description,
                price,
                currency,
                province,
                locality,
                photos: photosPreviews,
                attributes: attributeValues,
                category: categories.find(c => c.id === selectedCategory),
                subcategory: subcategories.find(s => s.id === selectedSubcategory),
              }}
            />
          </div>
        </div>
      )}
    </div>
  </div>

  {/* Botón flotante Preview Mobile (solo steps 2-5) */}
  {currentStep >= 2 && currentStep <= 5 && (
    <button
      onClick={() => setShowPreviewModal(true)}
      className="lg:hidden fixed bottom-24 right-6 z-40 bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-full shadow-2xl transition-all flex items-center gap-2 font-bold"
    >
      <Eye className="w-6 h-6" />
      <span>Preview</span>
    </button>
  )}

  {/* Modal Preview Mobile */}
  {showPreviewModal && (
    <div className="lg:hidden fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-5 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Vista Previa</h3>
          <button
            onClick={() => setShowPreviewModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <LivePreviewCard
            formData={{
              title,
              description,
              price,
              currency,
              province,
              locality,
              photos: photosPreviews,
              attributes: attributeValues,
              category: categories.find(c => c.id === selectedCategory),
              subcategory: subcategories.find(s => s.id === selectedSubcategory),
            }}
          />
        </div>
      </div>
    </div>
  )}

  {/* Modal de Autenticación */}
  <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView="login"
      />
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Box,
  Tag,
  Wrench,
  CheckCircle,
  XCircle,
  X,
  Save,
  Upload,
  Loader2,
  Image as ImageIcon,
  List
} from 'lucide-react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getCategoryTypes,
  createCategoryType,
  updateCategoryType,
  deleteCategoryType,
  getBrands,
  getBrandsBySubcategory,
  getModels,
  createModel,
  updateModel,
  deleteModel,
  createBrand,
  updateBrand,
  deleteBrand
} from '../../../services/categoriesService';
import { supabase } from '../../../services/supabaseClient';
import { uploadService } from '../../../services/uploadService';

type ViewMode = 'categories' | 'subcategories' | 'category_types' | 'brands' | 'models';

interface NavigationState {
  mode: ViewMode;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  categoryTypeId?: string;
  categoryTypeName?: string;
  brandId?: string;
  brandName?: string;
}

interface CategoryTypeFormData {
  display_name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

interface ModelFormData {
  name: string;
  display_name: string;
  is_active: boolean;
}

interface BrandFormData {
  name: string;
  display_name: string;
  is_active: boolean;
}

interface SubcategoryFormData {
  name: string;
  display_name: string;
  is_active: boolean;
  has_brands: boolean;
  has_models: boolean;
  sort_order: number;
}

export const CategoriesAdminPageV2: React.FC = () => {
  const [nav, setNav] = useState<NavigationState>({ mode: 'categories' });
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [categoryTypes, setCategoryTypes] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingCategoryType, setEditingCategoryType] = useState<any>(null);
  const [categoryTypeFormData, setCategoryTypeFormData] = useState<CategoryTypeFormData>({
    display_name: '',
    description: '',
    sort_order: 0,
    is_active: true,
  });
  const [showBulkImportTypes, setShowBulkImportTypes] = useState(false);
  const [bulkTypesText, setBulkTypesText] = useState('');
  const [bulkImportingTypes, setBulkImportingTypes] = useState(false);
  const [formData, setFormData] = useState<ModelFormData>({
    name: '',
    display_name: '',
    is_active: true
  });
  const [brandFormData, setBrandFormData] = useState<BrandFormData>({
    name: '',
    display_name: '',
    is_active: true
  });
  const [subcategoryFormData, setSubcategoryFormData] = useState<SubcategoryFormData>({
    name: '',
    display_name: '',
    is_active: true,
    has_brands: false,
    has_models: false,
    sort_order: 0
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    display_name: '',
    is_active: true,
    sort_order: 0,
    icon: ''
  });
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);

  // Bulk import states
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkModelsText, setBulkModelsText] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);

  // Load data based on current view
  useEffect(() => {
    loadData();
  }, [nav]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (nav.mode) {
        case 'categories':
          const cats = await getCategories();
          setCategories(cats);
          break;
        case 'subcategories':
          if (nav.categoryId) {
            const subs = await getSubcategories(nav.categoryId);
            setSubcategories(subs);
          }
          break;
        case 'category_types':
          if (nav.subcategoryId) {
            const types = await getCategoryTypes(nav.subcategoryId);
            setCategoryTypes(types);
          }
          break;
        case 'brands':
          if (nav.subcategoryId) {
            const brandsData = await getBrandsBySubcategory(nav.subcategoryId);
            setBrands(brandsData);
          }
          break;
        case 'models':
          if (nav.brandId) {
            const modelsData = await getModels(nav.brandId);
            setModels(modelsData);
          }
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to subcategories
  const navigateToSubcategories = (categoryId: string, categoryName: string) => {
    setNav({ mode: 'subcategories', categoryId, categoryName });
  };

  // Navigate to category_types (3er nivel)
  const navigateToCategoryTypes = (subcategoryId: string, subcategoryName: string) => {
    setNav({ ...nav, mode: 'category_types', subcategoryId, subcategoryName });
  };

  // Navigate to brands (desde subcategoría, path paralelo)
  const navigateToBrands = (subcategoryId: string, subcategoryName: string) => {
    setNav({ ...nav, mode: 'brands', subcategoryId, subcategoryName });
  };

  // Navigate to models
  const navigateToModels = (brandId: string, brandName: string) => {
    setNav({ ...nav, mode: 'models', brandId, brandName });
  };

  // Go back
  const goBack = () => {
    if (nav.mode === 'models') {
      setNav({ ...nav, mode: 'brands', brandId: undefined, brandName: undefined });
    } else if (nav.mode === 'brands') {
      setNav({ ...nav, mode: 'subcategories', subcategoryId: undefined, subcategoryName: undefined });
    } else if (nav.mode === 'category_types') {
      setNav({ ...nav, mode: 'subcategories', categoryTypeId: undefined, categoryTypeName: undefined });
    } else if (nav.mode === 'subcategories') {
      setNav({ mode: 'categories', categoryId: undefined, categoryName: undefined });
    }
  };

  // Breadcrumb
  const renderBreadcrumb = () => {
    const items = [];
    
    if (nav.categoryName) {
      items.push(nav.categoryName);
    }
    if (nav.subcategoryName) {
      items.push(nav.subcategoryName);
    }
    if (nav.categoryTypeName) {
      items.push(nav.categoryTypeName);
    }
    if (nav.brandName) {
      items.push(nav.brandName);
    }

    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <button
          onClick={() => setNav({ mode: 'categories' })}
          className="hover:text-brand-600 transition-colors"
        >
          Inicio
        </button>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="w-4 h-4" />
            <span className={index === items.length - 1 ? 'text-brand-600 font-medium' : ''}>
              {item}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Filter data by search
  const getFilteredData = () => {
    const term = searchTerm.toLowerCase();
    
    switch (nav.mode) {
      case 'categories':
        return categories.filter(c => c.display_name.toLowerCase().includes(term));
      case 'subcategories':
        return subcategories.filter(s => s.display_name.toLowerCase().includes(term));
      case 'category_types':
        return categoryTypes.filter(t => t.display_name.toLowerCase().includes(term));
      case 'brands':
        return brands.filter(b => b.display_name.toLowerCase().includes(term));
      case 'models':
        return models.filter(m => m.display_name.toLowerCase().includes(term));
      default:
        return [];
    }
  };

  const filteredData = getFilteredData();

  // CRUD Functions for Models
  const openCreateModal = () => {
    setEditingModel(null);
    setEditingBrand(null);
    setEditingSubcategory(null);
    setEditingCategory(null);
    setEditingCategoryType(null);

    if (nav.mode === 'categories') {
      setCategoryFormData({ name: '', display_name: '', is_active: true, sort_order: categories.length + 1 });
    } else if (nav.mode === 'subcategories') {
      setSubcategoryFormData({ name: '', display_name: '', is_active: true, has_brands: false, has_models: false, sort_order: 0 });
    } else if (nav.mode === 'category_types') {
      setCategoryTypeFormData({ display_name: '', description: '', sort_order: categoryTypes.length, is_active: true });
    } else if (nav.mode === 'models') {
      setFormData({ name: '', display_name: '', is_active: true });
    } else if (nav.mode === 'brands') {
      setBrandFormData({ name: '', display_name: '', is_active: true });
    }

    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    if (nav.mode === 'categories') {
      setEditingCategory(item);
      setCategoryFormData({ name: item.name, display_name: item.display_name, is_active: item.is_active, sort_order: item.sort_order || 0, icon: item.icon || '' });
    } else if (nav.mode === 'subcategories') {
      setEditingSubcategory(item);
      setSubcategoryFormData({ name: item.name, display_name: item.display_name, is_active: item.is_active, has_brands: item.has_brands || false, has_models: item.has_models || false, sort_order: item.sort_order || 0 });
    } else if (nav.mode === 'category_types') {
      setEditingCategoryType(item);
      setCategoryTypeFormData({ display_name: item.display_name, description: item.description || '', sort_order: item.sort_order || 0, is_active: item.is_active });
    } else if (nav.mode === 'models') {
      setEditingModel(item);
      setFormData({ name: item.name, display_name: item.display_name, is_active: item.is_active });
    } else if (nav.mode === 'brands') {
      setEditingBrand(item);
      setBrandFormData({ name: item.name, display_name: item.display_name, is_active: item.is_active });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingModel(null);
    setEditingBrand(null);
    setEditingSubcategory(null);
    setEditingCategory(null);
    setEditingCategoryType(null);
    setFormData({ name: '', display_name: '', is_active: true });
    setBrandFormData({ name: '', display_name: '', is_active: true });
    setCategoryTypeFormData({ display_name: '', description: '', sort_order: 0, is_active: true });
    setSubcategoryFormData({
      name: '',
      display_name: '',
      is_active: true,
      has_brands: false,
      has_models: false,
      sort_order: 0
    });
    setCategoryFormData({
      name: '',
      display_name: '',
      is_active: true,
      sort_order: 0,
      icon: ''
    });
  };

  // Handler para subir icono de categoría
  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imágenes');
      return;
    }

    // Validar tamaño (máx 500KB para iconos)
    if (file.size > 500 * 1024) {
      alert('El icono debe pesar menos de 500KB');
      return;
    }

    try {
      setUploadingIcon(true);
      const result = await uploadService.uploadImage(file, 'category-icons');
      setCategoryFormData({ ...categoryFormData, icon: result.url });
    } catch (err: any) {
      console.error('Error subiendo icono:', err);
      alert('Error subiendo icono: ' + (err.message || 'Error desconocido'));
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (nav.mode === 'categories') {
        // Generar name desde display_name
        const name = categoryFormData.display_name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_')
          .trim();

        if (editingCategory) {
          // Update existing category
          const updateData = {
            display_name: categoryFormData.display_name,
            is_active: categoryFormData.is_active,
            sort_order: categoryFormData.sort_order,
            icon: categoryFormData.icon || null,
            name
          };
          console.log('📝 Actualizando categoría:', updateData);
          await updateCategory(editingCategory.id, updateData);
          alert('✅ Categoría actualizada');
        } else {
          // Create new category - Necesita operation_type_id
          // Por defecto usamos el operation_type 'vendo' (puedes ajustarlo)
          const { data: operationTypes } = await supabase
            .from('operation_types')
            .select('id')
            .eq('name', 'vendo')
            .single();
          
          if (!operationTypes) {
            alert('Error: No se pudo encontrar el tipo de operación');
            return;
          }
          
          await createCategory({
            ...categoryFormData,
            name,
            operation_type_id: operationTypes.id
          });
          alert('✅ Categoría creada');
        }
        
        closeModal();
        loadData();
      } else if (nav.mode === 'subcategories') {
        // Generar name desde display_name
        const name = subcategoryFormData.display_name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        if (editingSubcategory) {
          // Update existing subcategory
          await updateSubcategory(editingSubcategory.id, {
            ...subcategoryFormData,
            name
          });
          alert('✅ Subcategoría actualizada');
        } else {
          // Create new subcategory
          if (!nav.categoryId) {
            alert('Error: No se pudo determinar la categoría');
            return;
          }
          
          await createSubcategory({
            ...subcategoryFormData,
            name,
            category_id: nav.categoryId
          });
          alert('✅ Subcategoría creada');
        }
        
        closeModal();
        loadData();
      } else if (nav.mode === 'category_types') {
        const slug = categoryTypeFormData.display_name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        const name = slug;

        if (editingCategoryType) {
          await updateCategoryType(editingCategoryType.id, {
            display_name: categoryTypeFormData.display_name,
            name,
            slug,
            description: categoryTypeFormData.description || undefined,
            sort_order: categoryTypeFormData.sort_order,
            is_active: categoryTypeFormData.is_active,
          });
          alert('✅ Tipo actualizado');
        } else {
          if (!nav.subcategoryId || !nav.categoryId) {
            alert('Error: Falta contexto de categoría/subcategoría');
            return;
          }
          await createCategoryType({
            category_id: nav.categoryId,
            subcategory_id: nav.subcategoryId,
            display_name: categoryTypeFormData.display_name,
            name,
            slug,
            description: categoryTypeFormData.description || undefined,
            sort_order: categoryTypeFormData.sort_order,
            is_active: categoryTypeFormData.is_active,
          });
          alert('✅ Tipo creado');
        }

        closeModal();
        loadData();
      } else if (nav.mode === 'models') {
        if (editingModel) {
          // Update existing model
          await updateModel(editingModel.id, formData);
        } else {
          // Create new model
          if (!nav.brandId) {
            alert('Error: No se pudo determinar la marca');
            return;
          }
          
          // Verificar si el modelo ya existe para esta marca
          const { data: existingModels } = await supabase
            .from('models')
            .select('id, display_name')
            .eq('display_name', formData.display_name)
            .eq('brand_id', nav.brandId)
            .limit(1);
          
          if (existingModels && existingModels.length > 0) {
            alert(`❌ El modelo "${formData.display_name}" ya existe para esta marca. Por favor, usa un nombre diferente.`);
            return;
          }
          
          await createModel({
            ...formData,
            brand_id: nav.brandId
          });
        }
      } else if (nav.mode === 'brands') {
        if (editingBrand) {
          // Update existing brand
          await updateBrand(editingBrand.id, brandFormData);
        } else {
          // Create new brand or link existing one
          if (!nav.subcategoryId) {
            alert('Error: No se pudo determinar la subcategoría');
            return;
          }
          
          // Verificar si la marca ya existe globalmente
          const { data: existingBrands } = await supabase
            .from('brands')
            .select('id, display_name')
            .eq('display_name', brandFormData.display_name)
            .limit(1);
          
          let brandId: string;
          
          if (existingBrands && existingBrands.length > 0) {
            // La marca existe, verificar si ya está vinculada a esta subcategoría
            brandId = existingBrands[0].id;
            
            const { data: existingLink } = await supabase
              .from('subcategory_brands')
              .select('id')
              .eq('subcategory_id', nav.subcategoryId)
              .eq('brand_id', brandId)
              .limit(1);
            
            if (existingLink && existingLink.length > 0) {
              alert(`❌ La marca "${brandFormData.display_name}" ya está vinculada a esta subcategoría.`);
              return;
            }
            
            // La marca existe pero no está vinculada, solo vincularla
            console.log(`✅ Vinculando marca existente "${brandFormData.display_name}" a la subcategoría`);
          } else {
            // La marca no existe, crearla
            const newBrand = await createBrand(brandFormData);
            brandId = newBrand.id;
            console.log(`✅ Marca "${brandFormData.display_name}" creada exitosamente`);
          }
          
          // Vincular la marca a la subcategoría
          await supabase
            .from('subcategory_brands')
            .insert({
              subcategory_id: nav.subcategoryId,
              brand_id: brandId
            });
        }
      }
      
      closeModal();
      loadData(); // Reload data
    } catch (error: any) {
      console.error('Error saving:', error);
      
      // Manejar error de duplicado
      if (error?.code === '23505') {
        if (error?.message?.includes('brands_display_name_unique')) {
          alert('❌ Esta marca ya existe. Por favor, usa un nombre diferente.');
        } else if (error?.message?.includes('models_display_name_unique')) {
          alert('❌ Este modelo ya existe. Por favor, usa un nombre diferente.');
        } else {
          alert('❌ Este registro ya existe en la base de datos.');
        }
      } else {
        alert('❌ Error al guardar: ' + (error?.message || 'Error desconocido'));
      }
    }
  };

  const handleDelete = async (itemId: string) => {
    const messages: Partial<Record<ViewMode, string>> = {
      subcategories: '¿Eliminar esta subcategoría? Se eliminarán también sus tipos asociados.',
      category_types: '¿Eliminar este tipo de categoría?',
      models: '¿Eliminar este modelo?',
      brands: '¿Eliminar esta marca?',
    };
    if (!confirm(messages[nav.mode] || '¿Confirmar eliminación?')) return;

    try {
      if (nav.mode === 'subcategories') {
        await deleteSubcategory(itemId);
        alert('✅ Subcategoría eliminada');
      } else if (nav.mode === 'category_types') {
        await deleteCategoryType(itemId);
        alert('✅ Tipo eliminado');
      } else if (nav.mode === 'models') {
        await deleteModel(itemId);
      } else if (nav.mode === 'brands') {
        await deleteBrand(itemId);
      }
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error al eliminar');
    }
  };

  // Bulk import models
  const handleBulkImport = async () => {
    if (!bulkModelsText.trim() || !nav.brandId) {
      alert('⚠️ Por favor, ingresa al menos un modelo.');
      return;
    }

    setBulkImporting(true);
    
    try {
      // Split by lines and clean
      const modelLines = bulkModelsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (modelLines.length === 0) {
        alert('⚠️ No se encontraron modelos válidos.');
        setBulkImporting(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const displayName of modelLines) {
        try {
          // Generate name from display_name
          const name = displayName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();

          // Check if model already exists for this brand
          const { data: existingModels } = await supabase
            .from('models')
            .select('id, display_name')
            .eq('brand_id', nav.brandId)
            .eq('display_name', displayName);

          if (existingModels && existingModels.length > 0) {
            errorCount++;
            errors.push(`"${displayName}" ya existe`);
            continue;
          }

          // Create model
          await createModel({
            name,
            display_name: displayName,
            brand_id: nav.brandId,
            is_active: true,
            sort_order: 0
          });

          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push(`"${displayName}": ${error.message}`);
        }
      }

      // Show results
      let message = `✅ Carga masiva completada:\n`;
      message += `• ${successCount} modelo${successCount !== 1 ? 's' : ''} creado${successCount !== 1 ? 's' : ''}\n`;
      if (errorCount > 0) {
        message += `• ${errorCount} error${errorCount !== 1 ? 'es' : ''}\n\n`;
        if (errors.length > 0) {
          message += `Errores:\n${errors.slice(0, 10).join('\n')}`;
          if (errors.length > 10) {
            message += `\n... y ${errors.length - 10} más`;
          }
        }
      }
      
      alert(message);
      
      // Close modal and reload
      setShowBulkImport(false);
      setBulkModelsText('');
      loadData();

    } catch (error: any) {
      console.error('Error in bulk import:', error);
      alert('❌ Error en la carga masiva: ' + error.message);
    } finally {
      setBulkImporting(false);
    }
  };

  // Bulk import para category_types
  const handleBulkImportTypes = async () => {
    if (!bulkTypesText.trim() || !nav.subcategoryId || !nav.categoryId) {
      alert('⚠️ Por favor, ingresá al menos un tipo.');
      return;
    }
    setBulkImportingTypes(true);
    try {
      const lines = bulkTypesText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      let ok = 0, fail = 0;
      const errors: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const displayName = lines[i];
        const slug = displayName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        try {
          await createCategoryType({
            category_id: nav.categoryId!,
            subcategory_id: nav.subcategoryId!,
            display_name: displayName,
            name: slug,
            slug,
            sort_order: i,
            is_active: true,
          });
          ok++;
        } catch (err: any) {
          fail++;
          errors.push(`"${displayName}": ${err.message}`);
        }
      }

      let msg = `✅ Carga completada: ${ok} tipo${ok !== 1 ? 's' : ''} creado${ok !== 1 ? 's' : ''}`;
      if (fail > 0) msg += `\n❌ ${fail} error${fail !== 1 ? 'es' : ''}: ${errors.slice(0, 5).join(', ')}`;
      alert(msg);
      setShowBulkImportTypes(false);
      setBulkTypesText('');
      loadData();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    } finally {
      setBulkImportingTypes(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Categorías</h1>
          
          <div className="flex gap-3">
            {(nav.mode === 'models' || nav.mode === 'category_types') && (
              <button
                onClick={() => nav.mode === 'category_types' ? setShowBulkImportTypes(true) : setShowBulkImport(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                title="Carga masiva"
              >
                <Save className="w-5 h-5" />
                Carga Masiva
              </button>
            )}
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              {nav.mode === 'categories' && 'Nueva Categoría'}
              {nav.mode === 'subcategories' && 'Nueva Subcategoría'}
              {nav.mode === 'category_types' && 'Nuevo Tipo'}
              {nav.mode === 'brands' && 'Nueva Marca'}
              {nav.mode === 'models' && 'Nuevo Modelo'}
            </button>
          </div>
        </div>
        <p className="text-gray-600">
          Administra la estructura jerárquica de categorías, subcategorías, marcas y modelos
        </p>
      </div>

      {/* Navigation breadcrumb */}
      {nav.mode !== 'categories' && (
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-brand-600 hover:text-brand-700 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          {renderBreadcrumb()}
        </div>
      )}

      {/* Content - MODELOS EN FORMATO TABLA */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando...</p>
        </div>
      ) : nav.mode === 'models' ? (
        /* VISTA TABLA PARA MODELOS */
        <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Modelo</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase">Orden</th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Wrench className="w-5 h-5 text-brand-600" />
                        <div>
                          <p className="font-medium text-gray-900">{item.display_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                        item.is_active 
                          ? 'bg-brand-100 text-brand-600' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactivo
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {item.sort_order || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(item);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar modelo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar modelo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA COMPACTA TIPO EXCEL */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Header de tabla */}
          <div className="grid grid-cols-12 gap-4 bg-gray-50 border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">
            <div className="col-span-1 flex items-center">
              {nav.mode === 'categories' && <Box className="w-4 h-4 text-gray-500" />}
              {nav.mode === 'subcategories' && <Tag className="w-4 h-4 text-gray-500" />}
              {nav.mode === 'category_types' && <List className="w-4 h-4 text-gray-500" />}
              {nav.mode === 'brands' && <Tag className="w-4 h-4 text-gray-500" />}
            </div>
            <div className="col-span-5">Nombre</div>
            <div className="col-span-2 text-center">Orden</div>
            <div className="col-span-2 text-center">Estado</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          {/* Filas de datos */}
          <div className="divide-y divide-gray-100">
            {filteredData.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group items-center"
                onClick={() => {
                  if (nav.mode === 'categories') {
                    navigateToSubcategories(item.id, item.display_name);
                  } else if (nav.mode === 'subcategories') {
                    navigateToCategoryTypes(item.id, item.display_name);
                  } else if (nav.mode === 'category_types') {
                    // leaf node — no further navigation
                  } else if (nav.mode === 'brands') {
                    navigateToModels(item.id, item.display_name);
                  }
                }}
              >
                {/* Icono */}
                <div className="col-span-1 flex items-center">
                  <div className="w-8 h-8 bg-brand-600/10 rounded flex items-center justify-center">
                    {nav.mode === 'categories' && <Box className="w-4 h-4 text-brand-600" />}
                    {nav.mode === 'subcategories' && <Tag className="w-4 h-4 text-brand-600" />}
                    {nav.mode === 'category_types' && <List className="w-4 h-4 text-brand-600" />}
                    {nav.mode === 'brands' && <Tag className="w-4 h-4 text-brand-600" />}
                  </div>
                </div>

                {/* Nombre */}
                <div className="col-span-5">
                  <div className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                    {item.display_name}
                  </div>
                </div>

                {/* Orden */}
                <div className="col-span-2 text-center">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {item.sort_order || '—'}
                  </span>
                </div>

                {/* Estado */}
                <div className="col-span-2 text-center">
                  {item.is_active ? (
                    <span className="px-2 py-1 bg-brand-100 text-brand-600 text-xs font-medium rounded">
                      ✓ Activo
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded">
                      ✕ Inactivo
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div className="col-span-2 flex justify-end gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(item);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {nav.mode === 'subcategories' && item.has_brands && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigateToBrands(item.id, item.display_name); }}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors text-xs font-medium"
                      title="Ver marcas"
                    >
                      Marcas
                    </button>
                  )}
                  {nav.mode !== 'category_types' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (nav.mode === 'categories') navigateToSubcategories(item.id, item.display_name);
                        else if (nav.mode === 'subcategories') navigateToCategoryTypes(item.id, item.display_name);
                        else if (nav.mode === 'brands') navigateToModels(item.id, item.display_name);
                      }}
                      className="p-2 text-brand-600 hover:bg-brand-600/10 rounded transition-colors"
                      title="Ver contenido"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredData.length === 0 && !loading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Box className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">
            {searchTerm ? 'No se encontraron resultados' : 'No hay elementos'}
          </p>
          <p className="text-gray-500 text-sm">
            {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza agregando elementos'}
          </p>
        </div>
      )}

      {/* MODAL PARA CREAR/EDITAR MODELO O MARCA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {nav.mode === 'categories'
                  ? (editingCategory ? 'Editar Categoría' : 'Nueva Categoría')
                  : nav.mode === 'subcategories'
                    ? (editingSubcategory ? 'Editar Subcategoría' : 'Nueva Subcategoría')
                    : nav.mode === 'category_types'
                      ? (editingCategoryType ? 'Editar Tipo' : 'Nuevo Tipo')
                      : nav.mode === 'models'
                        ? (editingModel ? 'Editar Modelo' : 'Nuevo Modelo')
                        : (editingBrand ? 'Editar Marca' : 'Nueva Marca')
                }
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre visible *
                </label>
                <input
                  type="text"
                  value={
                    nav.mode === 'categories' ? categoryFormData.display_name :
                    nav.mode === 'subcategories' ? subcategoryFormData.display_name :
                    nav.mode === 'category_types' ? categoryTypeFormData.display_name :
                    nav.mode === 'models' ? formData.display_name :
                    brandFormData.display_name
                  }
                  onChange={(e) => {
                    if (nav.mode === 'categories') {
                      setCategoryFormData({ ...categoryFormData, display_name: e.target.value });
                    } else if (nav.mode === 'subcategories') {
                      setSubcategoryFormData({ ...subcategoryFormData, display_name: e.target.value });
                    } else if (nav.mode === 'category_types') {
                      setCategoryTypeFormData({ ...categoryTypeFormData, display_name: e.target.value });
                    } else if (nav.mode === 'models') {
                      setFormData({ ...formData, display_name: e.target.value });
                    } else {
                      setBrandFormData({ ...brandFormData, display_name: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-600 focus:outline-none transition-colors"
                  placeholder={
                    nav.mode === 'categories' ? "ej: Ganadería" :
                    nav.mode === 'subcategories' ? "ej: Hacienda" :
                    nav.mode === 'category_types' ? "ej: Toros" :
                    nav.mode === 'models' ? "ej: TX Mega II" :
                    "ej: John Deere"
                  }
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Tal como se mostrará en la interfaz</p>
              </div>

              {/* Campos específicos para Categorías */}
              {nav.mode === 'categories' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orden de visualización
                  </label>
                  <input
                    type="number"
                    value={categoryFormData.sort_order}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-600 focus:outline-none transition-colors"
                    placeholder="1"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Número menor aparece primero</p>
                </div>
              )}

              {/* Icono de Categoría - Upload PNG */}
              {nav.mode === 'categories' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icono de categoría
                  </label>
                  <div className="flex items-center gap-4">
                    {/* Preview del icono */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                      {categoryFormData.icon ? (
                        <img 
                          src={categoryFormData.icon.startsWith('http') 
                            ? categoryFormData.icon 
                            : `/images/icons/${categoryFormData.icon}`
                          } 
                          alt="Icono" 
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Botón upload */}
                    <div className="flex-1">
                      <input
                        ref={iconInputRef}
                        type="file"
                        accept="image/png,image/svg+xml,image/webp"
                        onChange={handleIconUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => iconInputRef.current?.click()}
                        disabled={uploadingIcon}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {uploadingIcon ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            {categoryFormData.icon ? 'Cambiar icono' : 'Subir icono'}
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-500 mt-1">PNG, SVG o WebP. Máx 500KB. Recomendado: 48x48px</p>
                    </div>

                    {/* Botón eliminar */}
                    {categoryFormData.icon && (
                      <button
                        type="button"
                        onClick={() => setCategoryFormData({ ...categoryFormData, icon: '' })}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar icono"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Campos específicos para Subcategorías */}
              {nav.mode === 'subcategories' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orden de visualización
                    </label>
                    <input
                      type="number"
                      value={subcategoryFormData.sort_order}
                      onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-600 focus:outline-none transition-colors"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Número menor aparece primero</p>
                  </div>

                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="has_brands"
                        checked={subcategoryFormData.has_brands}
                        onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, has_brands: e.target.checked })}
                        className="w-5 h-5 text-brand-600 rounded focus:ring-brand-600"
                      />
                      <label htmlFor="has_brands" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Permite seleccionar marcas
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="has_models"
                        checked={subcategoryFormData.has_models}
                        onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, has_models: e.target.checked })}
                        className="w-5 h-5 text-brand-600 rounded focus:ring-brand-600"
                      />
                      <label htmlFor="has_models" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Permite seleccionar modelos
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Campos específicos para Tipos de Categoría */}
              {nav.mode === 'category_types' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción (opcional)
                    </label>
                    <input
                      type="text"
                      value={categoryTypeFormData.description}
                      onChange={(e) => setCategoryTypeFormData({ ...categoryTypeFormData, description: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-600 focus:outline-none transition-colors"
                      placeholder="ej: Bovinos machos para reproducción"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orden de visualización
                    </label>
                    <input
                      type="number"
                      value={categoryTypeFormData.sort_order}
                      onChange={(e) => setCategoryTypeFormData({ ...categoryTypeFormData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-600 focus:outline-none transition-colors"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Número menor aparece primero</p>
                  </div>
                </>
              )}

              {/* Is Active */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={
                    nav.mode === 'subcategories' ? subcategoryFormData.is_active :
                    nav.mode === 'category_types' ? categoryTypeFormData.is_active :
                    nav.mode === 'models' ? formData.is_active :
                    brandFormData.is_active
                  }
                  onChange={(e) => {
                    if (nav.mode === 'subcategories') {
                      setSubcategoryFormData({ ...subcategoryFormData, is_active: e.target.checked });
                    } else if (nav.mode === 'category_types') {
                      setCategoryTypeFormData({ ...categoryTypeFormData, is_active: e.target.checked });
                    } else if (nav.mode === 'models') {
                      setFormData({ ...formData, is_active: e.target.checked });
                    } else {
                      setBrandFormData({ ...brandFormData, is_active: e.target.checked });
                    }
                  }}
                  className="w-5 h-5 text-brand-600 rounded focus:ring-brand-600"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                  {nav.mode === 'subcategories' ? 'Subcategoría activa' :
                   nav.mode === 'category_types' ? 'Tipo activo' :
                   nav.mode === 'models' ? 'Modelo activo' :
                   'Marca activa'}
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {nav.mode === 'subcategories'
                    ? (editingSubcategory ? 'Guardar cambios' : 'Crear subcategoría')
                    : nav.mode === 'models'
                      ? (editingModel ? 'Guardar cambios' : 'Crear modelo')
                      : (editingBrand ? 'Guardar cambios' : 'Crear marca')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA CARGA MASIVA DE MODELOS */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Carga Masiva de Modelos</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Para: <span className="font-semibold text-brand-600">{nav.brandName}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBulkImport(false);
                  setBulkModelsText('');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={bulkImporting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* Instructions */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Instrucciones:</h3>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Pega la lista de modelos en el campo de texto</li>
                  <li>Cada modelo debe estar en una línea separada</li>
                  <li>Se creará automáticamente el nombre interno (ID) a partir del nombre visible</li>
                  <li>Los modelos duplicados serán ignorados</li>
                </ul>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lista de Modelos (uno por línea)
                </label>
                <textarea
                  value={bulkModelsText}
                  onChange={(e) => setBulkModelsText(e.target.value)}
                  placeholder="TX Mega II&#10;Agrotanque 3000&#10;Serie 4000&#10;Modelo X Plus&#10;..."
                  className="w-full h-64 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors font-mono text-sm"
                  disabled={bulkImporting}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {bulkModelsText.split('\n').filter(line => line.trim()).length} modelo(s) detectado(s)
                </p>
              </div>

              {/* Example */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Ejemplo:</p>
                <pre className="text-xs text-gray-600 font-mono">
TX Mega II{'\n'}Agrotanque 3000{'\n'}Serie 4000{'\n'}Modelo X Plus
                </pre>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkImport(false);
                    setBulkModelsText('');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={bulkImporting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={bulkImporting || !bulkModelsText.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {bulkImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Importar Modelos
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CARGA MASIVA TIPOS */}
      {showBulkImportTypes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Carga Masiva de Tipos</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {nav.subcategoryName} — uno por línea
                </p>
              </div>
              <button onClick={() => { setShowBulkImportTypes(false); setBulkTypesText(''); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={bulkTypesText}
                onChange={(e) => setBulkTypesText(e.target.value)}
                placeholder={"Toros\nVacas\nNovillos\nVaquillonas\nTerneros"}
                className="w-full h-56 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-sm"
                disabled={bulkImportingTypes}
              />
              <p className="text-xs text-gray-500">
                {bulkTypesText.split('\n').filter(l => l.trim()).length} tipo(s) detectado(s)
              </p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowBulkImportTypes(false); setBulkTypesText(''); }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  disabled={bulkImportingTypes}>
                  Cancelar
                </button>
                <button type="button" onClick={handleBulkImportTypes}
                  disabled={bulkImportingTypes || !bulkTypesText.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed">
                  {bulkImportingTypes ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Importando...</>
                  ) : (
                    <><Save className="w-4 h-4" />Importar Tipos</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

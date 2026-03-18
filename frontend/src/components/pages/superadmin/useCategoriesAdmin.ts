import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
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
  getBrandsBySubcategory,
  getModels,
  createModel,
  updateModel,
  deleteModel,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../../../services/categoriesService';
import type {
  NavigationState,
  ViewMode,
  CategoryFormData,
  SubcategoryFormData,
  CategoryTypeFormData,
  ModelFormData,
  BrandFormData,
} from './CategoriesAdminV2.types';

interface FormStates {
  categoryFormData: CategoryFormData;
  subcategoryFormData: SubcategoryFormData;
  categoryTypeFormData: CategoryTypeFormData;
  formData: ModelFormData;
  brandFormData: BrandFormData;
  editingCategory: any | null;
  editingSubcategory: any | null;
  editingCategoryType: any | null;
  editingModel: any | null;
  editingBrand: any | null;
}

export function useCategoriesAdmin(nav: NavigationState) {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [categoryTypes, setCategoryTypes] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [nav]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (nav.mode) {
        case 'categories':
          setCategories((await getCategories()) as any[]);
          break;
        case 'subcategories':
          if (nav.categoryId) setSubcategories((await getSubcategories(nav.categoryId)) as any[]);
          break;
        case 'category_types':
          if (nav.subcategoryId) setCategoryTypes((await getCategoryTypes(nav.subcategoryId)) as any[]);
          break;
        case 'brands':
          if (nav.subcategoryId) setBrands((await getBrandsBySubcategory(nav.subcategoryId)) as any[]);
          break;
        case 'models':
          if (nav.brandId) setModels((await getModels(nav.brandId)) as any[]);
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = (searchTerm: string) => {
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

  const handleSubmit = (formStates: FormStates, closeModal: () => void) => async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      categoryFormData,
      subcategoryFormData,
      categoryTypeFormData,
      formData,
      brandFormData,
      editingCategory,
      editingSubcategory,
      editingCategoryType,
      editingModel,
      editingBrand,
    } = formStates;

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
            name,
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
            operation_type_id: operationTypes.id,
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
            name,
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
            category_id: nav.categoryId,
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
            brand_id: nav.brandId,
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
              brand_id: brandId,
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

  const handleBulkImport = async (bulkModelsText: string, onSuccess: () => void) => {
    if (!bulkModelsText.trim() || !nav.brandId) {
      alert('⚠️ Por favor, ingresa al menos un modelo.');
      return;
    }

    try {
      // Split by lines and clean
      const modelLines = bulkModelsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (modelLines.length === 0) {
        alert('⚠️ No se encontraron modelos válidos.');
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
            sort_order: 0,
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
      onSuccess();
      loadData();
    } catch (error: any) {
      console.error('Error in bulk import:', error);
      alert('❌ Error en la carga masiva: ' + error.message);
    }
  };

  const handleBulkImportTypes = async (bulkTypesText: string, onSuccess: () => void) => {
    if (!bulkTypesText.trim() || !nav.subcategoryId || !nav.categoryId) {
      alert('⚠️ Por favor, ingresá al menos un tipo.');
      return;
    }
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
      onSuccess();
      loadData();
    } catch (err: any) {
      alert('❌ Error: ' + err.message);
    }
  };

  return {
    categories,
    subcategories,
    categoryTypes,
    brands,
    models,
    loading,
    loadData,
    getFilteredData,
    handleDelete,
    handleSubmit,
    handleBulkImport,
    handleBulkImportTypes,
  };
}

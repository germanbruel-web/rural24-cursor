/**
 * Selector de Categorías Optimizado
 * Ejemplo de uso de todas las optimizaciones juntas
 */

import React, { useState, useEffect } from 'react';
import { useCategories } from '../contexts/CategoryContext';
import { useCategoryPrefetch } from '../hooks/useCategoryPrefetch';
import { getCategoryBundle } from '../services/categoriesBatchService';

interface CategorySelectorProps {
  onSelect: (data: {
    categoryId?: string;
    subcategoryId?: string;
    brandId?: string;
    modelId?: string;
  }) => void;
}

export const CategorySelectorOptimized: React.FC<CategorySelectorProps> = ({ onSelect }) => {
  const {
    categories,
    loadSubcategories,
    loadBrands,
    loadModels,
  } = useCategories();

  // Pre-fetch inteligente en background
  const { isPreloading, progress } = useCategoryPrefetch();

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  const [loadingState, setLoadingState] = useState('');

  // Cuando selecciona categoría
  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory('');
    setSelectedBrand('');
    setSelectedModel('');
    
    if (!categoryId) {
      setSubcategories([]);
      setBrands([]);
      setModels([]);
      return;
    }

    setLoadingState('Cargando subcategorías...');
    
    try {
      // Opción 1: Carga incremental (usa caché)
      const subs = await loadSubcategories(categoryId);
      setSubcategories(subs);

      // Opción 2: Batch query (trae todo de una vez)
      // const bundle = await getCategoryBundle(categoryId);
      // setSubcategories(bundle.subcategories);
      
    } catch (error) {
      console.error('Error cargando subcategorías:', error);
    } finally {
      setLoadingState('');
    }

    onSelect({ categoryId });
  };

  // Cuando selecciona subcategoría
  const handleSubcategoryChange = async (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
    setSelectedBrand('');
    setSelectedModel('');
    
    if (!subcategoryId) {
      setBrands([]);
      setModels([]);
      return;
    }

    setLoadingState('Cargando marcas...');
    
    try {
      const brandsData = await loadBrands(subcategoryId);
      setBrands(brandsData);
    } catch (error) {
      console.error('Error cargando marcas:', error);
    } finally {
      setLoadingState('');
    }

    onSelect({
      categoryId: selectedCategory,
      subcategoryId,
    });
  };

  // Cuando selecciona marca
  const handleBrandChange = async (brandId: string) => {
    setSelectedBrand(brandId);
    setSelectedModel('');
    
    if (!brandId) {
      setModels([]);
      return;
    }

    setLoadingState('Cargando modelos...');
    
    try {
      const modelsData = await loadModels(brandId);
      setModels(modelsData);
    } catch (error) {
      console.error('Error cargando modelos:', error);
    } finally {
      setLoadingState('');
    }

    onSelect({
      categoryId: selectedCategory,
      subcategoryId: selectedSubcategory,
      brandId,
    });
  };

  // Cuando selecciona modelo
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    
    onSelect({
      categoryId: selectedCategory,
      subcategoryId: selectedSubcategory,
      brandId: selectedBrand,
      modelId,
    });
  };

  return (
    <div className="space-y-4">
      {/* Indicador de pre-fetch */}
      {isPreloading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            <span className="text-blue-700">
              Pre-cargando datos... {progress}%
            </span>
          </div>
        </div>
      )}

      {/* Estado de carga */}
      {loadingState && (
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent" />
          {loadingState}
        </div>
      )}

      {/* Selector de Categoría */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoría
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">Seleccionar categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Subcategoría */}
      {subcategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcategoría
          </label>
          <select
            value={selectedSubcategory}
            onChange={(e) => handleSubcategoryChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Seleccionar subcategoría</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.display_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selector de Marca */}
      {brands.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marca
          </label>
          <select
            value={selectedBrand}
            onChange={(e) => handleBrandChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Seleccionar marca</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.display_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selector de Modelo */}
      {models.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modelo
          </label>
          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Seleccionar modelo</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.display_name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

import { useState, useEffect } from 'react';
import {
  getCategories,
  getSubcategories,
  getBrandsBySubcategory,
  getModelsByBrand,
} from '../../services/catalogService';
import type {
  Category,
  Subcategory,
  Brand,
  Model,
  CatalogFormSelection,
} from '../../types/catalog';

interface CatalogSelectorProps {
  value: CatalogFormSelection;
  onChange: (selection: CatalogFormSelection) => void;
  className?: string;
}

export default function CatalogSelector({
  value,
  onChange,
  className = '',
}: CatalogSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);

  const [loading, setLoading] = useState({
    categories: false,
    subcategories: false,
    brands: false,
    models: false,
  });

  // Cargar categorías al montar
  useEffect(() => {
    loadCategories();
  }, []);

  // Cargar subcategorías cuando cambia la categoría
  useEffect(() => {
    if (value.category?.id) {
      loadSubcategories(value.category.id);
    } else {
      setSubcategories([]);
      setBrands([]);
      setModels([]);
    }
  }, [value.category?.id]);

  // Cargar marcas cuando cambia la subcategoría
  useEffect(() => {
    if (value.subcategory?.id && value.subcategory.has_brands) {
      loadBrands(value.subcategory.id);
    } else {
      setBrands([]);
      setModels([]);
    }
  }, [value.subcategory?.id]);

  // Cargar modelos cuando cambia la marca
  useEffect(() => {
    if (value.brand?.id && value.subcategory?.has_models) {
      loadModels(value.brand.id);
    } else {
      setModels([]);
    }
  }, [value.brand?.id]);

  const loadCategories = async () => {
    setLoading((prev) => ({ ...prev, categories: true }));
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading((prev) => ({ ...prev, categories: false }));
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    setLoading((prev) => ({ ...prev, subcategories: true }));
    try {
      const data = await getSubcategories(categoryId);
      setSubcategories(data);
    } catch (error) {
      console.error('Error loading subcategories:', error);
    } finally {
      setLoading((prev) => ({ ...prev, subcategories: false }));
    }
  };

  const loadBrands = async (subcategoryId: string) => {
    setLoading((prev) => ({ ...prev, brands: true }));
    try {
      const data = await getBrandsBySubcategory(subcategoryId);
      setBrands(data);
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setLoading((prev) => ({ ...prev, brands: false }));
    }
  };

  const loadModels = async (brandId: string) => {
    setLoading((prev) => ({ ...prev, models: true }));
    try {
      const data = await getModelsByBrand(brandId);
      setModels(data);
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoading((prev) => ({ ...prev, models: false }));
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    onChange({
      category,
      subcategory: undefined,
      brand: undefined,
      model: undefined,
    });
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    const subcategory = subcategories.find((s) => s.id === subcategoryId);
    onChange({
      ...value,
      subcategory,
      brand: undefined,
      model: undefined,
    });
  };

  const handleBrandChange = (brandId: string) => {
    const brand = brands.find((b) => b.id === brandId);
    onChange({
      ...value,
      brand,
      model: undefined,
    });
  };

  const handleModelChange = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    onChange({
      ...value,
      model,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoría *
        </label>
        <select
          value={value.category?.id || ''}
          onChange={(e) => handleCategoryChange(e.target.value)}
          disabled={loading.categories}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          required
        >
          <option value="">Seleccione una categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategoría */}
      {value.category && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcategoría *
          </label>
          <select
            value={value.subcategory?.id || ''}
            onChange={(e) => handleSubcategoryChange(e.target.value)}
            disabled={loading.subcategories || subcategories.length === 0}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">
              {loading.subcategories
                ? 'Cargando...'
                : subcategories.length === 0
                ? 'No hay subcategorías disponibles'
                : 'Seleccione una subcategoría'}
            </option>
            {subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.display_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Marca (solo si la subcategoría tiene marcas) */}
      {value.subcategory?.has_brands && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marca {value.subcategory.has_models ? '*' : '(Opcional)'}
          </label>
          <select
            value={value.brand?.id || ''}
            onChange={(e) => handleBrandChange(e.target.value)}
            disabled={loading.brands || brands.length === 0}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            required={value.subcategory.has_models}
          >
            <option value="">
              {loading.brands
                ? 'Cargando...'
                : brands.length === 0
                ? 'No hay marcas disponibles'
                : 'Seleccione una marca'}
            </option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.display_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Modelo (solo si la subcategoría tiene modelos y se seleccionó marca) */}
      {value.subcategory?.has_models && value.brand && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modelo *
          </label>
          <select
            value={value.model?.id || ''}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={loading.models || models.length === 0}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">
              {loading.models
                ? 'Cargando...'
                : models.length === 0
                ? 'No hay modelos disponibles'
                : 'Seleccione un modelo'}
            </option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.display_name}
                {model.year_from && model.year_to
                  ? ` (${model.year_from}-${model.year_to})`
                  : ''}
              </option>
            ))}
          </select>
          
          {/* Mostrar info del modelo seleccionado */}
          {value.model && (
            <div className="mt-3 p-3 bg-brand-50 border border-brand-200 rounded-lg">
              <h4 className="text-sm font-semibold text-brand-800 mb-2">
                Especificaciones principales:
              </h4>
              <div className="text-sm text-brand-700 space-y-1">
                {value.model.specifications?.motor?.potencia_hp_nominal && (
                  <p>• Potencia: {value.model.specifications.motor.potencia_hp_nominal} HP</p>
                )}
                {value.model.specifications?.motor?.cilindros && (
                  <p>• Motor: {value.model.specifications.motor.cilindros} cilindros</p>
                )}
                {value.model.specifications?.transmision?.velocidades_adelante && (
                  <p>
                    • Transmisión: {value.model.specifications.transmision.velocidades_adelante}{' '}
                    marchas
                  </p>
                )}
                {value.model.specifications?.hidraulica?.elevacion_posterior_kg && (
                  <p>
                    • Elevación: {value.model.specifications.hidraulica.elevacion_posterior_kg} kg
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Año (solo si la subcategoría requiere año) */}
      {value.subcategory?.has_year && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Año *
          </label>
          <input
            type="number"
            min="1950"
            max={new Date().getFullYear() + 1}
            placeholder="Ej: 2020"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            required
          />
        </div>
      )}

      {/* Condición (solo si la subcategoría requiere condición) */}
      {value.subcategory?.has_condition && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condición *
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            required
          >
            <option value="">Seleccione la condición</option>
            <option value="nuevo">Nuevo</option>
            <option value="usado">Usado</option>
            <option value="reacondicionado">Reacondicionado</option>
          </select>
        </div>
      )}
    </div>
  );
}

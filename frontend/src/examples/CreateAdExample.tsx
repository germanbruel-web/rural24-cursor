/**
 * Ejemplo de uso de los nuevos servicios API
 * Muestra cómo usar los hooks en componentes React
 */

import React, { useState } from 'react';
import {
  useCategories,
  useBrands,
  useModels,
  useFormConfig,
  useCreateAd,
  useImageUpload,
} from '@/hooks';

export function CreateAdExample() {
  // 1. Obtener categorías
  const { categories, loading: loadingCategories } = useCategories();

  // 2. Estados del formulario
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');

  // 3. Obtener datos dependientes
  const { brands, loading: loadingBrands } = useBrands(selectedSubcategory);
  const { models, loading: loadingModels } = useModels(selectedBrand);
  const { formConfig, loading: loadingForm } = useFormConfig(selectedSubcategory);

  // 4. Upload de imágenes
  const { uploadMultiple, uploading } = useImageUpload('ads');

  // 5. Crear anuncio
  const { createAd, loading: creating, error, fieldErrors } = useCreateAd();

  // 6. Handler del formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const files = formData.getAll('images') as File[];

    // Subir imágenes primero
    const uploadedImages = await uploadMultiple(files);

    if (uploadedImages.length === 0) {
      alert('Debe subir al menos una imagen');
      return;
    }

    // Crear anuncio
    const ad = await createAd({
      user_id: 'current-user-id', // Obtener del auth
      category_id: selectedCategory,
      subcategory_id: selectedSubcategory,
      brand_id: selectedBrand || undefined,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      price: Number(formData.get('price')),
      currency: 'USD',
      province: formData.get('province') as string,
      attributes: {
        // Construir dinámicamente desde formConfig
        marca: formData.get('marca'),
        modelo: formData.get('modelo'),
        anio: formData.get('anio'),
        // ... resto de campos dinámicos
      },
      images: uploadedImages,
      status: 'active',
    });

    if (ad) {
      alert(`Anuncio creado exitosamente: ${ad.slug}`);
      // Redirigir a /ads/${ad.slug}
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Categoría */}
      <select
        name="category"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="">Seleccione categoría</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.display_name}
          </option>
        ))}
      </select>

      {/* Subcategoría */}
      {selectedCategory && (
        <select
          name="subcategory"
          value={selectedSubcategory}
          onChange={(e) => setSelectedSubcategory(e.target.value)}
        >
          <option value="">Seleccione subcategoría</option>
          {categories
            .find((c) => c.id === selectedCategory)
            ?.subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.display_name}
              </option>
            ))}
        </select>
      )}

      {/* Marcas (solo si requires_brand) */}
      {formConfig?.brands && brands.length > 0 && (
        <select
          name="brand"
          value={selectedBrand}
          onChange={(e) => setSelectedBrand(e.target.value)}
        >
          <option value="">Seleccione marca</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      )}

      {/* Modelos (solo si requires_model) */}
      {selectedBrand && models.length > 0 && (
        <select name="model">
          <option value="">Seleccione modelo</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      )}

      {/* Campos dinámicos por grupo */}
      {formConfig &&
        Object.entries(formConfig.attributes).map(([group, fields]) => (
          <div key={group}>
            <h3>{group}</h3>
            {fields.map((field) => (
              <div key={field.id}>
                <label>
                  {field.field_label}
                  {field.is_required && ' *'}
                </label>

                {field.field_type === 'select' && (
                  <select name={field.field_name} required={field.is_required}>
                    <option value="">Seleccione...</option>
                    {field.field_options.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {field.field_type === 'number' && (
                  <input
                    type="number"
                    name={field.field_name}
                    placeholder={field.placeholder || ''}
                    min={field.min_value || undefined}
                    max={field.max_value || undefined}
                    required={field.is_required}
                  />
                )}

                {field.field_type === 'text' && (
                  <input
                    type="text"
                    name={field.field_name}
                    placeholder={field.placeholder || ''}
                    required={field.is_required}
                  />
                )}

                {fieldErrors[field.field_name] && (
                  <span style={{ color: 'red' }}>
                    {fieldErrors[field.field_name]}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}

      {/* Imágenes */}
      <input type="file" name="images" multiple accept="image/*" required />

      {/* Submit */}
      <button type="submit" disabled={creating || uploading || loadingForm}>
        {uploading
          ? 'Subiendo imágenes...'
          : creating
          ? 'Creando anuncio...'
          : 'Publicar anuncio'}
      </button>

      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  );
}

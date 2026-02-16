// ============================================================================
// FORM RENDERER V2
// ============================================================================
// Motor que renderiza formularios dinámicos desde form_templates_v2
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import type {
  CompleteFormV2,
  FormFieldV2,
  FormSection,
  BrandV2,
  ModelV2,
  FeatureV2,
} from '../../types/v2';
import {
  groupFieldsBySection,
  getFieldWidthClass,
  validateFormData,
  getFeaturesByCategory,
} from '../../services/v2/formsService';
import { searchBrands } from '../../services/v2/brandsService';
import { searchModels } from '../../services/v2/modelsService';
import { getLocalidadesByProvincia } from '../../constants/localidades';

// ============================================================================
// TYPES
// ============================================================================

interface FormRendererProps {
  form: CompleteFormV2;
  categoryId?: string;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  initialData?: Record<string, any>;
  submitLabel?: string;
  isLoading?: boolean;
}

interface FieldComponentProps {
  field: FormFieldV2;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  categoryId?: string;
  formData: Record<string, any>;
}

// ============================================================================
// FORM RENDERER COMPONENT
// ============================================================================

// Context para compartir formData con el preview
export const FormDataContext = React.createContext<{
  formData: Record<string, any>;
  form: CompleteFormV2 | null;
}>({ formData: {}, form: null });

export const FormRenderer: React.FC<FormRendererProps> = ({
  form,
  categoryId,
  onSubmit,
  initialData = {},
  submitLabel = 'Enviar',
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [features, setFeatures] = useState<FeatureV2[]>([]);
  const [isGenerating, setIsGenerating] = useState<{ [key: string]: boolean }>({});

  // Cargar features si la categoría está disponible
  useEffect(() => {
    if (categoryId) {
      loadFeatures();
    }
  }, [categoryId]);

  const loadFeatures = async () => {
    if (!categoryId) return;
    try {
      const featuresData = await getFeaturesByCategory(categoryId);
      setFeatures(featuresData);
    } catch (error) {
      console.error('Error loading features:', error);
    }
  };

  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Limpiar error del campo si existe
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [errors]);

  // Autogenerar título (para CARDS - corto y atractivo)
  const generateTitle = useCallback(() => {
    setIsGenerating((prev) => ({ ...prev, title: true }));
    
    // Extraer datos relevantes
    const brand = formData.brand_name || formData.brand || '';
    const model = formData.model_name || formData.model || '';
    const year = formData.year || '';
    const condition = formData.condition || '';
    
    // Construir título corto para CARD (máximo ~60 caracteres)
    let title = '';
    
    if (brand && model) {
      title = `${brand} ${model}`;
      if (year) title += ` ${year}`;
      
      // Agregar condición como highlight final
      if (condition === 'nuevo') {
        title += ' ¡NUEVO!';
      } else if (condition === 'usado_excelente') {
        title += ' - Impecable';
      }
    } else {
      title = 'Complete marca y modelo para generar título';
    }
    
    handleFieldChange('title', title);
    setTimeout(() => setIsGenerating((prev) => ({ ...prev, title: false })), 500);
  }, [formData, handleFieldChange]);

  // Autogenerar descripción (para CARDS - resumen breve y atractivo)
  const generateDescription = useCallback(() => {
    setIsGenerating((prev) => ({ ...prev, description: true }));
    
    const brand = formData.brand_name || formData.brand || '';
    const model = formData.model_name || formData.model || '';
    const year = formData.year || '';
    const hours = formData.hours || '';
    const hp = formData.hp || '';
    const condition = formData.condition || '';
    const city = formData.city || '';
    const province = formData.province || '';
    const tags = formData.tags || [];
    
    // Construir descripción breve para CARD (máximo 2-3 líneas)
    let desc = '';
    
    if (brand && model) {
      // Línea 1: Resumen de specs principales
      const specs = [];
      if (year) specs.push(`${year}`);
      if (hp) specs.push(`${hp} HP`);
      if (hours) specs.push(`${hours} hs`);
      
      desc = specs.join(' • ');
      
      // Línea 2: Condición y ubicación
      const extras = [];
      if (condition === 'nuevo') {
        extras.push('¡NUEVO 0 KM!');
      } else if (condition === 'usado_excelente') {
        extras.push('Impecable estado');
      } else if (condition === 'usado_bueno') {
        extras.push('Muy buen estado');
      }
      
      if (city) extras.push(city);
      else if (province) extras.push(province);
      
      if (extras.length > 0) {
        desc += '. ' + extras.join(', ');
      }
      
      // Línea 3: Tags destacados (máximo 3)
      if (tags.length > 0) {
        desc += '. ' + tags.slice(0, 3).join(', ');
      }
      
    } else {
      desc = 'Complete marca y modelo para generar descripción';
    }
    
    handleFieldChange('description', desc);
    setTimeout(() => setIsGenerating((prev) => ({ ...prev, description: false })), 500);
  }, [formData, handleFieldChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar
    const validation = validateFormData(formData, form.fields);

    if (!validation.isValid) {
      setErrors(validation.errors);
      // Scroll al primer error
      const firstErrorField = Object.keys(validation.errors)[0];
      const element = document.getElementById(`field-${firstErrorField}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Submit
    setErrors({});
    await onSubmit(formData);
  };

  // Agrupar campos por sección
  const fieldsBySection = groupFieldsBySection(form.fields, form.sections);

  return (
    <FormDataContext.Provider value={{ formData, form }}>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Renderizar secciones */}
        {form.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => {
            const sectionFields = fieldsBySection.get(section.id) || [];

          if (sectionFields.length === 0) return null;

          return (
            <section
              key={section.id}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-6 border-b pb-3">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  {section.icon && <span className="text-2xl">{section.icon}</span>}
                  {section.label}
                </h2>
                
                {/* Botones de autogenerar para sección de Aviso */}
                {section.id === 'aviso' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={generateTitle}
                      disabled={isGenerating.title}
                      className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isGenerating.title ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Generando...
                        </>
                      ) : (
                        <>Autogenerar Título</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={generateDescription}
                      disabled={isGenerating.description}
                      className="px-3 py-1.5 text-sm bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-lg border border-brand-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isGenerating.description ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Generando...
                        </>
                      ) : (
                        <>Autogenerar Descripción</>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sectionFields.map((field) => (
                  <div
                    key={field.id}
                    id={`field-${field.field_name}`}
                    className={getFieldWidthClass(field.field_width)}
                  >
                    <FieldRenderer
                      field={field}
                      value={formData[field.field_name]}
                      onChange={(value) =>
                        handleFieldChange(field.field_name, value)
                      }
                      error={errors[field.field_name]}
                      categoryId={categoryId}
                      formData={formData}
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })}

      {/* Botón Submit */}
      <div className="flex justify-end pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 bg-brand-500 text-white rounded-lg font-semibold hover:bg-brand-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Enviando...' : submitLabel}
        </button>
      </div>

      {/* Errores generales */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold mb-2">
            Por favor corrige los siguientes errores:
          </p>
          <ul className="list-disc list-inside text-red-700 space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      </form>
    </FormDataContext.Provider>
  );
};

// ============================================================================
// FIELD RENDERER
// ============================================================================

const FieldRenderer: React.FC<FieldComponentProps> = ({
  field,
  value,
  onChange,
  error,
  categoryId,
  formData,
}) => {
  const baseInputClass = `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white text-black ${
    error ? 'border-red-500' : 'border-gray-300'
  }`;

  const labelClass = `block text-sm font-medium text-gray-700 mb-2 ${
    field.is_required ? "after:content-['*'] after:ml-1 after:text-red-500" : ''
  }`;

  // Renderizar según tipo de campo
  const renderInput = () => {
    switch (field.field_type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            className={baseInputClass}
            required={field.is_required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            min={field.validation_rules?.min}
            max={field.validation_rules?.max}
            className={baseInputClass}
            required={field.is_required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            rows={5}
            className={baseInputClass}
            required={field.is_required}
          />
        );

      case 'select':
        // Select dinámico de localidades basado en provincia
        if (field.field_name === 'city' && formData.province) {
          const localidades = getLocalidadesByProvincia(formData.province);
          return (
            <select
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className={baseInputClass}
              required={field.is_required}
            >
              <option value="" className="bg-white text-black">Seleccione una localidad</option>
              {localidades.map((localidad) => (
                <option key={localidad} value={localidad} className="bg-white text-black">
                  {localidad}
                </option>
              ))}
            </select>
          );
        }
        
        // Select normal
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
            required={field.is_required}
          >
            <option value="" className="bg-white text-black">
              {field.placeholder || 'Seleccione una opción'}
            </option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value} className="bg-white text-black">
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'autocomplete':
        if (field.data_source === 'brands') {
          return (
            <BrandAutocomplete
              value={value}
              onChange={onChange}
              categoryId={categoryId}
              placeholder={field.placeholder}
              required={field.is_required}
              error={error}
            />
          );
        }

        if (field.data_source === 'models') {
          const brandId = formData.brand_id || formData.brand;
          return (
            <ModelAutocomplete
              value={value}
              onChange={onChange}
              brandId={brandId}
              placeholder={field.placeholder}
              required={field.is_required}
              error={error}
              disabled={!brandId}
            />
          );
        }

        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            className={baseInputClass}
            required={field.is_required}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="w-5 h-5 text-brand-500 border-gray-300 rounded focus:ring-brand-400"
            />
            <span className="ml-2 text-sm text-gray-700">
              {field.placeholder || field.field_label}
            </span>
          </div>
        );

      case 'features':
        return (
          <FeaturesSelector
            categoryId={categoryId}
            value={value || {}}
            onChange={onChange}
          />
        );

      case 'tags':
        return (
          <TagsInput
            value={value || []}
            onChange={onChange}
            placeholder={field.placeholder || 'Agregue etiquetas'}
            maxTags={10}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            className={baseInputClass}
          />
        );
    }
  };

  return (
    <div>
      {field.field_type !== 'checkbox' && (
        <label className={labelClass}>
          {field.icon && <span className="mr-2">{field.icon}</span>}
          {field.field_label}
        </label>
      )}

      {renderInput()}

      {field.help_text && !error && (
        <p className="mt-1 text-sm text-gray-500">{field.help_text}</p>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

// ============================================================================
// AUTOCOMPLETE COMPONENTS
// ============================================================================

const BrandAutocomplete: React.FC<{
  value: any;
  onChange: (value: any) => void;
  categoryId?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}> = ({ value, onChange, categoryId, placeholder, required, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<BrandV2[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandV2 | null>(null);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      loadSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  const loadSuggestions = async () => {
    try {
      const results = await searchBrands(searchTerm, categoryId, 10);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching brands:', error);
    }
  };

  const handleSelect = (brand: BrandV2) => {
    setSelectedBrand(brand);
    setSearchTerm(brand.display_name);
    setShowSuggestions(false);
    onChange(brand.id);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder || 'Buscar marca...'}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-400 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        required={required}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((brand) => (
            <button
              key={brand.id}
              type="button"
              onClick={() => handleSelect(brand)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors"
            >
              <div className="font-medium text-gray-900">
                {brand.display_name}
              </div>
              {brand.country && (
                <div className="text-sm text-gray-500">{brand.country}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ModelAutocomplete: React.FC<{
  value: any;
  onChange: (value: any) => void;
  brandId?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}> = ({
  value,
  onChange,
  brandId,
  placeholder,
  required,
  error,
  disabled,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<ModelV2[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 2 && brandId) {
      loadSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, brandId]);

  const loadSuggestions = async () => {
    if (!brandId) return;

    try {
      const results = await searchModels(searchTerm, brandId, 10);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching models:', error);
    }
  };

  const handleSelect = (model: ModelV2) => {
    setSearchTerm(model.display_name);
    setShowSuggestions(false);
    onChange(model.id);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder || 'Buscar modelo...'}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-400 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        required={required}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => handleSelect(model)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors"
            >
              <div className="font-medium text-gray-900">
                {model.display_name}
              </div>
              {model.specifications?.hp && (
                <div className="text-sm text-gray-500">
                  {model.specifications.hp} HP
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// FEATURES SELECTOR
// ============================================================================

const FeaturesSelector: React.FC<{
  categoryId?: string;
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
}> = ({ categoryId, value = {}, onChange }) => {
  const [features, setFeatures] = useState<FeatureV2[]>([]);

  useEffect(() => {
    if (categoryId) {
      loadFeatures();
    }
  }, [categoryId]);

  const loadFeatures = async () => {
    if (!categoryId) return;

    try {
      const featuresData = await getFeaturesByCategory(categoryId);
      setFeatures(featuresData);
    } catch (error) {
      console.error('Error loading features:', error);
    }
  };

  const handleFeatureChange = (featureName: string, featureValue: any) => {
    onChange({
      ...value,
      [featureName]: featureValue,
    });
  };

  if (features.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-sm">No hay características disponibles para esta categoría</p>
      </div>
    );
  }

  // Separar features por tipo para mejor agrupación
  const checkboxFeatures = features.filter(f => f.feature_type === 'checkbox');
  const otherFeatures = features.filter(f => f.feature_type !== 'checkbox');

  return (
    <div className="space-y-6">
      {/* Características tipo checkbox en grid */}
      {checkboxFeatures.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Selecciona las características que aplican:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {checkboxFeatures.map((feature) => (
              <label
                key={feature.id}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  value[feature.name]
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={value[feature.name] || false}
                  onChange={(e) =>
                    handleFeatureChange(feature.name, e.target.checked)
                  }
                  className="w-5 h-5 text-brand-500 border-gray-300 rounded focus:ring-brand-400 mr-3"
                />
                <div className="flex items-center gap-2">
                  {feature.icon && <span className="text-xl">{feature.icon}</span>}
                  <span className="text-sm font-medium text-gray-900">
                    {feature.display_name}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Otras características (select, text) */}
      {otherFeatures.length > 0 && (
        <div className="space-y-4">
          {otherFeatures.map((feature) => (
            <div key={feature.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {feature.icon && <span className="mr-2 text-lg">{feature.icon}</span>}
                {feature.display_name}
                {feature.help_text && (
                  <span className="block text-xs text-gray-500 mt-1">
                    {feature.help_text}
                  </span>
                )}
              </label>

              {feature.feature_type === 'select' && feature.options && (
                <select
                  value={value[feature.name] || ''}
                  onChange={(e) => handleFeatureChange(feature.name, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 bg-white"
                >
                  <option value="">Seleccione una opción</option>
                  {feature.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {feature.feature_type === 'text' && (
                <input
                  type="text"
                  value={value[feature.name] || ''}
                  onChange={(e) => handleFeatureChange(feature.name, e.target.value)}
                  placeholder={feature.placeholder || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 bg-white"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TAGS INPUT COMPONENT
// ============================================================================

const TagsInput: React.FC<{
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}> = ({ value = [], onChange, placeholder, maxTags = 10 }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    
    if (value.length >= maxTags) {
      alert(`Máximo ${maxTags} etiquetas permitidas`);
      return;
    }

    if (value.includes(trimmed)) {
      alert('Esta etiqueta ya existe');
      return;
    }

    onChange([...value, trimmed]);
    setInputValue('');
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Escriba y presione Enter'}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        />
        <button
          type="button"
          onClick={addTag}
          disabled={!inputValue.trim() || value.length >= maxTags}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Agregar
        </button>
      </div>

      {/* Tags display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="ml-1 text-brand-500 hover:text-brand-700 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Counter */}
      <p className="text-xs text-gray-500">
        {value.length} de {maxTags} etiquetas
        {value.length > 0 && ' • Presione × para eliminar'}
      </p>
    </div>
  );
};

export default FormRenderer;

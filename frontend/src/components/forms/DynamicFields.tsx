import React from 'react';
import { FieldConfig } from '../../config/adFieldsConfig';

interface DynamicFieldProps {
  field: FieldConfig;
  value: any;
  onChange: (name: string, value: any) => void;
  error?: string;
}

/**
 * ====================================================================
 * DESIGN SYSTEM RURAL24 - Estilos de inputs
 * ====================================================================
 */
const DS = {
  // Input base
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
  // Radio
  radio: 'w-4 h-4 text-primary-500 border-2 border-gray-300 focus:ring-2 focus:ring-primary-500',
};

/**
 * Componente que renderiza un campo de formulario dinámico
 * según su configuración (tipo, opciones, validaciones, etc.)
 */
export const DynamicField: React.FC<DynamicFieldProps> = ({
  field,
  value,
  onChange,
  error
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = field.type === 'number' 
      ? parseFloat(e.target.value) || 0
      : e.target.value;
    onChange(field.name, newValue);
  };

  // Seleccionar clase según estado de error
  const inputClasses = error ? DS.inputError : DS.input;

  const renderField = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            className={`${inputClasses} min-h-[120px] resize-y`}
          />
        );

      case 'select':
        return (
          <select
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            required={field.required}
            className={inputClasses}
          >
            <option value="">Seleccionar...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={handleChange}
                  required={field.required}
                  className={DS.radio}
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
      case 'boolean':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name={field.name}
              checked={value || false}
              onChange={(e) => onChange(field.name, e.target.checked)}
              className={DS.checkbox}
            />
            <span className="text-gray-700">{field.placeholder || field.label}</span>
          </label>
        );

      case 'number':
        return (
          <div className="relative">
            <input
              type="number"
              id={field.name}
              name={field.name}
              value={value || ''}
              onChange={handleChange}
              placeholder={field.placeholder}
              required={field.required}
              min={field.min}
              max={field.max}
              className={`${inputClasses} ${field.unit ? 'pr-16' : ''}`}
            />
            {field.unit && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                {field.unit}
              </span>
            )}
          </div>
        );

      case 'tel':
        return (
          <input
            type="tel"
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            className={inputClasses}
          />
        );

      case 'url':
        return (
          <input
            type="url"
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            className={inputClasses}
          />
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            id={field.name}
            name={field.name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={field.required}
            className={inputClasses}
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={field.name} className={DS.label}>
        {field.label}
        {field.required && <span className="text-error ml-1">*</span>}
      </label>
      
      {renderField()}
      
      {field.helpText && !error && (
        <p className={DS.helperText}>{field.helpText}</p>
      )}
      
      {error && (
        <p className={DS.errorText}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

interface DynamicFormSectionProps {
  fields: FieldConfig[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  errors?: Record<string, string>;
  title?: string;
  description?: string;
}

/**
 * Componente que renderiza una sección completa de campos dinámicos
 * Agrupa campos relacionados y muestra títulos/descripciones
 */
export const DynamicFormSection: React.FC<DynamicFormSectionProps> = ({
  fields,
  values,
  onChange,
  errors = {},
  title,
  description
}) => {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-6">
      {title && (
        <div className="border-b pb-3">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map(field => (
          <div
            key={field.name}
            className={field.type === 'textarea' ? 'md:col-span-2' : ''}
          >
            <DynamicField
              field={field}
              value={values[field.name]}
              onChange={onChange}
              error={errors[field.name]}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

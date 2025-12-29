import React from 'react';
import { FieldConfig } from '../../config/adFieldsConfig';

interface DynamicFieldProps {
  field: FieldConfig;
  value: any;
  onChange: (name: string, value: any) => void;
  error?: string;
}

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

  const renderField = () => {
    const baseClasses = `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
      error ? 'border-red-500' : 'border-gray-300'
    }`;

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
            className={`${baseClasses} min-h-[120px] resize-y`}
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
            className={baseClasses}
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
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={handleChange}
                  required={field.required}
                  className="w-4 h-4 text-green-600 focus:ring-green-500"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name={field.name}
              checked={value || false}
              onChange={(e) => onChange(field.name, e.target.checked)}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
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
              className={`${baseClasses} ${field.unit ? 'pr-16' : ''}`}
            />
            {field.unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
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
            className={baseClasses}
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
            className={baseClasses}
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
            className={baseClasses}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {renderField()}
      
      {field.helpText && !error && (
        <p className="text-xs text-gray-500">{field.helpText}</p>
      )}
      
      {error && (
        <p className="text-xs text-red-500">{error}</p>
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

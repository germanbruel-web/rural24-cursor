import React from 'react';
import { Check } from 'lucide-react';
import type { DynamicFormField } from '../../services/formConfigService';

interface BackendDynamicFieldProps {
  field: DynamicFormField;
  value: any;
  onChange: (name: string, value: any) => void;
  error?: string;
}

/**
 * Componente que renderiza campos dinámicos respetando los tipos del backend
 * Maneja todos los tipos: text, number, select, multiselect, textarea, checkbox, date
 */
export const BackendDynamicField: React.FC<BackendDynamicFieldProps> = ({
  field,
  value,
  onChange,
  error
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let newValue: any = e.target.value;

    if (field.field_type === 'number') {
      newValue = e.target.value === '' ? '' : parseFloat(e.target.value);
    } else if (field.field_type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }

    onChange(field.field_name, newValue);
  };

  // Handler especial para multiselect con chips
  const handleMultiselectToggle = (option: string) => {
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = currentValues.includes(option)
      ? currentValues.filter(v => v !== option)
      : [...currentValues, option];
    onChange(field.field_name, newValues);
  };

  const baseClasses = `w-full px-5 py-4 text-base border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all bg-white ${
    error ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-300'
  }`;

  const renderField = () => {
    switch (field.field_type) {
      case 'text':
        return (
          <input
            type="text"
            id={field.field_name}
            name={field.field_name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder || ''}
            required={field.is_required}
            className={baseClasses}
          />
        );

      case 'number':
        return (
          <div className="relative">
            <input
              type="number"
              id={field.field_name}
              name={field.field_name}
              value={value ?? ''}
              onChange={handleChange}
              placeholder={field.placeholder || ''}
              required={field.is_required}
              className={`${baseClasses} ${field.suffix ? 'pr-16' : ''}`}
              min={field.min_value ?? undefined}
              max={field.max_value ?? undefined}
            />
            {field.suffix && (
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                {field.suffix}
              </span>
            )}
          </div>
        );

      case 'textarea':
        return (
          <textarea
            id={field.field_name}
            name={field.field_name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder || ''}
            required={field.is_required}
            className={`${baseClasses} min-h-[120px] resize-y`}
            rows={4}
          />
        );

      case 'select':
        return (
          <select
            id={field.field_name}
            name={field.field_name}
            value={value || ''}
            onChange={handleChange}
            required={field.is_required}
            className={baseClasses}
          >
            <option value="">
              {field.placeholder || `Seleccionar ${field.field_label}...`}
            </option>
            {field.field_options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-3">
            {/* Chips seleccionables */}
            <div className="flex flex-wrap gap-2">
              {field.field_options.map((option) => {
                const isSelected = selectedValues.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleMultiselectToggle(option)}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200 border-2
                      ${isSelected 
                        ? 'bg-green-100 border-green-500 text-green-800' 
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-4 h-4" />}
                    {option}
                  </button>
                );
              })}
            </div>
            
            {/* Contador de selección */}
            {selectedValues.length > 0 && (
              <p className="text-xs text-green-600 font-medium">
                {selectedValues.length} seleccionado{selectedValues.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={field.field_name}
              name={field.field_name}
              checked={value || false}
              onChange={handleChange}
              required={field.is_required}
              className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor={field.field_name} className="ml-3 text-sm text-gray-700">
              {field.field_label}
            </label>
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            id={field.field_name}
            name={field.field_name}
            value={value || ''}
            onChange={handleChange}
            required={field.is_required}
            className={baseClasses}
            min={field.min_value ?? undefined}
            max={field.max_value ?? undefined}
          />
        );

      default:
        return (
          <input
            type="text"
            id={field.field_name}
            name={field.field_name}
            value={value || ''}
            onChange={handleChange}
            placeholder={field.placeholder || ''}
            required={field.is_required}
            className={baseClasses}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {field.field_type !== 'checkbox' && (
        <label 
          htmlFor={field.field_name}
          className="block text-base font-bold text-gray-900"
        >
          {field.field_label}
          {field.is_required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {renderField()}

      {field.help_text && (
        <p className="text-sm text-gray-500">
          {field.help_text}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};
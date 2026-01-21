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
 * ====================================================================
 * DESIGN SYSTEM RURAL24 - Estilos de inputs
 * ====================================================================
 * 
 * Clases base del Design System:
 * - Input base: px-4 py-3 border-2 rounded-lg
 * - Focus: focus:ring-2 focus:ring-primary-500 focus:border-transparent
 * - Error: border-error focus:ring-error
 * - Transition: transition-all duration-200
 */
const DESIGN_SYSTEM = {
  // Input base - Design System RURAL24
  inputBase: `
    w-full 
    px-4 py-3 
    text-base 
    bg-white 
    border-2 border-gray-300 
    rounded-lg 
    transition-all duration-200
    focus:outline-none 
    focus:ring-2 focus:ring-primary-500 focus:border-transparent
    placeholder:text-gray-400
  `.replace(/\s+/g, ' ').trim(),
  
  // Input con error
  inputError: `
    w-full 
    px-4 py-3 
    text-base 
    bg-white 
    border-2 border-error 
    rounded-lg 
    transition-all duration-200
    focus:outline-none 
    focus:ring-2 focus:ring-error focus:border-transparent
    placeholder:text-gray-400
  `.replace(/\s+/g, ' ').trim(),
  
  // Label
  label: 'block text-sm font-semibold text-gray-700 mb-2',
  
  // Helper text
  helperText: 'mt-1.5 text-sm text-gray-500',
  
  // Error text
  errorText: 'mt-1.5 text-sm text-error flex items-center gap-1',
  
  // Checkbox container
  checkboxContainer: 'flex items-center gap-3',
  
  // Checkbox
  checkbox: 'h-5 w-5 text-primary-500 border-2 border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all',
  
  // Multiselect chip - default
  chipDefault: 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-100',
  
  // Multiselect chip - selected
  chipSelected: 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border-2 bg-primary-50 border-primary-500 text-primary-800',
};

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

  // Seleccionar clase base según estado de error
  const inputClasses = error ? DESIGN_SYSTEM.inputError : DESIGN_SYSTEM.inputBase;

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
            className={inputClasses}
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
              className={`${inputClasses} ${field.suffix ? 'pr-16' : ''}`}
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
            className={`${inputClasses} min-h-[120px] resize-y`}
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
            className={inputClasses}
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
                    className={isSelected ? DESIGN_SYSTEM.chipSelected : DESIGN_SYSTEM.chipDefault}
                  >
                    {isSelected && <Check className="w-4 h-4" />}
                    {option}
                  </button>
                );
              })}
            </div>
            
            {/* Contador de selección */}
            {selectedValues.length > 0 && (
              <p className="text-xs text-primary-600 font-medium">
                {selectedValues.length} seleccionado{selectedValues.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div className={DESIGN_SYSTEM.checkboxContainer}>
            <input
              type="checkbox"
              id={field.field_name}
              name={field.field_name}
              checked={value || false}
              onChange={handleChange}
              required={field.is_required}
              className={DESIGN_SYSTEM.checkbox}
            />
            <label htmlFor={field.field_name} className="text-sm text-gray-700 cursor-pointer">
              {field.field_label}
            </label>
          </div>
        );

      case 'boolean':
        return (
          <div className={DESIGN_SYSTEM.checkboxContainer}>
            <input
              type="checkbox"
              id={field.field_name}
              name={field.field_name}
              checked={value || false}
              onChange={handleChange}
              required={field.is_required}
              className={DESIGN_SYSTEM.checkbox}
            />
            <label htmlFor={field.field_name} className="text-sm text-gray-700 cursor-pointer">
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
            className={inputClasses}
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
            className={inputClasses}
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      {field.field_type !== 'checkbox' && field.field_type !== 'boolean' && (
        <label 
          htmlFor={field.field_name}
          className={DESIGN_SYSTEM.label}
        >
          {field.field_label}
          {field.is_required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      {renderField()}

      {field.help_text && !error && (
        <p className={DESIGN_SYSTEM.helperText}>
          {field.help_text}
        </p>
      )}

      {error && (
        <p className={DESIGN_SYSTEM.errorText}>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};
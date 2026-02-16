// ====================================================================
// DynamicField - Campo individual que se adapta al tipo de input
// Mobile First + UX Profesional
// ====================================================================

import React from 'react';
import type { DynamicAttribute } from '../services/catalogService';

interface DynamicFieldProps {
  attribute: DynamicAttribute;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function DynamicField({ attribute, value, onChange, error }: DynamicFieldProps) {
  const {
    slug,
    name,
    inputType,
    isRequired,
    uiConfig,
    validations,
    options,
  } = attribute;

  // Clases comunes
  const baseInputClass = `
    w-full px-5 py-4 rounded-xl border-2 
    transition-all duration-200
    text-base sm:text-lg
    ${error 
      ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-200' 
      : 'border-gray-200 bg-white focus:border-brand-400 focus:ring-brand-100'
    }
    focus:outline-none focus:ring-4
    placeholder:text-gray-400
    disabled:bg-gray-50 disabled:cursor-not-allowed
  `;

  const labelClass = `
    block text-base sm:text-lg font-bold text-gray-900 mb-3
    ${isRequired ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''}
  `;

  // ====================================================================
  // TEXT INPUT
  // ====================================================================
  if (inputType === 'text') {
    return (
      <div className="space-y-3">
        <label htmlFor={slug} className={labelClass}>
          {name}
        </label>
        <input
          id={slug}
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={uiConfig?.placeholder || `Ingrese ${name.toLowerCase()}`}
          className={baseInputClass}
          required={isRequired}
        />
        {error && <p className="text-base text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  // ====================================================================
  // NUMBER INPUT
  // ====================================================================
  if (inputType === 'number') {
    return (
      <div className="space-y-3">
        <label htmlFor={slug} className={labelClass}>
          {name}
        </label>
        <div className="relative">
          {uiConfig?.prefix && (
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-base">
              {uiConfig.prefix}
            </span>
          )}
          <input
            id={slug}
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={uiConfig?.placeholder || '0'}
            min={validations?.min}
            max={validations?.max}
            className={`${baseInputClass} ${uiConfig?.prefix ? 'pl-16' : ''} ${uiConfig?.suffix ? 'pr-16' : ''}`}
            required={isRequired}
          />
          {uiConfig?.suffix && (
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-base">
              {uiConfig.suffix}
            </span>
          )}
        </div>
        {validations?.min !== undefined && validations?.max !== undefined && (
          <p className="text-sm text-gray-500 mt-1">
            Rango: {validations.min} - {validations.max}
          </p>
        )}
        {error && <p className="text-base text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  // ====================================================================
  // SELECT
  // ====================================================================
  if (inputType === 'select') {
    return (
      <div className="space-y-3">
        <label htmlFor={slug} className={labelClass}>
          {name}
        </label>
        <select
          id={slug}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInputClass} cursor-pointer`}
          required={isRequired}
        >
          <option value="">{uiConfig?.placeholder || `Seleccionar ${name.toLowerCase()}`}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-base text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  // ====================================================================
  // BOOLEAN (Toggle Switch)
  // ====================================================================
  if (inputType === 'boolean' || inputType === 'checkbox') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border-2 border-gray-200">
          <label htmlFor={slug} className="text-base sm:text-lg font-bold text-gray-900 cursor-pointer">
            {uiConfig?.label || name}
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={value || false}
            onClick={() => onChange(!value)}
            className={`
              relative inline-flex h-8 w-14 items-center rounded-full
              transition-colors duration-200 ease-in-out
              focus:outline-none focus:ring-4 focus:ring-brand-100
              ${value ? 'bg-brand-400' : 'bg-gray-300'}
            `}
          >
            <span
              className={`
                inline-block h-6 w-6 transform rounded-full bg-white shadow-lg
                transition-transform duration-200 ease-in-out
                ${value ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
        {error && <p className="text-base text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  // ====================================================================
  // DATE
  // ====================================================================
  if (inputType === 'date') {
    return (
      <div className="space-y-3">
        <label htmlFor={slug} className={labelClass}>
          {name}
        </label>
        <input
          id={slug}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={baseInputClass}
          required={isRequired}
        />
        {error && <p className="text-base text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  // ====================================================================
  // MULTISELECT (Chips)
  // ====================================================================
  if (inputType === 'multiselect') {
    const selectedValues = Array.isArray(value) ? value : [];

    const toggleOption = (optValue: string) => {
      if (selectedValues.includes(optValue)) {
        onChange(selectedValues.filter((v) => v !== optValue));
      } else {
        onChange([...selectedValues, optValue]);
      }
    };

    return (
      <div className="space-y-3">
        <label className={labelClass}>{name}</label>
        <div className="flex flex-wrap gap-3">
          {options.map((opt) => {
            const isSelected = selectedValues.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleOption(opt.value)}
                className={`
                  px-5 py-3 rounded-full text-base font-semibold
                  transition-all duration-200
                  ${isSelected
                    ? 'bg-brand-400 text-white shadow-lg shadow-brand-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {error && <p className="text-base text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  // Fallback
  return (
    <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
      <p className="text-sm text-yellow-800">
        Campo no soportado: <strong>{inputType}</strong>
      </p>
    </div>
  );
}

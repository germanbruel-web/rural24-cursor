// ====================================================================
// DYNAMIC FILTER CONTROL COMPONENT
// Renderiza controles de filtro según su tipo (select, range, checkbox, chips)
// ====================================================================

import React from 'react';
import type { FilterConfig } from '../../services/filtersService';

interface DynamicFilterControlProps {
  filter: FilterConfig;
  value: string | string[] | { min?: number; max?: number } | undefined;
  onChange: (fieldName: string, value: string | string[] | { min?: number; max?: number }) => void;
  className?: string;
}

export const DynamicFilterControl: React.FC<DynamicFilterControlProps> = ({
  filter,
  value,
  onChange,
  className = '',
}) => {
  const { filter_type, field_name, field_label, options = [] } = filter;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(field_name, e.target.value);
  };

  const handleCheckboxChange = (option: string, checked: boolean) => {
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = checked
      ? [...currentValues, option]
      : currentValues.filter(v => v !== option);
    onChange(field_name, newValues);
  };

  const handleChipClick = (option: string) => {
    const currentValues = Array.isArray(value) ? value : [];
    const isSelected = currentValues.includes(option);
    const newValues = isSelected
      ? currentValues.filter(v => v !== option)
      : [...currentValues, option];
    onChange(field_name, newValues);
  };

  const handleRangeChange = (type: 'min' | 'max', inputValue: string) => {
    const currentRange = typeof value === 'object' && !Array.isArray(value) ? value : {};
    const numValue = inputValue ? parseFloat(inputValue) : undefined;
    onChange(field_name, {
      ...currentRange,
      [type]: numValue,
    });
  };

  // Renderizar según tipo
  switch (filter_type) {
    case 'select':
      return (
        <div className={`filter-control filter-select ${className}`}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field_label}
          </label>
          <select
            value={(value as string) || ''}
            onChange={handleSelectChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            {options.map((option, idx) => (
              <option key={`${option}-${idx}`} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );

    case 'range':
      const rangeValue = typeof value === 'object' && !Array.isArray(value) ? value : {};
      return (
        <div className={`filter-control filter-range ${className}`}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field_label}
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Mín"
              value={rangeValue.min ?? ''}
              onChange={(e) => handleRangeChange('min', e.target.value)}
              className="w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="Máx"
              value={rangeValue.max ?? ''}
              onChange={(e) => handleRangeChange('max', e.target.value)}
              className="w-1/2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      );

    case 'checkbox':
      const checkboxValues = Array.isArray(value) ? value : [];
      return (
        <div className={`filter-control filter-checkbox ${className}`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field_label}
          </label>
          <div className="space-y-2">
            {options.map((option, idx) => (
              <label key={`${option}-${idx}`} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkboxValues.includes(option)}
                  onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">{option}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case 'chips':
      const chipValues = Array.isArray(value) ? value : [];
      return (
        <div className={`filter-control filter-chips ${className}`}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field_label}
          </label>
          <div className="flex flex-wrap gap-2">
            {options.map((option, idx) => {
              const isSelected = chipValues.includes(option);
              return (
                <button
                  key={`${option}-${idx}`}
                  type="button"
                  onClick={() => handleChipClick(option)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      );

    default:
      // Fallback a select
      return (
        <div className={`filter-control filter-select ${className}`}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field_label}
          </label>
          <select
            value={(value as string) || ''}
            onChange={handleSelectChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            {options.map((option, idx) => (
              <option key={`${option}-${idx}`} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
  }
};

// Componente para renderizar un grupo de filtros dinámicos
interface DynamicFiltersGroupProps {
  filters: FilterConfig[];
  values: Record<string, string | string[] | { min?: number; max?: number }>;
  onChange: (fieldName: string, value: string | string[] | { min?: number; max?: number }) => void;
  className?: string;
}

export const DynamicFiltersGroup: React.FC<DynamicFiltersGroupProps> = ({
  filters,
  values,
  onChange,
  className = '',
}) => {
  // Ordenar filtros por filter_order
  const sortedFilters = [...filters].sort((a, b) => (a.filter_order || 0) - (b.filter_order || 0));

  return (
    <div className={`dynamic-filters-group space-y-4 ${className}`}>
      {sortedFilters.map((filter) => (
        <DynamicFilterControl
          key={filter.field_name}
          filter={filter}
          value={values[filter.field_name]}
          onChange={onChange}
        />
      ))}
    </div>
  );
};

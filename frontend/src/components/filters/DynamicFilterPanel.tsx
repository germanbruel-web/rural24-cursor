// DynamicFilterPanel.tsx
// Panel de filtros dinámico que se adapta a cada categoría
// Con links directos + panel colapsable

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface Filter {
  name: string;
  label: string;
  type: 'links' | 'checkbox' | 'select' | 'range';
  options: FilterOption[];
  isQuickFilter?: boolean; // Links directos arriba
}

interface Props {
  categoryId?: string;
  onFilterChange: (filters: Record<string, any>) => void;
  activeFilters: Record<string, any>;
}

export const DynamicFilterPanel: React.FC<Props> = ({ 
  categoryId, 
  onFilterChange, 
  activeFilters 
}) => {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['quickFilters']));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFilters();
  }, [categoryId]);

  const loadFilters = async () => {
    setLoading(true);
    
    // TODO: Implementar endpoint GET /api/config/filters?category={categoryId}
    // Por ahora, mock de filtros dinámicos
    const mockFilters: Filter[] = [
      {
        name: 'condition',
        label: 'Condición',
        type: 'links',
        isQuickFilter: true,
        options: [
          { value: 'all', label: 'Todas', count: 156 },
          { value: 'new', label: 'Nuevo', count: 45 },
          { value: 'used', label: 'Usado', count: 111 },
        ],
      },
      {
        name: 'province',
        label: 'Ubicación',
        type: 'links',
        isQuickFilter: true,
        options: [
          { value: 'all', label: 'Todas las provincias', count: 156 },
          { value: 'buenos-aires', label: 'Buenos Aires', count: 67 },
          { value: 'cordoba', label: 'Córdoba', count: 34 },
          { value: 'santa-fe', label: 'Santa Fe', count: 28 },
          { value: 'entre-rios', label: 'Entre Ríos', count: 15 },
        ],
      },
      {
        name: 'brands',
        label: 'Marcas',
        type: 'checkbox',
        options: [
          { value: 'john-deere', label: 'John Deere', count: 45 },
          { value: 'case', label: 'Case IH', count: 32 },
          { value: 'new-holland', label: 'New Holland', count: 28 },
          { value: 'massey-ferguson', label: 'Massey Ferguson', count: 21 },
        ],
      },
      {
        name: 'year',
        label: 'Año',
        type: 'range',
        options: [
          { value: '2020-2024', label: '2020-2024' },
        ],
      },
    ];

    setFilters(mockFilters);
    setLoading(false);
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionName)) {
        next.delete(sectionName);
      } else {
        next.add(sectionName);
      }
      return next;
    });
  };

  const handleQuickFilterClick = (filterName: string, value: string) => {
    onFilterChange({
      ...activeFilters,
      [filterName]: value === 'all' ? null : value,
    });
  };

  const handleCheckboxChange = (filterName: string, value: string, checked: boolean) => {
    const currentValues = activeFilters[filterName] || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v: string) => v !== value);
    
    onFilterChange({
      ...activeFilters,
      [filterName]: newValues.length > 0 ? newValues : null,
    });
  };

  const handleClearAll = () => {
    onFilterChange({});
  };

  if (loading) {
    return <div className="w-full h-64 bg-gray-200 animate-pulse rounded-lg" />;
  }

  const quickFilters = filters.filter(f => f.isQuickFilter);
  const advancedFilters = filters.filter(f => !f.isQuickFilter);
  const hasActiveFilters = Object.values(activeFilters).some(v => v !== null && v !== undefined);

  return (
    <div className="space-y-6">
      {/* Quick Filters - Links Directos */}
      <div className="space-y-4">
        {quickFilters.map((filter) => (
          <div key={filter.name} className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">{filter.label}</h3>
            <div className="flex flex-wrap gap-2">
              {filter.options.map((option) => {
                const isActive = activeFilters[filter.name] === option.value || 
                               (option.value === 'all' && !activeFilters[filter.name]);
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleQuickFilterClick(filter.name, option.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                    {option.count && (
                      <span className={`ml-1 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                        ({option.count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      {advancedFilters.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => toggleSection('advanced')}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900"
          >
            <span>Más Filtros</span>
            {expandedSections.has('advanced') ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Advanced Filters - Colapsables */}
          {expandedSections.has('advanced') && (
            <div className="mt-4 space-y-4">
              {advancedFilters.map((filter) => (
                <div key={filter.name} className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">{filter.label}</h4>
                  
                  {filter.type === 'checkbox' && (
                    <div className="space-y-1">
                      {filter.options.map((option) => {
                        const isChecked = (activeFilters[filter.name] || []).includes(option.value);
                        
                        return (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => handleCheckboxChange(filter.name, option.value, e.target.checked)}
                              className="rounded border-gray-300 text-brand-600 focus:ring-brand-600"
                            />
                            <span>{option.label}</span>
                            {option.count && (
                              <span className="text-gray-400">({option.count})</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {filter.type === 'select' && (
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-600 focus:border-brand-600">
                      <option value="">Todas</option>
                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} {option.count && `(${option.count})`}
                        </option>
                      ))}
                    </select>
                  )}

                  {filter.type === 'range' && (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Desde"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-600 focus:border-brand-600"
                      />
                      <input
                        type="number"
                        placeholder="Hasta"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-600 focus:border-brand-600"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={handleClearAll}
          className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
};

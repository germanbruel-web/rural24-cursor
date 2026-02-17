
import React, { useState } from 'react';
import type { FilterOptions } from '../../types';

interface FilterSidebarProps {
  options: FilterOptions;
  onFilterChange: (filters: any) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ options, onFilterChange }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleApplyFilters = () => {
    onFilterChange({
      categories: selectedCategories,
      location: selectedLocation,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    });
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedLocation('');
    setMinPrice('');
    setMaxPrice('');
    onFilterChange({});
  };

  return (
    <aside className="w-full md:w-64 lg:w-72 bg-white p-6 rounded-lg shadow-md sticky top-4">
      <h3 className="text-xl font-bold mb-4 font-poppins text-gray-800">Filtrar por</h3>
      
      <div className="mb-6">
        <h4 className="font-semibold mb-2 text-gray-700">Categoría</h4>
        <div>
          {options.categories.map(category => (
            <div key={category} className="flex items-center mb-2">
              <input 
                id={`cat-${category}`} 
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryChange(category)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600" 
              />
              <label htmlFor={`cat-${category}`} className="ml-2 text-gray-600 text-sm cursor-pointer">
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold mb-2 text-gray-700">Ubicación</h4>
        <select 
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-brand-600 focus:border-brand-600"
        >
          <option value="">Todas las provincias</option>
          {options.provinces?.map(province => (
            <option key={province} value={province}>{province}</option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold mb-2 text-gray-700">Precio (USD)</h4>
        <div className="flex space-x-2">
          <input 
            type="number" 
            placeholder="Mín"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-brand-600 focus:border-brand-600" 
          />
          <input 
            type="number" 
            placeholder="Máx"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-brand-600 focus:border-brand-600" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleApplyFilters}
          className="w-full px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-semibold"
        >
          Aplicar Filtros
        </button>
        <button
          onClick={handleClearFilters}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Limpiar
        </button>
      </div>
    </aside>
  );
};

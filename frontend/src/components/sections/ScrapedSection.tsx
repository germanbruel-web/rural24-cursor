import React from 'react';
import type { Product } from '../../../types';
import { ProductCard } from '../organisms/ProductCard';

interface ScrapedSectionProps {
  productsByCategory: Record<string, Product[]>;
  onCategoryClick?: (category: string) => void;
}

export const ScrapedSection: React.FC<ScrapedSectionProps> = ({ productsByCategory, onCategoryClick }) => {
  const categories = Object.keys(productsByCategory);

  if (categories.length === 0) return null;

  const handleViewAll = (category: string) => {
    if (onCategoryClick) {
      onCategoryClick(category);
    }
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Avisos por Categoría
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Descubre los mejores productos organizados por categoría
          </p>
        </div>

        {/* Bloques por categoría */}
        <div className="space-y-12">
          {categories.map((category) => {
            const products = productsByCategory[category];
            if (!products || products.length === 0) return null;

            return (
              <div key={category} className="rounded-lg shadow-md p-6" style={{ backgroundColor: '#ecf3ee' }}>
                {/* Header de categoría */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{category}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {products.length} {products.length === 1 ? 'aviso' : 'avisos'} disponibles
                    </p>
                  </div>
                  <button 
                    onClick={() => handleViewAll(category)}
                    className="bg-[#16a135] hover:bg-[#0e7d25] text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    Ver todos
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Grid de productos (4 columnas) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.slice(0, 4).map((product) => (
                    <div key={product.id} className="hover:shadow-lg transition-shadow rounded-lg overflow-hidden">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {/* Ver más avisos (si hay más de 4) */}
                {products.length > 4 && (
                  <div className="mt-6 text-center">
                    <button 
                      onClick={() => handleViewAll(category)}
                      className="text-sm text-[#16a135] hover:text-[#0e7d25] font-medium hover:underline"
                    >
                      Ver más avisos de {category} ({products.length - 4} más)
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

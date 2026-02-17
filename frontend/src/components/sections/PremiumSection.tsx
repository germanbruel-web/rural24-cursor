import React from 'react';
import type { Product } from '../../../types';
import { ProductCard } from '../organisms/ProductCard';

interface PremiumSectionProps {
  products: Product[];
}

export const PremiumSection: React.FC<PremiumSectionProps> = ({ products }) => {
  if (products.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-br from-amber-50 to-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#e5a21f] text-white px-4 py-2 rounded-full mb-4">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-bold">DESTACADOS PREMIUM</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Avisos Destacados
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Los mejores productos y servicios agrícolas de usuarios premium y empresas verificadas
          </p>
        </div>

        {/* Grid de productos premium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="relative">
              {/* Badge Premium flotante */}
              <div className="absolute top-2 right-2 z-10 bg-[#e5a21f] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                PREMIUM
              </div>

              {/* Badge tipo de usuario */}
              {product.userType && product.userType !== 'free' && (
                <div className="absolute top-2 left-2 z-10 bg-brand-600 text-white px-2 py-1 rounded text-xs font-medium">
                  {product.userType === 'empresa' ? 'Empresa' : 'Particular'}
                </div>
              )}

              {/* Card con estilo premium */}
              <div className="relative border-4 border-[#e5a21f] rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-shadow bg-white">
                <ProductCard product={product} />
              </div>
            </div>
          ))}
        </div>

        {/* Ver más */}
        {products.length > 8 && (
          <div className="text-center mt-8">
            <button className="px-8 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-950 transition-colors font-medium shadow-lg">
              Ver todos los avisos premium
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

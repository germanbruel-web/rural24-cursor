import React from 'react';

interface HowItWorksSectionProps {
  onRegisterClick?: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onRegisterClick }) => {
  return (
    <section className="py-12 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* Título compacto arriba */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¿Cómo funciona RURAL24?
          </h2>
          <p className="text-gray-600 text-sm">
            Conectamos compradores y vendedores del agro en 3 simples pasos
          </p>
        </div>
        
        {/* 1 Row: 3 columnas compactas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Paso 1 */}
          <div className="relative bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl p-6 hover:shadow-lg transition-all group">
            <div className="flex items-start gap-4">
              {/* Icono y número juntos */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 bg-[#16a135] rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <img src="/images/icons/busca.png" alt="Buscar" className="w-12 h-12 object-contain" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-[#16a135] rounded-full flex items-center justify-center text-xs font-bold text-[#16a135]">
                  1
                </div>
              </div>
              {/* Texto */}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Buscá</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Encontrá maquinaria, insumos y servicios agrícolas en un solo lugar
                </p>
              </div>
            </div>
          </div>

          {/* Paso 2 */}
          <div className="relative bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl p-6 hover:shadow-lg transition-all group">
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 bg-[#16a135] rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <img src="/images/icons/contacta.png" alt="Contactar" className="w-12 h-12 object-contain" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-[#16a135] rounded-full flex items-center justify-center text-xs font-bold text-[#16a135]">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Contactá</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Hablá directamente con el vendedor sin intermediarios
                </p>
              </div>
            </div>
          </div>

          {/* Paso 3 */}
          <div className="relative bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl p-6 hover:shadow-lg transition-all group">
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 bg-[#16a135] rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <img src="/images/icons/compra.png" alt="Comprar" className="w-12 h-12 object-contain" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-[#16a135] rounded-full flex items-center justify-center text-xs font-bold text-[#16a135]">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Comprá</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Cerrá el negocio al mejor precio y condiciones
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

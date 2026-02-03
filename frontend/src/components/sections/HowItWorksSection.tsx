import React from 'react';

interface HowItWorksSectionProps {
  onRegisterClick?: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onRegisterClick }) => {
  return (
    <section className="py-12 mt-8 bg-white border-t border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* 3 columnas con iconos grandes - sin títulos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Paso 1: Buscá */}
          <div className="flex flex-col items-center text-center group">
            <div className="mb-4 transition-transform group-hover:scale-110">
              <img 
                src="/images/icons/busca.png" 
                alt="Buscar" 
                className="w-20 h-20 object-contain filter brightness-0"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Buscá</h3>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
              Encontrá maquinaria, insumos y servicios agrícolas en un solo lugar
            </p>
          </div>

          {/* Paso 2: Contactá */}
          <div className="flex flex-col items-center text-center group">
            <div className="mb-4 transition-transform group-hover:scale-110">
              <img 
                src="/images/icons/contacta.png" 
                alt="Contactar" 
                className="w-20 h-20 object-contain filter brightness-0"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Contactá</h3>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
              Hablá directamente con el vendedor sin intermediarios
            </p>
          </div>

          {/* Paso 3: Comprá */}
          <div className="flex flex-col items-center text-center group">
            <div className="mb-4 transition-transform group-hover:scale-110">
              <img 
                src="/images/icons/compra.png" 
                alt="Comprar" 
                className="w-20 h-20 object-contain filter brightness-0"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Comprá</h3>
            <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
              Cerrá el negocio al mejor precio y condiciones
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

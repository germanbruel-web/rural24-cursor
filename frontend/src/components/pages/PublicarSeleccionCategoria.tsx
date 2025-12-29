import { Tractor, Beef, ChevronRight, Sprout, Home, BookOpen } from 'lucide-react';

interface PublicarSeleccionCategoriaProps {
  onSelect: (categoria: 'maquinarias' | 'ganaderia' | 'insumos' | 'inmuebles' | 'guia') => void;
  onBack: () => void;
}

const fontStyle = { fontFamily: 'Open Sans, sans-serif' };

export default function PublicarSeleccionCategoria({ onSelect, onBack }: PublicarSeleccionCategoriaProps) {
  return (
    <div style={fontStyle} className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Volver
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              Publicar aviso gratis
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            ¿Qué vas a publicar?
          </h2>
          <p className="text-lg text-gray-600">
            Selecciona la categoría de tu producto
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {/* Maquinarias */}
          <button
            onClick={() => onSelect('maquinarias')}
            className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-6 border-2 border-transparent hover:border-[#16a135] text-left"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Maquinarias
            </h3>
            <p className="text-sm text-gray-600">
              Tractores, cosechadoras, implementos y maquinaria agrícola en general
            </p>
          </button>

          {/* Ganadería */}
          <button
            onClick={() => onSelect('ganaderia')}
            className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-6 border-2 border-transparent hover:border-[#16a135] text-left"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Ganadería
            </h3>
            <p className="text-sm text-gray-600">
              Bovinos, ovinos, equinos, porcinos y otros animales
            </p>
          </button>

          {/* Insumos Agropecuarios */}
          <button
            onClick={() => onSelect('insumos')}
            className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-6 border-2 border-transparent hover:border-[#16a135] text-left"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Insumos Agropecuarios
            </h3>
            <p className="text-sm text-gray-600">
              Semillas, agroquímicos, fertilizantes y otros insumos
            </p>
          </button>

          {/* Inmuebles Rurales */}
          <button
            onClick={() => onSelect('inmuebles')}
            className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-6 border-2 border-transparent hover:border-[#16a135] text-left"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Inmuebles Rurales
            </h3>
            <p className="text-sm text-gray-600">
              Campos, estancias, galpones y propiedades rurales
            </p>
          </button>

          {/* Guía del Campo */}
          <button
            onClick={() => onSelect('guia')}
            className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-6 border-2 border-transparent hover:border-[#16a135] text-left md:col-span-2"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Guía del Campo
            </h3>
            <p className="text-sm text-gray-600">
              Servicios, profesionales, empresas y guías del sector agropecuario
            </p>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            💡 Ambas opciones son completamente gratuitas
          </p>
        </div>
      </div>
    </div>
  );
}

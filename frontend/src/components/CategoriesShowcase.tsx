import React, { useMemo } from 'react';
import { MapPin, Megaphone, Tractor, Beef, Wheat, Wrench, Briefcase } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  count: number;
}

const CATEGORIES: Category[] = [
  {
    id: 'maquinaria',
    name: 'Maquinaria Agr�cola',
    icon: 'tractor',
    color: 'from-brand-500 to-brand-700',
    description: 'Tractores, cosechadoras y equipos',
    count: 1247,
  },
  {
    id: 'ganado',
    name: 'Ganado',
    icon: 'beef',
    color: 'from-brand-500 to-brand-700',
    description: 'Bovinos, ovinos y equinos',
    count: 856,
  },
  {
    id: 'insumos',
    name: 'Insumos Agr�colas',
    icon: 'wheat',
    color: 'from-brand-500 to-brand-700',
    description: 'Semillas, fertilizantes y qu�micos',
    count: 3421,
  },
  {
    id: 'inmuebles',
    name: 'Inmuebles Rurales',
    icon: 'mappin',
    color: 'from-brand-500 to-brand-700',
    description: 'Campos, lotes y propiedades rurales',
    count: 723,
  },
  {
    id: 'equipos',
    name: 'Equipos y Herramientas',
    icon: 'wrench',
    color: 'from-brand-500 to-brand-700',
    description: 'Herramientas manuales y equipos',
    count: 1892,
  },
];

interface CategoriesShowcaseProps {
  onCategoryClick?: (categoryId: string) => void;
  products?: any[];
}

export const CategoriesShowcase: React.FC<CategoriesShowcaseProps> = ({ onCategoryClick, products = [] }) => {
  // Calcular contadores reales por categor�a
  const getCategoryCount = (categoryName: string) => {
    return products.filter(p => p.category === categoryName).length;
  };

  const categoryGrid = useMemo(() => CATEGORIES.map(cat => ({
    ...cat,
    count: getCategoryCount(cat.name)
  })), [products]);

  return (
    <section className="py-16 md:py-20 bg-white">
      {/* Header */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Categor�as
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explora nuestras principales categor�as de productos y servicios para la agricultura
          </p>
        </div>
      </div>

      {/* Grid intercalado: Categor�as + Banners - Full Width */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fila 1 */}
          {/* Maquinaria Agr�cola */}
          <button
            onClick={() => onCategoryClick?.('maquinaria')}
            className="text-left group"
          >
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg p-8 text-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all h-full cursor-pointer">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform"><Tractor className="w-12 h-12" /></div>
              <h3 className="text-xl font-bold mb-2">Maquinaria Agr�cola</h3>
              <p className="text-white text-sm opacity-90 mb-4">Tractores, cosechadoras y equipos</p>
              <div className="flex justify-between items-center pt-4 border-t border-white border-opacity-20">
                <span className="text-sm font-semibold">{getCategoryCount('Maquinaria Agr�cola')} avisos</span>
                <span className="group-hover:translate-x-2 transition-transform">?</span>
              </div>
            </div>
          </button>

          {/* Banner 1 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-4xl mb-2"><Megaphone className="w-10 h-10 text-gray-400" /></div>
              <h3 className="text-lg font-bold text-gray-600">Tu Anuncio Aqu�</h3>
              <p className="text-sm text-gray-500">300x250px</p>
            </div>
          </div>

          {/* Banner 2 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-4xl mb-2"><Megaphone className="w-10 h-10 text-gray-400" /></div>
              <h3 className="text-lg font-bold text-gray-600">Tu Anuncio Aqu�</h3>
              <p className="text-sm text-gray-500">300x250px</p>
            </div>
          </div>

          {/* Fila 2 */}
          {/* Banner 3 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-4xl mb-2"><Megaphone className="w-10 h-10 text-gray-400" /></div>
              <h3 className="text-lg font-bold text-gray-600">Tu Anuncio Aqu�</h3>
              <p className="text-sm text-gray-500">300x250px</p>
            </div>
          </div>

          {/* Banner 4 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-4xl mb-2"><Megaphone className="w-10 h-10 text-gray-400" /></div>
              <h3 className="text-lg font-bold text-gray-600">Tu Anuncio Aqu�</h3>
              <p className="text-sm text-gray-500">300x250px</p>
            </div>
          </div>

          {/* Ganado */}
          <button
            onClick={() => onCategoryClick?.('ganado')}
            className="text-left group"
          >
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg p-8 text-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all h-full cursor-pointer">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform"><Beef className="w-12 h-12" /></div>
              <h3 className="text-xl font-bold mb-2">Ganado</h3>
              <p className="text-white text-sm opacity-90 mb-4">Bovinos, ovinos y equinos</p>
              <div className="flex justify-between items-center pt-4 border-t border-white border-opacity-20">
                <span className="text-sm font-semibold">{getCategoryCount('Ganado')} avisos</span>
                <span className="group-hover:translate-x-2 transition-transform">?</span>
              </div>
            </div>
          </button>

          {/* Fila 3 */}
          {/* Banner 5 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-4xl mb-2"><Megaphone className="w-10 h-10 text-gray-400" /></div>
              <h3 className="text-lg font-bold text-gray-600">Tu Anuncio Aqu�</h3>
              <p className="text-sm text-gray-500">300x250px</p>
            </div>
          </div>

          {/* Insumos Agr�colas */}
          <button
            onClick={() => onCategoryClick?.('insumos')}
            className="text-left group"
          >
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg p-8 text-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all h-full cursor-pointer">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform"><Wheat className="w-12 h-12" /></div>
              <h3 className="text-xl font-bold mb-2">Insumos Agr�colas</h3>
              <p className="text-white text-sm opacity-90 mb-4">Semillas, fertilizantes y qu�micos</p>
              <div className="flex justify-between items-center pt-4 border-t border-white border-opacity-20">
                <span className="text-sm font-semibold">{getCategoryCount('Insumos Agr�colas')} avisos</span>
                <span className="group-hover:translate-x-2 transition-transform">?</span>
              </div>
            </div>
          </button>

          {/* Banner 6 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-4xl mb-2"><Megaphone className="w-10 h-10 text-gray-400" /></div>
              <h3 className="text-lg font-bold text-gray-600">Tu Anuncio Aqu�</h3>
              <p className="text-sm text-gray-500">300x250px</p>
            </div>
          </div>

          {/* Fila 4 */}
          {/* Servicios */}
          <button
            onClick={() => onCategoryClick?.('servicios')}
            className="text-left group"
          >
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg p-8 text-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all h-full cursor-pointer">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform"><Briefcase className="w-12 h-12" /></div>
              <h3 className="text-xl font-bold mb-2">Servicios</h3>
              <p className="text-white text-sm opacity-90 mb-4">Asesoramiento y servicios profesionales</p>
              <div className="flex justify-between items-center pt-4 border-t border-white border-opacity-20">
                <span className="text-sm font-semibold">{getCategoryCount('Servicios')} avisos</span>
                <span className="group-hover:translate-x-2 transition-transform">?</span>
              </div>
            </div>
          </button>

          {/* Banner 7 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-4xl mb-2"><Megaphone className="w-10 h-10 text-gray-400" /></div>
              <h3 className="text-lg font-bold text-gray-600">Tu Anuncio Aqu�</h3>
              <p className="text-sm text-gray-500">300x250px</p>
            </div>
          </div>

          {/* Banner 8 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-4xl mb-2"><Megaphone className="w-10 h-10 text-gray-400" /></div>
              <h3 className="text-lg font-bold text-gray-600">Tu Anuncio Aqu�</h3>
              <p className="text-sm text-gray-500">300x250px</p>
            </div>
          </div>

          {/* Fila 5 */}
          {/* Banner 9 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-4xl mb-2"><Megaphone className="w-10 h-10 text-gray-400" /></div>
              <h3 className="text-lg font-bold text-gray-600">Tu Anuncio Aqu�</h3>
              <p className="text-sm text-gray-500">300x250px</p>
            </div>
          </div>

          {/* Tierras y Campos */}
          <button
            onClick={() => onCategoryClick?.('tierras')}
            className="text-left group"
          >
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg p-8 text-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all h-full cursor-pointer">
              <div className="mb-4 group-hover:scale-110 transition-transform"><MapPin className="w-12 h-12" /></div>
              <h3 className="text-xl font-bold mb-2">Campos y Tierras</h3>
              <p className="text-white text-sm opacity-90 mb-4">Campos, lotes y propiedades rurales</p>
              <div className="flex justify-between items-center pt-4 border-t border-white border-opacity-20">
                <span className="text-sm font-semibold">{getCategoryCount('Campos y Tierras')} avisos</span>
                <span className="group-hover:translate-x-2 transition-transform">?</span>
              </div>
            </div>
          </button>

          {/* Banner 10 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8">
            <div className="text-center">
              <div className="flex justify-center mb-2"><Megaphone className="w-10 h-10 text-gray-400" /></div>
              <h3 className="text-lg font-bold text-gray-600">Tu Anuncio Aqu�</h3>
              <p className="text-sm text-gray-500">300x250px</p>
            </div>
          </div>

          {/* Fila 6 */}
          {/* Banner 11 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-4xl mb-2"><Megaphone className="w-10 h-10 text-gray-400" /></div>
              <h3 className="text-lg font-bold text-gray-600">Tu Anuncio Aqu�</h3>
              <p className="text-sm text-gray-500">300x250px</p>
            </div>
          </div>

          {/* Banner 12 */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-4xl mb-2"><Megaphone className="w-10 h-10 text-gray-400" /></div>
              <h3 className="text-lg font-bold text-gray-600">Tu Anuncio Aqu�</h3>
              <p className="text-sm text-gray-500">300x250px</p>
            </div>
          </div>

          {/* Equipos y Herramientas */}
          <button
            onClick={() => onCategoryClick?.('equipos')}
            className="text-left group"
          >
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg p-8 text-white shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all h-full cursor-pointer">
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform"><Wrench className="w-12 h-12" /></div>
              <h3 className="text-xl font-bold mb-2">Equipos y Herramientas</h3>
              <p className="text-white text-sm opacity-90 mb-4">Herramientas manuales y equipos</p>
              <div className="flex justify-between items-center pt-4 border-t border-white border-opacity-20">
                <span className="text-sm font-semibold">{getCategoryCount('Equipos y Herramientas')} avisos</span>
                <span className="group-hover:translate-x-2 transition-transform">?</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};

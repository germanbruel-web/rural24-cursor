import React from 'react';

interface HeroSectionProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch, isLoading }) => {
  const [searchInput, setSearchInput] = React.useState('');

  const handleSearch = () => {
    if (searchInput.trim()) {
      onSearch(searchInput);
    }
  };

  return (
    <section className="bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] text-gray-900 py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-[#004c3f]">
            Encontrá todo para el agro
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            El motor de búsqueda más completo de productos y servicios agrícolas argentinos
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscá tractores, sembradoras, campos..."
              className="flex-1 px-6 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e5a21f]"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-[#e5a21f] hover:bg-[#d4921a] text-white font-bold px-8 py-4 rounded-lg transition-colors disabled:opacity-50"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-[#e5a21f] mb-2">1000+</div>
            <div className="text-gray-100">Productos</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#e5a21f] mb-2">50+</div>
            <div className="text-gray-100">Proveedores</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-[#e5a21f] mb-2">24/7</div>
            <div className="text-gray-100">Disponible</div>
          </div>
        </div>
      </div>
    </section>
  );
};

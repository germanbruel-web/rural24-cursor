/**
 * Ejemplo de Página Migrada al Design System
 * 
 * Esta página demuestra cómo usar:
 * - BaseLayout para estructura consistente
 * - Componentes del Design System (Button, Input, Badge, FormField)
 * - Enfoque Mobile First en todos los layouts
 * - Dark mode automático
 */

import React, { useState } from 'react';
import { BaseLayout } from '../layouts/BaseLayout';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Badge } from '../atoms/Badge';
import { FormField } from '../molecules/FormField';
import { Search, Filter, MapPin, Star, CheckCircle } from 'lucide-react';

interface ExampleMigratedPageProps {
  onNavigate: (page: any) => void;
}

export const ExampleMigratedPage: React.FC<ExampleMigratedPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <BaseLayout
      onNavigate={onNavigate}
      maxWidth="7xl"
      padding="default"
      backgroundColor="gray"
    >
      {/* Hero Section - Mobile First */}
      <section className="mb-8 sm:mb-12">
        <div className="text-center max-w-3xl mx-auto">
          <Badge variant="success" className="mb-4">
            ✨ Diseño Mobile First
          </Badge>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Ejemplo de Página Migrada
          </h1>
          
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6">
            Esta página usa el Design System Rural24 con enfoque Mobile First
          </p>

          {/* Search Bar - Mobile First */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <Input
              placeholder="Buscar tractores, cosechadoras..."
              leftIcon={<Search size={18} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              wrapperClassName="flex-1"
            />
            <Button 
              variant="primary" 
              size="lg"
              leftIcon={<Search size={18} />}
              className="w-full sm:w-auto"
            >
              Buscar
            </Button>
          </div>
        </div>
      </section>

      {/* Filters - Mobile First con scroll horizontal en mobile */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Filtros Rápidos
          </h2>
          <Button variant="ghost" size="sm" leftIcon={<Filter size={16} />}>
            <span className="hidden sm:inline">Más filtros</span>
            <span className="sm:hidden">Filtros</span>
          </Button>
        </div>

        {/* Badges con scroll horizontal en mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <Badge variant="primary" className="whitespace-nowrap">Tractores</Badge>
          <Badge variant="secondary" className="whitespace-nowrap">Cosechadoras</Badge>
          <Badge variant="success" className="whitespace-nowrap">Sembradoras</Badge>
          <Badge variant="neutral" className="whitespace-nowrap">Implementos</Badge>
          <Badge variant="outline" className="whitespace-nowrap">Repuestos</Badge>
        </div>
      </section>

      {/* Grid de Productos - Mobile First: 1 col → 2 cols → 3 cols → 4 cols */}
      <section className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Resultados de Búsqueda
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div 
              key={item} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Imagen */}
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative">
                <Badge 
                  variant="success" 
                  dot 
                  className="absolute top-2 right-2"
                >
                  Activo
                </Badge>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    Tractor John Deere 5075E
                  </h3>
                  <Badge variant="primary" size="sm" leftIcon={<Star size={12} />}>
                    Premium
                  </Badge>
                </div>

                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs mb-3">
                  <MapPin size={14} />
                  <span>Buenos Aires, Argentina</span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                    USD 45,000
                  </p>
                  <Badge variant="outline" size="sm">
                    2020
                  </Badge>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  leftIcon={<CheckCircle size={16} />}
                >
                  Ver Detalles
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Paginación - Mobile First */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Button variant="outline" size="sm">
            Anterior
          </Button>
          <div className="flex gap-2">
            <Button variant="primary" size="sm">1</Button>
            <Button variant="ghost" size="sm">2</Button>
            <Button variant="ghost" size="sm">3</Button>
            <Button variant="ghost" size="sm">4</Button>
          </div>
          <Button variant="outline" size="sm">
            Siguiente
          </Button>
        </div>
      </section>

      {/* Form Example - Mobile First */}
      <section className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Formulario de Contacto
        </h2>

        <div className="space-y-4">
          <FormField
            label="Nombre completo"
            name="name"
            placeholder="Juan Pérez"
            required
          />

          <FormField
            label="Email"
            name="email"
            type="email"
            placeholder="juan@ejemplo.com"
            required
            description="Te responderemos a este email"
          />

          <FormField
            label="Teléfono"
            name="phone"
            type="tel"
            placeholder="+54 9 11 1234-5678"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mensaje
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              placeholder="Cuéntanos qué necesitas..."
            />
          </div>

          {/* Botones - Stack en mobile, row en desktop */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="primary" 
              size="lg" 
              className="flex-1"
            >
              Enviar Mensaje
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </section>

      {/* Info Cards - Mobile First: Stack → Grid */}
      <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-3">🚜</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            +10,000 Avisos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            La mayor plataforma agrícola
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            100% Verificado
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Todos los vendedores validados
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
          <div className="text-4xl mb-3">⚡</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Respuesta Rápida
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Contacto directo con vendedores
          </p>
        </div>
      </section>

    </BaseLayout>
  );
};

/**
 * Ejemplo de Uso del Button Component
 * Demostraciones prácticas de todos los casos de uso
 */

import React from 'react';
import { Button } from '../Button';
import { Save, Trash2, Download, Send, ArrowRight, Plus, Edit, Check } from 'lucide-react';

export function ButtonExamples() {
  return (
    <div className="p-8 space-y-8 bg-gray-50">
      
      {/* Sección 1: Variantes */}
      <section>
        <h2 className="text-2xl font-bold mb-4">1. Variantes</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="success">Success</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      {/* Sección 2: Tamaños */}
      <section>
        <h2 className="text-2xl font-bold mb-4">2. Tamaños</h2>
        <div className="flex items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
          <Button size="icon" aria-label="Add">
            <Plus size={20} />
          </Button>
        </div>
      </section>

      {/* Sección 3: Con Iconos */}
      <section>
        <h2 className="text-2xl font-bold mb-4">3. Botones con Iconos</h2>
        <div className="flex flex-wrap gap-3">
          <Button leftIcon={<Save size={16} />}>
            Guardar
          </Button>
          <Button rightIcon={<ArrowRight size={16} />}>
            Continuar
          </Button>
          <Button 
            variant="danger" 
            leftIcon={<Trash2 size={16} />}
          >
            Eliminar
          </Button>
          <Button 
            variant="success" 
            leftIcon={<Download size={16} />}
          >
            Descargar
          </Button>
        </div>
      </section>

      {/* Sección 4: Estados */}
      <section>
        <h2 className="text-2xl font-bold mb-4">4. Estados</h2>
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button>Normal</Button>
            <Button loading>Loading...</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex gap-3">
            <Button variant="danger">Normal</Button>
            <Button variant="danger" loading>Eliminando...</Button>
            <Button variant="danger" disabled>Disabled</Button>
          </div>
        </div>
      </section>

      {/* Sección 5: Ancho Completo */}
      <section>
        <h2 className="text-2xl font-bold mb-4">5. Ancho Completo</h2>
        <div className="space-y-2 max-w-md">
          <Button fullWidth>Botón Ancho Completo</Button>
          <Button fullWidth variant="outline">
            Botón Outline Full Width
          </Button>
        </div>
      </section>

      {/* Sección 6: Ejemplo Práctico - Formulario */}
      <section>
        <h2 className="text-2xl font-bold mb-4">6. Ejemplo: Formulario de Contacto</h2>
        <div className="max-w-md bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Contactar al Vendedor</h3>
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Nombre completo"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <textarea
              placeholder="Mensaje"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                type="button"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                leftIcon={<Send size={16} />}
                className="flex-1"
              >
                Enviar
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Sección 7: Ejemplo Práctico - Acciones de Card */}
      <section>
        <h2 className="text-2xl font-bold mb-4">7. Ejemplo: Acciones de Producto</h2>
        <div className="max-w-sm bg-white rounded-xl shadow-lg overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400"
            alt="Tractor"
            className="w-full h-48 object-cover"
          />
          <div className="p-6">
            <h3 className="text-xl font-bold mb-2">Tractor John Deere 6150R</h3>
            <p className="text-gray-600 mb-4">
              Excelente estado, 2500 horas, documentación al día.
            </p>
            <div className="text-3xl font-bold text-primary-600 mb-4">
              $85.000
            </div>
            <div className="space-y-2">
              <Button fullWidth variant="primary" leftIcon={<Send size={16} />}>
                Contactar Vendedor
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Edit size={16} />
                </Button>
                <Button variant="ghost" className="flex-1">
                  Compartir
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección 8: Ejemplo Práctico - Confirmación */}
      <section>
        <h2 className="text-2xl font-bold mb-4">8. Ejemplo: Modal de Confirmación</h2>
        <div className="max-w-md bg-white rounded-xl shadow-xl p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">¿Eliminar Aviso?</h3>
            <p className="text-gray-600">
              Esta acción no se puede deshacer. El aviso será eliminado permanentemente.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth>
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              fullWidth
              leftIcon={<Trash2 size={16} />}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </section>

      {/* Sección 9: Ejemplo Práctico - Success State */}
      <section>
        <h2 className="text-2xl font-bold mb-4">9. Ejemplo: Estado de Éxito</h2>
        <div className="max-w-md bg-white rounded-xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="text-green-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">¡Mensaje Enviado!</h3>
            <p className="text-gray-600">
              El vendedor recibirá tu mensaje en breve.
            </p>
          </div>
          <Button variant="success" fullWidth>
            Entendido
          </Button>
        </div>
      </section>

      {/* Sección 10: Grupo de Botones */}
      <section>
        <h2 className="text-2xl font-bold mb-4">10. Grupos de Botones</h2>
        <div className="space-y-4">
          {/* Grupo horizontal */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Anterior
            </Button>
            <Button variant="outline" size="sm">
              1
            </Button>
            <Button variant="primary" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              Siguiente
            </Button>
          </div>

          {/* Grupo de filtros */}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm">
              Todos
            </Button>
            <Button variant="ghost" size="sm">
              Activos
            </Button>
            <Button variant="ghost" size="sm">
              Pausados
            </Button>
            <Button variant="ghost" size="sm">
              Vendidos
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}

export default ButtonExamples;

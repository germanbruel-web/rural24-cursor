// ====================================================================
// EJEMPLO DE MIGRACIÓN - PublicarAviso con Design System
// Este ejemplo muestra cómo migrar gradualmente al nuevo sistema
// ====================================================================

import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent, 
  Container, 
  VStack, 
  Badge 
} from '../design-system';
import { Plus, MapPin, Camera, FileText } from 'lucide-react';

/**
 * EJEMPLO: Primer paso del wizard de publicación
 * Muestra cómo usar los componentes del design system
 */
export function PublicarAvisoStep1Example() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    
    console.log('Formulario válido:', { title, description });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <Container size="lg">
        <VStack spacing="xl">
          {/* Header */}
          <div className="text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Publicar Aviso
              </h1>
              <Badge variant="info">Nuevo</Badge>
            </div>
            <p className="text-gray-600">
              Completa los datos para publicar tu aviso
            </p>
          </div>

          {/* Steps indicator */}
          <Card variant="outlined" padding="sm">
            <div className="flex items-center gap-2 overflow-x-auto">
              <StepIndicator active icon={FileText} label="Información" />
              <StepSeparator />
              <StepIndicator icon={MapPin} label="Ubicación" />
              <StepSeparator />
              <StepIndicator icon={Camera} label="Fotos" />
            </div>
          </Card>

          {/* Main form */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Ingresa el título y descripción de tu aviso
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit}>
                <VStack spacing="lg">
                  {/* Título */}
                  <Input
                    label="Título del aviso"
                    placeholder="Ej: Tractor John Deere 6125R 2020"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={error}
                    required
                    helperText="Describe brevemente lo que publicas"
                  />

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Descripción
                      <span className="text-gray-400 ml-1">(opcional)</span>
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      rows={4}
                      placeholder="Describe las características, estado, etc."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <p className="mt-1.5 text-sm text-gray-500">
                      {description.length} / 500 caracteres
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      variant="outline"
                      fullWidth
                      type="button"
                      onClick={() => console.log('Cancelar')}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      type="submit"
                      rightIcon={<Plus className="w-5 h-5" />}
                    >
                      Siguiente Paso
                    </Button>
                  </div>
                </VStack>
              </form>
            </CardContent>
          </Card>

          {/* Info card */}
          <Card variant="elevated" padding="lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-info" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  💡 Consejos para un buen aviso
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Usa un título descriptivo y claro</li>
                  <li>• Incluye marca, modelo y año cuando aplique</li>
                  <li>• Describe el estado y características principales</li>
                </ul>
              </div>
            </div>
          </Card>
        </VStack>
      </Container>
    </div>
  );
}

// ====================================================================
// COMPONENTS AUXILIARES
// ====================================================================

interface StepIndicatorProps {
  active?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

function StepIndicator({ active, icon: Icon, label }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all">
      <div className={`
        w-8 h-8 rounded-lg flex items-center justify-center transition-all
        ${active 
          ? 'bg-primary-500 text-white' 
          : 'bg-gray-200 text-gray-400'
        }
      `}>
        <Icon className="w-4 h-4" />
      </div>
      <span className={`
        text-sm font-medium whitespace-nowrap
        ${active ? 'text-gray-900' : 'text-gray-500'}
      `}>
        {label}
      </span>
    </div>
  );
}

function StepSeparator() {
  return (
    <div className="flex-1 h-0.5 bg-gray-200 min-w-4" />
  );
}

// ====================================================================
// COMPARACIÓN ANTES/DESPUÉS
// ====================================================================

/**
 * ANTES (sin design system):
 * 
 * <button className="flex items-center gap-2 px-6 py-3 bg-brand-400 text-white rounded-xl hover:bg-brand-500 transition-all font-semibold shadow-lg shadow-brand-200">
 *   Siguiente Paso
 * </button>
 * 
 * DESPUÉS (con design system):
 * 
 * <Button variant="primary" rightIcon={<Plus />}>
 *   Siguiente Paso
 * </Button>
 * 
 * BENEFICIOS:
 * ✅ Menos código (70% reducción)
 * ✅ Consistencia automática
 * ✅ Props semánticas (variant en lugar de clases)
 * ✅ Estados incluidos (loading, disabled)
 * ✅ Accesibilidad (focus, keyboard)
 */

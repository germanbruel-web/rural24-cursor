/**
 * Showcase del Nuevo Design System
 * Ejemplos visuales de todos los elementos
 */

import React, { useState } from 'react';
import { Button, Input, Label, Badge } from './atoms';
import { FormField } from './molecules';
import { 
  Save, Trash2, Download, Send, Moon, Sun,
  CheckCircle, AlertCircle, Info, AlertTriangle, Mail, Lock, Search, User, Clock, Star, Tag
} from 'lucide-react';

export function DesignSystemShowcase() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300">
        
        {/* Header con Toggle Dark Mode */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
          <div className="container-custom py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              Design System Rural24
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
          </div>
        </header>

        <main className="container-custom py-12 space-y-16">
          
          {/* SECCIÓN 1: COLORES */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Paleta de Colores</h2>
            
            {/* Brand Colors */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Brand (Principal)</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-11 gap-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(shade => (
                  <div key={shade} className="space-y-1">
                    <div className={`h-20 rounded-lg bg-brand-${shade} border border-neutral-200 dark:border-neutral-700`} />
                    <p className="text-xs text-center">{shade}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Semantic Colors */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="card p-6">
                <div className="h-16 rounded-lg bg-success-500 mb-3" />
                <p className="font-semibold">Success</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Operaciones exitosas</p>
              </div>
              <div className="card p-6">
                <div className="h-16 rounded-lg bg-warning-500 mb-3" />
                <p className="font-semibold">Warning</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Advertencias</p>
              </div>
              <div className="card p-6">
                <div className="h-16 rounded-lg bg-error-500 mb-3" />
                <p className="font-semibold">Error</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Errores críticos</p>
              </div>
              <div className="card p-6">
                <div className="h-16 rounded-lg bg-info-500 mb-3" />
                <p className="font-semibold">Info</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Información</p>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: TIPOGRAFÍA */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Tipografía</h2>
            <div className="card p-8 space-y-4">
              <h1>Heading 1 - Display</h1>
              <h2>Heading 2 - Title</h2>
              <h3>Heading 3 - Section</h3>
              <h4>Heading 4 - Subsection</h4>
              <h5>Heading 5 - Small Title</h5>
              <h6>Heading 6 - Label</h6>
              <p className="text-lg">Paragraph Large - Introducción destacada</p>
              <p>Paragraph Base - Contenido principal de lectura</p>
              <p className="text-sm">Paragraph Small - Notas y descripciones</p>
              <p className="text-xs">Paragraph Extra Small - Información secundaria</p>
            </div>
          </section>

          {/* SECCIÓN 3: BOTONES */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Botones</h2>
            
            {/* Variantes */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Variantes</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="success">Success</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            {/* Tamaños */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Tamaños</h3>
              <div className="flex items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
            </div>

            {/* Con Iconos */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Con Iconos</h3>
              <div className="flex flex-wrap gap-3">
                <Button leftIcon={<Save size={16} />}>Guardar</Button>
                <Button variant="danger" leftIcon={<Trash2 size={16} />}>Eliminar</Button>
                <Button variant="outline" rightIcon={<Download size={16} />}>Descargar</Button>
                <Button variant="success" leftIcon={<Send size={16} />}>Enviar</Button>
              </div>
            </div>
          </section>

          {/* SECCIÓN 4: INPUTS Y FORMULARIOS */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Inputs & Formularios</h2>
            
            {/* Inputs básicos */}
            <div className="card p-8 mb-6">
              <h3 className="text-xl font-bold mb-6">Variantes de Input</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Outlined</Label>
                  <Input variant="outlined" placeholder="Outlined input" />
                </div>
                <div>
                  <Label>Filled</Label>
                  <Input variant="filled" placeholder="Filled input" />
                </div>
                <div>
                  <Label>Ghost</Label>
                  <Input variant="ghost" placeholder="Ghost input" />
                </div>
              </div>
            </div>

            {/* Tamaños */}
            <div className="card p-8 mb-6">
              <h3 className="text-xl font-bold mb-6">Tamaños</h3>
              <div className="space-y-4 max-w-md">
                <Input size="sm" placeholder="Small input" />
                <Input size="md" placeholder="Medium input (default)" />
                <Input size="lg" placeholder="Large input" />
              </div>
            </div>

            {/* Con iconos */}
            <div className="card p-8 mb-6">
              <h3 className="text-xl font-bold mb-6">Con Iconos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div>
                  <Label>Email</Label>
                  <Input leftIcon={<Mail size={18} />} type="email" placeholder="tu@email.com" />
                </div>
                <div>
                  <Label>Usuario</Label>
                  <Input leftIcon={<User size={18} />} placeholder="nombre_usuario" />
                </div>
                <div>
                  <Label>Contraseña</Label>
                  <Input leftIcon={<Lock size={18} />} type="password" placeholder="••••••••" />
                </div>
                <div>
                  <Label>Búsqueda</Label>
                  <Input leftIcon={<Search size={18} />} placeholder="Buscar..." />
                </div>
              </div>
            </div>

            {/* Estados de validación */}
            <div className="card p-8 mb-6">
              <h3 className="text-xl font-bold mb-6">Estados de Validación</h3>
              <div className="space-y-6 max-w-md">
                <div>
                  <Label>Con ayuda</Label>
                  <Input 
                    helperText="Ingresá tu dirección de email principal" 
                    placeholder="Email"
                  />
                </div>
                <div>
                  <Label required>Con error</Label>
                  <Input 
                    error="Este campo es obligatorio" 
                    placeholder="Campo requerido"
                  />
                </div>
                <div>
                  <Label>Con éxito</Label>
                  <Input 
                    success="Email verificado correctamente" 
                    defaultValue="usuario@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Formulario completo */}
            <div className="card p-8 max-w-2xl">
              <h3 className="text-xl font-bold mb-6">Formulario de Contacto</h3>
              <form className="space-y-6">
                <div>
                  <Label htmlFor="name" required>Nombre completo</Label>
                  <Input 
                    id="name"
                    leftIcon={<User size={18} />}
                    type="text" 
                    placeholder="Juan Pérez"
                  />
                </div>

                <div>
                  <Label htmlFor="email" required>Email</Label>
                  <Input 
                    id="email"
                    leftIcon={<Mail size={18} />}
                    type="email" 
                    placeholder="juan@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="message" required description="Máximo 500 caracteres">
                    Mensaje
                  </Label>
                  <textarea 
                    id="message"
                    className="flex w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-3 text-base transition-all duration-200 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 min-h-[120px]"
                    placeholder="Escribí tu mensaje aquí..."
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" type="button" className="flex-1">
                    Cancelar
                  </Button>
                  <Button variant="primary" type="submit" className="flex-1">
                    Enviar Mensaje
                  </Button>
                </div>
              </form>
            </div>
          </section>

          {/* SECCIÓN 5: CARDS */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Cards</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Card Simple */}
              <div className="card p-6">
                <h3 className="text-lg font-bold mb-2">Card Simple</h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Card básica con borde y sombra suave
                </p>
              </div>

              {/* Card con Hover */}
              <div className="card-hover p-6">
                <h3 className="text-lg font-bold mb-2">Card con Hover</h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Efecto hover con elevación
                </p>
              </div>

              {/* Glass Card */}
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-2">Glass Effect</h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Efecto vidrio con backdrop blur
                </p>
              </div>
            </div>
          </section>

          {/* SECCIÓN 6: ALERTAS */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Alertas y Notificaciones</h2>
            <div className="space-y-4 max-w-2xl">
              {/* Success */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20">
                <CheckCircle className="text-success-600 dark:text-success-400 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-success-900 dark:text-success-100">
                    Operación exitosa
                  </p>
                  <p className="text-sm text-success-700 dark:text-success-200">
                    Los cambios se guardaron correctamente
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20">
                <AlertTriangle className="text-warning-600 dark:text-warning-400 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-warning-900 dark:text-warning-100">
                    Advertencia
                  </p>
                  <p className="text-sm text-warning-700 dark:text-warning-200">
                    Verificá los datos antes de continuar
                  </p>
                </div>
              </div>

              {/* Error */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20">
                <AlertCircle className="text-error-600 dark:text-error-400 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-error-900 dark:text-error-100">
                    Error
                  </p>
                  <p className="text-sm text-error-700 dark:text-error-200">
                    No se pudo completar la operación
                  </p>
                </div>
              </div>

              {/* Info */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-info-50 dark:bg-info-500/10 border border-info-200 dark:border-info-500/20">
                <Info className="text-info-600 dark:text-info-400 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold text-info-900 dark:text-info-100">
                    Información
                  </p>
                  <p className="text-sm text-info-700 dark:text-info-200">
                    Nueva actualización disponible
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 7: BADGES */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Badges</h2>
            
            <div className="card p-8 mb-6">
              <h3 className="text-xl font-bold mb-6">Variantes</h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="primary">Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="neutral">Neutral</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>

            <div className="card p-8 mb-6">
              <h3 className="text-xl font-bold mb-6">Con Estados</h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="success" dot>Activo</Badge>
                <Badge variant="warning" dot>Pendiente</Badge>
                <Badge variant="danger" dot>Rechazado</Badge>
                <Badge variant="neutral" dot>Pausado</Badge>
              </div>
            </div>

            <div className="card p-8">
              <h3 className="text-xl font-bold mb-6">Con Iconos</h3>
              <div className="flex flex-wrap gap-3">
                <Badge variant="success" leftIcon={<CheckCircle size={14} />}>Verificado</Badge>
                <Badge variant="warning" leftIcon={<Clock size={14} />}>Pendiente</Badge>
                <Badge variant="primary" leftIcon={<Star size={14} />}>Destacado</Badge>
                <Badge variant="secondary" leftIcon={<Tag size={14} />}>Categoría</Badge>
              </div>
            </div>
          </section>

          {/* SECCIÓN 8: FORMULARIO COMPLETO */}
          <section>
            <h2 className="text-3xl font-bold mb-6">Formulario con FormField</h2>
            <div className="card p-8 max-w-2xl">
              <h3 className="text-xl font-bold mb-6">Ejemplo de Formulario Real</h3>
              <form className="space-y-6">
                <FormField
                  label="Email"
                  leftIcon={<Mail size={18} />}
                  type="email"
                  placeholder="tu@email.com"
                  required
                />
                
                <FormField
                  label="Contraseña"
                  leftIcon={<Lock size={18} />}
                  type="password"
                  placeholder="••••••••"
                  description="Mínimo 8 caracteres"
                  required
                />
                
                <FormField
                  label="Usuario"
                  leftIcon={<User size={18} />}
                  placeholder="nombre_usuario"
                  helperText="Solo letras, números y guiones bajos"
                />
                
                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" type="button" className="flex-1">
                    Cancelar
                  </Button>
                  <Button variant="primary" type="submit" className="flex-1">
                    Guardar
                  </Button>
                </div>
              </form>
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="border-t border-neutral-200 dark:border-neutral-800 mt-20">
          <div className="container-custom py-8">
            <p className="text-center text-neutral-600 dark:text-neutral-400">
              Design System Rural24 - Enero 2026
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default DesignSystemShowcase;

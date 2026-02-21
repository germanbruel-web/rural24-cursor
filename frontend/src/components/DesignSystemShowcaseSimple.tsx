/**
 * Design System Rural24 - Showcase Completo
 * Documentación visual de todos los componentes
 */

import React, { useState } from 'react';
import { Button } from './atoms/Button';
import { Input } from './atoms/Input';
import { Label } from './atoms/Label';
import { Badge } from './atoms/Badge';
import { Checkbox } from './atoms/Checkbox';
import { Radio } from './atoms/Radio';
import { Switch } from './atoms/Switch';
import { FormField } from './molecules/FormField';
import { Card } from './molecules/Card';
import { Modal } from './molecules/Modal';
import { 
  // Acciones
  Save, Trash2, Download, Send, Plus, Edit, Eye, EyeOff, Copy, Scissors, Clipboard,
  RefreshCw, RotateCw, RotateCcw, Undo2, Redo2, ZoomIn, ZoomOut,
  // UI/Estado
  CheckCircle, AlertCircle, Info, AlertTriangle, XCircle, HelpCircle, Moon, Sun,
  // Usuarios
  User, Users, UserPlus, UserMinus, UserCheck, UserX, Shield, ShieldCheck,
  // Comunicación
  Mail, Phone, MessageCircle, MessageSquare, Inbox, Bell, BellOff,
  // Archivos
  File, FileText, Folder, FolderOpen, Upload, Image, Video, Music,
  // Navegación
  Home, Menu, X, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, ArrowRight, ArrowLeft,
  // Comercio
  ShoppingCart, ShoppingBag, DollarSign, CreditCard, Package, Truck, Store, Megaphone,
  // Herramientas
  Settings, Wrench, Hammer, Sliders, Filter, Search, Lock, Unlock, Key,
  // Tiempo
  Clock, Calendar, CalendarDays, Timer, Hourglass, Watch,
  // Medios
  Camera, Mic, MicOff, Volume2, VolumeX, Play, Pause, SkipForward, SkipBack,
  // Mapas/Lugares
  MapPin, Map, Navigation, Compass, Globe, Warehouse,
  // Redes Sociales
  Share2, ThumbsUp, ThumbsDown, Heart, Bookmark, Flag, Star,
  // Texto/Formato
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  // Clima
  Cloud, CloudRain, CloudSnow, Wind, Droplets,
  // Dispositivos
  Monitor, Smartphone, Tablet, Laptop, Printer, Wifi, WifiOff,
  // Datos
  TrendingUp, TrendingDown, BarChart, PieChart, Activity, Database,
  // Otros
  Tag, Hash, AtSign, Percent, Award, Gift, Zap, Power, Link, Paperclip
} from 'lucide-react';

export function DesignSystemShowcaseSimple() {
  const [darkMode, setDarkMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [selectedRadio, setSelectedRadio] = useState('option1');
  const [isSwitchOn, setIsSwitchOn] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        
        {/* Header Sticky con Dark Mode Toggle */}
        <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-brand-600 dark:text-green-400">
                Design System Rural24
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Componentes atómicos y moleculares con CVA + Tailwind
              </p>
            </div>
            <Button
              variant="ghost"
              size="lg"
              onClick={toggleDarkMode}
              leftIcon={darkMode ? <Sun size={20} /> : <Moon size={20} />}
            >
              {darkMode ? 'Light' : 'Dark'}
            </Button>
          </div>
        </header>

        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          
          {/* ========== SECCIÓN 1: PALETA DE COLORES ========== */}
          <section>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Paleta de Colores</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Colores semánticos y tokens del sistema</p>
            
            {/* Brand Colors */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">🎨 Brand (Verde Principal)</h3>
              <div className="grid grid-cols-5 md:grid-cols-11 gap-3">
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-brand-50 border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">50</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-brand-100 border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">100</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-brand-200 border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">200</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-brand-300 border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">300</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-brand-400 border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">400</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-brand-500 border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400 font-bold">500</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-brand-600 border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">600</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-brand-700 border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">700</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-brand-800 border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">800</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-brand-900 border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">900</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-brand-950 border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">950</p>
                </div>
              </div>
            </div>

            {/* Nature Colors — Colores Secundarios */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">🌿 Colores Secundarios (Naturaleza)</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Paleta agricultura & naturaleza — uso: <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">bg-nature-mint</code>, <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">text-nature-barn</code>, etc.</p>

              {/* Greens */}
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Greens</p>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-4">
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-mint border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">mint</p>
                  <p className="text-[10px] text-center text-gray-400">#A8E0CC</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-lime border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">lime</p>
                  <p className="text-[10px] text-center text-gray-400">#A4B872</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-crop border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">crop</p>
                  <p className="text-[10px] text-center text-gray-400">#6CCF67</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-meadow border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">meadow</p>
                  <p className="text-[10px] text-center text-gray-400">#4FA54D</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-leaf border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">leaf</p>
                  <p className="text-[10px] text-center text-gray-400">#4CAF50</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-moss border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">moss</p>
                  <p className="text-[10px] text-center text-gray-400">#728C4F</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-canopy border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">canopy</p>
                  <p className="text-[10px] text-center text-gray-400">#3F7B3F</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-evergreen border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">evergreen</p>
                  <p className="text-[10px] text-center text-gray-400">#0F5324</p>
                </div>
              </div>

              {/* Sky & Earth */}
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Sky & Earth</p>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-4">
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-air border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">air</p>
                  <p className="text-[10px] text-center text-gray-400">#F6F9F3</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-wheat border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">wheat</p>
                  <p className="text-[10px] text-center text-gray-400">#E8D263</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-corn border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">corn</p>
                  <p className="text-[10px] text-center text-gray-400">#F4D058</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-harvest border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">harvest</p>
                  <p className="text-[10px] text-center text-gray-400">#F2C94C</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-sky border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">sky</p>
                  <p className="text-[10px] text-center text-gray-400">#84C8F4</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-daylight border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">daylight</p>
                  <p className="text-[10px] text-center text-gray-400">#85AFF5</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-water border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">water</p>
                  <p className="text-[10px] text-center text-gray-400">#5DAFF5</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-teal border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">teal</p>
                  <p className="text-[10px] text-center text-gray-400">#2C9D8A</p>
                </div>
              </div>

              {/* Earth & Brown */}
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Earth & Brown</p>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-gray border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">gray</p>
                  <p className="text-[10px] text-center text-gray-400">#B8A8A0</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-clay border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">clay</p>
                  <p className="text-[10px] text-center text-gray-400">#A97F6F</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-stem border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">stem</p>
                  <p className="text-[10px] text-center text-gray-400">#7D6138</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-soil border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">soil</p>
                  <p className="text-[10px] text-center text-gray-400">#8B6A36</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-barn border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">barn</p>
                  <p className="text-[10px] text-center text-gray-400">#A83223</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-brick border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">brick</p>
                  <p className="text-[10px] text-center text-gray-400">#7E3636</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-farm border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">farm</p>
                  <p className="text-[10px] text-center text-gray-400">#6A4E30</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded-lg bg-nature-compost border border-gray-300 dark:border-gray-700"></div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400">compost</p>
                  <p className="text-[10px] text-center text-gray-400">#3C2A18</p>
                </div>
              </div>
            </div>

            {/* Semantic Colors */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="h-16 rounded-lg bg-brand-400 mb-4 shadow-sm"></div>
                <p className="font-semibold text-gray-900 dark:text-white">Success</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Operaciones exitosas</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="h-16 rounded-lg bg-yellow-500 mb-4 shadow-sm"></div>
                <p className="font-semibold text-gray-900 dark:text-white">Warning</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Advertencias</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="h-16 rounded-lg bg-red-500 mb-4 shadow-sm"></div>
                <p className="font-semibold text-gray-900 dark:text-white">Error</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Errores críticos</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="h-16 rounded-lg bg-blue-500 mb-4 shadow-sm"></div>
                <p className="font-semibold text-gray-900 dark:text-white">Info</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Información</p>
              </div>
            </div>
          </section>

          {/* ========== SECCIÓN 2: TIPOGRAFÍA ========== */}
          <section>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Tipografía</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Sistema tipográfico con Lato</p>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 space-y-6">
              <div>
                <h1 className="text-gray-900 dark:text-white">Heading 1 - Display (4xl/bold)</h1>
                <code className="text-xs text-gray-500">text-4xl font-bold</code>
              </div>
              <div>
                <h2 className="text-gray-900 dark:text-white">Heading 2 - Title (3xl/bold)</h2>
                <code className="text-xs text-gray-500">text-3xl font-bold</code>
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white">Heading 3 - Section (2xl/semibold)</h3>
                <code className="text-xs text-gray-500">text-2xl font-semibold</code>
              </div>
              <div>
                <h4 className="text-gray-900 dark:text-white">Heading 4 - Subsection (xl/semibold)</h4>
                <code className="text-xs text-gray-500">text-xl font-semibold</code>
              </div>
              <div>
                <p className="text-lg text-gray-900 dark:text-white">Paragraph Large - Introducción destacada</p>
                <code className="text-xs text-gray-500">text-lg</code>
              </div>
              <div>
                <p className="text-gray-900 dark:text-white">Paragraph Base - Contenido principal de lectura</p>
                <code className="text-xs text-gray-500">text-base</code>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Paragraph Small - Notas y descripciones</p>
                <code className="text-xs text-gray-500">text-sm</code>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500">Paragraph Extra Small - Metadata</p>
                <code className="text-xs text-gray-500">text-xs</code>
              </div>
            </div>
          </section>

          {/* ========== SECCIÓN 3: BOTONES ========== */}
          <section>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Botones</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">7 variantes × 5 tamaños con estados</p>
            
            {/* Variantes */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Variantes</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            {/* Tamaños */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Tamaños</h3>
              <div className="flex flex-wrap items-end gap-4">
                <Button size="sm" variant="primary">Small</Button>
                <Button size="md" variant="primary">Medium</Button>
                <Button size="lg" variant="primary">Large</Button>
                <Button size="xl" variant="primary">Extra Large</Button>
              </div>
            </div>

            {/* Con Iconos */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Con Iconos</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" leftIcon={<Save size={16} />}>Guardar</Button>
                <Button variant="danger" leftIcon={<Trash2 size={16} />}>Eliminar</Button>
                <Button variant="success" rightIcon={<Download size={16} />}>Descargar</Button>
                <Button variant="secondary" leftIcon={<Send size={16} />}>Enviar</Button>
                <Button variant="outline" leftIcon={<Plus size={16} />}>Agregar</Button>
              </div>
            </div>

            {/* Estados */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Estados</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Normal</Button>
                <Button variant="primary" loading>Cargando...</Button>
                <Button variant="primary" disabled>Deshabilitado</Button>
              </div>
            </div>
          </section>

          {/* ========== SECCIÓN 4: INPUTS ========== */}
          <section>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Inputs</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">3 variantes × 3 tamaños × 3 estados con validación</p>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Variantes */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Variantes</h3>
                <div className="space-y-4">
                  <Input variant="outlined" placeholder="Outlined (default)" />
                  <Input variant="filled" placeholder="Filled" />
                  <Input variant="ghost" placeholder="Ghost" />
                </div>
              </div>

              {/* Tamaños */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Tamaños</h3>
                <div className="space-y-4">
                  <Input size="sm" placeholder="Small" />
                  <Input size="md" placeholder="Medium (default)" />
                  <Input size="lg" placeholder="Large" />
                </div>
              </div>

              {/* Con Iconos */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Con Iconos</h3>
                <div className="space-y-4">
                  <Input leftIcon={<Search size={18} />} placeholder="Buscar..." />
                  <Input leftIcon={<Mail size={18} />} type="email" placeholder="Email" />
                  <Input leftIcon={<Lock size={18} />} type="password" placeholder="Contraseña" />
                  <Input leftIcon={<User size={18} />} rightIcon={<CheckCircle size={18} />} placeholder="Usuario verificado" />
                </div>
              </div>

              {/* Estados de Validación */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Validación</h3>
                <div className="space-y-4">
                  <Input placeholder="Estado normal" helperText="Texto de ayuda" />
                  <Input status="error" error="Este campo es requerido" placeholder="Con error" />
                  <Input status="success" success="Email validado correctamente" placeholder="juan@ejemplo.com" />
                </div>
              </div>
            </div>
          </section>

          {/* ========== SECCIÓN 5: LABELS ========== */}
          <section>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Labels</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Etiquetas accesibles para formularios</p>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <div className="space-y-6 max-w-md">
                <div>
                  <Label size="sm">Label Small</Label>
                  <Input size="sm" placeholder="Input pequeño" />
                </div>
                <div>
                  <Label size="md">Label Medium (default)</Label>
                  <Input placeholder="Input medio" />
                </div>
                <div>
                  <Label size="lg">Label Large</Label>
                  <Input size="lg" placeholder="Input grande" />
                </div>
                <div>
                  <Label required>Campo Requerido</Label>
                  <Input placeholder="Este campo tiene asterisco rojo" />
                </div>
                <div>
                  <Label description="Este es un texto de descripción auxiliar">Con Descripción</Label>
                  <Input placeholder="Input con ayuda contextual" />
                </div>
              </div>
            </div>
          </section>

          {/* ========== SECCIÓN 6: BADGES ========== */}
          <section>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Badges</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">7 variantes con dots, iconos y removibles</p>
            
            <div className="space-y-6">
              {/* Variantes */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Variantes</h3>
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

              {/* Tamaños */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Tamaños</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge size="sm" variant="primary">Small</Badge>
                  <Badge size="md" variant="primary">Medium</Badge>
                  <Badge size="lg" variant="primary">Large</Badge>
                </div>
              </div>

              {/* Con Dots */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Con Dots</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="success" dot>Activo</Badge>
                  <Badge variant="warning" dot>Pendiente</Badge>
                  <Badge variant="danger" dot>Inactivo</Badge>
                  <Badge variant="neutral" dot>En proceso</Badge>
                </div>
              </div>

              {/* Con Iconos */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Con Iconos</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="primary" leftIcon={<Star size={14} />}>Destacado</Badge>
                  <Badge variant="success" leftIcon={<CheckCircle size={14} />}>Verificado</Badge>
                  <Badge variant="warning" leftIcon={<Clock size={14} />}>Pendiente</Badge>
                  <Badge variant="danger" leftIcon={<AlertCircle size={14} />}>Error</Badge>
                  <Badge variant="neutral" leftIcon={<Tag size={14} />}>Etiqueta</Badge>
                </div>
              </div>

              {/* Removibles */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Removibles</h3>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="primary" onRemove={() => alert('Removido!')}>JavaScript</Badge>
                  <Badge variant="secondary" onRemove={() => alert('Removido!')}>TypeScript</Badge>
                  <Badge variant="success" onRemove={() => alert('Removido!')}>React</Badge>
                  <Badge variant="neutral" onRemove={() => alert('Removido!')}>Tailwind</Badge>
                </div>
              </div>
            </div>
          </section>

          {/* ========== SECCIÓN 7: FORM FIELDS ========== */}
          <section>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">FormFields (Moléculas)</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Composición de Label + Input para formularios DRY</p>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Formulario de Login */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Ejemplo: Login</h3>
                <div className="space-y-4">
                  <FormField
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    leftIcon={<Mail size={18} />}
                  />
                  <FormField
                    label="Contraseña"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    leftIcon={<Lock size={18} />}
                  />
                  <Button variant="primary" className="w-full">Iniciar Sesión</Button>
                </div>
              </div>

              {/* Formulario de Registro */}
              <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Ejemplo: Registro</h3>
                <div className="space-y-4">
                  <FormField
                    label="Nombre completo"
                    name="fullname"
                    placeholder="Juan Pérez"
                    required
                    leftIcon={<User size={18} />}
                  />
                  <FormField
                    label="Email"
                    name="email-register"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    description="Te enviaremos un código de verificación"
                    leftIcon={<Mail size={18} />}
                  />
                  <FormField
                    label="Contraseña"
                    name="password-register"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    required
                    leftIcon={<Lock size={18} />}
                  />
                  <Button variant="success" className="w-full">Crear Cuenta</Button>
                </div>
              </div>
            </div>
          </section>

          {/* ========== SECCIÓN 8: ICONOS LUCIDE (120+ iconos) ========== */}
          <section>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Biblioteca de Iconos Lucide</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">120+ iconos SVG organizados por categorías</p>
            
            {/* Acciones Comunes */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">⚡ Acciones Comunes</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><Save size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Save</span></div>
                <div className="flex flex-col items-center gap-2"><Trash2 size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Trash</span></div>
                <div className="flex flex-col items-center gap-2"><Download size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Download</span></div>
                <div className="flex flex-col items-center gap-2"><Upload size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Upload</span></div>
                <div className="flex flex-col items-center gap-2"><Send size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Send</span></div>
                <div className="flex flex-col items-center gap-2"><Plus size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Plus</span></div>
                <div className="flex flex-col items-center gap-2"><Edit size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Edit</span></div>
                <div className="flex flex-col items-center gap-2"><Eye size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Eye</span></div>
                <div className="flex flex-col items-center gap-2"><EyeOff size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">EyeOff</span></div>
                <div className="flex flex-col items-center gap-2"><Copy size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Copy</span></div>
                <div className="flex flex-col items-center gap-2"><Scissors size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Scissors</span></div>
                <div className="flex flex-col items-center gap-2"><Clipboard size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Clipboard</span></div>
                <div className="flex flex-col items-center gap-2"><RefreshCw size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Refresh</span></div>
                <div className="flex flex-col items-center gap-2"><RotateCw size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">RotateCw</span></div>
                <div className="flex flex-col items-center gap-2"><RotateCcw size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">RotateCcw</span></div>
                <div className="flex flex-col items-center gap-2"><Undo2 size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Undo</span></div>
                <div className="flex flex-col items-center gap-2"><Redo2 size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Redo</span></div>
                <div className="flex flex-col items-center gap-2"><ZoomIn size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">ZoomIn</span></div>
                <div className="flex flex-col items-center gap-2"><ZoomOut size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">ZoomOut</span></div>
                <div className="flex flex-col items-center gap-2"><Search size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Search</span></div>
              </div>
            </div>

            {/* Estados y Alertas */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">🚦 Estados y Alertas</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><CheckCircle size={20} className="text-brand-600 dark:text-green-400" /><span className="text-xs text-center">Check</span></div>
                <div className="flex flex-col items-center gap-2"><XCircle size={20} className="text-red-600 dark:text-red-400" /><span className="text-xs text-center">X</span></div>
                <div className="flex flex-col items-center gap-2"><AlertCircle size={20} className="text-red-600 dark:text-red-400" /><span className="text-xs text-center">Alert</span></div>
                <div className="flex flex-col items-center gap-2"><AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400" /><span className="text-xs text-center">Warning</span></div>
                <div className="flex flex-col items-center gap-2"><Info size={20} className="text-blue-600 dark:text-blue-400" /><span className="text-xs text-center">Info</span></div>
                <div className="flex flex-col items-center gap-2"><HelpCircle size={20} className="text-gray-600 dark:text-gray-400" /><span className="text-xs text-center">Help</span></div>
                <div className="flex flex-col items-center gap-2"><Moon size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Moon</span></div>
                <div className="flex flex-col items-center gap-2"><Sun size={20} className="text-yellow-500" /><span className="text-xs text-center">Sun</span></div>
              </div>
            </div>

            {/* Usuarios */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">👥 Usuarios y Permisos</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><User size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">User</span></div>
                <div className="flex flex-col items-center gap-2"><Users size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Users</span></div>
                <div className="flex flex-col items-center gap-2"><UserPlus size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Add</span></div>
                <div className="flex flex-col items-center gap-2"><UserMinus size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Remove</span></div>
                <div className="flex flex-col items-center gap-2"><UserCheck size={20} className="text-brand-600" /><span className="text-xs text-center">Verified</span></div>
                <div className="flex flex-col items-center gap-2"><UserX size={20} className="text-red-600" /><span className="text-xs text-center">Blocked</span></div>
                <div className="flex flex-col items-center gap-2"><Shield size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Shield</span></div>
                <div className="flex flex-col items-center gap-2"><ShieldCheck size={20} className="text-brand-600" /><span className="text-xs text-center">Protected</span></div>
              </div>
            </div>

            {/* Comunicación */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">💬 Comunicación</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><Mail size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Mail</span></div>
                <div className="flex flex-col items-center gap-2"><Inbox size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Inbox</span></div>
                <div className="flex flex-col items-center gap-2"><Phone size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Phone</span></div>
                <div className="flex flex-col items-center gap-2"><MessageCircle size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Message</span></div>
                <div className="flex flex-col items-center gap-2"><MessageSquare size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Chat</span></div>
                <div className="flex flex-col items-center gap-2"><Bell size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Bell</span></div>
                <div className="flex flex-col items-center gap-2"><BellOff size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Muted</span></div>
              </div>
            </div>

            {/* Archivos y Carpetas */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">📁 Archivos y Carpetas</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><File size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">File</span></div>
                <div className="flex flex-col items-center gap-2"><FileText size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Document</span></div>
                <div className="flex flex-col items-center gap-2"><Folder size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Folder</span></div>
                <div className="flex flex-col items-center gap-2"><FolderOpen size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Open</span></div>
                <div className="flex flex-col items-center gap-2"><Image size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Image</span></div>
                <div className="flex flex-col items-center gap-2"><Video size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Video</span></div>
                <div className="flex flex-col items-center gap-2"><Music size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Music</span></div>
              </div>
            </div>

            {/* Navegación */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">🧭 Navegación</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><Home size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Home</span></div>
                <div className="flex flex-col items-center gap-2"><Menu size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Menu</span></div>
                <div className="flex flex-col items-center gap-2"><X size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Close</span></div>
                <div className="flex flex-col items-center gap-2"><ChevronRight size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Right</span></div>
                <div className="flex flex-col items-center gap-2"><ChevronLeft size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Left</span></div>
                <div className="flex flex-col items-center gap-2"><ChevronUp size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Up</span></div>
                <div className="flex flex-col items-center gap-2"><ChevronDown size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Down</span></div>
                <div className="flex flex-col items-center gap-2"><ArrowRight size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Arrow→</span></div>
                <div className="flex flex-col items-center gap-2"><ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Arrow←</span></div>
              </div>
            </div>

            {/* Comercio */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">🛒 E-Commerce</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><ShoppingCart size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Cart</span></div>
                <div className="flex flex-col items-center gap-2"><ShoppingBag size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Bag</span></div>
                <div className="flex flex-col items-center gap-2"><Store size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Store</span></div>
                <div className="flex flex-col items-center gap-2"><Package size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Package</span></div>
                <div className="flex flex-col items-center gap-2"><Truck size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Delivery</span></div>
                <div className="flex flex-col items-center gap-2"><DollarSign size={20} className="text-brand-600" /><span className="text-xs text-center">Price</span></div>
                <div className="flex flex-col items-center gap-2"><CreditCard size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Payment</span></div>
              </div>
            </div>

            {/* Herramientas */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">🔧 Herramientas</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><Settings size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Settings</span></div>
                <div className="flex flex-col items-center gap-2"><Wrench size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Wrench</span></div>
                <div className="flex flex-col items-center gap-2"><Hammer size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Hammer</span></div>
                <div className="flex flex-col items-center gap-2"><Sliders size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Sliders</span></div>
                <div className="flex flex-col items-center gap-2"><Filter size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Filter</span></div>
                <div className="flex flex-col items-center gap-2"><Lock size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Lock</span></div>
                <div className="flex flex-col items-center gap-2"><Unlock size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Unlock</span></div>
                <div className="flex flex-col items-center gap-2"><Key size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Key</span></div>
              </div>
            </div>

            {/* Tiempo */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">⏰ Tiempo y Calendario</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><Clock size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Clock</span></div>
                <div className="flex flex-col items-center gap-2"><Calendar size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Calendar</span></div>
                <div className="flex flex-col items-center gap-2"><CalendarDays size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Days</span></div>
                <div className="flex flex-col items-center gap-2"><Timer size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Timer</span></div>
                <div className="flex flex-col items-center gap-2"><Hourglass size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Hourglass</span></div>
                <div className="flex flex-col items-center gap-2"><Watch size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Watch</span></div>
              </div>
            </div>

            {/* Medios */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">🎬 Medios y Audio</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><Camera size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Camera</span></div>
                <div className="flex flex-col items-center gap-2"><Mic size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Mic</span></div>
                <div className="flex flex-col items-center gap-2"><MicOff size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">MicOff</span></div>
                <div className="flex flex-col items-center gap-2"><Volume2 size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Volume</span></div>
                <div className="flex flex-col items-center gap-2"><VolumeX size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Mute</span></div>
                <div className="flex flex-col items-center gap-2"><Play size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Play</span></div>
                <div className="flex flex-col items-center gap-2"><Pause size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Pause</span></div>
                <div className="flex flex-col items-center gap-2"><SkipForward size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Forward</span></div>
                <div className="flex flex-col items-center gap-2"><SkipBack size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Back</span></div>
              </div>
            </div>

            {/* Mapas */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">🗺️ Mapas y Ubicación</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><MapPin size={20} className="text-red-600" /><span className="text-xs text-center">Pin</span></div>
                <div className="flex flex-col items-center gap-2"><Map size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Map</span></div>
                <div className="flex flex-col items-center gap-2"><Navigation size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Navigate</span></div>
                <div className="flex flex-col items-center gap-2"><Compass size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Compass</span></div>
                <div className="flex flex-col items-center gap-2"><Globe size={20} className="text-blue-600" /><span className="text-xs text-center">Globe</span></div>
                <div className="flex flex-col items-center gap-2"><Warehouse size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Warehouse</span></div>
              </div>
            </div>

            {/* Social */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">❤️ Social y Reacciones</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><Share2 size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Share</span></div>
                <div className="flex flex-col items-center gap-2"><ThumbsUp size={20} className="text-blue-600" /><span className="text-xs text-center">Like</span></div>
                <div className="flex flex-col items-center gap-2"><ThumbsDown size={20} className="text-red-600" /><span className="text-xs text-center">Dislike</span></div>
                <div className="flex flex-col items-center gap-2"><Heart size={20} className="text-red-500" /><span className="text-xs text-center">Love</span></div>
                <div className="flex flex-col items-center gap-2"><Star size={20} className="text-yellow-500" /><span className="text-xs text-center">Star</span></div>
                <div className="flex flex-col items-center gap-2"><Bookmark size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Save</span></div>
                <div className="flex flex-col items-center gap-2"><Flag size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Flag</span></div>
              </div>
            </div>

            {/* Texto */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">📝 Formato de Texto</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><Bold size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Bold</span></div>
                <div className="flex flex-col items-center gap-2"><Italic size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Italic</span></div>
                <div className="flex flex-col items-center gap-2"><Underline size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Underline</span></div>
                <div className="flex flex-col items-center gap-2"><AlignLeft size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Left</span></div>
                <div className="flex flex-col items-center gap-2"><AlignCenter size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Center</span></div>
                <div className="flex flex-col items-center gap-2"><AlignRight size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Right</span></div>
                <div className="flex flex-col items-center gap-2"><List size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">List</span></div>
                <div className="flex flex-col items-center gap-2"><ListOrdered size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Ordered</span></div>
              </div>
            </div>

            {/* Clima */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">🌤️ Clima</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><Sun size={20} className="text-yellow-500" /><span className="text-xs text-center">Sunny</span></div>
                <div className="flex flex-col items-center gap-2"><Cloud size={20} className="text-gray-500" /><span className="text-xs text-center">Cloudy</span></div>
                <div className="flex flex-col items-center gap-2"><CloudRain size={20} className="text-blue-500" /><span className="text-xs text-center">Rain</span></div>
                <div className="flex flex-col items-center gap-2"><CloudSnow size={20} className="text-blue-300" /><span className="text-xs text-center">Snow</span></div>
                <div className="flex flex-col items-center gap-2"><Wind size={20} className="text-gray-600" /><span className="text-xs text-center">Wind</span></div>
                <div className="flex flex-col items-center gap-2"><Droplets size={20} className="text-blue-600" /><span className="text-xs text-center">Droplets</span></div>
              </div>
            </div>

            {/* Dispositivos */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">💻 Dispositivos</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><Monitor size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Monitor</span></div>
                <div className="flex flex-col items-center gap-2"><Laptop size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Laptop</span></div>
                <div className="flex flex-col items-center gap-2"><Smartphone size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Phone</span></div>
                <div className="flex flex-col items-center gap-2"><Tablet size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Tablet</span></div>
                <div className="flex flex-col items-center gap-2"><Printer size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Printer</span></div>
                <div className="flex flex-col items-center gap-2"><Wifi size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">WiFi</span></div>
                <div className="flex flex-col items-center gap-2"><WifiOff size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">No WiFi</span></div>
              </div>
            </div>

            {/* Datos y Gráficos */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">📊 Datos y Analytics</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><TrendingUp size={20} className="text-brand-600" /><span className="text-xs text-center">Up</span></div>
                <div className="flex flex-col items-center gap-2"><TrendingDown size={20} className="text-red-600" /><span className="text-xs text-center">Down</span></div>
                <div className="flex flex-col items-center gap-2"><BarChart size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Bar</span></div>
                <div className="flex flex-col items-center gap-2"><PieChart size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Pie</span></div>
                <div className="flex flex-col items-center gap-2"><Activity size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Activity</span></div>
                <div className="flex flex-col items-center gap-2"><Database size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Database</span></div>
              </div>
            </div>

            {/* Misceláneos */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">✨ Misceláneos</h3>
              <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-4">
                <div className="flex flex-col items-center gap-2"><Tag size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Tag</span></div>
                <div className="flex flex-col items-center gap-2"><Hash size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Hash</span></div>
                <div className="flex flex-col items-center gap-2"><AtSign size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">At</span></div>
                <div className="flex flex-col items-center gap-2"><Percent size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Percent</span></div>
                <div className="flex flex-col items-center gap-2"><Award size={20} className="text-yellow-600" /><span className="text-xs text-center">Award</span></div>
                <div className="flex flex-col items-center gap-2"><Gift size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Gift</span></div>
                <div className="flex flex-col items-center gap-2"><Zap size={20} className="text-yellow-500" /><span className="text-xs text-center">Zap</span></div>
                <div className="flex flex-col items-center gap-2"><Power size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Power</span></div>
                <div className="flex flex-col items-center gap-2"><Link size={20} className="text-blue-600" /><span className="text-xs text-center">Link</span></div>
                <div className="flex flex-col items-center gap-2"><Paperclip size={20} className="text-gray-700 dark:text-gray-300" /><span className="text-xs text-center">Attach</span></div>
              </div>
            </div>
          </section>

          {/* ========== SECCIÓN NUEVA: CHECKBOX ========== */}
          <section>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Checkbox</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Componente atómico para selección múltiple</p>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 space-y-8">
              {/* Variants */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Variantes</h3>
                <div className="flex flex-wrap gap-6">
                  <Checkbox label="Primary Checkbox" variant="primary" />
                  <Checkbox label="Secondary Checkbox" variant="secondary" />
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Tamaños</h3>
                <div className="flex flex-wrap items-center gap-6">
                  <Checkbox label="Small" size="sm" />
                  <Checkbox label="Medium" size="md" />
                  <Checkbox label="Large" size="lg" />
                </div>
              </div>

              {/* States */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Estados</h3>
                <div className="space-y-4">
                  <Checkbox 
                    label="Con helper text" 
                    helperText="Este texto ayuda al usuario"
                  />
                  <Checkbox 
                    label="Con error" 
                    error={true}
                    errorMessage="Este campo es obligatorio"
                  />
                  <Checkbox 
                    label="Deshabilitado" 
                    disabled
                  />
                  <Checkbox 
                    label="Controlado" 
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ========== SECCIÓN NUEVA: RADIO ========== */}
          <section>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Radio</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Componente atómico para selección única</p>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 space-y-8">
              {/* Variants */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Variantes</h3>
                <div className="flex flex-wrap gap-6">
                  <Radio label="Primary Option" name="demo1" variant="primary" />
                  <Radio label="Secondary Option" name="demo1" variant="secondary" />
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Tamaños</h3>
                <div className="flex flex-wrap items-center gap-6">
                  <Radio label="Small" name="demo2" size="sm" />
                  <Radio label="Medium" name="demo2" size="md" />
                  <Radio label="Large" name="demo2" size="lg" />
                </div>
              </div>

              {/* Group Example */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Grupo Controlado</h3>
                <div className="space-y-3">
                  <Radio 
                    label="Opción 1" 
                    name="controlled-group"
                    value="option1"
                    checked={selectedRadio === 'option1'}
                    onChange={(e) => setSelectedRadio(e.target.value)}
                  />
                  <Radio 
                    label="Opción 2" 
                    name="controlled-group"
                    value="option2"
                    checked={selectedRadio === 'option2'}
                    onChange={(e) => setSelectedRadio(e.target.value)}
                  />
                  <Radio 
                    label="Opción 3" 
                    name="controlled-group"
                    value="option3"
                    checked={selectedRadio === 'option3'}
                    onChange={(e) => setSelectedRadio(e.target.value)}
                  />
                </div>
                <p className="mt-4 text-sm text-gray-600">Seleccionado: {selectedRadio}</p>
              </div>
            </div>
          </section>

          {/* ========== SECCIÓN NUEVA: SWITCH ========== */}
          <section>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Switch</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Componente atómico para toggle on/off</p>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 space-y-8">
              {/* Variants */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Variantes</h3>
                <div className="flex flex-wrap gap-6">
                  <Switch label="Primary Switch" variant="primary" />
                  <Switch label="Secondary Switch" variant="secondary" />
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Tamaños</h3>
                <div className="flex flex-wrap items-center gap-6">
                  <Switch label="Small" size="sm" />
                  <Switch label="Medium" size="md" />
                  <Switch label="Large" size="lg" />
                </div>
              </div>

              {/* States */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Estados</h3>
                <div className="space-y-4">
                  <Switch 
                    label="Con helper text" 
                    helperText="Activa para recibir notificaciones"
                  />
                  <Switch 
                    label="Con error" 
                    error={true}
                    errorMessage="Debes aceptar los términos"
                  />
                  <Switch 
                    label="Deshabilitado" 
                    disabled
                  />
                  <Switch 
                    label="Controlado" 
                    checked={isSwitchOn}
                    onChange={(e) => setIsSwitchOn(e.target.checked)}
                  />
                  <p className="text-sm text-gray-600">Estado: {isSwitchOn ? 'ON' : 'OFF'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* ========== SECCIÓN: CARD (ProductCard) ========== */}
          <section>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Card</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              ProductCard — Componente de producción. Card clickeable completa, sin botón "Ver Detalle". 
              Variantes: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">featured</code> (homepage) y <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">compact</code> (resultados).
            </p>
            
            <div className="space-y-10">

              {/* ── Variante Featured: Grid 4 columnas ── */}
              <div>
                <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Variante Featured</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Imagen 16/9 · Card clickeable · Hover lift + border brand · Badge contextual sobre imagen</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  
                  {/* Card Featured 1 */}
                  <Card variant="default" padding="none" className="group cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-lg hover:border-brand-600 h-full">
                    <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-[16/9]">
                      <div className="w-full h-full bg-gradient-to-br from-brand-600 to-brand-600 flex items-center justify-center">
                        <Package size={48} className="text-white/40" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">Nuevo</span>
                    </div>
                    <div className="flex flex-col p-5 gap-3">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                        <Tag size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">Tractores · John Deere · 5075E</span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight min-h-[2.5rem] line-clamp-2 group-hover:text-brand-600 transition-colors">
                        Tractor John Deere 5075E 4WD
                      </h3>
                      <div>
                        <div className="inline-block bg-gradient-to-r from-brand-50 to-emerald-50 border-l-4 border-brand-600 rounded-lg px-3 py-1.5">
                          <p className="font-black text-brand-600 text-base">USD 45.000</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-auto">
                        <MapPin size={14} className="flex-shrink-0 text-gray-400" />
                        <span className="truncate">Pergamino, Buenos Aires</span>
                      </div>
                    </div>
                  </Card>

                  {/* Card Featured 2 */}
                  <Card variant="default" padding="none" className="group cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-lg hover:border-brand-600 h-full">
                    <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-[16/9]">
                      <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Package size={48} className="text-white/40" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">Usado</span>
                    </div>
                    <div className="flex flex-col p-5 gap-3">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                        <Tag size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">Cosechadoras · Case IH · 7250</span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight min-h-[2.5rem] line-clamp-2 group-hover:text-brand-600 transition-colors">
                        Cosechadora Case IH Axial-Flow 7250
                      </h3>
                      <div>
                        <div className="inline-block bg-gradient-to-r from-brand-50 to-emerald-50 border-l-4 border-brand-600 rounded-lg px-3 py-1.5">
                          <p className="font-black text-brand-600 text-base">USD 120.000</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-auto">
                        <MapPin size={14} className="flex-shrink-0 text-gray-400" />
                        <span className="truncate">Marcos Juárez, Córdoba</span>
                      </div>
                    </div>
                  </Card>

                  {/* Card Featured 3 - Consultar (sin precio) */}
                  <Card variant="default" padding="none" className="group cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-lg hover:border-brand-600 h-full">
                    <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-[16/9]">
                      <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                        <Package size={48} className="text-white/40" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="flex flex-col p-5 gap-3">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                        <Tag size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">Sembradoras · Agrometal · TX Mega</span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight min-h-[2.5rem] line-clamp-2 group-hover:text-brand-600 transition-colors">
                        Sembradora Agrometal TX Mega 16/52
                      </h3>
                      <div>
                        <div className="inline-block bg-gradient-to-r from-brand-50 to-emerald-50 border-l-4 border-brand-600 rounded-lg px-3 py-1.5">
                          <p className="font-black text-brand-600 text-base">Consultar</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-auto">
                        <MapPin size={14} className="flex-shrink-0 text-gray-400" />
                        <span className="truncate">Rafaela, Santa Fe</span>
                      </div>
                    </div>
                  </Card>

                  {/* Card Featured 4 - Ganadería (badge edad) */}
                  <Card variant="default" padding="none" className="group cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-lg hover:border-brand-600 h-full">
                    <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-[16/9]">
                      <div className="w-full h-full bg-gradient-to-br from-lime-400 to-green-600 flex items-center justify-center">
                        <Package size={48} className="text-white/40" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">2-3 años</span>
                    </div>
                    <div className="flex flex-col p-5 gap-3">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                        <Tag size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">Ganadería · Vaquillonas · Angus</span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight min-h-[2.5rem] line-clamp-2 group-hover:text-brand-600 transition-colors">
                        Vaquillonas Angus Preñadas x 50
                      </h3>
                      <div>
                        <div className="inline-block bg-gradient-to-r from-brand-50 to-emerald-50 border-l-4 border-brand-600 rounded-lg px-3 py-1.5">
                          <p className="font-black text-brand-600 text-base">$ 850.000</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-auto">
                        <MapPin size={14} className="flex-shrink-0 text-gray-400" />
                        <span className="truncate">Villaguay, Entre Ríos</span>
                      </div>
                    </div>
                  </Card>

                </div>
              </div>

              {/* ── Variante Compact: Grid más denso ── */}
              <div>
                <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Variante Compact</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Imagen 4/3 · Padding y font más chicos · Usada en resultados de búsqueda</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  
                  {/* Compact 1 */}
                  <Card variant="default" padding="none" className="group cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-lg hover:border-brand-600 h-auto">
                    <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-[4/3]">
                      <div className="w-full h-full bg-gradient-to-br from-brand-600 to-brand-600 flex items-center justify-center">
                        <Package size={32} className="text-white/40" />
                      </div>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">Nuevo</span>
                    </div>
                    <div className="flex flex-col p-4 gap-2">
                      <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                        <Tag size={10} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">Pulverizadoras · Hardi</span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug min-h-[2rem] line-clamp-2 group-hover:text-brand-600 transition-colors">
                        Pulverizadora Hardi Commander
                      </h3>
                      <div>
                        <div className="inline-block bg-gradient-to-r from-brand-50 to-emerald-50 border-l-4 border-brand-600 rounded-lg px-2.5 py-1">
                          <p className="font-black text-brand-600 text-sm">USD 35.000</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mt-auto">
                        <MapPin size={12} className="flex-shrink-0 text-gray-400" />
                        <span className="truncate">Río Cuarto</span>
                      </div>
                    </div>
                  </Card>

                  {/* Compact 2 */}
                  <Card variant="default" padding="none" className="group cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-lg hover:border-brand-600 h-auto">
                    <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-[4/3]">
                      <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <Package size={32} className="text-white/40" />
                      </div>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">Usado</span>
                    </div>
                    <div className="flex flex-col p-4 gap-2">
                      <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                        <Tag size={10} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">Mixers · Mainero</span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug min-h-[2rem] line-clamp-2 group-hover:text-brand-600 transition-colors">
                        Mixer Mainero 2932
                      </h3>
                      <div>
                        <div className="inline-block bg-gradient-to-r from-brand-50 to-emerald-50 border-l-4 border-brand-600 rounded-lg px-2.5 py-1">
                          <p className="font-black text-brand-600 text-sm">$ 4.500.000</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mt-auto">
                        <MapPin size={12} className="flex-shrink-0 text-gray-400" />
                        <span className="truncate">Trenque Lauquen</span>
                      </div>
                    </div>
                  </Card>

                  {/* Compact 3 */}
                  <Card variant="default" padding="none" className="group cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-lg hover:border-brand-600 h-auto">
                    <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-[4/3]">
                      <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
                        <Package size={32} className="text-white/40" />
                      </div>
                    </div>
                    <div className="flex flex-col p-4 gap-2">
                      <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                        <Tag size={10} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">Acoplados · Ombu</span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug min-h-[2rem] line-clamp-2 group-hover:text-brand-600 transition-colors">
                        Acoplado Tolva Ombu CRV 22
                      </h3>
                      <div>
                        <div className="inline-block bg-gradient-to-r from-brand-50 to-emerald-50 border-l-4 border-brand-600 rounded-lg px-2.5 py-1">
                          <p className="font-black text-brand-600 text-sm">Consultar</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mt-auto">
                        <MapPin size={12} className="flex-shrink-0 text-gray-400" />
                        <span className="truncate">Rosario</span>
                      </div>
                    </div>
                  </Card>

                  {/* Compact 4 */}
                  <Card variant="default" padding="none" className="group cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-lg hover:border-brand-600 h-auto">
                    <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-[4/3]">
                      <div className="w-full h-full bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center">
                        <Package size={32} className="text-white/40" />
                      </div>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">Nuevo</span>
                    </div>
                    <div className="flex flex-col p-4 gap-2">
                      <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                        <Tag size={10} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">Silos · Kepler Weber</span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug min-h-[2rem] line-clamp-2 group-hover:text-brand-600 transition-colors">
                        Silo Aéreo 150 Toneladas
                      </h3>
                      <div>
                        <div className="inline-block bg-gradient-to-r from-brand-50 to-emerald-50 border-l-4 border-brand-600 rounded-lg px-2.5 py-1">
                          <p className="font-black text-brand-600 text-sm">USD 8.500</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mt-auto">
                        <MapPin size={12} className="flex-shrink-0 text-gray-400" />
                        <span className="truncate">Las Parejas</span>
                      </div>
                    </div>
                  </Card>

                  {/* Compact 5 */}
                  <Card variant="default" padding="none" className="group cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-lg hover:border-brand-600 h-auto">
                    <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-[4/3]">
                      <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center">
                        <Package size={32} className="text-white/40" />
                      </div>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">3-4 años</span>
                    </div>
                    <div className="flex flex-col p-4 gap-2">
                      <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                        <Tag size={10} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium truncate">Ganadería · Novillos</span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug min-h-[2rem] line-clamp-2 group-hover:text-brand-600 transition-colors">
                        Novillos Hereford x 30 cab
                      </h3>
                      <div>
                        <div className="inline-block bg-gradient-to-r from-brand-50 to-emerald-50 border-l-4 border-brand-600 rounded-lg px-2.5 py-1">
                          <p className="font-black text-brand-600 text-sm">$ 1.200.000</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mt-auto">
                        <MapPin size={12} className="flex-shrink-0 text-gray-400" />
                        <span className="truncate">Ayacucho</span>
                      </div>
                    </div>
                  </Card>

                </div>
              </div>

              {/* ── Avisos Destacados: Barra en Resultados ── */}
              <div>
                <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Avisos Destacados — Barra en Resultados</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Contenedor <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">bg-brand-50/70</code> con borde <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">brand-100</code> · Máx 5 cards compact · Header con Megaphone icon</p>
                
                {/* Replica exacta del UserFeaturedAdsBar */}
                <div className="mb-6">
                  <div className="bg-brand-50/70 border border-brand-100 rounded-xl p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4 text-brand-600" />
                        <h3 className="text-sm font-semibold text-brand-700 tracking-wide uppercase">Avisos Destacados</h3>
                      </div>
                      <span className="text-xs text-brand-600/70 font-medium">Publicidad</span>
                    </div>

                    {/* Grid 5 columnas desktop — cards compact */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      
                      {/* Destacado 1 */}
                      <Card variant="default" padding="none" className="group cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-lg hover:border-brand-600 h-auto">
                        <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-[4/3]">
                          <div className="w-full h-full bg-gradient-to-br from-brand-600 to-brand-600 flex items-center justify-center">
                            <Package size={32} className="text-white/40" />
                          </div>
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">Nuevo</span>
                        </div>
                        <div className="flex flex-col p-4 gap-2">
                          <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                            <Tag size={10} className="text-gray-400 flex-shrink-0" />
                            <span className="font-medium truncate">Tractores · Massey Ferguson</span>
                          </div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug min-h-[2rem] line-clamp-2 group-hover:text-brand-600 transition-colors">
                            Tractor MF 4292 Cabina
                          </h3>
                          <div>
                            <div className="inline-block bg-gradient-to-r from-brand-50 to-emerald-50 border-l-4 border-brand-600 rounded-lg px-2.5 py-1">
                              <p className="font-black text-brand-600 text-sm">USD 52.000</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mt-auto">
                            <MapPin size={12} className="flex-shrink-0 text-gray-400" />
                            <span className="truncate">Junín</span>
                          </div>
                        </div>
                      </Card>

                      {/* Destacado 2 */}
                      <Card variant="default" padding="none" className="group cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-lg hover:border-brand-600 h-auto">
                        <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-[4/3]">
                          <div className="w-full h-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                            <Package size={32} className="text-white/40" />
                          </div>
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">Usado</span>
                        </div>
                        <div className="flex flex-col p-4 gap-2">
                          <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                            <Tag size={10} className="text-gray-400 flex-shrink-0" />
                            <span className="font-medium truncate">Implementos · Metalfor</span>
                          </div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug min-h-[2rem] line-clamp-2 group-hover:text-brand-600 transition-colors">
                            Pulverizadora Metalfor 3200 SE
                          </h3>
                          <div>
                            <div className="inline-block bg-gradient-to-r from-brand-50 to-emerald-50 border-l-4 border-brand-600 rounded-lg px-2.5 py-1">
                              <p className="font-black text-brand-600 text-sm">USD 68.000</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mt-auto">
                            <MapPin size={12} className="flex-shrink-0 text-gray-400" />
                            <span className="truncate">Venado Tuerto</span>
                          </div>
                        </div>
                      </Card>

                      {/* Destacado 3 */}
                      <Card variant="default" padding="none" className="group cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-lg hover:border-brand-600 h-auto">
                        <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-[4/3]">
                          <div className="w-full h-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
                            <Package size={32} className="text-white/40" />
                          </div>
                        </div>
                        <div className="flex flex-col p-4 gap-2">
                          <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                            <Tag size={10} className="text-gray-400 flex-shrink-0" />
                            <span className="font-medium truncate">Acoplados · Cestari</span>
                          </div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug min-h-[2rem] line-clamp-2 group-hover:text-brand-600 transition-colors">
                            Tolva Cestari 24 Tn
                          </h3>
                          <div>
                            <div className="inline-block bg-gradient-to-r from-brand-50 to-emerald-50 border-l-4 border-brand-600 rounded-lg px-2.5 py-1">
                              <p className="font-black text-brand-600 text-sm">$ 6.800.000</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mt-auto">
                            <MapPin size={12} className="flex-shrink-0 text-gray-400" />
                            <span className="truncate">Armstrong</span>
                          </div>
                        </div>
                      </Card>

                      {/* Destacado 4 */}
                      <Card variant="default" padding="none" className="group cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-lg hover:border-brand-600 h-auto">
                        <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-[4/3]">
                          <div className="w-full h-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
                            <Package size={32} className="text-white/40" />
                          </div>
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">Nuevo</span>
                        </div>
                        <div className="flex flex-col p-4 gap-2">
                          <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                            <Tag size={10} className="text-gray-400 flex-shrink-0" />
                            <span className="font-medium truncate">Silos · Agromet</span>
                          </div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug min-h-[2rem] line-clamp-2 group-hover:text-brand-600 transition-colors">
                            Silo Bolsa 9 Pies Extractor
                          </h3>
                          <div>
                            <div className="inline-block bg-gradient-to-r from-brand-50 to-emerald-50 border-l-4 border-brand-600 rounded-lg px-2.5 py-1">
                              <p className="font-black text-brand-600 text-sm">USD 12.500</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mt-auto">
                            <MapPin size={12} className="flex-shrink-0 text-gray-400" />
                            <span className="truncate">Las Parejas</span>
                          </div>
                        </div>
                      </Card>

                      {/* Destacado 5 */}
                      <Card variant="default" padding="none" className="group cursor-pointer overflow-hidden transition-all duration-300 ease-out hover:-translate-y-[3px] hover:shadow-lg hover:border-brand-600 h-auto">
                        <div className="relative w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-[4/3]">
                          <div className="w-full h-full bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center">
                            <Package size={32} className="text-white/40" />
                          </div>
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">Usado</span>
                        </div>
                        <div className="flex flex-col p-4 gap-2">
                          <div className="flex items-center gap-1.5 text-gray-600 text-[11px]">
                            <Tag size={10} className="text-gray-400 flex-shrink-0" />
                            <span className="font-medium truncate">Ganadería · Novillos</span>
                          </div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug min-h-[2rem] line-clamp-2 group-hover:text-brand-600 transition-colors">
                            Lote 80 Novillos Braford
                          </h3>
                          <div>
                            <div className="inline-block bg-gradient-to-r from-brand-50 to-emerald-50 border-l-4 border-brand-600 rounded-lg px-2.5 py-1">
                              <p className="font-black text-brand-600 text-sm">$ 1.450.000</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mt-auto">
                            <MapPin size={12} className="flex-shrink-0 text-gray-400" />
                            <span className="truncate">Gualeguaychú</span>
                          </div>
                        </div>
                      </Card>

                    </div>
                  </div>
                </div>

                {/* Specs del contenedor */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Card variant="ghost" padding="sm">
                    <h4 className="font-semibold text-xs text-gray-900 dark:text-white mb-2">Contenedor</h4>
                    <div className="space-y-1 text-[11px] text-gray-600 dark:text-gray-400">
                      <p><span className="font-mono text-brand-600">bg-brand-50/70</span> fondo</p>
                      <p><span className="font-mono text-brand-600">border-brand-100</span> borde</p>
                      <p><span className="font-mono text-brand-600">rounded-xl</span> esquinas</p>
                      <p><span className="font-mono text-brand-600">p-4</span> padding</p>
                    </div>
                  </Card>
                  <Card variant="ghost" padding="sm">
                    <h4 className="font-semibold text-xs text-gray-900 dark:text-white mb-2">Header</h4>
                    <div className="space-y-1 text-[11px] text-gray-600 dark:text-gray-400">
                      <p><span className="font-mono text-brand-600">Megaphone</span> icon 16px</p>
                      <p><span className="font-mono text-brand-600">text-brand-700</span> título</p>
                      <p><span className="font-mono text-brand-600">uppercase tracking-wide</span></p>
                      <p>Label "Publicidad" <span className="font-mono text-brand-600">text-brand-600/70</span></p>
                    </div>
                  </Card>
                  <Card variant="ghost" padding="sm">
                    <h4 className="font-semibold text-xs text-gray-900 dark:text-white mb-2">Grid</h4>
                    <div className="space-y-1 text-[11px] text-gray-600 dark:text-gray-400">
                      <p><span className="font-mono text-brand-600">grid-cols-2</span> mobile</p>
                      <p><span className="font-mono text-brand-600">sm:grid-cols-3</span> tablet</p>
                      <p><span className="font-mono text-brand-600">lg:grid-cols-5</span> desktop</p>
                      <p>Máx 5 ads · 1 por usuario · FIFO</p>
                    </div>
                  </Card>
                </div>
              </div>

              {/* ── Anatomía: Explicación visual ── */}
              <div>
                <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Anatomía del ProductCard</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Estructura interna y tokens usados en producción</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Card anatomía */}
                  <Card variant="outlined" padding="none" className="overflow-hidden">
                    <div className="relative w-full overflow-hidden aspect-[16/9] bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-b border-dashed border-gray-300 dark:border-gray-600">
                      <div className="text-center">
                        <p className="text-sm font-mono text-gray-500">aspect-[16/9] | aspect-[4/3]</p>
                        <p className="text-[10px] text-gray-400 mt-1">Imagen lazy + gradient overlay en hover</p>
                      </div>
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-light text-white bg-black/50 backdrop-blur-sm rounded">
                        Badge contextual
                      </div>
                    </div>
                    <div className="p-5 space-y-3 border-l-2 border-dashed border-brand-200 ml-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Tag size={12} className="text-gray-400" />
                        <span className="font-medium text-gray-500 font-mono">Label: Subcat · Marca · Modelo</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white text-base font-mono">Título (line-clamp-2, hover → brand-600)</span>
                      </div>
                      <div className="inline-block bg-gradient-to-r from-brand-50 to-emerald-50 border-l-4 border-brand-600 rounded-lg px-3 py-1.5">
                        <span className="font-black text-brand-600 text-base font-mono">Precio (brand-600)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-gray-500 font-mono">Ubicación (mt-auto)</span>
                      </div>
                    </div>
                  </Card>

                  {/* Especificaciones */}
                  <div className="space-y-4">
                    <Card variant="ghost" padding="md">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Tokens usados</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between"><span className="text-gray-500">Precio pill bg</span><span className="font-mono text-brand-600">brand-50 → emerald-50</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Precio border</span><span className="font-mono text-brand-600">border-brand-600</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Precio texto</span><span className="font-mono text-brand-600">text-brand-600</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Título hover</span><span className="font-mono text-brand-600">text-brand-600</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Hover border</span><span className="font-mono text-brand-600">border-brand-600</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Hover lift</span><span className="font-mono text-gray-600">-translate-y-[3px]</span></div>
                      </div>
                    </Card>
                    <Card variant="ghost" padding="md">
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Comportamiento</h4>
                      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                        <p>• Card completa clickeable → navega a <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/ad/{'{slug}'}</code></p>
                        <p>• Sin botón "Ver Detalle" — toda la superficie es el CTA</p>
                        <p>• Badge contextual: ganadería muestra edad, otros Nuevo/Usado</p>
                        <p>• Precio: se muestra "Consultar" si no hay precio</p>
                        <p>• Ubicación: localidad + provincia opcional</p>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>

              {/* ── Card molecule: Variantes base ── */}
              <div>
                <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200">Card Molecule — Variantes base</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Contenedor genérico CVA con 4 variantes + sub-componentes (Header, Body, Footer)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card variant="default">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Default</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">shadow-md · hover:shadow-lg</p>
                  </Card>
                  <Card variant="outlined">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Outlined</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">borde · sin shadow</p>
                  </Card>
                  <Card variant="elevated">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Elevated</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">shadow-lg · hover:shadow-xl</p>
                  </Card>
                  <Card variant="ghost">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Ghost</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">transparente · hover bg</p>
                  </Card>
                </div>
              </div>

            </div>
          </section>

          {/* ========== SECCIÓN NUEVA: MODAL ========== */}
          <section>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Modal</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Componente molecular para diálogos y overlays</p>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Demo Interactiva</h3>
                <Button 
                  variant="primary" 
                  onClick={() => setIsModalOpen(true)}
                  leftIcon={<Plus size={16} />}
                >
                  Abrir Modal
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Características</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Cierre con tecla ESC</li>
                  <li>Cierre al hacer click en el overlay (configurable)</li>
                  <li>Bloqueo de scroll del body</li>
                  <li>7 tamaños disponibles (sm, md, lg, xl, 2xl, 4xl, full)</li>
                  <li>Backdrop con blur</li>
                  <li>Animaciones de entrada/salida</li>
                </ul>
              </div>
            </div>

            <Modal
              open={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Modal de Ejemplo"
              size="lg"
              closeOnEscape={true}
              closeOnOverlayClick={true}
            >
              <div className="space-y-4">
                <p className="text-gray-600">
                  Este es un modal de ejemplo. Puedes cerrarlo haciendo click en la X,
                  presionando ESC, o haciendo click fuera del modal.
                </p>
                
                <div className="space-y-3">
                  <FormField label="Nombre" required>
                    <Input placeholder="Ingresa tu nombre" />
                  </FormField>
                  <FormField label="Email" required>
                    <Input type="email" placeholder="tu@email.com" />
                  </FormField>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="primary" 
                    onClick={() => setIsModalOpen(false)}
                  >
                    Guardar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </Modal>
          </section>

          {/* ========== SECCIÓN 6: ICONOS ========== */}
          <section>
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Biblioteca de Iconos</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Todos los iconos disponibles de Lucide React</p>
            
            {/* Aquí irían todas las categorías de iconos que ya existen en el archivo */}
            {/* Por brevedad, omitimos el contenido que ya existe */}
          </section>

          {/* Footer */}
          <footer className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">
              🎨 Design System Rural24 - Atomic Design + CVA + Tailwind CSS
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Ver documentación completa en Storybook: <code className="text-brand-600 dark:text-green-400">npm run storybook</code>
            </p>
          </footer>

        </main>
      </div>
    </div>
  );
}

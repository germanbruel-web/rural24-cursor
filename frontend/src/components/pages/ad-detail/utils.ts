import React from 'react';
import {
  Info, Home, Ruler, Settings, Hash, DollarSign, List, MapPin, Tag, CheckCircle2,
  Calendar, Gauge, Truck, Tractor, Leaf, Beef, Bed, Car, Wrench,
  Package, Clipboard, Star, Zap, Thermometer, Shield, Layers, Briefcase,
  Building2, Clock, Award, TrendingUp, Percent, Archive, Phone, Mail,
  User, Wheat, FileText, AlignLeft, BarChart2, Droplets,
} from 'lucide-react';
import type { FormFieldV2 } from '../../../types/v2';

// ── Date & price helpers ───────────────────────────────────────────────────────

export function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days > 30)
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  if (days >= 1) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
  if (hours >= 1) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  if (mins >= 1) return `hace ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
  return 'hace un momento';
}

export function formatPrice(price: number): string {
  return price.toLocaleString('es-AR');
}

// ── Icon map ───────────────────────────────────────────────────────────────────

export const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  // original set
  'info':          Info,
  'home':          Home,
  'ruler':         Ruler,
  'settings':      Settings,
  'hash':          Hash,
  'dollar-sign':   DollarSign,
  'list':          List,
  'map-pin':       MapPin,
  'tag':           Tag,
  'check':         CheckCircle2,
  // dates & time
  'calendar':      Calendar,
  'clock':         Clock,
  // measurements & stats
  'gauge':         Gauge,
  'thermometer':   Thermometer,
  'percent':       Percent,
  'bar-chart':     BarChart2,
  'bar-chart-2':   BarChart2,
  'droplets':      Droplets,
  // vehicles & machinery
  'truck':         Truck,
  'tractor':       Tractor,
  'car':           Car,
  'wrench':        Wrench,
  // agriculture & nature
  'leaf':          Leaf,
  'wheat':         Wheat,
  // livestock
  'beef':          Beef,
  'cow':           Beef,
  // real estate
  'bed':           Bed,
  'building':      Building2,
  'building2':     Building2,
  // business & work
  'briefcase':     Briefcase,
  'user':          User,
  'phone':         Phone,
  'mail':          Mail,
  'award':         Award,
  'trending-up':   TrendingUp,
  // generic utility
  'package':       Package,
  'clipboard':     Clipboard,
  'archive':       Archive,
  'layers':        Layers,
  'star':          Star,
  'zap':           Zap,
  'shield':        Shield,
  'file-text':     FileText,
  'align-left':    AlignLeft,
};

// ── Fallback icons by field_name ─────────────────────────────────────────────
// Used when form_fields_v2.icon is null (field builder doesn't set icons yet)

export const FIELD_NAME_ICON_MAP: Record<string, string> = {
  // dates & numbers
  anio: 'calendar', year: 'calendar', fecha: 'calendar',
  horas: 'clock', hours: 'clock', kilometros: 'gauge', km: 'gauge',
  potencia: 'zap', hp: 'zap', kw: 'zap',
  // identification
  marca: 'tag', brand: 'tag', modelo: 'settings', model: 'settings',
  tipo: 'layers', type: 'layers', categoria: 'layers',
  // condition & state
  condicion: 'shield', condition: 'shield', estado: 'shield',
  // measurements
  superficie: 'ruler', area: 'ruler', hectareas: 'ruler',
  largo: 'ruler', ancho: 'ruler', alto: 'ruler',
  peso: 'bar-chart-2', capacidad: 'bar-chart-2', volumen: 'bar-chart-2',
  // agriculture
  cultivo: 'wheat', semilla: 'wheat', especie: 'leaf',
  raza: 'beef', categoria_animal: 'beef',
  // real estate
  habitaciones: 'bed', dormitorios: 'bed', banios: 'home', ambientes: 'home',
  mt2: 'ruler', metros: 'ruler',
  // location
  provincia: 'map-pin', localidad: 'map-pin', ubicacion: 'map-pin',
  // price & finance
  precio: 'dollar-sign', price: 'dollar-sign', moneda: 'dollar-sign',
  // description
  descripcion: 'align-left', description: 'align-left', observaciones: 'align-left',
  // contact
  telefono: 'phone', email: 'mail', contacto: 'phone',
  // work/employment
  cargo: 'briefcase', puesto: 'briefcase', empresa: 'building2',
  experiencia: 'award', salario: 'dollar-sign',
  // machinery specific
  traccion: 'tractor', motor: 'settings', combustible: 'droplets',
  transmision: 'settings', cilindros: 'settings',
  // color
  color: 'star',
};

// ── Grid helpers — mirrors DynamicFormV2Fields 6-column virtual grid ──────────
//
//   full  → md:col-span-6  (entire row)
//   half  → md:col-span-3  (half, default)
//   third → md:col-span-2  (one-third)

export function getFieldWidthClass(field_width: FormFieldV2['field_width']): string {
  if (field_width === 'full')  return 'md:col-span-6';
  if (field_width === 'third') return 'md:col-span-2';
  return 'md:col-span-3'; // 'half' is the default
}

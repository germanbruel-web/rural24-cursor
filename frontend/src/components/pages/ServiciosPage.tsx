/**
 * ServiciosPage — /servicios-rural24
 * Landing page de la sección Servicios rurales B2B.
 * Explica qué son, cómo publicar y tipos disponibles.
 */

import React from 'react';
import {
  Handshake, Building2, ChevronRight, CheckCircle2,
  Tractor, Sprout, Truck, FlaskConical, Stethoscope,
  HardHat, Wrench, Plane, Droplets, Trees,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { navigateTo } from '../../hooks/useNavigate';

// Tipos de servicios más comunes
const TIPOS_SERVICIOS = [
  { icon: Tractor,       label: 'Contratistas agrícolas',     desc: 'Siembra, cosecha y laboreo' },
  { icon: Droplets,      label: 'Fumigación y aplicación',    desc: 'Terrestres y aéreas' },
  { icon: Truck,         label: 'Transporte',                 desc: 'Hacienda, granos y maquinaria' },
  { icon: Stethoscope,   label: 'Veterinaria',                desc: 'Sanidad animal y asesoría' },
  { icon: Sprout,        label: 'Agronomía y consultoría',    desc: 'Planes de fertilización y más' },
  { icon: FlaskConical,  label: 'Análisis de suelos',         desc: 'Laboratorios especializados' },
  { icon: HardHat,       label: 'Obras e infraestructura',    desc: 'Galpones, corrales y alambrados' },
  { icon: Wrench,        label: 'Mecánica agrícola',          desc: 'Mantenimiento y reparación' },
  { icon: Plane,         label: 'Aeroaplicación',             desc: 'Drones y aviones agrícolas' },
  { icon: Trees,         label: 'Forestación',                desc: 'Implantación y manejo forestal' },
];

const PASOS = [
  {
    numero: '01',
    titulo: 'Creá tu perfil de empresa',
    desc: 'Registrate gratis y completá el perfil de tu empresa con nombre, logo, descripción y datos de contacto.',
  },
  {
    numero: '02',
    titulo: 'Publicá tus servicios',
    desc: 'Cargá cada servicio con fotos, descripción detallada, zona de cobertura y precio estimado.',
  },
  {
    numero: '03',
    titulo: 'Recibí consultas',
    desc: 'Los productores interesados te contactan directamente. Sin intermediarios, sin comisiones.',
  },
];

const BENEFICIOS = [
  'Llegá a productores de todo el país',
  'Perfil de empresa verificado',
  'Gestión de múltiples servicios desde un solo panel',
  'Contacto directo con clientes',
  'Sin comisiones por contacto',
  'Estadísticas de visitas a tus avisos',
];

export const ServiciosPage: React.FC = () => {
  const { user } = useAuth();

  const handleCTA = () => {
    if (!user) {
      navigateTo('/publicar');
    } else {
      navigateTo('/mis-empresas');
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium mb-6">
            <Handshake size={16} />
            Servicios Rurales
          </div>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-4">
            El mercado de servicios<br className="hidden sm:block" /> del agro argentino
          </h1>
          <p className="text-base sm:text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Conectamos proveedores de servicios rurales con productores de todo el país.
            Publicá tus servicios gratis y llegá a quien los necesita.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleCTA}
              className="w-full sm:w-auto flex items-center justify-center gap-2
                         px-8 py-3.5 bg-white text-brand-700 font-bold rounded-full
                         hover:bg-gray-50 transition-all shadow-lg text-base"
            >
              <Building2 size={18} />
              {user ? 'Ir a Mis Empresas' : 'Publicar mi servicio gratis'}
            </button>
            <button
              onClick={() => navigateTo('/')}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5
                         px-6 py-3.5 border border-white/40 text-white font-medium
                         rounded-full hover:bg-white/10 transition-all text-base"
            >
              Ver servicios publicados
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── TIPOS DE SERVICIOS ── */}
      <section className="py-14 sm:py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
              ¿Qué servicios podés publicar?
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
              Cualquier servicio relacionado al campo, la ganadería, la agricultura y el agro en general.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {TIPOS_SERVICIOS.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="bg-white rounded-xl p-4 flex flex-col items-center text-center gap-2
                           border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center">
                  <Icon size={20} className="text-brand-600" />
                </div>
                <p className="text-xs font-semibold text-gray-900 leading-tight">{label}</p>
                <p className="text-[11px] text-gray-400 leading-tight">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="py-14 sm:py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
              ¿Cómo publicar tu servicio?
            </h2>
            <p className="text-gray-500 text-sm sm:text-base">
              Tres pasos simples para estar visible ante miles de productores.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {PASOS.map((paso) => (
              <div key={paso.numero} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white
                                flex items-center justify-center text-xl font-black mb-4 shadow-md shadow-brand-200">
                  {paso.numero}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-base">{paso.titulo}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{paso.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS ── */}
      <section className="py-14 sm:py-20 bg-brand-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">
                Por qué elegir RURAL24 para tu empresa
              </h2>
              <p className="text-gray-500 text-sm sm:text-base mb-6">
                Somos el marketplace líder de servicios y productos agropecuarios de Argentina.
                Tu empresa merece estar donde están los productores.
              </p>
              <button
                onClick={handleCTA}
                className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500
                           text-white font-bold rounded-full transition-all shadow-md"
              >
                <Building2 size={18} />
                Crear perfil de empresa
              </button>
            </div>

            <ul className="space-y-3">
              {BENEFICIOS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-brand-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-14 sm:py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">
            ¿Listo para publicar tu servicio?
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mb-8">
            Es gratis. Sin comisiones. Tu servicio disponible para productores de todo el país.
          </p>
          <button
            onClick={handleCTA}
            className="inline-flex items-center gap-2 px-10 py-4
                       bg-brand-600 hover:bg-brand-500 text-white font-bold
                       rounded-full transition-all shadow-xl shadow-brand-200 text-base"
          >
            <Building2 size={20} />
            Empezar ahora — es gratis
          </button>
        </div>
      </section>

    </div>
  );
};

export default ServiciosPage;

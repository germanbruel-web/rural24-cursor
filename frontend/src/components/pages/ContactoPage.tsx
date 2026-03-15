import React from 'react';
import { Mail, MessageCircle, Instagram, MapPin, Clock } from 'lucide-react';

export const ContactoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-brand-50">

      {/* Hero */}
      <section className="bg-brand-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <Mail className="w-16 h-16 text-white/80" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contacto</h1>
          <p className="text-xl text-brand-50 max-w-2xl mx-auto leading-relaxed">
            ¿Tenés alguna consulta, sugerencia o necesitás ayuda? Escribinos y te respondemos a la brevedad.
          </p>
        </div>
      </section>

      {/* Canales de contacto */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">¿Cómo contactarnos?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Email */}
            <a
              href="mailto:hola@rural24.com.ar"
              className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4 hover:border-brand-400 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Correo electrónico</h3>
                <p className="text-brand-600 text-sm font-medium">hola@rural24.com.ar</p>
                <p className="text-gray-500 text-xs mt-1">Respondemos en menos de 24 hs hábiles</p>
              </div>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/5492615000000"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4 hover:border-brand-400 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">WhatsApp</h3>
                <p className="text-brand-600 text-sm font-medium">+54 9 261 500-0000</p>
                <p className="text-gray-500 text-xs mt-1">Lunes a viernes de 9 a 18 hs</p>
              </div>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com/rural24ar"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4 hover:border-brand-400 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center shrink-0">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Instagram</h3>
                <p className="text-brand-600 text-sm font-medium">@rural24ar</p>
                <p className="text-gray-500 text-xs mt-1">Seguinos para novedades del sector</p>
              </div>
            </a>

            {/* Horario */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Horario de atención</h3>
                <p className="text-gray-700 text-sm">Lunes a viernes</p>
                <p className="text-gray-500 text-xs mt-0.5">9:00 a 18:00 hs (Argentina)</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Ubicación */}
      <section className="pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Origen</h3>
              <p className="text-gray-700 text-sm">Mendoza, Argentina</p>
              <p className="text-gray-500 text-xs mt-0.5">
                Somos un equipo 100% argentino especializado en el sector agropecuario.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

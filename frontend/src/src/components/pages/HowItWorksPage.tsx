import React from 'react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      {/* Hero Section */}
      <section className="bg-[#16a135] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            ¿Cómo funciona RURAL24?
          </h1>
          <p className="text-xl text-green-50">
            La plataforma que conecta al agro argentino de forma simple y directa
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          
          {/* Intro */}
          <div className="text-center mb-16">
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              AgroBuscador es el marketplace del agro donde compradores y vendedores 
              se encuentran sin intermediarios, de forma rápida y segura.
            </p>
          </div>

          {/* 3 Pasos */}
          <div className="grid md:grid-cols-3 gap-12 mb-16">
            {/* Paso 1 - Para Compradores */}
            <div className="text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-5xl" role="img" aria-label="search">🔍</span>
              </div>
              <div className="bg-[#16a135] text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                1
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Buscá lo que necesitás</h3>
              <p className="text-gray-600 leading-relaxed">
                Usá nuestros filtros para encontrar maquinaria, insumos, animales, 
                inmuebles o servicios agrícolas. Todo clasificado por categoría y ubicación.
              </p>
            </div>

            {/* Paso 2 - Contacto */}
            <div className="text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-5xl" role="img" aria-label="chat">💬</span>
              </div>
              <div className="bg-[#16a135] text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                2
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Contactá al vendedor</h3>
              <p className="text-gray-600 leading-relaxed">
                Hablá directamente con el vendedor a través del formulario de contacto. 
                Sin intermediarios, sin comisiones, sin vueltas.
              </p>
            </div>

            {/* Paso 3 - Cierre */}
            <div className="text-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-5xl" role="img" aria-label="handshake">🤝</span>
              </div>
              <div className="bg-[#16a135] text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                3
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Cerrá el negocio</h3>
              <p className="text-gray-600 leading-relaxed">
                Coordiná precio, forma de pago y entrega directamente con el vendedor. 
                Vos decidís las condiciones de la operación.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-green-200 my-16"></div>

          {/* Para Vendedores */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-10">
              <span className="text-5xl mb-4 block" role="img" aria-label="megaphone">📢</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                ¿Querés vender?
              </h2>
              <p className="text-xl text-gray-600">
                Publicá tus avisos de forma <strong className="text-[#16a135]">GRATUITA</strong>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
              {/* Beneficios Col 1 */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl text-green-600 mt-1">✓</span>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Registro gratuito</h4>
                    <p className="text-gray-600 text-sm">
                      Creá tu cuenta en minutos y empezá a publicar
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-2xl text-green-600 mt-1">✓</span>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Sin comisiones</h4>
                    <p className="text-gray-600 text-sm">
                      No cobramos ningún porcentaje de tu venta
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl text-green-600 mt-1">✓</span>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Avisos ilimitados</h4>
                    <p className="text-gray-600 text-sm">
                      Publicá todos los productos que quieras
                    </p>
                  </div>
                </div>
              </div>

              {/* Beneficios Col 2 */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl text-green-600 mt-1">✓</span>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Contacto directo</h4>
                    <p className="text-gray-600 text-sm">
                      Recibí mensajes directos de compradores interesados
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl text-green-600 mt-1">✓</span>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Fácil de usar</h4>
                    <p className="text-gray-600 text-sm">
                      Interfaz simple para gestionar tus publicaciones
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl text-green-600 mt-1">✓</span>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Visibilidad inmediata</h4>
                    <p className="text-gray-600 text-sm">
                      Tus avisos se publican al instante
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <a 
                href="#/"
                className="inline-block bg-[#16a135] hover:bg-[#0e7d25] text-white px-10 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg"
              >
                🚀 Empezar a vender ahora
              </a>
              <p className="text-sm text-gray-500 mt-4">
                En menos de 3 minutos podés tener tu primer aviso publicado
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 text-center">
            <div className="bg-green-50 rounded-xl p-8 inline-block">
              <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                <div>
                  <div className="text-3xl font-bold text-[#16a135]">🔍</div>
                  <p className="text-sm text-gray-600 mt-2">Miles de avisos</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#16a135]">👥</div>
                  <p className="text-sm text-gray-600 mt-2">Cientos de usuarios</p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#16a135]">💬</div>
                  <p className="text-sm text-gray-600 mt-2">Contactos diarios</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

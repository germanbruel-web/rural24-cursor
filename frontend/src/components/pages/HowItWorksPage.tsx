import React from 'react';
import { HelpCircle, FileText, DollarSign, Tag, Users, Camera, Ban, Mail, Shield } from 'lucide-react';
import { navigateTo } from '../../hooks/useNavigate';

interface FAQItem {
  icon: React.ReactNode;
  question: string;
  answer: string | React.ReactNode;
}

export const HowItWorksPage: React.FC = () => {
  const faqItems: FAQItem[] = [
    {
      icon: <FileText className="w-6 h-6" />,
      question: '¿Cómo funciona RURAL 24?',
      answer: 'El funcionamiento de RURAL 24 es simple y directo. Los usuarios publican anuncios con información detallada sobre el producto o servicio ofrecido y los interesados se contactan directamente con el anunciante para acordar los términos de la operación. RURAL 24 no participa en la negociación ni en el cobro de pagos, actuando únicamente como plataforma de difusión y contacto.'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      question: '¿Cómo publicar un aviso en RURAL 24?',
      answer: 'Para publicar un aviso es necesario registrarse en la plataforma y completar un formulario con los datos del anuncio. Se recomienda elegir correctamente la categoría, incluir un título claro, una descripción precisa y fotografías reales del producto o servicio. Una vez publicado, el aviso puede ser editado o actualizado en cualquier momento desde la cuenta del usuario.'
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      question: '¿Publicar avisos tiene costo?',
      answer: 'La publicación de avisos en RURAL 24 es gratuita. Los usuarios pueden cargar anuncios sin costo y recibir consultas de potenciales compradores o interesados. De manera opcional, la plataforma puede ofrecer espacios de promoción o avisos destacados para quienes deseen mayor visibilidad.'
    },
    {
      icon: <Tag className="w-6 h-6" />,
      question: '¿Qué tipo de anuncios se pueden publicar?',
      answer: 'En RURAL 24 se pueden publicar avisos relacionados con maquinaria agrícola, vehículos rurales, ganado, insumos agropecuarios, herramientas, terrenos, campos, servicios rurales, alquiler de equipamiento y actividades vinculadas al sector productivo del campo.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      question: '¿Quiénes pueden publicar en RURAL 24?',
      answer: 'Pueden publicar avisos tanto particulares como productores, comerciantes, contratistas y empresas del sector agropecuario. No es necesario ser una empresa para utilizar la plataforma, siempre que la información publicada sea real y cumpla con las normas del sitio.'
    },
    {
      icon: <Camera className="w-6 h-6" />,
      question: 'Recomendaciones para publicar un buen aviso',
      answer: 'Para mejorar la visibilidad y la calidad del aviso se recomienda utilizar fotos claras, actuales y representativas, detallar correctamente el estado del producto o servicio, indicar la ubicación y dejar medios de contacto actualizados. La información clara y completa genera mayor confianza y facilita el contacto entre las partes.'
    },
    {
      icon: <Ban className="w-6 h-6" />,
      question: '¿Qué publicaciones no están permitidas?',
      answer: 'No se permiten avisos que incluyan productos o servicios ilegales, información falsa, contenido ofensivo, artículos prohibidos por la legislación vigente ni publicaciones que infrinjan derechos de terceros. RURAL 24 se reserva el derecho de eliminar avisos que no cumplan con estas condiciones.'
    },
    {
      icon: <Mail className="w-6 h-6" />,
      question: '¿Cómo contactar a un anunciante?',
      answer: 'Los usuarios interesados pueden comunicarse con el anunciante a través de los datos de contacto disponibles en cada aviso. El contacto se realiza de forma directa entre las partes sin intervención de la plataforma.'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      question: 'Seguridad y responsabilidad',
      answer: 'RURAL 24 recomienda a sus usuarios verificar la información antes de concretar cualquier operación y realizar los acuerdos de manera responsable. La plataforma no garantiza las operaciones realizadas entre usuarios ni actúa como intermediaria en conflictos o transacciones.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-brand-50">
      {/* Hero Section */}
      <section className="bg-brand-500 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <HelpCircle className="w-16 h-16 text-white/80" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            ¿Qué es RURAL 24?
          </h1>
          <p className="text-xl text-brand-50 max-w-3xl mx-auto leading-relaxed">
            RURAL 24 es una plataforma digital de clasificados especializada en el sector agropecuario. 
            Su objetivo es conectar de forma directa a productores, contratistas, empresas y particulares 
            del ámbito rural que desean comprar, vender o alquilar productos y servicios vinculados al campo.
          </p>
        </div>
      </section>

      {/* Descripción adicional */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-lg text-gray-700 leading-relaxed">
            El sitio funciona como un espacio de contacto entre las partes, permitiendo publicar avisos 
            y recibir consultas <strong className="text-brand-500">sin intermediarios ni comisiones</strong> por operación.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Preguntas Frecuentes
          </h2>
          
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                {/* Question Header */}
                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-brand-50 to-white border-b border-brand-100">
                  <div className="flex-shrink-0 w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center text-white">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {item.question}
                  </h3>
                </div>
                
                {/* Answer Body */}
                <div className="p-6 text-gray-700 leading-relaxed">
                  {item.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-xl text-brand-50 mb-8">
            Publicá tu primer aviso gratis en menos de 3 minutos
          </p>
          <button 
            onClick={() => navigateTo('/')}
            className="inline-block bg-white hover:bg-gray-100 text-brand-500 px-10 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-lg"
          >
            🚀 Publicar ahora
          </button>
        </div>
      </section>
    </div>
  );
};

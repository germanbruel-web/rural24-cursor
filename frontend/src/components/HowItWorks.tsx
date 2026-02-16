import React from 'react';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: 1,
      emoji: '📝',
      title: 'Registrate',
      description: 'Creá tu cuenta gratis en minutos',
    },
    {
      number: 2,
      emoji: '📢',
      title: 'Publicá',
      description: 'Subí tu aviso con fotos y detalles',
    },
    {
      number: 3,
      emoji: '💰',
      title: 'Vendé',
      description: 'Conectá con compradores de todo el país',
    },
  ];

  return (
    <section className="bg-gradient-to-b from-white via-gray-100 to-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800">
          ¿Cómo funciona?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-300 border border-gray-200"
            >
              {/* Número del paso */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-500 text-white font-bold text-lg mb-4">
                {step.number}
              </div>
              
              {/* Emoji */}
              <div className="text-6xl mb-4">
                {step.emoji}
              </div>
              
              {/* Título */}
              <h3 className="text-2xl font-bold mb-3 text-gray-800">
                {step.title}
              </h3>
              
              {/* Descripción */}
              <p className="text-gray-600 text-lg">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

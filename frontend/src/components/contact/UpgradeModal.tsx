import { X, Zap, CheckCircle, TrendingUp } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
}

/**
 * 🚀 Modal de conversión para upgrade a PREMIUM
 * - Muestra beneficios de Premium
 * - Precios reales confirmados: $12,000/mes (Particular), $50,000/mes (Empresa)
 * - CTA a página de planes
 */
export default function UpgradeModal({ isOpen, onClose, planName }: UpgradeModalProps) {
  if (!isOpen) return null;

  const benefits = [
    {
      icon: '📣',
      title: 'Avisos Ilimitados',
      description: 'Publicá todos los productos que quieras sin restricciones',
    },
    {
      icon: '💬',
      title: 'Contactos Ilimitados',
      description: 'Enviá y recibí tantos mensajes como necesites',
    },
    {
      icon: '⭐',
      title: 'Destacado en Búsquedas',
      description: 'Tus avisos aparecen primero en los resultados',
    },
    {
      icon: '📊',
      title: 'Estadísticas Avanzadas',
      description: 'Seguí el rendimiento de tus publicaciones',
    },
    {
      icon: '🏆',
      title: 'Badge Premium',
      description: 'Perfil verificado con mayor confianza',
    },
    {
      icon: '🎯',
      title: 'Soporte Prioritario',
      description: 'Atención preferencial ante consultas',
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-brand-950">Upgrade a Premium</h3>
              <p className="text-sm text-gray-600">Desbloquea todo el potencial de RURAL 24</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensaje personalizado según plan actual */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>Tu plan actual ({planName})</strong> tiene límites en avisos y contactos. 
            Con <strong>Premium</strong> podés crecer sin restricciones.
          </p>
        </div>

        {/* Grid de beneficios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="text-2xl">{benefit.icon}</span>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">{benefit.title}</h4>
                <p className="text-xs text-gray-600">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Planes */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h4 className="font-bold text-lg text-gray-900 mb-4 text-center">Elegí tu Plan Premium</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Plan Particular */}
            <div className="border-2 border-blue-300 rounded-lg p-5 hover:border-blue-500 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <h5 className="font-bold text-lg text-gray-900">Premium Particular</h5>
              </div>
              <div className="mb-3">
                <span className="text-3xl font-bold text-brand-600">$12.000</span>
                <span className="text-gray-600 text-sm">/mes</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1 mb-4">
                <li>✓ Avisos ilimitados</li>
                <li>✓ Contactos ilimitados</li>
                <li>✓ Destacado en búsquedas</li>
                <li>✓ Badge Premium</li>
              </ul>
              <p className="text-xs text-gray-500">
                📆 Pago anual: <strong>$100.000</strong> (ahorrás $44.000)
              </p>
            </div>

            {/* Plan Empresa */}
            <div className="border-2 border-amber-300 rounded-lg p-5 hover:border-amber-500 transition-colors relative">
              <div className="absolute -top-3 right-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                MÁS POPULAR
              </div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <h5 className="font-bold text-lg text-gray-900">Premium Empresa</h5>
              </div>
              <div className="mb-3">
                <span className="text-3xl font-bold text-brand-600">$50.000</span>
                <span className="text-gray-600 text-sm">/mes</span>
              </div>
              <ul className="text-xs text-gray-600 space-y-1 mb-4">
                <li>✓ Todo de Premium Particular</li>
                <li>✓ CUIT verificado</li>
                <li>✓ Perfil empresarial destacado</li>
                <li>✓ Prioridad en búsquedas</li>
                <li>✓ Soporte VIP</li>
              </ul>
              <p className="text-xs text-gray-500">
                📆 Pago anual: <strong>$500.000</strong> (ahorrás $100.000)
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Ahora No
          </button>
          <button
            onClick={() => {
              onClose();
              window.location.href = '/planes'; // TODO: Ajustar ruta según tu app
            }}
            className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-[#0e7d28] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Ver Planes Completos
          </button>
        </div>

        {/* Garantía */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🛡️ <strong>Garantía de 30 días</strong> - Si no estás satisfecho, te devolvemos tu dinero
          </p>
        </div>
      </div>
    </div>
  );
}

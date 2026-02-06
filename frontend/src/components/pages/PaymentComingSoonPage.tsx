/**
 * PaymentComingSoonPage.tsx
 * Página placeholder para el sistema de pagos
 * 
 * Muestra que próximamente estará disponible MercadoPago
 */

import React from 'react';
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  Clock, 
  CheckCircle,
  Mail,
  Bell
} from 'lucide-react';

export const PaymentComingSoonPage: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);

  const handleNotifyMe = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Guardar email para notificación
    setSubscribed(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-[800px] mx-auto px-4 py-4">
          <button
            onClick={() => window.history.back()}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[800px] mx-auto px-4 py-16">
        <div className="text-center">
          {/* Logo MercadoPago */}
          <div className="w-24 h-24 bg-[#00b1ea] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <CreditCard className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ¡Próximamente!
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
            Estamos integrando <strong className="text-[#00b1ea]">MercadoPago</strong> para que puedas pagar de forma rápida y segura.
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Pago Seguro</h3>
              <p className="text-sm text-gray-600">
                Todas tus transacciones protegidas con la seguridad de MercadoPago
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Múltiples Medios</h3>
              <p className="text-sm text-gray-600">
                Tarjetas, transferencias, efectivo en Pago Fácil y Rapipago
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Activación Inmediata</h3>
              <p className="text-sm text-gray-600">
                Tu plan o créditos se activan al instante después del pago
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-12 max-w-md mx-auto">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Estado de la Integración
            </h3>
            
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Sistema de planes y precios</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Sistema de créditos y destacados</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-700">Carrito de compras</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                </div>
                <span className="text-gray-700 font-semibold">Integración MercadoPago</span>
              </div>
              <div className="flex items-center gap-3 opacity-50">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                <span className="text-gray-500">Facturación automática</span>
              </div>
            </div>
          </div>

          {/* Notify Form */}
          {!subscribed ? (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 rounded-2xl max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2 text-white mb-4">
                <Bell className="w-5 h-5" />
                <h3 className="font-semibold">¿Querés que te avisemos?</h3>
              </div>
              <p className="text-blue-100 text-sm mb-4">
                Dejá tu email y te notificamos cuando esté listo
              </p>
              <form onSubmit={handleNotifyMe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="flex-1 px-4 py-2 rounded-lg border-0 focus:ring-2 focus:ring-white"
                  required
                />
                <button
                  type="submit"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-green-100 p-8 rounded-2xl max-w-md mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-green-800 mb-2">¡Listo!</h3>
              <p className="text-green-700">
                Te avisaremos a <strong>{email}</strong> cuando los pagos estén disponibles.
              </p>
            </div>
          )}

          {/* Mientras tanto */}
          <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-xl max-w-lg mx-auto">
            <h3 className="font-semibold text-amber-900 mb-2">🎉 Mientras tanto...</h3>
            <p className="text-amber-800 text-sm">
              Podés empezar a usar Rural24 con el <strong>plan gratuito</strong> y reclamar <strong>3 créditos gratis</strong> para destacar tus avisos desde "Mis Avisos" en tu dashboard.
            </p>
            <button
              onClick={() => window.location.hash = '#/dashboard'}
              className="mt-4 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentComingSoonPage;

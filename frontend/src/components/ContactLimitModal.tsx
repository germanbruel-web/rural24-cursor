import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ContactLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  limit: number;
}

export const ContactLimitModal: React.FC<ContactLimitModalProps> = ({
  isOpen,
  onClose,
  currentCount,
  limit
}) => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 200);
  };

  if (!isOpen) return null;

  const remaining = limit - currentCount;
  const isAtLimit = remaining <= 0;
  const isNearLimit = remaining > 0 && remaining <= 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${
          show ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-lg shadow-2xl max-w-md w-full transform transition-all duration-200 ${
          show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${isAtLimit ? 'bg-red-50' : 'bg-yellow-50'}`}>
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            {isAtLimit ? (
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            ) : (
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {isAtLimit ? 'Límite Alcanzado' : 'Límite Próximo'}
              </h3>
              <p className="text-sm text-gray-600">
                Plan Gratuito
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {currentCount} / {limit}
              </div>
              <div className="text-sm text-gray-600">
                {isAtLimit ? (
                  'Has recibido el máximo de contactos'
                ) : (
                  <>Te quedan <span className="font-semibold text-gray-900">{remaining}</span> contactos</>
                )}
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="text-gray-700 leading-relaxed">
            {isAtLimit ? (
              <p>
                Has alcanzado el <strong>límite de {limit} contactos</strong> de tu plan gratuito. 
                Para seguir recibiendo formularios de contacto, actualiza a <strong>Premium</strong>.
              </p>
            ) : (
              <p>
                Estás cerca de alcanzar tu límite. Con el plan gratuito puedes recibir hasta <strong>{limit} contactos</strong>.
                Actualiza a <strong>Premium</strong> para contactos ilimitados.
              </p>
            )}
          </div>

          {/* Premium Benefits */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-yellow-600" />
              <h4 className="font-bold text-gray-900">Beneficios Premium</h4>
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                <span><strong>Contactos ilimitados</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                <span>Hasta <strong>10 o 50 avisos</strong> (según tipo)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                <span><strong>Bandeja de entrada</strong> exclusiva</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                <span><strong>Verificación</strong> de cuenta</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></div>
                <span><strong>Destacados</strong> en búsquedas</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              handleClose();
              // TODO: Navigate to premium upgrade page
              alert('Próximamente: página de upgrade a Premium');
            }}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5" />
            Actualizar a Premium
          </button>
        </div>
      </div>
    </div>
  );
};

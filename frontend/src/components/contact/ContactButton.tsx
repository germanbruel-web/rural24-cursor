import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserContactLimits, getContactLimitWarnings, type ContactLimits } from '../../services/contactLimitsService';

interface ContactButtonProps {
  adId: string;
  adOwnerId: string;
  onOpenModal: () => void;
  className?: string;
}

/**
 * 📞 Botón "Contactar" con validaciones y badge de uso
 * - Verifica autenticación
 * - Verifica email verificado
 * - Muestra badge si >75% del límite
 * - Se deshabilita si 100% del límite
 */
export default function ContactButton({ adId, adOwnerId, onOpenModal, className = '' }: ContactButtonProps) {
  const { user, profile } = useAuth();
  const [limits, setLimits] = useState<ContactLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLimits();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadLimits = async () => {
    if (!user) return;
    
    setLoading(true);
    const userLimits = await getUserContactLimits(user.id);
    setLimits(userLimits);
    setLoading(false);
  };

  const handleClick = () => {
    // Si no está logueado, el modal de contacto manejará el flujo de login
    if (!user) {
      onOpenModal();
      return;
    }

    // Si no tiene email verificado, el modal de contacto mostrará el mensaje
    if (!profile?.email_verified) {
      onOpenModal();
      return;
    }

    // Si alcanzó el límite, el modal de contacto mostrará el upgrade
    onOpenModal();
  };

  // Calcular porcentaje de uso
  const usagePercentage = limits ? Math.round((limits.currentSent / limits.maxSent) * 100) : 0;
  const warnings = limits ? getContactLimitWarnings(limits) : null;
  const showBadge = warnings && warnings.length > 0;
  const isDisabled = limits ? limits.currentSent >= limits.maxSent : false;

  // Color del badge según el nivel de uso
  const getBadgeColor = () => {
    if (usagePercentage >= 100) return 'bg-red-500';
    if (usagePercentage >= 75) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isDisabled && user !== null}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all shadow-md
          ${isDisabled && user !== null
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-brand-600 hover:bg-brand-500 text-white'
          }
          ${className}
        `}
      >
        <MessageSquare className="w-5 h-5" />
        <span>
          {loading ? 'Cargando...' : 
           isDisabled && user !== null ? 'Límite Alcanzado' : 
           'Contactar'}
        </span>
      </button>

      {/* Badge de uso (75%+) */}
      {showBadge && user && (
        <div className={`
          absolute -top-2 -right-2 ${getBadgeColor()} text-white text-xs font-bold
          rounded-full w-8 h-8 flex items-center justify-center border-2 border-white
          shadow-lg
        `}>
          {usagePercentage >= 100 ? '!' : `${usagePercentage}%`}
        </div>
      )}

      {/* Tooltip de uso */}
      {limits && user && (
        <div className="absolute -bottom-8 left-0 right-0 text-center text-xs text-gray-600">
          {limits.currentSent}/{limits.maxSent} contactos enviados
        </div>
      )}
    </div>
  );
}

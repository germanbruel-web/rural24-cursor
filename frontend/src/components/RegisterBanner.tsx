import { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterBannerProps {
  onRegisterClick: () => void;
}

export const RegisterBanner: React.FC<RegisterBannerProps> = ({ onRegisterClick }) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem('register-banner-dismissed');
    if (dismissed === 'true') setIsVisible(false);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('register-banner-dismissed', 'true');
  };

  // No mostrar si el usuario está logueado o si fue cerrado
  if (!isVisible || user) return null;

  return (
    <div className="bg-brand-50 border-b-2 border-brand-200 py-3 px-4 relative animate-slideDown">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Megaphone className="w-6 h-6 text-brand-500" />
          <p className="text-sm md:text-base text-gray-800">
            <strong className="text-brand-500">¿Querés vender?</strong> Registrate GRATIS y publicá tus avisos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRegisterClick}
            className="bg-brand-500 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 whitespace-nowrap"
          >
            Registrarme ahora →
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-brand-100 rounded transition-colors flex-shrink-0"
            aria-label="Cerrar banner"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

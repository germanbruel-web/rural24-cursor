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
    <div className="bg-green-50 border-b-2 border-green-200 py-3 px-4 relative animate-slideDown">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Megaphone className="w-6 h-6 text-[#16a135]" />
          <p className="text-sm md:text-base text-gray-800">
            <strong className="text-[#16a135]">¿Querés vender?</strong> Registrate GRATIS y publicá tus avisos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRegisterClick}
            className="bg-[#16a135] hover:bg-[#0e7d25] text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 whitespace-nowrap"
          >
            Registrarme ahora →
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-green-100 rounded transition-colors flex-shrink-0"
            aria-label="Cerrar banner"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

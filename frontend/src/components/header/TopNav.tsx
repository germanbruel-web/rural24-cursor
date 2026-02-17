/**
 * TopNav.tsx
 * Barra superior secundaria - Design System RURAL24
 * 
 * Mobile:  ☀ 24°C · USD $1.085  |  [+ PUBLICAR]
 * Desktop: ☀ 24°C · Buenos Aires · USD Oficial/Blue  |  Links secundarios
 */

import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, Wind, MapPin, DollarSign, PlusCircle } from 'lucide-react';
import type { Page } from '../../../App';

interface WeatherData {
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'windy';
  location: string;
}

interface TopNavProps {
  onNavigate: (page: Page) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onNavigate }) => {
  const [weather] = useState<WeatherData>({
    temp: 24,
    condition: 'sunny',
    location: 'Buenos Aires',
  });

  const [dollarRates, setDollarRates] = useState({
    oficial: 0,
    blue: 0,
  });

  // Cotización del dólar en tiempo real (dolarapi.com - Argentina)
  useEffect(() => {
    const fetchDollar = async () => {
      try {
        const [oficialRes, blueRes] = await Promise.all([
          fetch('https://dolarapi.com/v1/dolares/oficial'),
          fetch('https://dolarapi.com/v1/dolares/blue'),
        ]);
        if (oficialRes.ok && blueRes.ok) {
          const oficial = await oficialRes.json();
          const blue = await blueRes.json();
          setDollarRates({
            oficial: Math.round(oficial.venta || 0),
            blue: Math.round(blue.venta || 0),
          });
        }
      } catch (error) {
        console.warn('Error fetching dollar rates:', error);
      }
    };

    fetchDollar();
    const interval = setInterval(fetchDollar, 30 * 60 * 1000); // Cada 30 min
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = () => {
    const iconClass = "w-4 h-4";
    switch (weather.condition) {
      case 'sunny':
        return <Sun className={`${iconClass} text-yellow-500`} />;
      case 'cloudy':
        return <Cloud className={`${iconClass} text-gray-400`} />;
      case 'rainy':
        return <CloudRain className={`${iconClass} text-blue-400`} />;
      case 'windy':
        return <Wind className={`${iconClass} text-gray-500`} />;
      default:
        return <Sun className={`${iconClass} text-yellow-500`} />;
    }
  };

  const getWeatherText = () => {
    switch (weather.condition) {
      case 'sunny': return 'Soleado';
      case 'cloudy': return 'Nublado';
      case 'rainy': return 'Lluvia';
      case 'windy': return 'Ventoso';
      default: return 'Parcial';
    }
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10 sm:h-10">
          
          {/* ===== MOBILE: Clima + Dólar (izq) + PUBLICAR (der) ===== */}
          <div className="flex md:hidden items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-gray-600 font-sans">
              {getWeatherIcon()}
              <span className="font-medium">{weather.temp}°</span>
              <span className="text-gray-300">·</span>
              <span className="font-medium">USD</span>
              {dollarRates.oficial > 0 ? (
                <span className="text-brand-600 font-semibold">${dollarRates.oficial.toLocaleString()}</span>
              ) : (
                <span className="text-brand-600 font-semibold">$1.085</span>
              )}
            </div>
            <button
              onClick={() => { window.location.hash = '#/publicar'; }}
              className="flex items-center gap-1.5 px-5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-full min-h-[34px] transition-colors active:scale-95"
            >
              <PlusCircle size={14} />
              PUBLICAR
            </button>
          </div>

          {/* ===== DESKTOP: Clima completo (izq) + Links (der) ===== */}
          <div className="hidden md:flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-1.5 hover:text-gray-900 cursor-pointer transition-colors" title="Clima actual">
              {getWeatherIcon()}
              <span className="font-medium">{weather.temp}°C</span>
              <span className="hidden sm:inline">· {getWeatherText()}</span>
            </div>
            
            <div className="flex items-center gap-1 text-gray-500">
              <MapPin className="w-3 h-3" />
              <span className="text-xs">{weather.location}</span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 ml-2 text-gray-500">
              <div className="w-px h-4 bg-gray-300" />
              <DollarSign className="w-3 h-3" />
              {dollarRates.oficial > 0 ? (
                <span className="text-xs">
                  Oficial ${dollarRates.oficial.toLocaleString()} · Blue ${dollarRates.blue.toLocaleString()}
                </span>
              ) : (
                <span className="text-xs text-gray-400">Cargando...</span>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 text-sm text-gray-500">
            <button
              onClick={() => onNavigate('how-it-works')}
              className="px-2 py-1 hover:text-gray-900 hover:underline transition-colors"
            >
              Preguntas Frecuentes
            </button>
            <span className="text-gray-300">·</span>
            <button
              onClick={() => onNavigate('pricing')}
              className="px-2 py-1 hover:text-gray-900 hover:underline transition-colors"
            >
              Servicios
            </button>
            <span className="text-gray-300">·</span>
            <button
              onClick={() => onNavigate('how-it-works')}
              className="px-2 py-1 hover:text-gray-900 hover:underline transition-colors"
            >
              Sobre Rural24
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TopNav;

/**
 * TopNav.tsx
 * Barra superior secundaria - Design System RURAL24
 * 
 * Estructura (Height: 40px):
 * ┌─────────────────┬──────────────────┬────────────────────────┐
 * │ Widget Clima    │  Espacio libre   │ Links secundarios      │
 * │ (Izquierda)     │  (Alertas)       │ (Derecha)              │
 * └─────────────────┴──────────────────┴────────────────────────┘
 */

import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, Wind, MapPin, DollarSign } from 'lucide-react';
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
  const [weather, setWeather] = useState<WeatherData>({
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
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10">
          
          {/* COLUMNA 1: Widget Clima */}
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-1.5 hover:text-gray-900 cursor-pointer transition-colors" title="Clima actual">
              {getWeatherIcon()}
              <span className="font-medium">{weather.temp}°C</span>
              <span className="hidden sm:inline">· {getWeatherText()}</span>
            </div>
            
            <div className="hidden md:flex items-center gap-1 text-gray-500">
              <MapPin className="w-3 h-3" />
              <span className="text-xs">{weather.location}</span>
            </div>

            {/* Dólar (solo desktop) */}
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

          {/* COLUMNA 2: Espacio central para alertas institucionales */}
          <div className="hidden xl:flex flex-1 justify-center max-w-md mx-4">
            {/* Aquí se pueden agregar alertas rotativas o badges informativos */}
            {/* Ejemplo: "✅ +15.000 anuncios activos" */}
          </div>

          {/* COLUMNA 3: Links secundarios */}
          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500">
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

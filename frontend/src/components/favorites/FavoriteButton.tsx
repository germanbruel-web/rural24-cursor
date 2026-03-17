/**
 * FavoriteButton
 * Botón corazón para guardar/quitar un aviso de favoritos.
 * Diseño sutil: outline cuando inactivo, relleno cuando activo.
 * Se coloca en la esquina superior derecha de la imagen del card.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isAdFavorited, toggleAdFavorite } from '../../services/favoritesService';
import { cn } from '../../design-system/utils';

interface FavoriteButtonProps {
  adId: string;
  /** 'card' = pequeño, absoluto en imagen | 'detail' = más grande, en línea */
  variant?: 'card' | 'detail';
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  adId,
  variant = 'card',
  className,
}) => {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const checkFav = useCallback(async () => {
    if (!user || !adId) return;
    const fav = await isAdFavorited(user.id, adId);
    setFavorited(fav);
  }, [user, adId]);

  useEffect(() => { checkFav(); }, [checkFav]);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user || loading) return;

    setLoading(true);
    try {
      const nowFav = await toggleAdFavorite(user.id, adId);
      setFavorited(nowFav);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  };

  // No renderizar si no está autenticado
  if (!user) return null;

  if (variant === 'card') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        aria-label={favorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        className={cn(
          'absolute top-2 right-2 z-10',
          'w-7 h-7 rounded-full flex items-center justify-center',
          'bg-white/80 backdrop-blur-sm shadow-sm',
          'transition-all duration-200 hover:scale-110 active:scale-95',
          loading && 'opacity-50',
          className
        )}
      >
        <Heart
          size={14}
          strokeWidth={2}
          className={cn(
            'transition-colors duration-200',
            favorited ? 'fill-red-500 text-red-500' : 'text-gray-500'
          )}
        />
      </button>
    );
  }

  // variant === 'detail'
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={favorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200',
        favorited
          ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
          : 'border-gray-200 bg-white text-gray-500 hover:border-red-200 hover:text-red-400',
        loading && 'opacity-50',
        className
      )}
    >
      <Heart
        size={16}
        strokeWidth={2}
        className={favorited ? 'fill-red-500' : ''}
      />
      <span className="text-sm font-medium">
        {favorited ? 'Guardado' : 'Guardar'}
      </span>
    </button>
  );
};

export default FavoriteButton;

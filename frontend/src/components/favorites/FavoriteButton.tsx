/**
 * FavoriteButton
 * Ícono corazón para guardar/quitar un aviso de favoritos.
 * Estilo: stroke blanco, hover/activo fill brand-600 (verde).
 * Solo visible para usuarios autenticados.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isAdFavorited, toggleAdFavorite } from '../../services/favoritesService';
import { cn } from '../../design-system/utils';

interface FavoriteButtonProps {
  adId: string;
  className?: string;
  /** Sólo se mantiene por compatibilidad — el estilo es siempre ícono */
  variant?: 'card' | 'detail';
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  adId,
  className,
}) => {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

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

  if (!user) return null;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={favorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={cn(
        'absolute top-2 right-2 z-10',
        'flex items-center justify-center',
        'transition-transform duration-150 hover:scale-110 active:scale-95',
        loading && 'opacity-50',
        className
      )}
    >
      <Heart
        size={20}
        strokeWidth={2}
        className={cn(
          'transition-all duration-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]',
          favorited
            ? 'fill-brand-600 text-brand-600'
            : 'fill-transparent text-white hover:fill-brand-600 hover:text-brand-600'
        )}
      />
    </button>
  );
};

export default FavoriteButton;

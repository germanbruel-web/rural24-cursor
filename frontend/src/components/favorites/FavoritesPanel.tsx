/**
 * FavoritesPanel
 * Panel completo de favoritos del usuario.
 * Tab 1: Avisos guardados (bookmarks de avisos específicos)
 * Tab 2: Categorías seguidas (subcategorías con alerta de nuevos avisos)
 */

import React, { useState, useEffect } from 'react';
import { Heart, Bell, BellOff, Trash2, ExternalLink, Tag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getFavoriteAds,
  getFollowedSubcategories,
  toggleAdFavorite,
  toggleSubcategoryFollow,
  type FavoriteAd,
  type FavoriteSubcategory,
} from '../../services/favoritesService';
import { navigateTo } from '../../hooks/useNavigate';
import { getImageVariant } from '../../utils/imageOptimizer';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../../constants/defaultImages';

type Tab = 'avisos' | 'categorias';

export const FavoritesPanel: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab]                     = useState<Tab>('avisos');
  const [ads, setAds]                     = useState<FavoriteAd[]>([]);
  const [subs, setSubs]                   = useState<FavoriteSubcategory[]>([]);
  const [loadingAds, setLoadingAds]       = useState(true);
  const [loadingSubs, setLoadingSubs]     = useState(true);

  useEffect(() => {
    if (!user) return;
    getFavoriteAds(user.id)
      .then(setAds)
      .finally(() => setLoadingAds(false));
    getFollowedSubcategories(user.id)
      .then(setSubs)
      .finally(() => setLoadingSubs(false));
  }, [user]);

  const handleRemoveAd = async (favId: string, adId: string) => {
    if (!user) return;
    await toggleAdFavorite(user.id, adId);
    setAds(prev => prev.filter(f => f.id !== favId));
  };

  const handleRemoveSub = async (favId: string, subId: string) => {
    if (!user) return;
    await toggleSubcategoryFollow(user.id, subId);
    setSubs(prev => prev.filter(f => f.id !== favId));
  };

  const formatPrice = (price?: number | null, currency?: string | null) => {
    if (!price || price <= 0) return '—';
    const sym = currency === 'USD' ? 'USD' : '$';
    return `${sym} ${new Intl.NumberFormat('es-AR').format(price)}`;
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Heart size={40} strokeWidth={1.5} className="mb-3 text-gray-300" />
        <p className="text-sm">Iniciá sesión para ver tus favoritos</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Heart size={22} className="text-red-500 fill-red-500" />
        <h1 className="text-xl font-bold text-gray-900">Mis Favoritos</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {([
          { id: 'avisos',     label: `Avisos guardados`,        count: ads.length },
          { id: 'categorias', label: `Categorías seguidas`, count: subs.length },
        ] as { id: Tab; label: string; count: number }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.id ? 'bg-brand-100 text-brand-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: AVISOS GUARDADOS ── */}
      {tab === 'avisos' && (
        <>
          {loadingAds && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {!loadingAds && ads.length === 0 && (
            <div className="text-center py-16">
              <Heart size={40} strokeWidth={1.2} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 text-sm">Todavía no guardaste ningún aviso.</p>
              <p className="text-gray-400 text-xs mt-1">Tocá el corazón en cualquier aviso para guardarlo acá.</p>
            </div>
          )}

          <div className="space-y-3">
            {ads.map(fav => {
              const ad = fav.ad;
              const img = getImageVariant(
                (ad.images?.[0]) || DEFAULT_PLACEHOLDER_IMAGE,
                'card'
              );
              return (
                <div
                  key={fav.id}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3 hover:border-brand-300 transition-colors"
                >
                  {/* Imagen */}
                  <img
                    src={img}
                    alt={ad.title}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                    onError={e => { (e.target as HTMLImageElement).src = DEFAULT_PLACEHOLDER_IMAGE; }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{ad.title}</p>
                    <p className="text-xs text-brand-600 font-bold mt-0.5">
                      {formatPrice(ad.price, ad.currency)}
                    </p>
                    {ad.province && (
                      <p className="text-xs text-gray-400 mt-0.5">{ad.province}</p>
                    )}
                    {ad.status !== 'active' && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded font-medium">
                        No disponible
                      </span>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => navigateTo(`/ad/${ad.slug || ad.id}`)}
                      className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Ver aviso"
                    >
                      <ExternalLink size={15} />
                    </button>
                    <button
                      onClick={() => handleRemoveAd(fav.id, fav.ad_id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Quitar de favoritos"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── TAB: CATEGORÍAS SEGUIDAS ── */}
      {tab === 'categorias' && (
        <>
          {loadingSubs && (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {!loadingSubs && subs.length === 0 && (
            <div className="text-center py-16">
              <Bell size={40} strokeWidth={1.2} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 text-sm">No estás siguiendo ninguna categoría.</p>
              <p className="text-gray-400 text-xs mt-1">Seguí una subcategoría y te avisamos cuando haya nuevos avisos.</p>
            </div>
          )}

          <div className="space-y-3">
            {subs.map(fav => {
              const sub = fav.subcategory;
              return (
                <div
                  key={fav.id}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Tag size={18} className="text-brand-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {sub.display_name}
                    </p>
                    {sub.category && (
                      <p className="text-xs text-gray-400">{sub.category.display_name}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      fav.notify_new_ads
                        ? 'bg-brand-50 text-brand-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {fav.notify_new_ads ? 'Alertas activas' : 'Sin alertas'}
                    </span>
                    <button
                      onClick={() => handleRemoveSub(fav.id, fav.subcategory_id!)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Dejar de seguir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default FavoritesPanel;

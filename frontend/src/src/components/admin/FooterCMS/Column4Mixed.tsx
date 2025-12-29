/**
 * COLUMNA 4: LINKS + REDES SOCIALES
 */

import React from 'react';
import { Plus, Trash2, Link as LinkIcon, Twitter, Facebook, Instagram, Youtube, MessageCircle, TrendingUp, Linkedin } from 'lucide-react';
import type { FooterMixedColumn, FooterLinkItem, SocialLinkItem } from '../../../types/footer';

interface Props {
  column: FooterMixedColumn;
  onChange: (updated: FooterMixedColumn) => void;
}

const SOCIAL_ICONS: Record<SocialLinkItem['platform'], { icon: React.FC<any>; label: string; color: string }> = {
  twitter: { icon: Twitter, label: 'Twitter', color: 'text-blue-400' },
  facebook: { icon: Facebook, label: 'Facebook', color: 'text-blue-600' },
  instagram: { icon: Instagram, label: 'Instagram', color: 'text-pink-600' },
  whatsapp: { icon: MessageCircle, label: 'WhatsApp', color: 'text-green-600' },
  youtube: { icon: Youtube, label: 'YouTube', color: 'text-red-600' },
  tiktok: { icon: TrendingUp, label: 'TikTok', color: 'text-gray-900' },
  linkedin: { icon: Linkedin, label: 'LinkedIn', color: 'text-blue-700' }
};

export const Column4Mixed: React.FC<Props> = ({ column, onChange }) => {
  // Links
  const handleLinkAdd = () => {
    const newLink: FooterLinkItem = {
      id: `link-4-${Date.now()}`,
      label: '',
      url: '#/',
      order: column.links.length + 1,
      openNewTab: false
    };
    onChange({ ...column, links: [...column.links, newLink] });
  };

  const handleLinkRemove = (id: string) => {
    if (column.links.length === 1) {
      alert('Debe haber al menos 1 link');
      return;
    }
    onChange({ ...column, links: column.links.filter(link => link.id !== id) });
  };

  const handleLinkUpdate = (id: string, field: keyof FooterLinkItem, value: any) => {
    const updated = column.links.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    );
    onChange({ ...column, links: updated });
  };

  // Socials
  const handleSocialAdd = () => {
    // Encontrar primera plataforma no usada
    const usedPlatforms = column.socials.map(s => s.platform);
    const availablePlatforms = (Object.keys(SOCIAL_ICONS) as SocialLinkItem['platform'][])
      .filter(p => !usedPlatforms.includes(p));
    
    if (availablePlatforms.length === 0) {
      alert('Ya agregaste todas las redes sociales disponibles');
      return;
    }

    const newSocial: SocialLinkItem = {
      id: `social-${Date.now()}`,
      platform: availablePlatforms[0],
      url: 'https://',
      order: column.socials.length + 1
    };
    onChange({ ...column, socials: [...column.socials, newSocial] });
  };

  const handleSocialRemove = (id: string) => {
    if (column.socials.length === 1) {
      alert('Debe haber al menos 1 red social');
      return;
    }
    onChange({ ...column, socials: column.socials.filter(s => s.id !== id) });
  };

  const handleSocialUpdate = (id: string, field: keyof SocialLinkItem, value: any) => {
    const updated = column.socials.map(social => 
      social.id === id ? { ...social, [field]: value } : social
    );
    onChange({ ...column, socials: updated });
  };

  const getAvailablePlatforms = (currentPlatform: SocialLinkItem['platform']) => {
    const usedPlatforms = column.socials
      .map(s => s.platform)
      .filter(p => p !== currentPlatform);
    
    return (Object.keys(SOCIAL_ICONS) as SocialLinkItem['platform'][])
      .filter(p => !usedPlatforms.includes(p));
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título de la Columna
        </label>
        <input
          type="text"
          value={column.title}
          onChange={(e) => onChange({ ...column, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Links del Sitio"
        />
      </div>

      {/* Links Rápidos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <LinkIcon className="w-4 h-4" />
            Links Rápidos ({column.links.length})
          </label>
          <button
            onClick={handleLinkAdd}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Agregar
          </button>
        </div>

        <div className="space-y-2">
          {column.links.map((link, index) => (
            <div key={link.id} className="flex gap-2">
              <span className="w-6 h-8 flex items-center justify-center text-xs font-medium text-gray-500 flex-shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => handleLinkUpdate(link.id, 'label', e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  placeholder="Nombre"
                />
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => handleLinkUpdate(link.id, 'url', e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-mono"
                  placeholder="#/blog"
                />
              </div>
              <button
                onClick={() => handleLinkRemove(link.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Divisor */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            Redes Sociales ({column.socials.length}/7)
          </label>
          <button
            onClick={handleSocialAdd}
            disabled={column.socials.length >= 7}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            Agregar
          </button>
        </div>

        <div className="space-y-2">
          {column.socials.map((social) => {
            const SocialIcon = SOCIAL_ICONS[social.platform].icon;
            const iconColor = SOCIAL_ICONS[social.platform].color;
            const availablePlatforms = getAvailablePlatforms(social.platform);
            
            return (
              <div key={social.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-2">
                  <SocialIcon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-1`} />
                  <div className="flex-1 space-y-2">
                    <select
                      value={social.platform}
                      onChange={(e) => handleSocialUpdate(social.id, 'platform', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      <option value={social.platform}>
                        {SOCIAL_ICONS[social.platform].label}
                      </option>
                      {availablePlatforms.map(platform => (
                        <option key={platform} value={platform}>
                          {SOCIAL_ICONS[platform].label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="url"
                      value={social.url}
                      onChange={(e) => handleSocialUpdate(social.id, 'url', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-mono"
                      placeholder="https://..."
                    />
                  </div>
                  <button
                    onClick={() => handleSocialRemove(social.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

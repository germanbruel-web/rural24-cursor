/**
 * =====================================================
 * FOOTER DINÁMICO - Componente Principal
 * =====================================================
 * Footer que se renderiza dinámicamente desde la BD
 */

import React from 'react';
import { MapPin, Phone, Mail, Twitter, Facebook, Instagram, Youtube, MessageCircle, TrendingUp, Linkedin } from 'lucide-react';
import { useFooterConfig, useFooterCategories } from '../hooks/useFooterConfig';
import { useSiteSetting } from '../hooks/useSiteSetting';
import type { ContactItem, FooterLinkItem, SocialLinkItem } from '../types/footer';

interface FooterProps {
  onCategoryClick?: (category: string) => void;
}

// Mapeo de íconos
const CONTACT_ICONS: Record<string, React.FC<any>> = {
  MapPin,
  Phone,
  Mail
};

const SOCIAL_ICONS: Record<SocialLinkItem['platform'], React.FC<any>> = {
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  whatsapp: MessageCircle,
  youtube: Youtube,
  tiktok: TrendingUp,
  linkedin: Linkedin
};

export const Footer: React.FC<FooterProps> = ({ onCategoryClick }) => {
  const { config, isLoading } = useFooterConfig();
  const footerLogo = useSiteSetting('footer_logo', '/images/logos/logo.svg');
  
  // Obtener categorías dinámicas si column3.source === 'dynamic'
  const { categories } = useFooterCategories(config.column3.limit);
  
  if (isLoading) {
    return (
      <footer className="bg-black text-gray-300 py-12">
        <div className="max-w-[1400px] mx-auto px-4 text-center">
          <p className="text-gray-500">Cargando...</p>
        </div>
      </footer>
    );
  }

  const { column1, column2, column3, column4 } = config;

  // Determinar qué categorías mostrar
  const categoriesToShow = column3.source === 'dynamic' 
    ? categories 
    : (column3.manualItems || []);

  return (
    <footer className="bg-black text-gray-300">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Columna 1: Contacto */}
          <div>
            <div className="mb-4">
              <img 
                src={footerLogo}
                alt="RURAL24" 
                className="h-12 w-auto"
                onError={(e) => {
                  e.currentTarget.src = '/images/logos/logo.png';
                }}
              />
              <p className="text-sm text-gray-400 mt-2">{column1.slogan}</p>
            </div>
            
            <ul className="space-y-2 text-sm">
              {/* Direcciones */}
              {column1.addresses.sort((a, b) => a.order - b.order).map(addr => {
                const Icon = CONTACT_ICONS[addr.icon] || MapPin;
                return (
                  <li key={addr.id} className="flex items-start gap-2">
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{addr.text}</span>
                  </li>
                );
              })}
              
              {/* Teléfonos */}
              {column1.phones.sort((a, b) => a.order - b.order).map(phone => {
                const Icon = CONTACT_ICONS[phone.icon] || Phone;
                return (
                  <li key={phone.id} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{phone.text}</span>
                  </li>
                );
              })}
              
              {/* Emails */}
              {column1.emails.sort((a, b) => a.order - b.order).map(email => {
                const Icon = CONTACT_ICONS[email.icon] || Mail;
                return (
                  <li key={email.id} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{email.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Columna 2: Links Personalizados */}
          <div>
            <h3 className="text-white font-semibold mb-4 uppercase text-xs tracking-wide">{column2.title}</h3>
            <ul className="space-y-2">
              {column2.items.sort((a, b) => a.order - b.order).map(link => (
                <li key={link.id}>
                  <a 
                    href={link.url}
                    target={link.openNewTab ? '_blank' : undefined}
                    rel={link.openNewTab ? 'noopener noreferrer' : undefined}
                    className="text-sm font-normal text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Categorías */}
          <div>
            <h3 className="text-white font-semibold mb-4 uppercase text-xs tracking-wide">{column3.title}</h3>
            <ul className="space-y-2">
              {column3.source === 'dynamic' ? (
                // Categorías dinámicas desde BD
                categoriesToShow.map(cat => (
                  <li key={cat.id}>
                    <button
                      onClick={() => onCategoryClick(cat.name)}
                      className="text-sm font-normal text-gray-400 hover:text-white transition-colors text-left"
                    >
                      {cat.display_name || cat.name}
                    </button>
                  </li>
                ))
              ) : (
                // Categorías manuales
                categoriesToShow.sort((a, b) => a.order - b.order).map(link => (
                  <li key={link.id}>
                    <a 
                      href={link.url}
                      target={link.openNewTab ? '_blank' : undefined}
                      rel={link.openNewTab ? 'noopener noreferrer' : undefined}
                      className="text-sm font-normal text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Columna 4: Links + Redes Sociales */}
          <div>
            <h3 className="text-white font-semibold mb-4 uppercase text-xs tracking-wide">{column4.title}</h3>
            
            {/* Links */}
            <ul className="space-y-2 mb-6">
              {column4.links.sort((a, b) => a.order - b.order).map(link => (
                <li key={link.id}>
                  <a 
                    href={link.url}
                    target={link.openNewTab ? '_blank' : undefined}
                    rel={link.openNewTab ? 'noopener noreferrer' : undefined}
                    className="text-sm font-normal text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Redes Sociales */}
            <div className="flex gap-3 flex-wrap">
              {column4.socials.sort((a, b) => a.order - b.order).map(social => {
                const Icon = SOCIAL_ICONS[social.platform];
                return (
                  <a 
                    key={social.id}
                    href={social.url} 
                    className="w-10 h-10 bg-[#16a135] hover:bg-[#138a2e] rounded-full flex items-center justify-center transition-colors" 
                    aria-label={social.platform}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
          <p className="text-gray-400">
            © Copyright 2024 - 2025 | <span className="text-white font-semibold">RURAL24.COM</span> | Todos los derechos reservados.
          </p>
          <p className="text-gray-400 mt-2 md:mt-0">
            Diseño Web: <span className="text-[#16a135]">Interando Design</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

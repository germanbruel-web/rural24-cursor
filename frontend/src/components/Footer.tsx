/**
 * =====================================================
 * FOOTER DINÁMICO - Componente Principal
 * =====================================================
 * Footer que se renderiza dinámicamente desde la BD
 * Mobile: Accordion colapsable + layout optimizado
 * Desktop: Grid 4 columnas (sin cambios)
 */

import React, { useState } from 'react';
import { MapPin, Phone, Mail, Twitter, Facebook, Instagram, Youtube, MessageCircle, TrendingUp, Linkedin, ChevronDown } from 'lucide-react';
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

/** Sección colapsable para mobile */
const AccordionSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="md:hidden border-b border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 text-left"
        aria-expanded={isOpen}
      >
        <h3 className="text-white font-semibold uppercase text-xs tracking-wide">
          {title}
        </h3>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
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
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* ===== MOBILE LAYOUT ===== */}
        <div className="md:hidden">
          {/* Logo + Slogan centrado */}
          <div className="text-center mb-6">
            <img 
              src={footerLogo}
              alt="RURAL24" 
              className="h-10 w-auto mx-auto"
              onError={(e) => { e.currentTarget.src = '/images/logos/logo.png'; }}
            />
            <p className="text-xs text-gray-400 mt-2">{column1.slogan}</p>
          </div>

          {/* Redes Sociales centradas */}
          <div className="flex justify-center gap-3 mb-6">
            {column4.socials.sort((a, b) => a.order - b.order).map(social => {
              const Icon = SOCIAL_ICONS[social.platform];
              return (
                <a 
                  key={social.id}
                  href={social.url} 
                  className="w-10 h-10 bg-brand-500 hover:bg-brand-600 rounded-full flex items-center justify-center transition-colors" 
                  aria-label={social.platform}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon className="w-5 h-5 text-white" />
                </a>
              );
            })}
          </div>

          {/* Secciones colapsables */}
          <AccordionSection title={column2.title}>
            <ul className="space-y-2.5">
              {column2.items.sort((a, b) => a.order - b.order).map(link => (
                <li key={link.id}>
                  <a 
                    href={link.url}
                    target={link.openNewTab ? '_blank' : undefined}
                    rel={link.openNewTab ? 'noopener noreferrer' : undefined}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title={column3.title}>
            <ul className="space-y-2.5">
              {column3.source === 'dynamic' ? (
                categoriesToShow.map(cat => (
                  <li key={cat.id}>
                    <button
                      onClick={() => onCategoryClick(cat.name)}
                      className="text-sm text-gray-400 hover:text-white transition-colors text-left"
                    >
                      {cat.display_name || cat.name}
                    </button>
                  </li>
                ))
              ) : (
                categoriesToShow.sort((a, b) => a.order - b.order).map(link => (
                  <li key={link.id}>
                    <a 
                      href={link.url}
                      target={link.openNewTab ? '_blank' : undefined}
                      rel={link.openNewTab ? 'noopener noreferrer' : undefined}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))
              )}
            </ul>
          </AccordionSection>

          <AccordionSection title={column4.title}>
            <ul className="space-y-2.5">
              {column4.links.sort((a, b) => a.order - b.order).map(link => (
                <li key={link.id}>
                  <a 
                    href={link.url}
                    target={link.openNewTab ? '_blank' : undefined}
                    rel={link.openNewTab ? 'noopener noreferrer' : undefined}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="Contacto">
            <ul className="space-y-2.5 text-sm">
              {column1.addresses.sort((a, b) => a.order - b.order).map(addr => {
                const Icon = CONTACT_ICONS[addr.icon] || MapPin;
                return (
                  <li key={addr.id} className="flex items-start gap-2">
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{addr.text}</span>
                  </li>
                );
              })}
              {column1.phones.sort((a, b) => a.order - b.order).map(phone => {
                const Icon = CONTACT_ICONS[phone.icon] || Phone;
                return (
                  <li key={phone.id} className="flex items-center gap-2">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{phone.text}</span>
                  </li>
                );
              })}
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
          </AccordionSection>

          {/* Copyright mobile */}
          <div className="text-center mt-6 pt-4 text-xs text-gray-500">
            <p>© 2024-2026 <span className="text-white font-semibold">RURAL24.COM</span></p>
            <p className="mt-1">
              Diseño: <a href="https://www.germanbruel.com.ar" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-600 transition-colors">Brüel Studio</a>
            </p>
          </div>
        </div>

        {/* ===== DESKTOP LAYOUT (sin cambios) ===== */}
        <div className="hidden md:block">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          
            {/* Columna 1: Contacto */}
            <div>
              <div className="mb-4">
                <img 
                  src={footerLogo}
                  alt="RURAL24" 
                  className="h-12 w-auto"
                  onError={(e) => { e.currentTarget.src = '/images/logos/logo.png'; }}
                />
                <p className="text-sm text-gray-400 mt-2">{column1.slogan}</p>
              </div>
              
              <ul className="space-y-2 text-sm">
                {column1.addresses.sort((a, b) => a.order - b.order).map(addr => {
                  const Icon = CONTACT_ICONS[addr.icon] || MapPin;
                  return (
                    <li key={addr.id} className="flex items-start gap-2">
                      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{addr.text}</span>
                    </li>
                  );
                })}
                {column1.phones.sort((a, b) => a.order - b.order).map(phone => {
                  const Icon = CONTACT_ICONS[phone.icon] || Phone;
                  return (
                    <li key={phone.id} className="flex items-center gap-2">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{phone.text}</span>
                    </li>
                  );
                })}
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

              <div className="flex gap-3 flex-wrap">
                {column4.socials.sort((a, b) => a.order - b.order).map(social => {
                  const Icon = SOCIAL_ICONS[social.platform];
                  return (
                    <a 
                      key={social.id}
                      href={social.url} 
                      className="w-10 h-10 bg-brand-500 hover:bg-brand-600 rounded-full flex items-center justify-center transition-colors" 
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

          {/* Copyright desktop */}
          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
            <p className="text-gray-400">
              © Copyright 2024 - 2026 | <span className="text-white font-semibold">RURAL24.COM</span> | Todos los derechos reservados.
            </p>
            <p className="text-gray-400 mt-2 md:mt-0">
              Diseño Web: <a href="https://www.germanbruel.com.ar" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-600 transition-colors">Brüel Studio</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Eye, Share2, Heart, Mail, Phone, User } from 'lucide-react';
import { getAdById } from '../services/adsService';
import { sendContactMessage, checkSellerContactLimit } from '../services/contactService';
import type { Ad } from '../../types';

interface AdDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  adId: string;
}

export const AdDetailModal: React.FC<AdDetailModalProps> = ({ isOpen, onClose, adId }) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Contact form state
  const [showContactForm, setShowContactForm] = useState(false);
  const [sellerContactsCount, setSellerContactsCount] = useState(0);
  const [isSellerAtLimit, setIsSellerAtLimit] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [sendingContact, setSendingContact] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && adId) {
      loadAdDetails();
      setShowContactForm(false);
      setContactSuccess(false);
    }
  }, [isOpen, adId]);

  const loadAdDetails = async () => {
    setLoading(true);
    try {
      const adData = await getAdById(adId);
      setAd(adData);
      
      // Check seller's contact limit
      if (adData?.user_id) {
        const limitData = await checkSellerContactLimit(adData.user_id);
        setSellerContactsCount(limitData.receivedCount);
        setIsSellerAtLimit(limitData.isAtLimit);
      }
    } catch (error) {
      console.error('❌ Error loading ad details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad?.user_id) return;

    setSendingContact(true);
    try {
      const result = await sendContactMessage({
        ad_id: ad.id,
        ad_owner_id: ad.user_id,
        sender_name: contactForm.name,
        sender_last_name: '',
        sender_email: contactForm.email,
        sender_phone: contactForm.phone,
        message: contactForm.message
      });

      if (result.success) {
        setContactSuccess(true);
        setContactForm({ name: '', email: '', phone: '', message: '' });
        setTimeout(() => {
          setShowContactForm(false);
          setContactSuccess(false);
        }, 3000);
      } else {
        alert('Error al enviar mensaje: ' + result.error);
      }
    } catch (error) {
      console.error('Error sending contact:', error);
      alert('Error al enviar el mensaje');
    } finally {
      setSendingContact(false);
    }
  };

  if (!isOpen) return null;

  const formatPrice = (price?: number, currency?: string) => {
    if (price === undefined || price === null || price <= 0) return 'Consultar';
    const formattedNumber = new Intl.NumberFormat('es-AR').format(price);
    const symbol = currency === 'USD' ? 'USD' : '$';
    return `${symbol} ${formattedNumber}`;
  };

  const images = ad?.images || [];
  const currentImage = images[currentImageIndex] || DEFAULT_PLACEHOLDER_IMAGE;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-y-auto relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="sticky top-4 right-4 float-right z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a135] mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando detalles...</p>
              </div>
            </div>
          ) : ad ? (
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Left Column - Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={currentImage}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_PLACEHOLDER_IMAGE;
                    }}
                  />
                  
                  {/* Image Counter */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  )}

                  {/* Navigation Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.slice(0, 4).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          currentImageIndex === idx ? 'border-[#16a135]' : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <img src={img} alt={`Vista ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                {/* Header */}
                <div>
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {ad.category && (
                      <span className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-bold rounded uppercase shadow-sm">
                        📁 {ad.category}
                      </span>
                    )}
                    {ad.subcategory && (
                      <span className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded shadow-sm">
                        🏷️ {ad.subcategory}
                      </span>
                    )}
                    {ad.user_id && (
                      <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-xs font-bold rounded">
                        ⭐ Premium
                      </span>
                    )}
                    {ad.featured && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded">
                        🏆 Destacado
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{ad.title}</h1>

                  {/* Price */}
                  <div className="text-4xl font-bold text-[#16a135] mb-4">
                    {formatPrice(ad.price, ad.currency)}
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <MapPin className="w-5 h-5 text-[#16a135]" />
                    <span className="font-medium">
                      {ad.location || 'Sin ubicación'}{ad.province && `, ${ad.province}`}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Publicado {new Date(ad.created_at).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>

                {/* Ficha Técnica */}
                {(ad.brand || ad.model || ad.year || ad.condition) && (
                  <div className="border-t pt-6">
                    <h2 className="text-xl font-bold mb-4">Ficha Técnica</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {ad.brand && (
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Marca</span>
                          <span className="text-base font-bold text-gray-900">{ad.brand}</span>
                        </div>
                      )}
                      {ad.model && (
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Modelo</span>
                          <span className="text-base font-bold text-gray-900">{ad.model}</span>
                        </div>
                      )}
                      {ad.year && (
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Año</span>
                          <span className="text-base font-bold text-gray-900">{ad.year}</span>
                        </div>
                      )}
                      {ad.condition && (
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Condición</span>
                          <span className="text-base font-bold text-[#16a135]">{ad.condition}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="border-t pt-6">
                  <h2 className="text-xl font-bold mb-3">Descripción</h2>
                  <p className="text-gray-700 whitespace-pre-line">{ad.description}</p>
                </div>



                {/* Tags */}
                {ad.tags && ad.tags.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-3">Etiquetas</h3>
                    <div className="flex flex-wrap gap-2">
                      {ad.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enriched Data */}
                {ad.enriched_data && Object.keys(ad.enriched_data).length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="text-green-600">✨</span>
                      Características
                    </h3>
                    <ul className="space-y-3">
                      {Object.entries(ad.enriched_data).map(([key, value]) => {
                        // Función mejorada para separar valores concatenados
                        const separateValues = (str: string): string[] => {
                          // Estrategia 1: Si tiene "/", usar eso como separador
                          if (str.includes('/')) {
                            return str.split('/').map(v => v.trim()).filter(v => v);
                          }
                          
                          // Estrategia 2: Si tiene ",", usar eso como separador
                          if (str.includes(',')) {
                            return str.split(',').map(v => v.trim()).filter(v => v);
                          }
                          
                          // Estrategia 3: Detectar palabras que empiezan con mayúscula
                          let separated = str;
                          
                          // Patrón 1: minúscula seguida de mayúscula
                          separated = separated.replace(/([a-záéíóúñ])([A-Z])/g, '$1|$2');
                          
                          // Patrón 2: mayúscula seguida de mayúscula y minúscula
                          separated = separated.replace(/([A-Z])([A-Z][a-z])/g, '$1|$2');
                          
                          // Patrón 3: número seguido de mayúscula
                          separated = separated.replace(/(\d)([A-Z])/g, '$1|$2');
                          
                          if (separated.includes('|')) {
                            return separated.split('|').map(v => v.trim()).filter(v => v);
                          }
                          
                          return [str];
                        };
                        
                        const values = separateValues(String(value));
                        
                        return values.map((val, idx) => (
                          <li key={`${key}-${idx}`} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-gray-900 leading-relaxed">{val}</span>
                          </li>
                        ));
                      }).flat()}
                    </ul>
                  </div>
                )}

                {/* Contact Section */}
                {ad.seller && (
                  <div className="border-t pt-6">
                    {!showContactForm ? (
                      <>
                        <button
                          onClick={() => setShowContactForm(true)}
                          disabled={isSellerAtLimit}
                          className={`w-full py-4 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                            isSellerAtLimit
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-[#16a135] hover:bg-[#0e7d25] text-white'
                          }`}
                        >
                          <Mail className="w-5 h-5" />
                          {isSellerAtLimit ? 'El vendedor pausó este aviso' : 'Contactar al Vendedor'}
                        </button>
                        {isSellerAtLimit && (
                          <p className="text-xs text-amber-600 text-center mt-2">
                            Este vendedor alcanzó su límite de contactos temporalmente
                          </p>
                        )}
                        {!isSellerAtLimit && (
                          <p className="text-xs text-gray-500 text-center mt-2">
                            Tu consulta será enviada directamente al vendedor
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        {contactSuccess ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <div className="text-green-600 text-2xl mb-2">✓</div>
                            <p className="text-green-800 font-semibold">¡Mensaje enviado!</p>
                            <p className="text-green-600 text-sm mt-1">El vendedor recibirá tu consulta por email</p>
                          </div>
                        ) : (
                          <form onSubmit={handleContactSubmit} className="space-y-3">
                            <h3 className="font-semibold text-lg mb-4">Contactar al Vendedor</h3>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                <User className="w-4 h-4 inline mr-1" />
                                Tu Nombre *
                              </label>
                              <input
                                type="text"
                                required
                                value={contactForm.name}
                                onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                                placeholder="Juan Pérez"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Mail className="w-4 h-4 inline mr-1" />
                                Tu Email *
                              </label>
                              <input
                                type="email"
                                required
                                value={contactForm.email}
                                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                                placeholder="tu@email.com"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Phone className="w-4 h-4 inline mr-1" />
                                Teléfono (opcional)
                              </label>
                              <input
                                type="tel"
                                value={contactForm.phone}
                                onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                                placeholder="+54 9 11 1234-5678"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mensaje *
                              </label>
                              <textarea
                                required
                                value={contactForm.message}
                                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent resize-none"
                                placeholder="Hola, me interesa este producto..."
                              />
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setShowContactForm(false)}
                                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                disabled={sendingContact}
                                className="flex-1 py-3 bg-[#16a135] hover:bg-[#0e7d25] text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                              >
                                {sendingContact ? 'Enviando...' : 'Enviar Mensaje'}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Seller Info */}
                {ad.seller && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Vendedor</h3>
                    <div className="space-y-1 text-sm">
                      {ad.seller.full_name && (
                        <p className="text-gray-700">{ad.seller.full_name}</p>
                      )}
                      <div className="flex items-center gap-2">
                        {ad.seller.email_verified && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            ✓ Verificado
                          </span>
                        )}
                        {ad.seller.user_type && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {ad.seller.user_type === 'empresa' ? '🏢 Empresa' : '👤 Particular'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">Aviso no encontrado</p>
            </div>
          )}
        </div>
      </div>

    </>
  );
};

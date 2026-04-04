/**
 * EmpleoModal — Quick-view + contacto para avisos de Empleos
 *
 * Layout split: izquierda=info del aviso | derecha=formulario de contacto
 * El interesado NO necesita estar registrado para contactar.
 * Si está logueado, se pre-completan sus datos.
 */

import React, { useState, useEffect } from 'react';
import { MapPin, X, Briefcase, Phone, Mail, MessageSquare, CheckCircle2, User, ShieldCheck, CalendarDays } from 'lucide-react';
import type { Product } from '../../../../types';
import { Modal } from '../Modal/Modal';
import { supabase } from '../../../services/supabaseClient';
import { cn } from '../../../design-system/utils';

import { API_CONFIG } from '@/config/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

interface SellerInfo {
  full_name: string;
  email_verified: boolean;
  province: string | null;
}

export function EmpleoModal({ isOpen, onClose, product }: Props) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const bgColor = (product.attributes?.bg_color as string) || '#f0fdf4';
  const isOwner = currentUser && currentUser.id === product.user_id;

  // Pre-completar datos si está logueado
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user?.email) setEmail(user.email);
      if (user?.phone) setCelular(user.phone);
    });
  }, []);

  // Fetch perfil público del anunciante
  useEffect(() => {
    if (!product.user_id || !isOpen) return;
    supabase
      .from('users')
      .select('full_name, email_verified, province')
      .eq('id', product.user_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSeller(data as SellerInfo);
      });
  }, [product.user_id, isOpen]);

  // Limpiar formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setErrorMsg('');
      setSeller(null);
      if (!currentUser) { setCelular(''); setEmail(''); }
      setMensaje('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!celular.trim() || !mensaje.trim()) return;

    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/api/empleo-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId:    product.id,
          celular: celular.trim(),
          email:   email.trim() || undefined,
          mensaje: mensaje.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Error al enviar. Intentá de nuevo.');
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch {
      setErrorMsg('No se pudo conectar. Verificá tu conexión.');
      setStatus('error');
    }
  };

  const subcatBadge = product.subcategory || 'Empleo';
  const necesidadRaw = (product.attributes?.necesidad as string) || '';
  const NECESIDAD_LABEL: Record<string, string> = { busco: 'Busco', ofrezco: 'Ofrezco', recomiendo: 'Recomiendo' };
  const needsLabel = NECESIDAD_LABEL[necesidadRaw] || necesidadRaw;
  const remitenteRaw = (product.attributes?.remitente as string) || '';
  const isEmpresa = remitenteRaw.toLowerCase().includes('empresa');
  const contactTitle = isEmpresa ? 'Contactar a la empresa' : 'Contactar al anunciante';

  // Fecha publicación formateada
  const pubDate = product.created_at
    ? new Date(product.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="4xl"
      showCloseButton={false}
      className="overflow-hidden p-0"
    >
      <div className="flex flex-col sm:flex-row min-h-[420px]">

        {/* ── Panel izquierdo: info del aviso ── */}
        <div
          className="relative flex flex-col sm:w-[42%] flex-shrink-0"
          style={{ backgroundColor: bgColor }}
        >
          {/* Info */}
          <div className="flex-1 px-6 pt-8 pb-6 space-y-3">
            <h2 className="text-lg font-bold text-gray-900 leading-snug">
              {product.title}
            </h2>

            {/* Badges bajo el título */}
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-black/10 text-gray-700">
                <Briefcase size={10} />
                {subcatBadge}
              </span>
              {needsLabel && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-600 text-white capitalize">
                  {needsLabel.replace(/[_-]/g, ' ')}
                </span>
              )}
            </div>

            {product.province && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <MapPin size={13} className="flex-shrink-0" />
                <span>{product.province}</span>
              </div>
            )}

            {product.description && (
              <div className="border-t border-black/10 pt-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed line-clamp-6">
                  {product.description}
                </p>
              </div>
            )}

            {/* Datos del anunciante */}
            {(seller || pubDate) && (
              <div className="border-t border-black/10 pt-3 space-y-1.5">
                {seller?.full_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User size={13} className="flex-shrink-0 text-gray-400" />
                    <span className="font-medium">{seller.full_name}</span>
                  </div>
                )}
                {seller?.email_verified && (
                  <div className="flex items-center gap-2 text-sm text-brand-600">
                    <ShieldCheck size={13} className="flex-shrink-0" />
                    <span className="font-medium">Usuario Verificado</span>
                  </div>
                )}
                {(seller?.province || product.province) && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin size={13} className="flex-shrink-0" />
                    <span>{seller?.province || product.province}</span>
                  </div>
                )}
                {pubDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarDays size={13} className="flex-shrink-0" />
                    <span>Publicado el {pubDate}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Panel derecho: formulario ── */}
        <div className="relative flex-1 flex flex-col p-6 bg-white">
          {/* Botón cerrar — esquina superior derecha del modal */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>

          {isOwner ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center">
                <Briefcase size={24} className="text-brand-600" />
              </div>
              <p className="text-gray-700 font-medium">Este es tu aviso</p>
              <p className="text-sm text-gray-400">Los interesados te contactarán por aquí.</p>
            </div>

          ) : status === 'success' ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-brand-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">¡Mensaje enviado!</h3>
              <p className="text-sm text-gray-500 max-w-[260px]">
                El empleador recibió tu contacto y se comunicará con vos pronto.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors"
              >
                Cerrar
              </button>
            </div>

          ) : (
            <>
              <div className="mb-5">
                <h3 className="text-base font-bold text-gray-900">{contactTitle}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Completá el formulario y aguardá unos días.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    <Phone size={10} className="inline mr-1" />
                    Celular <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={celular}
                    onChange={e => setCelular(e.target.value)}
                    placeholder="Ej: 11 1234-5678"
                    required
                    className={cn(
                      'w-full px-3 py-2 rounded-md border text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
                      'border-gray-200 bg-gray-50 placeholder-gray-400'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    <Mail size={10} className="inline mr-1" />
                    Email <span className="text-gray-300 font-normal normal-case">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className={cn(
                      'w-full px-3 py-2 rounded-md border text-sm',
                      'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
                      'border-gray-200 bg-gray-50 placeholder-gray-400'
                    )}
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    <MessageSquare size={10} className="inline mr-1" />
                    Mensaje <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={mensaje}
                    onChange={e => setMensaje(e.target.value)}
                    placeholder="Contá brevemente tu experiencia o consulta..."
                    required
                    minLength={10}
                    rows={4}
                    className={cn(
                      'w-full flex-1 px-3 py-2 rounded-md border text-sm resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
                      'border-gray-200 bg-gray-50 placeholder-gray-400'
                    )}
                  />
                </div>

                {errorMsg && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting' || !celular.trim() || !mensaje.trim()}
                  className={cn(
                    'w-full py-3 rounded-xl font-semibold text-white text-sm transition-colors',
                    'bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {status === 'submitting' ? 'Enviando...' : 'Enviar consulta'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

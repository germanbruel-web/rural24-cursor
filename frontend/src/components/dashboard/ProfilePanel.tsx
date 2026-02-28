/**
 * ProfilePanel.tsx — Vista unificada Mi Cuenta
 * Design System RURAL24
 *
 * Layout 2 columnas (desktop):
 *  ┌──────────────────────┬──────────────────────┐
 *  │  DATOS PERSONALES    │  CRÉDITOS            │
 *  │  (avatar, form,      │  (saldo, movimientos)│
 *  │   contacto, ubic.)   │                      │
 *  │                      │  SEGURIDAD Y CUENTA  │
 *  │                      │  (privacidad, pass,  │
 *  │                      │   email, baja)       │
 *  └──────────────────────┴──────────────────────┘
 *
 * Mobile: stack vertical Datos → Créditos → Seguridad
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  User, Phone, MapPin, Calendar, Edit, Save, X,
  CheckCircle, Briefcase, Coins, ShoppingCart,
  Gift, Clock, Loader2, Shield, Send, AlertCircle
} from 'lucide-react';
import { notify } from '../../utils/notifications';
import { PROVINCES, LOCALITIES_BY_PROVINCE } from '../../constants/locations';
import { AvatarUpload } from '../common/AvatarUpload';
import { sendVerificationCode, verifyCode } from '../../services/phoneVerificationService';
import {
  updateProfile, uploadAvatar, deleteAvatar
} from '../../services/profileService';
import {
  getUserCredits, getCreditTransactions
} from '../../services/creditsService';
import { supabase } from '../../services/supabaseClient';
import BuyCreditsModal from '../modals/BuyCreditsModal';
import RedeemCouponModal from '../modals/RedeemCouponModal';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { AccountSecurityPanel } from './AccountSecurityPanel';

// ============================================================================
// TIPOS
// ============================================================================

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mobile: string;
  province: string;
  location: string;
  display_name: string;
  bio: string;
  services: string;
  privacy_mode: 'public' | 'private';
}

const PREMIUM_PLANS = ['premium', 'profesional', 'avanzado', 'business', 'enterprise'];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ProfilePanel: React.FC = () => {
  const { profile, updateProfile: updateAuthProfile, refreshProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Credits state
  const [credits, setCredits] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const [showRedeemCouponModal, setShowRedeemCouponModal] = useState(false);
  
  const isEmpresa = profile?.user_type === 'empresa';
  const isSuperAdmin = profile?.role === 'superadmin';
  const planName = (profile as any)?.plan_name?.toLowerCase() || '';
  const hasPremiumPlan = PREMIUM_PLANS.some(p => planName.includes(p));
  const hasPremiumFeatures = isEmpresa || hasPremiumPlan || isSuperAdmin;

  // Phone verification state
  const [verificationStep, setVerificationStep] = useState<'idle' | 'code-sent' | 'verified'>(
    profile?.mobile_verified ? 'verified' : 'idle'
  );
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMobile, setVerificationMobile] = useState(''); // mobile que se está verificando
  const isMobileVerified = profile?.mobile_verified === true;

  const labels = {
    display_name: isEmpresa ? 'Razón Social' : 'Nombre Profesional',
    display_name_placeholder: isEmpresa ? 'Ej: Agro Sur S.R.L.' : 'Ej: Juan Pérez - Agrónomo',
    bio: isEmpresa ? 'Descripción de la Empresa' : 'Sobre mí',
    bio_placeholder: isEmpresa 
      ? 'Describe tu empresa, qué hacen, años de experiencia...'
      : 'Cuéntanos sobre ti, tu experiencia, qué ofreces...',
    services: 'Servicios que ofrezco',
    services_placeholder: 'Ej: Asesoramiento agrícola, Tasaciones, Venta de maquinaria...',
  };

  const splitFullName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return { first_name: parts[0], last_name: '' };
    return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
  };

  const { first_name: initialFirstName, last_name: initialLastName } = 
    splitFullName(profile?.full_name || '');

  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: initialFirstName,
    last_name: initialLastName,
    email: profile?.email || '',
    phone: profile?.phone || '',
    mobile: profile?.mobile || '',
    province: profile?.province || '',
    location: profile?.location || '',
    display_name: (profile as any)?.display_name || '',
    bio: (profile as any)?.bio || '',
    services: (profile as any)?.services || '',
    privacy_mode: (profile as any)?.privacy_mode || 'public',
  });

  // Sync formData when profile loads
  useEffect(() => {
    if (profile) {
      const { first_name, last_name } = splitFullName(profile.full_name || '');
      setFormData({
        first_name,
        last_name,
        email: profile.email || '',
        phone: profile.phone || '',
        mobile: profile.mobile || '',
        province: profile.province || '',
        location: profile.location || '',
        display_name: (profile as any)?.display_name || '',
        bio: (profile as any)?.bio || '',
        services: (profile as any)?.services || '',
        privacy_mode: (profile as any)?.privacy_mode || 'public',
      });
      // Sync verification state
      if (profile.mobile_verified) {
        setVerificationStep('verified');
      }
    }
  }, [profile]);

  // Load credits data
  useEffect(() => {
    loadCreditsData();
  }, []);

  const loadCreditsData = async () => {
    setCreditsLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setCreditsLoading(false); return; }

      const [creditsData, transData] = await Promise.all([
        getUserCredits(authUser.id),
        getCreditTransactions(authUser.id, 5)
      ]);

      setCredits(creditsData);
      setTransactions(transData);
    } catch (err) {
      console.error('Error loading credits:', err);
    } finally {
      setCreditsLoading(false);
    }
  };

  // ── Phone verification handlers ──
  const handleSendVerificationCode = async () => {
    const mobile = formData.mobile.trim();
    if (!mobile || mobile.length < 10) {
      notify.error('Ingresá un número de celular válido (mín. 10 dígitos)');
      return;
    }
    setVerificationLoading(true);
    try {
      const result = await sendVerificationCode(mobile);
      if (result.success) {
        setVerificationStep('code-sent');
        setVerificationMobile(mobile);
        setVerificationCode('');
        notify.success(result.message);
      } else {
        notify.error(result.error || 'Error al enviar código');
      }
    } catch (err) {
      notify.error('Error de conexión al enviar código');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 4) {
      notify.error('El código debe ser de 4 dígitos');
      return;
    }
    setVerificationLoading(true);
    try {
      const result = await verifyCode(verificationMobile, verificationCode);
      if (result.success) {
        setVerificationStep('verified');
        notify.success('¡Celular verificado exitosamente!');
        // Refresh profile to get mobile_verified = true
        await refreshProfile();
      } else {
        notify.error(result.error || 'Código incorrecto');
      }
    } catch (err) {
      notify.error('Error de conexión al verificar');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();
      
      const updateData: any = {
        full_name: fullName,
        phone: isMobileVerified ? formData.phone : undefined, // phone solo si mobile verificado
        province: formData.province,
        location: formData.location,
      };
      
      // No enviar mobile si ya está verificado (no se puede cambiar desde el save)
      if (!isMobileVerified) {
        // Mobile se actualiza vía send-code, no vía save
        // No incluirlo aquí para no romper verificación
      }

      if (hasPremiumFeatures) {
        updateData.display_name = formData.display_name;
        updateData.bio = formData.bio;
        updateData.services = formData.services;
        updateData.privacy_mode = formData.privacy_mode;
      }

      const { error } = await updateProfile(updateData);
      if (error) {
        notify.error('Error al actualizar perfil: ' + error.message);
        return;
      }

      await updateAuthProfile({ 
        full_name: fullName,
        phone: isMobileVerified ? formData.phone : profile?.phone,
        province: formData.province,
        location: formData.location,
      });

      notify.success('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (error) {
      notify.error('Error al actualizar perfil');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    const { first_name, last_name } = splitFullName(profile?.full_name || '');
    setFormData({
      first_name,
      last_name,
      email: profile?.email || '',
      phone: profile?.phone || '',
      mobile: profile?.mobile || '',
      province: profile?.province || '',
      location: profile?.location || '',
      display_name: (profile as any)?.display_name || '',
      bio: (profile as any)?.bio || '',
      services: (profile as any)?.services || '',
      privacy_mode: (profile as any)?.privacy_mode || 'public',
    });
    // Reset verification state on cancel (unless already verified)
    if (!isMobileVerified) {
      setVerificationStep('idle');
      setVerificationCode('');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    const { url, error } = await uploadAvatar(file);
    if (error) { notify.error('Error al subir imagen: ' + error.message); return; }
    if (url) notify.success('Imagen actualizada');
  };

  const handleAvatarRemove = async () => {
    const { error } = await deleteAvatar();
    if (error) { notify.error('Error al eliminar imagen: ' + error.message); return; }
    notify.success('Imagen eliminada');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── HEADER COMPACTO ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mi Cuenta</h1>
          <p className="text-sm text-gray-500">Datos personales, seguridad y créditos</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-500 transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar perfil
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-500 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {/* ── LAYOUT 2 COLUMNAS ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* ═══════════════════════════════════════════
            COLUMNA IZQUIERDA: DATOS PERSONALES (3/5)
            ═══════════════════════════════════════════ */}
        <div className="space-y-4">
          
          {/* Avatar + Info básica */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <AvatarUpload
                currentUrl={(profile as any)?.avatar_url}
                onUpload={handleAvatarUpload}
                onRemove={handleAvatarRemove}
                size="md"
                type={isEmpresa ? 'company' : 'personal'}
                disabled={false}
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">
                  {(profile as any)?.display_name || profile?.full_name || profile?.email?.split('@')[0] || 'Usuario'}
                </h2>
                <p className="text-sm text-gray-500 truncate">{profile?.email}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {isSuperAdmin && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[10px] font-bold rounded-full">
                      SuperAdmin
                    </span>
                  )}
                  {(profile as any)?.plan_name && (
                    <span className="px-2 py-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-full">
                      {(profile as any).plan_name}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full">
                    {isEmpresa ? '🏢 Empresa' : '👤 Particular'}
                  </span>
                  {profile?.email_verified && (
                    <span className="px-2 py-0.5 bg-brand-100 text-brand-600 text-[10px] font-semibold rounded-full flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" /> Verificado
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Miembro desde {new Date(profile?.created_at || '').toLocaleDateString('es-AR')}
                </div>
              </div>
            </div>
          </div>

          {/* Datos Personales */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
              <User className="w-4 h-4 text-brand-600" />
              Datos Personales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CompactField
                label="Nombre"
                value={formData.first_name}
                onChange={(v) => setFormData({ ...formData, first_name: v })}
                isEditing={isEditing}
                placeholder="Juan"
              />
              <CompactField
                label="Apellido"
                value={formData.last_name}
                onChange={(v) => setFormData({ ...formData, last_name: v })}
                isEditing={isEditing}
                placeholder="Pérez"
              />
              <div className="sm:col-span-2">
                <CompactField
                  label="Email"
                  value={formData.email}
                  isEditing={false}
                  disabled
                  hint="No editable"
                />
              </div>
            </div>
          </div>

          {/* Contacto — con verificación de celular */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
              <Phone className="w-4 h-4 text-brand-600" />
              Contacto
            </h3>
            <div className="space-y-4">
              
              {/* ── CELULAR con verificación ── */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  Celular <span className="text-red-500">*</span>
                  {isMobileVerified && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-semibold rounded-full ml-1">
                      <CheckCircle className="w-3 h-3" /> Verificado
                    </span>
                  )}
                </label>

                {/* Campo de celular */}
                <div className="flex gap-2">
                  {isEditing && !isMobileVerified ? (
                    <>
                      <input
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="+54 9 11 1234-5678"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                      />
                      {verificationStep !== 'code-sent' && (
                        <button
                          type="button"
                          onClick={handleSendVerificationCode}
                          disabled={verificationLoading || !formData.mobile.trim()}
                          className="px-3 py-2 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-500 transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                        >
                          {verificationLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          Verificar
                        </button>
                      )}
                    </>
                  ) : (
                    <div className={`flex-1 px-3 py-2 text-sm rounded-lg ${isMobileVerified ? 'bg-brand-50 text-gray-900 border border-brand-200' : 'bg-gray-50 text-gray-900'}`}>
                      {formData.mobile || <span className="text-gray-400">Sin especificar</span>}
                    </div>
                  )}
                </div>

                {/* Paso 2: Ingresar código */}
                {verificationStep === 'code-sent' && !isMobileVerified && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 mb-2 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      Ingresá el código de 4 dígitos enviado a tu celular
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="1234"
                        className="w-24 px-3 py-2 text-sm text-center font-mono tracking-widest border border-blue-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={verificationLoading || verificationCode.length !== 4}
                        className="px-4 py-2 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-500 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {verificationLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={handleSendVerificationCode}
                        disabled={verificationLoading}
                        className="px-3 py-2 text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Reenviar
                      </button>
                    </div>
                  </div>
                )}

                {/* Info cuando no está verificado y no está editando */}
                {!isMobileVerified && !isEditing && formData.mobile && (
                  <p className="mt-1 text-[10px] text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Celular no verificado. Editá tu perfil para verificarlo.
                  </p>
                )}
                {!isMobileVerified && !formData.mobile && (
                  <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Obligatorio. Editá tu perfil para agregar y verificar tu celular.
                  </p>
                )}
              </div>

              {/* ── TELÉFONO FIJO (solo si celular verificado) ── */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  Teléfono Fijo
                  {!isMobileVerified && (
                    <span className="text-[10px] text-gray-400 ml-1">(verificá celular primero)</span>
                  )}
                </label>
                {isEditing && isMobileVerified ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="011 1234-5678"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                  />
                ) : (
                  <div className={`px-3 py-2 text-sm rounded-lg ${!isMobileVerified ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-900'}`}>
                    {isMobileVerified ? (
                      formData.phone || <span className="text-gray-400">Sin especificar</span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Verificá tu celular para habilitar</span>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Ubicación */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
              <MapPin className="w-4 h-4 text-brand-600" />
              Ubicación
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Provincia</label>
                {isEditing ? (
                  <select
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value, location: '' })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                  >
                    <option value="">Seleccionar</option>
                    {PROVINCES.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 text-sm bg-gray-50 rounded-lg text-gray-900">
                    {formData.province || <span className="text-gray-400">Sin especificar</span>}
                  </div>
                )}
              </div>
              {formData.province && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Localidad</label>
                  {isEditing ? (
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                    >
                      <option value="">Seleccionar</option>
                      {LOCALITIES_BY_PROVINCE[formData.province]?.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 text-sm bg-gray-50 rounded-lg text-gray-900">
                      {formData.location || <span className="text-gray-400">Sin especificar</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Perfil Profesional (solo premium) */}
          {hasPremiumFeatures && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <Briefcase className="w-4 h-4 text-brand-600" />
                Perfil Profesional
                <span className="text-[10px] font-normal text-gray-400 ml-1">(opcional)</span>
              </h3>
              <div className="space-y-3">
                <CompactField
                  label={labels.display_name}
                  value={formData.display_name}
                  onChange={(v) => setFormData({ ...formData, display_name: v })}
                  isEditing={isEditing}
                  placeholder={labels.display_name_placeholder}
                />
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{labels.bio}</label>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder={labels.bio_placeholder}
                      rows={3}
                      maxLength={500}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
                    />
                  ) : (
                    <div className="px-3 py-2 text-sm bg-gray-50 rounded-lg text-gray-900 min-h-[60px]">
                      {formData.bio || <span className="text-gray-400 italic">Sin descripción</span>}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">{formData.bio.length}/500</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{labels.services}</label>
                  {isEditing ? (
                    <textarea
                      value={formData.services}
                      onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                      placeholder={labels.services_placeholder}
                      rows={2}
                      maxLength={300}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
                    />
                  ) : (
                    <div className="px-3 py-2 text-sm bg-gray-50 rounded-lg text-gray-900">
                      {formData.services || <span className="text-gray-400 italic">Sin servicios</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════
            COLUMNA DERECHA: CRÉDITOS + SEGURIDAD
            ═══════════════════════════════════════════ */}
        <div className="space-y-4">

          {/* Balance de Créditos */}
          <div className="rounded-lg overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-cyan-100 text-[10px] font-medium uppercase tracking-wider">
                Saldo Disponible
              </p>
              <Coins className="w-4 h-4 text-white/50" />
            </div>
            
            {creditsLoading ? (
              <Loader2 className="w-6 h-6 text-white animate-spin my-3" />
            ) : (
              <>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-4xl font-black text-white leading-none">
                    {credits?.balance || 0}
                  </span>
                  <span className="text-sm text-cyan-100 font-medium">ARS</span>
                </div>
                <p className="text-cyan-200 text-[10px]">Usá tu saldo para destacar avisos</p>
              </>
            )}

            <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-2 gap-2">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => setShowBuyCreditsModal(true)}
                className="bg-white text-cyan-600 hover:bg-cyan-50 text-xs"
              >
                <ShoppingCart className="w-3.5 h-3.5" /> Comprar
              </Button>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => setShowRedeemCouponModal(true)}
                className="border-white/40 text-white hover:bg-white/10 text-xs"
              >
                <Gift className="w-3.5 h-3.5" /> Cupón
              </Button>
            </div>
          </div>

          {/* Últimos Movimientos */}
          {transactions.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Movimientos
              </h3>
              <div className="space-y-1.5">
                {transactions.slice(0, 4).map(tx => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-xs font-medium text-gray-900 truncate">{tx.description}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(tx.created_at).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <Badge variant={tx.amount > 0 ? 'success' : 'danger'} size="sm">
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seguridad y Cuenta */}
          <AccountSecurityPanel />
        </div>
      </div>

      {/* Modales */}
      <BuyCreditsModal
        isOpen={showBuyCreditsModal}
        onClose={() => setShowBuyCreditsModal(false)}
        onSuccess={() => { setShowBuyCreditsModal(false); loadCreditsData(); }}
      />
      <RedeemCouponModal
        isOpen={showRedeemCouponModal}
        onClose={() => setShowRedeemCouponModal(false)}
        onSuccess={() => { setShowRedeemCouponModal(false); loadCreditsData(); }}
      />
    </div>
  );
};

// ============================================================================
// COMPACT FORM FIELD
// ============================================================================

interface CompactFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  isEditing: boolean;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  hint?: string;
}

const CompactField: React.FC<CompactFieldProps> = ({
  label, value, onChange, isEditing, placeholder, type = 'text', disabled, hint
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    {isEditing && !disabled ? (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
      />
    ) : (
      <div className={`px-3 py-2 text-sm rounded-lg ${disabled ? 'bg-gray-100 text-gray-500' : 'bg-gray-50 text-gray-900'}`}>
        {value || <span className="text-gray-400">Sin especificar</span>}
        {hint && <span className="text-[10px] text-gray-400 ml-1">({hint})</span>}
      </div>
    )}
  </div>
);

export default ProfilePanel;

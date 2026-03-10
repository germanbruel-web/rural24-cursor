/**
 * ProfilePanel.tsx — Mi Cuenta
 *
 * Layout desktop:
 *  ┌──────────────────────────┬──────────────────────────┐
 *  │  COLUMNA 1               │  COLUMNA 2               │
 *  │  Hero (avatar+rol+priv.) │  Datos de Facturación    │
 *  │  Datos Personales        │  Seguridad y Cuenta      │
 *  │  Ubicación               │                          │
 *  └──────────────────────────┴──────────────────────────┘
 *
 * Nota Sprint 3E (#NoSaldo): se eliminó la sección "Saldo para Publicidad".
 * Los cupones se canjean directamente en el checkout del modal de Destacados.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  User, MapPin, Edit, Save, X,
  CheckCircle,
  Loader2, Shield, Send, AlertCircle, Globe,
  EyeOff, FileText, Calendar,
} from 'lucide-react';
import { notify } from '../../utils/notifications';
import { getProvinces, getLocalitiesByProvince, type Province, type Locality } from '../../services/v2/locationsService';
import { hasPremiumFeatures as checkPremium } from '../../constants/plans';
import { AvatarUpload } from '../common/AvatarUpload';
import { sendVerificationCode, verifyCode } from '../../services/phoneVerificationService';
import { updateProfile, uploadAvatar, deleteAvatar } from '../../services/profileService';
import { AccountSecurityPanel } from './AccountSecurityPanel';

// ============================================================================
// SECTION CARD
// ============================================================================

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
  icon, title, badge, isEditing, onEdit, onSave, onCancel, saving = false, children,
}) => (
  <div className="bg-white rounded-xl border border-gray-200">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <span className="text-brand-600">{icon}</span>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{title}</h3>
        {badge}
      </div>
      <div className="flex items-center gap-2">
        {!isEditing ? (
          <button
            onClick={onEdit}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" /> Editar
          </button>
        ) : (
          <>
            <button
              onClick={onCancel}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="text-xs text-white bg-brand-600 hover:bg-brand-500 px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Guardar
            </button>
          </>
        )}
      </div>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ============================================================================
// COMPACT FIELD
// ============================================================================

interface FieldProps {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  isEditing: boolean;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  hint?: string;
  optional?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label, value, onChange, isEditing, placeholder, type = 'text', disabled, hint, optional,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">
      {label}
      {optional && <span className="text-gray-400 font-normal ml-1">(opcional)</span>}
    </label>
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
        {hint && <span className="text-xs text-gray-500 ml-1">({hint})</span>}
      </div>
    )}
  </div>
);

// ============================================================================
// HELPERS
// ============================================================================

function splitFullName(fullName: string) {
  const parts = (fullName || '').trim().split(' ');
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

function getSingleRole(opts: {
  role?: string;
  plan_name?: string;
  user_type?: string;
}): string {
  if (opts.role === 'superadmin') return 'SuperAdmin';
  if (opts.role === 'premium') return 'Premium';  // role es la fuente de verdad
  if (opts.plan_name && opts.plan_name.toLowerCase() !== 'free') return opts.plan_name;
  return opts.user_type === 'empresa' ? 'Empresa' : 'Particular';
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ProfilePanel: React.FC = () => {
  const { profile, updateProfile: updateAuthProfile, refreshProfile } = useAuth();

  const isEmpresa      = profile?.user_type === 'empresa';
  const isSuperAdmin   = profile?.role === 'superadmin';
  const hasPremiumFeatures = checkPremium({
    user_type:  profile?.user_type,
    role:       profile?.role,
    plan_name:  profile?.plan_name,
  });
  const roleLabel = getSingleRole({
    role:      profile?.role,
    plan_name: profile?.plan_name,
    user_type: profile?.user_type,
  });

  // ── Privacy (Hero) ────────────────────────────────────────────────────────
  const [privacyMode, setPrivacyMode]   = useState<'public' | 'private'>(
    (profile?.privacy_mode as 'public' | 'private') ?? 'public'
  );
  const [privacySaving,    setPrivacySaving]    = useState(false);
  const [privacyDeniedMsg, setPrivacyDeniedMsg] = useState(false);

  // ── Editing states ────────────────────────────────────────────────────────
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [editingBilling,  setEditingBilling]  = useState(false);
  const [saving,          setSaving]          = useState<string | null>(null);

  // ── Form states ───────────────────────────────────────────────────────────
  const [personalForm, setPersonalForm] = useState(() => {
    const { first_name, last_name } = splitFullName(profile?.full_name || '');
    return {
      first_name,
      last_name,
      user_type:    (profile?.user_type || 'particular') as 'particular' | 'empresa',
      display_name: profile?.display_name || '',
      phone:        profile?.phone || '',
    };
  });

  const [locationForm, setLocationForm] = useState({
    domicilio:     (profile as any)?.domicilio || '',
    province:      profile?.province || '',
    location:      profile?.location || '',
    codigo_postal: (profile as any)?.codigo_postal || '',
  });
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [locationLocalities, setLocationLocalities] = useState<Locality[]>([]);

  const [billingSameAddress, setBillingSameAddress] = useState(
    (profile as any)?.billing_same_address !== false
  );
  const [billingForm, setBillingForm] = useState({
    cuit_cuil:     (profile as any)?.cuit || '',
    domicilio:     (profile as any)?.billing_address || '',
    localidad:     (profile as any)?.billing_localidad || '',
    provincia:     (profile as any)?.billing_provincia || '',
    codigo_postal: (profile as any)?.billing_codigo_postal || '',
  });

  // Mobile verification
  const isMobileVerified = profile?.mobile_verified === true;
  const [verificationStep,    setVerificationStep]    = useState<'idle' | 'code-sent' | 'verified'>(
    profile?.mobile_verified ? 'verified' : 'idle'
  );
  const [mobileInput,         setMobileInput]         = useState(profile?.mobile || '');
  const [verificationCode,    setVerificationCode]    = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMobile,  setVerificationMobile]  = useState('');

  // ── Cargar provincias al montar ───────────────────────────────────────────
  useEffect(() => { getProvinces().then(setProvinces); }, []);

  // ── Cargar localidades cuando cambia la provincia ─────────────────────────
  useEffect(() => {
    if (!locationForm.province) { setLocationLocalities([]); return; }
    const prov = provinces.find((p) => p.name === locationForm.province);
    if (prov) getLocalitiesByProvince(prov.id).then(setLocationLocalities);
  }, [locationForm.province, provinces]);

  // ── Sync cuando llega el perfil ───────────────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    const { first_name, last_name } = splitFullName(profile.full_name || '');
    setPersonalForm({
      first_name,
      last_name,
      user_type:    (profile.user_type || 'particular') as 'particular' | 'empresa',
      display_name: profile.display_name || '',
      phone:        profile.phone || '',
    });
    setLocationForm(f => ({
      ...f,
      domicilio:     (profile as any).domicilio || '',
      province:      profile.province || '',
      location:      profile.location || '',
      codigo_postal: (profile as any).codigo_postal || '',
    }));
    setBillingSameAddress((profile as any).billing_same_address !== false);
    setBillingForm({
      cuit_cuil:     (profile as any).cuit || '',
      domicilio:     (profile as any).billing_address || '',
      localidad:     (profile as any).billing_localidad || '',
      provincia:     (profile as any).billing_provincia || '',
      codigo_postal: (profile as any).billing_codigo_postal || '',
    });
    setMobileInput(profile.mobile || '');
    if (profile.mobile_verified) setVerificationStep('verified');
    if (profile.privacy_mode)    setPrivacyMode(profile.privacy_mode as 'public' | 'private');
  }, [profile]);

  // ── Avatar ────────────────────────────────────────────────────────────────
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

  // ── Privacy ───────────────────────────────────────────────────────────────
  const handlePrivacyToggle = async () => {
    if (!hasPremiumFeatures) {
      setPrivacyDeniedMsg(true);
      setTimeout(() => setPrivacyDeniedMsg(false), 4000);
      return;
    }
    const next: 'public' | 'private' = privacyMode === 'public' ? 'private' : 'public';
    setPrivacySaving(true);
    const { error } = await updateProfile({ privacy_mode: next });
    if (!error) {
      setPrivacyMode(next);
      await refreshProfile();
    }
    setPrivacySaving(false);
  };

  // ── Save: Datos Personales ────────────────────────────────────────────────
  const handleSavePersonal = async () => {
    setSaving('personal');
    try {
      const fullName = `${personalForm.first_name.trim()} ${personalForm.last_name.trim()}`.trim();
      const updateData: Record<string, any> = {
        full_name: fullName,
        user_type: personalForm.user_type,
        phone:     personalForm.phone,
      };
      if (personalForm.user_type === 'empresa') {
        updateData.display_name = personalForm.display_name;
      }
      const { error } = await updateProfile(updateData);
      if (error) { notify.error('Error: ' + error.message); return; }
      await updateAuthProfile({ full_name: fullName, phone: personalForm.phone });
      notify.success('Datos personales actualizados');
      setEditingPersonal(false);
    } catch { notify.error('Error al guardar'); }
    finally { setSaving(null); }
  };

  const handleCancelPersonal = () => {
    setEditingPersonal(false);
    const { first_name, last_name } = splitFullName(profile?.full_name || '');
    setPersonalForm({
      first_name,
      last_name,
      user_type:    (profile?.user_type || 'particular') as 'particular' | 'empresa',
      display_name: profile?.display_name || '',
      phone:        profile?.phone || '',
    });
    if (!isMobileVerified) { setVerificationStep('idle'); setVerificationCode(''); }
    setMobileInput(profile?.mobile || '');
  };

  // ── Save: Ubicación ───────────────────────────────────────────────────────
  const handleSaveLocation = async () => {
    setSaving('location');
    try {
      const { error } = await updateProfile({
        province:      locationForm.province,
        location:      locationForm.location,
        domicilio:     locationForm.domicilio,
        codigo_postal: locationForm.codigo_postal,
      });
      if (error) { notify.error('Error: ' + error.message); return; }
      await updateAuthProfile({ province: locationForm.province, location: locationForm.location });
      notify.success('Ubicación actualizada');
      setEditingLocation(false);
    } catch { notify.error('Error al guardar'); }
    finally { setSaving(null); }
  };

  const handleCancelLocation = () => {
    setEditingLocation(false);
    setLocationForm(f => ({
      ...f,
      domicilio:     (profile as any)?.domicilio || '',
      province:      profile?.province || '',
      location:      profile?.location || '',
      codigo_postal: (profile as any)?.codigo_postal || '',
    }));
  };

  // ── Save: Facturación ─────────────────────────────────────────────────────
  const handleSaveBilling = async () => {
    setSaving('billing');
    try {
      const { error } = await updateProfile({
        cuit:                  billingForm.cuit_cuil,
        billing_same_address:  billingSameAddress,
        billing_address:       billingSameAddress ? undefined : billingForm.domicilio,
        billing_localidad:     billingSameAddress ? undefined : billingForm.localidad,
        billing_provincia:     billingSameAddress ? undefined : billingForm.provincia,
        billing_codigo_postal: billingSameAddress ? undefined : billingForm.codigo_postal,
      });
      if (error) { notify.error('Error: ' + error.message); return; }
      notify.success('Datos de facturación actualizados');
      setEditingBilling(false);
    } catch { notify.error('Error al guardar'); }
    finally { setSaving(null); }
  };

  const handleCancelBilling = () => {
    setEditingBilling(false);
    setBillingSameAddress((profile as any)?.billing_same_address !== false);
    setBillingForm({
      cuit_cuil:     (profile as any)?.cuit || '',
      domicilio:     (profile as any)?.billing_address || '',
      localidad:     (profile as any)?.billing_localidad || '',
      provincia:     (profile as any)?.billing_provincia || '',
      codigo_postal: (profile as any)?.billing_codigo_postal || '',
    });
  };

  // ── Mobile verification ───────────────────────────────────────────────────
  const handleSendVerificationCode = async () => {
    const mobile = mobileInput.trim();
    if (!mobile || mobile.length < 10) {
      notify.error('Ingresá un número válido (mín. 10 dígitos)');
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
    } catch { notify.error('Error de conexión'); }
    finally { setVerificationLoading(false); }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 4) { notify.error('El código debe ser de 4 dígitos'); return; }
    setVerificationLoading(true);
    try {
      const result = await verifyCode(verificationMobile, verificationCode);
      if (result.success) {
        setVerificationStep('verified');
        notify.success('¡Celular verificado!');
        await refreshProfile();
      } else {
        notify.error(result.error || 'Código incorrecto');
      }
    } catch { notify.error('Error de conexión'); }
    finally { setVerificationLoading(false); }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mi Cuenta</h1>
        <p className="text-sm text-gray-500">Gestioná tu perfil, contacto y seguridad</p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          GRID 2 COLUMNAS
          ══════════════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-2 gap-5 items-start">

        {/* ════════════════════════════
            COLUMNA 1: Hero + Personal + Ubicación
            ════════════════════════════ */}
        <div className="space-y-4">

          {/* ── HERO ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-4">
              <AvatarUpload
                currentUrl={profile?.avatar_url}
                onUpload={handleAvatarUpload}
                onRemove={handleAvatarRemove}
                size="lg"
                type={isEmpresa ? 'company' : 'personal'}
                disabled={false}
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">
                  {(personalForm.user_type === 'empresa' ? profile?.display_name : null)
                    || profile?.full_name
                    || profile?.email?.split('@')[0]
                    || 'Usuario'}
                </h2>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold
                  ${isSuperAdmin
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                    : 'bg-brand-100 text-brand-700'
                  }`}>
                  {roleLabel}
                </span>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Miembro desde {new Date(profile?.created_at || '').toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })}
                  </span>
                  {profile?.email_verified && (
                    <span className="flex items-center gap-1 text-brand-600">
                      <CheckCircle className="w-3 h-3" /> Verificado
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy switch */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    {privacyMode === 'public'
                      ? <><Globe className="w-3.5 h-3.5 text-brand-600" /> Perfil público</>
                      : <><EyeOff className="w-3.5 h-3.5 text-gray-500" /> Perfil privado</>
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {privacyMode === 'public'
                      ? 'Tu contacto es visible para todos'
                      : 'Tu teléfono y email están ocultos'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePrivacyToggle}
                  disabled={privacySaving}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none cursor-pointer
                    ${!hasPremiumFeatures ? 'opacity-40' : ''}
                    ${privacyMode === 'private' ? 'bg-brand-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
                    ${privacyMode === 'private' ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  {privacySaving && (
                    <Loader2 className="absolute -right-5 w-3.5 h-3.5 text-brand-600 animate-spin" />
                  )}
                </button>
              </div>
              {privacyDeniedMsg && (
                <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  El perfil privado está disponible para planes <strong>Premium</strong>, <strong>Revendedor</strong> y cuentas <strong>Empresa</strong>.
                </p>
              )}
            </div>
          </div>

          {/* ── DATOS PERSONALES ── */}
          <SectionCard
            icon={<User className="w-4 h-4" />}
            title="Datos Personales"
            isEditing={editingPersonal}
            onEdit={() => setEditingPersonal(true)}
            onSave={handleSavePersonal}
            onCancel={handleCancelPersonal}
            saving={saving === 'personal'}
          >
            <div className="space-y-3">

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Nombre"
                  value={personalForm.first_name}
                  onChange={(v) => setPersonalForm(f => ({ ...f, first_name: v }))}
                  isEditing={editingPersonal}
                  placeholder="Juan"
                />
                <Field
                  label="Apellido"
                  value={personalForm.last_name}
                  onChange={(v) => setPersonalForm(f => ({ ...f, last_name: v }))}
                  isEditing={editingPersonal}
                  placeholder="Pérez"
                />
              </div>

              <Field
                label="Email"
                value={profile?.email || ''}
                isEditing={false}
                disabled
                hint="Cambiar en Seguridad"
              />

              {/* Celular con verificación */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                  Celular <span className="text-red-400">*</span>
                  {isMobileVerified && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full ml-1">
                      <CheckCircle className="w-3 h-3" /> Verificado
                    </span>
                  )}
                </label>
                {editingPersonal && !isMobileVerified ? (
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={mobileInput}
                      onChange={(e) => setMobileInput(e.target.value)}
                      placeholder="+54 9 11 1234-5678"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                    />
                    {verificationStep !== 'code-sent' && (
                      <button
                        type="button"
                        onClick={handleSendVerificationCode}
                        disabled={verificationLoading || !mobileInput.trim()}
                        className="px-3 py-2 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-500 transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                      >
                        {verificationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Verificar
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={`px-3 py-2 text-sm rounded-lg ${isMobileVerified ? 'bg-brand-50 border border-brand-200 text-gray-900' : 'bg-gray-50 text-gray-900'}`}>
                    {mobileInput || <span className="text-gray-400">Sin especificar</span>}
                  </div>
                )}
                {verificationStep === 'code-sent' && !isMobileVerified && (
                  <div className="mt-2 p-3 bg-brand-50 border border-brand-200 rounded-lg">
                    <p className="text-xs text-brand-700 mb-2 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Ingresá el código de 4 dígitos enviado a tu celular
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="1234"
                        autoFocus
                        className="w-24 px-3 py-2 text-sm text-center font-mono tracking-widest border border-brand-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={verificationLoading || verificationCode.length !== 4}
                        className="px-4 py-2 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-500 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {verificationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Confirmar
                      </button>
                      <button type="button" onClick={handleSendVerificationCode} disabled={verificationLoading} className="px-2 text-xs text-brand-600 hover:text-brand-800 underline">
                        Reenviar
                      </button>
                    </div>
                  </div>
                )}
                {!isMobileVerified && !editingPersonal && mobileInput && (
                  <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Celular no verificado. Editá para verificarlo.
                  </p>
                )}
              </div>

              <Field
                label="Teléfono Fijo"
                value={personalForm.phone}
                onChange={(v) => setPersonalForm(f => ({ ...f, phone: v }))}
                isEditing={editingPersonal}
                placeholder="011 1234-5678"
                optional
              />

              {/* Tipo de cuenta */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Tipo de cuenta</label>
                {editingPersonal ? (
                  <div className="flex gap-4">
                    {(['particular', 'empresa'] as const).map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="user_type"
                          value={type}
                          checked={personalForm.user_type === type}
                          onChange={() => setPersonalForm(f => ({ ...f, user_type: type }))}
                          className="accent-brand-600 w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {type === 'particular' ? 'Profesional / Particular' : 'Empresa'}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-2 text-sm bg-gray-50 rounded-lg text-gray-900">
                    {isEmpresa ? 'Empresa' : 'Profesional / Particular'}
                  </div>
                )}
              </div>

              {(editingPersonal ? personalForm.user_type === 'empresa' : isEmpresa) && (
                <Field
                  label="Nombre de empresa"
                  value={personalForm.display_name}
                  onChange={(v) => setPersonalForm(f => ({ ...f, display_name: v }))}
                  isEditing={editingPersonal}
                  placeholder="Ej: Agro Sur S.R.L."
                />
              )}

            </div>
          </SectionCard>

          {/* ── UBICACIÓN ── */}
          <SectionCard
            icon={<MapPin className="w-4 h-4" />}
            title="Ubicación"
            isEditing={editingLocation}
            onEdit={() => setEditingLocation(true)}
            onSave={handleSaveLocation}
            onCancel={handleCancelLocation}
            saving={saving === 'location'}
          >
            <div className="space-y-3">
              <Field
                label="Domicilio"
                value={locationForm.domicilio}
                onChange={(v) => setLocationForm(f => ({ ...f, domicilio: v }))}
                isEditing={editingLocation}
                placeholder="Av. San Martín 1234"
                optional
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Localidad</label>
                  {editingLocation ? (
                    <select
                      value={locationForm.location}
                      onChange={(e) => setLocationForm(f => ({ ...f, location: e.target.value }))}
                      disabled={!locationForm.province}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent disabled:opacity-50"
                    >
                      <option value="">Seleccionar</option>
                      {locationLocalities.map(loc => (
                        <option key={loc.id} value={loc.name}>{loc.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 text-sm bg-gray-50 rounded-lg text-gray-900">
                      {locationForm.location || <span className="text-gray-400">Sin especificar</span>}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Provincia</label>
                  {editingLocation ? (
                    <select
                      value={locationForm.province}
                      onChange={(e) => setLocationForm(f => ({ ...f, province: e.target.value, location: '' }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                    >
                      <option value="">Seleccionar</option>
                      {provinces.map(prov => (
                        <option key={prov.id} value={prov.name}>{prov.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 text-sm bg-gray-50 rounded-lg text-gray-900">
                      {locationForm.province || <span className="text-gray-400">Sin especificar</span>}
                    </div>
                  )}
                </div>
              </div>
              <Field
                label="Código Postal"
                value={locationForm.codigo_postal}
                onChange={(v) => setLocationForm(f => ({ ...f, codigo_postal: v }))}
                isEditing={editingLocation}
                placeholder="Ej: 1900"
                optional
              />
            </div>
          </SectionCard>

        </div>

        {/* ════════════════════════════
            COLUMNA 2: Facturación + Seguridad
            ════════════════════════════ */}
        <div className="space-y-4">

          {/* ── DATOS DE FACTURACIÓN ── */}
          <SectionCard
            icon={<FileText className="w-4 h-4" />}
            title="Datos de Facturación"
            badge={
              <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded font-normal">
                opcional
              </span>
            }
            isEditing={editingBilling}
            onEdit={() => setEditingBilling(true)}
            onSave={handleSaveBilling}
            onCancel={handleCancelBilling}
            saving={saving === 'billing'}
          >
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={billingSameAddress}
                  onChange={(e) => setBillingSameAddress(e.target.checked)}
                  disabled={!editingBilling}
                  className="w-4 h-4 accent-brand-600"
                />
                <span className="text-sm text-gray-700">Misma dirección que en Ubicación</span>
              </label>

              {!billingSameAddress && (
                <div className="space-y-3 pt-1 border-t border-gray-100 mt-3">
                  <Field
                    label="Domicilio de facturación"
                    value={billingForm.domicilio}
                    onChange={(v) => setBillingForm(f => ({ ...f, domicilio: v }))}
                    isEditing={editingBilling}
                    placeholder="Av. San Martín 1234"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Localidad"
                      value={billingForm.localidad}
                      onChange={(v) => setBillingForm(f => ({ ...f, localidad: v }))}
                      isEditing={editingBilling}
                      placeholder="La Plata"
                    />
                    <Field
                      label="Provincia"
                      value={billingForm.provincia}
                      onChange={(v) => setBillingForm(f => ({ ...f, provincia: v }))}
                      isEditing={editingBilling}
                      placeholder="Buenos Aires"
                    />
                  </div>
                  <Field
                    label="Código Postal"
                    value={billingForm.codigo_postal}
                    onChange={(v) => setBillingForm(f => ({ ...f, codigo_postal: v }))}
                    isEditing={editingBilling}
                    placeholder="1900"
                  />
                </div>
              )}

              <Field
                label="CUIT / CUIL"
                value={billingForm.cuit_cuil}
                onChange={(v) => setBillingForm(f => ({ ...f, cuit_cuil: v }))}
                isEditing={editingBilling}
                placeholder="20-12345678-9"
              />
            </div>
          </SectionCard>

          {/* ── SEGURIDAD Y CUENTA ── */}
          <AccountSecurityPanel />

        </div>

      </div>
    </div>
  );
};

export default ProfilePanel;

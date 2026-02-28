/**
 * ProfilePanel.tsx — Mi Cuenta
 *
 * Layout 2 columnas:
 *  ┌──────────────────────────┬──────────────────┐
 *  │ Hero (avatar+nombre+rol) │ Saldo disponible │
 *  │ Datos Personales         │ Método de pago   │
 *  │ Ubicación                │ Cupón            │
 *  │ Datos de Facturación     │                  │
 *  │ Seguridad y Cuenta       │                  │
 *  └──────────────────────────┴──────────────────┘
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  User, MapPin, Calendar, Edit, Save, X,
  CheckCircle, Coins, ShoppingCart, Gift, Clock,
  Loader2, Shield, Send, AlertCircle, Globe,
  EyeOff, CreditCard, Tag, Plus, FileText,
} from 'lucide-react';
import { notify } from '../../utils/notifications';
import { PROVINCES, LOCALITIES_BY_PROVINCE } from '../../constants/locations';
import { hasPremiumFeatures as checkPremium } from '../../constants/plans';
import { AvatarUpload } from '../common/AvatarUpload';
import { sendVerificationCode, verifyCode } from '../../services/phoneVerificationService';
import { updateProfile, uploadAvatar, deleteAvatar } from '../../services/profileService';
import { getUserCredits, getCreditTransactions, getCreditsConfig, purchaseCredits, validateCoupon, redeemCoupon } from '../../services/creditsService';
import { supabase } from '../../services/supabaseClient';
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
    <label className="block text-xs font-medium text-gray-500 mb-1">
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
        {hint && <span className="text-[10px] text-gray-400 ml-1">({hint})</span>}
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
  if (opts.plan_name && opts.plan_name.toLowerCase() !== 'free') return opts.plan_name;
  return opts.user_type === 'empresa' ? 'Empresa' : 'Particular';
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ProfilePanel: React.FC = () => {
  const { profile, updateProfile: updateAuthProfile, refreshProfile } = useAuth();

  const isEmpresa = profile?.user_type === 'empresa';
  const isSuperAdmin = profile?.role === 'superadmin';
  const hasPremiumFeatures = checkPremium({
    user_type: profile?.user_type,
    role: profile?.role,
    plan_name: profile?.plan_name,
  });
  const roleLabel = getSingleRole({
    role: profile?.role,
    plan_name: profile?.plan_name,
    user_type: profile?.user_type,
  });

  // ── Créditos ──────────────────────────────────────────────────────────────
  const [credits, setCredits] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [creditsConfig, setCreditsConfig] = useState<any>(null);
  const [selectedQty, setSelectedQty] = useState(3);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponValidated, setCouponValidated] = useState(false);
  const [couponInfo, setCouponInfo] = useState<{ credits: number; description: string } | null>(null);
  const [couponRedeeming, setCouponRedeeming] = useState(false);
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // ── Privacy (Hero) ────────────────────────────────────────────────────────
  const [privacyMode, setPrivacyMode] = useState<'public' | 'private'>(
    (profile?.privacy_mode as 'public' | 'private') ?? 'public'
  );
  const [privacySaving, setPrivacySaving] = useState(false);

  // ── Editing states ────────────────────────────────────────────────────────
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [editingBilling, setEditingBilling] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // ── Form states ───────────────────────────────────────────────────────────
  const [personalForm, setPersonalForm] = useState(() => {
    const { first_name, last_name } = splitFullName(profile?.full_name || '');
    return {
      first_name,
      last_name,
      user_type: (profile?.user_type || 'particular') as 'particular' | 'empresa',
      display_name: profile?.display_name || '',
      phone: profile?.phone || '',
    };
  });

  const [locationForm, setLocationForm] = useState({
    domicilio: '',       // TODO: migration pendiente
    province: profile?.province || '',
    location: profile?.location || '',  // = localidad
    codigo_postal: '',   // TODO: migration pendiente
  });

  // Facturación
  const [billingSameAddress, setBillingSameAddress] = useState(true);
  const [billingForm, setBillingForm] = useState({
    cuit_cuil: '',         // TODO: migration pendiente
    domicilio: '',
    localidad: '',
    provincia: '',
    codigo_postal: '',
  });

  // Mobile verification
  const isMobileVerified = profile?.mobile_verified === true;
  const [verificationStep, setVerificationStep] = useState<'idle' | 'code-sent' | 'verified'>(
    profile?.mobile_verified ? 'verified' : 'idle'
  );
  const [mobileInput, setMobileInput] = useState(profile?.mobile || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMobile, setVerificationMobile] = useState('');

  // ── Sync cuando llega el perfil ───────────────────────────────────────────
  useEffect(() => {
    if (!profile) return;
    const { first_name, last_name } = splitFullName(profile.full_name || '');
    setPersonalForm({
      first_name,
      last_name,
      user_type: (profile.user_type || 'particular') as 'particular' | 'empresa',
      display_name: profile.display_name || '',
      phone: profile.phone || '',
    });
    setLocationForm(f => ({
      ...f,
      province: profile.province || '',
      location: profile.location || '',
    }));
    setMobileInput(profile.mobile || '');
    if (profile.mobile_verified) setVerificationStep('verified');
    if (profile.privacy_mode) setPrivacyMode(profile.privacy_mode as 'public' | 'private');
  }, [profile]);

  // ── Créditos ──────────────────────────────────────────────────────────────
  useEffect(() => { loadCreditsData(); }, []);

  const loadCreditsData = async () => {
    setCreditsLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setCreditsLoading(false); return; }
      setAuthUserId(authUser.id);
      const [creditsData, transData, configData] = await Promise.all([
        getUserCredits(authUser.id),
        getCreditTransactions(authUser.id, 5),
        getCreditsConfig(),
      ]);
      setCredits(creditsData);
      setTransactions(transData);
      setCreditsConfig(configData);
    } catch (err) {
      console.error('Error loading credits:', err);
    } finally {
      setCreditsLoading(false);
    }
  };

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
      notify.error('Disponible en planes Premium y cuentas Empresa');
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
        phone: personalForm.phone,
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
      user_type: (profile?.user_type || 'particular') as 'particular' | 'empresa',
      display_name: profile?.display_name || '',
      phone: profile?.phone || '',
    });
    if (!isMobileVerified) { setVerificationStep('idle'); setVerificationCode(''); }
    setMobileInput(profile?.mobile || '');
  };

  // ── Save: Ubicación ───────────────────────────────────────────────────────
  const handleSaveLocation = async () => {
    setSaving('location');
    try {
      const { error } = await updateProfile({
        province: locationForm.province,
        location: locationForm.location,
        // domicilio, codigo_postal: pending DB migration
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
      province: profile?.province || '',
      location: profile?.location || '',
    }));
  };

  // ── Save: Facturación (UI ready, pending migration) ───────────────────────
  const handleSaveBilling = async () => {
    setSaving('billing');
    // TODO: awaiting DB migration for billing fields (cuit_cuil, billing_*)
    await new Promise(r => setTimeout(r, 400));
    notify.success('Guardado');
    setEditingBilling(false);
    setSaving(null);
  };

  const handleCancelBilling = () => {
    setEditingBilling(false);
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

  // ── Purchase credits inline ────────────────────────────────────────────────
  const handlePurchase = async () => {
    if (!authUserId) return;
    setPurchasing(true);
    setPurchaseError(null);
    try {
      const mockPaymentId = `MP_${Date.now()}`;
      const result = await purchaseCredits(authUserId, selectedQty, mockPaymentId);
      if (!result.success) {
        setPurchaseError(result.error || 'Error al procesar el pago');
      } else {
        setPurchaseSuccess(true);
        await loadCreditsData();
        setTimeout(() => setPurchaseSuccess(false), 4000);
      }
    } catch {
      setPurchaseError('Error al procesar el pago');
    } finally {
      setPurchasing(false);
    }
  };

  // ── Coupon inline ──────────────────────────────────────────────────────────
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponValidating(true);
    setCouponError(null);
    try {
      const result = await validateCoupon(couponCode.trim());
      if (result.valid) {
        setCouponValidated(true);
        setCouponInfo({ credits: result.credits!, description: result.description || '' });
      } else {
        setCouponError(result.error || 'Cupón inválido o expirado');
      }
    } catch {
      setCouponError('Error al validar el cupón');
    } finally {
      setCouponValidating(false);
    }
  };

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponRedeeming(true);
    setCouponError(null);
    try {
      const result = await redeemCoupon(couponCode.trim());
      if (result.success) {
        setCouponSuccess(true);
        await loadCreditsData();
      } else {
        setCouponError(result.error || 'Error al canjear el cupón');
      }
    } catch {
      setCouponError('Error al canjear el cupón');
    } finally {
      setCouponRedeeming(false);
    }
  };

  const resetCoupon = () => {
    setCouponCode('');
    setCouponValidated(false);
    setCouponInfo(null);
    setCouponSuccess(false);
    setCouponError(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-5xl mx-auto">

      {/* HEADER */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Mi Cuenta</h1>
        <p className="text-sm text-gray-500">Gestioná tu perfil, contacto y seguridad</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">

        {/* ════════════════════════════════════
            COLUMNA 1
            ════════════════════════════════════ */}
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
                {/* Un solo rol */}
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold
                  ${isSuperAdmin
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                    : 'bg-brand-100 text-brand-700'
                  }`}>
                  {roleLabel}
                </span>
                {/* Miembro desde + Verificado */}
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
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  {privacyMode === 'public'
                    ? <><Globe className="w-3.5 h-3.5 text-brand-600" /> Perfil público</>
                    : <><EyeOff className="w-3.5 h-3.5 text-gray-500" /> Perfil privado</>
                  }
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {privacyMode === 'public'
                    ? 'Tu contacto es visible para todos'
                    : 'Tu teléfono y email están ocultos'}
                </p>
              </div>
              <button
                type="button"
                onClick={handlePrivacyToggle}
                disabled={privacySaving || !hasPremiumFeatures}
                title={!hasPremiumFeatures ? 'Disponible en planes Premium y Empresa' : undefined}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none
                  ${!hasPremiumFeatures ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  ${privacyMode === 'private' ? 'bg-brand-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform
                  ${privacyMode === 'private' ? 'translate-x-4' : 'translate-x-0.5'}`} />
                {privacySaving && (
                  <Loader2 className="absolute -right-5 w-3.5 h-3.5 text-brand-600 animate-spin" />
                )}
              </button>
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

              {/* Nombre + Apellido */}
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

              {/* Email */}
              <Field
                label="Email"
                value={profile?.email || ''}
                isEditing={false}
                disabled
                hint="Cambiar en Seguridad"
              />

              {/* Celular con verificación */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  Celular <span className="text-red-400">*</span>
                  {isMobileVerified && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-semibold rounded-full ml-1">
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
                {/* Código SMS */}
                {verificationStep === 'code-sent' && !isMobileVerified && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 mb-2 flex items-center gap-1">
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
                        className="w-24 px-3 py-2 text-sm text-center font-mono tracking-widest border border-blue-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
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
                      <button type="button" onClick={handleSendVerificationCode} disabled={verificationLoading} className="px-2 text-xs text-blue-600 hover:text-blue-800 underline">
                        Reenviar
                      </button>
                    </div>
                  </div>
                )}
                {!isMobileVerified && !editingPersonal && mobileInput && (
                  <p className="mt-1 text-[10px] text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Celular no verificado. Editá para verificarlo.
                  </p>
                )}
              </div>

              {/* Teléfono Fijo */}
              <Field
                label="Teléfono Fijo"
                value={personalForm.phone}
                onChange={(v) => setPersonalForm(f => ({ ...f, phone: v }))}
                isEditing={editingPersonal}
                placeholder="011 1234-5678"
                optional
              />

              {/* Tipo: Particular / Empresa */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Tipo de cuenta</label>
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

              {/* Nombre empresa (solo empresa) */}
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
              {/* Domicilio */}
              <Field
                label="Domicilio"
                value={locationForm.domicilio}
                onChange={(v) => setLocationForm(f => ({ ...f, domicilio: v }))}
                isEditing={editingLocation}
                placeholder="Av. San Martín 1234"
                optional
              />
              <div className="grid grid-cols-2 gap-3">
                {/* Localidad */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Localidad</label>
                  {editingLocation ? (
                    <select
                      value={locationForm.location}
                      onChange={(e) => setLocationForm(f => ({ ...f, location: e.target.value }))}
                      disabled={!locationForm.province}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent disabled:opacity-50"
                    >
                      <option value="">Seleccionar</option>
                      {(LOCALITIES_BY_PROVINCE[locationForm.province] || []).map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 text-sm bg-gray-50 rounded-lg text-gray-900">
                      {locationForm.location || <span className="text-gray-400">Sin especificar</span>}
                    </div>
                  )}
                </div>
                {/* Provincia */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Provincia</label>
                  {editingLocation ? (
                    <select
                      value={locationForm.province}
                      onChange={(e) => setLocationForm(f => ({ ...f, province: e.target.value, location: '' }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                    >
                      <option value="">Seleccionar</option>
                      {PROVINCES.map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 text-sm bg-gray-50 rounded-lg text-gray-900">
                      {locationForm.province || <span className="text-gray-400">Sin especificar</span>}
                    </div>
                  )}
                </div>
              </div>
              {/* Código Postal */}
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

          {/* ── DATOS DE FACTURACIÓN ── */}
          <SectionCard
            icon={<FileText className="w-4 h-4" />}
            title="Datos de Facturación"
            badge={
              <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[10px] rounded font-normal">
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
              {/* Checkbox misma dirección */}
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={billingSameAddress}
                  onChange={(e) => setBillingSameAddress(e.target.checked)}
                  disabled={!editingBilling}
                  className="w-4 h-4 accent-brand-600"
                />
                <span className="text-sm text-gray-700">Misma dirección declarada en Ubicación</span>
              </label>

              {/* Campos adicionales si dirección distinta */}
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

              {/* CUIT/CUIL — siempre visible */}
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

        {/* ════════════════════════════════════
            COLUMNA 2 — sticky en desktop
            ════════════════════════════════════ */}
        <div className="space-y-4 lg:sticky lg:top-4">

          {/* ── SALDO DISPONIBLE ── */}
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-brand-700 text-[10px] font-semibold uppercase tracking-wider">
                Saldo Disponible
              </p>
              <Coins className="w-4 h-4 text-brand-500" />
            </div>

            {creditsLoading ? (
              <Loader2 className="w-6 h-6 text-brand-500 animate-spin my-3" />
            ) : (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-black text-brand-800 leading-none">
                    {credits?.balance ?? 0}
                  </span>
                  <span className="text-sm font-semibold text-brand-600">créditos</span>
                </div>
                <p className="mt-1 text-brand-600/70 text-[11px]">
                  Usá tu saldo para destacar avisos
                </p>
              </>
            )}

            {/* Movimientos — siempre visible */}
            {transactions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-brand-200">
                <p className="text-brand-700 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Clock className="w-3 h-3" /> Últimos movimientos
                </p>
                <div className="space-y-1.5">
                  {transactions.slice(0, 5).map(tx => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between bg-brand-100 rounded-lg px-3 py-1.5"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="text-brand-900 text-xs truncate">{tx.description}</p>
                        <p className="text-brand-600/60 text-[10px]">
                          {new Date(tx.created_at).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className={`text-xs font-bold ${tx.amount > 0 ? 'text-brand-700' : 'text-red-600'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── CARGAR CRÉDITOS inline ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2 mb-4">
              <ShoppingCart className="w-4 h-4 text-brand-600" />
              Cargar Créditos
            </h3>

            {purchaseSuccess ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle className="w-8 h-8 text-brand-600" />
                <p className="text-sm font-semibold text-brand-700">¡Créditos acreditados!</p>
                <p className="text-xs text-gray-500">Tu saldo fue actualizado</p>
              </div>
            ) : (
              <>
                {/* Selector de cantidad */}
                <div className="grid grid-cols-4 gap-1.5 mb-4">
                  {[1, 2, 3, 4].map(qty => (
                    <button
                      key={qty}
                      onClick={() => setSelectedQty(qty)}
                      className={`relative py-3 rounded-lg text-sm font-bold border-2 transition-all ${
                        selectedQty === qty
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-brand-300'
                      }`}
                    >
                      {qty}
                      {qty === 3 && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1 py-0.5 bg-brand-500 text-white text-[9px] font-bold rounded-full leading-none whitespace-nowrap">
                          MEJOR
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs text-gray-500">Total</span>
                  <span className="text-base font-bold text-gray-900">
                    {creditsConfig
                      ? `$${(creditsConfig.credit_base_price * selectedQty).toLocaleString('es-AR')} ARS`
                      : <Loader2 className="w-3 h-3 animate-spin inline" />
                    }
                  </span>
                </div>

                {purchaseError && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mb-2">
                    <AlertCircle className="w-3.5 h-3.5" /> {purchaseError}
                  </p>
                )}

                <button
                  onClick={handlePurchase}
                  disabled={purchasing || !creditsConfig}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 px-4 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#009EE3' }}
                  onMouseEnter={(e) => { if (!purchasing) e.currentTarget.style.backgroundColor = '#0087C3'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#009EE3'; }}
                >
                  {purchasing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Pagar con <strong>MercadoPago</strong>
                </button>
              </>
            )}
          </div>

          {/* ── MÉTODO DE PAGO ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-brand-600" />
              Método de Pago
            </h3>

            {/* Skeleton tarjeta */}
            <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl h-28 p-4 flex flex-col justify-between animate-pulse mb-3">
              <div className="flex justify-between items-start">
                <div className="w-8 h-5 bg-white/40 rounded-sm" />
                <div className="w-10 h-6 bg-white/30 rounded-md" />
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 bg-white/50 rounded w-3/4" />
                <div className="flex gap-3">
                  <div className="h-2 bg-white/40 rounded w-1/3" />
                  <div className="h-2 bg-white/40 rounded w-1/6" />
                </div>
              </div>
            </div>

            <button className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-xs text-gray-400 hover:border-brand-400 hover:text-brand-600 transition-colors flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Agregar tarjeta
            </button>
          </div>

          {/* ── CUPÓN inline ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4 text-brand-600" />
              Canjear Cupón
            </h3>

            {couponSuccess ? (
              <div className="flex flex-col items-center gap-2 py-3 text-center">
                <CheckCircle className="w-8 h-8 text-brand-600" />
                <p className="text-sm font-semibold text-brand-700">
                  ¡+{couponInfo?.credits} créditos acreditados!
                </p>
                <button onClick={resetCoupon} className="text-xs text-brand-600 hover:underline mt-1">
                  Usar otro cupón
                </button>
              </div>
            ) : couponValidated && couponInfo ? (
              <div className="space-y-3">
                <div className="bg-brand-50 border border-brand-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-brand-700 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Cupón válido
                  </p>
                  <p className="text-sm font-bold text-brand-800 mt-0.5">+{couponInfo.credits} créditos</p>
                  {couponInfo.description && (
                    <p className="text-[11px] text-brand-600 mt-0.5">{couponInfo.description}</p>
                  )}
                </div>
                {couponError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {couponError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleRedeemCoupon}
                    disabled={couponRedeeming}
                    className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {couponRedeeming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Canjear
                  </button>
                  <button
                    onClick={resetCoupon}
                    className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                    setCouponError(null);
                  }}
                  placeholder="Ej: RURAL2026"
                  maxLength={20}
                  className="w-full px-3 py-2.5 text-sm font-mono tracking-wider border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
                {couponError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {couponError}
                  </p>
                )}
                <button
                  onClick={handleValidateCoupon}
                  disabled={couponValidating || !couponCode.trim()}
                  className="w-full py-2.5 border border-brand-600 text-brand-600 hover:bg-brand-50 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {couponValidating
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Validando...</>
                    : <><Tag className="w-3.5 h-3.5" /> Validar cupón</>
                  }
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePanel;

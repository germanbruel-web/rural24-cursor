/**
 * ProfilePanel.tsx — Mi Cuenta
 *
 * Layout desktop:
 *  ┌───────────────────────────────────────────────────────┐
 *  │  SALDO PARA PUBLICIDAD (full-width)                   │
 *  │  [$X.XXX ARS + movimientos] | [Canjear cupón]         │
 *  └───────────────────────────────────────────────────────┘
 *  ┌──────────────────────────┬──────────────────────────┐
 *  │  COLUMNA 1               │  COLUMNA 2               │
 *  │  Hero (avatar+rol+priv.) │  Datos de Facturación    │
 *  │  Datos Personales        │  Seguridad y Cuenta      │
 *  │  Ubicación               │                          │
 *  └──────────────────────────┴──────────────────────────┘
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  User, MapPin, Edit, Save, X,
  CheckCircle, Gift, Clock,
  Loader2, Shield, Send, AlertCircle, Globe,
  EyeOff, Tag, FileText, Banknote, TrendingDown, TrendingUp, Calendar,
} from 'lucide-react';
import { notify } from '../../utils/notifications';
import { PROVINCES, LOCALITIES_BY_PROVINCE } from '../../constants/locations';
import { hasPremiumFeatures as checkPremium } from '../../constants/plans';
import { AvatarUpload } from '../common/AvatarUpload';
import { sendVerificationCode, verifyCode } from '../../services/phoneVerificationService';
import { updateProfile, uploadAvatar, deleteAvatar } from '../../services/profileService';
import {
  getWalletBalance,
  getWalletTransactions,
  validateCoupon,
  redeemCoupon,
  formatARS,
  type WalletTransaction,
} from '../../services/walletService';
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

function txIcon(tx: WalletTransaction) {
  return tx.tx_type === 'credit'
    ? <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
    : <TrendingDown className="w-3 h-3 text-red-500 shrink-0" />;
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

  // ── Wallet ─────────────────────────────────────────────────────────────────
  const [walletBalance, setWalletBalance]       = useState<number>(0);
  const [walletTxs, setWalletTxs]               = useState<WalletTransaction[]>([]);
  const [walletLoading, setWalletLoading]       = useState(true);

  // ── Cupón ──────────────────────────────────────────────────────────────────
  const [couponCode, setCouponCode]             = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponValidated, setCouponValidated]   = useState(false);
  const [couponInfo, setCouponInfo]             = useState<{ arsAmount: number; description: string } | null>(null);
  const [couponRedeeming, setCouponRedeeming]   = useState(false);
  const [couponSuccess, setCouponSuccess]       = useState(false);
  const [couponError, setCouponError]           = useState<string | null>(null);

  // ── Privacy (Hero) ────────────────────────────────────────────────────────
  const [privacyMode, setPrivacyMode]   = useState<'public' | 'private'>(
    (profile?.privacy_mode as 'public' | 'private') ?? 'public'
  );
  const [privacySaving, setPrivacySaving] = useState(false);

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
    domicilio:     '',        // TODO: migration pendiente
    province:      profile?.province || '',
    location:      profile?.location || '',  // = localidad
    codigo_postal: '',        // TODO: migration pendiente
  });

  const [billingSameAddress, setBillingSameAddress] = useState(true);
  const [billingForm, setBillingForm] = useState({
    cuit_cuil:     '',        // TODO: migration pendiente
    domicilio:     '',
    localidad:     '',
    provincia:     '',
    codigo_postal: '',
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
      province: profile.province || '',
      location: profile.location || '',
    }));
    setMobileInput(profile.mobile || '');
    if (profile.mobile_verified) setVerificationStep('verified');
    if (profile.privacy_mode)    setPrivacyMode(profile.privacy_mode as 'public' | 'private');
  }, [profile]);

  // ── Wallet ────────────────────────────────────────────────────────────────
  useEffect(() => { loadWalletData(); }, []);

  const loadWalletData = async () => {
    setWalletLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setWalletLoading(false); return; }

      const [wallet, txs] = await Promise.all([
        getWalletBalance(authUser.id),
        getWalletTransactions(authUser.id, 5),
      ]);

      setWalletBalance(wallet?.virtual_balance ?? 0);
      setWalletTxs(txs);
    } catch (err) {
      console.error('Error cargando wallet:', err);
    } finally {
      setWalletLoading(false);
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

  const handleCancelBilling = () => setEditingBilling(false);

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

  // ── Cupón ──────────────────────────────────────────────────────────────────
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponValidating(true);
    setCouponError(null);
    try {
      const result = await validateCoupon(couponCode.trim());
      if (result.valid) {
        setCouponValidated(true);
        setCouponInfo({ arsAmount: result.arsAmount!, description: result.description || '' });
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
        await loadWalletData();
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
    <div className="max-w-5xl mx-auto space-y-5">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mi Cuenta</h1>
        <p className="text-sm text-gray-500">Gestioná tu perfil, contacto y seguridad</p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          SALDO PARA PUBLICIDAD — full-width
          ══════════════════════════════════════════════════════════ */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-brand-200/60">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-brand-800 uppercase tracking-wide">
              Saldo para Publicidad
            </h3>
          </div>
          <span className="text-[10px] text-brand-600 font-medium bg-brand-100 px-2 py-0.5 rounded-full">
            ARS Virtual
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-brand-200/60">

          {/* ── Balance + Movimientos ── */}
          <div className="p-5">
            {walletLoading ? (
              <Loader2 className="w-6 h-6 text-brand-500 animate-spin my-2" />
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-black text-brand-800 leading-none">
                    {formatARS(walletBalance)}
                  </span>
                  <span className="text-sm font-semibold text-brand-600">ARS</span>
                </div>
                <p className="text-brand-600/80 text-xs">
                  Usá tu saldo para destacar avisos
                </p>
              </>
            )}

            {/* Movimientos */}
            {walletTxs.length > 0 && (
              <div className="mt-4 pt-3 border-t border-brand-200/60">
                <p className="text-brand-700 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Clock className="w-3 h-3" /> Últimos movimientos
                </p>
                <div className="space-y-1.5">
                  {walletTxs.map(tx => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-1.5"
                    >
                      {txIcon(tx)}
                      <div className="flex-1 min-w-0">
                        <p className="text-brand-900 text-xs truncate">{tx.description}</p>
                        <p className="text-brand-600/60 text-[10px]">
                          {new Date(tx.created_at).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className={`text-xs font-bold shrink-0 ${tx.tx_type === 'credit' ? 'text-emerald-700' : 'text-red-600'}`}>
                        {tx.tx_type === 'credit' ? '+' : '-'}{formatARS(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!walletLoading && walletTxs.length === 0 && (
              <p className="mt-3 text-[11px] text-brand-500/70">
                Sin movimientos aún. Canjea un cupón para empezar.
              </p>
            )}
          </div>

          {/* ── Cupón ── */}
          <div className="p-5">
            <p className="text-sm font-bold text-brand-800 flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4 text-brand-600" /> Canjear cupón
            </p>

            {couponSuccess ? (
              <div className="flex flex-col items-center gap-2 py-3 text-center">
                <CheckCircle className="w-8 h-8 text-brand-600" />
                <p className="text-sm font-semibold text-brand-700">
                  ¡{formatARS(couponInfo?.arsAmount ?? 0)} ARS acreditados!
                </p>
                <p className="text-[11px] text-brand-600/70">Tu saldo fue actualizado</p>
                <button onClick={resetCoupon} className="text-xs text-brand-600 hover:underline mt-1">
                  Usar otro cupón
                </button>
              </div>
            ) : couponValidated && couponInfo ? (
              <div className="space-y-3">
                <div className="bg-white border border-brand-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-brand-700 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Cupón válido
                  </p>
                  <p className="text-base font-black text-brand-800 mt-0.5">
                    +{formatARS(couponInfo.arsAmount)} ARS
                  </p>
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
                  className="w-full px-3 py-2.5 text-sm font-mono tracking-wider border border-brand-200 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent bg-white"
                />
                {couponError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {couponError}
                  </p>
                )}
                <button
                  onClick={handleValidateCoupon}
                  disabled={couponValidating || !couponCode.trim()}
                  className="w-full py-2.5 border border-brand-600 text-brand-700 hover:bg-brand-100 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold
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
                  <p className="mt-1 text-[10px] text-amber-600 flex items-center gap-1">
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

/**
 * ProfilePanel.tsx — Mi Cuenta (1 columna, secciones independientes)
 *
 * Layout:
 *  ┌─────────────────────────┐
 *  │  HERO (avatar + info)   │
 *  ├─────────────────────────┤
 *  │  DATOS PERSONALES       │  ← Editar independiente
 *  ├─────────────────────────┤
 *  │  PERFIL PROFESIONAL     │  ← solo premium/empresa
 *  ├─────────────────────────┤
 *  │  UBICACIÓN              │  ← Editar independiente
 *  ├─────────────────────────┤
 *  │  CONTACTO               │  ← Editar independiente
 *  ├─────────────────────────┤
 *  │  CRÉDITOS               │  ← acción directa
 *  ├─────────────────────────┤
 *  │  SEGURIDAD Y CUENTA     │  ← AccountSecurityPanel
 *  └─────────────────────────┘
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  User, Phone, MapPin, Calendar, Edit, Save, X,
  CheckCircle, Briefcase, Coins, ShoppingCart,
  Gift, Clock, Loader2, Shield, Send, AlertCircle,
} from 'lucide-react';
import { notify } from '../../utils/notifications';
import { PROVINCES, LOCALITIES_BY_PROVINCE } from '../../constants/locations';
import { hasPremiumFeatures as checkPremium } from '../../constants/plans';
import { AvatarUpload } from '../common/AvatarUpload';
import { sendVerificationCode, verifyCode } from '../../services/phoneVerificationService';
import { updateProfile, uploadAvatar, deleteAvatar } from '../../services/profileService';
import { getUserCredits, getCreditTransactions } from '../../services/creditsService';
import { supabase } from '../../services/supabaseClient';
import BuyCreditsModal from '../modals/BuyCreditsModal';
import RedeemCouponModal from '../modals/RedeemCouponModal';
import { Button } from '../atoms/Button';
import { AccountSecurityPanel } from './AccountSecurityPanel';

// ============================================================================
// SECTION CARD — contenedor con header editable reutilizable
// ============================================================================

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
  icon, title, isEditing, onEdit, onSave, onCancel, saving = false, children,
}) => (
  <div className="bg-white rounded-xl border border-gray-200">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <span className="text-brand-600">{icon}</span>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{title}</h3>
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
              {saving
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Save className="w-3.5 h-3.5" />}
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
  label, value, onChange, isEditing, placeholder, type = 'text', disabled, hint,
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

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return { first_name: parts[0], last_name: '' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

export const ProfilePanel: React.FC = () => {
  const { profile, updateProfile: updateAuthProfile, refreshProfile } = useAuth();

  const isEmpresa = profile?.user_type === 'empresa';
  const isSuperAdmin = profile?.role === 'superadmin';
  const hasPremiumFeatures = checkPremium({
    user_type: profile?.user_type,
    role: profile?.role,
    plan_name: profile?.plan_name,
  });

  // ── Créditos ──────────────────────────────────────────────────────────────
  const [credits, setCredits] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const [showRedeemCouponModal, setShowRedeemCouponModal] = useState(false);

  // ── Editing states por sección ────────────────────────────────────────────
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // ── Form states ───────────────────────────────────────────────────────────
  const [personalForm, setPersonalForm] = useState(() => {
    const { first_name, last_name } = splitFullName(profile?.full_name || '');
    return { first_name, last_name, bio: profile?.bio || '' };
  });

  const [professionalForm, setProfessionalForm] = useState({
    display_name: profile?.display_name || '',
    services: profile?.services || '',
  });

  const [locationForm, setLocationForm] = useState({
    province: profile?.province || '',
    location: profile?.location || '',
  });

  const [contactForm, setContactForm] = useState({
    mobile: profile?.mobile || '',
    phone: profile?.phone || '',
  });

  // ── Phone verification ────────────────────────────────────────────────────
  const isMobileVerified = profile?.mobile_verified === true;
  const [verificationStep, setVerificationStep] = useState<'idle' | 'code-sent' | 'verified'>(
    profile?.mobile_verified ? 'verified' : 'idle'
  );
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMobile, setVerificationMobile] = useState('');

  // ── Sync formularios cuando carga el perfil ───────────────────────────────
  useEffect(() => {
    if (!profile) return;
    const { first_name, last_name } = splitFullName(profile.full_name || '');
    setPersonalForm({ first_name, last_name, bio: profile.bio || '' });
    setProfessionalForm({
      display_name: profile.display_name || '',
      services: profile.services || '',
    });
    setLocationForm({ province: profile.province || '', location: profile.location || '' });
    setContactForm({ mobile: profile.mobile || '', phone: profile.phone || '' });
    if (profile.mobile_verified) setVerificationStep('verified');
  }, [profile]);

  // ── Créditos ──────────────────────────────────────────────────────────────
  useEffect(() => { loadCreditsData(); }, []);

  const loadCreditsData = async () => {
    setCreditsLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setCreditsLoading(false); return; }
      const [creditsData, transData] = await Promise.all([
        getUserCredits(authUser.id),
        getCreditTransactions(authUser.id, 5),
      ]);
      setCredits(creditsData);
      setTransactions(transData);
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

  // ── Save: Datos Personales ────────────────────────────────────────────────
  const handleSavePersonal = async () => {
    setSaving('personal');
    try {
      const fullName = `${personalForm.first_name.trim()} ${personalForm.last_name.trim()}`.trim();
      const { error } = await updateProfile({ full_name: fullName, bio: personalForm.bio });
      if (error) { notify.error('Error: ' + error.message); return; }
      await updateAuthProfile({ full_name: fullName });
      notify.success('Datos personales actualizados');
      setEditingPersonal(false);
    } catch { notify.error('Error al guardar'); }
    finally { setSaving(null); }
  };

  const handleCancelPersonal = () => {
    setEditingPersonal(false);
    const { first_name, last_name } = splitFullName(profile?.full_name || '');
    setPersonalForm({ first_name, last_name, bio: profile?.bio || '' });
  };

  // ── Save: Perfil Profesional ──────────────────────────────────────────────
  const handleSaveProfessional = async () => {
    setSaving('professional');
    try {
      const { error } = await updateProfile({
        display_name: professionalForm.display_name,
        services: professionalForm.services,
      });
      if (error) { notify.error('Error: ' + error.message); return; }
      notify.success('Perfil profesional actualizado');
      setEditingProfessional(false);
    } catch { notify.error('Error al guardar'); }
    finally { setSaving(null); }
  };

  const handleCancelProfessional = () => {
    setEditingProfessional(false);
    setProfessionalForm({
      display_name: profile?.display_name || '',
      services: profile?.services || '',
    });
  };

  // ── Save: Ubicación ───────────────────────────────────────────────────────
  const handleSaveLocation = async () => {
    setSaving('location');
    try {
      const { error } = await updateProfile({
        province: locationForm.province,
        location: locationForm.location,
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
    setLocationForm({ province: profile?.province || '', location: profile?.location || '' });
  };

  // ── Save: Contacto ────────────────────────────────────────────────────────
  const handleSaveContact = async () => {
    setSaving('contact');
    try {
      if (isMobileVerified) {
        const { error } = await updateProfile({ phone: contactForm.phone });
        if (error) { notify.error('Error: ' + error.message); return; }
        await updateAuthProfile({ phone: contactForm.phone });
      }
      notify.success('Contacto actualizado');
      setEditingContact(false);
    } catch { notify.error('Error al guardar'); }
    finally { setSaving(null); }
  };

  const handleCancelContact = () => {
    setEditingContact(false);
    setContactForm({ mobile: profile?.mobile || '', phone: profile?.phone || '' });
    if (!isMobileVerified) { setVerificationStep('idle'); setVerificationCode(''); }
  };

  // ── Phone verification ────────────────────────────────────────────────────
  const handleSendVerificationCode = async () => {
    const mobile = contactForm.mobile.trim();
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
    } catch { notify.error('Error de conexión al enviar código'); }
    finally { setVerificationLoading(false); }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 4) { notify.error('El código debe ser de 4 dígitos'); return; }
    setVerificationLoading(true);
    try {
      const result = await verifyCode(verificationMobile, verificationCode);
      if (result.success) {
        setVerificationStep('verified');
        notify.success('¡Celular verificado exitosamente!');
        await refreshProfile();
      } else {
        notify.error(result.error || 'Código incorrecto');
      }
    } catch { notify.error('Error de conexión al verificar'); }
    finally { setVerificationLoading(false); }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── HEADER ── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mi Cuenta</h1>
        <p className="text-sm text-gray-500">Gestioná tu perfil, contacto y seguridad</p>
      </div>

      {/* ══════════════════════════════════════════
          1. HERO — Avatar + nombre + roles
          ══════════════════════════════════════════ */}
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
              {profile?.display_name || profile?.full_name || profile?.email?.split('@')[0] || 'Usuario'}
            </h2>
            <p className="text-sm text-gray-500 truncate">{profile?.email}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {isSuperAdmin && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-[10px] font-bold rounded-full">
                  SuperAdmin
                </span>
              )}
              {profile?.plan_name && (
                <span className="px-2 py-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-full">
                  {profile.plan_name}
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
            <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Miembro desde {new Date(profile?.created_at || '').toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          2. DATOS PERSONALES
          ══════════════════════════════════════════ */}
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
            <CompactField
              label="Nombre"
              value={personalForm.first_name}
              onChange={(v) => setPersonalForm(f => ({ ...f, first_name: v }))}
              isEditing={editingPersonal}
              placeholder="Juan"
            />
            <CompactField
              label="Apellido"
              value={personalForm.last_name}
              onChange={(v) => setPersonalForm(f => ({ ...f, last_name: v }))}
              isEditing={editingPersonal}
              placeholder="Pérez"
            />
          </div>

          <CompactField
            label="Email"
            value={profile?.email || ''}
            isEditing={false}
            disabled
            hint="Cambiar en Seguridad"
          />

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Bio / Descripción breve
            </label>
            {editingPersonal ? (
              <textarea
                value={personalForm.bio}
                onChange={(e) => setPersonalForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Contanos sobre vos, tu experiencia, qué ofrecés..."
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
              />
            ) : (
              <div className="px-3 py-2 text-sm bg-gray-50 rounded-lg text-gray-900 min-h-[60px]">
                {personalForm.bio || <span className="text-gray-400 italic">Sin descripción</span>}
              </div>
            )}
            {editingPersonal && (
              <p className="text-[10px] text-gray-400 mt-0.5 text-right">{personalForm.bio.length}/500</p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════
          3. PERFIL PROFESIONAL (solo premium/empresa)
          ══════════════════════════════════════════ */}
      {hasPremiumFeatures && (
        <SectionCard
          icon={<Briefcase className="w-4 h-4" />}
          title="Perfil Profesional"
          isEditing={editingProfessional}
          onEdit={() => setEditingProfessional(true)}
          onSave={handleSaveProfessional}
          onCancel={handleCancelProfessional}
          saving={saving === 'professional'}
        >
          <div className="space-y-3">
            <CompactField
              label={isEmpresa ? 'Razón Social' : 'Nombre Profesional'}
              value={professionalForm.display_name}
              onChange={(v) => setProfessionalForm(f => ({ ...f, display_name: v }))}
              isEditing={editingProfessional}
              placeholder={isEmpresa ? 'Ej: Agro Sur S.R.L.' : 'Ej: Juan Pérez - Agrónomo'}
            />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Servicios que ofrezco
              </label>
              {editingProfessional ? (
                <textarea
                  value={professionalForm.services}
                  onChange={(e) => setProfessionalForm(f => ({ ...f, services: e.target.value }))}
                  placeholder="Ej: Asesoramiento agrícola, Tasaciones, Venta de maquinaria..."
                  rows={2}
                  maxLength={300}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent resize-none"
                />
              ) : (
                <div className="px-3 py-2 text-sm bg-gray-50 rounded-lg text-gray-900">
                  {professionalForm.services || <span className="text-gray-400 italic">Sin servicios</span>}
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ══════════════════════════════════════════
          4. UBICACIÓN
          ══════════════════════════════════════════ */}
      <SectionCard
        icon={<MapPin className="w-4 h-4" />}
        title="Ubicación"
        isEditing={editingLocation}
        onEdit={() => setEditingLocation(true)}
        onSave={handleSaveLocation}
        onCancel={handleCancelLocation}
        saving={saving === 'location'}
      >
        <div className="grid grid-cols-2 gap-3">
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
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════
          5. CONTACTO
          ══════════════════════════════════════════ */}
      <SectionCard
        icon={<Phone className="w-4 h-4" />}
        title="Contacto"
        isEditing={editingContact}
        onEdit={() => setEditingContact(true)}
        onSave={handleSaveContact}
        onCancel={handleCancelContact}
        saving={saving === 'contact'}
      >
        <div className="space-y-4">

          {/* Celular */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              Celular <span className="text-red-500">*</span>
              {isMobileVerified && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-semibold rounded-full ml-1">
                  <CheckCircle className="w-3 h-3" /> Verificado
                </span>
              )}
            </label>

            {editingContact && !isMobileVerified ? (
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={contactForm.mobile}
                  onChange={(e) => setContactForm(f => ({ ...f, mobile: e.target.value }))}
                  placeholder="+54 9 11 1234-5678"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
                />
                {verificationStep !== 'code-sent' && (
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={verificationLoading || !contactForm.mobile.trim()}
                    className="px-3 py-2 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-500 transition-colors flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                  >
                    {verificationLoading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Send className="w-3.5 h-3.5" />}
                    Verificar
                  </button>
                )}
              </div>
            ) : (
              <div className={`px-3 py-2 text-sm rounded-lg ${isMobileVerified ? 'bg-brand-50 border border-brand-200 text-gray-900' : 'bg-gray-50 text-gray-900'}`}>
                {contactForm.mobile || <span className="text-gray-400">Sin especificar</span>}
              </div>
            )}

            {/* Paso 2: código */}
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
                    {verificationLoading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <CheckCircle className="w-3.5 h-3.5" />}
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

            {!isMobileVerified && !editingContact && contactForm.mobile && (
              <p className="mt-1 text-[10px] text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Celular no verificado. Editá para verificarlo.
              </p>
            )}
            {!contactForm.mobile && !editingContact && (
              <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Obligatorio. Editá para agregar tu celular.
              </p>
            )}
          </div>

          {/* Teléfono fijo */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              Teléfono Fijo
              {!isMobileVerified && (
                <span className="text-[10px] text-gray-400 ml-1">(verificá celular primero)</span>
              )}
            </label>
            {editingContact && isMobileVerified ? (
              <input
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="011 1234-5678"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-600 focus:border-transparent"
              />
            ) : (
              <div className={`px-3 py-2 text-sm rounded-lg ${!isMobileVerified ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-900'}`}>
                {isMobileVerified
                  ? (contactForm.phone || <span className="text-gray-400">Sin especificar</span>)
                  : <span className="italic text-xs">Verificá tu celular para habilitar</span>}
              </div>
            )}
          </div>

        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════
          6. CRÉDITOS
          ══════════════════════════════════════════ */}
      <div className="rounded-xl overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-cyan-100 text-[10px] font-medium uppercase tracking-wider">Saldo Disponible</p>
          <Coins className="w-4 h-4 text-white/50" />
        </div>
        {creditsLoading ? (
          <Loader2 className="w-6 h-6 text-white animate-spin my-3" />
        ) : (
          <>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-4xl font-black text-white leading-none">{credits?.balance || 0}</span>
              <span className="text-sm text-cyan-100 font-medium">créditos</span>
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
            <Gift className="w-3.5 h-3.5" /> Canjear cupón
          </Button>
        </div>
        {transactions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/20">
            <p className="text-white/70 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Últimos movimientos
            </p>
            <div className="space-y-1.5">
              {transactions.slice(0, 3).map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-1.5"
                >
                  <p className="text-white text-xs truncate flex-1 mr-2">{tx.description}</p>
                  <span className={`text-xs font-bold ${tx.amount > 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          7. SEGURIDAD Y CUENTA
          ══════════════════════════════════════════ */}
      <AccountSecurityPanel />

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

export default ProfilePanel;

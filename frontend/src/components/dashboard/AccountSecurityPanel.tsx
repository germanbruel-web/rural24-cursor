/**
 * AccountSecurityPanel.tsx
 * Panel "Seguridad y Cuenta" del dashboard de usuario.
 *
 * Secciones:
 *  1. Privacidad de datos (switch público / privado)
 *  2. Cambiar contraseña
 *  3. Cambiar email
 *  4. Eliminar cuenta (solicitud al superadmin)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Lock, Mail, Trash2, Eye, EyeOff, Shield, AlertTriangle,
  ChevronDown, ChevronUp, Loader2, CheckCircle, Globe, EyeOff as EyeOffIcon,
} from 'lucide-react';
import { notify } from '../../utils/notifications';
import {
  changePassword,
  changeEmail,
  requestAccountDeletion,
  detectAuthProvider,
  getActiveDeletionRequest,
} from '../../services/accountService';
import { updateProfile } from '../../services/profileService';

// ─── Tipos locales ─────────────────────────────────────────────────────────

const PREMIUM_PLANS = ['premium', 'profesional', 'avanzado', 'business', 'enterprise'];

// ─── Subcomponente: sección colapsable ─────────────────────────────────────

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  danger?: boolean;
}

const Section: React.FC<SectionProps> = ({
  icon, title, subtitle, children, defaultOpen = false, danger = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`bg-white rounded-lg border ${danger ? 'border-red-200' : 'border-gray-200'}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors rounded-lg
          ${danger ? 'hover:bg-red-50' : 'hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center
            ${danger ? 'bg-red-100 text-red-600' : 'bg-brand-100 text-brand-600'}`}>
            {icon}
          </div>
          <div>
            <p className={`text-sm font-semibold ${danger ? 'text-red-700' : 'text-gray-900'}`}>{title}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className={`px-4 sm:px-5 pb-5 border-t ${danger ? 'border-red-100' : 'border-gray-100'}`}>
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
};

// ─── Subcomponente: campo de contraseña con toggle visibilidad ──────────────

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  label, value, onChange, placeholder, disabled,
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-brand-600 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export const AccountSecurityPanel: React.FC = () => {
  const { profile, refreshProfile } = useAuth();

  const isSuperAdmin = profile?.role === 'superadmin';
  const planName = (profile as any)?.plan_name?.toLowerCase() || '';
  const isEmpresa = profile?.user_type === 'empresa';
  const hasPremiumPlan = PREMIUM_PLANS.some(p => planName.includes(p));
  const hasPremiumFeatures = isEmpresa || hasPremiumPlan || isSuperAdmin;

  // ── 1. Privacidad ──────────────────────────────────────────────────────

  const [privacyMode, setPrivacyMode] = useState<'public' | 'private'>(
    (profile?.privacy_mode as 'public' | 'private') ?? 'public'
  );
  const [privacySaving, setPrivacySaving] = useState(false);

  useEffect(() => {
    if (profile?.privacy_mode) {
      setPrivacyMode(profile.privacy_mode as 'public' | 'private');
    }
  }, [profile?.privacy_mode]);

  const handlePrivacyToggle = async () => {
    if (!hasPremiumFeatures) {
      notify.error('Esta función está disponible para planes Premium o cuentas Empresa. ¡Actualizá tu plan!');
      return;
    }
    const next: 'public' | 'private' = privacyMode === 'public' ? 'private' : 'public';
    setPrivacySaving(true);
    const { error } = await updateProfile({ privacy_mode: next });
    if (error) {
      notify.error('Error al actualizar privacidad: ' + error.message);
    } else {
      setPrivacyMode(next);
      await refreshProfile();
      notify.success(`Perfil ahora en modo ${next === 'public' ? 'PÚBLICO' : 'PRIVADO'}`);
    }
    setPrivacySaving(false);
  };

  // ── 2. Contraseña ──────────────────────────────────────────────────────

  const [authProvider, setAuthProvider] = useState<'email' | 'oauth' | null>(null);
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    detectAuthProvider().then(p => setAuthProvider(p));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    const result = await changePassword(pwForm);
    if (result.success) {
      notify.success('Contraseña actualizada correctamente.');
      setPwForm({ newPassword: '', confirmPassword: '' });
    } else {
      notify.error(result.error ?? 'Error al cambiar la contraseña.');
    }
    setPwLoading(false);
  };

  // ── 3. Cambio de email ─────────────────────────────────────────────────

  const [emailForm, setEmailForm] = useState({ newEmail: '', confirmEmail: '' });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    const result = await changeEmail(emailForm);
    if (result.success) {
      setEmailSent(true);
      notify.success('¡Revisá tu nuevo correo para confirmar el cambio!');
    } else {
      notify.error(result.error ?? 'Error al iniciar cambio de email.');
    }
    setEmailLoading(false);
  };

  // ── 4. Eliminación de cuenta ───────────────────────────────────────────

  const [deletionReason, setDeletionReason] = useState('');
  const [deletionConfirm, setDeletionConfirm] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [activeDeletion, setActiveDeletion] = useState<{
    exists: boolean;
    request?: { id: string; status: string; created_at: string };
  }>({ exists: false });

  useEffect(() => {
    getActiveDeletionRequest().then(res => setActiveDeletion(res));
  }, []);

  const handleDeletionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletionConfirm) {
      notify.error('Confirmá que querés enviar la solicitud.');
      return;
    }
    setDeletionLoading(true);
    const result = await requestAccountDeletion({ reason: deletionReason });
    if (result.success) {
      notify.success('Tu solicitud fue enviada. El equipo la revisará en los próximos días hábiles.');
      setDeletionReason('');
      setDeletionConfirm(false);
      setActiveDeletion({ exists: true });
    } else if (result.existingRequest) {
      notify.error('Ya tenés una solicitud pendiente. El equipo está procesándola.');
      setActiveDeletion({ exists: true });
    } else {
      notify.error(result.error ?? 'Error al enviar la solicitud.');
    }
    setDeletionLoading(false);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-3">

      {/* ── Cabecera ── */}
      <div className="mb-1">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-600" />
          Seguridad y Cuenta
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Gestioná tu privacidad, contraseña y configuraciones de acceso.
        </p>
      </div>

      {/* ═══ 1. PRIVACIDAD ═══ */}
      <Section
        icon={<Globe className="w-4 h-4" />}
        title="Privacidad de datos"
        subtitle="Controlá quién puede ver tu información de contacto"
        defaultOpen
      >
        {/* Badge plan */}
        {!hasPremiumFeatures && (
          <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              La privacidad de perfil es exclusiva de planes <strong>Premium</strong> y cuentas <strong>Empresa</strong>.{' '}
              <span className="underline cursor-pointer">Actualizá tu plan</span> para activarla.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {privacyMode === 'public' ? 'Perfil PÚBLICO' : 'Perfil PRIVADO'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {privacyMode === 'public'
                ? 'Tu información de contacto es visible para todos.'
                : 'Tu teléfono y email están ocultos en tu perfil público.'}
            </p>
          </div>

          {/* Toggle switch */}
          <button
            type="button"
            onClick={handlePrivacyToggle}
            disabled={privacySaving || !hasPremiumFeatures}
            aria-label="Cambiar modo de privacidad"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2
              ${!hasPremiumFeatures ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              ${privacyMode === 'private' ? 'bg-brand-600' : 'bg-gray-300'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                ${privacyMode === 'private' ? 'translate-x-6' : 'translate-x-1'}`}
            />
            {privacySaving && (
              <Loader2 className="absolute right-[-20px] w-3.5 h-3.5 text-brand-600 animate-spin" />
            )}
          </button>
        </div>

        {/* Etiqueta de estado */}
        <div className="mt-3 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold
            ${privacyMode === 'private'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-green-100 text-green-700'}`}>
            {privacyMode === 'private'
              ? <><EyeOffIcon className="w-3 h-3" /> PRIVADO</>
              : <><Globe className="w-3 h-3" /> PÚBLICO</>}
          </span>
          <span className="text-[11px] text-gray-400">
            {privacyMode === 'private'
              ? 'Solo vos podés ver tus datos de contacto.'
              : 'Cualquier visitante puede ver tu contacto.'}
          </span>
        </div>
      </Section>

      {/* ═══ 2. CONTRASEÑA ═══ */}
      <Section
        icon={<Lock className="w-4 h-4" />}
        title="Mi contraseña"
        subtitle="Actualizá tu contraseña de acceso"
      >
        {authProvider === 'oauth' ? (
          <div className="px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 flex items-start gap-2">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Tu cuenta está vinculada a un proveedor externo (Google u otro). No podés cambiar la contraseña desde aquí; administrala desde tu proveedor de acceso.
            </p>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <PasswordInput
              label="Nueva contraseña"
              value={pwForm.newPassword}
              onChange={v => setPwForm(f => ({ ...f, newPassword: v }))}
              placeholder="Mínimo 8 caracteres"
              disabled={pwLoading}
            />
            <PasswordInput
              label="Repetir nueva contraseña"
              value={pwForm.confirmPassword}
              onChange={v => setPwForm(f => ({ ...f, confirmPassword: v }))}
              placeholder="Repetí la nueva contraseña"
              disabled={pwLoading}
            />
            <p className="text-[11px] text-gray-400">
              Usá al menos 8 caracteres, mezclando letras y números.
            </p>
            <button
              type="submit"
              disabled={pwLoading || !pwForm.newPassword || !pwForm.confirmPassword}
              className="w-full sm:w-auto px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg
                hover:bg-brand-500 transition-colors flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Actualizar contraseña
            </button>
          </form>
        )}
      </Section>

      {/* ═══ 3. CAMBIO DE EMAIL ═══ */}
      <Section
        icon={<Mail className="w-4 h-4" />}
        title="Cambiar mi email"
        subtitle="Actualizá tu dirección de correo electrónico"
      >
        {emailSent ? (
          <div className="px-3 py-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">¡Revisá tu nuevo correo!</p>
              <p className="text-xs text-green-700 mt-0.5">
                Te enviamos un enlace de confirmación a <strong>{emailForm.newEmail}</strong>.
                El cambio se aplica una vez que confirmes desde ese correo.
              </p>
              <button
                type="button"
                onClick={() => { setEmailSent(false); setEmailForm({ newEmail: '', confirmEmail: '' }); }}
                className="mt-2 text-xs text-green-700 underline"
              >
                Cambiar a otro email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangeEmail} className="space-y-3">
            {/* Email actual (solo lectura) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email actual</label>
              <input
                type="email"
                value={profile?.email ?? ''}
                readOnly
                disabled
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nuevo email</label>
              <input
                type="email"
                value={emailForm.newEmail}
                onChange={e => setEmailForm(f => ({ ...f, newEmail: e.target.value }))}
                placeholder="nuevo@email.com"
                disabled={emailLoading}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-brand-600 focus:border-transparent disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Repetir nuevo email</label>
              <input
                type="email"
                value={emailForm.confirmEmail}
                onChange={e => setEmailForm(f => ({ ...f, confirmEmail: e.target.value }))}
                placeholder="Repetí el nuevo email"
                disabled={emailLoading}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-brand-600 focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-[11px] text-blue-700">
                <strong>¿Cómo funciona?</strong> Supabase te enviará un email de confirmación a la nueva dirección.
                El cambio se aplica solo cuando hacés clic en ese enlace. Tu email actual sigue activo hasta entonces.
              </p>
            </div>

            <button
              type="submit"
              disabled={emailLoading || !emailForm.newEmail || !emailForm.confirmEmail}
              className="w-full sm:w-auto px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg
                hover:bg-brand-500 transition-colors flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Confirmar cambio de email
            </button>
          </form>
        )}
      </Section>

      {/* ═══ 4. ELIMINAR CUENTA ═══ */}
      <Section
        icon={<Trash2 className="w-4 h-4" />}
        title="Eliminar mi cuenta"
        subtitle="Enviá una solicitud de baja al equipo de Rural24"
        danger
      >
        {activeDeletion.exists ? (
          <div className="px-3 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Solicitud enviada</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Ya tenés una solicitud de eliminación en proceso. El equipo la revisará y te contactará por email en los próximos días hábiles.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDeletionRequest} className="space-y-4">
            <div className="px-3 py-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs text-red-800">
                <strong>Importante:</strong> Esta acción envía una solicitud al equipo de Rural24.
                Tu cuenta <strong>no se elimina de inmediato</strong>. El equipo procesará la solicitud
                y te contactará antes de proceder.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                ¿Por qué querés eliminar tu cuenta?{' '}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deletionReason}
                onChange={e => setDeletionReason(e.target.value)}
                placeholder="Contanos el motivo para poder mejorar el servicio..."
                rows={4}
                maxLength={1000}
                disabled={deletionLoading}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none
                  disabled:opacity-50"
              />
              <p className="text-[11px] text-gray-400 mt-0.5 text-right">
                {deletionReason.length}/1000
              </p>
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deletionConfirm}
                onChange={e => setDeletionConfirm(e.target.checked)}
                disabled={deletionLoading}
                className="mt-0.5 accent-red-600"
              />
              <span className="text-xs text-gray-700">
                Entiendo que esta solicitud será revisada por el equipo y que mi cuenta
                <strong> no se elimina de forma automática ni inmediata</strong>.
              </span>
            </label>

            <button
              type="submit"
              disabled={
                deletionLoading ||
                !deletionConfirm ||
                deletionReason.trim().length < 10
              }
              className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg
                hover:bg-red-700 transition-colors flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletionLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Trash2 className="w-4 h-4" />}
              Enviar solicitud de eliminación
            </button>
          </form>
        )}
      </Section>
    </div>
  );
};

export default AccountSecurityPanel;

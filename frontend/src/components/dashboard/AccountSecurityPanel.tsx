/**
 * AccountSecurityPanel.tsx
 * Panel "Seguridad y Cuenta" del dashboard de usuario.
 *
 * Secciones:
 *  1. Cambiar contraseña
 *  2. Cambiar email
 *  3. Eliminar cuenta (solicitud al superadmin)
 *
 * Nota: Privacidad (público/privado) se gestiona en el Hero del ProfilePanel.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Lock, Mail, Trash2, Eye, EyeOff, Shield, AlertTriangle,
  ChevronDown, ChevronUp, Loader2, CheckCircle, XCircle,
} from 'lucide-react';
import { notify } from '../../utils/notifications';
import {
  changePassword,
  changeEmail,
  requestAccountDeletion,
  detectAuthProvider,
  getActiveDeletionRequest,
  verifyCurrentPassword,
} from '../../services/accountService';

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
    <div className={`bg-white rounded-xl border ${danger ? 'border-red-200' : 'border-gray-200'}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between p-4 text-left transition-colors rounded-xl
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
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className={`px-4 pb-5 border-t ${danger ? 'border-red-100' : 'border-gray-100'}`}>
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
};

// ─── Campo de contraseña con toggle visibilidad + estado de validación ────────

type PwStatus = 'idle' | 'checking' | 'valid' | 'invalid';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  status?: PwStatus;
  errorMessage?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, value, onChange, onBlur, placeholder, disabled, status = 'idle', errorMessage }, ref) => {
    const [visible, setVisible] = useState(false);
    const hasStatus = status !== 'idle';

    const statusIcon = hasStatus && (
      <span className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
        {status === 'checking' && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
        {status === 'valid'    && <CheckCircle className="w-4 h-4 text-success-600" />}
        {status === 'invalid'  && <XCircle className="w-4 h-4 text-error-600" />}
      </span>
    );

    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <div className="relative">
          <input
            ref={ref}
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={e => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3 py-2 text-sm border rounded-lg
              focus:ring-2 focus:ring-brand-600 focus:border-transparent
              disabled:bg-gray-50 disabled:text-gray-400
              ${hasStatus ? 'pr-16' : 'pr-10'}
              ${status === 'invalid' ? 'border-error-500' : 'border-gray-300'}`}
          />
          {statusIcon}
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errorMessage && (
          <p className="mt-1 text-xs text-error-600 flex items-center gap-1">
            <XCircle className="w-3 h-3 flex-shrink-0" />
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export const AccountSecurityPanel: React.FC = () => {
  const { profile } = useAuth();

  // ── 1. Contraseña ─────────────────────────────────────────────────────

  const [authProvider, setAuthProvider] = useState<'email' | 'oauth' | null>(null);
  const [currentPw, setCurrentPw] = useState('');
  const [currentPwState, setCurrentPwState] = useState<PwStatus>('idle');
  const [currentPwError, setCurrentPwError] = useState('');
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const newPwRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    detectAuthProvider().then(p => setAuthProvider(p));
  }, []);

  useEffect(() => {
    if (currentPwState === 'valid') newPwRef.current?.focus();
  }, [currentPwState]);

  const handleVerifyCurrentPassword = async () => {
    if (!currentPw || currentPwState === 'checking') return;
    if (!profile?.email) return;
    setCurrentPwState('checking');
    setCurrentPwError('');
    const result = await verifyCurrentPassword(profile.email, currentPw);
    if (result.success) {
      setCurrentPwState('valid');
    } else {
      setCurrentPwState('invalid');
      setCurrentPwError(result.error ?? 'Contraseña incorrecta.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPwState !== 'valid') return;
    setPwLoading(true);
    const result = await changePassword(pwForm);
    if (result.success) {
      notify.success('Contraseña actualizada correctamente.');
      setPwForm({ newPassword: '', confirmPassword: '' });
      setCurrentPw('');
      setCurrentPwState('idle');
      setCurrentPwError('');
    } else {
      notify.error(result.error ?? 'Error al cambiar la contraseña.');
    }
    setPwLoading(false);
  };

  // ── 2. Cambio de email ────────────────────────────────────────────────

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

  // ── 3. Eliminación de cuenta ──────────────────────────────────────────

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
    if (!deletionConfirm) { notify.error('Confirmá que querés enviar la solicitud.'); return; }
    setDeletionLoading(true);
    const result = await requestAccountDeletion({ reason: deletionReason });
    if (result.success) {
      notify.success('Solicitud enviada. El equipo la revisará en los próximos días hábiles.');
      setDeletionReason('');
      setDeletionConfirm(false);
      setActiveDeletion({ exists: true });
    } else if (result.existingRequest) {
      notify.error('Ya tenés una solicitud pendiente.');
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

      {/* Cabecera */}
      <div className="mb-1">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-600" />
          Seguridad y Cuenta
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Gestioná tu contraseña, email y configuraciones de acceso.
        </p>
      </div>

      {/* 1. CONTRASEÑA */}
      <Section
        icon={<Lock className="w-4 h-4" />}
        title="Mi contraseña"
        subtitle="Actualizá tu contraseña de acceso"
      >
        {authProvider === 'oauth' ? (
          <div className="px-3 py-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 flex items-start gap-2">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Tu cuenta está vinculada a un proveedor externo (Google u otro).
              Administrá la contraseña desde tu proveedor de acceso.
            </p>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-3">
            {/* Paso 1: Contraseña actual */}
            <PasswordInput
              label="Contraseña actual"
              value={currentPw}
              onChange={(v) => {
                setCurrentPw(v);
                if (currentPwState !== 'idle') { setCurrentPwState('idle'); setCurrentPwError(''); }
              }}
              onBlur={handleVerifyCurrentPassword}
              placeholder="Tu contraseña actual"
              disabled={pwLoading}
              status={currentPwState}
              errorMessage={currentPwError}
            />
            {/* Paso 2a: Nueva contraseña */}
            <PasswordInput
              ref={newPwRef}
              label="Nueva contraseña"
              value={pwForm.newPassword}
              onChange={v => setPwForm(f => ({ ...f, newPassword: v }))}
              placeholder="Mínimo 8 caracteres"
              disabled={pwLoading || currentPwState !== 'valid'}
            />
            {/* Paso 2b: Repetir nueva contraseña */}
            {(() => {
              const confirmPwStatus: PwStatus =
                pwForm.confirmPassword.length === 0 ? 'idle'
                : pwForm.newPassword === pwForm.confirmPassword && pwForm.newPassword.length >= 8 ? 'valid'
                : 'invalid';
              return (
                <PasswordInput
                  label="Repetir nueva contraseña"
                  value={pwForm.confirmPassword}
                  onChange={v => setPwForm(f => ({ ...f, confirmPassword: v }))}
                  placeholder="Repetí la nueva contraseña"
                  disabled={pwLoading || currentPwState !== 'valid'}
                  status={confirmPwStatus}
                />
              );
            })()}
            <p className="text-[11px] text-gray-400">Usá al menos 8 caracteres, mezclando letras y números.</p>
            {/* Paso 3: Submit */}
            <button
              type="submit"
              disabled={
                pwLoading ||
                currentPwState !== 'valid' ||
                pwForm.newPassword.length < 8 ||
                pwForm.newPassword !== pwForm.confirmPassword
              }
              className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg
                hover:bg-brand-500 transition-colors flex items-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Actualizar contraseña
            </button>
          </form>
        )}
      </Section>

      {/* 2. CAMBIO DE EMAIL */}
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
                Enviamos un enlace de confirmación a <strong>{emailForm.newEmail}</strong>.
                El cambio se aplica cuando confirmes desde ese correo.
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
                <strong>¿Cómo funciona?</strong> Recibirás un email de confirmación en la nueva dirección.
                El cambio se aplica solo cuando hacés clic en ese enlace.
              </p>
            </div>
            <button
              type="submit"
              disabled={emailLoading || !emailForm.newEmail || !emailForm.confirmEmail}
              className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg
                hover:bg-brand-500 transition-colors flex items-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Confirmar cambio de email
            </button>
          </form>
        )}
      </Section>

      {/* 3. ELIMINAR CUENTA */}
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
                Ya tenés una solicitud en proceso. El equipo la revisará y te contactará por email en los próximos días hábiles.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDeletionRequest} className="space-y-4">
            <div className="px-3 py-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs text-red-800">
                <strong>Importante:</strong> Esta acción envía una solicitud al equipo.
                Tu cuenta <strong>no se elimina de inmediato</strong>; el equipo te contactará antes de proceder.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                ¿Por qué querés eliminar tu cuenta? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={deletionReason}
                onChange={e => setDeletionReason(e.target.value)}
                placeholder="Contanos el motivo para poder mejorar el servicio..."
                rows={4}
                maxLength={1000}
                disabled={deletionLoading}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:opacity-50"
              />
              <p className="text-[11px] text-gray-400 mt-0.5 text-right">{deletionReason.length}/1000</p>
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
                Entiendo que esta solicitud será revisada y que mi cuenta
                <strong> no se elimina de forma automática ni inmediata</strong>.
              </span>
            </label>
            <button
              type="submit"
              disabled={deletionLoading || !deletionConfirm || deletionReason.trim().length < 10}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg
                hover:bg-red-700 transition-colors flex items-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Enviar solicitud de eliminación
            </button>
          </form>
        )}
      </Section>
    </div>
  );
};

export default AccountSecurityPanel;

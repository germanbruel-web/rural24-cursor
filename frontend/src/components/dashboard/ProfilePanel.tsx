/**
 * ProfilePanel.tsx
 * Panel de perfil unificado para todos los tipos de usuario
 * 
 * Lógica de features:
 * - Particular Free: Solo datos básicos, contacto por chat interno
 * - Particular Premium: Datos + perfil profesional + privacidad + métricas
 * - Empresa: Datos + perfil profesional + privacidad + métricas
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  BarChart3,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  Globe,
  Briefcase,
  Info,
  Lock
} from 'lucide-react';
import { notify } from '../../utils/notifications';
import { PROVINCES, LOCALITIES_BY_PROVINCE } from '../../constants/locations';
import { AvatarUpload } from '../common/AvatarUpload';
import { 
  updateProfile, 
  uploadAvatar, 
  deleteAvatar,
  getProfileMetrics,
  type ProfileMetrics 
} from '../../services/profileService';

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
  // Campos unificados (antes eran solo empresa)
  display_name: string;      // Nombre profesional o razón social
  bio: string;               // Descripción personal o de empresa
  services: string;          // Servicios que ofrece
  privacy_mode: 'public' | 'private';
}

type TabId = 'info' | 'privacy';

// Planes que tienen acceso a features premium
const PREMIUM_PLANS = ['premium', 'profesional', 'avanzado', 'business', 'enterprise'];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ProfilePanel: React.FC = () => {
  const { profile, updateProfile: updateAuthProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [metrics, setMetrics] = useState<ProfileMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  
  const isEmpresa = profile?.user_type === 'empresa';
  const isSuperAdmin = profile?.role === 'superadmin';
  
  // Determinar si tiene acceso a features premium
  const planName = (profile as any)?.plan_name?.toLowerCase() || '';
  const hasPremiumPlan = PREMIUM_PLANS.some(p => planName.includes(p));
  const hasPremiumFeatures = isEmpresa || hasPremiumPlan || isSuperAdmin;

  // Labels dinámicos según tipo de usuario
  const labels = {
    display_name: isEmpresa ? 'Razón Social' : 'Nombre Profesional',
    display_name_placeholder: isEmpresa 
      ? 'Ej: Agro Sur S.R.L.' 
      : 'Ej: Juan Pérez - Agrónomo',
    bio: isEmpresa ? 'Descripción de la Empresa' : 'Sobre mí',
    bio_placeholder: isEmpresa 
      ? 'Describe tu empresa, qué hacen, años de experiencia...'
      : 'Cuéntanos sobre ti, tu experiencia, qué ofreces...',
    services: 'Servicios que ofrezco',
    services_placeholder: 'Ej: Asesoramiento agrícola, Tasaciones, Venta de maquinaria...',
  };

  // Separar full_name en first_name y last_name
  const splitFullName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return { first_name: parts[0], last_name: '' };
    return {
      first_name: parts[0],
      last_name: parts.slice(1).join(' ')
    };
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

  // Sincronizar formData cuando profile cargue
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
    }
  }, [profile]);

  // Cargar métricas si tiene features premium
  useEffect(() => {
    if (hasPremiumFeatures && activeTab === 'privacy') {
      loadMetrics();
    }
  }, [hasPremiumFeatures, activeTab]);

  const loadMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const { data, error } = await getProfileMetrics();
      if (!error && data) {
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();
      
      const updateData: any = {
        full_name: fullName,
        phone: formData.phone,
        mobile: formData.mobile,
        province: formData.province,
        location: formData.location,
      };

      // Campos profesionales para todos (pero solo aplican si tiene features)
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

      // Actualizar contexto de auth
      await updateAuthProfile({ 
        full_name: fullName,
        phone: formData.phone,
        mobile: formData.mobile,
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
  };

  const handleAvatarUpload = async (file: File) => {
    const { url, error } = await uploadAvatar(file);
    if (error) {
      notify.error('Error al subir imagen: ' + error.message);
      return;
    }
    if (url) {
      notify.success('Imagen actualizada');
    }
  };

  const handleAvatarRemove = async () => {
    const { error } = await deleteAvatar();
    if (error) {
      notify.error('Error al eliminar imagen: ' + error.message);
      return;
    }
    notify.success('Imagen eliminada');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header con Avatar y Info Principal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar/Logo Upload */}
          <AvatarUpload
            currentUrl={(profile as any)?.avatar_url}
            onUpload={handleAvatarUpload}
            onRemove={handleAvatarRemove}
            size="lg"
            type={isEmpresa ? 'company' : 'personal'}
            disabled={false}
          />

          {/* Info Principal */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900">
              {(profile as any)?.display_name || profile?.full_name || profile?.email?.split('@')[0] || 'Usuario'}
            </h1>
            <p className="text-gray-600">{profile?.email}</p>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
              {isSuperAdmin && (
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold rounded-full">
                  SuperAdmin
                </span>
              )}
              {(profile as any)?.plan_name && (
                <span className="px-3 py-1 bg-brand-500 text-white text-xs font-bold rounded-full">
                  {(profile as any).plan_name}
                </span>
              )}
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                {isEmpresa ? '🏢 Empresa' : '👤 Particular'}
              </span>
              {profile?.email_verified && (
                <span className="px-3 py-1 bg-brand-100 text-brand-600 text-xs font-semibold rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verificado
                </span>
              )}
              {hasPremiumFeatures && !isEmpresa && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                  ⭐ Premium
                </span>
              )}
            </div>

            {/* Info adicional */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 justify-center md:justify-start">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Miembro desde {new Date(profile?.created_at || '').toLocaleDateString('es-AR')}
              </span>
              {profile?.location && profile?.province && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.location}, {profile.province}
                </span>
              )}
            </div>
          </div>

          {/* Botón Editar */}
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Tabs (solo si tiene features premium) */}
      {hasPremiumFeatures ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'info'
                  ? 'text-brand-500 border-b-2 border-brand-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Información
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'privacy'
                  ? 'text-brand-500 border-b-2 border-brand-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              Privacidad y Métricas
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'info' ? (
              <InfoTab 
                formData={formData}
                setFormData={setFormData}
                isEditing={isEditing}
                hasPremiumFeatures={hasPremiumFeatures}
                labels={labels}
                saving={saving}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ) : (
              <PrivacyTab
                formData={formData}
                setFormData={setFormData}
                isEditing={isEditing}
                metrics={metrics}
                loadingMetrics={loadingMetrics}
                saving={saving}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            )}
          </div>
        </div>
      ) : (
        /* Sin tabs para usuarios free sin features premium */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <InfoTab 
            formData={formData}
            setFormData={setFormData}
            isEditing={isEditing}
            hasPremiumFeatures={false}
            labels={labels}
            saving={saving}
            onSave={handleSave}
            onCancel={handleCancel}
          />
          
          {/* Banner de upgrade para particulares free */}
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800">
                  ¿Querés destacar tu perfil profesional?
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  Con un plan Premium podés agregar descripción, servicios, y recibir 
                  contactos directos con métricas de conversión.
                </p>
                <button className="mt-3 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors">
                  Ver planes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TAB: INFORMACIÓN
// ============================================================================

interface InfoTabProps {
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  isEditing: boolean;
  hasPremiumFeatures: boolean;
  labels: {
    display_name: string;
    display_name_placeholder: string;
    bio: string;
    bio_placeholder: string;
    services: string;
    services_placeholder: string;
  };
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

const InfoTab: React.FC<InfoTabProps> = ({
  formData,
  setFormData,
  isEditing,
  hasPremiumFeatures,
  labels,
  saving,
  onSave,
  onCancel
}) => {
  return (
    <div className="space-y-6">
      {/* Botones de acción */}
      {isEditing && (
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      )}

      {/* Datos Personales */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-500" />
          Datos Personales
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            label="Nombre"
            value={formData.first_name}
            onChange={(v) => setFormData({ ...formData, first_name: v })}
            isEditing={isEditing}
            placeholder="Juan"
            icon={<User className="w-4 h-4" />}
          />
          <FormField
            label="Apellido"
            value={formData.last_name}
            onChange={(v) => setFormData({ ...formData, last_name: v })}
            isEditing={isEditing}
            placeholder="Pérez"
            icon={<User className="w-4 h-4" />}
          />
          <FormField
            label="Email"
            value={formData.email}
            isEditing={false}
            disabled
            icon={<Mail className="w-4 h-4" />}
            hint="No editable"
          />
        </div>
      </div>

      {/* Perfil Profesional (solo premium) */}
      {hasPremiumFeatures && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-500" />
            Perfil Profesional
            <span className="text-xs font-normal text-gray-500 ml-2">(opcional)</span>
          </h3>
          
          <div className="space-y-4">
            <FormField
              label={labels.display_name}
              value={formData.display_name}
              onChange={(v) => setFormData({ ...formData, display_name: v })}
              isEditing={isEditing}
              placeholder={labels.display_name_placeholder}
              icon={<Briefcase className="w-4 h-4" />}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Info className="w-4 h-4 inline mr-1" />
                {labels.bio}
              </label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder={labels.bio_placeholder}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 min-h-[100px]">
                  {formData.bio || <span className="text-gray-400 italic">Sin descripción</span>}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4 inline mr-1" />
                {labels.services}
              </label>
              {isEditing ? (
                <textarea
                  value={formData.services}
                  onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                  placeholder={labels.services_placeholder}
                  rows={3}
                  maxLength={300}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                  {formData.services || <span className="text-gray-400 italic">Sin servicios especificados</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contacto */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-brand-500" />
          Información de Contacto
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            label="Celular"
            value={formData.mobile}
            onChange={(v) => setFormData({ ...formData, mobile: v })}
            isEditing={isEditing}
            placeholder="+54 9 11 1234-5678"
            icon={<span>📱</span>}
            type="tel"
          />
          <FormField
            label="Teléfono Fijo"
            value={formData.phone}
            onChange={(v) => setFormData({ ...formData, phone: v })}
            isEditing={isEditing}
            placeholder="011 1234-5678"
            icon={<Phone className="w-4 h-4" />}
            type="tel"
          />
        </div>
      </div>

      {/* Ubicación */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-brand-500" />
          Ubicación
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Provincia
            </label>
            {isEditing ? (
              <select
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value, location: '' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">Seleccionar provincia</option>
                {PROVINCES.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            ) : (
              <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                {formData.province || <span className="text-gray-400">Sin especificar</span>}
              </div>
            )}
          </div>

          {formData.province && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Localidad
              </label>
              {isEditing ? (
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Seleccionar localidad</option>
                  {LOCALITIES_BY_PROVINCE[formData.province]?.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {formData.location || <span className="text-gray-400">Sin especificar</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TAB: PRIVACIDAD Y MÉTRICAS
// ============================================================================

interface PrivacyTabProps {
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  isEditing: boolean;
  metrics: ProfileMetrics | null;
  loadingMetrics: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

const PrivacyTab: React.FC<PrivacyTabProps> = ({
  formData,
  setFormData,
  isEditing,
  metrics,
  loadingMetrics,
  saving,
  onSave,
  onCancel
}) => {
  return (
    <div className="space-y-6">
      {/* Botones de acción */}
      {isEditing && (
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      )}

      {/* Configuración de Privacidad */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          {formData.privacy_mode === 'public' ? (
            <Eye className="w-5 h-5 text-brand-500" />
          ) : (
            <EyeOff className="w-5 h-5 text-amber-500" />
          )}
          Configuración de Privacidad
        </h3>

        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="font-medium text-gray-900 mb-2">Visibilidad del Perfil</p>
              <p className="text-sm text-gray-600 mb-4">
                Define cómo se muestran tus datos de contacto en los avisos y en tu perfil público.
              </p>

              {isEditing ? (
                <div className="space-y-3">
                  <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.privacy_mode === 'public' 
                      ? 'border-brand-500 bg-brand-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="privacy_mode"
                      value="public"
                      checked={formData.privacy_mode === 'public'}
                      onChange={() => setFormData({ ...formData, privacy_mode: 'public' })}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-brand-500" />
                        <span className="font-medium text-gray-900">Público</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Tus datos de contacto (teléfono, celular, email) se muestran públicamente. 
                        Cualquier persona puede contactarte directamente.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.privacy_mode === 'private' 
                      ? 'border-amber-500 bg-amber-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="privacy_mode"
                      value="private"
                      checked={formData.privacy_mode === 'private'}
                      onChange={() => setFormData({ ...formData, privacy_mode: 'private' })}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-amber-500" />
                        <span className="font-medium text-gray-900">Privado</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Tus datos de contacto están ocultos. Los interesados deberán completar 
                        un formulario de contacto con sus datos (nombre, teléfono, email, consulta).
                      </p>
                      <p className="text-xs text-amber-600 mt-2">
                        ✨ Ideal para filtrar consultas y obtener métricas de conversión.
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className={`p-4 rounded-lg border-2 ${
                  formData.privacy_mode === 'public' 
                    ? 'border-brand-500 bg-brand-50' 
                    : 'border-amber-500 bg-amber-50'
                }`}>
                  <div className="flex items-center gap-2">
                    {formData.privacy_mode === 'public' ? (
                      <>
                        <Globe className="w-5 h-5 text-brand-500" />
                        <span className="font-medium text-gray-900">Perfil Público</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-5 h-5 text-amber-500" />
                        <span className="font-medium text-gray-900">Perfil Privado</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {formData.privacy_mode === 'public' 
                      ? 'Tus datos de contacto son visibles públicamente.'
                      : 'Los interesados deben completar un formulario para contactarte.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-500" />
          Métricas de tu Perfil
        </h3>

        {loadingMetrics ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando métricas...</p>
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<Eye className="w-6 h-6" />}
              label="Vistas de Perfil"
              value={metrics.profile_views}
              subtitle={`${metrics.views_last_7_days} últimos 7 días`}
              color="blue"
            />
            <MetricCard
              icon={<MessageSquare className="w-6 h-6" />}
              label="Contactos Recibidos"
              value={metrics.profile_contacts_received}
              subtitle={`${metrics.contacts_last_7_days} últimos 7 días`}
              color="green"
            />
            <MetricCard
              icon={<TrendingUp className="w-6 h-6" />}
              label="Tasa de Conversión"
              value={`${metrics.conversion_rate}%`}
              subtitle="Vistas → Contactos"
              color="purple"
            />
            <MetricCard
              icon={<MessageSquare className="w-6 h-6" />}
              label="Sin Leer"
              value={metrics.unread_contacts}
              subtitle="Contactos pendientes"
              color="amber"
            />
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Las métricas estarán disponibles cuando recibas visitas</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

interface FormFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  isEditing: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
  disabled?: boolean;
  hint?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  isEditing,
  placeholder,
  icon,
  type = 'text',
  disabled,
  hint
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {icon && <span className="inline mr-1">{icon}</span>}
      {label}
    </label>
    {isEditing && !disabled ? (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />
    ) : (
      <div className={`px-4 py-2 rounded-lg ${disabled ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-900'}`}>
        {value || <span className="text-gray-400">Sin especificar</span>}
        {hint && <span className="text-xs text-gray-500 ml-2">({hint})</span>}
      </div>
    )}
  </div>
);

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, subtitle, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-brand-50 text-brand-500',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
    </div>
  );
};

export default ProfilePanel;

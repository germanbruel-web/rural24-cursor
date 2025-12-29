import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar,
  Edit,
  Save,
  X,
  Shield,
  Award,
  CheckCircle
} from 'lucide-react';
import { notify } from '../../utils/notifications';
import { PROVINCES, LOCALITIES_BY_PROVINCE } from '../../constants/locations';

interface ProfileFormData {
  full_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  province?: string;
  location?: string;
  company_name?: string;
  company_cuit?: string;
  company_address?: string;
  company_website?: string;
  bio?: string;
}

export const ProfilePanel: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: profile?.full_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    mobile: profile?.mobile || '',
    province: '',
    location: '',
    company_name: '',
    company_cuit: '',
    company_address: '',
    company_website: '',
    bio: '',
  });
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const isPremiumEmpresa = profile?.role === 'premium' && profile?.user_type === 'empresa';
  const isPremium = profile?.role === 'premium';
  const isSuperAdmin = profile?.role === 'superadmin';

  // Sincronizar formData cuando profile cargue
  useEffect(() => {
    if (profile) {
      console.log('📋 Cargando datos del perfil en formulario:', profile);
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        mobile: profile.mobile || '',
        province: profile.province || '',
        location: profile.location || '',
        company_name: '',
        company_cuit: '',
        company_address: '',
        company_website: '',
        bio: '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone,
        mobile: formData.mobile,
        province: formData.province,
        location: formData.location,
      });

      if (error) {
        notify.error('Error al actualizar perfil: ' + error.message);
        return;
      }

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
    // Reset form
    setFormData({
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      mobile: profile?.mobile || '',
      province: profile?.province || '',
      location: profile?.location || '',
      company_name: '',
      company_cuit: '',
      company_address: '',
      company_website: '',
      bio: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-1">Gestiona tu información personal</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#0e7d25] transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar Perfil
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            {/* Avatar */}
            <div className="text-center mb-6">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-[#16a135] to-[#0e7d25] rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4">
                {profile?.full_name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{profile?.full_name || 'Sin nombre'}</h2>
              <p className="text-sm text-gray-600 mb-3">{profile?.email}</p>
              
              {/* Role Badges */}
              <div className="flex flex-wrap gap-2 justify-center">
                {isSuperAdmin && (
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    SuperAdmin
                  </span>
                )}
                {isPremium && (
                  <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 text-xs font-bold rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Premium
                  </span>
                )}
                {profile?.email_verified && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verificado
                  </span>
                )}
                {profile?.user_type && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    {profile.user_type === 'empresa' ? '🏢 Empresa' : '👤 Particular'}
                  </span>
                )}
              </div>
            </div>

            {/* Account Info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Miembro desde {new Date(profile?.created_at || '').toLocaleDateString('es-AR')}</span>
              </div>
              {profile?.subscription_status === 'active' && (
                <div className="flex items-center gap-3 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Suscripción activa</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2">
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Cambiar Contraseña
              </button>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                Configuración de Privacidad
              </button>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Información Personal</h3>
              {isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#0e7d25] transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nombre Completo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                    {profile?.full_name || 'Sin especificar'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600">
                  {profile?.email}
                  <span className="text-xs text-gray-500 ml-2">(No editable)</span>
                </div>
              </div>

              {/* Teléfonos de contacto */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📱 Celular
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="+54 9 11 1234-5678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                      {formData.mobile || 'Sin especificar'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Teléfono Fijo
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="011 1234-5678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                      {formData.phone || 'Sin especificar'}
                    </div>
                  )}
                </div>

                {/* Mostrar ambos en vista de solo lectura si ambos existen */}
                {!isEditing && formData.mobile && formData.phone && (
                  <div className="text-xs text-gray-500 italic">
                    📱 {formData.mobile} | 📞 {formData.phone}
                  </div>
                )}
              </div>

              {/* Ubicación - Selectores de Provincia y Localidad */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Provincia
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.province}
                      onChange={(e) => {
                        setFormData({ ...formData, province: e.target.value, location: '' });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                    >
                      <option value="">Seleccionar provincia</option>
                      {PROVINCES.map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                      {formData.province || 'Sin especificar'}
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                      >
                        <option value="">Seleccionar localidad</option>
                        {LOCALITIES_BY_PROVINCE[formData.province]?.map(loc => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                        {formData.location || 'Sin especificar'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biografía
              </label>
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  placeholder="Cuéntanos sobre ti..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900 min-h-[100px]">
                  {formData.bio || 'Sin biografía'}
                </div>
              )}
            </div>
          </div>

          {/* Company Information (Solo para Premium Empresa) */}
          {isPremiumEmpresa && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Building className="w-6 h-6 text-[#16a135]" />
                Información de Empresa
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razón Social
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Mi Empresa S.A."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                      {formData.company_name || 'Sin especificar'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CUIT
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.company_cuit}
                      onChange={(e) => setFormData({ ...formData, company_cuit: e.target.value })}
                      placeholder="20-12345678-9"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                      {formData.company_cuit || 'Sin especificar'}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.company_address}
                      onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                      placeholder="Calle 123, Ciudad, Provincia"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                      {formData.company_address || 'Sin especificar'}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sitio Web
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.company_website}
                      onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                      placeholder="https://www.miempresa.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">
                      {formData.company_website ? (
                        <a href={formData.company_website} target="_blank" rel="noopener noreferrer" className="text-[#16a135] hover:underline">
                          {formData.company_website}
                        </a>
                      ) : (
                        'Sin especificar'
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#16a135]" />
              Seguridad
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Contraseña</div>
                  <div className="text-sm text-gray-600">Última actualización: hace 30 días</div>
                </div>
                <button className="px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#0e7d25] transition-colors text-sm font-medium">
                  Cambiar
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Verificación de Email</div>
                  <div className="text-sm text-gray-600">
                    {profile?.email_verified ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Email verificado
                      </span>
                    ) : (
                      <span className="text-yellow-600">Email no verificado</span>
                    )}
                  </div>
                </div>
                {!profile?.email_verified && (
                  <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium">
                    Verificar
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Autenticación de Dos Factores</div>
                  <div className="text-sm text-gray-600">No activada</div>
                </div>
                <button className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium">
                  Activar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

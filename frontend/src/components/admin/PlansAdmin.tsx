/**
 * PlansAdmin
 * CRUD de planes de suscripción para SuperAdmin
 * Lee/escribe en tabla subscription_plans
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Plus, Edit2, Eye, EyeOff, Save, X, RefreshCw, 
  Gift, Zap, Sparkles, Building2, Users, AlertCircle, Check,
  ExternalLink, Trash2, GripVertical
} from 'lucide-react';
import {
  getAllPlansAdmin,
  updatePlan,
  createPlan,
  deactivatePlan,
  reactivatePlan,
  deletePlan,
  countUsersByPlan,
  formatPrice,
  type SubscriptionPlan,
  type PlanCreateInput,
} from '../../services/subscriptionService';

// Iconos disponibles para planes
const PLAN_ICONS: Record<string, React.ReactNode> = {
  gift: <Gift className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
  building2: <Building2 className="w-5 h-5" />,
};

const ICON_OPTIONS = [
  { value: 'gift', label: 'Regalo (Free)' },
  { value: 'zap', label: 'Rayo (Starter)' },
  { value: 'sparkles', label: 'Estrellas (Pro)' },
  { value: 'building2', label: 'Edificio (Empresa)' },
];

const COLOR_OPTIONS = [
  { value: 'gray', label: 'Gris', bg: 'bg-gray-500' },
  { value: 'blue', label: 'Azul', bg: 'bg-blue-500' },
  { value: 'green', label: 'Verde', bg: 'bg-green-500' },
  { value: 'purple', label: 'Violeta', bg: 'bg-purple-500' },
  { value: 'gold', label: 'Dorado', bg: 'bg-yellow-500' },
  { value: 'red', label: 'Rojo', bg: 'bg-red-500' },
];

interface PlanWithStats extends SubscriptionPlan {
  userCount?: number;
}

interface EditingPlan {
  id?: string;
  name: string;
  display_name: string;
  description: string;
  max_ads: number | null;
  max_contacts_per_month: number | null;
  max_featured_ads: number;
  has_public_profile: boolean;
  has_catalog: boolean;
  has_analytics: boolean;
  price_monthly: number;
  price_yearly: number;
  is_active: boolean;
  sort_order: number;
  badge_color: string;
  features: string[];
  icon_name: string;
  badge_text: string;
  is_featured: boolean;
}

const emptyPlan: EditingPlan = {
  name: '',
  display_name: '',
  description: '',
  max_ads: 1,
  max_contacts_per_month: 5,
  max_featured_ads: 0,
  has_public_profile: false,
  has_catalog: false,
  has_analytics: true,
  price_monthly: 0,
  price_yearly: 0,
  is_active: true,
  sort_order: 99,
  badge_color: 'gray',
  features: [],
  icon_name: 'gift',
  badge_text: '',
  is_featured: false,
};

export default function PlansAdmin() {
  const [plans, setPlans] = useState<PlanWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<EditingPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar planes
  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await getAllPlansAdmin();
      
      // Cargar conteo de usuarios por plan
      const plansWithStats = await Promise.all(
        data.map(async (plan) => {
          const userCount = await countUsersByPlan(plan.id);
          return { ...plan, userCount };
        })
      );
      
      setPlans(plansWithStats);
    } catch (err) {
      setError('Error cargando planes');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // Abrir modal de edición
  const handleEdit = (plan: PlanWithStats) => {
    setEditingPlan({
      id: plan.id,
      name: plan.name,
      display_name: plan.display_name,
      description: plan.description || '',
      max_ads: plan.max_ads,
      max_contacts_per_month: plan.max_contacts_per_month,
      max_featured_ads: plan.max_featured_ads || 0,
      has_public_profile: plan.has_public_profile || false,
      has_catalog: plan.has_catalog || false,
      has_analytics: plan.has_analytics !== false,
      price_monthly: plan.price_monthly || 0,
      price_yearly: plan.price_yearly || 0,
      is_active: plan.is_active,
      sort_order: plan.sort_order || 1,
      badge_color: plan.badge_color || 'gray',
      features: Array.isArray(plan.features) ? plan.features : [],
      icon_name: plan.icon_name || 'gift',
      badge_text: plan.badge_text || '',
      is_featured: plan.is_featured || false,
    });
    setIsCreating(false);
  };

  // Abrir modal de creación
  const handleCreate = () => {
    setEditingPlan({ ...emptyPlan });
    setIsCreating(true);
  };

  // Guardar plan
  const handleSave = async () => {
    if (!editingPlan) return;
    
    // Validaciones
    if (!editingPlan.name.trim()) {
      setError('El nombre interno es requerido');
      return;
    }
    if (!editingPlan.display_name.trim()) {
      setError('El nombre a mostrar es requerido');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isCreating) {
        const result = await createPlan(editingPlan as PlanCreateInput);
        if (!result.success) {
          setError(result.error || 'Error creando plan');
          setSaving(false);
          return;
        }
        setSuccess('Plan creado exitosamente');
      } else {
        const result = await updatePlan({
          id: editingPlan.id!,
          ...editingPlan,
        });
        if (!result.success) {
          setError(result.error || 'Error actualizando plan');
          setSaving(false);
          return;
        }
        setSuccess('Plan actualizado exitosamente');
      }

      setEditingPlan(null);
      loadPlans();
    } catch (err: any) {
      setError(err.message);
    }
    
    setSaving(false);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Toggle activo/inactivo
  const handleToggleActive = async (plan: PlanWithStats) => {
    const action = plan.is_active ? deactivatePlan : reactivatePlan;
    const result = await action(plan.id);
    
    if (result.success) {
      setSuccess(`Plan ${plan.is_active ? 'desactivado' : 'activado'}`);
      loadPlans();
    } else {
      setError(result.error || 'Error cambiando estado');
    }
    
    setTimeout(() => setSuccess(null), 3000);
  };

  // Eliminar plan permanentemente
  const handleDelete = async (plan: PlanWithStats) => {
    // Confirmar eliminación
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar el plan "${plan.display_name}"?\n\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmed) return;

    const result = await deletePlan(plan.id);
    
    if (result.success) {
      setSuccess('Plan eliminado correctamente');
      loadPlans();
    } else {
      setError(result.error || 'Error eliminando plan');
    }
    
    setTimeout(() => setSuccess(null), 3000);
  };

  // Agregar feature
  const handleAddFeature = () => {
    if (!newFeature.trim() || !editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, newFeature.trim()],
    });
    setNewFeature('');
  };

  // Remover feature
  const handleRemoveFeature = (index: number) => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== index),
    });
  };

  // Formatear límite
  const formatLimit = (value: number | null): string => {
    if (value === null) return 'Ilimitado';
    return value.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-green-600" />
            Planes de Suscripción
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Configura precios, límites y features de cada plan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open('#/pricing', '_blank')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver Pricing
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Plan
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Plans List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Avisos
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Contactos/mes
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Destacados
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <Users className="w-4 h-4 inline" />
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plans.map((plan) => (
              <tr key={plan.id} className={`hover:bg-gray-50 ${!plan.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.badge_color === 'gold' ? 'bg-yellow-100 text-yellow-600' :
                      plan.badge_color === 'purple' ? 'bg-purple-100 text-purple-600' :
                      plan.badge_color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      plan.badge_color === 'green' ? 'bg-green-100 text-green-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {PLAN_ICONS[plan.icon_name || 'gift'] || PLAN_ICONS.gift}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {plan.display_name}
                        {plan.is_featured && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{plan.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="font-semibold text-gray-900">
                    {plan.price_monthly === 0 ? 'Gratis' : formatPrice(plan.price_monthly)}
                  </div>
                  {plan.price_yearly > 0 && (
                    <div className="text-xs text-gray-500">
                      {formatPrice(plan.price_yearly)}/año
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={plan.max_ads === null ? 'text-green-600 font-semibold' : ''}>
                    {formatLimit(plan.max_ads)}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={plan.max_contacts_per_month === null ? 'text-green-600 font-semibold' : ''}>
                    {formatLimit(plan.max_contacts_per_month)}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  {plan.max_featured_ads || 0}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-gray-600">{plan.userCount || 0}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={() => handleToggleActive(plan)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      plan.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {plan.is_active ? (
                      <>
                        <Eye className="w-3 h-3" />
                        Activo
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Inactivo
                      </>
                    )}
                  </button>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Editar plan"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(plan)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title={plan.userCount && plan.userCount > 0 
                        ? `No se puede eliminar: ${plan.userCount} usuarios` 
                        : 'Eliminar plan'}
                      disabled={plan.userCount !== undefined && plan.userCount > 0}
                    >
                      <Trash2 className={`w-4 h-4 ${
                        plan.userCount && plan.userCount > 0 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-red-500'
                      }`} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {isCreating ? 'Crear Nuevo Plan' : `Editar: ${editingPlan.display_name}`}
              </h3>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Información Básica */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs">1</span>
                  Información Básica
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre interno *
                    </label>
                    <input
                      type="text"
                      value={editingPlan.name}
                      onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="ej: pro_plus"
                      disabled={!isCreating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre a mostrar *
                    </label>
                    <input
                      type="text"
                      value={editingPlan.display_name}
                      onChange={(e) => setEditingPlan({ ...editingPlan, display_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="ej: Pro Plus"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={editingPlan.description}
                    onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="ej: Ideal para vendedores profesionales"
                  />
                </div>
              </div>

              {/* Precios */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs">2</span>
                  Precios (ARS)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Mensual
                    </label>
                    <input
                      type="number"
                      value={editingPlan.price_monthly}
                      onChange={(e) => setEditingPlan({ ...editingPlan, price_monthly: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Anual
                    </label>
                    <input
                      type="number"
                      value={editingPlan.price_yearly}
                      onChange={(e) => setEditingPlan({ ...editingPlan, price_yearly: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Límites */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs">3</span>
                  Límites
                  <span className="text-xs font-normal text-gray-500">(vacío = ilimitado)</span>
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Máx. Avisos
                    </label>
                    <input
                      type="number"
                      value={editingPlan.max_ads ?? ''}
                      onChange={(e) => setEditingPlan({ 
                        ...editingPlan, 
                        max_ads: e.target.value === '' ? null : parseInt(e.target.value) 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                      placeholder="∞"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contactos/Mes
                    </label>
                    <input
                      type="number"
                      value={editingPlan.max_contacts_per_month ?? ''}
                      onChange={(e) => setEditingPlan({ 
                        ...editingPlan, 
                        max_contacts_per_month: e.target.value === '' ? null : parseInt(e.target.value) 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                      placeholder="∞"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Máx. Destacados
                    </label>
                    <input
                      type="number"
                      value={editingPlan.max_featured_ads}
                      onChange={(e) => setEditingPlan({ ...editingPlan, max_featured_ads: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Permisos */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs">4</span>
                  Permisos
                </h4>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan.has_public_profile}
                      onChange={(e) => setEditingPlan({ ...editingPlan, has_public_profile: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Perfil Público</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan.has_catalog}
                      onChange={(e) => setEditingPlan({ ...editingPlan, has_catalog: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Catálogo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan.has_analytics}
                      onChange={(e) => setEditingPlan({ ...editingPlan, has_analytics: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Analytics</span>
                  </label>
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs">5</span>
                  Features (para /pricing)
                </h4>
                <div className="space-y-2">
                  {editingPlan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="flex-1 text-sm text-gray-700">{feature}</span>
                      <button
                        onClick={() => handleRemoveFeature(idx)}
                        className="p-1 hover:bg-red-50 rounded text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddFeature()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Agregar feature..."
                    />
                    <button
                      onClick={handleAddFeature}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Visual */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs">6</span>
                  Apariencia
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icono
                    </label>
                    <select
                      value={editingPlan.icon_name}
                      onChange={(e) => setEditingPlan({ ...editingPlan, icon_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <select
                      value={editingPlan.badge_color}
                      onChange={(e) => setEditingPlan({ ...editingPlan, badge_color: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {COLOR_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orden
                    </label>
                    <input
                      type="number"
                      value={editingPlan.sort_order}
                      onChange={(e) => setEditingPlan({ ...editingPlan, sort_order: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPlan.is_featured}
                      onChange={(e) => setEditingPlan({ ...editingPlan, is_featured: e.target.checked })}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Plan destacado (borde verde en /pricing)</span>
                  </label>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Badge (ej: "Popular", "Más vendido")
                  </label>
                  <input
                    type="text"
                    value={editingPlan.badge_text}
                    onChange={(e) => setEditingPlan({ ...editingPlan, badge_text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="ej: Más Popular"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isCreating ? 'Crear Plan' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

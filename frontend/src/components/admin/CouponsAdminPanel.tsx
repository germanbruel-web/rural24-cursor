/**
 * CouponsAdminPanel - CRUD completo de cupones
 * 
 * Funcionalidades:
 * - Listar cupones con filtros (activos/expirados/todos)
 * - Crear nuevo cupón
 * - Editar cupón existente
 * - Activar/desactivar cupón
 * - Eliminar cupón
 * - Ver canjes (redemptions)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Copy,
  RefreshCw,
  X,
  Gift,
  Users,
  Calendar,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { notify } from '../../utils/notifications';
import { useAuth } from '../../contexts';

// ============================================================
// TYPES
// ============================================================

interface Coupon {
  id: string;
  code: string;
  name: string;
  title: string;
  description: string | null;
  credits_amount: number;
  max_redemptions: number;
  current_redemptions: number;
  expires_at: string;
  is_active: boolean;
  gives_credits: boolean;
  gives_membership: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface CouponForm {
  code: string;
  name: string;
  title: string;
  description: string;
  credits_amount: number;
  max_redemptions: number;
  expires_at: string;
  is_active: boolean;
}

interface Redemption {
  id: string;
  coupon_id: string;
  user_id: string;
  credits_granted: number;
  redeemed_at: string;
  user_email?: string;
  user_name?: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const RECORDS_PER_PAGE = 10;

const EMPTY_FORM: CouponForm = {
  code: '',
  name: '',
  title: '',
  description: '',
  credits_amount: 1,
  max_redemptions: 100,
  expires_at: '',
  is_active: true,
};

// ============================================================
// COMPONENT
// ============================================================

export default function CouponsAdminPanel() {
  const { profile } = useAuth();

  // Listado
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'inactive'>('all');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal crear/editar
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Modal canjes
  const [showRedemptions, setShowRedemptions] = useState(false);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redemptionCoupon, setRedemptionCoupon] = useState<Coupon | null>(null);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);

  // ============================================================
  // LOAD COUPONS
  // ============================================================

  const loadCoupons = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      
      // Count
      let countQuery = supabase
        .from('coupons')
        .select('id', { count: 'exact', head: true });

      if (filter === 'active') {
        countQuery = countQuery.eq('is_active', true).gt('expires_at', now);
      } else if (filter === 'expired') {
        countQuery = countQuery.lt('expires_at', now);
      } else if (filter === 'inactive') {
        countQuery = countQuery.eq('is_active', false);
      }

      if (searchText.trim()) {
        countQuery = countQuery.or(`code.ilike.%${searchText}%,name.ilike.%${searchText}%`);
      }

      const { count } = await countQuery;
      setTotalRecords(count || 0);

      // Fetch
      const from = (page - 1) * RECORDS_PER_PAGE;
      const to = from + RECORDS_PER_PAGE - 1;

      let query = supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (filter === 'active') {
        query = query.eq('is_active', true).gt('expires_at', now);
      } else if (filter === 'expired') {
        query = query.lt('expires_at', now);
      } else if (filter === 'inactive') {
        query = query.eq('is_active', false);
      }

      if (searchText.trim()) {
        query = query.or(`code.ilike.%${searchText}%,name.ilike.%${searchText}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setCoupons(data || []);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading coupons:', err);
      notify.error('Error al cargar cupones');
    }
    setLoading(false);
  }, [filter, searchText]);

  useEffect(() => {
    loadCoupons(1);
  }, [loadCoupons]);

  // ============================================================
  // CREATE / EDIT
  // ============================================================

  const openCreateModal = () => {
    setEditingCoupon(null);
    // Default: expira en 30 días
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    setForm({
      ...EMPTY_FORM,
      expires_at: defaultExpiry.toISOString().slice(0, 16),
    });
    setShowModal(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      name: coupon.name,
      title: coupon.title,
      description: coupon.description || '',
      credits_amount: coupon.credits_amount,
      max_redemptions: coupon.max_redemptions,
      expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : '',
      is_active: coupon.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      notify.warning('Ingresa un código');
      return;
    }
    if (!form.name.trim()) {
      notify.warning('Ingresa un nombre');
      return;
    }
    if (!form.expires_at) {
      notify.warning('Selecciona fecha de expiración');
      return;
    }
    if (form.credits_amount < 1) {
      notify.warning('Los créditos deben ser al menos 1');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        name: form.name.trim(),
        title: form.title.trim() || form.name.trim(),
        description: form.description.trim() || null,
        credits_amount: form.credits_amount,
        max_redemptions: form.max_redemptions,
        expires_at: new Date(form.expires_at).toISOString(),
        is_active: form.is_active,
        gives_credits: true,
        gives_membership: false,
        updated_at: new Date().toISOString(),
      };

      if (editingCoupon) {
        // UPDATE
        const { error } = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', editingCoupon.id);
        if (error) throw error;
        notify.success('Cupón actualizado');
      } else {
        // CREATE
        const { error } = await supabase
          .from('coupons')
          .insert({
            ...payload,
            created_by: profile?.id || '',
          });
        if (error) {
          if (error.code === '23505') {
            notify.error('Ya existe un cupón con ese código');
          } else {
            throw error;
          }
          setSaving(false);
          return;
        }
        notify.success('Cupón creado');
      }

      setShowModal(false);
      loadCoupons(currentPage);
    } catch (err) {
      console.error('Error saving coupon:', err);
      notify.error('Error al guardar cupón');
    }
    setSaving(false);
  };

  // ============================================================
  // TOGGLE ACTIVE
  // ============================================================

  const toggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active, updated_at: new Date().toISOString() })
        .eq('id', coupon.id);
      if (error) throw error;

      setCoupons(prev => prev.map(c =>
        c.id === coupon.id ? { ...c, is_active: !c.is_active } : c
      ));
      notify.success(coupon.is_active ? 'Cupón desactivado' : 'Cupón activado');
    } catch (err) {
      console.error('Error toggling coupon:', err);
      notify.error('Error al cambiar estado');
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const deleteCoupon = async (coupon: Coupon) => {
    if (!window.confirm(`¿Eliminar cupón "${coupon.code}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', coupon.id);
      if (error) throw error;

      notify.success('Cupón eliminado');
      loadCoupons(currentPage);
    } catch (err) {
      console.error('Error deleting coupon:', err);
      notify.error('Error al eliminar cupón');
    }
  };

  // ============================================================
  // COPY CODE
  // ============================================================

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    notify.success(`Código "${code}" copiado`);
  };

  // ============================================================
  // VIEW REDEMPTIONS
  // ============================================================

  const viewRedemptions = async (coupon: Coupon) => {
    setRedemptionCoupon(coupon);
    setLoadingRedemptions(true);
    setShowRedemptions(true);

    try {
      const { data, error } = await supabase
        .from('coupon_redemptions')
        .select('*')
        .eq('coupon_id', coupon.id)
        .order('redeemed_at', { ascending: false });

      if (error) throw error;

      // Resolver emails de usuarios
      const userIds = [...new Set((data || []).map(r => r.user_id))];
      let usersMap: Record<string, { name: string; email: string }> = {};

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds);
        (users || []).forEach((u: any) => {
          usersMap[u.id] = {
            name: u.full_name || u.email?.split('@')[0] || 'Usuario',
            email: u.email || '',
          };
        });
      }

      setRedemptions(
        (data || []).map(r => ({
          ...r,
          user_email: usersMap[r.user_id]?.email || r.user_id,
          user_name: usersMap[r.user_id]?.name || 'Desconocido',
        }))
      );
    } catch (err) {
      console.error('Error loading redemptions:', err);
      notify.error('Error al cargar canjes');
    }
    setLoadingRedemptions(false);
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();
  const totalPages = Math.ceil(totalRecords / RECORDS_PER_PAGE);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (coupon: Coupon) => {
    if (!coupon.is_active) {
      return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Inactivo</span>;
    }
    if (isExpired(coupon.expires_at)) {
      return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">Expirado</span>;
    }
    if (coupon.current_redemptions >= coupon.max_redemptions) {
      return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Agotado</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-brand-100 text-brand-600">Activo</span>;
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Cupones</h1>
            <p className="text-sm text-gray-500 mt-1">
              Crear, editar y gestionar cupones de créditos
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cupón
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg border p-3">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Gift className="w-4 h-4" />
              <span className="text-xs font-medium">Total</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{totalRecords}</p>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <div className="flex items-center gap-2 text-brand-600 mb-1">
              <ToggleRight className="w-4 h-4" />
              <span className="text-xs font-medium">Activos</span>
            </div>
            <p className="text-xl font-bold text-brand-600">
              {coupons.filter(c => c.is_active && !isExpired(c.expires_at)).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">Canjes Totales</span>
            </div>
            <p className="text-xl font-bold text-blue-700">
              {coupons.reduce((sum, c) => sum + c.current_redemptions, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-3">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-medium">Créditos Otorgados</span>
            </div>
            <p className="text-xl font-bold text-amber-700">
              {coupons.reduce((sum, c) => sum + (c.current_redemptions * c.credits_amount), 0)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter tabs */}
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {([
                ['all', 'Todos'],
                ['active', 'Activos'],
                ['expired', 'Expirados'],
                ['inactive', 'Inactivos'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setFilter(key); setCurrentPage(1); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filter === key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar por código o nombre..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
              />
            </div>

            <button
              onClick={() => loadCoupons(1)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">CÓDIGO</th>
                  <th className="px-4 py-3 font-medium text-gray-600">NOMBRE</th>
                  <th className="px-4 py-3 font-medium text-gray-600 w-24">CRÉDITOS</th>
                  <th className="px-4 py-3 font-medium text-gray-600 w-28">CANJES</th>
                  <th className="px-4 py-3 font-medium text-gray-600 w-28">EXPIRA</th>
                  <th className="px-4 py-3 font-medium text-gray-600 w-24">ESTADO</th>
                  <th className="px-4 py-3 font-medium text-gray-600 w-36">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Cargando...
                    </td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <Gift className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      No se encontraron cupones
                    </td>
                  </tr>
                ) : (
                  coupons.map(coupon => (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      {/* Código */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono font-bold text-gray-800">
                            {coupon.code}
                          </code>
                          <button
                            onClick={() => copyCode(coupon.code)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copiar código"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Nombre */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{coupon.name}</span>
                        {coupon.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{coupon.description}</p>
                        )}
                      </td>

                      {/* Créditos */}
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-brand-600">{coupon.credits_amount}</span>
                      </td>

                      {/* Canjes */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => viewRedemptions(coupon)}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-xs"
                        >
                          {coupon.current_redemptions} / {coupon.max_redemptions}
                        </button>
                      </td>

                      {/* Expira */}
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {formatDate(coupon.expires_at)}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        {getStatusBadge(coupon)}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => viewRedemptions(coupon)}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                            title="Ver canjes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(coupon)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleActive(coupon)}
                            className={`p-1.5 rounded ${
                              coupon.is_active
                                ? 'hover:bg-yellow-50 text-yellow-600'
                                : 'hover:bg-brand-50 text-brand-600'
                            }`}
                            title={coupon.is_active ? 'Desactivar' : 'Activar'}
                          >
                            {coupon.is_active
                              ? <ToggleRight className="w-4 h-4" />
                              : <ToggleLeft className="w-4 h-4" />
                            }
                          </button>
                          <button
                            onClick={() => deleteCoupon(coupon)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-500"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Página {currentPage} de {totalPages} ({totalRecords} cupones)
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => loadCoupons(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
                <button
                  onClick={() => loadCoupons(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="px-3 py-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: Crear / Editar Cupón */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                {editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-4 space-y-4">
              {/* Código */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="Ej: WELCOME2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 focus:border-brand-600 font-mono uppercase"
                  maxLength={50}
                />
                <p className="text-xs text-gray-400 mt-1">Código único que usarán los usuarios para canjear</p>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Bienvenida Febrero 2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
                  maxLength={100}
                />
              </div>

              {/* Título (para mostrar al usuario) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ej: Créditos de bienvenida"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
                  maxLength={150}
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción opcional del cupón"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 focus:border-brand-600 resize-none"
                />
              </div>

              {/* Créditos + Max Canjes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Créditos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={form.credits_amount}
                    onChange={(e) => setForm(f => ({ ...f, credits_amount: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
                  />
                  <p className="text-xs text-gray-400 mt-1">Créditos por canje</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máx. canjes
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={form.max_redemptions}
                    onChange={(e) => setForm(f => ({ ...f, max_redemptions: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
                  />
                  <p className="text-xs text-gray-400 mt-1">Total de canjes permitidos</p>
                </div>
              </div>

              {/* Fecha Expiración */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expira <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-600 focus:border-brand-600"
                />
              </div>

              {/* Activo */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.is_active ? 'bg-brand-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">
                  {form.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-brand-600 hover:bg-brand-500 disabled:bg-gray-300 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
              >
                {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                {editingCoupon ? 'Guardar cambios' : 'Crear cupón'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Ver Canjes */}
      {/* ============================================================ */}
      {showRedemptions && redemptionCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Canjes de {redemptionCoupon.code}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {redemptionCoupon.current_redemptions} de {redemptionCoupon.max_redemptions} canjes usados
                </p>
              </div>
              <button onClick={() => setShowRedemptions(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {loadingRedemptions ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : redemptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Gift className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Aún no hay canjes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {redemptions.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{r.user_name}</p>
                        <p className="text-xs text-gray-500">{r.user_email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-brand-600">+{r.credits_granted} créditos</p>
                        <p className="text-xs text-gray-400">
                          {new Date(r.redeemed_at).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * PaymentsAdminPanel
 * Panel de Cobranzas (SuperAdmin)
 * Lista de pagos + Dashboard de ingresos
 */

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  RefreshCw, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  CreditCard,
  ArrowUpRight,
  Undo2,
  Eye,
  ChevronDown
} from 'lucide-react';
import {
  getAllPayments,
  getPaymentsSummary,
  markPaymentCompleted,
  refundPayment,
  formatAmount,
  getStatusLabel,
  getTypeLabel,
  type Payment,
  type PaymentSummary,
  type PaymentStatus,
  type PaymentType
} from '../../services/v2/paymentsService';

const STATUS_ICONS: Record<PaymentStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  processing: <RefreshCw className="w-4 h-4 animate-spin" />,
  completed: <CheckCircle className="w-4 h-4" />,
  failed: <XCircle className="w-4 h-4" />,
  refunded: <Undo2 className="w-4 h-4" />,
  cancelled: <XCircle className="w-4 h-4" />,
};

export default function PaymentsAdminPanel() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Filtros
  const [filters, setFilters] = useState<{
    status: PaymentStatus | '';
    type: PaymentType | '';
  }>({ status: '', type: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    const [paymentsData, summaryData] = await Promise.all([
      getAllPayments({
        status: filters.status || undefined,
        type: filters.type || undefined,
      }),
      getPaymentsSummary(6)
    ]);
    setPayments(paymentsData);
    setSummary(summaryData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  // Acciones
  const handleMarkCompleted = async (paymentId: string) => {
    if (!confirm('¿Marcar este pago como completado?')) return;
    setActionLoading(paymentId);
    const success = await markPaymentCompleted(paymentId);
    if (success) await loadData();
    setActionLoading(null);
  };

  const handleRefund = async (paymentId: string) => {
    const reason = prompt('Motivo del reembolso (opcional):');
    if (reason === null) return; // Canceló
    setActionLoading(paymentId);
    const success = await refundPayment(paymentId, reason || undefined);
    if (success) await loadData();
    setActionLoading(null);
  };

  // Calcular totales
  const currentMonthSummary = summary[0];
  const lastMonthSummary = summary[1];
  const totalRevenue = summary.reduce((acc, s) => acc + (s.total_revenue || 0), 0);
  const revenueGrowth = currentMonthSummary && lastMonthSummary 
    ? ((currentMonthSummary.total_revenue - lastMonthSummary.total_revenue) / (lastMonthSummary.total_revenue || 1) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-green-600" />
            Panel de Cobranzas
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona pagos y visualiza ingresos
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Recargar
        </button>
      </div>

      {/* Dashboard de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos del Mes */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">Este Mes</span>
            <TrendingUp className="w-5 h-5 text-[#16a135]" />
          </div>
          <div className="text-2xl font-bold text-[#16a135]">
            {formatAmount(currentMonthSummary?.total_revenue || 0)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {currentMonthSummary?.completed_count || 0} pagos completados
          </div>
        </div>

        {/* Crecimiento */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">Crecimiento</span>
            <ArrowUpRight className={`w-5 h-5 ${Number(revenueGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <div className={`text-2xl font-bold ${Number(revenueGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Number(revenueGrowth) >= 0 ? '+' : ''}{revenueGrowth}%
          </div>
          <div className="text-sm text-gray-500 mt-1">vs mes anterior</div>
        </div>

        {/* Por Suscripciones */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">Suscripciones</span>
            <CreditCard className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatAmount(currentMonthSummary?.subscription_revenue || 0)}
          </div>
          <div className="text-sm text-gray-500 mt-1">este mes</div>
        </div>

        {/* Por Destacados */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm font-medium">Destacados</span>
            <Calendar className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatAmount(currentMonthSummary?.featured_revenue || 0)}
          </div>
          <div className="text-sm text-gray-500 mt-1">este mes</div>
        </div>
      </div>

      {/* Gráfico Simple de Barras (últimos 6 meses) */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Ingresos Mensuales</h3>
        <div className="flex items-end gap-2 h-32">
          {[...summary].reverse().map((month, i) => {
            const maxRevenue = Math.max(...summary.map(s => s.total_revenue || 0));
            const height = maxRevenue > 0 ? ((month.total_revenue || 0) / maxRevenue) * 100 : 0;
            
            return (
              <div key={month.month} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all hover:from-green-600 hover:to-green-500"
                  style={{ height: `${Math.max(height, 4)}%` }}
                  title={formatAmount(month.total_revenue || 0)}
                />
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(month.month + '-01').toLocaleDateString('es-AR', { month: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-gray-700 font-medium"
        >
          <Filter className="w-4 h-4" />
          Filtros
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        
        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as PaymentStatus | '' })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="completed">Completado</option>
              <option value="failed">Fallido</option>
              <option value="refunded">Reembolsado</option>
              <option value="cancelled">Cancelado</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value as PaymentType | '' })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Todos los tipos</option>
              <option value="subscription">Suscripción</option>
              <option value="featured_ad">Destacado</option>
              <option value="upgrade">Upgrade</option>
              <option value="renewal">Renovación</option>
            </select>

            {(filters.status || filters.type) && (
              <button
                onClick={() => setFilters({ status: '', type: '' })}
                className="px-3 py-2 text-gray-600 hover:text-gray-900"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lista de Pagos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay pagos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map(payment => {
                  const status = getStatusLabel(payment.status);
                  
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(payment.created_at).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.user_name || payment.user_email}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.receipt_number && `#${payment.receipt_number}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {getTypeLabel(payment.payment_type)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {payment.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
                        {formatAmount(payment.amount, payment.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-700`}>
                          {STATUS_ICONS[payment.status]}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {payment.status === 'pending' && (
                            <button
                              onClick={() => handleMarkCompleted(payment.id)}
                              disabled={actionLoading === payment.id}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Marcar como pagado"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {payment.status === 'completed' && (
                            <button
                              onClick={() => handleRefund(payment.id)}
                              disabled={actionLoading === payment.id}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                              title="Reembolsar"
                            >
                              <Undo2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className="text-center text-sm text-gray-500">
        {payments.length} pagos • Total histórico: {formatAmount(totalRevenue)}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSentContactsCount, getMyReceivedContactsCount } from '../../services/contactService';
import { 
  Eye, 
  MessageSquare, 
  Calendar,
  Award,
  Users,
  Package,
  Send,
  PenLine,
  LayoutGrid,
  Search,
  Star
} from 'lucide-react';

interface DashboardStats {
  totalAds: number;
  activeAds: number;
  totalViews: number;
  totalMessages: number;
  sentContacts?: number; // Contactos enviados (para usuarios FREE)
  scrapedAds?: number;
}

export const DashboardPanel: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalAds: 0,
    activeAds: 0,
    totalViews: 0,
    totalMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [profile]);

  // Recargar datos cuando el usuario vuelve al dashboard
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [profile]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // TODO: Implementar llamadas a servicios según rol
      // Por ahora, datos de ejemplo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (profile?.role === 'superadmin') {
        setStats({
          totalAds: 1250,
          activeAds: 890,
          totalViews: 45678,
          totalMessages: 234,
        });
      } else if (profile?.role === 'free' || profile?.role === 'free-verificado') {
        // Para usuarios FREE, obtener contadores reales
        const { count } = await getSentContactsCount();
        const receivedCount = await getMyReceivedContactsCount();
        setStats({
          totalAds: 3,
          activeAds: 2,
          totalViews: 124,
          totalMessages: receivedCount,
          sentContacts: count,
        });
      } else {
        setStats({
          totalAds: 3,
          activeAds: 2,
          totalViews: 124,
          totalMessages: 4,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a135] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Dashboard para SuperAdmin
  if (profile?.role === 'superadmin') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AVISOS Premium</h1>
            <span className="inline-flex items-center gap-1 mt-2 px-4 py-1 bg-yellow-400 text-gray-900 rounded-full font-bold text-sm">
              <Star className="w-4 h-4" /> Destacado
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.hash = '#/my-ads'}
              className="bg-[#16a135] hover:bg-[#138a2c] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <PenLine className="w-5 h-5" />
              Crear Aviso
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid - SuperAdmin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            icon={<Package className="w-8 h-8" />}
            title="Total Avisos"
            value={stats.totalAds}
            subtitle={`${stats.activeAds} activos`}
            color="blue"
            trend="+12%"
          />
          <StatCard
            icon={<Eye className="w-8 h-8" />}
            title="Vistas Totales"
            value={stats.totalViews}
            subtitle="Este mes"
            color="green"
            trend="+25%"
          />
        </div>

        {/* Items del Dashboard - SuperAdmin */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-gray-600" /> Items del Dashboard</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* GRUPO 1: AVISOS */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">Avisos</div>
              <div className="space-y-1">
                <button
                  onClick={() => window.location.hash = '#/my-ads'}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Mis Avisos
                </button>
                <button
                  onClick={() => window.location.hash = '#/deleted-ads'}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Avisos Eliminados
                </button>
              </div>
            </div>

            {/* GRUPO 2: MENSAJES */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">Mensajes</div>
              <div className="space-y-1">
                <button
                  onClick={() => window.location.hash = '#/inbox'}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Mensajes <span className="text-xs text-gray-400">(en construcción)</span>
                </button>
              </div>
            </div>

            {/* GRUPO 3: USUARIOS */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">Usuarios</div>
              <div className="space-y-1">
                <button
                  onClick={() => window.location.hash = '#/users'}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Gestión de Usuarios
                </button>
              </div>
            </div>

            {/* GRUPO 4: OTROS */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">Otros</div>
              <div className="space-y-1">
                <button
                  onClick={() => window.location.hash = '#/categories-admin'}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Gestión categorias
                </button>
                <button
                  onClick={() => window.location.hash = '#/banners'}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  Banners
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  // Dashboard para usuarios normales (Free, Starter, Pro, Empresa)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Dashboard</h1>
          <p className="text-gray-600 mt-1">Plan: {profile?.plan_name || 'Free'}</p>
        </div>
        <button
          onClick={() => window.location.hash = '#/my-ads'}
          className="bg-[#16a135] hover:bg-[#138a2c] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3"
        >
          <PenLine className="w-6 h-6" />
          Crear Nuevo Aviso
        </button>
      </div>

      {/* Stats Grid - Free */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={<Package className="w-8 h-8" />}
          title="Mis Avisos"
          value={stats.totalAds}
          subtitle={`${stats.activeAds} activos`}
          color="blue"
        />
        <StatCard
          icon={<Eye className="w-8 h-8" />}
          title="Vistas"
          value={stats.totalViews}
          subtitle="Este mes"
          color="green"
        />
        <StatCard
          icon={<MessageSquare className="w-8 h-8" />}
          title="Consultas Recibidas"
          value={stats.totalMessages}
          subtitle="Mensajes recibidos"
          color="purple"
          isClickable={stats.totalMessages > 0}
          onClick={stats.totalMessages > 0 ? () => window.location.hash = '#/dashboard/contacts' : undefined}
        />
        <StatCard
          icon={<Send className="w-8 h-8" />}
          title="Contactos Enviados"
          value={stats.sentContacts || 0}
          subtitle="Mensajes enviados"
          color="yellow"
        />
      </div>

      {/* Quick Actions for FREE users */}
      {stats.totalMessages > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Tienes {stats.totalMessages} {stats.totalMessages === 1 ? 'consulta' : 'consultas'}
              </h3>
              <p className="text-sm text-gray-600">
                Revisa y responde a tus interesados
              </p>
            </div>
            <a
              href="#/dashboard/contacts"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Ver Contactos
            </a>
          </div>
        </div>
      )}


    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  subtitle: string;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  trend?: string;
  isClickable?: boolean;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, color, trend, isClickable, onClick }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-400 to-yellow-500',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
  };

  const Component = isClickable ? 'button' : 'div';

  return (
    <Component 
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${isClickable ? 'cursor-pointer hover:border-green-500' : ''} w-full text-left`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} text-white`}>
          {icon}
        </div>
        {trend && (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
            {trend}
          </span>
        )}
      </div>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{subtitle}</div>
    </Component>
  );
};


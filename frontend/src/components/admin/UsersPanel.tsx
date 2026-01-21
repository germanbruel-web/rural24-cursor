import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical,
  Award,
  User as UserIcon,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  AlertTriangle,
  Crown,
  Shield
} from 'lucide-react';
import { notify } from '../../utils/notifications';
import type { UserRole, UserType } from '../../../types';
import { 
  getAllUsers, 
  updateUserRole, 
  verifyUserEmail, 
  deleteUser,
  type UserData 
} from '../../services/usersService';

export const UsersPanel: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showUserMenu, setShowUserMenu] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAllUsers();
      
      if (error) {
        console.error('Error loading users:', error);
        notify.error('Error al cargar usuarios: ' + error.message);
        return;
      }
      
      if (data) {
        setUsers(data);
        console.log(`✅ ${data.length} usuarios cargados`);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      notify.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && user.email_verified) ||
      (statusFilter === 'inactive' && !user.email_verified);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Paginación
  const totalRecords = filteredUsers.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Estadísticas
  const stats = {
    total: users.length,
    superadmins: users.filter(u => u.role === 'superadmin').length,
    adminscrap: users.filter(u => u.role === 'adminscrap').length,
    free: users.filter(u => u.role === 'free').length,
    verified: users.filter(u => u.email_verified).length,
  };



  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    const confirmText = `¿ELIMINAR usuario "${user?.email}" permanentemente?\n\nEsta acción NO se puede deshacer.\nSe eliminarán:\n- Su cuenta\n- Todos sus avisos (${user?.ads_count || 0})\n- Sus mensajes\n- Todos sus datos`;
    
    if (!confirm(confirmText)) return;
    
    // Doble confirmación para SuperAdmins
    if (user?.role === 'superadmin') {
      if (!confirm('ATENCIÓN: Vas a eliminar un SUPERADMIN. ¿Estás SEGURO?')) return;
    }
    
    try {
      const { error } = await deleteUser(userId);
      
      if (error) {
        notify.error('Error al eliminar usuario: ' + error.message);
        return;
      }
      
      notify.success('Usuario eliminado correctamente');
      loadUsers();
    } catch (error) {
      notify.error('Error al eliminar usuario');
      console.error('Error deleting user:', error);
    }
  };

  const handleVerifyEmail = async (userId: string) => {
    try {
      const { error } = await verifyUserEmail(userId);
      
      if (error) {
        notify.error('Error al verificar email: ' + error.message);
        return;
      }
      
      notify.success('Email verificado manualmente');
      loadUsers();
    } catch (error) {
      notify.error('Error al verificar email');
      console.error('Error verifying email:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16a135] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra cuentas y permisos - {users.length} usuarios registrados</p>
        </div>
        {/* Botón crear usuario - Implementar modal más adelante
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-[#16a135] text-white rounded-lg hover:bg-[#0e7d25] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Usuario
        </button>
        */}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total Usuarios</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <Crown className="w-4 h-4 text-purple-500" />
            SuperAdmin
          </div>
          <div className="text-2xl font-bold text-purple-600">{stats.superadmins}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <Shield className="w-4 h-4 text-blue-500" />
            AdminScrap
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.adminscrap}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <Award className="w-4 h-4 text-yellow-500" />
            Premium
          </div>
          <div className="text-2xl font-bold text-yellow-600">{stats.premium}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <UserIcon className="w-4 h-4 text-blue-500" />
            Free
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.free}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Verificados
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por email o nombre..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
          >
            <option value="all">Todos los roles</option>
            <option value="superadmin">SuperAdmin</option>
            <option value="adminscrap">AdminScrap</option>
            <option value="free">Free</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#16a135] focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Verificados</option>
            <option value="inactive">No verificados</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avisos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#16a135] to-[#0e7d25] flex items-center justify-center text-white font-bold">
                        {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name || 'Sin nombre'}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          {user.email}
                          {user.email_verified ? (
                            <span title="Email verificado">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </span>
                          ) : (
                            <span title="Email no verificado">
                              <XCircle className="w-4 h-4 text-red-500" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {user.role === 'superadmin' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full w-fit">
                          <Crown className="w-3 h-3" />
                          SuperAdmin
                        </span>
                      )}
                      {user.role === 'adminscrap' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full w-fit">
                          <Shield className="w-3 h-3" />
                          AdminScrap
                        </span>
                      )}
                      {user.role === 'free' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full w-fit">
                          <UserIcon className="w-3 h-3" />
                          Free
                        </span>
                      )}
                      {user.user_type && (
                        <span className="text-xs text-gray-500">
                          {user.user_type === 'empresa' ? 'Empresa' : 'Particular'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.email_verified ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        Verificado
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          Sin verificar
                        </span>
                        <button
                          onClick={() => handleVerifyEmail(user.id)}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors flex items-center gap-1"
                          title="Verificar email manualmente"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Verificar
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{user.ads_count || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {new Date(user.created_at).toLocaleDateString('es-AR')}
                    </div>
                    {user.last_sign_in && (
                      <div className="text-xs text-gray-500">
                        Último: {new Date(user.last_sign_in).toLocaleDateString('es-AR')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setShowUserMenu(showUserMenu === user.id ? null : user.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                      </button>

                      {showUserMenu === user.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                          {!user.email_verified && (
                            <>
                              <button
                                onClick={() => {
                                  handleVerifyEmail(user.id);
                                  setShowUserMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Verificar Email
                              </button>
                              <div className="border-t border-gray-200 my-2"></div>
                            </>
                          )}

                          <button
                            onClick={() => {
                              handleDeleteUser(user.id);
                              setShowUserMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar Usuario
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalRecords > recordsPerPage && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} - {Math.min(endIndex, totalRecords)} de {totalRecords} usuarios
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No se encontraron usuarios
            </h3>
            <p className="text-gray-600">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

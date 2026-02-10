import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Code, LogOut } from 'lucide-react';
import { navigateTo } from '../hooks/useNavigate';

export const DevModePanel: React.FC = () => {
  const { user, userRole, isLoading, signOut } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="Mostrar panel de desarrollo"
      >
        🛠️
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-purple-900 text-white p-4 rounded-lg shadow-2xl max-w-md z-50 border-2 border-purple-500">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold flex items-center gap-2">
          🛠️ Dev Mode
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-300 text-xl font-bold"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 text-sm">
        {/* Estado de autenticación */}
        <div className="bg-purple-800 p-2 rounded">
          <strong>Auth Status:</strong> {isLoading ? 'Loading...' : user ? '✅ Logged In' : '❌ Not Logged'}
        </div>

        {/* Usuario actual */}
        {user && (
          <>
            <div className="bg-purple-800 p-2 rounded">
              <strong>User ID:</strong>
              <code className="text-xs block mt-1 bg-purple-950 p-1 rounded">{user.id}</code>
            </div>
            <div className="bg-purple-800 p-2 rounded">
              <strong>Email:</strong> {user.email}
            </div>
            <div className="bg-purple-800 p-2 rounded">
              <strong>Role:</strong> <span className={`font-bold ${userRole === 'superadmin' ? 'text-yellow-300' : userRole === 'admin' ? 'text-blue-300' : 'text-green-300'}`}>
                {userRole?.toUpperCase() || 'USER'}
              </span>
            </div>
          </>
        )}

        {/* Modo SuperAdmin */}
        {userRole === 'superadmin' && (
          <div className="bg-yellow-600 p-2 rounded mt-2">
            <strong>🚀 Modo SUPERADMIN Activo</strong>
            <p className="text-xs mt-1">Acceso completo: Scraping, Aprobar, Editar, Eliminar avisos</p>
          </div>
        )}
      </div>

      {/* Links útiles */}
      <div className="mt-3 pt-3 border-t border-purple-700 text-xs">
        <strong>Quick Links:</strong>
        <div className="flex gap-2 mt-1">
          <button onClick={() => navigateTo('/my-ads')} className="bg-purple-700 px-2 py-1 rounded hover:bg-purple-600">Mis Avisos</button>
          {userRole === 'superadmin' && (
            <>
              <button onClick={() => navigateTo('/my-ads')} className="bg-yellow-600 px-2 py-1 rounded hover:bg-yellow-500">Admin</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

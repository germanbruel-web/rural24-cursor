'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Obtener token del URL (pasado por el frontend)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (!token) {
          setError('No se proporcionó token de autenticación. Por favor accede desde el botón en el frontend.');
          setLoading(false);
          return;
        }

        // Verificar token con el backend
        const response = await fetch('/api/admin/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Error al verificar autenticación');
          setLoading(false);
          return;
        }

        const data = await response.json();
        setUser(data.user);
        
        // Guardar token en sessionStorage para uso posterior
        sessionStorage.setItem('admin-token', token);
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error verificando auth:', err);
        setError('Error al conectar con el servidor: ' + err.message);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}>
        Verificando permisos...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
        padding: '2rem',
      }}>
        <h1 style={{ fontSize: '2rem', color: '#dc3545', marginBottom: '1rem' }}>
          ⚠️ Acceso Denegado
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem', textAlign: 'center' }}>
          {error}
        </p>
        <a
          href="http://localhost:5174"
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.5rem',
            fontWeight: 500,
          }}
        >
          Ir al Frontend
        </a>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#f5f5f5',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: '#333', margin: 0 }}>
            🚜 Rural24 Admin
          </h1>
          <p style={{ color: '#666', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Bienvenido, {user?.name || user?.email}
          </p>
        </div>
        <button
          onClick={() => window.location.href = 'http://localhost:5174'}
          style={{
            padding: '0.5rem 1.5rem',
            background: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          Volver al Frontend
        </button>
      </header>

      {/* Content */}
      <main style={{ padding: '2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          {/* Card: Categorías */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#333' }}>
              📁 Categorías
            </h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Gestionar categorías y subcategorías
            </p>
            <button style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              width: '100%',
              fontWeight: 500,
            }}>
              Administrar
            </button>
          </div>

          {/* Card: Marcas */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#333' }}>
              🏭 Marcas
            </h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Gestionar marcas del catálogo
            </p>
            <button style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              width: '100%',
              fontWeight: 500,
            }}>
              Administrar
            </button>
          </div>

          {/* Card: Modelos */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#333' }}>
              🚜 Modelos
            </h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Catálogo de modelos y especificaciones
            </p>
            <button style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              width: '100%',
              fontWeight: 500,
            }}>
              Administrar
            </button>
          </div>

          {/* Card: Avisos */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#333' }}>
              📢 Avisos
            </h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Moderar y gestionar avisos
            </p>
            <button style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              width: '100%',
              fontWeight: 500,
            }}>
              Ver Avisos
            </button>
          </div>

          {/* Card: Usuarios */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#333' }}>
              👥 Usuarios
            </h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Gestionar usuarios y permisos
            </p>
            <button style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              width: '100%',
              fontWeight: 500,
            }}>
              Administrar
            </button>
          </div>

          {/* Card: Cloudinary */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#333' }}>
              🖼️ Imágenes
            </h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Gestión de imágenes en Cloudinary
            </p>
            <button style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              width: '100%',
              fontWeight: 500,
            }}>
              Ver Galería
            </button>
          </div>

          {/* Card: CMS Assets */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#333' }}>
              🔍 PWA Inspector
            </h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>
              Verificar íconos y assets estáticos del frontend (Android, iOS, Windows)
            </p>
            <button
              onClick={() => {
                const tok = sessionStorage.getItem('admin-token');
                window.location.href = `/admin/dashboard/cms${tok ? `?token=${tok}` : ''}`;
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #138A2C 0%, #0e6622 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                width: '100%',
                fontWeight: 500,
              }}
            >
              Ver Assets
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

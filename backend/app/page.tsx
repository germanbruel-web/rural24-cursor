export default function HomePage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚜 Rural24 BFF API</h1>
      <p style={{ fontSize: '1.5rem', opacity: 0.9, marginBottom: '2rem' }}>Backend for Frontend - Next.js 16</p>
      
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '2rem', 
        borderRadius: '1rem',
        backdropFilter: 'blur(10px)'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>📡 Endpoints Disponibles:</h2>
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '1.1rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>✅ <code>GET /api/config/categories</code></li>
          <li style={{ marginBottom: '0.5rem' }}>✅ <code>GET /api/catalog/brands</code></li>
          <li style={{ marginBottom: '0.5rem' }}>✅ <code>GET /api/catalog/models</code></li>
          <li style={{ marginBottom: '0.5rem' }}>✅ <code>GET /api/catalog/form-config</code></li>
          <li style={{ marginBottom: '0.5rem' }}>✅ <code>POST /api/ads</code></li>
          <li style={{ marginBottom: '0.5rem' }}>✅ <code>GET /api/ads</code></li>
          <li style={{ marginBottom: '0.5rem' }}>✅ <code>POST /api/uploads/signed-url</code></li>
        </ul>
      </div>

      <p style={{ marginTop: '2rem', opacity: 0.7 }}>
        Frontend: <a href="http://localhost:5173" style={{ color: '#ffd700' }}>http://localhost:5173</a>
      </p>
    </div>
  );
}

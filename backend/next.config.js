/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  // Turbopack config (Next.js 16+ usa Turbopack por defecto)
  turbopack: {},

  // Output standalone para producción (optimiza cold starts en Render)
  // Solo activar en build, no en dev (agrega overhead al compilador)
  ...(process.env.NODE_ENV === 'production' ? { output: 'standalone' } : {}),

  // TypeScript: ignorar errores de build temporalmente
  // TODO: Generar tipos de Supabase y remover esto
  typescript: {
    ignoreBuildErrors: true,
  },

  // ⚡ OPTIMIZACIÓN: Webpack watching y build incremental
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // File watching optimizado
      config.watchOptions = {
        ignored: /node_modules/,
        poll: false, // Event-based en lugar de polling
        aggregateTimeout: 300, // Debounce: esperar 300ms antes de recompilar
      };
      
      // Reducir chunks en dev para rebuilds más rápidos
      config.optimization = {
        ...config.optimization,
        splitChunks: false,
        runtimeChunk: false,
      };
      
      // Sourcemaps más rápidos en dev
      config.devtool = 'cheap-module-source-map';
    }
    return config;
  },

  async headers() {
    // En producción: usar FRONTEND_URL del env; en dev: localhost:5173
    const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    return [
      // ===========================================
      // CORS HEADERS (API Routes)
      // ===========================================
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS,PATCH' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
        ],
      },

      // ===========================================
      // SECURITY HEADERS (Todas las rutas)
      // ===========================================
      {
        source: '/:path*',
        headers: [
          // Anti-clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          
          // Prevenir MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          
          // XSS Protection (legacy pero no hace daño)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          
          // Referrer Policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          
          // Permissions Policy (deshabilitar APIs peligrosas)
          { 
            key: 'Permissions-Policy', 
            value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=()' 
          },
          
          // HSTS (solo en producción)
          ...(process.env.NODE_ENV === 'production' ? [
            { 
              key: 'Strict-Transport-Security', 
              value: 'max-age=31536000; includeSubDomains; preload' 
            }
          ] : []),
        ],
      },

      // ===========================================
      // CACHE HEADERS (API Routes)
      // ===========================================
      
      // Categorías: Cache agresivo (cambian poco)
      {
        source: '/api/categories',
        headers: [
          { 
            key: 'Cache-Control', 
            value: 'public, max-age=3600, stale-while-revalidate=86400' 
          },
        ],
      },

      // Config/Filters: Cache moderado
      {
        source: '/api/config/:path*',
        headers: [
          { 
            key: 'Cache-Control', 
            value: 'public, max-age=600, stale-while-revalidate=1800' 
          },
        ],
      },

      // Búsqueda: Cache corto (datos cambian frecuentemente)
      {
        source: '/api/ads/search',
        headers: [
          { 
            key: 'Cache-Control', 
            value: 'public, max-age=60, stale-while-revalidate=300' 
          },
        ],
      },

      // Health check: No cache
      {
        source: '/api/health',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

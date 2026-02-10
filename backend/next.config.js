/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  // Output standalone para producción (optimiza cold starts en Vercel)
  // Solo activar en build, no en dev (agrega overhead al compilador)
  ...(process.env.NODE_ENV === 'production' ? { output: 'standalone' } : {}),

  async headers() {
    // En producción: usar FRONTEND_URL del env; en dev: localhost:5173
    const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS,PATCH' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

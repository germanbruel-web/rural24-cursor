import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), ''); // '' para cargar todas las VITE_*
  
  // Backend API URL configurable (default: 3001 para evitar conflictos)
  const apiUrl = env.VITE_API_URL || 'http://localhost:3001';
  const isProduction = mode === 'production';

  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: true, // FORZAR puerto 5173 - falla si está ocupado
      headers: {
        // Cache para assets estáticos (logos, imágenes)
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
      proxy: {
        // Proxy para API del backend Next.js (configurable via VITE_API_URL)
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path, // Mantener /api prefix
        },
      },
    },
    plugins: [react()],
    build: {
      // Optimización de producción
      sourcemap: isProduction ? 'hidden' : true,
      // Chunk splitting strategy para mejor caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunk — cambia poco, se cachea agresivamente
            'vendor-react': ['react', 'react-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-ui': ['lucide-react', '@heroicons/react', 'clsx', 'tailwind-merge'],
          },
        },
      },
      // Target modern browsers
      target: 'es2020',
      // Reportar tamaño de chunks
      chunkSizeWarningLimit: 500,
    },
    define: {
      // Exponer Supabase
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_KEY': JSON.stringify(env.VITE_SUPABASE_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});

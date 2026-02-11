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
          manualChunks(id) {
            // Vendor chunks (librerías externas)
            if (id.includes('node_modules')) {
              // React core
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                return 'vendor-react';
              }
              // Supabase
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              // UI Libraries
              if (id.includes('lucide-react') || id.includes('@heroicons') || 
                  id.includes('clsx') || id.includes('tailwind-merge')) {
                return 'vendor-ui';
              }
              // DnD Kit (usado solo en admin)
              if (id.includes('@dnd-kit')) {
                return 'vendor-dnd';
              }
              // Axios + HTTP clients
              if (id.includes('axios')) {
                return 'vendor-http';
              }
              // Resto de node_modules
              return 'vendor-other';
            }

            // Feature-based chunks (código de la app)
            // Shared code (services, utils, hooks, contexts, constants) - fusionado para evitar circular dependencies
            if (id.includes('/src/services/') || 
                id.includes('/src/utils/') || 
                id.includes('/src/hooks/') || 
                id.includes('/src/contexts/') || 
                id.includes('/src/constants/')) {
              return 'shared';
            }
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

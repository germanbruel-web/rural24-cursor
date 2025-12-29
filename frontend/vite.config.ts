import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno
  const env = loadEnv(mode, process.cwd(), ''); // '' para cargar todas las VITE_*

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
    },
    plugins: [react()],
    define: {
      // Exponer GEMINI_API_KEY si la necesitás
      //'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),//
      
      // Exponer Supabase
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});

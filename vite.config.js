import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');


  return {
    base: '/TESTZEN/',
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_DEV_PORT) || 5173,
      proxy: {
        '/TESTZEN/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:5000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/TESTZEN\/api/, '/api')
        },
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:5000',
          changeOrigin: true
        }
      }
    }
  };
});

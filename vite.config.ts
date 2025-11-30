import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: parseInt(env.VITE_PORT || '5173'),
      proxy: {
        '/api': {
          target: 'https://motormind-backend-development.up.railway.app',
          changeOrigin: true,
          secure: true,
        },
      },
    },
    define: {
      'process.env': {},
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        external: ['../motormind-design/**'],
      },
    },
  };
});

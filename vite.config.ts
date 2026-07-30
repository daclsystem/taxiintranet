import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { zmovilidadBuildPlugin } from './scripts/vite-build-plugin';

// https://vitejs.dev/config/
// Producción: https://zmovilidad.app/intranet/
export default defineConfig({
  base: '/intranet/',
  plugins: [react(), zmovilidadBuildPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        vale: resolve(__dirname, 'public/vale.html'),
        mt: resolve(__dirname, 'public/mt.html'),
      },
    },
  },
  publicDir: 'public',
});

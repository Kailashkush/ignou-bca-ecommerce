import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite development and build configuration.
 *
 * The `/api` proxy lets the browser call the API on the same origin during
 * development, which keeps cookies and CORS behaviour identical to a
 * production deployment where both are served from one domain.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
});

import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // No añadir crossorigin para evitar problemas con servidores sin CORS headers
        crossOriginLoading: false
      }
    }
  }
});

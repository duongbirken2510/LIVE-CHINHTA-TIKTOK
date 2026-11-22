import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['lvh.me'],
    watch: { ignored: ['**/data/**', '**/settings.json'] },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('kho-vong-1') || id.includes('kho-vong-2')) return 'data-v1-v2';
          if (id.includes('kho-vong-3') || id.includes('kho-vong-4')) return 'data-v3-v4';
        },
      },
    },
  },
});

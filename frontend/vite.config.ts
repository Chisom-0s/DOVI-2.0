import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': `${import.meta.dirname}/src`,
      '@/api': `${import.meta.dirname}/src/api`,
      '@/components': `${import.meta.dirname}/src/components`,
      '@/contexts': `${import.meta.dirname}/src/contexts`,
      '@/hooks': `${import.meta.dirname}/src/hooks`,
      '@/pages': `${import.meta.dirname}/src/pages`,
      '@/types': `${import.meta.dirname}/src/types`,
      '@/utils': `${import.meta.dirname}/src/utils`,
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});

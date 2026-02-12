import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Use relative paths for Chrome extension
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

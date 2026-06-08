import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { printLocalIpPlugin } from './vite.printLocalIp';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), printLocalIpPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true,
    port: 5174,
  },
});

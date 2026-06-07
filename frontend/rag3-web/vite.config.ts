import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 5173,
    proxy: {
      // RAGFlow REST 接口在 /api/v1/*，勿剥离 /api 前缀（与上游 web 一致）
      '/api': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:9380',
        changeOrigin: true,
      },
      // LLM 厂商 / API KEY 配置走 /v1/llm/*（与上游 web 一致）
      '/v1': {
        target: process.env.VITE_PROXY_TARGET ?? 'http://localhost:9380',
        changeOrigin: true,
      },
    },
  },
});

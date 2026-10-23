import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      // Matches the address in FULLSTACK_SETUP.md, CORS settings and password-reset links.
      host: '127.0.0.1',
      port: 5173,
      proxy: {
        // Django API (backend/). Port 8254 avoids clashing with other local apps on 8000.
        '/api': { target: env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8254', changeOrigin: true },
      },
    },
  }
})

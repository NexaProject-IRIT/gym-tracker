import { defineConfig } from 'vite'
import type { IncomingMessage } from 'http'
import react from '@vitejs/plugin-react'

// Префиксы, которые совпадают с React-роутами (рефреш браузера → отдаём index.html, иначе → проксируем как API)
const spaAwareBypass = (req: IncomingMessage) => {
  if (req.method === 'GET' && req.headers.accept?.includes('text/html')) {
    return '/index.html'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/auth':      { target: 'http://backend:8000', changeOrigin: true },
      '/workouts':  { target: 'http://backend:8000', changeOrigin: true, bypass: spaAwareBypass },
      '/exercises': { target: 'http://backend:8000', changeOrigin: true },
      '/export':    { target: 'http://backend:8000', changeOrigin: true },
      '/media':     { target: 'http://backend:8000', changeOrigin: true },
      '/ai':        { target: 'http://backend:8000', changeOrigin: true, bypass: spaAwareBypass },
    },
  },
})
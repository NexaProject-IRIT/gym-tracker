import { defineConfig } from 'vite'
import type { IncomingMessage } from 'http'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Префиксы, которые совпадают с React-роутами (рефреш браузера → отдаём index.html, иначе → проксируем как API)
const spaAwareBypass = (req: IncomingMessage) => {
  if (req.method === 'GET' && req.headers.accept?.includes('text/html')) {
    return '/index.html'
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      devOptions: { enabled: true },
      manifest: {
        name: 'GymLog',
        short_name: 'GymLog',
        description: 'Дневник тренировок с AI-тренером',
        lang: 'ru',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
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
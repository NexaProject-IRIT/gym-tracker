import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/auth':      { target: 'http://backend:8000', changeOrigin: true },
      '/workouts':  { target: 'http://backend:8000', changeOrigin: true },
      '/exercises': { target: 'http://backend:8000', changeOrigin: true },
      '/export':    { target: 'http://backend:8000', changeOrigin: true },
      '/ai':        { target: 'http://backend:8000', changeOrigin: true },
    },
  },
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // 0.0.0.0 pe listen karega — mobile/other devices access kar sakenge
    port: 5173,
    proxy: {
      '/api': {
        // Local backend for development — change to Render URL for production testing:
        // target: 'https://health-care-nj05.onrender.com',
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/prescriptions': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})


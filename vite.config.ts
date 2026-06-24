import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['tslib'],
  },
  server: {
    proxy: {
      '/f1-news': {
        target: 'https://www.formula1.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/f1-news/, '/en/latest/all.xml'),
      },
    },
  },
})

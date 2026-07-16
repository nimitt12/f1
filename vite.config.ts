import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Per-route HTML entry points so /live and /privacy get their own
      // titles, descriptions and canonicals (served via vercel.json rewrites).
      input: {
        main: resolve(__dirname, 'index.html'),
        live: resolve(__dirname, 'live.html'),
        privacy: resolve(__dirname, 'privacy.html'),
      },
    },
  },
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

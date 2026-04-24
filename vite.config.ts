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
      '/fia-news': {
        target: 'https://www.fia.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/fia-news/, '/rss/press-release'),
      },
    },
  },
})

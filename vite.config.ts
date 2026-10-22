import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { buildSitemap, loadRacesFromSnapshot } from './scripts/generate-seo-pages.mjs'

// In production the sitemap is generated into dist/ by
// scripts/generate-seo-pages.mjs; the dev server has no such file, so serve
// one built from the bundled calendar snapshot to keep /sitemap.xml working.
const devSitemap = (): Plugin => ({
  name: 'dev-sitemap',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/sitemap.xml', (_req, res) => {
      res.setHeader('Content-Type', 'application/xml')
      res.end(buildSitemap(loadRacesFromSnapshot()))
    })
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const backendUrl = loadEnv(mode, process.cwd(), '').VITE_BACKEND_URL;
  if (!backendUrl) throw new Error('VITE_BACKEND_URL is required');
  const upstream = new URL(backendUrl);
  if (!['http:', 'https:'].includes(upstream.protocol) || upstream.username || upstream.password || upstream.search || upstream.hash) {
    throw new Error('VITE_BACKEND_URL must be an HTTP(S) URL without credentials, query or fragment');
  }

  return {
    // Keep existing API call sites, but never embed the upstream in browser JS.
    define: {
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify('/api'),
    },
    plugins: [react(), devSitemap()],
    build: {
      rollupOptions: {
        // Per-route HTML entry points so /live and /privacy get their own
        // titles, descriptions and canonicals (served via vercel.ts rewrites).
        input: {
          main: resolve(__dirname, 'index.html'),
          live: resolve(__dirname, 'live.html'),
          schedule: resolve(__dirname, 'schedule.html'),
          results: resolve(__dirname, 'results.html'),
          standings: resolve(__dirname, 'standings.html'),
          constructorStandings: resolve(__dirname, 'constructor-standings.html'),
          statistics: resolve(__dirname, 'statistics.html'),
          privacy: resolve(__dirname, 'privacy.html'),
        },
      },
    },
    optimizeDeps: {
      include: ['tslib'],
    },
    server: {
      proxy: {
        '^/api(?:/|$)': {
          target: upstream.href.replace(/\/$/, ''),
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api(?=\/|$)/, '') || '/',
        },
        '/f1-news': {
          target: 'https://www.formula1.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/f1-news/, '/en/latest/all.xml'),
        },
        // Article pages don't carry images in the RSS feed itself; NewsIntel
        // fetches each article through here and scrapes its og:image meta tag.
        '/f1-article/en/latest/': {
          target: 'https://www.formula1.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/f1-article/, ''),
        },
      },
    },
  }
})

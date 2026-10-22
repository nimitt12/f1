import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';
import { getTransformedRoutes } from '@vercel/routing-utils';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const routing = JSON.parse(readFileSync(resolve(ROOT, 'config/deployment-routes.json'), 'utf8'));

export function deploymentConfig(backendUrl) {
  if (!backendUrl) throw new Error('VITE_BACKEND_URL is required');
  const upstream = new URL(backendUrl);
  if (upstream.protocol !== 'https:' || upstream.username || upstream.password || upstream.search || upstream.hash) {
    throw new Error('VITE_BACKEND_URL must be an HTTPS URL without credentials, query or fragment');
  }
  return {
    ...routing,
    rewrites: [
      { source: '/api/:path*', destination: `${upstream.href.replace(/\/$/, '')}/:path*` },
      ...routing.rewrites,
    ],
  };
}

export function buildOutputConfig(backendUrl) {
  const { routes, error } = getTransformedRoutes(deploymentConfig(backendUrl));
  if (error) throw new Error(`Invalid deployment routes: ${error.message}`);
  return { version: 3, routes };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const env = loadEnv(process.env.NODE_ENV ?? 'production', ROOT, '');
  const config = buildOutputConfig(env.VITE_BACKEND_URL);
  const output = resolve(ROOT, '.vercel/output');
  // Only replace generated output; preserve Vercel's project link and settings.
  rmSync(output, { recursive: true, force: true });
  mkdirSync(output, { recursive: true });
  cpSync(resolve(ROOT, 'dist'), resolve(output, 'static'), { recursive: true });
  writeFileSync(resolve(output, 'config.json'), JSON.stringify(config, null, 2) + '\n');
  console.log('[vercel] wrote validated routes and static assets to .vercel/output');
}

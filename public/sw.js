const CACHE_NAME = 'pitwall-v8';
const ASSETS_TO_CACHE = [
  '/', '/index.html', '/manifest.json', '/logo.svg', '/favicon.ico',
  '/favicon-16x16.png', '/favicon-32x32.png', '/apple-touch-icon.png',
  '/android-chrome-192x192.png', '/android-chrome-512x512.png',
  '/screenshot-desktop.png', '/screenshot-mobile.png',
];
const MAX_CACHE_ENTRIES = 100;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('pitwall-') && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

// Serialize cache writes so concurrent asset downloads cannot defeat the cap.
let writes = Promise.resolve();
const remember = (request, response) => {
  writes = writes.catch(() => {}).then(async () => {
    if (!response.ok || response.type !== 'basic' || response.redirected ||
        /no-store|private/i.test(response.headers.get('Cache-Control') || '')) return;
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response);
    const keys = await cache.keys();
    const removable = keys.filter(key => !ASSETS_TO_CACHE.includes(new URL(key.url).pathname));
    for (const key of removable.slice(0, Math.max(0, keys.length - MAX_CACHE_ENTRIES))) {
      await cache.delete(key);
    }
  });
  return writes;
};

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      request.headers.has('Authorization') || url.search) return;

  // Account/admin/API/proxy responses must never enter the offline cache.
  const publicPage = ['/', '/index.html', '/live', '/schedule', '/schedule/', '/results', '/results/', '/standings', '/standings/', '/constructor-standings', '/constructor-standings/', '/privacy'].includes(url.pathname) ||
    /^\/race\/\d{4}\/[a-z0-9-]+\/?$/.test(url.pathname);
  if (request.mode === 'navigate') {
    if (!publicPage) return;
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match('/') || Response.error();
    }));
    return;
  }

  const asset = ASSETS_TO_CACHE.includes(url.pathname) && !['/', '/index.html'].includes(url.pathname);
  const bundledAsset = /^\/assets\/[a-zA-Z0-9_.-]+\.(js|css|png|jpg|jpeg|webp|svg|woff2)$/.test(url.pathname);
  if (!asset && !bundledAsset) return;
  const response = (async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return { result: cached };
    const result = await fetch(request);
    return { result, copy: result.clone() };
  })();
  event.respondWith(response.then(({ result }) => result));
  event.waitUntil(response.then(({ copy }) => copy && remember(request, copy)).catch(() => {}));
});

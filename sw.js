const CACHE_NAME = 'daymark-pwa-v1';
const APP_ROOT = self.registration.scope;
const APP_INDEX = new URL('index.html', APP_ROOT).href;
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './pwa.js',
  './site.webmanifest',
  './daymark-icon.svg',
  './favicon-32.png',
  './apple-touch-icon.png',
  './app-icon-192.png',
  './app-icon-512.png',
].map((path) => new URL(path, APP_ROOT).href);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames
      .filter((name) => name.startsWith('daymark-pwa-') && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function fetchAndCache(request, cache) {
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    await cache.put(request, response.clone());
  }
  return response;
}

async function handleNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    return await fetchAndCache(request, cache);
  } catch (_) {
    return (await cache.match(request, { ignoreSearch: true }))
      || (await cache.match(APP_INDEX))
      || new Response('Daymark is offline. Reconnect once to open the app.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
  }
}

async function handleAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  try {
    const response = await fetchAndCache(request, cache);
    return response;
  } catch (_) {
    return cached || new Response('', {
      status: 504,
      statusText: 'Offline',
    });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  event.respondWith(handleAsset(request));
});

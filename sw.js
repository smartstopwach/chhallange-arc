const CACHE_NAME = 'daymark-pwa-v8';
const APP_ROOT = self.registration.scope;
const APP_INDEX = new URL('index.html', APP_ROOT).href;
const FIREBASE_SDK_ASSETS = [
  'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js',
];
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './firebase-client.js',
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
    await Promise.allSettled(FIREBASE_SDK_ASSETS.map(async (url) => {
      const request = new Request(url, { mode: 'cors', credentials: 'omit' });
      const response = await fetch(request);
      if (response.ok && response.type === 'cors') await cache.put(request, response);
    }));
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
  if (response.ok && ['basic', 'cors'].includes(response.type)) {
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
  if (requestUrl.origin !== self.location.origin) {
    const firebaseSdkRequest = requestUrl.origin === 'https://www.gstatic.com'
      && requestUrl.pathname.startsWith('/firebasejs/12.19.0/')
      && requestUrl.pathname.endsWith('.js');
    if (firebaseSdkRequest) event.respondWith(handleAsset(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  event.respondWith(handleAsset(request));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const requestedUrl = new URL(event.notification.data?.url || APP_ROOT, self.location.origin);
    const targetUrl = requestedUrl.origin === self.location.origin && requestedUrl.href.startsWith(APP_ROOT)
      ? requestedUrl.href
      : APP_ROOT;
    const openWindows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const appWindow = openWindows.find((client) => client.url.startsWith(APP_ROOT));
    if (appWindow) {
      await appWindow.focus();
      appWindow.postMessage({ type: 'daymark:open-today' });
      return;
    }
    await self.clients.openWindow(targetUrl);
  })());
});

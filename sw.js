const CACHE = 'chief-solar-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
const TAILWIND = 'https://cdn.tailwindcss.com';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(SHELL);
    try { await c.add(new Request(TAILWIND, {mode: 'no-cors'})); } catch (err) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isTailwind = url.href.startsWith(TAILWIND);
  if (!sameOrigin && !isTailwind) return; // sync API etc. go straight to network
  e.respondWith((async () => {
    const cached = await caches.match(req, {ignoreSearch: true});
    const network = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) caches.open(CACHE).then(c => c.put(req, res.clone()));
      return res;
    }).catch(() => null);
    return cached || (await network) || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error());
  })());
});

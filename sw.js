// Bump the release whenever the app shell changes. User data is never cached here.
const RELEASE = '0.5.0-web';
const PREFIX = 'hany-app-shell-';
const CACHE = PREFIX + RELEASE;
const ASSETS = [
  './', './index.html', './style.css', './app.js', './model.js', './planning.js',
  './finance-ui.js', './manifest.webmanifest', './icon.svg', './icon-192.png',
  './icon-512.png', './apple-touch-icon.png', './pwa.js', './pwa.css',
  './goals.js', './goals-ui.js', './goals.css', './data-tools.js', './data-tools-ui.js', './data-tools.css', './insights.js', './insights-ui.js', './insights.css',
  './money-flows.js', './outings-ui.js', './outings.css', './reminders.js', './reminders-ui.js',
];
const url = path => new URL(path, self.registration.scope).href;
const shell = new Set(ASSETS.map(url));
const shellHome = url('./index.html');
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(ASSETS.map(path => new Request(url(path), {cache:'reload'})));
})()));
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', event => event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names.filter(name => name === 'hany-shell-v1' || name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const request = event.request, requested = new URL(request.url);
  // No API, personal exports, query strings, auth, external or unknown paths.
  if (request.method !== 'GET' || requested.origin !== self.location.origin || requested.search || request.headers.has('authorization') || !shell.has(requested.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === 'navigate') {
      // Serve this release's complete shell until an explicit update is accepted.
      return await cache.match(shellHome) || fetch(request);
    }
    // Versioned assets keep a running app consistent until the user updates.
    const cached = await cache.match(request);
    return cached || fetch(request);
  })());
});

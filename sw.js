/* Packfertig – Service Worker: macht die Seite offline nutzbar (z. B. im Flugmodus).
   Bei jeder Änderung an den Dateien die Versionsnummer erhöhen. */
const VERSION = 'packfertig-v5';
const CORE = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('packfertig-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Schriften: einmal laden, dann immer aus dem Cache
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(VERSION).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok || res.type === 'opaque') c.put(req, res.clone());
          return res;
        } catch (err) {
          return new Response('', { status: 504 });
        }
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Eigene Dateien: sofort aus dem Cache, im Hintergrund aktualisieren
  e.respondWith(
    caches.open(VERSION).then(async (c) => {
      const key = req.mode === 'navigate' ? './' : req;
      const hit = await c.match(key, { ignoreSearch: true });
      const update = fetch(req)
        .then((res) => { if (res.ok) c.put(key, res.clone()); return res; })
        .catch(() => null);
      if (hit) { e.waitUntil(update); return hit; }
      const res = await update;
      return res || new Response('Offline – bitte einmal mit Internet öffnen.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    })
  );
});

/* Admin app service worker. Only touches admin/login files — the public site is never cached or intercepted. */
const V = 'rf-admin-v1';
const OWN = ['/admin', '/admin.html', '/login', '/login.html', '/supabase-config.js', '/manifest.webmanifest'];
const mine = u => OWN.includes(u.pathname) || u.pathname.startsWith('/img/favicon/');
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || !mine(u)) return;   // everything else: normal network
  e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(ca => ca.put(r, c)); } return res; })
    .catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('/login.html') : Response.error()))));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow('/admin');
  }));
});

/* Phone push: the server sends a small JSON payload; show it even when the app is closed. */
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title || 'New inquiry', {
    body: d.body || 'Open the inbox to read it.',
    icon: '/img/favicon/icon-192.png', badge: '/img/favicon/icon-192.png',
    tag: d.tag || 'inquiry', renotify: true, vibrate: [80, 40, 80], data: { url: '/admin' }
  }));
});

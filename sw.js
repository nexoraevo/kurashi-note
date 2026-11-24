// うちの暮らしノート：画面の元（HTML・アイコン）をスマホに置いておき、開くときはまずそれを出す。
// 裏で新しい版を取ってきて入れ替えるので、更新は次に開いたときに出る。データ（Apps Script）には触らない。
const CACHE = 'kurashi-v5';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // ページを開くときは、? や # が付いていても同じ1枚を出す
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(key);
      const net = fetch(req)
        .then((res) => {
          if (res.ok) c.put(key, res.clone());
          return res;
        })
        .catch(() => hit);
      return hit || net;
    }),
  );
});

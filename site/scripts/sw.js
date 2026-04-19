const CACHE_NAME = 'profile-v1';
const ASSETS = [
  '/',
  '/style',
  '/anim',
  '/contentPage',
  '/profileContent',
  '/config',
  '/utils',
  '/ball',
  '/guy',
  '/projects',
  '/profile'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

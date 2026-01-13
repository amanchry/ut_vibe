const CACHE_NAME = "ut-vibe-static-v1";
const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icons/manifest-icon-192.png",
  "/icons/manifest-icon-512.png",
  "/icons/apple-touch-icon.png",
];

const isStaticAsset = (request) => {
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return STATIC_ASSETS.includes(url.pathname);
};

const fetchAndCache = (request) => {
  return fetch(request)
    .then((response) => {
      if (!response || response.status !== 200 || response.type === "opaque") {
        return response;
      }
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
      return response;
    })
    .catch(() => caches.match("/"));
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isApiCall =
    url.origin === self.location.origin && url.pathname.startsWith("/api/");

  if (isApiCall) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (isStaticAsset(event.request)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetchAndCache(event.request))
    );
    return;
  }

  event.respondWith(fetchAndCache(event.request));
});

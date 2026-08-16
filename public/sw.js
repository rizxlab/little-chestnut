const CACHE_NAME = "lizi-static-v146";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/og.png"];
const STATIC_DESTINATIONS = new Set(["style", "script", "image", "font", "manifest"]);

function canCache(response) {
  return response.ok && response.type === "basic";
}

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (canCache(response)) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetchAndCache(event.request).catch(
        () => caches.match(event.request).then((cached) => cached || caches.match("/")),
      ),
    );
    return;
  }

  if (!STATIC_DESTINATIONS.has(event.request.destination)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetchAndCache(event.request)),
  );
});

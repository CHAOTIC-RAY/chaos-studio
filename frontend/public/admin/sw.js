/* Chaos Studio Admin PWA — scoped to /admin/ */
const CACHE = "chaos-admin-v12";
const PRECACHE = [
  "/admin/",
  "/admin/index.html",
  "/admin/cms-app.css",
  "/admin/cms-app.js",
  "/admin/cms-assistant.css",
  "/admin/cms-assistant.js",
  "/admin/config.yml",
  "/admin/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const NETWORK_FIRST = ["/admin/sync-status.json", "/admin/media-manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isAdminPath(url) {
  try {
    const u = new URL(url);
    return u.pathname === "/admin" || u.pathname.startsWith("/admin/");
  } catch {
    return false;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = request.url;
  if (url.includes("unpkg.com") || url.includes("api.github.com") || url.includes("githubusercontent.com")) {
    return;
  }

  if (!isAdminPath(url)) return;

  const path = new URL(url).pathname;
  if (NETWORK_FIRST.includes(path)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((res) => {
          if (res.ok && path.startsWith("/admin/")) {
            caches.open(CACHE).then((c) => c.put(request, res.clone()));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    }),
  );
});

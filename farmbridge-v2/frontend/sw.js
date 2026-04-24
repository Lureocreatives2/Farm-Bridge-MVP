// sw.js — FarmBridge Service Worker
// Strategy: Cache-first for static assets (CSS, JS, lang files).
//           Network-first for API calls (products must be fresh).
// This dramatically improves load times on slow Nigerian 2G/3G networks.

const CACHE_NAME = "farmbridge-v2";
const STATIC_ASSETS = [
  "/pages/index.html",
  "/pages/list.html",
  "/pages/product.html",
  "/pages/farmer.html",
  "/pages/404.html",
  "/css/style.css",
  "/js/i18n.js",
  "/js/api.js",
  "/lang/en.json",
  "/lang/yo.json",
  "/lang/ha.json",
  "/lang/ig.json",
  "/lang/pc.json",
];

// ── Install: pre-cache all static assets ─────────────────────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: route strategy ──────────────────────────────────────────────────────
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls → network first, no cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ success: false, error: "You appear to be offline." }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Static assets → cache first, then network
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        // Cache successful GETs for static files
        if (response.ok && request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      });
    }).catch(() => caches.match("/pages/404.html"))
  );
});

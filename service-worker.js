/* =====================================================
   SERVICE-WORKER.JS — UJASI Food Delivery
   Lengo: kupunguza matumizi ya data (fetch) kwa kuhifadhi
   (cache) faili za mfumo (CSS/JS/fonts/icons/HTML) kwenye
   kifaa cha mtumiaji, ili zisipakuliwe upya kila mara.

   Mkakati:
   - App-shell (CSS/JS/icons/manifest): CACHE-FIRST — ikiwa
     ipo kwenye cache, itumike moja kwa moja (hakuna fetch),
     vinginevyo pakua na uihifadhi kwa matumizi yajayo.
   - Kurasa za HTML (navigation): NETWORK-FIRST na fallback
     kwenye cache - hivyo mtumiaji anapata toleo jipya zaidi
     akiwa na mtandao, na toleo la mwisho alilofungua akiwa
     nje ya mtandao (offline).
   - Rasilimali za nje (Google Fonts, Firebase SDK):
     STALE-WHILE-REVALIDATE — onyesha cache mara moja (haraka,
     hakuna data ya ziada), kisha sasisha kimya kimya nyuma.
   - Nominatim (utafutaji wa eneo) na Google Maps embed:
     HAVIHIFADHIWI kabisa - lazima yabaki mapya kila wakati.
   ===================================================== */

const CACHE_VERSION = "ujasi-v4";
const STATIC_CACHE = CACHE_VERSION + "-static";
const PAGES_CACHE = CACHE_VERSION + "-pages";

const APP_SHELL = [
  "/index.html",
  "/manifest.json",
  "/css/global.css",
  "/js/app.js",
  "/js/data.js",
  "/js/location.js",
  "/js/admin-layer1.js",
  "/js/restaurant-admin.js",
  "/js/rider.js",
  "/js/super-admin.js",
  "/js/firebase-config.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png"
];

// Domeni ambazo HAZIPASWI kuhifadhiwa kamwe (lazima zibaki mpya)
const NEVER_CACHE_HOSTS = ["nominatim.openstreetmap.org", "maps.google.com", "maps.googleapis.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn("SW precache: baadhi ya faili hazikupatikana", err))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n.startsWith("ujasi-") && n !== STATIC_CACHE && n !== PAGES_CACHE)
          .map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if(req.method !== "GET") return; // usihifadhi POST/PUT (fetch za malipo/oda)

  const url = new URL(req.url);
  if(NEVER_CACHE_HOSTS.some((h) => url.hostname.includes(h))) return; // acha ipite moja kwa moja

  // 1) Kurasa za HTML (navigation) - NETWORK-FIRST, fallback cache
  if(req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")){
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGES_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("/index.html")))
    );
    return;
  }

  // 2) Faili za mfumo wa ndani (same-origin static assets) - CACHE-FIRST
  if(url.origin === self.location.origin){
    event.respondWith(
      caches.match(req).then((cached) => {
        if(cached) return cached;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
          return res;
        });
      })
    );
    return;
  }

  // 3) Rasilimali za nje (fonts, Firebase SDK, n.k.) - STALE-WHILE-REVALIDATE
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});

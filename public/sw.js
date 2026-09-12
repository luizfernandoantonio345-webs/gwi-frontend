// Service worker do GWI Materiais — cache apenas do app shell (assets estáticos).
// Nunca faz cache de chamadas de API (essas são cross-origin e/ou não-GET).
const CACHE = "gwi-shell-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Só tratamos requisições da própria origem (o app). API fica de fora.
  if (url.origin !== self.location.origin) return;

  // Navegações (HTML): rede primeiro, cai para o cache offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put("/index.html", copia));
          return resp;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Assets com hash no nome (/assets/*): cache primeiro.
  event.respondWith(
    caches.match(request).then((cache) =>
      cache ||
      fetch(request).then((resp) => {
        if (resp.ok && (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/"))) {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(request, copia));
        }
        return resp;
      })
    )
  );
});

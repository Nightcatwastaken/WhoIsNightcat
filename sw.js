// Keeps the page and its images in the browser cache so reloads draw instantly.
// Bump CACHE whenever the page or any image changes, so visitors get the new files.
const CACHE = "nightcat-v2";
const PRECACHE = [
  "./",
  "./index.html",
  "./nightfat_with_a_umbrella.png",
  "./discord.svg",
  "./github.svg",
  "./osu.svg",
  "./reddit.svg",
  "./roblox.svg",
  "./twitch.svg",
  "./x.svg",
  "./youtube.svg",
];
// Live status and tally always come from the network, never the cache.
const API_HOST = "pine64.tail5204a4.ts.net";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.hostname === API_HOST) return;

  const isPage = req.mode === "navigate";
  const isImage = req.destination === "image" || /\.(png|svg)$/i.test(url.pathname);
  if (!isPage && !isImage) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      // Images: serve from cache when we have them.
      if (isImage && cached) return cached;
      // Pages: show the cached copy straight away and refresh it in the background.
      const network = fetch(req).then((res) => {
        if (res.ok || res.type === "opaque") cache.put(req, res.clone());
        return res;
      });
      if (cached) {
        network.catch(() => {});
        return cached;
      }
      return network;
    }).catch(() => fetch(req))
  );
});
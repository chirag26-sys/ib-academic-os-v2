// service-worker.js — caches the app shell only. Your data lives in
// IndexedDB, never in this cache, so bumping CACHE_NAME never touches
// your data — it only forces a fresh copy of the app's code.

const CACHE_NAME = "ib-academic-os-v1";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/db.js",
  "./js/priority.js",
  "./js/router.js",
  "./js/app.js",
  "./js/ai/provider.js",
  "./js/modules/dashboard.js",
  "./js/modules/subjects.js",
  "./js/modules/tasks.js",
  "./js/modules/assessments.js",
  "./js/modules/planner.js",
  "./js/modules/grades.js",
  "./js/modules/errors.js",
  "./js/modules/timer.js",
  "./js/modules/resources.js",
  "./js/modules/settings.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

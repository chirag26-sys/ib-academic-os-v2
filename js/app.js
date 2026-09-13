// app.js — boots the DB, registers the service worker, and does the
// initial route render. Modules self-register their routes on load
// (see index.html script order).

async function boot() {
  await DB.openDB();

  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("service-worker.js");
    } catch (err) {
      console.warn("Service worker registration failed:", err);
    }
  }

  Router.renderRoute();
}

window.addEventListener("DOMContentLoaded", boot);

// app.js — boots the DB, registers the service worker, wires up
// quick-add and the mobile "More" sheet, then does the initial route
// render. Modules self-register their routes on load (see index.html
// script order).

async function boot() {
  await DB.openDB();

  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("service-worker.js");
    } catch (err) {
      console.warn("Service worker registration failed:", err);
    }
  }

  initQuickAdd();
  initMobileMore();
  Router.renderRoute();
}

// On mobile the bottom nav's "More" button just reveals the full
// sidebar as a slide-up sheet — same nav markup, no duplicate list to
// maintain.
function initMobileMore() {
  const moreBtn = document.getElementById("bottom-nav-more");
  const nav = document.getElementById("nav");
  moreBtn.onclick = (e) => {
    e.preventDefault();
    nav.classList.toggle("mobile-open");
  };
  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => nav.classList.remove("mobile-open"));
  });
}

window.addEventListener("DOMContentLoaded", boot);

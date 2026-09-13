// router.js — minimal hash router. Each module registers a render(main)
// function; the router calls it and manages the active nav link.

const routes = {};

function registerRoute(path, renderFn) {
  routes[path] = renderFn;
}

async function renderRoute() {
  const hash = window.location.hash.replace(/^#/, "") || "/dashboard";
  const path = hash.split("?")[0];
  const main = document.getElementById("main");
  const renderFn = routes[path] || routes["/dashboard"];

  document.querySelectorAll("#nav a, #bottom-nav a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === "#" + path);
  });

  main.innerHTML = '<p class="muted">Loading…</p>';
  try {
    await renderFn(main);
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="card r"><h2>Something broke</h2><p>${err.message}</p></div>`;
  }
}

window.Router = { registerRoute, renderRoute };
window.renderRoute = renderRoute; // convenient global alias used by modules after mutations
window.addEventListener("hashchange", renderRoute);

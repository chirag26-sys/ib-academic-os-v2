async function renderLife(main) {
  const all = await DB.Store.getAll("events");
  const templates = all.filter((e) => e.weekday != null && !e.date);
  const byDay = {};
  for (const t of templates) (byDay[t.weekday] = byDay[t.weekday] || []).push(t);

  const unresolved = templates.find((t) => t.id === "flex-wed");

  main.innerHTML = `
    <h1>Life</h1>
    <p class="muted">Your recurring weekly commitments — cricket and gym are treated as real, not as wasted time. Edit any default here; one-off changes (a single cancelled Tuesday) happen in Calendar instead.</p>

    ${unresolved && !unresolved.resolved ? `
      <div class="card r">
        <h2>Needs your input: Wednesday</h2>
        <p>You said two different things about Wednesday afternoons — "gym or cricket depending on the week" and also "try not to do gym nor cricket this day." I've seeded it as optional/off by default so the planner doesn't overcommit you. Pick one:</p>
        <button data-wed="off">Treat Wednesday as a rest day (default)</button>
        <button data-wed="flex" class="ghost">It's genuinely flexible — keep the slot open for gym/cricket</button>
      </div>
    ` : ""}

    ${WEEKDAY_LABELS.map((label, i) => {
      const wd = i + 1;
      const items = (byDay[wd] || []).sort((a, b) => (a.start || "99:99").localeCompare(b.start || "99:99"));
      return `
        <h2 class="mt">${label}</h2>
        ${items.length ? items.map((t) => templateRow(t)).join("") : `<div class="empty">Nothing recurring this day.</div>`}
      `;
    }).join("")}
  `;

  const wedBtns = main.querySelectorAll("[data-wed]");
  wedBtns.forEach((btn) => {
    btn.onclick = async () => {
      const ev = await DB.Store.get("events", "flex-wed");
      ev.resolved = true;
      ev.conditional = btn.dataset.wed === "off" ? "Resolved: Wednesday is a rest day by default." : "Resolved: genuinely flexible — open slot.";
      await DB.Store.put("events", ev);
      renderRoute();
    };
  });

  main.querySelectorAll("[data-save-template]").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.saveTemplate;
      const ev = await DB.Store.get("events", id);
      ev.start = document.getElementById(`t-start-${id}`).value || null;
      ev.end = document.getElementById(`t-end-${id}`).value || null;
      ev.fixed = document.getElementById(`t-fixed-${id}`).value === "true";
      ev.flexible = !ev.fixed;
      await DB.Store.put("events", ev);
      renderRoute();
    };
  });
}

function templateRow(t) {
  return `
    <div class="card">
      <div class="flex-between">
        <strong>${t.title}</strong>
        <span class="tag">${t.type}</span>
      </div>
      ${t.conditional ? `<p class="muted">${t.conditional}</p>` : ""}
      ${t.notes ? `<p class="muted" style="font-size:0.8rem;">${t.notes}</p>` : ""}
      <div class="row mt">
        <div class="col"><label>Start</label><input id="t-start-${t.id}" type="time" value="${t.start || ""}" style="width:100%"></div>
        <div class="col"><label>End</label><input id="t-end-${t.id}" type="time" value="${t.end || ""}" style="width:100%"></div>
        <div class="col">
          <label>Fixed?</label>
          <select id="t-fixed-${t.id}" style="width:100%">
            <option value="false" ${!t.fixed ? "selected" : ""}>No — flexible</option>
            <option value="true" ${t.fixed ? "selected" : ""}>Yes — fixed</option>
          </select>
        </div>
      </div>
      <button class="ghost mt" data-save-template="${t.id}">Save</button>
    </div>
  `;
}

Router.registerRoute("/life", renderLife);

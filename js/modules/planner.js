function isoDate(d) { return d.toISOString().slice(0, 10); }
function startOfWeek(d) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday;
}

async function renderPlanner(main) {
  const today = new Date();
  const dateStr = isoDate(today);
  const [plan, settings, subjects] = await Promise.all([
    DB.Store.get("dailyPlans", dateStr),
    getSettings(),
    DB.Store.getAll("subjects"),
  ]);
  const blocks = (plan && plan.blocks) || [];
  const totalMin = blocks.reduce((sum, b) => sum + (Number(b.duration) || 0), 0);
  const isWeekend = [0, 6].includes(today.getDay());
  const cap = isWeekend ? settings.maxStudyMinWeekend : settings.maxStudyMinWeekday;

  main.innerHTML = `
    <h1>Planner</h1>
    <div class="row">
      <div class="col">
        <h2>Today — ${dateStr}</h2>
        <div class="card ${totalMin > cap ? "r" : "g"}">
          <div class="flex-between">
            <span>Planned: <strong>${totalMin}</strong> min</span>
            <span class="muted">Cap: ${cap} min${isWeekend ? " (weekend)" : ""}</span>
          </div>
          ${totalMin > cap ? `<p class="muted mt">Over your configured cap — this is a scheduling warning, not a judgment. Consider moving something to tomorrow.</p>` : ""}
        </div>

        <div class="card">
          <h2>Add block</h2>
          <div class="row">
            <div class="col"><label>Time</label><input id="p-time" type="time" style="width:100%"></div>
            <div class="col"><label>Duration (min)</label><input id="p-dur" type="number" min="5" step="5" style="width:100%"></div>
            <div class="col">
              <label>Subject</label>
              <select id="p-subject" style="width:100%">
                <option value="">—</option>
                ${subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}
              </select>
            </div>
          </div>
          <label>Note</label>
          <input id="p-note" type="text" style="width:100%" placeholder="e.g. Redo error-log items from Math">
          <button id="add-block" class="mt">Add block</button>
        </div>

        ${blocks.length ? blocks.map((b, i) => `
          <div class="card">
            <div class="flex-between">
              <span class="mono">${b.time || "—"} · ${b.duration || "?"}min</span>
              <button class="ghost danger" data-remove-block="${i}">Remove</button>
            </div>
            <div class="muted">${(subjects.find((s) => s.id === b.subjectId) || {}).name || "—"}${b.note ? ` — ${b.note}` : ""}</div>
          </div>
        `).join("") : `<div class="empty">No blocks yet today.</div>`}
      </div>

      <div class="col">
        <h2>This week</h2>
        <div id="week-view"></div>
      </div>
    </div>
  `;

  document.getElementById("add-block").onclick = async () => {
    const newBlock = {
      time: document.getElementById("p-time").value,
      duration: Number(document.getElementById("p-dur").value) || null,
      subjectId: document.getElementById("p-subject").value || null,
      note: document.getElementById("p-note").value.trim(),
    };
    const current = (await DB.Store.get("dailyPlans", dateStr)) || { date: dateStr, blocks: [], threeWins: ["", "", ""] };
    current.blocks.push(newBlock);
    await DB.Store.put("dailyPlans", current);
    renderRoute();
  };

  main.querySelectorAll("[data-remove-block]").forEach((btn) => {
    btn.onclick = async () => {
      const idx = Number(btn.dataset.removeBlock);
      const current = await DB.Store.get("dailyPlans", dateStr);
      current.blocks.splice(idx, 1);
      await DB.Store.put("dailyPlans", current);
      renderRoute();
    };
  });

  renderWeekView(startOfWeek(today));
}

async function renderWeekView(monday) {
  const el = document.getElementById("week-view");
  if (!el) return;
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const rows = await Promise.all(
    days.map(async (d) => {
      const ds = isoDate(d);
      const plan = await DB.Store.get("dailyPlans", ds);
      const min = ((plan && plan.blocks) || []).reduce((s, b) => s + (Number(b.duration) || 0), 0);
      return { label: d.toLocaleDateString(undefined, { weekday: "short" }), ds, min };
    })
  );
  el.innerHTML = rows.map((r) => `
    <div class="card" style="padding:10px 16px;">
      <div class="flex-between">
        <span>${r.label} <span class="muted mono">${r.ds}</span></span>
        <span class="mono">${r.min}min</span>
      </div>
    </div>
  `).join("");
}

async function getSettings() {
  const rows = await DB.Store.getAll("settings");
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    maxStudyMinWeekday: map.maxStudyMinWeekday ?? 180,
    maxStudyMinWeekend: map.maxStudyMinWeekend ?? 240,
  };
}

Router.registerRoute("/planner", renderPlanner);

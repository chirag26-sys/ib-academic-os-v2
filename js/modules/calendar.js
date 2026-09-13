const EVENT_TYPES = ["school", "gym", "cricket", "social", "sleep", "meal", "travel", "appointment", "family", "flex", "other"];
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

let _calWeekStart = startOfCalWeek(new Date());

function startOfCalWeek(d) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

async function renderCalendar(main) {
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(_calWeekStart);
    d.setDate(_calWeekStart.getDate() + i);
    return d;
  });

  const dayData = await Promise.all(days.map(async (d) => ({ date: d, occurrences: await occurrencesForDate(d) })));

  main.innerHTML = `
    <div class="flex-between">
      <h1>Calendar</h1>
      <div>
        <button class="ghost" id="cal-prev">← Prev week</button>
        <button class="ghost" id="cal-today">This week</button>
        <button class="ghost" id="cal-next">Next week →</button>
      </div>
    </div>

    <div class="card">
      <h2>Add event</h2>
      <div class="row">
        <div class="col"><label>Title</label><input id="ev-title" type="text" style="width:100%"></div>
        <div class="col">
          <label>Type</label>
          <select id="ev-type" style="width:100%">${EVENT_TYPES.map((t) => `<option value="${t}">${t}</option>`).join("")}</select>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <label>Recurrence</label>
          <select id="ev-recur" style="width:100%">
            <option value="once">One-off (specific date)</option>
            <option value="weekly">Weekly (recurring)</option>
          </select>
        </div>
        <div class="col" id="ev-date-wrap"><label>Date</label><input id="ev-date" type="date" style="width:100%"></div>
        <div class="col" id="ev-weekday-wrap" style="display:none;">
          <label>Day of week</label>
          <select id="ev-weekday" style="width:100%">${WEEKDAY_LABELS.map((w, i) => `<option value="${i + 1}">${w}</option>`).join("")}</select>
        </div>
      </div>
      <div class="row">
        <div class="col"><label>Start (optional)</label><input id="ev-start" type="time" style="width:100%"></div>
        <div class="col"><label>End (optional)</label><input id="ev-end" type="time" style="width:100%"></div>
        <div class="col"><label>Fixed (non-negotiable)?</label><select id="ev-fixed" style="width:100%"><option value="false">No — flexible</option><option value="true">Yes — fixed</option></select></div>
      </div>
      <label>Location (optional)</label>
      <input id="ev-location" type="text" style="width:100%">
      <label>Notes</label>
      <input id="ev-notes" type="text" style="width:100%">
      <button id="add-event" class="mt">Add event</button>
    </div>

    <div class="row mt">
      ${dayData.map(({ date, occurrences }) => dayColumn(date, occurrences)).join("")}
    </div>
  `;

  document.getElementById("ev-recur").onchange = (e) => {
    const weekly = e.target.value === "weekly";
    document.getElementById("ev-date-wrap").style.display = weekly ? "none" : "";
    document.getElementById("ev-weekday-wrap").style.display = weekly ? "" : "none";
  };

  document.getElementById("cal-prev").onclick = () => { _calWeekStart.setDate(_calWeekStart.getDate() - 7); renderRoute(); };
  document.getElementById("cal-next").onclick = () => { _calWeekStart.setDate(_calWeekStart.getDate() + 7); renderRoute(); };
  document.getElementById("cal-today").onclick = () => { _calWeekStart = startOfCalWeek(new Date()); renderRoute(); };

  document.getElementById("add-event").onclick = async () => {
    const title = document.getElementById("ev-title").value.trim();
    if (!title) return;
    const recur = document.getElementById("ev-recur").value;
    const base = {
      id: `custom-${Date.now()}`,
      title,
      type: document.getElementById("ev-type").value,
      start: document.getElementById("ev-start").value || null,
      end: document.getElementById("ev-end").value || null,
      fixed: document.getElementById("ev-fixed").value === "true",
      flexible: document.getElementById("ev-fixed").value !== "true",
      conditional: null,
      location: document.getElementById("ev-location").value.trim() || null,
      notes: document.getElementById("ev-notes").value.trim() || null,
      exceptions: [],
    };
    if (recur === "weekly") {
      base.weekday = Number(document.getElementById("ev-weekday").value);
    } else {
      base.date = document.getElementById("ev-date").value;
      if (!base.date) return;
    }
    await DB.Store.put("events", base);
    renderRoute();
  };

  main.querySelectorAll("[data-cancel-occ]").forEach((btn) => {
    btn.onclick = async () => {
      const [id, date] = btn.dataset.cancelOcc.split("|");
      await Events.setOccurrenceException(id, date, { cancelled: true });
      renderRoute();
    };
  });
  main.querySelectorAll("[data-restore-occ]").forEach((btn) => {
    btn.onclick = async () => {
      const [id, date] = btn.dataset.restoreOcc.split("|");
      await Events.setOccurrenceException(id, date, null);
      renderRoute();
    };
  });
  main.querySelectorAll("[data-delete-event]").forEach((btn) => {
    btn.onclick = async () => { await DB.Store.delete("events", btn.dataset.deleteEvent); renderRoute(); };
  });
}

function occurrencesForDate(d) { return Events.occurrencesForDate(d); }

function dayColumn(date, occurrences) {
  const ds = Events.isoDate(date);
  const isToday = ds === Events.isoDate(new Date());
  return `
    <div class="col">
      <h3 style="${isToday ? "color:var(--accent)" : ""}">${date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</h3>
      ${occurrences.length ? occurrences.map((o) => occurrenceRow(o, ds)).join("") : `<div class="empty" style="padding:10px;font-size:0.8rem;">Nothing scheduled</div>`}
    </div>
  `;
}

function occurrenceRow(o, ds) {
  const isCancelledHere = o.cancelled === true;
  const timeLabel = o.start ? `${o.start}${o.end ? `–${o.end}` : ""}` : "no fixed time";
  const isRecurring = o.weekday != null && !o.date;
  return `
    <div class="card" style="padding:10px;${isCancelledHere ? "opacity:0.5;" : ""}">
      <div class="mono" style="font-size:0.75rem;">${timeLabel}</div>
      <div>${o.title}${o.conditional ? ` <span class="tag">${o.conditional}</span>` : ""}</div>
      ${o.notes ? `<div class="muted" style="font-size:0.75rem;">${o.notes}</div>` : ""}
      ${isRecurring
        ? isCancelledHere
          ? `<button class="ghost" style="font-size:0.7rem;padding:4px 8px;" data-restore-occ="${o.id}|${ds}">Restore this occurrence</button>`
          : `<button class="ghost" style="font-size:0.7rem;padding:4px 8px;" data-cancel-occ="${o.id}|${ds}">Cancel just this occurrence</button>`
        : `<button class="ghost danger" style="font-size:0.7rem;padding:4px 8px;" data-delete-event="${o.id}">Delete</button>`}
    </div>
  `;
}

Router.registerRoute("/calendar", renderCalendar);

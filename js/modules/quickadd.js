// quickadd.js — the permanent "+" button (spec §13). Renders once,
// outside the router, so it's available from every screen. Minimal
// typing: pick a type, fill only what matters, save.

const QUICK_ADD_TYPES = {
  task: { label: "Task", store: "tasks" },
  assessment: { label: "Assessment", store: "assessments" },
  event: { label: "Event", store: "events" },
  note: { label: "Note", store: "notes" },
  goal: { label: "Goal", store: "goals" },
};

function initQuickAdd() {
  const btn = document.createElement("button");
  btn.id = "quick-add-btn";
  btn.textContent = "+";
  btn.setAttribute("aria-label", "Quick add");
  document.body.appendChild(btn);

  const overlay = document.createElement("div");
  overlay.id = "quick-add-overlay";
  overlay.innerHTML = `
    <div id="quick-add-sheet">
      <div class="flex-between">
        <h2>Quick add</h2>
        <button class="ghost" id="qa-close">Close</button>
      </div>
      <div id="qa-type-picker">
        ${Object.entries(QUICK_ADD_TYPES).map(([key, t]) => `<button class="ghost" data-qa-type="${key}">${t.label}</button>`).join("")}
      </div>
      <div id="qa-form"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  btn.onclick = () => openQuickAdd();
  overlay.querySelector("#qa-close").onclick = () => closeQuickAdd();
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeQuickAdd(); });
  overlay.querySelectorAll("[data-qa-type]").forEach((b) => {
    b.onclick = () => renderQuickAddForm(b.dataset.qaType);
  });
}

function openQuickAdd() {
  document.getElementById("quick-add-overlay").classList.add("open");
  document.getElementById("qa-form").innerHTML = "";
}
function closeQuickAdd() {
  document.getElementById("quick-add-overlay").classList.remove("open");
}

async function renderQuickAddForm(type) {
  const form = document.getElementById("qa-form");
  const subjects = await DB.Store.getAll("subjects");
  const subjectOptions = subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");

  const fieldsByType = {
    task: `
      <input id="qa-title" type="text" placeholder="Task title" style="width:100%">
      <select id="qa-subject" style="width:100%">${subjectOptions}</select>
      <input id="qa-date" type="date" style="width:100%">
    `,
    assessment: `
      <input id="qa-title" type="text" placeholder="Assessment title" style="width:100%">
      <select id="qa-subject" style="width:100%">${subjectOptions}</select>
      <input id="qa-date" type="date" style="width:100%">
    `,
    event: `
      <input id="qa-title" type="text" placeholder="Event title" style="width:100%">
      <input id="qa-date" type="date" style="width:100%">
      <input id="qa-start" type="time" style="width:100%">
      <input id="qa-end" type="time" style="width:100%">
    `,
    note: `<textarea id="qa-title" placeholder="Note" style="width:100%" rows="3"></textarea>`,
    goal: `
      <input id="qa-title" type="text" placeholder="Goal" style="width:100%">
      <select id="qa-scope" style="width:100%"><option value="week">This week</option><option value="term">This term</option><option value="year">1 year</option><option value="long_term">Long-term</option></select>
    `,
  };

  form.innerHTML = `
    <h3>${QUICK_ADD_TYPES[type].label}</h3>
    ${fieldsByType[type]}
    <button id="qa-save" class="mt">Save</button>
  `;

  document.getElementById("qa-save").onclick = async () => {
    const titleVal = document.getElementById("qa-title").value.trim();
    if (!titleVal) return;
    let row;
    if (type === "task") {
      row = { title: titleVal, subjectId: document.getElementById("qa-subject").value, dueDate: document.getElementById("qa-date").value || null, priority: null, status: "todo", source: "manual", createdAt: new Date().toISOString() };
    } else if (type === "assessment") {
      row = { title: titleVal, subjectId: document.getElementById("qa-subject").value, date: document.getElementById("qa-date").value || null, topics: [], status: "upcoming" };
    } else if (type === "event") {
      row = { id: `custom-${Date.now()}`, title: titleVal, type: "other", date: document.getElementById("qa-date").value || null, start: document.getElementById("qa-start").value || null, end: document.getElementById("qa-end").value || null, fixed: false, flexible: true, conditional: null, notes: null, exceptions: [] };
    } else if (type === "note") {
      row = { text: titleVal, createdAt: new Date().toISOString() };
    } else if (type === "goal") {
      row = { text: titleVal, scope: document.getElementById("qa-scope").value, createdAt: new Date().toISOString() };
    }
    await DB.Store.put(QUICK_ADD_TYPES[type].store, row);
    closeQuickAdd();
    renderRoute();
  };
}

window.initQuickAdd = initQuickAdd;

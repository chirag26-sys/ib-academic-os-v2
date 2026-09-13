async function renderErrors(main) {
  const [errors, subjects] = await Promise.all([DB.Store.getAll("errors"), DB.Store.getAll("subjects")]);
  const subjectName = (id) => (subjects.find((s) => s.id === id) || {}).name || "—";
  const open = errors.filter((e) => !e.resolved);
  const resolved = errors.filter((e) => e.resolved);

  main.innerHTML = `
    <h1>Error Log</h1>
    <p class="muted">Mistake → cause → redo. The point is the pattern across entries, not any single mistake.</p>
    <div class="card">
      <h2>Log an error</h2>
      <div class="row">
        <div class="col">
          <label>Subject</label>
          <select id="e-subject" style="width:100%">${subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}</select>
        </div>
        <div class="col"><label>Topic</label><input id="e-topic" type="text" style="width:100%"></div>
        <div class="col"><label>Date</label><input id="e-date" type="date" style="width:100%"></div>
      </div>
      <label>Question / context</label>
      <input id="e-question" type="text" style="width:100%">
      <label>What went wrong</label>
      <input id="e-mistake" type="text" style="width:100%">
      <label>Cause tags (comma-separated — e.g. "rushed, misread question, formula mixup")</label>
      <input id="e-causes" type="text" style="width:100%">
      <div class="row">
        <div class="col">
          <label>Redo required?</label>
          <select id="e-redo" style="width:100%"><option value="true">Yes</option><option value="false">No</option></select>
        </div>
        <div class="col"><label>Retest date (optional)</label><input id="e-retest" type="date" style="width:100%"></div>
      </div>
      <button id="add-error" class="mt">Log it</button>
    </div>

    <h2 class="mt">Open (${open.length})</h2>
    ${open.length ? open.map((e) => errorCard(e, subjectName(e.subjectId))).join("") : `<div class="empty">No open error-log entries.</div>`}
    ${resolved.length ? `<h2 class="mt">Resolved (${resolved.length})</h2>${resolved.map((e) => errorCard(e, subjectName(e.subjectId))).join("")}` : ""}
  `;

  document.getElementById("add-error").onclick = async () => {
    const mistake = document.getElementById("e-mistake").value.trim();
    if (!mistake) return;
    await DB.Store.put("errors", {
      subjectId: document.getElementById("e-subject").value,
      topic: document.getElementById("e-topic").value.trim(),
      date: document.getElementById("e-date").value || new Date().toISOString().slice(0, 10),
      question: document.getElementById("e-question").value.trim(),
      mistake,
      causeTags: document.getElementById("e-causes").value.split(",").map((s) => s.trim()).filter(Boolean),
      redoRequired: document.getElementById("e-redo").value === "true",
      retestDate: document.getElementById("e-retest").value || null,
      resolved: false,
    });
    renderRoute();
  };

  main.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.onclick = async () => {
      const id = Number(btn.dataset.toggle);
      const e = await DB.Store.get("errors", id);
      e.resolved = !e.resolved;
      await DB.Store.put("errors", e);
      renderRoute();
    };
  });
  main.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.onclick = async () => { await DB.Store.delete("errors", Number(btn.dataset.delete)); renderRoute(); };
  });
}

function errorCard(e, subjectName) {
  return `
    <div class="card ${e.resolved ? "" : "y"}">
      <div class="flex-between">
        <strong>${subjectName} — ${e.topic || "untitled topic"}</strong>
        <span class="mono">${e.date}</span>
      </div>
      <p class="mt">${e.mistake}</p>
      ${e.causeTags && e.causeTags.length ? `<div>${e.causeTags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>` : ""}
      ${e.retestDate ? `<p class="muted mt">Retest: ${e.retestDate}</p>` : ""}
      <div class="mt">
        <button class="ghost" data-toggle="${e.id}">${e.resolved ? "Reopen" : "Mark resolved"}</button>
        <button class="ghost danger" data-delete="${e.id}">Delete</button>
      </div>
    </div>
  `;
}

Router.registerRoute("/errors", renderErrors);

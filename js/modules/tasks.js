async function renderTasks(main) {
  const [tasks, subjects, assessments] = await Promise.all([DB.Store.getAll("tasks"), DB.Store.getAll("subjects"), DB.Store.getAll("assessments")]);
  const subjectName = (id) => (subjects.find((s) => s.id === id) || {}).name || "—";
  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");
  const assessmentName = (id) => { const a = assessments.find((x) => x.id === id); return a ? `${a.title} · ${a.date}` : "—"; };

  main.innerHTML = `
    <h1>Tasks</h1>
    <div class="card">
      <h2>New task</h2>
      <label>Title</label>
      <input id="t-title" type="text" style="width:100%">
      <div class="row">
        <div class="col">
          <label>Subject</label>
          <select id="t-subject" style="width:100%">
            ${subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}
          </select>
        </div>
        <div class="col">
          <label>Due date</label>
          <input id="t-due" type="date" style="width:100%">
        </div>
        <div class="col">
          <label>Est. minutes</label>
          <input id="t-duration" type="number" min="5" step="5" style="width:100%">
        </div>
        <div class="col">
          <label>Manual priority (optional)</label>
          <select id="t-priority" style="width:100%">
            <option value="">Auto</option>
            <option value="R">Red</option>
            <option value="Y">Yellow</option>
            <option value="G">Green</option>
          </select>
        </div>
        <div class="col">
          <label>Linked assessment (optional)</label>
          <select id="t-assessment" style="width:100%">
            <option value="">None</option>
            ${assessments.filter((a) => a.status !== "done").sort((a,b) => new Date(a.date)-new Date(b.date)).map((a) => `<option value="${a.id}">${a.title} · ${a.date}</option>`).join("")}
          </select>
        </div>
      </div>
      <button id="add-task" class="mt">Add task</button>
    </div>

    <h2 class="mt">Open (${open.length})</h2>
    ${open.length ? open.map((t) => taskCard(t, subjectName(t.subjectId), false, assessments, assessmentName)).join("") : `<div class="empty">Nothing open. Add your first task above.</div>`}

    ${done.length ? `<h2 class="mt">Done (${done.length})</h2>${done.map((t) => taskCard(t, subjectName(t.subjectId), true, assessments, assessmentName)).join("")}` : ""}
  `;

  document.getElementById("add-task").onclick = async () => {
    const title = document.getElementById("t-title").value.trim();
    if (!title) return;
    await DB.Store.put("tasks", {
      subjectId: document.getElementById("t-subject").value,
      title,
      dueDate: document.getElementById("t-due").value || null,
      durationMin: Number(document.getElementById("t-duration").value) || null,
      priority: document.getElementById("t-priority").value || null,
      assessmentId: Number(document.getElementById("t-assessment").value) || null,
      status: "todo",
      source: "manual",
      createdAt: new Date().toISOString(),
    });
    renderRoute();
  };

  main.querySelectorAll("[data-complete]").forEach((btn) => {
    btn.onclick = async () => {
      const id = Number(btn.dataset.complete);
      const task = await DB.Store.get("tasks", id);
      task.status = task.status === "done" ? "todo" : "done";
      await DB.Store.put("tasks", task);
      renderRoute();
    };
  });
  main.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.onclick = async () => {
      await DB.Store.delete("tasks", Number(btn.dataset.delete));
      renderRoute();
    };
  });
}

function taskCard(t, subjectName, isDone, assessments, assessmentName) {
  const linkedAssessment = assessments.find((a) => a.id === t.assessmentId) || null;
  const p = Priority.computePriority(t, linkedAssessment);
  return `
    <div class="card ${isDone ? "" : p.toLowerCase()}">
      <div class="flex-between">
        <div>${isDone ? "" : `<span class="dot ${p.toLowerCase()}"></span>`}<strong style="${isDone ? "text-decoration:line-through;color:var(--text-muted)" : ""}">${t.title}</strong></div>
        <span class="mono">${t.dueDate || "no date"}</span>
      </div>
      <div class="muted">${subjectName}${t.durationMin ? ` · ~${t.durationMin}min` : ""}${linkedAssessment ? ` · assessment: ${assessmentName(t.assessmentId)}` : ""}</div>
      <div class="mt">
        <button class="ghost" data-complete="${t.id}">${isDone ? "Reopen" : "Mark done"}</button>
        <button class="ghost danger" data-delete="${t.id}">Delete</button>
      </div>
    </div>
  `;
}

Router.registerRoute("/tasks", renderTasks);

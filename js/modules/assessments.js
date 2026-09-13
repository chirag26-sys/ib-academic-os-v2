async function renderAssessments(main) {
  const [assessments, subjects] = await Promise.all([DB.Store.getAll("assessments"), DB.Store.getAll("subjects")]);
  const subjectName = (id) => (subjects.find((s) => s.id === id) || {}).name || "—";
  const upcoming = assessments.filter((a) => a.status !== "done").sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = assessments.filter((a) => a.status === "done").sort((a, b) => new Date(b.date) - new Date(a.date));

  main.innerHTML = `
    <h1>Assessments</h1>
    <div class="card">
      <h2>New assessment</h2>
      <label>Title</label>
      <input id="a-title" type="text" style="width:100%" placeholder="e.g. Sequences &amp; series test">
      <div class="row">
        <div class="col">
          <label>Subject</label>
          <select id="a-subject" style="width:100%">${subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}</select>
        </div>
        <div class="col"><label>Date</label><input id="a-date" type="date" style="width:100%"></div>
        <div class="col"><label>Time (optional)</label><input id="a-time" type="time" style="width:100%"></div>
        <div class="col"><label>Weight % (optional)</label><input id="a-weight" type="number" min="0" max="100" style="width:100%"></div>
      </div>
      <label>Topics (comma-separated, optional)</label>
      <input id="a-topics" type="text" style="width:100%">
      <button id="add-assess" class="mt">Add assessment</button>
    </div>

    <h2 class="mt">Upcoming (${upcoming.length})</h2>
    ${upcoming.length ? upcoming.map((a) => assessCard(a, subjectName(a.subjectId))).join("") : `<div class="empty">Nothing logged. Add Wednesday's Math test, Thursday's Dutch test, Friday's CS test above.</div>`}
    ${past.length ? `<h2 class="mt">Past (${past.length})</h2>${past.map((a) => assessCard(a, subjectName(a.subjectId))).join("")}` : ""}
  `;

  document.getElementById("add-assess").onclick = async () => {
    const title = document.getElementById("a-title").value.trim();
    const date = document.getElementById("a-date").value;
    if (!title || !date) return;
    await DB.Store.put("assessments", {
      subjectId: document.getElementById("a-subject").value,
      title,
      date,
      time: document.getElementById("a-time").value || null,
      weight: Number(document.getElementById("a-weight").value) || null,
      topics: document.getElementById("a-topics").value.split(",").map((s) => s.trim()).filter(Boolean),
      status: "upcoming",
    });
    renderRoute();
  };

  main.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.onclick = async () => {
      const id = Number(btn.dataset.toggle);
      const a = await DB.Store.get("assessments", id);
      a.status = a.status === "done" ? "upcoming" : "done";
      await DB.Store.put("assessments", a);
      renderRoute();
    };
  });
  main.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.onclick = async () => { await DB.Store.delete("assessments", Number(btn.dataset.delete)); renderRoute(); };
  });
}

function assessCard(a, subjectName) {
  const days = Math.ceil(Priority.daysUntil(a.date));
  return `
    <div class="card">
      <div class="flex-between">
        <strong>${a.title}</strong>
        <span class="mono">${a.status === "done" ? "done" : days >= 0 ? `${days}d` : "past"}</span>
      </div>
      <div class="muted">${subjectName} · ${a.date}${a.time ? ` ${a.time}` : ""}${a.weight ? ` · ${a.weight}%` : ""}</div>
      ${a.topics && a.topics.length ? `<div class="mt">${a.topics.map((t) => `<span class="tag">${t}</span>`).join("")}</div>` : ""}
      <div class="mt">
        <button class="ghost" data-toggle="${a.id}">${a.status === "done" ? "Mark upcoming" : "Mark done"}</button>
        <button class="ghost danger" data-delete="${a.id}">Delete</button>
      </div>
    </div>
  `;
}

Router.registerRoute("/assessments", renderAssessments);

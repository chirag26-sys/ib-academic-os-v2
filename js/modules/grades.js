async function renderGrades(main) {
  const [grades, subjects] = await Promise.all([DB.Store.getAll("grades"), DB.Store.getAll("subjects")]);
  const subjectName = (id) => (subjects.find((s) => s.id === id) || {}).name || "—";
  const sorted = [...grades].sort((a, b) => new Date(b.date) - new Date(a.date));

  main.innerHTML = `
    <h1>Grades</h1>
    <div class="card">
      <h2>Log a grade</h2>
      <div class="row">
        <div class="col">
          <label>Subject</label>
          <select id="g-subject" style="width:100%">${subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}</select>
        </div>
        <div class="col"><label>Date</label><input id="g-date" type="date" style="width:100%"></div>
        <div class="col"><label>Score</label><input id="g-score" type="number" style="width:100%"></div>
        <div class="col"><label>Out of</label><input id="g-max" type="number" style="width:100%"></div>
      </div>
      <div class="row">
        <div class="col"><label>IB grade estimate (1-7, optional)</label><input id="g-ib" type="number" min="1" max="7" style="width:100%"></div>
        <div class="col">
          <label>Is this a school-issued estimate?</label>
          <select id="g-is-school" style="width:100%"><option value="false">No — my own tracking</option><option value="true">Yes — school-issued</option></select>
        </div>
      </div>
      <label>Teacher feedback (optional)</label>
      <textarea id="g-feedback" style="width:100%" rows="2"></textarea>
      <button id="add-grade" class="mt">Log grade</button>
    </div>

    <h2 class="mt">History (${sorted.length})</h2>
    ${sorted.length ? sorted.map((g) => `
      <div class="card">
        <div class="flex-between">
          <strong>${subjectName(g.subjectId)}</strong>
          <span class="mono">${g.date}</span>
        </div>
        <div class="muted">
          ${g.score}/${g.max}${g.ibGradeEstimate ? ` · IB est. ${g.ibGradeEstimate}${g.isSchoolEstimate ? " (school)" : " (self)"}` : ""}
        </div>
        ${g.teacherFeedback ? `<p class="mt">${g.teacherFeedback}</p>` : ""}
        <div class="mt"><button class="ghost danger" data-delete="${g.id}">Delete</button></div>
      </div>
    `).join("") : `<div class="empty">Nothing logged yet.</div>`}
  `;

  document.getElementById("add-grade").onclick = async () => {
    const date = document.getElementById("g-date").value;
    const score = document.getElementById("g-score").value;
    if (!date || score === "") return;
    await DB.Store.put("grades", {
      subjectId: document.getElementById("g-subject").value,
      date,
      score: Number(score),
      max: Number(document.getElementById("g-max").value) || null,
      ibGradeEstimate: Number(document.getElementById("g-ib").value) || null,
      isSchoolEstimate: document.getElementById("g-is-school").value === "true",
      teacherFeedback: document.getElementById("g-feedback").value.trim() || null,
    });
    renderRoute();
  };

  main.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.onclick = async () => { await DB.Store.delete("grades", Number(btn.dataset.delete)); renderRoute(); };
  });
}

Router.registerRoute("/grades", renderGrades);

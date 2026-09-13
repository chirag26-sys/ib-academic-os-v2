async function renderSubjects(main) {
  const [subjects, tasks, assessments] = await Promise.all([
    DB.Store.getAll("subjects"),
    DB.Store.getAll("tasks"),
    DB.Store.getAll("assessments"),
  ]);

  main.innerHTML = `
    <h1>Subjects</h1>
    <p class="muted">Fixed for this build — confirmed as your current six. Editing subjects isn't in MVP; ping me if this list ever needs to change.</p>
    <div class="row">
      ${subjects.map((s) => {
        const openTasks = tasks.filter((t) => t.subjectId === s.id && t.status !== "done").length;
        const nextAssess = assessments
          .filter((a) => a.subjectId === s.id && a.status !== "done")
          .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
        return `
          <div class="col">
            <div class="card" style="border-left:3px solid ${s.color}">
              <h2>${s.name}</h2>
              <div class="tag">${s.level}</div>
              <p class="muted mt">${openTasks} open task${openTasks === 1 ? "" : "s"}</p>
              <p class="muted">${nextAssess ? `Next: ${nextAssess.title} (${nextAssess.date})` : "No upcoming assessment logged"}</p>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

Router.registerRoute("/subjects", renderSubjects);

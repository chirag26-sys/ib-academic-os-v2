async function renderDashboard(main) {
  const today = new Date().toISOString().slice(0, 10);
  const [tasks, assessments, subjects, plan] = await Promise.all([
    DB.Store.getAll("tasks"),
    DB.Store.getAll("assessments"),
    DB.Store.getAll("subjects"),
    DB.Store.get("dailyPlans", today),
  ]);

  const subjectName = (id) => (subjects.find((s) => s.id === id) || {}).name || "—";
  const assessmentById = (id) => assessments.find((a) => a.id === id) || null;
  const open = tasks.filter((t) => t.status !== "done");
  const withPriority = open.map((t) => ({ ...t, p: Priority.computePriority(t, assessmentById(t.assessmentId)) }));
  const order = { R: 0, Y: 1, G: 2 };
  withPriority.sort((a, b) => order[a.p] - order[b.p]);

  const upcoming = assessments
    .filter((a) => a.status !== "done")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  const threeWins = (plan && plan.threeWins) || ["", "", ""];

  main.innerHTML = `
    <h1>Dashboard</h1>
    <p class="muted">${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>

    <div class="card">
      <div class="flex-between">
        <h2>What should I do now?</h2>
        <button id="ask-ai-btn">Generate prompt</button>
      </div>
      <p class="muted">Builds a prompt from your real tasks and assessments below — paste it into any AI chat.</p>
      <pre class="prompt-output" id="ai-output" style="display:none;"></pre>
    </div>

    <div class="row">
      <div class="col">
        <h2>Today's three wins</h2>
        <div class="card">
          ${[0, 1, 2].map((i) => `<input type="text" data-win="${i}" value="${(threeWins[i] || "").replace(/"/g, "&quot;")}" placeholder="Win ${i + 1}" style="width:100%; margin-bottom:8px;">`).join("")}
          <button id="save-wins" class="ghost">Save wins</button>
        </div>
      </div>
      <div class="col">
        <h2>Upcoming assessments</h2>
        ${upcoming.length ? upcoming.map((a) => `
          <div class="card">
            <div class="flex-between">
              <strong>${a.title}</strong>
              <span class="mono">${Math.max(0, Math.ceil(Priority.daysUntil(a.date)))}d</span>
            </div>
            <div class="muted">${subjectName(a.subjectId)} · ${a.date}${a.weight ? ` · ${a.weight}%` : ""}</div>
          </div>
        `).join("") : `<div class="empty">No assessments logged yet. Add one on the Assessments page.</div>`}
      </div>
    </div>

    <h2 class="mt">Open tasks by priority</h2>
    ${withPriority.length ? withPriority.map((t) => `
      <div class="card ${t.p.toLowerCase()}">
        <div class="flex-between">
          <div><span class="dot ${t.p.toLowerCase()}"></span><strong>${t.title}</strong></div>
          <span class="mono">${t.dueDate || "no date"}</span>
        </div>
        <div class="muted">${subjectName(t.subjectId)}${t.durationMin ? ` · ~${t.durationMin}min` : ""}</div>
      </div>
    `).join("") : `<div class="empty">No open tasks. Add one on the Tasks page.</div>`}
  `;

  document.getElementById("save-wins").onclick = async () => {
    const wins = [0, 1, 2].map((i) => main.querySelector(`[data-win="${i}"]`).value);
    await DB.Store.put("dailyPlans", { date: today, blocks: (plan && plan.blocks) || [], threeWins: wins });
    renderRoute();
  };

  document.getElementById("ask-ai-btn").onclick = async () => {
    const prompt = await AIProvider.buildWhatShouldIDoPrompt();
    const out = document.getElementById("ai-output");
    out.textContent = prompt;
    out.style.display = "block";
  };
}

Router.registerRoute("/dashboard", renderDashboard);

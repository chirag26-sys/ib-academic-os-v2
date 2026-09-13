// dashboard.js — the Today Command Center (spec §6). Answers "what
// matters right now": today's real schedule, realistic available
// study time vs what's planned, top priority, three wins, and the
// manual-AI "what should I do" prompt.

async function renderDashboard(main) {
  const today = new Date();
  const todayStr = Events.isoDate(today);
  const [tasks, assessments, subjects, plan, budget] = await Promise.all([
    DB.Store.getAll("tasks"),
    DB.Store.getAll("assessments"),
    DB.Store.getAll("subjects"),
    DB.Store.get("dailyPlans", todayStr),
    Events.computeTimeBudget(today),
  ]);

  const subjectName = (id) => (subjects.find((s) => s.id === id) || {}).name || "—";
  const open = tasks.filter((t) => t.status !== "done");
  const withPriority = open.map((t) => ({ ...t, p: Priority.computePriority(t, null) }));
  const order = { R: 0, Y: 1, G: 2 };
  withPriority.sort((a, b) => order[a.p] - order[b.p]);
  const topPriority = withPriority[0];

  const upcoming = assessments
    .filter((a) => a.status !== "done")
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const threeWins = (plan && plan.threeWins) || ["", "", ""];

  main.innerHTML = `
    <h1>Today</h1>
    <p class="muted">${today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>

    <div class="row">
      <div class="col">
        <h2>Schedule</h2>
        ${budget.occurrences.length ? budget.occurrences.map((o) => `
          <div class="card" style="padding:10px 14px;${o.cancelled ? "opacity:0.5;" : ""}">
            <div class="flex-between">
              <span>${o.title}${o.conditional ? ` <span class="tag">${o.conditional}</span>` : ""}</span>
              <span class="mono">${o.start ? `${o.start}${o.end ? "–" + o.end : ""}` : "flexible"}</span>
            </div>
          </div>
        `).join("") : `<div class="empty">Nothing scheduled — add it in Calendar.</div>`}
      </div>

      <div class="col">
        <h2>Time budget</h2>
        <div class="card ${budget.over ? "r" : "g"}">
          <div class="flex-between"><span>Realistically available</span><span class="mono">${Events.fmtMin(budget.availableMin)}</span></div>
          <div class="flex-between"><span>Planned in Planner</span><span class="mono">${Events.fmtMin(budget.plannedMin)}</span></div>
          ${budget.over ? `<p class="mt">You've planned ${Events.fmtMin(budget.plannedMin)} of study but only about ${Events.fmtMin(budget.availableMin)} is realistically free today. Move something to tomorrow rather than let it silently overload.` : `<p class="mt muted">On track — plenty of the planned study time fits in what's actually free today.</p>`}
        </div>

        <h2 class="mt">Top priority</h2>
        ${topPriority ? `
          <div class="card ${topPriority.p.toLowerCase()}">
            <span class="dot ${topPriority.p.toLowerCase()}"></span><strong>${topPriority.title}</strong>
            <div class="muted">${subjectName(topPriority.subjectId)}${topPriority.dueDate ? ` · due ${topPriority.dueDate}` : ""}</div>
          </div>
        ` : `<div class="empty">No open tasks — add one on the Tasks page.</div>`}

        ${upcoming ? `
          <h2 class="mt">Next assessment</h2>
          <div class="card">
            <div class="flex-between"><strong>${upcoming.title}</strong><span class="mono">${Math.max(0, Math.ceil(Priority.daysUntil(upcoming.date)))}d</span></div>
            <div class="muted">${subjectName(upcoming.subjectId)} · ${upcoming.date}</div>
          </div>
        ` : ""}
      </div>
    </div>

    <div class="card mt">
      <div class="flex-between">
        <h2>What should I do now?</h2>
        <button id="ask-ai-btn">Generate prompt</button>
      </div>
      <p class="muted">Builds a prompt from your real tasks, assessments and time budget above — paste it into any AI chat.</p>
      <pre class="prompt-output" id="ai-output" style="display:none;"></pre>
    </div>

    <h2 class="mt">Today's three wins</h2>
    <div class="card">
      ${[0, 1, 2].map((i) => `<input type="text" data-win="${i}" value="${(threeWins[i] || "").replace(/"/g, "&quot;")}" placeholder="Win ${i + 1}" style="width:100%; margin-bottom:8px;">`).join("")}
      <button id="save-wins" class="ghost">Save wins</button>
    </div>
  `;

  document.getElementById("save-wins").onclick = async () => {
    const wins = [0, 1, 2].map((i) => main.querySelector(`[data-win="${i}"]`).value);
    await DB.Store.put("dailyPlans", { date: todayStr, blocks: (plan && plan.blocks) || [], threeWins: wins });
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

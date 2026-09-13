// provider.js — AIProvider interface. MVP ships "manual" only: it never
// calls an API, it just assembles your real data into a prompt you paste
// into any AI chat yourself. Live providers (Claude/OpenAI/Gemini API
// keys) are a Phase 9 add-on behind this same interface.

async function buildWhatShouldIDoPrompt() {
  const [tasks, assessments, subjects, budget] = await Promise.all([
    DB.Store.getAll("tasks"),
    DB.Store.getAll("assessments"),
    DB.Store.getAll("subjects"),
    Events.computeTimeBudget(new Date()),
  ]);

  const subjectName = (id) => (subjects.find((s) => s.id === id) || {}).name || id;
  const openTasks = tasks.filter((t) => t.status !== "done");
  const upcoming = assessments.filter((a) => a.status !== "done")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const taskLines = openTasks
    .map((t) => {
      const p = Priority.computePriority(t, null);
      return `- [${p}] ${t.title} (${subjectName(t.subjectId)}, due ${t.dueDate || "no date"}, ~${t.durationMin || "?"}min)`;
    })
    .join("\n") || "(no open tasks logged)";

  const assessLines = upcoming
    .map((a) => `- ${a.title} — ${subjectName(a.subjectId)}, ${a.date}${a.weight ? `, worth ${a.weight}%` : ""}`)
    .join("\n") || "(no upcoming assessments logged)";

  return `You are helping an IB Diploma Year 1 student (HL Computer Science, HL Business Management, HL English; SL Math AA&A, SL Physics, SL Dutch) decide what to work on right now.

TIME BUDGET TODAY: ~${Events.fmtMin(budget.availableMin)} realistically available after school/cricket/gym/sleep, ${Events.fmtMin(budget.plannedMin)} already planned in the planner.

OPEN TASKS (priority tag is Red/Yellow/Green, computed from real due dates — Red is most urgent):
${taskLines}

UPCOMING ASSESSMENTS:
${assessLines}

Given this, tell me: (1) the single best thing to work on in my next study block, (2) roughly how long to spend on it, and (3) one concrete first step to start with. Don't invent tasks or deadlines I haven't listed — only work with what's above, and say so if the list looks incomplete.`;
}

window.AIProvider = { buildWhatShouldIDoPrompt };

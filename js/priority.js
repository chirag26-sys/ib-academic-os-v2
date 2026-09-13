// priority.js — computes Red/Yellow/Green for a task. Manual override
// always wins. See ARCHITECTURE.md for the rule in plain language.

function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  const now = new Date();
  const target = new Date(dateStr + "T23:59:59");
  return (target - now) / (1000 * 60 * 60 * 24);
}

function computePriority(task, linkedAssessment) {
  if (task.priority === "R" || task.priority === "Y" || task.priority === "G") {
    return task.priority; // manual override wins
  }
  const dueDays = daysUntil(task.dueDate);
  if (dueDays <= 1) return "R";
  if (linkedAssessment && linkedAssessment.weight >= 20 && daysUntil(linkedAssessment.date) <= 3) return "R";
  if (dueDays <= 3) return "Y";
  if (linkedAssessment && daysUntil(linkedAssessment.date) <= 7) return "Y";
  return "G";
}

window.Priority = { computePriority, daysUntil };

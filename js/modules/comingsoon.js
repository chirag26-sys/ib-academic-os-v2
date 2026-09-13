// comingsoon.js — placeholder renderer for nav destinations not built
// yet. Keeps the full nav structure navigable at every phase (per the
// spec's "must remain usable between phases" rule) without pretending
// unbuilt features exist.

function renderComingSoon(title, phaseLabel, blurb) {
  return (main) => {
    main.innerHTML = `
      <h1>${title}</h1>
      <div class="empty">
        <strong>Not built yet — ${phaseLabel}</strong>
        <p class="mt">${blurb}</p>
      </div>
    `;
  };
}

Router.registerRoute("/tok", renderComingSoon("TOK", "Phase F", "Knowledge questions, claims/counterclaims, exhibition and essay tracking."));
Router.registerRoute("/ee", renderComingSoon("Extended Essay", "Phase F", "Research question, sources, outline, draft word count, supervisor meetings."));
Router.registerRoute("/cas", renderComingSoon("CAS", "Phase F", "Creativity, Activity, Service experiences with reflections and evidence."));
Router.registerRoute("/universities", renderComingSoon("Universities", "Phase E", "University Command Center — RSM tracked as primary target, deadlines, scholarships, cost planner. Every external requirement will carry a source and last-verified date, never hard-coded as permanent."));
Router.registerRoute("/insights", renderComingSoon("Insights", "Phase I", "Study time distribution, grade trends, error recurrence, planning accuracy, and your 40+/45 scenario tracker."));
Router.registerRoute("/ai-hub", renderComingSoon("AI Hub", "Phase D", "Multiple AI personas (Study Coach, Examiner, Socratic Tutor...) and a context engine that only pulls in the relevant subject's data. The 'What should I do now?' prompt on Today already works today — this page will house the rest."));

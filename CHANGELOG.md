# Changelog

## v0.1.1 — Reliability pass
- Tasks can now link directly to an assessment.
- Red/Yellow/Green priority calculations now use linked assessments on Tasks, Dashboard, and the manual AI prompt.
- Data model and planner documentation clarified to match the actual MVP behavior.

## v0.1.0 — Phase 1-5 MVP
- Initial build: dashboard, subjects (seeded, fixed), tasks, assessments,
  daily + weekly planner, grades, error log, study timer, resource library,
  settings (study caps + export/import).
- Manual-mode AI provider ("What should I do now?" prompt builder) shipped
  in MVP rather than deferred to Phase 9.
- IndexedDB persistence, PWA manifest + service worker (app-shell caching
  only — data never cached).
- No university tracker, TOK/EE/CAS, spaced repetition, or live AI API
  integration yet — see ARCHITECTURE.md for phased roadmap.

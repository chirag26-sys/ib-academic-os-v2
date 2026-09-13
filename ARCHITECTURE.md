# Architecture

## Stack

- **Frontend:** Vanilla HTML/CSS/JS. No framework, no bundler, no build step.
  Reasoning: this needs to survive being handed to a free AI chat for edits
  months from now with zero setup friction. A framework buys nothing at this
  scope (≈15 views) and costs a build pipeline you'd have to maintain.
- **Storage:** IndexedDB via a small hand-written wrapper (`js/db.js`) —
  no external library, so there's no CDN dependency for the app's core
  function to work offline.
- **Routing:** Hash-based (`#/dashboard`, `#/tasks`, etc.) — works from a
  static file server with no server-side routing config.
- **PWA layer:** `manifest.json` + `service-worker.js`, caching the app shell
  (HTML/CSS/JS) only — your data stays in IndexedDB, never in the cache.
- **AI integration:** `js/ai/provider.js` defines one interface
  (`buildPrompt(context) -> string`). MVP ships the "manual" provider only:
  it assembles your real task/assessment data into a prompt you copy into
  whatever AI chat you're using. Live API providers (Claude/OpenAI/Gemini)
  are a Phase 9 add-on behind the same interface — no rewrite needed later.
- **Hosting:** GitHub Pages (free, HTTPS, required for PWA installability).

## Folder structure

```
ib-academic-os/
├── README.md
├── ARCHITECTURE.md
├── DATA_MODEL.md
├── SETUP.md
├── CHANGELOG.md
├── .gitignore
├── manifest.json
├── service-worker.js
├── index.html
├── css/
│   └── styles.css
├── icons/
│   └── (PWA icons — placeholders, swap with your own)
└── js/
    ├── db.js            (IndexedDB wrapper + schema)
    ├── priority.js       (R/Y/G priority algorithm)
    ├── router.js         (hash router)
    ├── app.js            (bootstraps db + router + nav)
    ├── ai/
    │   └── provider.js   (manual-mode prompt builder)
    └── modules/
        ├── dashboard.js
        ├── subjects.js
        ├── tasks.js
        ├── assessments.js
        ├── planner.js
        ├── grades.js
        ├── errors.js
        ├── timer.js
        ├── resources.js
        └── settings.js
```

## Priority algorithm (Red / Yellow / Green)

Deliberately simple, transparent, and overridable — not a hidden score:

- **Red:** due within 1 day, OR manually flagged red, OR linked to an
  assessment worth ≥20% within 3 days.
- **Yellow:** due within 3 days, OR linked to an assessment within 7 days.
- **Green:** everything else.

A manual `priority` override always wins over the computed value. The
algorithm never adjusts itself based on how you're feeling — sleep/burnout
protection works differently (below), not by silently changing colors.

## Sleep / anti-burnout logic

Implemented as a **hard cap on the planner**, not a wellbeing score: the
daily planner will not let you schedule more than your configured max study
minutes for the day (default 3h weekday / 4h weekend, editable in Settings),
and it will warn — not block — if you're scheduling study inside your
configured gym/cricket/sleep windows. This is a scheduling constraint. The
app never diagnoses or comments on your wellbeing.

## Phased roadmap

- **Phase 1 (this build):** Foundation — shell, nav, IndexedDB schema, PWA
  install, export/import.
- **Phase 2 (this build):** Core academic — subjects, tasks, assessments.
- **Phase 3 (this build):** Study engine — timer, error log (no spaced
  repetition scheduling yet).
- **Phase 4 (this build):** Planner — daily + weekly views, three-wins.
- **Phase 5 (this build):** Grades + resource library.
- **Phase 6:** TOK / EE / CAS trackers.
- **Phase 7:** University tracker (RSM/Erasmus + others), with live-verified
  requirement data, source + date on every field.
- **Phase 8:** Spaced repetition scheduling for the error log.
- **Phase 9:** Live AI provider integrations (Claude/OpenAI/Gemini API keys),
  behind the existing `AIProvider` interface.
- **Phase 10–12:** Agent role documentation (`AI_AGENTS.md` — prompt
  templates for each of your 19 defined roles), analytics/insights, polish.

Phases 1–5 are what's built in this delivery — that's the full MVP as
originally scoped, plus the manual AI mode pulled forward from Phase 9.

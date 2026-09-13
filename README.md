# IB Academic OS

A local-first, offline-capable planning and tracking system for the IB Diploma —
built for one specific six-subject load (HL Computer Science, HL Business
Management, HL English; SL Math AA&A, SL Physics, SL Dutch) plus TOK/EE/CAS.

No build step. No server. No paid subscriptions required to run it. All your
data lives in your browser's IndexedDB — nothing is sent anywhere unless you
explicitly use the AI panel to copy a prompt into an AI chat yourself.

## What's in the MVP

- Dashboard (today's plan, next 3 wins, red/yellow/green task signal)
- Subjects (the six confirmed subjects, fixed — not user-editable in MVP)
- Tasks (create, prioritize R/Y/G, complete)
- Assessments (upcoming tests/deadlines, countdown)
- Daily + Weekly planner
- Grades log
- Error log (mistake → cause → redo tracking)
- Study timer (planned vs actual, confidence/difficulty rating)
- Resource library (with trust label + last-verified date — no fabricated links)
- Manual AI mode ("What should I do now?" generates a copy-pasteable prompt
  for any AI chat, built from your real data)
- Export / import (JSON) — your data is portable, never locked in
- Responsive layout (works on phone as an installed PWA)

## Not in the MVP (later phases)

University tracker, TOK/EE/CAS trackers, spaced repetition scheduling,
multi-provider live AI integration (API keys), the 19-role agent system.
See `ARCHITECTURE.md` for the phased roadmap.

## Running it locally (before you've pushed to GitHub)

You cannot just double-click `index.html` — service workers and some storage
APIs need a real (even if local) server origin. From this folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

## Running it once it's on GitHub Pages

Once pushed (see `SETUP.md`), GitHub Pages serves it over HTTPS automatically,
which is what makes it installable as a PWA on your phone (Add to Home Screen).

## No-fabrication policy

This app never pre-fills grades, deadlines, or university data for you. Fields
start empty. Anything pulled from the web (resources, requirements) carries a
source, a trust label, and a last-verified date — and is flagged for
re-verification, never presented as permanently true.

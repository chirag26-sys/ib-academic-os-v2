// events.js — turns the recurring-event templates in the `events` store
// into concrete occurrences for a given date, applies per-date
// exceptions (cancel / reschedule a single occurrence without touching
// the recurring template), and computes the day's realistic time
// budget. This is the engine behind §7-11 of the spec (calendar, life
// vs academic time, smart time budget).

function isoDate(d) { return d.toISOString().slice(0, 10); }
function weekdayOf(d) { const w = d.getDay(); return w === 0 ? 7 : w; } // 1=Mon..7=Sun

function timeToMin(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function durationMin(start, end) {
  const s = timeToMin(start);
  let e = timeToMin(end);
  if (s == null || e == null) return null;
  if (e <= s) e += 24 * 60; // crosses midnight (e.g. going out until 00:00)
  return e - s;
}

// Returns concrete occurrences (recurring templates resolved for this
// date, minus cancelled exceptions, plus any one-off events on this
// date) sorted by start time. Untimed/flexible-no-time events sort last.
async function occurrencesForDate(dateObj) {
  const all = await DB.Store.getAll("events");
  const ds = isoDate(dateObj);
  const wd = weekdayOf(dateObj);
  const out = [];

  for (const ev of all) {
    if (ev.date) {
      // one-off event
      if (ev.date === ds) out.push({ ...ev, occurrenceDate: ds });
      continue;
    }
    if (ev.weekday !== wd) continue;
    const exception = (ev.exceptions || []).find((x) => x.date === ds);
    if (exception && exception.cancelled) continue;
    const merged = exception ? { ...ev, ...exception, occurrenceDate: ds } : { ...ev, occurrenceDate: ds };
    out.push(merged);
  }

  out.sort((a, b) => {
    const am = timeToMin(a.start);
    const bm = timeToMin(b.start);
    if (am == null && bm == null) return 0;
    if (am == null) return 1;
    if (bm == null) return -1;
    return am - bm;
  });
  return out;
}

// Cancel (or restore) a single occurrence of a recurring event without
// touching the template — this is the "override one Tuesday's cricket
// without destroying the recurring schedule" requirement (§8).
async function setOccurrenceException(eventId, dateStr, patch) {
  const ev = await DB.Store.get("events", eventId);
  if (!ev) return;
  const exceptions = (ev.exceptions || []).filter((x) => x.date !== dateStr);
  if (patch) exceptions.push({ date: dateStr, ...patch });
  ev.exceptions = exceptions;
  await DB.Store.put("events", ev);
}

// Life-commitment time (school/gym/cricket/social/sleep/etc — anything
// in `events`) subtracted from 24h, then compared against what's
// actually planned in the daily planner. Never silently overloads —
// this just returns the numbers; the UI decides how to warn.
async function computeTimeBudget(dateObj) {
  const occurrences = await occurrencesForDate(dateObj);
  let committedMin = 0;
  for (const ev of occurrences) {
    const d = durationMin(ev.start, ev.end);
    if (d) committedMin += d;
  }
  const availableMin = Math.max(0, 24 * 60 - committedMin);

  const plan = await DB.Store.get("dailyPlans", isoDate(dateObj));
  const plannedMin = ((plan && plan.blocks) || []).reduce((s, b) => s + (Number(b.duration) || 0), 0);

  return { committedMin, availableMin, plannedMin, over: plannedMin > availableMin, occurrences };
}

function fmtMin(min) {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

window.Events = { occurrencesForDate, setOccurrenceException, computeTimeBudget, isoDate, weekdayOf, durationMin, fmtMin };

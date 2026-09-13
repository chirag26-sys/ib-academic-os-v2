// db.js — thin IndexedDB wrapper. No external library, so the app has
// zero dependencies for its core offline function.
//
// v2 adds: events (recurring life schedule + one-off + exceptions),
// goals, notes. Existing v1 stores are untouched — IndexedDB's
// onupgradeneeded only adds new stores here, nothing is deleted or
// migrated, so no existing data is lost.

const DB_NAME = "ib-academic-os";
const DB_VERSION = 2;

const STORES = {
  subjects: { keyPath: "id" },
  tasks: { keyPath: "id", autoIncrement: true },
  assessments: { keyPath: "id", autoIncrement: true },
  grades: { keyPath: "id", autoIncrement: true },
  errors: { keyPath: "id", autoIncrement: true },
  studySessions: { keyPath: "id", autoIncrement: true },
  resources: { keyPath: "id", autoIncrement: true },
  dailyPlans: { keyPath: "date" },
  weeklyPlans: { keyPath: "weekStart" },
  settings: { keyPath: "key" },
  // v2
  events: { keyPath: "id" },
  goals: { keyPath: "id", autoIncrement: true },
  notes: { keyPath: "id", autoIncrement: true },
};

const SEED_SUBJECTS = [
  { id: "hl-cs", name: "HL Computer Science", level: "HL", color: "#4c8dff" },
  { id: "hl-business", name: "HL Business Management", level: "HL", color: "#e5a93d" },
  { id: "hl-english", name: "HL English", level: "HL", color: "#3dae6e" },
  { id: "sl-math", name: "SL Math AA&A", level: "SL", color: "#e5484d" },
  { id: "sl-physics", name: "SL Physics", level: "SL", color: "#9b7bd6" },
  { id: "sl-dutch", name: "SL Dutch", level: "SL", color: "#4fc3c9" },
];

// Weekday: 1=Mon ... 7=Sun.
// "fixed" = non-negotiable (school). "flexible" = real but movable.
// "conditional" (string|null) records exactly what Chirag said about
// when it does/doesn't happen — the planner shows this, never hides it.
// Times marked with a range in `notes` are Chirag's own stated range;
// the start/end fields use the earliest-start/latest-end of that range
// as the seeded default so the time-budget calc errs toward *less*
// available time, not more. Editable any time in the Calendar view.
const SEED_EVENTS = [
  { id: "school-mon", title: "School", type: "school", weekday: 1, start: "07:30", end: "15:45", fixed: true, flexible: false, conditional: null, notes: "Free period 9:45–10:30 & 10:30–12:30; break 10:30–11:00", exceptions: [] },
  { id: "gym-mon", title: "Gym", type: "gym", weekday: 1, start: "16:30", end: "18:00", fixed: false, flexible: true, conditional: null, notes: "Usually 4:30 or 5pm–6pm", exceptions: [] },

  { id: "school-tue", title: "School", type: "school", weekday: 2, start: "07:30", end: "12:30", fixed: true, flexible: false, conditional: null, notes: "", exceptions: [] },
  { id: "gym-tue", title: "Gym", type: "gym", weekday: 2, start: "16:30", end: "18:30", fixed: false, flexible: true, conditional: null, notes: "", exceptions: [] },
  { id: "cricket-tue", title: "Cricket", type: "cricket", weekday: 2, start: "19:00", end: "20:30", fixed: false, flexible: true, conditional: "If attending", notes: "Approx. 7pm start — no end time given, 90min assumed", exceptions: [] },

  { id: "school-wed", title: "School", type: "school", weekday: 3, start: "07:30", end: "15:00", fixed: true, flexible: false, conditional: null, notes: "Finish time varies 2:15–3:00pm — seeded to the later end so available time isn't overestimated", exceptions: [] },
  { id: "flex-wed", title: "Gym or cricket (Wed)", type: "flex", weekday: 3, start: "16:30", end: "18:00", fixed: false, flexible: true, conditional: "UNRESOLVED — Chirag said both 'depending on the week' AND 'try not to do gym nor cricket this day'. Seeded as optional/off by default until clarified.", notes: "See Settings > this event to resolve", exceptions: [] },

  { id: "school-thu", title: "School", type: "school", weekday: 4, start: "07:30", end: "14:15", fixed: true, flexible: false, conditional: null, notes: "Free period 11:00–12:30", exceptions: [] },
  { id: "cricket-thu", title: "Cricket", type: "cricket", weekday: 4, start: "16:30", end: "18:30", fixed: false, flexible: true, conditional: "If attending — otherwise no cricket this day", notes: "", exceptions: [] },

  { id: "school-fri", title: "School", type: "school", weekday: 5, start: "09:00", end: "14:15", fixed: true, flexible: false, conditional: null, notes: "", exceptions: [] },
  { id: "gym-fri", title: "Gym / friends / free time", type: "gym", weekday: 5, start: "15:00", end: "18:00", fixed: false, flexible: true, conditional: null, notes: "Roughly 3–4pm start, 5:30–6pm end", exceptions: [] },

  { id: "cricket-sat", title: "Cricket training/games", type: "cricket", weekday: 6, start: null, end: null, fixed: false, flexible: true, conditional: "Flexible — training, games, or social plans, varies by week", notes: "No fixed time — log the actual time in Calendar each week", exceptions: [] },
  { id: "social-sat", title: "Going out", type: "social", weekday: 6, start: "19:30", end: "00:00", fixed: false, flexible: true, conditional: null, notes: "Usually back around midnight or later", exceptions: [] },

  { id: "sleep-sun", title: "Sleep", type: "sleep", weekday: 7, start: "22:30", end: "05:30", fixed: false, flexible: true, conditional: null, notes: "Sunday — stays home, minimal plans", exceptions: [] },
];

let _dbPromise = null;

function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      for (const [name, opts] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, opts);
        }
      }
    };
    req.onsuccess = async (e) => {
      const db = e.target.result;
      await seedIfEmpty(db, "subjects", SEED_SUBJECTS);
      await seedIfEmpty(db, "events", SEED_EVENTS);
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function seedIfEmpty(db, storeName, rows) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(storeName, "readwrite");
    const store = t.objectStore(storeName);
    const countReq = store.count();
    countReq.onsuccess = () => {
      if (countReq.result === 0) {
        for (const row of rows) store.put(row);
      }
    };
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

async function tx(storeName, mode) {
  const db = await openDB();
  return db.transaction(storeName, mode).objectStore(storeName);
}

const Store = {
  async getAll(storeName) {
    const store = await tx(storeName, "readonly");
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  async get(storeName, key) {
    const store = await tx(storeName, "readonly");
    return new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  async put(storeName, value) {
    const store = await tx(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const req = store.put(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  async delete(storeName, key) {
    const store = await tx(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },
  async clear(storeName) {
    const store = await tx(storeName, "readwrite");
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },
};

// Export / import across all stores.
async function exportAll() {
  const out = { version: DB_VERSION, exportedAt: new Date().toISOString(), stores: {} };
  for (const name of Object.keys(STORES)) {
    out.stores[name] = await Store.getAll(name);
  }
  return out;
}

async function importAll(payload) {
  if (!payload || !payload.stores) throw new Error("Invalid import file — missing 'stores'.");
  for (const [name, rows] of Object.entries(payload.stores)) {
    if (!STORES[name]) continue;
    await Store.clear(name);
    const store = await tx(name, "readwrite");
    for (const row of rows) store.put(row);
  }
}

window.DB = { openDB, Store, exportAll, importAll, SEED_SUBJECTS, SEED_EVENTS };

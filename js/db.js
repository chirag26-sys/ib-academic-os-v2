// db.js — thin IndexedDB wrapper. No external library, so the app has
// zero dependencies for its core offline function.

const DB_NAME = "ib-academic-os";
const DB_VERSION = 1;

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
};

const SEED_SUBJECTS = [
  { id: "hl-cs", name: "HL Computer Science", level: "HL", color: "#4c8dff" },
  { id: "hl-business", name: "HL Business Management", level: "HL", color: "#e5a93d" },
  { id: "hl-english", name: "HL English", level: "HL", color: "#3dae6e" },
  { id: "sl-math", name: "SL Math AA&A", level: "SL", color: "#e5484d" },
  { id: "sl-physics", name: "SL Physics", level: "SL", color: "#9b7bd6" },
  { id: "sl-dutch", name: "SL Dutch", level: "SL", color: "#4fc3c9" },
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
      await seedIfEmpty(db);
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function seedIfEmpty(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("subjects", "readwrite");
    const store = tx.objectStore("subjects");
    const countReq = store.count();
    countReq.onsuccess = () => {
      if (countReq.result === 0) {
        for (const s of SEED_SUBJECTS) store.put(s);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
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

window.DB = { openDB, Store, exportAll, importAll, SEED_SUBJECTS };

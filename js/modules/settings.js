async function renderSettings(main) {
  const rows = await DB.Store.getAll("settings");
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  main.innerHTML = `
    <h1>Settings</h1>

    <div class="card">
      <h2>Study caps</h2>
      <p class="muted">Hard caps used by the Planner's warning — not a wellbeing score, just a limit you set.</p>
      <div class="row">
        <div class="col"><label>Max study min/weekday</label><input id="s-weekday" type="number" style="width:100%" value="${map.maxStudyMinWeekday ?? 180}"></div>
        <div class="col"><label>Max study min/weekend day</label><input id="s-weekend" type="number" style="width:100%" value="${map.maxStudyMinWeekend ?? 240}"></div>
      </div>
      <button id="save-caps" class="mt">Save</button>
    </div>

    <div class="card">
      <h2>AI provider</h2>
      <p class="muted">Manual mode is the only provider in this build — it generates a prompt for you to paste into any AI chat. Live API providers are a later phase.</p>
      <div class="tag">manual (active)</div>
    </div>

    <div class="card">
      <h2>Export / import</h2>
      <p class="muted">Your data, portable. Export regularly — this is your backup.</p>
      <button id="export-btn">Export JSON</button>
      <label class="mt">Import JSON</label>
      <input id="import-file" type="file" accept="application/json">
      <p class="muted mt" style="color:var(--signal-r);">Importing replaces matching data — you'll be asked to confirm.</p>
    </div>
  `;

  document.getElementById("save-caps").onclick = async () => {
    await DB.Store.put("settings", { key: "maxStudyMinWeekday", value: Number(document.getElementById("s-weekday").value) || 180 });
    await DB.Store.put("settings", { key: "maxStudyMinWeekend", value: Number(document.getElementById("s-weekend").value) || 240 });
    renderRoute();
  };

  document.getElementById("export-btn").onclick = async () => {
    const data = await DB.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ib-academic-os-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  document.getElementById("import-file").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm("This will replace your current data with the contents of this file. Continue?")) return;
    const text = await file.text();
    try {
      await DB.importAll(JSON.parse(text));
      alert("Import complete.");
      window.location.hash = "#/dashboard";
      renderRoute();
    } catch (err) {
      alert("Import failed: " + err.message);
    }
  };
}

Router.registerRoute("/settings", renderSettings);

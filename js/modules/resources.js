const TRUST_LABELS = {
  official: "Official (IBO / exam board)",
  trusted_edu: "Trusted educational site",
  teacher: "From my teacher",
  community: "Community (forums, student sites)",
  unverified: "Unverified — check before relying on it",
};

async function renderResources(main) {
  const [resources, subjects] = await Promise.all([DB.Store.getAll("resources"), DB.Store.getAll("subjects")]);
  const subjectName = (id) => (subjects.find((s) => s.id === id) || {}).name || "—";

  main.innerHTML = `
    <h1>Resource Library</h1>
    <p class="muted">Every entry carries a trust label and a last-verified date — nothing here is assumed permanently accurate.</p>
    <div class="card">
      <h2>Add resource</h2>
      <div class="row">
        <div class="col">
          <label>Subject</label>
          <select id="r-subject" style="width:100%">${subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}</select>
        </div>
        <div class="col"><label>Topic</label><input id="r-topic" type="text" style="width:100%"></div>
        <div class="col">
          <label>Type</label>
          <select id="r-type" style="width:100%"><option>Video</option><option>Past paper</option><option>Textbook</option><option>Notes</option><option>Website</option><option>Other</option></select>
        </div>
      </div>
      <label>URL or path</label>
      <input id="r-url" type="text" style="width:100%">
      <div class="row">
        <div class="col">
          <label>Trust label</label>
          <select id="r-trust" style="width:100%">
            ${Object.entries(TRUST_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}
          </select>
        </div>
        <div class="col"><label>Last verified</label><input id="r-verified" type="date" style="width:100%"></div>
      </div>
      <label>Description</label>
      <input id="r-desc" type="text" style="width:100%">
      <button id="add-resource" class="mt">Add resource</button>
    </div>

    <h2 class="mt">Library (${resources.length})</h2>
    ${resources.length ? resources.map((r) => `
      <div class="card">
        <div class="flex-between">
          <strong>${r.topic || "untitled"}</strong>
          <span class="tag">${TRUST_LABELS[r.trustLabel] || r.trustLabel}</span>
        </div>
        <div class="muted">${subjectName(r.subjectId)} · ${r.type || "—"}${r.lastVerified ? ` · verified ${r.lastVerified}` : " · not yet verified"}</div>
        ${r.url ? `<p class="mt"><a href="${r.url}" target="_blank" rel="noopener">${r.url}</a></p>` : ""}
        ${r.description ? `<p class="muted">${r.description}</p>` : ""}
        <div class="mt"><button class="ghost danger" data-delete="${r.id}">Delete</button></div>
      </div>
    `).join("") : `<div class="empty">Nothing added yet.</div>`}
  `;

  document.getElementById("add-resource").onclick = async () => {
    const topic = document.getElementById("r-topic").value.trim();
    if (!topic) return;
    await DB.Store.put("resources", {
      subjectId: document.getElementById("r-subject").value,
      topic,
      type: document.getElementById("r-type").value,
      url: document.getElementById("r-url").value.trim() || null,
      source: null,
      trustLabel: document.getElementById("r-trust").value,
      lastVerified: document.getElementById("r-verified").value || null,
      description: document.getElementById("r-desc").value.trim() || null,
      tags: [],
    });
    renderRoute();
  };

  main.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.onclick = async () => { await DB.Store.delete("resources", Number(btn.dataset.delete)); renderRoute(); };
  });
}

Router.registerRoute("/resources", renderResources);

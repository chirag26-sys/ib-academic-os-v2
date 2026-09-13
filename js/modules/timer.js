let _timerState = { running: false, startedAt: null, elapsedMs: 0, interval: null };

async function renderTimer(main) {
  const [subjects, sessions] = await Promise.all([DB.Store.getAll("subjects"), DB.Store.getAll("studySessions")]);
  const recent = [...sessions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

  main.innerHTML = `
    <h1>Study Timer</h1>
    <div class="card">
      <div class="row">
        <div class="col">
          <label>Subject</label>
          <select id="tm-subject" style="width:100%">${subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("")}</select>
        </div>
        <div class="col"><label>Planned minutes</label><input id="tm-planned" type="number" min="5" step="5" style="width:100%" value="25"></div>
      </div>
      <div class="timer-display mt" id="tm-display">00:00</div>
      <button id="tm-toggle">${_timerState.running ? "Pause" : "Start"}</button>
      <button id="tm-stop" class="ghost">Stop &amp; log</button>
    </div>

    <div id="tm-log-form" style="display:none;" class="card">
      <h2>Log this session</h2>
      <div class="row">
        <div class="col"><label>Confidence (1-5)</label><input id="tm-confidence" type="number" min="1" max="5" style="width:100%"></div>
        <div class="col"><label>Difficulty (1-5)</label><input id="tm-difficulty" type="number" min="1" max="5" style="width:100%"></div>
      </div>
      <label>Notes</label>
      <textarea id="tm-notes" style="width:100%" rows="2"></textarea>
      <button id="tm-save" class="mt">Save session</button>
    </div>

    <h2 class="mt">Recent sessions</h2>
    ${recent.length ? recent.map((s) => `
      <div class="card">
        <div class="flex-between">
          <span>${(subjects.find((sub) => sub.id === s.subjectId) || {}).name || "—"}</span>
          <span class="mono">${s.actualMin}min (planned ${s.plannedMin})</span>
        </div>
        <div class="muted">confidence ${s.confidence ?? "—"} · difficulty ${s.difficulty ?? "—"} · ${new Date(s.timestamp).toLocaleString()}</div>
        ${s.notes ? `<p class="mt">${s.notes}</p>` : ""}
      </div>
    `).join("") : `<div class="empty">No sessions logged yet.</div>`}
  `;

  updateDisplay();

  document.getElementById("tm-toggle").onclick = () => {
    if (_timerState.running) {
      clearInterval(_timerState.interval);
      _timerState.elapsedMs += Date.now() - _timerState.startedAt;
      _timerState.running = false;
    } else {
      _timerState.startedAt = Date.now();
      _timerState.running = true;
      _timerState.interval = setInterval(updateDisplay, 1000);
    }
    document.getElementById("tm-toggle").textContent = _timerState.running ? "Pause" : "Start";
  };

  document.getElementById("tm-stop").onclick = () => {
    if (_timerState.running) {
      clearInterval(_timerState.interval);
      _timerState.elapsedMs += Date.now() - _timerState.startedAt;
      _timerState.running = false;
    }
    document.getElementById("tm-log-form").style.display = "block";
  };

  document.getElementById("tm-save").onclick = async () => {
    const actualMin = Math.round(_timerState.elapsedMs / 60000);
    await DB.Store.put("studySessions", {
      subjectId: document.getElementById("tm-subject").value,
      taskId: null,
      plannedMin: Number(document.getElementById("tm-planned").value) || null,
      actualMin,
      confidence: Number(document.getElementById("tm-confidence").value) || null,
      difficulty: Number(document.getElementById("tm-difficulty").value) || null,
      notes: document.getElementById("tm-notes").value.trim() || null,
      timestamp: new Date().toISOString(),
    });
    _timerState = { running: false, startedAt: null, elapsedMs: 0, interval: null };
    renderRoute();
  };
}

function updateDisplay() {
  const el = document.getElementById("tm-display");
  if (!el) return;
  const ms = _timerState.elapsedMs + (_timerState.running ? Date.now() - _timerState.startedAt : 0);
  const totalSec = Math.floor(ms / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  el.textContent = `${mm}:${ss}`;
}

Router.registerRoute("/timer", renderTimer);

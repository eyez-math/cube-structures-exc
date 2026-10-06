(() => {
  "use strict";

  const exercises = window.CUBE_EXERCISES || [];
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const clone = m => m.map(r => [...r]);

  const labels = {
    numbers: "תרשים מספרים",
    top: "מבט מלמעלה",
    front: "מבט מלפנים",
    left: "מבט משמאל",
    right: "מבט מימין"
  };

  const answerGrid = value => Array.from({length: 5}, () => Array(5).fill(value));

  const initialAnswer = type =>
    type === "match-structure"
      ? {selected: null}
      : {
          ...(type === "structure-to-views" ? {numbers: answerGrid(0)} : {}),
          top: answerGrid(false),
          front: answerGrid(false),
          left: answerGrid(false),
          right: answerGrid(false)
        };

  const blankProgress = ex => ({
    current: 0,
    done: Array(ex.questions.length).fill(false),
    answers: ex.questions.map(() => initialAnswer(ex.type))
  });

  const blankState = () => ({
    exerciseIndex: 0,
    progress: Object.fromEntries(exercises.map(ex => [ex.id, blankProgress(ex)]))
  });

  // v2 deliberately resets old exercise-2 answers after correcting the workbook data.
  const storageKey = "cube-workbook-modular-v2";
  let state = blankState();

  function repairSavedState(saved) {
    const fresh = blankState();
    if (!saved || typeof saved !== "object") return fresh;

    fresh.exerciseIndex = Number.isInteger(saved.exerciseIndex)
      ? Math.max(0, Math.min(exercises.length - 1, saved.exerciseIndex))
      : 0;

    for (const ex of exercises) {
      const old = saved.progress?.[ex.id];
      if (!old) continue;

      const p = fresh.progress[ex.id];
      p.current = Number.isInteger(old.current)
        ? Math.max(0, Math.min(ex.questions.length - 1, old.current))
        : 0;

      if (Array.isArray(old.done)) {
        p.done = p.done.map((_, i) => Boolean(old.done[i]));
      }

      if (Array.isArray(old.answers)) {
        p.answers = p.answers.map((fallback, i) => {
          const candidate = old.answers[i];
          if (!candidate || typeof candidate !== "object") return fallback;

          if (ex.type === "match-structure") {
            return {selected: Number.isInteger(candidate.selected) ? candidate.selected : null};
          }

          const result = structuredClone ? structuredClone(fallback) : JSON.parse(JSON.stringify(fallback));
          for (const key of Object.keys(result)) {
            if (!Array.isArray(candidate[key]) || candidate[key].length !== 5) continue;
            if (!candidate[key].every(row => Array.isArray(row) && row.length === 5)) continue;
            result[key] = candidate[key];
          }
          return result;
        });
      }
    }
    return fresh;
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    state = repairSavedState(saved);
  } catch (_) {
    state = blankState();
  }

  const currentExercise = () => exercises[state.exerciseIndex];
  const currentProgress = () => state.progress[currentExercise().id];
  const currentQuestion = () => currentExercise().questions[currentProgress().current];

  function save() {
    localStorage.setItem(storageKey, JSON.stringify(state));
    updateProgress();
  }

  function crop(matrix, isActive) {
    const cells = [];
    matrix.forEach((row, r) =>
      row.forEach((value, c) => {
        if (isActive(value)) cells.push([r, c]);
      })
    );
    if (!cells.length) return [];

    const rs = cells.map(x => x[0]);
    const cs = cells.map(x => x[1]);
    const r0 = Math.min(...rs), r1 = Math.max(...rs);
    const c0 = Math.min(...cs), c1 = Math.max(...cs);

    return matrix.slice(r0, r1 + 1).map(row => row.slice(c0, c1 + 1));
  }

  const normalized = (matrix, key) =>
    crop(matrix, key === "numbers" ? v => v > 0 : Boolean);

  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  function silhouette(heights) {
    const max = Math.max(1, ...heights);
    return Array.from({length: max}, (_, r) =>
      heights.map(h => h >= max - r)
    );
  }

  function projections(grid) {
    const rows = grid.length;
    const cols = grid[0].length;

    const frontHeights = Array.from(
      {length: cols},
      (_, c) => Math.max(...grid.map(row => row[c]))
    );

    const depthHeights = grid.map(row => Math.max(...row));

    return {
      numbers: clone(grid),
      top: grid.map(row => row.map(Boolean)),
      front: silhouette(frontHeights),
      left: silhouette(depthHeights),
      right: silhouette([...depthHeights].reverse())
    };
  }

  function structureToVoxels(structure) {
    if (structure && Array.isArray(structure.voxels)) {
      return structure.voxels.map(v => [...v]);
    }

    const voxels = [];
    structure.forEach((row, z) =>
      row.forEach((height, x) => {
        for (let y = 0; y < height; y++) voxels.push([x,y,z]);
      })
    );
    return voxels;
  }

  function structureBounds(structure) {
    const voxels = structureToVoxels(structure);
    const maxX = Math.max(0, ...voxels.map(v => v[0]));
    const maxY = Math.max(0, ...voxels.map(v => v[1]));
    const maxZ = Math.max(0, ...voxels.map(v => v[2]));
    return {voxels, cols:maxX+1, maxH:maxY+1, rows:maxZ+1};
  }

  function renderExerciseTabs() {
    const root = $("#exercise-tabs");
    root.innerHTML = "";

    exercises.forEach((ex, i) => {
      const p = state.progress[ex.id];
      const b = document.createElement("button");
      b.className = "exercise-tab" + (i === state.exerciseIndex ? " active" : "");
      b.innerHTML = `תרגיל ${ex.number}<small>עמוד${ex.pages.includes("–") ? "ים" : ""} ${ex.pages} · ${p.done.filter(Boolean).length}/${ex.questions.length}</small>`;
      b.onclick = () => {
        state.exerciseIndex = i;
        save();
        render();
      };
      root.append(b);
    });
  }

  function renderQuestionNav() {
    const ex = currentExercise();
    const p = currentProgress();
    const root = $("#question-nav");
    root.style.gridTemplateColumns = `repeat(${Math.min(ex.questions.length, 8)},1fr)`;
    root.innerHTML = "";

    ex.questions.forEach((q, i) => {
      const b = document.createElement("button");
      b.className =
        "question-chip" +
        (i === p.current ? " active" : "") +
        (p.done[i] ? " done" : "");
      b.textContent = q.label;
      b.onclick = () => {
        p.current = i;
        save();
        render();
      };
      root.append(b);
    });
  }

  function updateProgress() {
    if (!exercises.length) return;
    const ex = currentExercise();
    const p = currentProgress();
    const n = p.done.filter(Boolean).length;

    $("#progress-name").textContent = `תרגיל ${ex.number}`;
    $("#progress-label").textContent = `${n} מתוך ${ex.questions.length}`;
    $("#progress-bar").style.width = `${(n / ex.questions.length) * 100}%`;

    $$(".question-chip").forEach((b, i) =>
      b.classList.toggle("done", p.done[i])
    );
  }

  function paintGrid(matrix, key) {
    const p = currentProgress();
    const root = document.createElement("div");
    root.className = "cell-grid";
    root.style.gridTemplateColumns = "repeat(5,max-content)";

    matrix.forEach((row, r) =>
      row.forEach((value, c) => {
        const b = document.createElement("button");
        b.className = "cell paint" + (value ? " on" : "");
        b.setAttribute("aria-label", `${labels[key]}, שורה ${r + 1}, עמודה ${c + 1}`);
        b.onclick = () => {
          p.answers[p.current][key][r][c] = !value;
          renderActivity();
          save();
        };
        root.append(b);
      })
    );

    return root;
  }

  function numberGrid(matrix) {
    const p = currentProgress();
    const root = document.createElement("div");
    root.className = "cell-grid";
    root.style.gridTemplateColumns = "repeat(5,max-content)";

    matrix.forEach((row, r) =>
      row.forEach((value, c) => {
        const b = document.createElement("button");
        b.className = "cell number" + (value ? " nonzero" : "");
        b.innerHTML = `<span>${value}</span>${value ? '<span class="minus">−</span>' : ""}`;
        b.setAttribute("aria-label", `תרשים מספרים, שורה ${r + 1}, עמודה ${c + 1}, גובה ${value}`);
        b.onclick = e => {
          p.answers[p.current].numbers[r][c] =
            e.target.closest(".minus")
              ? Math.max(0, value - 1)
              : (value + 1) % 6;
          renderActivity();
          save();
        };
        root.append(b);
      })
    );

    return root;
  }

  function answerZones(keys, results = null) {
    const p = currentProgress();
    const answer = p.answers[p.current];
    const root = document.createElement("div");
    root.className = "answer-zones";

    keys.forEach(key => {
      const zone = document.createElement("section");
      zone.className =
        `zone ${key === "numbers" ? "numbers " : ""}` +
        (results ? (results[key] ? "correct" : "wrong") : "");

      zone.innerHTML = `<h3>${labels[key]}</h3>`;
      zone.append(key === "numbers" ? numberGrid(answer[key]) : paintGrid(answer[key], key));

      const status = document.createElement("div");
      status.className = "zone-status";
      if (results) status.textContent = results[key] ? "נכון ✓" : "כדאי לבדוק שוב";
      zone.append(status);
      root.append(zone);
    });

    return root;
  }

  function feedbackHtml() {
    return `
      <div class="actions">
        <button class="btn primary" id="check-answer">בדיקת תשובה</button>
        <button class="btn secondary" id="clear-answer">ניקוי הסעיף</button>
      </div>
      <div class="feedback" id="feedback" role="status" aria-live="polite"></div>
    `;
  }

  function renderStructureQuestion() {
    const q = currentQuestion();
    const root = $("#activity-root");

    root.innerHTML = `
      <div class="activity-layout">
        <article class="activity-card">
          <span class="question-kicker">סעיף ${q.label}</span>
          <h2>התבוננו במבנה</h2>
          <div class="fixed-viewer">
            <canvas id="main-canvas"></canvas>
            <div class="front-legend"><i></i> החץ מסמן את החזית</div>
          </div>
          <p class="viewer-caption">התבוננו במבנה מהזווית הנתונה.</p>
        </article>

        <article class="activity-card">
          <span class="question-kicker">העבודה שלכם</span>
          <h2>השלימו את התרשימים</h2>
          <p class="work-instruction">אפשר למקם את התשובה בכל מקום בתוך הרשת.</p>
          <div id="zones-slot"></div>
          ${feedbackHtml()}
        </article>
      </div>
    `;

    $("#zones-slot").append(answerZones(["numbers","top","front","left","right"]));
    requestAnimationFrame(() => drawStructure($("#main-canvas"), q.structure, true));
    bindAnswerActions();
  }

  function renderNumberQuestion() {
    const q = currentQuestion();
    const root = $("#activity-root");

    root.innerHTML = `
      <div class="activity-layout">
        <article class="activity-card">
          <span class="question-kicker">סעיף ${q.label}</span>
          <h2>תרשים המספרים הנתון</h2>
          <div class="given-number-wrap">
            <div>
              <div class="given-number" id="given-number"></div>
              <div class="front-arrow" aria-label="חץ לחזית"></div>
            </div>
          </div>
        </article>

        <article class="activity-card">
          <span class="question-kicker">העבודה שלכם</span>
          <h2>סרטטו את ארבעת המבטים</h2>
          <p class="work-instruction">לחצו על המשבצות המתאימות. אפשר למקם את התשובה בכל מקום בתוך הרשת.</p>
          <div id="zones-slot"></div>
          ${feedbackHtml()}
        </article>
      </div>
    `;

    const diagram = $("#given-number");
    diagram.style.gridTemplateColumns = `repeat(${q.numbers[0].length},58px)`;

    q.numbers.flat().forEach(n => {
      const s = document.createElement("span");
      s.className = n ? "" : "blank";
      s.textContent = n || "";
      diagram.append(s);
    });

    $("#zones-slot").append(answerZones(["top","front","left","right"]));
    bindAnswerActions();
  }

  function miniView(matrix, title) {
    const box = document.createElement("div");
    box.className = "given-view";
    box.innerHTML = `<h3>${labels[title] || title}</h3>`;

    const grid = document.createElement("div");
    grid.className = "mini-grid";
    grid.style.gridTemplateColumns = `repeat(${matrix[0].length},32px)`;

    matrix.flat().forEach(v => {
      const i = document.createElement("i");
      if (v) i.className = "on";
      grid.append(i);
    });

    box.append(grid);
    return box;
  }

  function renderMatchQuestion() {
    const q = currentQuestion();
    const p = currentProgress();
    const answer = p.answers[p.current];
    const root = $("#activity-root");

    root.innerHTML = `
      <div class="activity-layout single">
        <article class="activity-card">
          <span class="question-kicker">סעיף ${q.label}</span>
          <h2>איזה מבנה מתאים למבטים?</h2>
          <div class="given-views" id="given-views"></div>
          <div class="option-grid" id="option-grid"></div>
          ${feedbackHtml()}
        </article>
      </div>
    `;

    const order = q.viewOrder || Object.keys(q.views);
    order.forEach(key => $("#given-views").append(miniView(q.views[key], key)));

    q.options.forEach((structure, i) => {
      const b = document.createElement("button");
      b.className = "structure-option" + (answer.selected === i ? " selected" : "");
      b.innerHTML = `<span class="option-number">${i + 1}</span><canvas></canvas>`;
      b.onclick = () => {
        answer.selected = i;
        renderActivity();
        save();
      };
      $("#option-grid").append(b);
      requestAnimationFrame(() => drawStructure(b.querySelector("canvas"), structure, false));
    });

    bindAnswerActions();
  }

  function renderActivity() {
    const type = currentExercise().type;
    if (type === "structure-to-views") renderStructureQuestion();
    else if (type === "numbers-to-views") renderNumberQuestion();
    else renderMatchQuestion();
  }

  function bindAnswerActions() {
    $("#check-answer").onclick = checkAnswer;
    $("#clear-answer").onclick = clearAnswer;
  }

  function checkAnswer() {
    const ex = currentExercise();
    const q = currentQuestion();
    const p = currentProgress();
    const answer = p.answers[p.current];
    const f = $("#feedback");

    if (ex.type === "match-structure") {
      if (answer.selected === null) {
        f.className = "feedback show bad";
        f.textContent = "בחרו קודם אחד מהמבנים.";
        return;
      }

      const good = answer.selected === q.correct;
      f.className = `feedback show ${good ? "good" : "bad"}`;
      f.textContent = good
        ? "מצוין! בחרתם את המבנה המתאים."
        : "המבנה שבחרתם אינו מתאים לכל המבטים. נסו שוב.";

      if (good) p.done[p.current] = true;

      $$(".structure-option").forEach((b, i) => {
        b.classList.toggle("correct", good && i === q.correct);
        b.classList.toggle("wrong", !good && i === answer.selected);
      });
    } else {
      const keys =
        ex.type === "structure-to-views"
          ? ["numbers","top","front","left","right"]
          : ["top","front","left","right"];

      const want = projections(ex.type === "structure-to-views" ? q.structure : q.numbers);
      const results = {};

      keys.forEach(k => {
        results[k] = same(normalized(answer[k], k), normalized(want[k], k));
      });

      const wrong = keys.filter(k => !results[k]);

      const zones = $("#zones-slot");
      zones.innerHTML = "";
      zones.append(answerZones(keys, results));

      f.className = `feedback show ${wrong.length ? "bad" : "good"}`;
      f.textContent = wrong.length
        ? "עדיין לא הכול מתאים. בדקו שוב את: " + wrong.map(k => labels[k]).join(", ") + "."
        : "מצוין! כל התרשימים נכונים.";

      if (!wrong.length) p.done[p.current] = true;
    }

    save();
    renderExerciseTabs();
    renderQuestionNav();
  }

  function clearAnswer() {
    const ex = currentExercise();
    const p = currentProgress();
    p.answers[p.current] = initialAnswer(ex.type);
    p.done[p.current] = false;
    save();
    render();
  }

  function drawStructure(canvas, structure, arrow) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!rect.width || !rect.height) return;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const {voxels, cols, rows, maxH} = structureBounds(structure);

    const yaw = Math.PI / 4;
    const elev = 0.58;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const ce = Math.cos(elev), se = Math.sin(elev);

    const span = Math.max(rows, cols);
    const scale = Math.min(
      rect.width / (span * 1.7 + 3.4),
      rect.height / (maxH + span * 0.78 + 3.6)
    );

    const ox = rect.width / 2;
    const oy = rect.height / 2 + scale * 0.1;
    const targetY = (maxH - 1) / 2;

    const project = (x, y, z) => {
      const yy = y - targetY;
      return {
        x: ox + (x * cy - z * sy) * scale,
        y: oy + (x * sy * se - yy * ce + z * cy * se) * scale,
        depth: x * sy * ce + yy * se + z * cy * ce
      };
    };

    const cam = {x: sy * ce, y: se, z: cy * ce};

    const poly = (pts, fill, stroke = "rgba(13,62,71,.75)") => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.stroke();
    };

    const baseY = -0.5;
    const base = [
      project(-cols/2, baseY, -rows/2),
      project(cols/2, baseY, -rows/2),
      project(cols/2, baseY, rows/2),
      project(-cols/2, baseY, rows/2)
    ];
    poly(base, "rgba(205,231,227,.8)", "#80afa9");

    const corners = [
      [-.47,-.47,-.47],[.47,-.47,-.47],[.47,.47,-.47],[-.47,.47,-.47],
      [-.47,-.47,.47],[.47,-.47,.47],[.47,.47,.47],[-.47,.47,.47]
    ];

    const faces = [
      {ids:[3,2,6,7], n:[0,1,0],  l:1.25},
      {ids:[4,7,6,5], n:[0,0,1],  l:1},
      {ids:[0,1,2,3], n:[0,0,-1], l:.7},
      {ids:[1,5,6,2], n:[1,0,0],  l:.88},
      {ids:[0,3,7,4], n:[-1,0,0], l:.66}
    ];

    const visible = [];

    voxels.forEach(([gx, gy, gz]) => {
      const x = gx - (cols - 1) / 2;
      const z = gz - (rows - 1) / 2;
      const pts = corners.map(([dx,dy,dz]) => project(x+dx, gy+dy, z+dz));

      faces.forEach(face => {
        const facing =
          face.n[0] * cam.x +
          face.n[1] * cam.y +
          face.n[2] * cam.z;

        if (facing <= .001) return;

        const p = face.ids.map(i => pts[i]);
        visible.push({
          p,
          depth: p.reduce((sum,v) => sum + v.depth, 0) / p.length,
          fill: `hsl(${174 + Math.min(gy,7)*5} 58% ${Math.min(68, Math.round(43*face.l))}%)`
        });
      });
    });

    visible.sort((a,b) => a.depth - b.depth);
    ctx.lineWidth = Math.max(1, scale * .018);
    visible.forEach(f => poly(f.p, f.fill));

    if (arrow) {
      const start = project(0, -.16, rows/2 + 1.45);
      const end = project(0, -.16, rows/2 + .28);
      const dx = end.x - start.x, dy = end.y - start.y;
      const len = Math.hypot(dx,dy);
      const ux = dx/len, uy = dy/len, size = 13;

      ctx.strokeStyle = ctx.fillStyle = "#ef463d";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(start.x,start.y);
      ctx.lineTo(end.x,end.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(end.x,end.y);
      ctx.lineTo(end.x-ux*size-uy*size*.6, end.y-uy*size+ux*size*.6);
      ctx.lineTo(end.x-ux*size+uy*size*.6, end.y-uy*size-ux*size*.6);
      ctx.closePath();
      ctx.fill();
    }
  }

  function go(delta) {
    const p = currentProgress();
    const len = currentExercise().questions.length;
    p.current = Math.max(0, Math.min(len - 1, p.current + delta));
    save();
    render();
  }

  function render() {
    if (!exercises.length) {
      $("#activity-root").innerHTML = "<p>לא נמצאו תרגילים.</p>";
      return;
    }

    const ex = currentExercise();
    const p = currentProgress();

    renderExerciseTabs();

    $("#page-ref").textContent = `עמוד${ex.pages.includes("–") ? "ים" : ""} ${ex.pages}`;
    $("#lesson-title").textContent = `תרגיל ${ex.number}: ${ex.title}`;
    $("#lesson-instruction").textContent = ex.instruction;

    renderQuestionNav();
    renderActivity();

    $("#position-label").textContent = `סעיף ${p.current + 1} מתוך ${ex.questions.length}`;
    $("#previous").disabled = p.current === 0;
    $("#next").textContent = p.current === ex.questions.length - 1 ? "סיום" : "הסעיף הבא";

    updateProgress();
    window.scrollTo({top: 0});
  }

  $("#previous").onclick = () => go(-1);

  $("#next").onclick = () => {
    const ex = currentExercise();
    const p = currentProgress();

    if (p.current < ex.questions.length - 1) {
      go(1);
      return;
    }

    if (p.done.every(Boolean)) {
      $("#finish-dialog").showModal();
    } else {
      const f = $("#feedback");
      if (f) {
        f.className = "feedback show bad";
        f.textContent = "יש עוד סעיפים שלא הושלמו. אפשר לעבור אליהם מהסרגל העליון.";
      }
    }
  };

  $("#close-dialog").onclick = () => $("#finish-dialog").close();

  $("#reset-exercise").onclick = () => {
    if (!confirm("לאפס את כל התשובות בתרגיל הזה?")) return;
    const ex = currentExercise();
    state.progress[ex.id] = blankProgress(ex);
    save();
    render();
  };

  render();
})();

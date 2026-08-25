
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const KEY = "guq_v2_1";

const iso = (d) => d.toISOString().slice(0, 10);
const today = () => iso(new Date());

const defaults = {
  pin: null,
  selected: today(),
  tasks: {},
  tomorrow: {},
  local: {},
  drinks: {},
  journal: {},
  order: {},
  social: {},
  beauty: { nails: "", pedicure: "", hair: "", brows: "" },
  money: { overdraft: 0, creditcard: 0, car: 0, carTarget: 5000 },
  vision: null,
  custom: []
};

let D;
try {
  D = Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY) || "{}"));
} catch {
  D = structuredClone(defaults);
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(D));
}

function baseTasks(date) {
  const day = new Date(date + "T12:00:00").getDay();
  const zones = [
    "Sunday Reset",
    "Keuken + weekprep",
    "Badkamer + toilet",
    "Slaapkamer",
    "Vloeren",
    "Koelkast / papier",
    "Deep clean"
  ];
  const zone = zones[day];

  return [
    ["05:30", "Wekker"],
    ["05:45", "Douchen"],
    ["06:00", "Morning Start"],
    ["06:15", "Trommels & eten voorbereiden"],
    ["06:30", "Kind wakker / ochtendroutine"],
    ["07:30", "Deur uit"],
    ["08:30", "School → werk"],
    ["15:00", "School ophalen / thuis verder werken"],
    ["16:00", "Rekenen + typen"],
    ["17:30", "Koken of leftovers"],
    ["18:30", "Woningaanbod bekijken"],
    ["19:00", "Quality time"],
    ["20:00", "Reageren op woningen"],
    ["20:15", "Avondroutine + samen lezen"],
    ["20:45", "Home Close: keuken · hal · woonkamer"],
    ["21:00", "Queen Time"],
    ["23:00", "Lights out"]
  ].map((x, i) => ({
    id: "b" + i,
    time: x[0],
    text: x[1],
    done: false,
    zone
  }));
}

function tasks(date) {
  if (!D.tasks[date]) D.tasks[date] = baseTasks(date);
  return D.tasks[date];
}

function localDone(id) {
  return Boolean(D.local?.[D.selected]?.[id]);
}

function toggleLocal(id) {
  D.local[D.selected] = D.local[D.selected] || {};
  D.local[D.selected][id] = !D.local[D.selected][id];
  save();
}

function render() {
  const now = new Date();
  const h = now.getHours();
  const selectedDate = new Date(D.selected + "T12:00:00");

  $("#greet").textContent =
    h < 12 ? "GOOD MORNING" : h < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";

  $("#briefTitle").textContent =
    h < 12 ? "Your Morning Brief" : h < 18 ? "Your Day Edit" : "Your Evening Edit";

  $("#date").textContent = selectedDate.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  renderDays();
  renderBrief();
  renderTimeline();
  renderAreas();
}

function renderDays() {
  const nav = $("#days");
  nav.innerHTML = "";
  const base = new Date(D.selected + "T12:00:00");

  for (let i = -2; i < 5; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);

    const btn = document.createElement("button");
    btn.innerHTML =
      `<b>${["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"][d.getDay()]}</b><br>${d.getDate()}`;

    if (iso(d) === D.selected) btn.className = "active";

    btn.onclick = () => {
      D.selected = iso(d);
      save();
      render();
    };

    nav.appendChild(btn);
  }
}

function renderBrief() {
  const prep = D.tomorrow[D.selected] || {};
  const h = new Date().getHours();
  const items = [];

  if (prep.focus) items.push(["🎯", "Focus", prep.focus]);
  if (prep.top3?.length) items.push(["👑", "Top 3", prep.top3.join(" · ")]);

  items.push([
    "🥂",
    "Etiquette",
    "Rustig roeren: laat je lepel het kopje niet aantikken."
  ]);

  if (new Date(D.selected + "T12:00:00").getDay() === 0) {
    items.push(["✨", "Sunday Reset", "Bestelling van de week + weekplanning."]);
  }

  // Housing only appears when it is actually relevant later in the day.
  if (D.selected === today() && h >= 17) {
    items.push([
      "🏡",
      "Wonen",
      h < 20
        ? "18:30 aanbod bekijken · 20:00 reageren"
        : "Check of je woningactie klaar is."
    ]);
  }

  $("#brief").innerHTML = items
    .map(
      (x) => `
      <div class="item">
        <span>${x[0]}</span>
        <div><b>${x[1]}</b><div class="muted">${x[2]}</div></div>
      </div>`
    )
    .join("");
}

function renderTimeline() {
  const list = tasks(D.selected);

  $("#timeline").innerHTML = list
    .map(
      (t) => `
      <div class="item ${t.done ? "done" : ""}">
        <button class="check ${t.done ? "on" : ""}" data-c="${t.id}">
          ${t.done ? "✓" : ""}
        </button>
        <div class="time">${t.time}</div>
        <div class="txt">${t.text}</div>
      </div>`
    )
    .join("");

  $$("[data-c]").forEach((btn) => {
    btn.onclick = () => {
      const task = list.find((x) => x.id === btn.dataset.c);
      if (!task) return;
      task.done = !task.done;
      save();
      render();
    };
  });

  const completed = list.filter((x) => x.done).length;
  const pct = list.length ? Math.round((completed / list.length) * 100) : 0;

  $("#done").textContent = `${completed}/${list.length} done`;
  $("#score").textContent = pct + "%";
  $("#fill").style.height = pct + "%";
}

const areas = [
  ["🏠", "Home", "Daily reset + zone", "home"],
  ["🔥", "Body", "Road to 62 kg", "body"],
  ["💧", "Drinks", "Water + uitzonderingen", "drinks"],
  ["💄", "Beauty", "Glow + maintenance", "beauty"],
  ["🥂", "Etiquette", "Learn · Practice · Master", "etiquette"],
  ["💼", "Out With It!", "Build + social tracker", "build"],
  ["📚", "Mind", "Read + learn", "mind"],
  ["✨", "Law of Attraction", "Journal + weekly order", "loa"],
  ["💰", "Money", "Goals, not receipts", "money"],
  ["💕", "Family", "Quality time + school", "family"],
  ["🗓️", "Week", "Sunday Reset", "week"],
  ["👑", "Progress", "See her becoming", "progress"]
];

function renderAreas() {
  $("#areas").innerHTML = areas
    .map(
      (a) => `
      <button class="area" data-open="${a[3]}">
        <span class="ico">${a[0]}</span>
        <b>${a[1]}</b>
        <small>${a[2]}</small>
      </button>`
    )
    .join("");

  bindOpenButtons();
}

function checkRow(id, label) {
  return `
    <div class="item">
      <button class="check ${localDone(id) ? "on" : ""}" data-l="${id}">
        ${localDone(id) ? "✓" : ""}
      </button>
      <div>${label}</div>
    </div>`;
}

function maintenanceRow(label, key, frequency) {
  return `
    <div class="item">
      <div>
        <b>${label}</b>
        <div class="muted">Laatst: ${D.beauty[key] || "nog instellen"} · ${frequency}</div>
      </div>
      <button class="link" data-m="${key}">Vandaag gedaan</button>
    </div>`;
}

function moneyInput(label, key) {
  return `
    <p><b>${label}</b></p>
    <input type="number" data-money="${key}" value="${D.money[key] || 0}" placeholder="€">`;
}

function weekKey(dateString) {
  const d = new Date(dateString + "T12:00:00");
  d.setDate(d.getDate() - d.getDay());
  return iso(d);
}

function openModal(type) {
  $("#modal").classList.remove("hidden");

  const titles = {
    home: ["HOME", "Daily reset"],
    body: ["BODY", "Road to 62 kg"],
    drinks: ["DRINKS", "Hydration & choices"],
    beauty: ["BEAUTY", "Glow maintenance"],
    etiquette: ["ETIQUETTE", "Queen Academy"],
    build: ["BUILD", "Out With It!"],
    mind: ["MIND", "Read · Learn · Grow"],
    loa: ["LAW OF ATTRACTION", "Align & journal"],
    money: ["MONEY", "Build financial peace"],
    family: ["FAMILY", "What matters at home"],
    week: ["WEEK", "Sunday Reset"],
    progress: ["PROGRESS", "She is becoming"]
  };

  const title = titles[type];
  $("#me").textContent = title[0];
  $("#mt").textContent = title[1];

  const body = $("#mb");

  if (type === "home") {
    body.innerHTML = `
      <div class="sub">
        <h3>Every night</h3>
        ${checkRow("kitchen", "Keuken reset")}
        ${checkRow("hall", "Hal reset")}
        ${checkRow("living", "Woonkamer reset")}
      </div>
      <div class="sub">
        <h3>Extra zone</h3>
        <p>${tasks(D.selected)[0].zone}</p>
        <p class="muted">De concrete room-checklists worden hierna editable gemaakt.</p>
      </div>`;
  }

  if (type === "body") {
    body.innerHTML = `
      <div class="sub">
        <h3>Today's body goals</h3>
        ${checkRow("steps", "10.000 stappen")}
        ${checkRow("move", "30 minuten beweging")}
        ${checkRow("squats", "Squat challenge")}
        ${checkRow("breakfast", "Ontbijt")}
        ${checkRow("fruitveg", "Fruit + groentebakje")}
        ${checkRow("homefood", "Thuis gegeten")}
      </div>
      <div class="sub">
        <h3>Workout</h3>
        <p>Dag-specifieke Tai Bo · Wall Pilates · core · squats.</p>
      </div>`;
  }

  if (type === "drinks") {
    const x = D.drinks[D.selected] || {
      water: 0,
      redbull: 0,
      alcohol: 0,
      cans: 0
    };

    body.innerHTML = `
      <div class="sub">
        <h3>Water</h3>
        <div class="meter"><span style="width:${Math.min(100, x.water / 10)}%"></span></div>
        <p>${x.water}/1000 ml</p>
        <button class="primary" data-d="water">+250 ml</button>
      </div>
      <div class="sub">
        <h3>Exceptions</h3>
        <p>⚡ ${x.redbull} · 🍷 ${x.alcohol} · 🥤 ${x.cans}/1</p>
        <button class="link" data-d="redbull">+ Red Bull</button>
        <button class="link" data-d="alcohol">+ Alcohol</button>
        <button class="link" data-d="cans">+ Blikje</button>
        <p class="muted">Geen registratie = 0. Nul Red Bull/alcohol telt aan het einde van de dag als gehaald.</p>
      </div>`;
  }

  if (type === "beauty") {
    body.innerHTML = `
      <div class="sub">
        <h3>Today</h3>
        ${checkRow("facial", "Facial routine")}
        ${checkRow("makeup", "Basic make-up")}
        ${checkRow("perfume", "Parfum")}
        ${checkRow("hands", "Handverzorging")}
        ${checkRow("feet", "Voetverzorging")}
      </div>
      <div class="sub">
        <h3>Maintenance</h3>
        ${maintenanceRow("Nagels", "nails", "4 weken")}
        ${maintenanceRow("Pedicure", "pedicure", "6 weken")}
        ${maintenanceRow("Kapper", "hair", "4 weken")}
        ${maintenanceRow("Wenkbrauwen epileren", "brows", "4 weken")}
      </div>
      <div class="sub">
        <h3>Make-up Academy</h3>
        <p>Base · brows · concealer · blush/contour · eyes · lips · everyday face.</p>
      </div>`;
  }

  if (type === "etiquette") {
    body.innerHTML = `
      <div class="sub">
        <p class="eyebrow">TODAY'S LESSON</p>
        <h3>Quiet elegance</h3>
        <p>Roer zonder je lepel tegen het kopje te tikken.</p>
        ${checkRow("etiquette", "Vandaag geoefend")}
      </div>
      <div class="sub">
        <h3>💕 Teach your little Queen too</h3>
        <p>Oefen het samen tijdens een drankje.</p>
      </div>
      <div class="sub">
        <h3>Academy</h3>
        <p>Dining · hosting · conversation · business · dress codes · travel · presence.</p>
      </div>`;
  }

  if (type === "build") {
    const posted = D.social[D.selected]?.posted;

    body.innerHTML = `
      <div class="sub">
        <h3>Out With It!</h3>
        ${checkRow("owi", "Betekenisvol gewerkt aan Out With It!")}
      </div>
      <div class="sub">
        <h3>Social Media</h3>
        <button class="primary" id="post">${posted ? "✓ Vandaag gepost" : "Markeer als gepost"}</button>
        <p class="muted">Glow Up Queen bewaakt consistentie; je contentproject doet het denkwerk.</p>
      </div>`;
  }

  if (type === "mind") {
    body.innerHTML = `
      <div class="sub">
        <h3>Queen Mind</h3>
        ${checkRow("read", "30 minuten lezen")}
        ${checkRow("learn", "Zelfontwikkeling / iets geleerd")}
      </div>`;
  }

  if (type === "loa") {
    const journal = D.journal[D.selected] || "";
    const order = D.order[weekKey(D.selected)] || "";

    body.innerHTML = `
      <div class="sub">
        <h3>Journal</h3>
        <textarea id="j" placeholder="Schrijf of dicteer…">${journal}</textarea>
        <button class="link" id="jd">🎙️ Dicteer</button>
        <button class="primary" id="js">Bewaar</button>
      </div>
      <div class="sub">
        <h3>💌 Bestelling van de week</h3>
        <textarea id="o" placeholder="Wat fijn dat deze week…">${order}</textarea>
        <button class="primary" id="os">Bewaar bestelling</button>
      </div>
      <div class="sub">
        <h3>Fysiek vision board</h3>
        <input type="file" accept="image/*" id="v">
        ${D.vision ? `<img class="photo" src="${D.vision}">` : ""}
      </div>`;
  }

  if (type === "money") {
    body.innerHTML = `
      <div class="sub">
        <h3>Priorities</h3>
        ${moneyInput("Roodstand", "overdraft")}
        ${moneyInput("Creditcard", "creditcard")}
        ${moneyInput("T-Roc aanbetaling", "car")}
      </div>
      <div class="sub">
        <h3>This week's money move</h3>
        ${checkRow("moneyaction", "Eén concrete money action")}
      </div>`;
  }

  if (type === "family") {
    body.innerHTML = `
      <div class="sub">
        <h3>Today</h3>
        ${checkRow("quality", "Quality time")}
        ${checkRow("readchild", "Samen gelezen")}
        ${checkRow("math", "Rekenen")}
        ${checkRow("typing", "Typen")}
        ${checkRow("familyroutine", "Gezinsroutine gevolgd")}
      </div>
      <div class="sub">
        <h3>Monthly connection</h3>
        <p>Plan iets met familie/vriendinnen. Beheer zelf wie relevant is — bijvoorbeeld Arizza, Meiwina en Marilva.</p>
      </div>`;
  }

  if (type === "week") {
    body.innerHTML = `
      <div class="sub">
        <h3>Sunday Reset</h3>
        ${checkRow("weekgoals", "Weekdoelen")}
        ${checkRow("order", "Bestelling van de week")}
        ${checkRow("mealplan", "Kook- & leftoverdagen")}
        ${checkRow("workouts", "Workouts")}
        ${checkRow("childweek", "Weekplanning kind + huiswerk")}
        ${checkRow("maintenance", "Maintenance check")}
      </div>
      <div class="sub">
        <h3>Monthly Queen Letter</h3>
        <p>Maanddoelen · money · relationships · leuke plannen · identity check-in · wat Queen Maya niet wil vergeten.</p>
      </div>`;
  }

  if (type === "progress") {
    const vals = Object.values(D.local).flatMap((x) => Object.values(x));
    const pct = vals.length
      ? Math.round((vals.filter(Boolean).length / vals.length) * 100)
      : 0;

    body.innerHTML = `
      <div class="sub">
        <h3>30-day view</h3>
        <div class="meter"><span style="width:${pct}%"></span></div>
        <p><b>${pct}%</b> van geregistreerde acties voltooid.</p>
        <p>Body · drinks · sleep · reading · beauty · Out With It! · family · energy.</p>
      </div>
      <div class="sub">
        <h3>Monthly identity check-in</h3>
        <p>Waar sta ik? · Wie wil ik zijn? · Wat verandert er? · Welke actie hoort daarbij?</p>
      </div>`;
  }

  bindModal(type);
}

function bindModal(type) {
  $$("[data-l]").forEach((btn) => {
    btn.onclick = () => {
      toggleLocal(btn.dataset.l);
      openModal(type);
    };
  });

  $$("[data-m]").forEach((btn) => {
    btn.onclick = () => {
      D.beauty[btn.dataset.m] = D.selected;
      save();
      openModal(type);
    };
  });

  $$("[data-d]").forEach((btn) => {
    btn.onclick = () => {
      const x = D.drinks[D.selected] || {
        water: 0,
        redbull: 0,
        alcohol: 0,
        cans: 0
      };

      if (btn.dataset.d === "water") x.water += 250;
      else x[btn.dataset.d] += 1;

      D.drinks[D.selected] = x;
      save();
      openModal(type);
    };
  });

  const post = $("#post");
  if (post) {
    post.onclick = () => {
      D.social[D.selected] = { posted: true };
      save();
      openModal(type);
    };
  }

  const saveJournal = $("#js");
  if (saveJournal) {
    saveJournal.onclick = () => {
      D.journal[D.selected] = $("#j").value;
      save();
      saveJournal.textContent = "✓ Bewaard";
    };
  }

  const saveOrder = $("#os");
  if (saveOrder) {
    saveOrder.onclick = () => {
      D.order[weekKey(D.selected)] = $("#o").value;
      save();
      saveOrder.textContent = "✓ Bewaard";
    };
  }

  const journalDictate = $("#jd");
  if (journalDictate) {
    journalDictate.onclick = () => dictate($("#j"));
  }

  const vision = $("#v");
  if (vision) {
    vision.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        D.vision = reader.result;
        save();
        openModal(type);
      };
      reader.readAsDataURL(file);
    };
  }

  $$("[data-money]").forEach((input) => {
    input.onchange = () => {
      D.money[input.dataset.money] = Number(input.value || 0);
      save();
    };
  });
}

function bindOpenButtons() {
  $$("[data-open]").forEach((btn) => {
    btn.onclick = () => openModal(btn.dataset.open);
  });
}

function dictate(el) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!Recognition) {
    alert("Gebruik de microfoon op je iPhone-toetsenbord voor voice-to-text.");
    return;
  }

  const recognition = new Recognition();
  recognition.lang = "nl-NL";
  recognition.onresult = (e) => {
    el.value += (el.value ? " " : "") + e.results[0][0].transcript;
  };
  recognition.start();
}

function planTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const key = iso(d);
  const current = D.tomorrow[key] || {};

  const focus = prompt("Focus voor morgen:", current.focus || "");
  if (focus === null) return;

  const top = prompt(
    "Top 3 — scheid met komma's:",
    (current.top3 || []).join(", ")
  );

  D.tomorrow[key] = {
    focus,
    top3: (top || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
  };

  save();
  alert("Morgen staat klaar, Queen Maya. 👑");
}

function addTask() {
  const time = prompt("Tijd, bijv. 14:30:");
  if (!time) return;

  const text = prompt("Taak:");
  if (!text) return;

  tasks(D.selected).push({
    id: "c" + Date.now(),
    time,
    text,
    done: false
  });

  D.tasks[D.selected].sort((a, b) => a.time.localeCompare(b.time));
  save();
  render();
}

function coachReply() {
  const q = $("#coachText").value.trim();
  if (!q) return;

  let reply = "Ik hoor je, Queen Maya. ";
  const addMatch = q.match(/voeg (.+?) (dagelijks|elke dag) toe/i);

  if (addMatch) {
    D.custom.push({ name: addMatch[1], freq: "daily" });
    save();
    reply += `“${addMatch[1]}” is opgeslagen als custom tracker. De volledige tracker-editor volgt in de volgende bouwstap.`;
  } else if (/wat moet ik nu/i.test(q)) {
    const next = tasks(today()).find((x) => !x.done);
    reply += next
      ? `Je volgende open stap is ${next.time} — ${next.text}. Eén ding tegelijk.`
      : "Je daglijst is rond. Queen Time.";
  } else {
    reply +=
      "Deze gratis prototypeversie heeft nog geen echte AI-koppeling. Ik doe niet alsof She al live ChatGPT-antwoorden kan geven.";
  }

  $("#reply").textContent = reply;
}

function unlock() {
  if (!D.pin) {
    $("#msg").textContent = "Stel eerst een pincode in.";
    return;
  }

  if ($("#pin").value !== D.pin) {
    $("#msg").textContent = "Pincode klopt niet.";
    return;
  }

  $("#lock").classList.add("hidden");
  $("#app").classList.remove("hidden");
  $("#msg").textContent = "";
  render();
}

$("#setPin").onclick = () => {
  const p = prompt("Kies 4–8 cijfers:");

  if (p && /^\d{4,8}$/.test(p)) {
    D.pin = p;
    save();
    $("#msg").textContent = "Pincode opgeslagen. Vul hem hierboven in.";
  } else if (p) {
    $("#msg").textContent = "Gebruik 4–8 cijfers.";
  }
};

$("#unlock").onclick = unlock;
$("#pin").addEventListener("keydown", (e) => {
  if (e.key === "Enter") unlock();
});

$("#lockBtn").onclick = () => {
  $("#app").classList.add("hidden");
  $("#lock").classList.remove("hidden");
  $("#pin").value = "";
};

$("#voice").onclick = () => $("#coach").classList.toggle("hidden");
$("#dictate").onclick = () => dictate($("#coachText"));
$("#ask").onclick = coachReply;
$("#tomorrow").onclick = planTomorrow;
$("#addTask").onclick = addTask;
$("#close").onclick = () => $("#modal").classList.add("hidden");

bindOpenButtons();

if (!D.pin) {
  $("#lockCopy").textContent = "Maak eerst je persoonlijke pincode.";
}

// Replace the old cached v2 files immediately.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

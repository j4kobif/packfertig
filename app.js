'use strict';

/* =========================================================
   Packfertig – Packlisten für Urlaub, Sport & mehr
   Alle Daten liegen im localStorage des Browsers.
   ========================================================= */

const STORE_KEY = 'packfertig.v1';
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

/* ---------- Icons ---------- */
const I = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v5h5"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
  sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

/* ---------- Optionen ---------- */
const WEATHER = { warm: { label: 'Warm', emoji: '☀️' }, mild: { label: 'Mild', emoji: '⛅' }, kalt: { label: 'Kalt', emoji: '❄️' } };
const EXTRAS = {
  strand: { label: 'Strand & Baden', emoji: '🏖️' },
  wandern: { label: 'Wandern', emoji: '🥾' },
  schick: { label: 'Schick ausgehen', emoji: '👔' },
  arbeit: { label: 'Arbeit / Laptop', emoji: '💻' },
  flug: { label: 'Flugreise', emoji: '✈️' },
};
const SPORTS = {
  fussball: { label: 'Fußball', emoji: '⚽' },
  fitness: { label: 'Fitnessstudio', emoji: '🏋️' },
  laufen: { label: 'Laufen', emoji: '🏃' },
  schwimmen: { label: 'Schwimmen', emoji: '🏊' },
  allgemein: { label: 'Allgemein', emoji: '🎽' },
};
const ANLASS = { training: { label: 'Training' }, spiel: { label: 'Spiel / Wettkampf' } };
const TYPES = {
  urlaub: { label: 'Urlaub / Koffer', emoji: '🧳', desc: 'Mengen nach Reisetagen, mit Reserve' },
  sport: { label: 'Sporttasche', emoji: '🎽', desc: 'Training oder Spiel – je nach Sportart' },
  eigene: { label: 'Eigene Liste', emoji: '📋', desc: 'Leer starten, alles selbst festlegen' },
};

/* ---------- Vorlagen ----------
   [Name, Menge oder Regel, Bedingung]
   Regel 'daily'  = 1 pro Tag (+ Reserve)
   Regel 'per:n'  = 1 alle n Tage (+1 mit Reserve)
   Urlaub-Bedingung: w = Wetter, x = Extras (eins davon reicht)
   Sport-Bedingung:  s = Sportarten, notS = nicht bei, a = Anlass (alle müssen passen)
*/
const URLAUB = [
  ['Kleidung', [
    ['Unterhosen', 'daily'],
    ['Socken (Paar)', 'daily'],
    ['T-Shirts / Oberteile', 'daily'],
    ['Hosen', 'per:3'],
    ['Schlafsachen', 'per:5'],
    ['Pullover / Hoodie', 'per:4', { w: ['mild', 'kalt'] }],
    ['Leichter Pullover', 1, { w: ['warm'] }],
    ['Shorts', 'per:3', { w: ['warm'] }],
    ['Jacke', 1, { w: ['warm', 'mild'] }],
    ['Winterjacke', 1, { w: ['kalt'] }],
    ['Thermo-Unterwäsche', 'per:3', { w: ['kalt'] }],
    ['Mütze, Schal & Handschuhe', 1, { w: ['kalt'] }],
    ['Cap / Sonnenhut', 1, { w: ['warm'], x: ['strand'] }],
    ['Bequeme Schuhe', 1],
    ['Sandalen', 1, { w: ['warm'] }],
    ['Badesachen', 2, { x: ['strand'] }],
    ['Flip-Flops', 1, { x: ['strand'] }],
    ['Wanderschuhe', 1, { x: ['wandern'] }],
    ['Funktionsshirts', 'per:2', { x: ['wandern'] }],
    ['Regenjacke', 1, { x: ['wandern'] }],
    ['Outfit für den Abend', 1, { x: ['schick'] }],
    ['Schicke Schuhe', 1, { x: ['schick'] }],
  ]],
  ['Hygiene', [
    ['Zahnbürste & Zahnpasta', 1],
    ['Deo', 1],
    ['Duschgel & Shampoo', 1],
    ['Rasierer', 1],
    ['Haarbürste / Kamm', 1],
    ['Sonnencreme', 1, { w: ['warm'], x: ['strand', 'wandern'] }],
    ['Lippenpflege', 1],
    ['Taschentücher', 1],
    ['Reiseapotheke & Medikamente', 1],
    ['Pflaster', 1],
    ['Flüssigkeiten-Beutel (max. 100 ml je Behälter)', 1, { x: ['flug'] }],
  ]],
  ['Elektronik', [
    ['Handy', 1],
    ['Ladekabel & Netzteil', 1],
    ['Powerbank', 1],
    ['Kopfhörer', 1],
    ['Reiseadapter', 1],
    ['Laptop & Ladegerät', 1, { x: ['arbeit'] }],
  ]],
  ['Dokumente & Geld', [
    ['Personalausweis / Reisepass', 1],
    ['Tickets / Bordkarte', 1],
    ['Krankenversicherungskarte', 1],
    ['Bankkarte & Bargeld', 1],
    ['Führerschein', 1],
    ['Buchungsbestätigungen', 1],
    ['Arbeitsunterlagen', 1, { x: ['arbeit'] }],
  ]],
  ['Sonstiges', [
    ['Sonnenbrille', 1, { w: ['warm'], x: ['strand'] }],
    ['Regenschirm', 1, { w: ['mild', 'kalt'] }],
    ['Trinkflasche', 1],
    ['Buch / E-Reader', 1],
    ['Wäschebeutel', 1],
    ['Snacks für die Fahrt', 1],
    ['Strandtuch', 1, { x: ['strand'] }],
    ['Tagesrucksack', 1, { x: ['wandern'] }],
    ['Haustürschlüssel', 1],
  ]],
];

const SPORT = [
  ['Kleidung', [
    ['Trainingsshirt', 1, { a: 'training', notS: ['schwimmen'] }],
    ['Trainingshose / Shorts', 1, { a: 'training', notS: ['schwimmen'] }],
    ['Trikot', 1, { a: 'spiel', s: ['fussball'] }],
    ['Spielhose', 1, { a: 'spiel', s: ['fussball'] }],
    ['Wettkampf-Outfit', 1, { a: 'spiel', s: ['fitness', 'laufen', 'allgemein'] }],
    ['Stutzen', 1, { s: ['fussball'] }],
    ['Sportsocken', 1, { notS: ['schwimmen', 'fussball'] }],
    ['Schienbeinschoner', 1, { s: ['fussball'] }],
    ['Fußballschuhe', 1, { s: ['fussball'] }],
    ['Sportschuhe', 1, { s: ['fitness', 'allgemein'] }],
    ['Laufschuhe', 1, { s: ['laufen'] }],
    ['Badehose / Badeanzug', 1, { s: ['schwimmen'] }],
    ['Badekappe', 1, { s: ['schwimmen'] }],
    ['Schwimmbrille', 1, { s: ['schwimmen'] }],
    ['Trainingsanzug zum Aufwärmen', 1, { a: 'spiel' }],
    ['Warme Jacke für danach', 1, { a: 'spiel' }],
    ['Wechselkleidung', 1],
    ['Unterwäsche zum Wechseln', 1],
  ]],
  ['Pflege', [
    ['Handtuch', 1],
    ['Duschgel & Shampoo', 1],
    ['Deo', 1],
    ['Badelatschen', 1, { notS: ['laufen'] }],
    ['Tape & Pflaster', 1, { a: 'spiel' }],
    ['Kühlspray', 1, { a: 'spiel', notS: ['schwimmen'] }],
    ['Blasenpflaster', 1, { s: ['laufen'] }],
    ['Bodylotion', 1, { s: ['schwimmen'] }],
  ]],
  ['Verpflegung', [
    ['Trinkflasche', 1],
    ['Snack / Banane', 1],
    ['Energieriegel', 2, { a: 'spiel' }],
    ['Iso- / Elektrolytgetränk', 1, { a: 'spiel' }],
  ]],
  ['Sonstiges', [
    ['Handy', 1],
    ['Kopfhörer', 1, { s: ['fitness', 'laufen', 'allgemein'] }],
    ['Schlüssel', 1],
    ['Mitgliedskarte', 1, { s: ['fitness', 'schwimmen'] }],
    ['Schloss / Münze für den Spind', 1, { s: ['fitness', 'schwimmen'] }],
    ['Spielerpass (falls nötig)', 1, { a: 'spiel', s: ['fussball'] }],
    ['Ersatz-Schnürsenkel', 1, { a: 'spiel', notS: ['schwimmen'] }],
    ['Startnummer & Sicherheitsnadeln', 1, { a: 'spiel', s: ['laufen'] }],
    ['Sportuhr', 1, { s: ['laufen'] }],
    ['Beutel für nasse / dreckige Sachen', 1],
  ]],
];

/* ---------- Mengen-Logik ---------- */
function calcQty(calc, s) {
  if (typeof calc === 'number') return calc;
  if (!calc) return 1;
  const days = Math.max(1, s.days | 0);
  const eff = s.wash ? Math.min(days, 7) : days;
  if (calc === 'daily') return eff + (s.reserve ? s.reserveCount : 0);
  if (calc.startsWith('per:')) {
    const n = Number(calc.slice(4)) || 1;
    return Math.max(1, Math.ceil(eff / n)) + (s.reserve ? 1 : 0);
  }
  return 1;
}

function matchUrlaub(cond, o) {
  if (!cond) return true;
  if (cond.w && cond.w.includes(o.weather)) return true;
  if (cond.x && cond.x.some((x) => o.extras.includes(x))) return true;
  return false;
}
function matchSport(cond, o) {
  if (!cond) return true;
  if (cond.s && !cond.s.includes(o.sport)) return false;
  if (cond.notS && cond.notS.includes(o.sport)) return false;
  if (cond.a && cond.a !== o.anlass) return false;
  return true;
}

function buildCategories(tpl, match, o, settings) {
  return tpl.map(([name, items]) => {
    const seen = new Set();
    const list = [];
    for (const [iname, rule, cond] of items) {
      if (!match(cond, o) || seen.has(iname)) continue;
      seen.add(iname);
      const calc = typeof rule === 'string' ? rule : null;
      list.push({ id: uid(), name: iname, qty: calc && settings ? calcQty(calc, settings) : rule, calc, packed: false, got: 0 });
    }
    return { id: uid(), name, items: list, collapsed: false };
  }).filter((c) => c.items.length);
}

/* ---------- Speicher ---------- */
let state = load();
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.lists)) return s;
    }
  } catch (e) { /* ignorieren */ }
  return { lists: [] };
}
syncAll();
let savedTimer;
function save() {
  syncAll();
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    const el = $('#saved');
    el.classList.add('show');
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => el.classList.remove('show'), 1200);
  } catch (e) {
    toast('Speichern nicht möglich – ist der Browser-Speicher blockiert?');
  }
}
const getList = (id) => state.lists.find((l) => l.id === id);
/* got = wie viele Stück schon eingepackt sind; packed = alles da */
function syncItem(i) {
  i.qty = Math.max(1, Number(i.qty) || 1);
  if (typeof i.got !== 'number') i.got = i.packed ? i.qty : 0;
  i.got = Math.min(i.qty, Math.max(0, Math.round(i.got)));
  i.packed = i.got >= i.qty;
}
function syncAll() { for (const l of state.lists) for (const c of l.categories || []) for (const i of c.items || []) syncItem(i); }
const setGot = (i, n) => { i.got = n; syncItem(i); };
const touch = (list) => { list.updated = Date.now(); };
function findItem(list, id) {
  for (const cat of list.categories) {
    const idx = cat.items.findIndex((i) => i.id === id);
    if (idx > -1) return { cat, item: cat.items[idx], idx };
  }
  return null;
}
function counts(list) {
  let total = 0, packed = 0, partial = 0, frac = 0;
  for (const c of list.categories) for (const i of c.items) {
    total++;
    if (i.packed) packed++; else if (i.got > 0) partial++;
    frac += i.got / i.qty;
  }
  return { total, packed, partial, pct: total ? Math.floor((frac / total) * 100) : 0 };
}
function listMeta(list) {
  if (list.type === 'urlaub') {
    const s = list.settings;
    return `${s.days} ${s.days === 1 ? 'Tag' : 'Tage'} · ${WEATHER[s.weather]?.label || ''}${s.reserve ? ` · +${s.reserveCount} Reserve` : ''}`;
  }
  if (list.type === 'sport') return `Sporttasche · ${ANLASS[list.settings.anlass]?.label}`;
  return 'Eigene Liste';
}

/* ---------- Ansicht ---------- */
const view = { screen: 'home', listId: null, edit: false, lastMoved: null };

function route() {
  const m = location.hash.match(/^#\/liste\/([\w-]+)/);
  const prev = view.screen + view.listId;
  if (m && getList(m[1])) { view.screen = 'list'; view.listId = m[1]; }
  else { view.screen = 'home'; view.listId = null; view.edit = false; }
  if (prev !== view.screen + view.listId) window.scrollTo(0, 0);
  render();
}

function render() {
  const app = $('#app');
  app.innerHTML = view.screen === 'list' ? renderList(getList(view.listId)) : renderHome();
  document.title = view.screen === 'list' ? `${getList(view.listId).name} · Packfertig` : 'Packfertig';
  if (view.lastMoved) {
    const el = app.querySelector(`[data-item="${view.lastMoved}"]`);
    if (el) el.classList.add('arrived');
    view.lastMoved = null;
  }
}

function renderHome() {
  const lists = [...state.lists].sort((a, b) => (b.updated || 0) - (a.updated || 0));
  const cards = lists.map((l) => {
    const c = counts(l);
    return `<li><a class="card" href="#/liste/${l.id}">
      <span class="card-emoji" aria-hidden="true">${esc(l.emoji)}</span>
      <span class="card-body">
        <strong>${esc(l.name)}</strong>
        <small>${esc(listMeta(l))}</small>
        <span class="bar ${c.total && c.packed === c.total ? 'full' : ''}"><i style="width:${c.pct}%"></i></span>
      </span>
      <span class="card-count">${c.packed}/${c.total}</span>
    </a></li>`;
  }).join('');

  return `
    <header class="topbar">
      <div class="brand"><img src="icon.svg" alt=""><h1>Packfertig</h1></div>
    </header>
    <section class="hero">
      <h2>Nichts mehr vergessen.</h2>
      <p>Liste anlegen, Sachen abhaken – alles Eingepackte landet ordentlich unter „Eingepackt“.</p>
    </section>
    ${installHint()}
    <p class="section-label">Deine Listen</p>
    ${lists.length ? `<ul class="lists">${cards}</ul>` : `
      <div class="empty">
        <div class="big" aria-hidden="true">🧳</div>
        <p><b>Noch keine Liste.</b><br>Tippe unten auf „Neue Liste“.</p>
      </div>`}
    <div class="backup">
      <p>Deine Listen werden automatisch in diesem Browser gespeichert. Für ein anderes Gerät:</p>
      <button class="link-btn" data-action="export">Backup herunterladen</button>
      <button class="link-btn" data-action="import">Backup laden</button>
    </div>
    <button class="fab" data-action="new">${I.plus} Neue Liste</button>`;
}

/* ---------- Home-Bildschirm & Offline ---------- */
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function hintHidden() { try { return localStorage.getItem('packfertig.hint') === 'aus'; } catch (e) { return false; } }
function installHint() {
  if (isStandalone() || hintHidden()) return '';
  const how = isIOS()
    ? 'In Safari unten auf <b>Teilen</b> tippen → <b>„Zum Home-Bildschirm“</b>.'
    : 'Im Browser-Menü <b>„App installieren“</b> bzw. <b>„Zum Startbildschirm hinzufügen“</b> wählen.';
  const warn = isIOS() && state.lists.length
    ? '<p class="hint-warn">Wichtig: Die App auf dem Home-Bildschirm hat einen eigenen Speicher. Lade vorher hier ein <b>Backup</b> herunter und in der App wieder hoch – sonst fehlen dort deine bisherigen Listen.</p>'
    : '';
  return `<section class="install-hint">
    <button class="hint-close" data-action="hide-hint" aria-label="Hinweis ausblenden">${I.close}</button>
    <b>📲 Als App aufs Handy</b>
    <p>${how} Danach funktioniert Packfertig auch im Flugmodus.</p>${warn}
  </section>`;
}

function renderItem(item, packed) {
  const partial = item.qty > 1 && item.got > 0 && !packed;
  const editTools = view.edit ? `
    <div class="stepper">
      <button data-action="qty" data-id="${item.id}" data-delta="-1" aria-label="Weniger">−</button>
      <span>${item.qty}</span>
      <button data-action="qty" data-id="${item.id}" data-delta="1" aria-label="Mehr">+</button>
    </div>
    <button class="mini-btn danger" data-action="del-item" data-id="${item.id}" aria-label="Löschen">${I.trash}</button>` : '';
  return `<li class="item" data-item="${item.id}">
    <button class="item-main" data-action="${view.edit ? 'rename-item' : packed ? 'unpack' : 'pack'}" data-id="${item.id}"
      aria-label="${esc(item.name)} ${view.edit ? 'umbenennen' : packed ? 'wieder auspacken' : 'als eingepackt markieren'}">
      <span class="check ${partial ? 'part' : ''}" style="--p:${Math.round((item.got / item.qty) * 100)}%">${I.check}</span>
      <span class="item-name">${esc(item.name)}</span>
    </button>
    ${!view.edit && item.qty > 1 ? `<button class="qty ${partial ? 'part' : ''}" data-action="count" data-id="${item.id}"
      aria-label="${esc(item.name)}: ${item.got} von ${item.qty} eingepackt – Anzahl ändern">${packed || partial ? `${item.got}/${item.qty}` : `${item.qty}×`}</button>` : ''}
    ${editTools}
  </li>`;
}

function renderList(list) {
  const c = counts(list);
  const chips = [];
  if (list.type === 'urlaub') {
    const s = list.settings;
    chips.push(`🗓️ ${s.days} ${s.days === 1 ? 'Tag' : 'Tage'}`);
    chips.push(`${WEATHER[s.weather].emoji} ${WEATHER[s.weather].label}`);
    chips.push(s.reserve ? `➕ ${s.reserveCount} Ersatzteile` : 'Ohne Reserve');
    if (s.wash) chips.push('🧺 Waschen möglich');
    s.extras.forEach((x) => EXTRAS[x] && chips.push(`${EXTRAS[x].emoji} ${EXTRAS[x].label}`));
  } else if (list.type === 'sport') {
    chips.push(`${SPORTS[list.settings.sport].emoji} ${SPORTS[list.settings.sport].label}`);
    chips.push(ANLASS[list.settings.anlass].label);
  }

  const cats = list.categories.map((cat) => {
    const open = cat.items.filter((i) => !i.packed);
    const packed = cat.items.filter((i) => i.packed);
    return `<section class="cat ${view.edit ? 'editing' : ''}">
      <header class="cat-head">
        <h2>${esc(cat.name)}</h2>
        ${view.edit ? `
          <button class="mini-btn" data-action="rename-cat" data-cat="${cat.id}" aria-label="Kategorie umbenennen">${I.edit}</button>
          <button class="mini-btn danger" data-action="del-cat" data-cat="${cat.id}" aria-label="Kategorie löschen">${I.trash}</button>`
        : `<span class="cat-count">${packed.length}/${cat.items.length}</span>`}
      </header>
      <ul class="items">${open.map((i) => renderItem(i, false)).join('')}</ul>
      <form class="add-row" data-add-form="${cat.id}">
        <input type="text" name="name" placeholder="+ Hinzufügen …" aria-label="Neuen Gegenstand zu ${esc(cat.name)} hinzufügen" data-add="${cat.id}" autocomplete="off" enterkeyhint="done">
        <button type="submit" aria-label="Hinzufügen">${'＋'}</button>
      </form>
      ${packed.length ? `<div class="packed ${cat.collapsed ? 'collapsed' : ''}">
        <button class="packed-head" data-action="toggle-packed" data-cat="${cat.id}" aria-expanded="${!cat.collapsed}">
          ✓ Eingepackt · ${packed.length} ${I.chev}
        </button>
        <ul class="items">${packed.map((i) => renderItem(i, true)).join('')}</ul>
      </div>` : ''}
    </section>`;
  }).join('');

  const done = c.total > 0 && c.packed === c.total;
  return `
    <header class="topbar">
      <a class="icon-btn" href="#/" aria-label="Zurück zur Übersicht">${I.back}</a>
      <h1 class="title">${esc(list.emoji)} ${esc(list.name)}</h1>
      <button class="icon-btn" data-action="menu" aria-label="Menü">${I.more}</button>
    </header>
    <section class="summary">
      ${chips.length ? `<div class="chips">${chips.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : ''}
      <div class="progress-row"><strong>${c.packed} von ${c.total}</strong><span>eingepackt${c.partial ? ` · ${c.partial} teilweise` : ''} · ${c.pct} %</span></div>
      <span class="bar ${done ? 'full' : ''}"><i style="width:${c.pct}%"></i></span>
    </section>
    <div class="toolbar">
      <button class="pill ${view.edit ? 'on' : ''}" data-action="edit-toggle" aria-pressed="${view.edit}">${I.edit} ${view.edit ? 'Fertig' : 'Bearbeiten'}</button>
      ${list.type === 'urlaub' ? `<button class="pill" data-action="settings">${I.sliders} Tage & Reserve</button>` : ''}
    </div>
    ${view.edit ? '<p class="edit-hint">Tippe auf einen Namen zum Umbenennen. Mengen mit − / + anpassen.</p>' : ''}
    ${done ? `<div class="done-banner"><span class="big" aria-hidden="true">🎉</span><div><b>Alles eingepackt!</b>Gute Reise bzw. viel Erfolg.</div></div>` : ''}
    ${cats || '<div class="empty"><p>Noch keine Kategorie – leg unten eine an.</p></div>'}
    <button class="add-cat" data-action="add-cat">+ Kategorie hinzufügen</button>`;
}

/* ---------- Bottom-Sheet ---------- */
let sheetToken = 0;
function openSheet(html) {
  const s = $('#sheet');
  sheetToken++;
  s.innerHTML = `<div class="sheet-backdrop" data-action="close-sheet"></div>
    <div class="sheet-panel" role="dialog" aria-modal="true"><div class="grabber"></div>${html}</div>`;
  s.hidden = false;
  document.body.classList.add('no-scroll');
  requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('open')));
}
function updateSheet(html) {
  const panel = $('#sheet .sheet-panel');
  if (!panel) return openSheet(html);
  const top = panel.scrollTop;
  panel.innerHTML = `<div class="grabber"></div>${html}`;
  panel.scrollTop = top;
}
function closeSheet() {
  const s = $('#sheet');
  const t = ++sheetToken;
  s.classList.remove('open');
  document.body.classList.remove('no-scroll');
  setTimeout(() => { if (t === sheetToken) { s.hidden = true; s.innerHTML = ''; } }, 260);
}
const sheetHead = (title, back) => `<div class="sheet-head">
  ${back ? `<button class="icon-btn" data-action="${back}" aria-label="Zurück">${I.back}</button>` : ''}
  <h2>${esc(title)}</h2>
  <button class="icon-btn" data-action="close-sheet" aria-label="Schließen">${I.close}</button>
</div>`;

/* ---------- Neue Liste ---------- */
let draft = null;
const newDraft = () => ({ step: 'type', type: null, name: '', days: 5, reserve: true, reserveCount: 2, wash: false, weather: 'mild', extras: [], sport: 'fussball', anlass: 'training' });

function defaultName(d) {
  if (d.type === 'urlaub') return `Urlaub · ${d.days} ${d.days === 1 ? 'Tag' : 'Tage'}`;
  if (d.type === 'sport') return `${SPORTS[d.sport].label} · ${d.anlass === 'spiel' ? 'Spiel' : 'Training'}`;
  return 'Meine Liste';
}

function stepperField(label, key, value, unit, hint) {
  return `<div class="field"><span class="label">${label}</span>
    <div class="big-stepper">
      <button type="button" data-action="step" data-key="${key}" data-delta="-1" aria-label="Weniger">−</button>
      <output>${value} <small>${unit}</small></output>
      <button type="button" data-action="step" data-key="${key}" data-delta="1" aria-label="Mehr">+</button>
    </div>${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
}
function switchField(key, on, title, sub) {
  return `<label class="switch-row"><span class="txt"><b>${title}</b><small>${sub}</small></span>
    <input type="checkbox" class="switch" data-switch="${key}" ${on ? 'checked' : ''}></label>`;
}
function reservePreview(d) {
  const u = calcQty('daily', d);
  const h = calcQty('per:3', d);
  return `<div class="preview">Für ${d.days} ${d.days === 1 ? 'Tag' : 'Tage'} packst du z. B. <b>${u} Unterhosen</b>, <b>${u} Paar Socken</b> und <b>${h} ${h === 1 ? 'Hose' : 'Hosen'}</b>.</div>`;
}
function tripFields(d) {
  return `
    ${stepperField('Wie viele Tage?', 'days', d.days, d.days === 1 ? 'Tag' : 'Tage')}
    <div class="field">
      ${switchField('reserve', d.reserve, 'Mit Ersatz-Klamotten planen', 'Für Flecken, Regen & Co. ein paar Teile extra')}
      ${d.reserve ? `<div class="sub-option">${stepperField('Ersatzteile pro Kleidungsstück', 'reserveCount', d.reserveCount, 'extra')}</div>` : ''}
    </div>
    <div class="field">
      ${switchField('wash', d.wash, 'Unterwegs waschen möglich', 'Dann packst du höchstens für 7 Tage')}
      ${reservePreview(d)}
    </div>`;
}

function renderCreate() {
  const d = draft;
  if (d.step === 'type') {
    return sheetHead('Neue Liste') + `<div class="type-grid">${Object.entries(TYPES).map(([k, t]) => `
      <button class="type-tile" data-action="pick-type" data-type="${k}">
        <span class="card-emoji" aria-hidden="true">${t.emoji}</span>
        <span><b>${t.label}</b><small>${t.desc}</small></span>
      </button>`).join('')}</div>`;
  }
  let body = '';
  if (d.type === 'urlaub') {
    body = tripFields(d) + `
      <div class="field"><span class="label">Wetter am Ziel</span>
        <div class="segmented">${Object.entries(WEATHER).map(([k, w]) => `
          <button type="button" class="opt ${d.weather === k ? 'sel' : ''}" data-action="set" data-key="weather" data-val="${k}">${w.emoji} ${w.label}</button>`).join('')}</div>
      </div>
      <div class="field"><span class="label">Was hast du vor? <small style="font-weight:400;color:var(--muted)">(mehrere möglich)</small></span>
        <div class="opt-grid">${Object.entries(EXTRAS).map(([k, x]) => `
          <button type="button" class="opt ${d.extras.includes(k) ? 'sel' : ''}" data-action="toggle-extra" data-val="${k}">${x.emoji} ${x.label}</button>`).join('')}</div>
      </div>`;
  } else if (d.type === 'sport') {
    body = `
      <div class="field"><span class="label">Sportart</span>
        <div class="opt-grid">${Object.entries(SPORTS).map(([k, s]) => `
          <button type="button" class="opt ${d.sport === k ? 'sel' : ''}" data-action="set" data-key="sport" data-val="${k}">${s.emoji} ${s.label}</button>`).join('')}</div>
      </div>
      <div class="field"><span class="label">Wofür packst du?</span>
        <div class="segmented">${Object.entries(ANLASS).map(([k, a]) => `
          <button type="button" class="opt ${d.anlass === k ? 'sel' : ''}" data-action="set" data-key="anlass" data-val="${k}">${a.label}</button>`).join('')}</div>
      </div>`;
  } else {
    body = `<p class="hint" style="margin:0 0 18px">Du startest mit einer leeren Kategorie und fügst alles selbst hinzu.</p>`;
  }
  return sheetHead(TYPES[d.type].label, 'create-back') + `
    <div class="field"><label for="listName">Name der Liste</label>
      <input id="listName" class="text-input" data-draft="name" value="${esc(d.name)}" placeholder="${esc(defaultName(d))}" maxlength="60" autocomplete="off">
    </div>
    ${body}
    <button class="primary" data-action="create-submit">Liste erstellen</button>`;
}

function createList() {
  const d = draft;
  let categories, settings = {}, emoji = TYPES[d.type].emoji;
  if (d.type === 'urlaub') {
    settings = { days: d.days, reserve: d.reserve, reserveCount: d.reserveCount, wash: d.wash, weather: d.weather, extras: [...d.extras] };
    categories = buildCategories(URLAUB, matchUrlaub, d, settings);
  } else if (d.type === 'sport') {
    settings = { sport: d.sport, anlass: d.anlass };
    categories = buildCategories(SPORT, matchSport, d, null);
    emoji = SPORTS[d.sport].emoji;
  } else {
    categories = [{ id: uid(), name: 'Allgemein', items: [], collapsed: false }];
  }
  const list = { id: uid(), type: d.type, name: d.name.trim() || defaultName(d), emoji, settings, categories, created: Date.now(), updated: Date.now() };
  state.lists.push(list);
  save();
  closeSheet();
  location.hash = `#/liste/${list.id}`;
}

/* ---------- Einstellungen (Urlaub) ---------- */
let sdraft = null;
function renderSettings() {
  return sheetHead('Tage & Reserve') + tripFields(sdraft) + `
    <p class="hint" style="margin:-6px 0 16px">Die Mengen werden neu berechnet. Mengen, die du selbst geändert hast, bleiben so.</p>
    <button class="primary" data-action="settings-save">Übernehmen</button>`;
}

/* ---------- Teilweise eingepackt ---------- */
let cdraft = null;
function renderCount() {
  const it = findItem(getList(view.listId), cdraft.id).item;
  return sheetHead(it.name) + `
    <div class="field"><span class="label">Wie viele hast du schon eingepackt?</span>
      <div class="big-stepper">
        <button type="button" data-action="count-step" data-delta="-1" aria-label="Eins weniger">−</button>
        <output>${cdraft.got} <small>von ${it.qty}</small></output>
        <button type="button" data-action="count-step" data-delta="1" aria-label="Eins mehr">+</button>
      </div>
      <p class="hint">Z. B. wenn ein Teil noch in der Wäsche ist – der Rest bleibt offen, bis alles drin ist.</p>
    </div>
    <div class="count-quick">
      <button class="opt" data-action="count-set" data-val="0">Keins</button>
      <button class="opt" data-action="count-set" data-val="${it.qty}">Alle ${it.qty}</button>
    </div>
    <button class="primary" data-action="count-save">Übernehmen</button>`;
}

/* ---------- Menü ---------- */
function renderMenu(list) {
  return sheetHead(list.name) + `<div class="menu-list">
    ${list.type === 'urlaub' ? `<button class="menu-item" data-action="settings">${I.sliders} Tage & Reserve ändern</button>` : ''}
    <button class="menu-item" data-action="reset-all">${I.reset} Alles wieder auspacken</button>
    <button class="menu-item" data-action="rename-list">${I.edit} Umbenennen</button>
    <button class="menu-item" data-action="dup-list">${I.copy} Liste duplizieren</button>
    <button class="menu-item danger" data-action="del-list">${I.trash} Liste löschen</button>
  </div>`;
}

/* ---------- Toast ---------- */
let toastTimer, toastUndo = null;
function toast(msg, undo) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button data-action="undo">Rückgängig</button>' : ''}`;
  toastUndo = undo || null;
  $('#saved').classList.remove('show');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); toastUndo = null; }, 4500);
}

/* ---------- Aktionen ---------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const LIMITS = { days: [1, 60], reserveCount: [1, 5] };

function setPacked(id, packed, el) {
  const list = getList(view.listId);
  const f = findItem(list, id);
  if (!f) return;
  const apply = () => {
    setGot(f.item, packed ? f.item.qty : 0);
    if (packed) f.cat.collapsed = false;
    view.lastMoved = id;
    touch(list); save(); render();
  };
  const row = el.closest('.item');
  if (row && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    row.classList.add('leaving');
    setTimeout(apply, 160);
  } else apply();
}

const actions = {
  new() { draft = newDraft(); openSheet(renderCreate()); },
  'pick-type'(el) { draft.type = el.dataset.type; draft.step = 'form'; updateSheet(renderCreate()); },
  'create-back'() { draft.step = 'type'; updateSheet(renderCreate()); },
  set(el) { draft[el.dataset.key] = el.dataset.val; updateSheet(renderCreate()); },
  'toggle-extra'(el) {
    const v = el.dataset.val;
    draft.extras = draft.extras.includes(v) ? draft.extras.filter((x) => x !== v) : [...draft.extras, v];
    updateSheet(renderCreate());
  },
  step(el) {
    const target = sdraft && $('#sheet [data-action="settings-save"]') ? sdraft : draft;
    const k = el.dataset.key;
    const [a, b] = LIMITS[k];
    target[k] = clamp(target[k] + Number(el.dataset.delta), a, b);
    updateSheet(target === sdraft ? renderSettings() : renderCreate());
  },
  'create-submit'() { createList(); },
  'close-sheet'() { closeSheet(); sdraft = null; },

  pack(el) { setPacked(el.dataset.id, true, el); },
  count(el) {
    const f = findItem(getList(view.listId), el.dataset.id);
    cdraft = { id: f.item.id, got: f.item.got };
    openSheet(renderCount());
  },
  'count-step'(el) {
    const it = findItem(getList(view.listId), cdraft.id).item;
    cdraft.got = clamp(cdraft.got + Number(el.dataset.delta), 0, it.qty);
    updateSheet(renderCount());
  },
  'count-set'(el) { cdraft.got = Number(el.dataset.val); updateSheet(renderCount()); },
  'count-save'() {
    const list = getList(view.listId);
    const f = findItem(list, cdraft.id);
    const wasPacked = f.item.packed;
    setGot(f.item, cdraft.got);
    if (f.item.packed !== wasPacked) view.lastMoved = f.item.id;
    if (f.item.packed) f.cat.collapsed = false;
    cdraft = null;
    touch(list); save(); closeSheet(); render();
  },
  unpack(el) { setPacked(el.dataset.id, false, el); },
  'toggle-packed'(el) {
    const list = getList(view.listId);
    const cat = list.categories.find((c) => c.id === el.dataset.cat);
    cat.collapsed = !cat.collapsed;
    save(); render();
  },
  'hide-hint'() { try { localStorage.setItem('packfertig.hint', 'aus'); } catch (e) { /* egal */ } render(); },
  'edit-toggle'() { view.edit = !view.edit; render(); },
  qty(el) {
    const list = getList(view.listId);
    const f = findItem(list, el.dataset.id);
    f.item.qty = clamp(f.item.qty + Number(el.dataset.delta), 1, 99);
    f.item.calc = null; // eigene Menge – nicht mehr automatisch rechnen
    touch(list); save(); render();
  },
  'rename-item'(el) {
    const list = getList(view.listId);
    const f = findItem(list, el.dataset.id);
    const n = prompt('Neuer Name:', f.item.name);
    if (n && n.trim()) { f.item.name = n.trim().slice(0, 80); touch(list); save(); render(); }
  },
  'del-item'(el) {
    const list = getList(view.listId);
    const f = findItem(list, el.dataset.id);
    f.cat.items.splice(f.idx, 1);
    touch(list); save(); render();
    toast(`„${f.item.name}“ gelöscht`, () => { f.cat.items.splice(f.idx, 0, f.item); save(); render(); });
  },
  'rename-cat'(el) {
    const list = getList(view.listId);
    const cat = list.categories.find((c) => c.id === el.dataset.cat);
    const n = prompt('Kategorie umbenennen:', cat.name);
    if (n && n.trim()) { cat.name = n.trim().slice(0, 40); touch(list); save(); render(); }
  },
  'del-cat'(el) {
    const list = getList(view.listId);
    const idx = list.categories.findIndex((c) => c.id === el.dataset.cat);
    const [cat] = list.categories.splice(idx, 1);
    touch(list); save(); render();
    toast(`Kategorie „${cat.name}“ gelöscht`, () => { list.categories.splice(idx, 0, cat); save(); render(); });
  },
  'add-cat'() {
    const list = getList(view.listId);
    const n = prompt('Name der neuen Kategorie:', '');
    if (n && n.trim()) {
      const cat = { id: uid(), name: n.trim().slice(0, 40), items: [], collapsed: false };
      list.categories.push(cat);
      touch(list); save(); render();
      const input = $(`[data-add="${cat.id}"]`);
      if (input) { input.scrollIntoView({ block: 'center' }); input.focus(); }
    }
  },

  menu() { openSheet(renderMenu(getList(view.listId))); },
  settings() {
    const s = getList(view.listId).settings;
    sdraft = { days: s.days, reserve: s.reserve, reserveCount: s.reserveCount, wash: !!s.wash };
    if ($('#sheet .sheet-panel') && !$('#sheet').hidden) updateSheet(renderSettings());
    else openSheet(renderSettings());
  },
  'settings-save'() {
    const list = getList(view.listId);
    Object.assign(list.settings, sdraft);
    for (const c of list.categories) for (const i of c.items) if (i.calc) i.qty = calcQty(i.calc, list.settings);
    if (/^Urlaub · \d+ Tage?$/.test(list.name)) list.name = `Urlaub · ${list.settings.days} ${list.settings.days === 1 ? 'Tag' : 'Tage'}`;
    sdraft = null;
    touch(list); save(); closeSheet(); render();
    toast('Mengen aktualisiert');
  },
  'reset-all'() {
    const list = getList(view.listId);
    const before = list.categories.map((c) => c.items.map((i) => i.got));
    list.categories.forEach((c) => c.items.forEach((i) => setGot(i, 0)));
    touch(list); save(); closeSheet(); render();
    toast('Alles wieder ausgepackt', () => {
      list.categories.forEach((c, ci) => c.items.forEach((i, ii) => setGot(i, before[ci]?.[ii] ?? i.got)));
      save(); render();
    });
  },
  'rename-list'() {
    const list = getList(view.listId);
    closeSheet();
    const n = prompt('Neuer Name der Liste:', list.name);
    if (n && n.trim()) { list.name = n.trim().slice(0, 60); touch(list); save(); render(); }
  },
  'dup-list'() {
    const src = getList(view.listId);
    const copy = JSON.parse(JSON.stringify(src));
    copy.id = uid();
    copy.name = `${src.name} (Kopie)`.slice(0, 60);
    copy.created = copy.updated = Date.now();
    copy.categories.forEach((c) => { c.id = uid(); c.items.forEach((i) => { i.id = uid(); setGot(i, 0); }); });
    state.lists.push(copy);
    save(); closeSheet();
    location.hash = `#/liste/${copy.id}`;
    toast('Kopie erstellt – alles ausgepackt');
  },
  'del-list'() {
    const idx = state.lists.findIndex((l) => l.id === view.listId);
    const [list] = state.lists.splice(idx, 1);
    save(); closeSheet();
    location.hash = '#/';
    toast(`„${list.name}“ gelöscht`, () => { state.lists.splice(idx, 0, list); save(); render(); });
  },

  export() {
    const blob = new Blob([JSON.stringify({ app: 'packfertig', version: 1, exported: new Date().toISOString(), lists: state.lists }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `packfertig-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  import() { $('#importFile').click(); },
  undo() {
    const fn = toastUndo;
    toastUndo = null;
    $('#toast').classList.remove('show');
    if (fn) fn();
  },
};

/* ---------- Events ---------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = actions[el.dataset.action];
  if (fn) { e.preventDefault(); fn(el); }
});

document.addEventListener('input', (e) => {
  if (e.target.dataset.draft && draft) draft[e.target.dataset.draft] = e.target.value;
});

document.addEventListener('change', (e) => {
  const k = e.target.dataset.switch;
  if (!k) return;
  const target = sdraft && $('#sheet [data-action="settings-save"]') ? sdraft : draft;
  target[k] = e.target.checked;
  updateSheet(target === sdraft ? renderSettings() : renderCreate());
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-add-form]');
  if (!form) return;
  e.preventDefault();
  const input = form.querySelector('input');
  const name = input.value.trim();
  if (!name) return;
  const list = getList(view.listId);
  const cat = list.categories.find((c) => c.id === form.dataset.addForm);
  const m = name.match(/^(\d{1,2})\s*[x×]\s+(.+)$/i) || name.match(/^(.+?)\s+[x×]\s*(\d{1,2})$/i);
  let qty = 1, label = name;
  if (m) {
    if (/^\d/.test(m[1])) { qty = Number(m[1]); label = m[2]; } else { label = m[1]; qty = Number(m[2]); }
  }
  cat.items.push({ id: uid(), name: label.slice(0, 80), qty: clamp(qty || 1, 1, 99), calc: null, packed: false, got: 0 });
  touch(list); save(); render();
  const again = $(`[data-add="${cat.id}"]`);
  if (again) again.focus();
});

$('#importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const lists = Array.isArray(data) ? data : data.lists;
    if (!Array.isArray(lists)) throw new Error('format');
    const valid = lists.filter((l) => l && typeof l.name === 'string' && Array.isArray(l.categories));
    if (!valid.length) throw new Error('leer');
    const ids = new Set(state.lists.map((l) => l.id));
    valid.forEach((l) => {
      if (!l.id || ids.has(l.id)) l.id = uid();
      l.type = TYPES[l.type] ? l.type : 'eigene';
      l.settings = l.settings || {};
      if (l.type === 'urlaub' && !(l.settings.days && WEATHER[l.settings.weather] && Array.isArray(l.settings.extras))) l.type = 'eigene';
      if (l.type === 'sport' && !(SPORTS[l.settings.sport] && ANLASS[l.settings.anlass])) l.type = 'eigene';
      l.emoji = l.emoji || TYPES[l.type].emoji;
      l.categories.forEach((c) => { c.id = c.id || uid(); c.items = Array.isArray(c.items) ? c.items : []; c.items.forEach((i) => { i.id = i.id || uid(); i.qty = Number(i.qty) || 1; syncItem(i); }); });
      state.lists.push(l);
    });
    save(); render();
    toast(`${valid.length} ${valid.length === 1 ? 'Liste' : 'Listen'} geladen`);
  } catch (err) {
    toast('Diese Datei ist kein gültiges Packfertig-Backup.');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#sheet').hidden) { closeSheet(); sdraft = null; }
});

window.addEventListener('hashchange', route);
window.addEventListener('storage', (e) => { if (e.key === STORE_KEY) { state = load(); route(); } });
route();

/* Offline-Modus & dauerhafter Speicher */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

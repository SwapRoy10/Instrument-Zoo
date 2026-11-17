import { Viewer, Thumbnailer } from './viewer.js';
import { instruments, SECTIONS, ENSEMBLES } from './instruments/index.js';

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage full or blocked */ } },
};
const THUMB_VERSION = 'iz-thumb-v3';

const app = $('#app');
const list = $('#browser-list');
const partsList = $('#parts');
const tooltip = $('#tooltip');
const pin = $('#pin-label');
const isolateBtn = $('#btn-isolate');
const rotateBtn = $('#btn-rotate');
const search = $('#search');
const hint = $('#hint');

let current = null;
let selected = null;
let ensemble = store.get('iz-ensemble') || 'all';
if (!ENSEMBLES[ensemble]) ensemble = 'all';
let query = '';

const env = new URLSearchParams(location.search).get('env') || 'room';
const viewer = new Viewer($('#viewer'), {
  env,
  onPick: (id) => { if (id) selectPart(id === selected ? null : id); },
  onHover: (id, x, y) => {
    if (!id) { tooltip.hidden = true; return; }
    const part = current.parts.find((p) => p.id === id);
    tooltip.textContent = part ? part.name : id;
    tooltip.hidden = false;
    tooltip.style.transform = `translate(${x + 14}px, ${y + 14}px)`;
  },
});
viewer.onFrame = () => {
  if (!selected) { pin.hidden = true; return; }
  const p = viewer.projectPart(selected);
  if (!p) { pin.hidden = true; return; }
  pin.hidden = false;
  pin.style.transform = `translate(${p.x}px, ${p.y}px)`;
};

const sectionColor = (id) => getComputedStyle(document.documentElement).getPropertyValue(`--c-${id}`).trim() || '#ff7a45';
const sectionName = (id) => SECTIONS.find((s) => s.id === id)?.name ?? id;

// ===========================================================================
// Browser
// ===========================================================================
const cards = new Map(); // id -> card element

function buildEnsembleFilter() {
  const seg = $('#ensemble-filter');
  Object.entries(ENSEMBLES).forEach(([id, label]) => {
    const b = el('button', null, label);
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.dataset.id = id;
    b.addEventListener('click', () => {
      ensemble = id;
      store.set('iz-ensemble', id);
      renderBrowser();
    });
    seg.append(b);
  });
}

function visibleInstruments() {
  const q = query.trim().toLowerCase();
  return instruments.filter((inst) => {
    if (ensemble !== 'all' && !inst.ensembles.includes(ensemble)) return false;
    if (!q) return true;
    return inst.name.toLowerCase().includes(q) || sectionName(inst.section).toLowerCase().includes(q);
  });
}

function makeCard(inst) {
  const b = el('button', 'card');
  b.type = 'button';
  b.dataset.id = inst.id;
  b.dataset.section = inst.section;
  const thumb = el('span', 'thumb');
  const img = el('img');
  img.alt = '';
  img.decoding = 'async';
  thumb.append(img);
  b.append(thumb, el('span', 'card-name', inst.name), el('span', 'card-meta', inst.range.split(' (')[0]));
  b.addEventListener('click', () => {
    go(inst.id);
    closeDrawer();
  });
  const cached = store.get(`${THUMB_VERSION}-${inst.id}`);
  if (cached) setThumb(b, cached);
  return b;
}

function setThumb(card, url) {
  const img = card.querySelector('img');
  img.onload = () => { img.classList.add('ready'); card.querySelector('.thumb').classList.add('loaded'); };
  img.src = url;
}

function renderBrowser() {
  $('#ensemble-filter').querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', b.dataset.id === ensemble));
  const vis = visibleInstruments();
  list.replaceChildren();
  SECTIONS.forEach((sec) => {
    const items = vis.filter((i) => i.section === sec.id);
    if (!items.length) return;
    const wrap = el('section', 'sec');
    wrap.dataset.section = sec.id;
    const head = el('h3', 'sec-head');
    head.append(el('span', 'dot'), el('span', null, sec.name), el('span', 'n', String(items.length)));
    const grid = el('div', 'cards');
    items.forEach((inst) => {
      if (!cards.has(inst.id)) cards.set(inst.id, makeCard(inst));
      const card = cards.get(inst.id);
      card.classList.toggle('active', inst === current);
      grid.append(card);
    });
    wrap.append(head, grid);
    list.append(wrap);
  });
  if (!vis.length) list.append(el('p', 'empty', 'No instruments match that search.'));
  updateNavButtons();
}

// ----- Lazy thumbnails, rendered one by one when the browser is idle -----
let thumbnailer = null;
function queueThumbnails() {
  const todo = instruments.filter((i) => !store.get(`${THUMB_VERSION}-${i.id}`) && !cards.get(i.id)?.querySelector('img.ready'));
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 60));
  const step = () => {
    const inst = todo.shift();
    if (!inst) { thumbnailer?.renderer.dispose(); thumbnailer = null; return; }
    try {
      thumbnailer ||= new Thumbnailer(220);
      const url = thumbnailer.render(inst);
      store.set(`${THUMB_VERSION}-${inst.id}`, url);
      if (cards.has(inst.id)) setThumb(cards.get(inst.id), url);
    } catch (err) {
      console.warn('Thumbnail failed for', inst.id, err);
    }
    idle(step, { timeout: 400 });
  };
  idle(step, { timeout: 800 });
}

// ===========================================================================
// Instrument & parts
// ===========================================================================
function go(id, partId = null) {
  const hash = `#/${id}${partId ? `/${partId}` : ''}`;
  if (location.hash === hash) fromHash();
  else location.hash = hash;
}

function loadInstrument(id, partId = null) {
  const inst = instruments.find((i) => i.id === id) || instruments[0];
  const changed = current !== inst;
  if (changed) {
    current = inst;
    selected = null;
    app.dataset.section = inst.section;
    viewer.setAccent(sectionColor(inst.section));
    viewer.load(inst);
    renderPanel();
    cards.forEach((c, cid) => c.classList.toggle('active', cid === inst.id));
    cards.get(inst.id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    updateNavButtons();
    $('#panel .panel-scroll').scrollTop = 0;
  }
  const pid = partId && inst.parts.some((p) => p.id === partId) ? partId : null;
  selectPart(pid, !!pid || !changed);
}

function renderPanel() {
  const inst = current;
  $('#inst-section').textContent = sectionName(inst.section);
  $('#inst-name').textContent = inst.name;
  $('#inst-range').textContent = inst.range;
  $('#inst-size').textContent = inst.size;
  $('#inst-blurb').textContent = inst.blurb;
  $('#part-count').textContent = `${inst.parts.length} parts`;
  document.title = `${inst.name} · Instrument Zoo`;

  const badges = $('#inst-badges');
  badges.replaceChildren();
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5M14 19c0-2.4 1.6-4 4-4s3 1.2 3 3"/></svg>';
  if (!inst.ensembles.length) {
    const b = el('span', 'badge');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>';
    b.append('Guest exhibit');
    badges.append(b);
  }
  inst.ensembles.forEach((e) => {
    const b = el('span', 'badge');
    b.innerHTML = icon;
    b.append(ENSEMBLES[e]);
    badges.append(b);
  });

  partsList.replaceChildren();
  inst.parts.forEach((part, i) => {
    const li = el('li', 'part');
    li.dataset.id = part.id;
    const head = el('button', 'part-head');
    head.type = 'button';
    head.setAttribute('aria-expanded', 'false');
    head.append(el('span', 'part-num', String(i + 1).padStart(2, '0')), el('span', 'part-name', part.name));
    head.insertAdjacentHTML('beforeend', '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>');
    head.addEventListener('click', () => selectPart(selected === part.id ? null : part.id));
    const body = el('div', 'part-body');
    const sec = (label, text, cls = '') => {
      const s = el('div', `part-sec ${cls}`);
      s.append(el('h3', null, label), el('p', null, text));
      return s;
    };
    body.append(sec('What it is', part.what), sec('Why it matters', part.why));
    if (part.fact) body.append(sec('Did you know?', part.fact, 'fact'));
    li.append(head, body);
    partsList.append(li);
  });
}

function selectPart(id, fly = true) {
  selected = id;
  viewer.setSelected(id);
  partsList.querySelectorAll('.part').forEach((li) => {
    const on = li.dataset.id === id;
    li.classList.toggle('open', on);
    li.querySelector('.part-head').setAttribute('aria-expanded', on);
    if (on) requestAnimationFrame(() => li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  });
  if (id) {
    pin.textContent = current.parts.find((p) => p.id === id).name;
    if (fly) viewer.focusPart(id);
  } else if (fly) {
    viewer.overview();
  }
  isolateBtn.disabled = !id;
  const hash = `#/${current.id}${id ? `/${id}` : ''}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

function stepPart(delta) {
  const ids = current.parts.map((p) => p.id);
  const i = selected ? ids.indexOf(selected) : delta > 0 ? -1 : 0;
  selectPart(ids[(i + delta + ids.length) % ids.length]);
}

function navList() {
  const vis = visibleInstruments();
  return vis.includes(current) ? vis : instruments;
}
function stepInstrument(delta) {
  const l = navList();
  const i = l.indexOf(current);
  go(l[(i + delta + l.length) % l.length].id);
}
function updateNavButtons() {
  if (!current) return;
  const l = navList();
  const i = l.indexOf(current);
  $('#prev-inst span').textContent = l[(i - 1 + l.length) % l.length].name;
  $('#next-inst span').textContent = l[(i + 1) % l.length].name;
}

// ===========================================================================
// Layout: keep the model framed in the area not covered by panels
// ===========================================================================
function updateInsets() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const panel = $('#panel').getBoundingClientRect();
  const browser = $('#browser').getBoundingClientRect();
  const phone = W <= 760;
  const drawer = W <= 1180;
  const insets = {
    left: drawer ? 0 : browser.right,
    right: phone ? 0 : W - panel.left,
    top: phone ? 60 : 0,
    bottom: phone ? H - panel.top : 0,
  };
  viewer.setInsets(insets);
  app.style.setProperty('--il', `${insets.left}px`);
  app.style.setProperty('--ir', `${insets.right}px`);
  app.style.setProperty('--ib', `${insets.bottom}px`);
}
window.addEventListener('resize', updateInsets);

function openDrawer() {
  app.classList.add('browsing');
  $('#scrim').hidden = false;
  $('#browse-toggle').setAttribute('aria-expanded', 'true');
}
function closeDrawer() {
  app.classList.remove('browsing');
  $('#scrim').hidden = true;
  $('#browse-toggle').setAttribute('aria-expanded', 'false');
}
$('#browse-toggle').addEventListener('click', () => (app.classList.contains('browsing') ? closeDrawer() : openDrawer()));
$('#scrim').addEventListener('click', closeDrawer);

// ===========================================================================
// Controls
// ===========================================================================
$('#btn-reset').addEventListener('click', () => selectPart(null));
isolateBtn.addEventListener('click', () => {
  const on = isolateBtn.getAttribute('aria-pressed') !== 'true';
  isolateBtn.setAttribute('aria-pressed', on);
  viewer.setIsolate(on);
});
rotateBtn.addEventListener('click', () => {
  const on = rotateBtn.getAttribute('aria-pressed') !== 'true';
  rotateBtn.setAttribute('aria-pressed', on);
  viewer.setAutoRotate(on);
});
$('#prev-inst').addEventListener('click', () => stepInstrument(-1));
$('#next-inst').addEventListener('click', () => stepInstrument(1));
search.addEventListener('input', () => { query = search.value; renderBrowser(); });

window.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea')) {
    if (e.key === 'Escape') search.blur();
    return;
  }
  if (e.key === '/') { e.preventDefault(); if (window.innerWidth <= 1180) openDrawer(); search.focus(); }
  else if (e.key === 'Escape') { if (app.classList.contains('browsing')) closeDrawer(); else selectPart(null); }
  else if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); stepPart(1); }
  else if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); stepPart(-1); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); stepInstrument(1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); stepInstrument(-1); }
  else if (e.key === 'i' && selected) isolateBtn.click();
});

$('#viewer').addEventListener('pointerdown', () => hint.classList.add('gone'), { once: true });
setTimeout(() => hint.classList.add('gone'), 9000);

// ===========================================================================
// Deep links: #/instrument/part
// ===========================================================================
function fromHash() {
  const [, inst, part] = location.hash.split('/');
  loadInstrument(inst || instruments[0].id, part || null);
}
window.addEventListener('hashchange', fromHash);

buildEnsembleFilter();
renderBrowser();
updateInsets();
fromHash();
requestAnimationFrame(() => {
  const loading = $('#loading');
  loading.classList.add('done');
  setTimeout(() => loading.remove(), 600);
  queueThumbnails();
});

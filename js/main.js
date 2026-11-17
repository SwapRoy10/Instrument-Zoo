import { Viewer, Thumbnailer } from './viewer.js';
import { instruments, SECTIONS, ENSEMBLES } from './instruments/index.js';

// ===========================================================================
// Utilities
// ===========================================================================
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
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const roman = (n) => {
  const map = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
};
const sectionName = (id) => SECTIONS.find((s) => s.id === id)?.name ?? id;
const THUMB_VERSION = 'iz-thumb-v4';
const SLIDE = 24; // % of the stage width an instrument travels during a transition

// ===========================================================================
// State & elements
// ===========================================================================
const app = $('#app');
const stageEl = $('#stage');
const viewerEl = $('#viewer');
const notesInner = $('#notes-inner');
const plaque = $('#plaque');
const partsList = $('#parts');
const tooltip = $('#tooltip');
const pin = $('#pin-label');
const isolateBtn = $('#btn-isolate');
const rotateBtn = $('#btn-rotate');
const peekPrev = $('#peek-prev');
const peekNext = $('#peek-next');

// Tabs: everything, then one per instrument family (in score order).
const TABS = [{ id: 'all', name: 'All Instruments' }, ...SECTIONS];
let filter = store.get('iz-family') || 'all';
if (!TABS.some((t) => t.id === filter)) filter = 'all';
let current = null;
let selected = null;
let busy = false;
let pending = null;
let insets = { left: 0, right: 0, top: 0, bottom: 0 };
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const lineup = () => (filter === 'all' ? instruments : instruments.filter((i) => i.section === filter));
const neighbours = () => {
  const l = lineup();
  const i = Math.max(0, l.indexOf(current));
  return { list: l, i, prev: l[(i - 1 + l.length) % l.length], next: l[(i + 1) % l.length] };
};

const viewer = new Viewer(viewerEl, {
  onPick: (id) => { if (id) selectPart(id === selected ? null : id); },
  onHover: (id, x, y) => {
    if (!id || busy) { tooltip.hidden = true; return; }
    const part = current.parts.find((p) => p.id === id);
    tooltip.textContent = part ? part.name : id;
    tooltip.hidden = false;
    tooltip.style.transform = `translate(${x + 16}px, ${y + 16}px)`;
  },
});
viewer.setAccent('#c9973f'); // gilded highlight for selected parts
viewer.onFrame = () => {
  if (!selected || busy) { pin.hidden = true; return; }
  const p = viewer.projectPart(selected);
  if (!p) { pin.hidden = true; return; }
  pin.hidden = false;
  pin.style.transform = `translate(${p.x}px, ${p.y}px)`;
};

// ===========================================================================
// Thumbnails (rendered lazily off-screen, cached in the browser)
// ===========================================================================
const thumbs = new Map();
instruments.forEach((i) => { const t = store.get(`${THUMB_VERSION}-${i.id}`); if (t) thumbs.set(i.id, t); });
const thumbQueue = [];
const thumbListeners = new Map(); // id -> [fn]
let thumbnailer = null;
let thumbRunning = false;

function whenThumb(inst, fn) {
  if (thumbs.has(inst.id)) { fn(thumbs.get(inst.id)); return; }
  if (!thumbListeners.has(inst.id)) thumbListeners.set(inst.id, []);
  thumbListeners.get(inst.id).push(fn);
  const at = thumbQueue.indexOf(inst);
  if (at >= 0) thumbQueue.splice(at, 1);
  thumbQueue.unshift(inst); // most recently requested first
  pumpThumbs();
}

function renderThumb(inst) {
  if (!thumbs.has(inst.id)) {
    try {
      thumbnailer ||= new Thumbnailer(240);
      const url = thumbnailer.render(inst);
      thumbs.set(inst.id, url);
      store.set(`${THUMB_VERSION}-${inst.id}`, url);
    } catch (err) {
      console.warn('Thumbnail failed for', inst.id, err);
    }
  }
  (thumbListeners.get(inst.id) || []).forEach((fn) => thumbs.has(inst.id) && fn(thumbs.get(inst.id)));
  thumbListeners.delete(inst.id);
  return thumbs.get(inst.id) || null;
}

/** The picture of an instrument right now, rendering it on the spot if it isn't ready yet. */
const thumbFor = (inst) => renderThumb(inst);

function pumpThumbs() {
  if (thumbRunning) return;
  thumbRunning = true;
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 80));
  const step = () => {
    if (busy) { setTimeout(step, 300); return; } // never stall an animation
    const inst = thumbQueue.shift();
    if (!inst) { thumbRunning = false; return; }
    renderThumb(inst);
    idle(step, { timeout: 500 });
  };
  idle(step, { timeout: 500 });
}

function setImg(img, url) {
  if (img.dataset.src === url) return;
  img.classList.remove('ready');
  img.dataset.src = url;
  img.onload = () => img.classList.add('ready');
  img.src = url;
}

// ===========================================================================
// Ensemble tabs
// ===========================================================================
const tabsEl = $('#tabs');
const ink = $('#tab-ink');
TABS.forEach(({ id, name }) => {
  const b = el('button', 'tab', name);
  b.type = 'button';
  b.dataset.id = id;
  b.setAttribute('role', 'tab');
  const count = id === 'all' ? instruments.length : instruments.filter((i) => i.section === id).length;
  b.append(el('span', 'n', String(count)));
  b.addEventListener('click', () => setFilter(id));
  tabsEl.append(b);
});

function moveInk() {
  const tab = tabsEl.querySelector(`.tab[data-id="${filter}"]`);
  tabsEl.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', t === tab));
  if (!tab) return;
  const pad = Math.max(0, parseFloat(getComputedStyle(tab).paddingLeft) - 4);
  ink.style.left = `${tab.offsetLeft + pad}px`;
  ink.style.width = `${tab.offsetWidth - 2 * pad}px`;
  // on narrow screens the tab row scrolls; keep the chosen tab in view
  if (tabsEl.scrollWidth > tabsEl.clientWidth) {
    tabsEl.scrollTo({ left: tab.offsetLeft - (tabsEl.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
  }
}

function setFilter(id) {
  if (id === filter) return;
  filter = id;
  store.set('iz-family', id);
  moveInk();
  if (!lineup().includes(current)) navigate(lineup()[0], null, 0);
  else updateStageLabels(true);
}

// ===========================================================================
// Carousel navigation
// ===========================================================================
async function navigate(inst, partId = null, dir = null) {
  if (!inst) return;
  if (busy) { pending = [inst, partId, dir]; return; }
  if (inst === current) { selectPart(partId); return; }
  if (!current || reduceMotion.matches) { applyInstrument(inst, partId); return; }

  const n = neighbours();
  if (dir === null) {
    dir = inst === n.next ? 1 : inst === n.prev ? -1 : Math.sign(n.list.indexOf(inst) - n.i) || 1;
  }
  const side = dir > 0 ? n.next : n.prev;
  if (inst === side && peekNext.offsetParent) { await turnTo(inst, partId, dir); return; }

  busy = true;
  tooltip.hidden = true;

  // 1. Freeze the outgoing instrument into a ghost image and send it off-stage.
  const ghost = viewer.snapshot();
  ghost.className = 'ghost';
  viewerEl.after(ghost);
  viewerEl.classList.add('no-anim');
  viewerEl.style.opacity = '0';
  viewerEl.style.transform = `translateX(${dir * SLIDE}%) scale(0.9)`;
  notesInner.classList.add('leaving');
  plaque.classList.add('leaving');
  peekPrev.classList.add('swapping');
  peekNext.classList.add('swapping');
  await frame();
  ghost.style.opacity = '0';
  ghost.style.transform = `translateX(${-dir * SLIDE}%) scale(0.9)`;

  // 2. While it leaves, build the new instrument behind the scenes.
  await wait(230);
  applyInstrument(inst, partId);
  await frame();
  await frame();

  // 3. Glide the newcomer into the spotlight.
  viewerEl.classList.remove('no-anim');
  viewerEl.style.opacity = '';
  viewerEl.style.transform = '';
  notesInner.classList.remove('leaving');
  plaque.classList.remove('leaving');
  setTimeout(() => ghost.remove(), 1000);
  await wait(650);
  finishNavigation();
}

function finishNavigation() {
  busy = false;
  if (pending) {
    const p = pending;
    pending = null;
    navigate(...p);
  }
}

// --- Grow / shrink swap: the clicked preview grows into the spotlight while the
//     current instrument shrinks into the opposite preview slot. ---
const TURN_MS = 800;
const TURN_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

/** A box in stage coordinates. */
function stageBox(node) {
  const s = stageEl.getBoundingClientRect();
  const r = node.getBoundingClientRect();
  return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
}
const squareIn = (b) => {
  const s = Math.min(b.w, b.h);
  return { x: b.x + (b.w - s) / 2, y: b.y + (b.h - s) / 2, w: s, h: s };
};
/** Where a thumbnail-sized picture of the instrument sits when the live model is in the spotlight. */
function spotlightBox() {
  const w = viewerEl.clientWidth - insets.left - insets.right;
  const h = viewerEl.clientHeight - insets.top - insets.bottom;
  const s = Math.min(w, h) / 1.09; // thumbnails frame the model ~9% tighter than the stage does
  return { x: insets.left + (w - s) / 2, y: insets.top + (h - s) / 2, w: s, h: s };
}
const centreOf = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
/** Anchor point for a preview's caption (its label, or the card's foot when labels are hidden). */
function captionPoint(peek) {
  const label = stageBox(peek.querySelector('.peek-label'));
  if (label.w) return centreOf(label);
  const f = stageBox(peek.querySelector('.peek-frame'));
  return { x: f.x + f.w / 2, y: f.y + f.h };
}
function makeCaption(inst, at) {
  const cap = el('div', 'turn-cap');
  const sec = el('p', 'plaque-section', sectionName(inst.section));
  sec.style.color = `var(--c-${inst.section})`;
  cap.append(sec, el('h2', 'plaque-name', inst.name));
  cap.style.left = `${at.x}px`;
  cap.style.top = `${at.y}px`;
  stageEl.append(cap);
  return cap;
}
const capFrame = (dx, dy, s) => `translate(${dx}px, ${dy}px) translate(-50%, -50%) scale(${s})`;

async function turnTo(inst, partId, dir) {
  busy = true;
  tooltip.hidden = true;
  const from = dir > 0 ? peekNext : peekPrev; // the preview that grows into the spotlight
  const to = dir > 0 ? peekPrev : peekNext; //   the slot the current instrument shrinks into
  thumbFor(current); // the outgoing instrument becomes a preview; have its picture ready

  // Measure everything before the stage changes.
  const W = viewerEl.clientWidth;
  const H = viewerEl.clientHeight;
  const centre = spotlightBox();
  const fromSq = squareIn(stageBox(from.querySelector('img')));
  const toSq = squareIn(stageBox(to.querySelector('img')));
  const plaqueAt = centreOf(stageBox(plaque));
  const fromCap = captionPoint(from);
  const toCap = captionPoint(to);
  const opts = { duration: TURN_MS, easing: TURN_EASE, fill: 'forwards' };

  // Outgoing: a still of the current view, which will shrink into the opposite preview slot.
  const leaving = current;
  const out = viewer.snapshot();
  out.className = 'turn-ghost';
  out.style.width = `${W}px`;
  out.style.height = `${H}px`;
  viewerEl.after(out);
  const capOut = makeCaption(leaving, plaqueAt);
  const capIn = makeCaption(inst, plaqueAt);
  capIn.style.opacity = '0';

  // Incoming: the live 3D stage itself, starting shrunk into the clicked preview's slot.
  // The model was prebuilt in the background, so swapping it in here is near-instant.
  const s0 = fromSq.w / centre.w;
  const startAt = `translate(${fromSq.x - centre.x * s0}px, ${fromSq.y - centre.y * s0}px) scale(${s0})`;
  viewerEl.classList.add('no-anim');
  viewerEl.style.transformOrigin = '0 0';
  viewerEl.style.transform = startAt;
  viewerEl.style.opacity = '0.6';
  app.classList.add('turning');
  notesInner.classList.add('leaving');
  applyInstrument(inst, partId, { glide: false, notes: false });
  await frame();
  await frame(); // let the newcomer draw once before anything starts moving

  // Everything moves together from here.
  const s = toSq.w / centre.w;
  const outAnim = out.animate([
    { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
    { transform: `translate(${toSq.x - centre.x * s}px, ${toSq.y - centre.y * s}px) scale(${s})`, opacity: 0.55 },
  ], opts);
  const inAnim = viewerEl.animate([
    { transform: startAt, opacity: 0.6 },
    { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
  ], opts);
  setTimeout(() => { showNotes(); notesInner.classList.remove('leaving'); }, 340);

  // Captions travel with their instruments.
  capIn.style.opacity = '';
  const capOutAnim = capOut.animate([
    { transform: capFrame(0, 0, 1), opacity: 1 },
    { transform: capFrame(toCap.x - plaqueAt.x, toCap.y - plaqueAt.y, 0.42), opacity: 0 },
  ], { ...opts, duration: TURN_MS * 0.8 });
  const capInAnim = capIn.animate([
    { transform: capFrame(fromCap.x - plaqueAt.x, fromCap.y - plaqueAt.y, 0.42), opacity: 0 },
    { transform: capFrame(0, 0, 1), opacity: 1 },
  ], opts);

  await Promise.all([outAnim, inAnim, capOutAnim, capInAnim].map((a) => a.finished));

  // Hand over to the resting state: same pixels, so nothing visibly changes.
  viewerEl.style.transform = '';
  viewerEl.style.opacity = '';
  viewerEl.style.transformOrigin = '';
  inAnim.cancel();
  capOut.remove();
  capIn.remove();
  app.classList.remove('turning'); // previews (refilled) fade back in; the plaque takes over from the caption
  out.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: 450, easing: 'ease-out', fill: 'forwards' })
    .finished.then(() => out.remove());
  await frame();
  viewerEl.classList.remove('no-anim');
  finishNavigation();
}

/** Build the instruments either side in idle time so the next switch has nothing to wait for. */
function prepareNeighbours() {
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 200));
  const n = neighbours();
  const prep = (inst) => idle(() => {
    if (busy) { setTimeout(() => prep(inst), 500); return; }
    if (lineup().includes(inst)) viewer.prepare(inst);
  }, { timeout: 2500 });
  prep(n.next);
  prep(n.prev);
}

function step(delta) {
  const n = neighbours();
  if (n.list.length < 2) return;
  navigate(delta > 0 ? n.next : n.prev, null, delta);
}

function applyInstrument(inst, partId, { glide = true, notes = true } = {}) {
  current = inst;
  selected = null;
  app.dataset.section = inst.section;
  viewer.load(inst, { glide });
  if (notes) showNotes();
  updateStageLabels(false);
  document.title = `${inst.name} · Instrument Zoo`;
  const pid = partId && inst.parts.some((p) => p.id === partId) ? partId : null;
  selectPart(pid, !!pid);
}

function showNotes() {
  renderNotes();
  // re-mark the open part, since the list was rebuilt
  partsList.querySelectorAll('.part').forEach((li) => {
    const on = li.dataset.id === selected;
    li.classList.toggle('open', on);
    li.querySelector('.part-head').setAttribute('aria-expanded', on);
  });
  $('#notes-scroll').scrollTop = 0;
}

function updateStageLabels(animate) {
  const n = neighbours();
  app.classList.toggle('solo', n.list.length < 2); // nothing to step to (e.g. Keyboards)
  $('#plaque-section').textContent = sectionName(current.section);
  $('#plaque-name').textContent = current.name;
  const fill = (peek, inst) => {
    peek.querySelector('.peek-name').textContent = inst.name;
    peek.setAttribute('aria-label', `${peek === peekPrev ? 'Previous' : 'Next'}: ${inst.name}`);
    const img = peek.querySelector('img');
    peek.dataset.id = inst.id;
    if (!thumbs.has(inst.id)) img.classList.remove('ready');
    whenThumb(inst, (url) => { if (peek.dataset.id === inst.id) setImg(img, url); });
  };
  const swap = () => {
    fill(peekPrev, n.prev);
    fill(peekNext, n.next);
    peekPrev.classList.remove('swapping');
    peekNext.classList.remove('swapping');
  };
  if (animate) {
    peekPrev.classList.add('swapping');
    peekNext.classList.add('swapping');
    setTimeout(swap, 380);
  } else {
    swap();
  }
  prepareNeighbours();
  // warm up the pictures that the next transition will move: this one, and one step further out
  whenThumb(current, () => {});
  whenThumb(n.list[(n.i + 2) % n.list.length], () => {});
  whenThumb(n.list[(n.i - 2 + n.list.length) % n.list.length], () => {});
}

peekPrev.addEventListener('click', () => step(-1));
peekNext.addEventListener('click', () => step(1));

// ===========================================================================
// Programme notes & anatomy
// ===========================================================================
function renderNotes() {
  const inst = current;
  $('#inst-section').textContent = sectionName(inst.section);
  $('#inst-name').textContent = inst.name;
  $('#inst-ensembles').textContent = inst.ensembles.length
    ? `Heard in the ${inst.ensembles.map((e) => ENSEMBLES[e]).join(' & ')}`
    : 'A guest of the zoo, in neither ensemble';
  $('#inst-range').textContent = inst.range;
  $('#inst-size').textContent = inst.size;
  $('#inst-blurb').textContent = inst.blurb;
  $('#part-count').textContent = `${inst.parts.length} parts`;

  partsList.replaceChildren();
  inst.parts.forEach((part, i) => {
    const li = el('li', 'part');
    li.dataset.id = part.id;
    const head = el('button', 'part-head');
    head.type = 'button';
    head.setAttribute('aria-expanded', 'false');
    head.append(el('span', 'part-num', roman(i + 1)), el('span', 'part-name', part.name), el('span', 'part-mark'));
    head.addEventListener('click', () => selectPart(selected === part.id ? null : part.id));
    const sec = (label, text, cls = '') => {
      const s = el('div', `part-sec ${cls}`);
      s.append(el('h4', null, label), el('p', null, text));
      return s;
    };
    const inner = el('div', 'part-body-inner');
    inner.append(sec('What it is', part.what), sec('Why it matters', part.why));
    if (part.fact) inner.append(sec('Did you know?', part.fact, 'fact'));
    const clip = el('div');
    clip.append(inner);
    const body = el('div', 'part-body');
    body.append(clip);
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
    if (on) setTimeout(() => li.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 320);
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

// ===========================================================================
// Catalogue overlay
// ===========================================================================
const catalogue = $('#catalogue');
function openCatalogue() {
  const grid = $('#catalogue-grid');
  grid.replaceChildren();
  const l = lineup();
  let k = 0;
  SECTIONS.forEach((sec) => {
    const items = l.filter((i) => i.section === sec.id);
    if (!items.length) return;
    const col = el('section', 'cat-sec');
    col.dataset.section = sec.id;
    const h = el('h3', null, sec.name);
    h.style.color = `var(--c-${sec.id})`;
    col.append(h);
    items.forEach((inst) => {
      const b = el('button', `cat-item${inst === current ? ' current' : ''}`);
      b.type = 'button';
      b.style.animationDelay = `${Math.min(k++ * 25, 500)}ms`;
      const t = el('span', 'cat-thumb');
      const img = el('img');
      img.alt = '';
      t.append(img);
      whenThumb(inst, (url) => { img.src = url; });
      const text = el('span');
      text.append(el('span', 'cat-name', inst.name), el('span', 'cat-range', inst.range.split(' (')[0]));
      b.append(t, text);
      b.addEventListener('click', () => { closeCatalogue(); navigate(inst, null, null); });
      col.append(b);
    });
    grid.append(col);
  });
  catalogue.hidden = false;
  catalogue.classList.remove('closing');
  $('#catalogue-btn').setAttribute('aria-expanded', 'true');
}
function closeCatalogue() {
  if (catalogue.hidden) return;
  catalogue.classList.add('closing');
  $('#catalogue-btn').setAttribute('aria-expanded', 'false');
  setTimeout(() => { catalogue.hidden = true; catalogue.classList.remove('closing'); }, 340);
}
$('#catalogue-btn').addEventListener('click', () => (catalogue.hidden ? openCatalogue() : closeCatalogue()));
$('#catalogue-close').addEventListener('click', closeCatalogue);

// ===========================================================================
// Toolbar, keyboard, layout
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

window.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea')) return;
  if (e.key === 'Escape') { if (!catalogue.hidden) closeCatalogue(); else selectPart(null); }
  else if (!catalogue.hidden) return;
  else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  else if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); stepPart(1); }
  else if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); stepPart(-1); }
  else if (e.key === 'i' && selected) isolateBtn.click();
  else if (e.key === 'c') openCatalogue();
});

function updateInsets() {
  const W = viewerEl.clientWidth;
  const phone = window.innerWidth <= 820;
  const mast = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mast-h')) || 78;
  const side = phone ? 60 : Math.min(170, W * 0.16);
  insets = { left: side, right: side, top: phone ? mast : mast + 10, bottom: phone ? 90 : 120 };
  viewer.setInsets(insets);
  moveInk();
}
window.addEventListener('resize', updateInsets);
document.fonts?.ready.then(moveInk);

viewerEl.addEventListener('pointerdown', () => $('#hint').classList.add('gone'), { once: true });
setTimeout(() => $('#hint').classList.add('gone'), 10000);

// ===========================================================================
// Deep links: #/instrument/part
// ===========================================================================
function fromHash() {
  const [, id, part] = location.hash.split('/');
  const inst = instruments.find((i) => i.id === id) || lineup()[0];
  if (!lineup().includes(inst)) { filter = 'all'; moveInk(); }
  navigate(inst, part || null);
}
window.addEventListener('hashchange', fromHash);

updateInsets();
fromHash();
requestAnimationFrame(() => {
  const loading = $('#loading');
  loading.classList.add('done');
  setTimeout(() => loading.remove(), 900);
  // fill in the remaining thumbnails quietly for the catalogue
  instruments.forEach((i) => { if (!thumbs.has(i.id)) thumbQueue.push(i); });
  pumpThumbs();
});

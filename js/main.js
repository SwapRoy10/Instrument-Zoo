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

let filter = store.get('iz-filter') || 'all';
if (!ENSEMBLES[filter]) filter = 'all';
let current = null;
let selected = null;
let busy = false;
let pending = null;

const lineup = () => (filter === 'all' ? instruments : instruments.filter((i) => i.ensembles.includes(filter)));
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

function pumpThumbs() {
  if (thumbRunning) return;
  thumbRunning = true;
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 80));
  const step = () => {
    if (busy) { setTimeout(step, 300); return; } // never stall an animation
    const inst = thumbQueue.shift();
    if (!inst) { thumbRunning = false; return; }
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
Object.entries(ENSEMBLES).forEach(([id, label]) => {
  const b = el('button', 'tab', label);
  b.type = 'button';
  b.dataset.id = id;
  b.setAttribute('role', 'tab');
  const count = id === 'all' ? instruments.length : instruments.filter((i) => i.ensembles.includes(id)).length;
  b.append(el('span', 'n', String(count)));
  b.addEventListener('click', () => setFilter(id));
  tabsEl.append(b);
});

function moveInk() {
  const tab = tabsEl.querySelector(`.tab[data-id="${filter}"]`);
  tabsEl.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', t === tab));
  if (!tab) return;
  ink.style.left = `${tab.offsetLeft + 14}px`;
  ink.style.width = `${tab.offsetWidth - 28}px`;
}

function setFilter(id) {
  if (id === filter) return;
  filter = id;
  store.set('iz-filter', id);
  moveInk();
  if (!lineup().includes(current)) navigate(lineup()[0], null, 0);
  else updateStageLabels(true);
}

// ===========================================================================
// Carousel navigation with slide & fade
// ===========================================================================
async function navigate(inst, partId = null, dir = null) {
  if (!inst) return;
  if (busy) { pending = [inst, partId, dir]; return; }
  if (inst === current) { selectPart(partId); return; }
  if (!current) { applyInstrument(inst, partId); return; }

  if (dir === null) {
    const n = neighbours();
    dir = inst === n.next ? 1 : inst === n.prev ? -1 : Math.sign(n.list.indexOf(inst) - n.i) || 1;
  }
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
  busy = false;
  if (pending) {
    const p = pending;
    pending = null;
    navigate(...p);
  }
}

function step(delta) {
  const n = neighbours();
  navigate(delta > 0 ? n.next : n.prev, null, delta);
}

function applyInstrument(inst, partId) {
  current = inst;
  selected = null;
  app.dataset.section = inst.section;
  viewer.load(inst);
  renderNotes();
  updateStageLabels(false);
  $('#notes-scroll').scrollTop = 0;
  document.title = `${inst.name} · Instrument Zoo`;
  const pid = partId && inst.parts.some((p) => p.id === partId) ? partId : null;
  selectPart(pid, !!pid);
}

function updateStageLabels(animate) {
  const n = neighbours();
  $('#plaque-section').textContent = sectionName(current.section);
  $('#plaque-name').textContent = current.name;
  $('#plaque-count').textContent = `No. ${roman(n.i + 1)} of ${roman(n.list.length)}`;
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
  // warm up the thumbnails one step further out
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
  viewer.setInsets({ left: side, right: side, top: phone ? mast : mast + 10, bottom: phone ? 90 : 120 });
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

import { Viewer } from './viewer.js';
import { instruments } from './instruments/index.js';

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const tabs = $('#instrument-tabs');
const partsList = $('#parts');
const tooltip = $('#tooltip');
const pin = $('#pin-label');
const isolateBtn = $('#btn-isolate');
const rotateBtn = $('#btn-rotate');

let current = null;      // instrument definition
let selected = null;     // part id

const viewer = new Viewer($('#viewer'), {
  onPick: (id) => {
    if (id) selectPart(id === selected ? null : id);
  },
  onHover: (id, x, y) => {
    if (!id) { tooltip.hidden = true; return; }
    const part = current.parts.find((p) => p.id === id);
    tooltip.textContent = part ? part.name : id;
    tooltip.hidden = false;
    const stage = $('#stage').getBoundingClientRect();
    tooltip.style.transform = `translate(${x - stage.left + 14}px, ${y - stage.top + 14}px)`;
  },
});

// Keep the floating label pinned to the selected part as the camera moves.
viewer.onFrame = () => {
  if (!selected) { pin.hidden = true; return; }
  const p = viewer.projectPart(selected);
  if (!p) { pin.hidden = true; return; }
  pin.hidden = false;
  pin.style.transform = `translate(${p.x}px, ${p.y}px)`;
};

// ----- Instrument tabs -----
instruments.forEach((inst) => {
  const b = el('button', 'tab');
  b.type = 'button';
  b.dataset.id = inst.id;
  b.setAttribute('role', 'tab');
  b.append(el('span', 'tab-emoji', inst.emoji), el('span', 'tab-name', inst.name));
  b.addEventListener('click', () => loadInstrument(inst.id));
  tabs.append(b);
});

function loadInstrument(id, partId = null) {
  const inst = instruments.find((i) => i.id === id) || instruments[0];
  const changed = current !== inst;
  if (changed) {
    current = inst;
    selected = null;
    viewer.load(inst);
    renderOverview();
    tabs.querySelectorAll('.tab').forEach((t) => {
      const on = t.dataset.id === inst.id;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on);
      if (on) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  }
  const pid = partId && inst.parts.some((p) => p.id === partId) ? partId : null;
  // A fresh instrument is already framed; re-clicking the current one flies back to the overview.
  selectPart(pid, !!pid || !changed);
}

function renderOverview() {
  $('#inst-family').textContent = current.family;
  $('#inst-name').textContent = current.name;
  $('#inst-blurb').textContent = current.blurb;
  $('#part-count').textContent = `${current.parts.length} parts`;
  document.title = `${current.name} · Instrument Zoo`;

  partsList.replaceChildren();
  current.parts.forEach((part, i) => {
    const li = el('li', 'part');
    li.dataset.id = part.id;
    const head = el('button', 'part-head');
    head.type = 'button';
    head.setAttribute('aria-expanded', 'false');
    head.append(el('span', 'part-num', String(i + 1).padStart(2, '0')), el('span', 'part-name', part.name));
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
    const part = current.parts.find((p) => p.id === id);
    pin.textContent = part.name;
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

// ----- Toolbar -----
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

// ----- Keyboard -----
window.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea')) return;
  if (e.key === 'Escape') selectPart(null);
  else if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); stepPart(1); }
  else if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); stepPart(-1); }
  else if (e.key === 'i' && selected) isolateBtn.click();
});

// ----- Deep links: #/instrument/part -----
function fromHash() {
  const [, inst, part] = location.hash.split('/');
  loadInstrument(inst || instruments[0].id, part || null);
}
window.addEventListener('hashchange', fromHash);
fromHash();
$('#loading').remove();

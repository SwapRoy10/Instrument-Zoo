// Keyboard percussion: marimba, xylophone (wooden bars over resonators) and
// glockenspiel (steel bars in a case). Bars are laid out like a piano: naturals
// in the front row (toward the player, +z), accidentals in a raised back row.
import * as THREE from 'three';
import { addPart, v3, cylinderBetween, roundedBox, instancedCylinders } from '../../lib/helpers.js';
import { wood, metal, felt, rubber, matte, stringMat } from '../../lib/materials.js';

const NATURAL = new Set([0, 2, 4, 5, 7, 9, 11]);
const NODE = 0.224; // vibration nodes sit ~22.4% of the bar length in from each end
const lerp = THREE.MathUtils.lerp;
export const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// Bars are modelled with length along local Y (so wood grain runs along them),
// thickness along local X and width along local Z; this basis lays them flat,
// pointing toward the player.
const BAR_Q = new THREE.Quaternion().setFromRotationMatrix(
  new THREE.Matrix4().makeBasis(v3(0, 1, 0), v3(0, 0, 1), v3(1, 0, 0))
);

/** Chromatic keyboard: naturals evenly packed by width, accidentals centred between their neighbours. */
function keyboard({ low, high, wLow, wHigh, gap }) {
  const keys = [];
  for (let m = low; m <= high; m++) keys.push({ midi: m, nat: NATURAL.has(m % 12) });
  const nats = keys.filter((k) => k.nat);
  let x = 0;
  nats.forEach((k, i) => {
    k.w = lerp(wLow, wHigh, i / (nats.length - 1));
    if (i) x += (nats[i - 1].w + k.w) / 2 + gap;
    k.x = x;
  });
  keys.forEach((k, i) => {
    if (k.nat) return;
    const a = keys[i - 1];
    const b = keys[i + 1];
    k.x = (a.x + b.x) / 2;
    k.w = ((a.w + b.w) / 2) * 0.97;
  });
  const mid = x / 2;
  keys.forEach((k) => { k.x -= mid; });
  return { keys, x0: -mid, x1: mid };
}

/** A tone bar, optionally with the tuning arch carved out of its underside. */
function barGeometry(L, W, T, arch) {
  const s = new THREE.Shape();
  const h = L / 2;
  s.moveTo(-T / 2, -h);
  s.lineTo(T / 2, -h);
  s.lineTo(T / 2, h);
  s.lineTo(-T / 2, h);
  if (arch > 0.01) {
    const span = 0.33 * L;
    s.lineTo(-T / 2, span);
    for (let i = 1; i < 28; i++) {
      const y = span - (2 * span * i) / 28;
      const u = y / span;
      s.lineTo(-T / 2 + arch * T * Math.pow(1 - u * u, 1.3), y);
    }
    s.lineTo(-T / 2, -span);
  }
  s.closePath();
  const b = Math.min(0.0015, T * 0.12);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: W - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b * 0.8, bevelSegments: 2, curveSegments: 4,
  });
  geo.translate(0, 0, -(W - 2 * b) / 2);
  return geo;
}

/** A rectangular rail from a to b (roughly horizontal), height h, depth w; grain runs along it. */
function railBetween(a, b, h, w, material) {
  const d = new THREE.Vector3().subVectors(b, a);
  const m = roundedBox(h, d.length(), w, Math.min(h, w) * 0.2, material);
  m.rotation.z = -Math.PI / 2;
  const grp = new THREE.Group();
  grp.add(m);
  grp.position.copy(a).addScaledVector(d, 0.5);
  grp.rotation.y = -Math.atan2(d.z, d.x);
  return grp;
}

function caster(material, tyre) {
  const c = new THREE.Group();
  const fork = roundedBox(0.03, 0.05, 0.03, 0.006, material);
  fork.position.y = 0.055;
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.024, 24), tyre);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 0.035, 0.012);
  c.add(fork, wheel);
  return c;
}

/** A mallet lying with its head on a bar and its handle rising toward the player. */
function mallet(head, handleEnd, headR, headMat, shaftMat, shaftR = 0.0042, squash = 1) {
  const m = new THREE.Group();
  const dir = new THREE.Vector3().subVectors(handleEnd, head).normalize();
  m.add(cylinderBetween(head.clone().addScaledVector(dir, headR * 0.5), handleEnd, shaftR, shaftMat, 10));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(headR, 24, 16), headMat);
  ball.position.copy(head);
  ball.scale.set(1, squash, 1);
  m.add(ball);
  return m;
}

/** Bars, cords and posts shared by the marimba and xylophone. Returns geometry helpers for the frame. */
function barsAndRows(g, o) {
  const kb = keyboard(o);
  const { keys, x0, x1 } = kb;
  const len = (x) => lerp(o.lLow, o.lHigh, (x - x0) / (x1 - x0));
  const yN = o.barTop - o.thick / 2;
  const yA = yN + o.raise;
  // z of a point a fraction f along the bar, measured outward from the centre gap
  const zAt = (x, nat, f) => (nat ? 1 : -1) * (o.midGap + f * len(x));

  keys.forEach((k, i) => {
    const L = len(k.x);
    const t = (k.x - x0) / (x1 - x0);
    const geo = barGeometry(L, k.w, o.thick, o.arch * (1 - 0.8 * t));
    // shift each bar's texture so neighbouring bars don't share identical grain
    const oy = ((i * 0.618034) % 1) * 0.5;
    const oz = ((i * 0.414214) % 1) * 0.4;
    geo.translate(0, oy, oz);
    const m = new THREE.Mesh(geo, o.barMat);
    m.quaternion.copy(BAR_Q);
    m.position.set(k.x - oz, k.nat ? yN : yA, zAt(k.x, k.nat, 0.5) - oy);
    addPart(g, k.nat ? 'naturals' : 'accidentals', m);
  });
  return { ...kb, len, yN, yA, zAt };
}

// ============================================================================
/** Marimba / xylophone: wooden bars hung on cords over tuned resonator tubes. */
export function buildMalletKeyboard(o) {
  const g = new THREE.Group();
  const kb = barsAndRows(g, o);
  const { keys, x0, x1, len, yN, yA, zAt } = kb;
  const cordMat = stringMat(o.cord || 'red');
  const postMat = metal('steel');
  const railMat = o.railMat;

  // ----- Suspension cords and posts at the node lines -----
  const railH = 0.04;
  const railW = 0.03;
  const railTop = (nat) => (nat ? yN : yA) - o.thick / 2 - 0.022;
  [true, false].forEach((nat) => {
    const row = keys.filter((k) => k.nat === nat);
    const y = nat ? yN : yA;
    [NODE, 1 - NODE].forEach((f) => {
      const pts = row.map((k) => v3(k.x, y, zAt(k.x, nat, f)));
      const segs = [];
      for (let i = 1; i < pts.length; i++) segs.push({ a: pts[i - 1], b: pts[i], r: 0.0017 });
      addPart(g, 'cord', instancedCylinders(segs, cordMat, 6));
      const posts = [];
      for (let i = 1; i < row.length; i++) {
        const px = (row[i - 1].x + row[i].x) / 2;
        const pz = (pts[i - 1].z + pts[i].z) / 2;
        posts.push({ a: v3(px, railTop(nat) - 0.002, pz), b: v3(px, y + 0.007, pz), r: 0.0022 });
      }
      addPart(g, 'cord', instancedCylinders(posts, postMat, 8));
      // ----- Frame rail under this node line -----
      const ex = 0.06;
      const a = v3(x0 - ex, railTop(nat) - railH / 2, zAt(x0 - ex, nat, f));
      const b = v3(x1 + ex, railTop(nat) - railH / 2, zAt(x1 + ex, nat, f));
      addPart(g, 'rails', railBetween(a, b, railH, railW, railMat));
    });
  });

  // ----- Resonators -----
  const resMat = o.resMat;
  const inner = new THREE.MeshStandardMaterial({ color: 0x0b0a09, roughness: 1 });
  const rOf = (k) => k.w * 0.43;
  keys.forEach((k) => {
    const top = (k.nat ? yN : yA) - o.thick / 2 - 0.05;
    const quarter = 343 / (4 * hz(k.midi + o.sounding));
    const L = THREE.MathUtils.clamp(quarter * 0.92, 0.045, top - o.resFloor);
    const r = rOf(k);
    const z = zAt(k.x, k.nat, 0.5);
    const tubeM = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 28, 1, true), resMat);
    tubeM.position.set(k.x, top - L / 2, z);
    addPart(g, 'resonators', tubeM);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, 0.008, 28), resMat);
    cap.position.set(k.x, top - L + 0.004, z);
    addPart(g, 'resonators', cap);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0016, 8, 28), resMat);
    lip.rotation.x = Math.PI / 2;
    lip.position.set(k.x, top, z);
    addPart(g, 'resonators', lip);
    const dark = new THREE.Mesh(new THREE.CircleGeometry(r * 0.98, 24), inner); // the air column inside
    dark.rotation.x = -Math.PI / 2;
    dark.position.set(k.x, top - Math.min(L * 0.5, 0.05), z);
    addPart(g, 'resonators', dark);
  });
  // a hanger bar along the outer face of each row of tubes
  [true, false].forEach((nat) => {
    const row = keys.filter((k) => k.nat === nat);
    const first = row[0];
    const last = row[row.length - 1];
    const y = (nat ? yN : yA) - o.thick / 2 - 0.065;
    const s = nat ? 1 : -1;
    addPart(g, 'resonators', cylinderBetween(
      v3(x0 - 0.06, y, zAt(first.x, nat, 0.5) + s * rOf(first)),
      v3(x1 + 0.06, y, zAt(last.x, nat, 0.5) + s * rOf(last)),
      0.006, resMat, 12));
  });

  // ----- End frames, stretcher and casters -----
  const frameMat = o.frameMat;
  const tyre = rubber(0x2a2a2a);
  const footY = 0.1;
  const railBottom = Math.min(railTop(true), railTop(false)) - railH;
  [x0 - 0.1, x1 + 0.1].forEach((x, end) => {
    const zF = zAt(x, true, 1 - NODE) + 0.05;
    const zB = zAt(x, false, 1 - NODE) - 0.05;
    const depth = zF - zB;
    const zc = (zF + zB) / 2;
    if (o.frameStyle === 'tube') {
      [zF - 0.03, zB + 0.03].forEach((z) => {
        addPart(g, 'frame', cylinderBetween(v3(x, footY, z), v3(x, railBottom + 0.02, z), 0.014, frameMat, 16));
      });
      addPart(g, 'frame', cylinderBetween(v3(x, railBottom + 0.01, zB), v3(x, railBottom + 0.01, zF), 0.012, frameMat, 12));
      addPart(g, 'frame', cylinderBetween(v3(x, 0.32, zB + 0.03), v3(x, 0.32, zF - 0.03), 0.01, frameMat, 12));
    } else {
      const h = railBottom - footY - 0.02;
      const board = roundedBox(0.032, h, depth - 0.05, 0.01, frameMat);
      board.position.set(x, footY + 0.02 + h / 2, zc);
      addPart(g, 'frame', board);
      const cap = roundedBox(0.05, 0.03, depth, 0.01, frameMat);
      cap.position.set(x, railBottom - 0.005, zc);
      addPart(g, 'frame', cap);
    }
    const foot = roundedBox(0.06, 0.04, depth + 0.1, 0.012, frameMat);
    foot.position.set(x, footY, zc);
    addPart(g, 'frame', foot);
    [zF + 0.02, zB - 0.02].forEach((z) => {
      const c = caster(metal('darkSteel'), tyre);
      c.position.set(x, footY - 0.09, z);
      addPart(g, 'frame', c);
    });
    // a lower handle / brace at the bass end, as on many concert instruments
    if (end === 0 && o.frameStyle !== 'tube') {
      const brace = roundedBox(0.03, 0.03, depth - 0.1, 0.008, frameMat);
      brace.position.set(x - 0.03, 0.5, zc);
      addPart(g, 'frame', brace);
    }
  });
  // stretcher between the ends, in the gap between the two rows of tubes
  addPart(g, 'frame', railBetween(v3(x0 - 0.1, 0.3, 0), v3(x1 + 0.1, 0.3, 0), 0.05, 0.035, frameMat));

  // ----- Mallets resting on the keyboard -----
  const nats = keys.filter((k) => k.nat);
  [[0.58, -0.05], [0.66, 0.06]].forEach(([t, dx]) => {
    const k = nats[Math.round(t * (nats.length - 1))];
    const head = v3(k.x, o.barTop + o.malletR * 0.92, zAt(k.x, true, 0.62));
    const end = v3(k.x + dx + 0.1, o.barTop + 0.07, head.z + o.shaftLen * 0.95);
    addPart(g, 'mallets', mallet(head, end, o.malletR, o.headMat, o.shaftMat, 0.0042, o.malletSquash ?? 1));
  });
  return g;
}

// ============================================================================
/** Glockenspiel: steel bars on felt rails, sitting in their open case on a stand. */
export function buildGlockenspiel() {
  const g = new THREE.Group();
  const o = {
    low: 79, high: 108, wLow: 0.032, wHigh: 0.026, gap: 0.0065,
    lLow: 0.178, lHigh: 0.104, thick: 0.0095, arch: 0, raise: 0.014, midGap: 0.014, barTop: 0.86,
    barMat: metal('nickel', { brushed: true, scale: 14 }),
  };
  const { keys, x0, x1, yN, yA, zAt } = barsAndRows(g, o);

  // ----- Felt rails with pins through the node holes -----
  const feltMat = felt(0x8a1f2c);
  const riserMat = wood('cherry', { scale: 10, clearcoat: 0.3 });
  const pinMat = metal('steel');
  const caseFloor = yN - o.thick / 2 - 0.035;
  [true, false].forEach((nat) => {
    const y = (nat ? yN : yA) - o.thick / 2;
    [NODE, 1 - NODE].forEach((f) => {
      const a = v3(x0 - 0.02, 0, zAt(x0 - 0.02, nat, f));
      const b = v3(x1 + 0.02, 0, zAt(x1 + 0.02, nat, f));
      const riserH = y - 0.005 - caseFloor;
      a.y = b.y = caseFloor + riserH / 2;
      addPart(g, 'rails', railBetween(a, b, riserH, 0.016, riserMat));
      a.y = b.y = y - 0.0025;
      addPart(g, 'rails', railBetween(a, b, 0.005, 0.018, feltMat));
      const pins = keys.filter((k) => k.nat === nat).map((k) => {
        const z = zAt(k.x, nat, f);
        return { a: v3(k.x, y - 0.006, z), b: v3(k.x, y + o.thick + 0.002, z), r: 0.0019 };
      });
      addPart(g, 'rails', instancedCylinders(pins, pinMat, 8));
    });
  });

  // ----- Case (bars play right in it) with the lid swung open -----
  const tolex = matte(0x1d1b1a, 0.75);
  const velvet = felt(0x6d1a24);
  const chrome = metal('chrome');
  const zFront = o.midGap + o.lLow + 0.03;
  const zBack = -(o.midGap + o.lLow + 0.03);
  const xL = x0 - 0.05;
  const xR = x1 + 0.05;
  const W = xR - xL;
  const D = zFront - zBack;
  const bottom = caseFloor - 0.02;
  const wallTop = yN - o.thick / 2 + 0.004;
  const H = wallTop - bottom;
  const cx = (xL + xR) / 2;
  const cz = (zFront + zBack) / 2;
  const t = 0.014;
  const floor = roundedBox(W, 0.02, D, 0.006, tolex);
  floor.position.set(cx, bottom + 0.01, cz);
  addPart(g, 'case', floor);
  const lining = new THREE.Mesh(new THREE.BoxGeometry(W - 2 * t, 0.003, D - 2 * t), velvet);
  lining.position.set(cx, caseFloor + 0.0015, cz);
  addPart(g, 'case', lining);
  [[cx, zFront - t / 2, W, t], [cx, zBack + t / 2, W, t]].forEach(([x, z, w, d]) => {
    const wall = roundedBox(w, H, d, 0.005, tolex);
    wall.position.set(x, bottom + H / 2, z);
    addPart(g, 'case', wall);
  });
  [xL + t / 2, xR - t / 2].forEach((x) => {
    const wall = roundedBox(t, H, D, 0.005, tolex);
    wall.position.set(x, bottom + H / 2, cz);
    addPart(g, 'case', wall);
  });
  [cx - W * 0.3, cx + W * 0.3].forEach((x) => {
    const latch = roundedBox(0.03, 0.022, 0.008, 0.003, chrome);
    latch.position.set(x, wallTop - 0.016, zFront + 0.004);
    addPart(g, 'case', latch);
  });
  // lid, hinged along the back edge and leaning back
  const lid = new THREE.Group();
  const lidShell = roundedBox(W, 0.05, D, 0.008, tolex);
  lidShell.position.set(0, 0.025, D / 2);
  const lidLining = new THREE.Mesh(new THREE.BoxGeometry(W - 2 * t, 0.003, D - 2 * t), velvet);
  lidLining.position.set(0, -0.001, D / 2);
  lid.add(lidShell, lidLining);
  lid.position.set(cx, wallTop, zBack);
  lid.rotation.x = -(Math.PI / 2 + 0.2); // swung up and just past vertical, velvet facing the player
  addPart(g, 'case', lid);
  [cx - W * 0.35, cx + W * 0.35].forEach((x) => {
    addPart(g, 'case', cylinderBetween(v3(x - 0.03, wallTop, zBack), v3(x + 0.03, wallTop, zBack), 0.005, chrome, 10));
  });

  // ----- Stand -----
  const steel = metal('darkSteel');
  const tyre = rubber();
  [xL + 0.06, xR - 0.06].forEach((x) => {
    [[zFront - 0.04, zBack - 0.06], [zBack + 0.04, zFront + 0.06]].forEach(([zt, zb]) => {
      addPart(g, 'stand', cylinderBetween(v3(x, bottom - 0.005, zt), v3(x, 0.02, zb), 0.011, steel, 12));
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 8), tyre);
      foot.position.set(x, 0.016, zb);
      foot.scale.y = 0.7;
      addPart(g, 'stand', foot);
    });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.04, 16), steel);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(x, (bottom + 0.02) / 2 + 0.02, cz);
    addPart(g, 'stand', hub);
  });
  addPart(g, 'stand', cylinderBetween(v3(xL + 0.06, (bottom + 0.02) / 2 + 0.02, cz), v3(xR - 0.06, (bottom + 0.02) / 2 + 0.02, cz), 0.01, steel, 12));
  [zFront - 0.04, zBack + 0.04].forEach((z) => {
    addPart(g, 'stand', cylinderBetween(v3(xL + 0.04, bottom - 0.01, z), v3(xR - 0.04, bottom - 0.01, z), 0.009, steel, 12));
  });

  // ----- Mallets -----
  const brass = metal('brass');
  const rattan = wood('cane', { scale: 30, clearcoat: 0.2 });
  const nats = keys.filter((k) => k.nat);
  [[0.45, -0.03], [0.6, 0.05]].forEach(([tt, dx]) => {
    const k = nats[Math.round(tt * (nats.length - 1))];
    const head = v3(k.x, o.barTop + 0.0105, zAt(k.x, true, 0.55));
    const end = v3(k.x + dx + 0.06, o.barTop + 0.05, zFront + 0.18);
    addPart(g, 'mallets', mallet(head, end, 0.011, brass, rattan, 0.0035));
  });
  return g;
}

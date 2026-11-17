// Bassoon & contrabassoon. Bodies stand along +Y; keywork is mounted on sub-groups
// centred on each tube so the shared "mount around a vertical axis" helpers apply.
import * as THREE from 'three';
import {
  addPart, v3, cylinderBetween, roundedBox, mount, keyCup, toneHole, rodWithPosts, taperedTube, rimAt, around,
} from '../../lib/helpers.js';
import { metal, wood, pad, cane, plastic, rubber } from '../../lib/materials.js';

const FRONT = Math.PI / 2;
const BACK = -Math.PI / 2;

/** Bassoon reed: thread-wrapped tube, three brass wires, wide cane blades. Along +Y. */
function bassoonReed(scale = 1) {
  const s = scale;
  const r = new THREE.Group();
  r.add(cylinderBetween(v3(0, 0, 0), v3(0, 0.026 * s, 0), 0.0042 * s, plastic(0x7a1f2b, 0.6), 18, 0.0048 * s));
  const brass = metal('rawBrass');
  [0.03, 0.036, 0.042].forEach((y) => {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.0052 * s, 0.0005 * s, 6, 20), brass);
    w.rotation.x = Math.PI / 2;
    w.scale.z = 0.6;
    w.position.y = y * s;
    r.add(w);
  });
  const blades = roundedBox(0.0145 * s, 0.03 * s, 0.003 * s, 0.0012 * s, cane());
  blades.position.y = 0.05 * s;
  r.add(blades);
  return r;
}

function tubeGroup(parent, x, z = 0) {
  const t = new THREE.Group();
  t.position.set(x, 0, z);
  parent.add(t);
  return t;
}

export function buildBassoon() {
  const g = new THREE.Group();
  const maple = wood('bassoon', { scale: 5, clearcoat: 1, clearcoatRoughness: 0.1, roughness: 0.4 });
  const silver = metal('nickel');
  const ivory = plastic(0xf1e8d6, 0.35);
  const padMat = pad();

  // ----- Boot joint (oval, two bores) with metal U-cap -----
  const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 40), maple);
  boot.scale.x = 1.45;
  boot.position.set(0.004, 0.25, 0);
  addPart(g, 'bootjoint', boot);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0312, 0.03, 0.035, 40), silver);
  cap.scale.x = 1.45;
  cap.position.set(0.004, 0.0, 0);
  addPart(g, 'bootjoint', cap);
  const capRing = new THREE.Mesh(new THREE.CylinderGeometry(0.0318, 0.0318, 0.008, 40), silver);
  capRing.scale.x = 1.45;
  capRing.position.set(0.004, 0.5, 0);
  addPart(g, 'bootjoint', capRing);

  // ----- Wing joint (front tube) and long joint (back tube) -----
  const WX = -0.016;
  const LX = 0.026;
  addPart(g, 'wingjoint', cylinderBetween(v3(WX, 0.5, 0), v3(WX, 0.78, 0), 0.0175, maple, 32, 0.0155));
  const wing = roundedBox(0.026, 0.2, 0.024, 0.009, maple);
  wing.position.set(WX - 0.002, 0.63, 0.011);
  addPart(g, 'wingjoint', wing);
  addPart(g, 'wingjoint', cylinderBetween(v3(WX, 0.775, 0), v3(WX, 0.784, 0), 0.0172, silver, 32));
  addPart(g, 'longjoint', cylinderBetween(v3(LX, 0.5, 0), v3(LX, 1.15, 0), 0.02, maple, 32));
  addPart(g, 'longjoint', cylinderBetween(v3(LX, 1.145, 0), v3(LX, 1.156, 0), 0.0215, silver, 32));
  addPart(g, 'belljoint', cylinderBetween(v3(LX, 1.15, 0), v3(LX, 1.355, 0), 0.0205, maple, 32, 0.023));
  addPart(g, 'belljoint', cylinderBetween(v3(LX, 1.35, 0), v3(LX, 1.372, 0), 0.0245, ivory, 32));
  const bellHole = new THREE.Mesh(new THREE.CircleGeometry(0.02, 28), new THREE.MeshStandardMaterial({ color: 0x050403, roughness: 1 }));
  bellHole.rotation.x = -Math.PI / 2;
  bellHole.position.set(LX, 1.3725, 0);
  addPart(g, 'belljoint', bellHole);

  // ----- Bocal & reed -----
  const bocalPts = [v3(WX, 0.78, 0), v3(WX - 0.002, 0.83, 0.004), v3(WX - 0.014, 0.874, 0.028), v3(WX - 0.04, 0.9, 0.07), v3(WX - 0.066, 0.906, 0.118), v3(WX - 0.088, 0.9, 0.162)];
  const bocal = new THREE.CatmullRomCurve3(bocalPts, false, 'centripetal');
  addPart(g, 'bocal', taperedTube(null, (t) => 0.0045 - 0.002 * t, metal('silver'), { curve: bocal, tubular: 90, radial: 16 }));
  addPart(g, 'bocal', cylinderBetween(bocal.getPointAt(0.12), bocal.getPointAt(0.12).add(v3(0, 0, 0.007)), 0.0015, silver, 8)); // whisper-key pip
  const reed = bassoonReed();
  reed.position.copy(bocal.getPointAt(1));
  reed.quaternion.setFromUnitVectors(v3(0, 1, 0), bocal.getTangentAt(1));
  addPart(g, 'reed', reed);

  // ----- Keywork -----
  const wingT = tubeGroup(g, WX);
  [0.66, 0.705, 0.745].forEach((y) => { const h = toneHole(0.0038); mount(wingT, h, 0.0232, y, FRONT, 0); addPart(wingT, 'keys', h); });
  const bootT = tubeGroup(g, 0.004);
  // the boot is an ellipse (0.0435 x 0.03); surface radius depends on the angle
  const eR = (a) => 1 / Math.sqrt((Math.cos(a) / 0.0435) ** 2 + (Math.sin(a) / 0.03) ** 2);
  [0.3, 0.345, 0.39].forEach((y) => { const h = toneHole(0.004); mount(bootT, h, eR(FRONT - 0.35), y, FRONT - 0.35, 0); addPart(bootT, 'keys', h); });
  [[0.25, FRONT + 0.4], [0.2, FRONT + 0.6], [0.43, FRONT - 0.9], [0.18, FRONT - 0.7]].forEach(([y, a]) => {
    const cup = keyCup(0.0065, silver, { padMat }); mount(bootT, cup, eR(a), y, a, 0.0008); addPart(bootT, 'keys', cup);
  });
  addPart(bootT, 'keys', rodWithPosts(eR(FRONT + 0.8), 0.16, 0.46, FRONT + 0.8, silver, { posts: 3, offset: 0.005, rodR: 0.0013 }));
  // thumb keys on the back of wing and long joints
  [[0.6, 0.012], [0.635, 0.012], [0.67, 0.012], [0.71, 0.012]].forEach(([y]) => {
    const s = roundedBox(0.008, 0.0018, 0.016, 0.0008, silver); mount(wingT, s, 0.0175, y, BACK + 0.3, 0.0025); addPart(wingT, 'keys', s);
  });
  const longT = tubeGroup(g, LX);
  [[0.62, BACK + 0.2], [0.7, BACK + 0.1], [0.82, BACK], [0.96, BACK + 0.15], [1.25, BACK + 0.2]].forEach(([y, a]) => {
    const cup = keyCup(0.0085, silver, { padMat }); mount(longT, cup, (yy) => (yy > 1.15 ? 0.022 : 0.02), y, a, 0.0008); addPart(longT, 'keys', cup);
  });
  addPart(longT, 'keys', rodWithPosts(0.02, 0.55, 1.3, BACK + 0.55, silver, { posts: 5, offset: 0.005, rodR: 0.0014 }));
  addPart(longT, 'keys', rodWithPosts(0.02, 0.55, 1.05, BACK - 0.45, silver, { posts: 4, offset: 0.0055, rodR: 0.0013 }));

  // Hand rest (crutch) and seat-strap ring
  addPart(g, 'handrest', cylinderBetween(around(0.032, 0.3, FRONT + 0.9).add(v3(0.004, 0, 0)), around(0.06, 0.315, FRONT + 0.9).add(v3(0.004, 0, 0)), 0.0028, silver, 10));
  const crutch = roundedBox(0.03, 0.045, 0.016, 0.007, wood('ebony', { scale: 10 }));
  crutch.position.copy(around(0.07, 0.32, FRONT + 0.9).add(v3(0.004, 0, 0)));
  crutch.rotation.y = -(FRONT + 0.9) + Math.PI / 2;
  addPart(g, 'handrest', crutch);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0016, 8, 20), silver);
  ring.position.set(0.004, 0.015, -0.036);
  addPart(g, 'bootjoint', ring);

  return g;
}

export function buildContrabassoon() {
  const g = new THREE.Group();
  const maple = wood('bassoon', { scale: 4, clearcoat: 1, clearcoatRoughness: 0.1, roughness: 0.4 });
  const nickel = metal('nickel');
  const bellMat = metal('nickel', { side: THREE.DoubleSide });
  const padMat = pad();

  // Four wooden tubes, widening as the bore grows
  const tubes = [
    { x: -0.09, r: 0.02, y0: 0.32, y1: 1.22 },
    { x: -0.035, r: 0.025, y0: 0.26, y1: 1.22 },
    { x: 0.022, r: 0.03, y0: 0.22, y1: 1.24 },
    { x: 0.084, r: 0.034, y0: 0.22, y1: 1.06 },
  ];
  tubes.forEach((t) => {
    addPart(g, 'body', cylinderBetween(v3(t.x, t.y0, 0), v3(t.x, t.y1, 0), t.r, maple, 32));
    [t.y0, t.y1].forEach((y) => addPart(g, 'body', cylinderBetween(v3(t.x, y - 0.006, 0), v3(t.x, y + 0.006, 0), t.r * 1.08, nickel, 32)));
  });
  // Metal U-bends linking the tubes: bottom A-B, top B-C, bottom C-D
  const ubend = (a, b, y, down) => {
    const mid = (a.x + b.x) / 2;
    const depth = (b.x - a.x) * 0.55;
    const yy = down ? y - depth : y + depth;
    const pts = [v3(a.x, y, 0), v3(a.x, (y + yy) / 2, 0), v3(mid, yy, 0), v3(b.x, (y + yy) / 2, 0), v3(b.x, y, 0)];
    const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    return taperedTube(null, (t) => a.r + (b.r - a.r) * t, nickel, { curve: c, tubular: 50, radial: 20 });
  };
  addPart(g, 'bends', ubend(tubes[0], tubes[1], 0.29, true));
  addPart(g, 'bends', ubend(tubes[1], tubes[2], 1.235, false));
  addPart(g, 'bends', ubend(tubes[2], tubes[3], 0.23, true));

  // Metal bell: from the top of the last tube, over and down to the floor
  const bellPts = [v3(0.084, 1.06, 0), v3(0.084, 1.12, 0), v3(0.115, 1.16, 0.02), v3(0.15, 1.1, 0.04), v3(0.16, 0.8, 0.05), v3(0.16, 0.4, 0.05), v3(0.162, 0.12, 0.05)];
  const bellCurve = new THREE.CatmullRomCurve3(bellPts, false, 'centripetal');
  addPart(g, 'bell', taperedTube(null, (t) => 0.034 + 0.008 * t + 0.045 * Math.pow(Math.max(0, (t - 0.82) / 0.18), 2.4), bellMat, { curve: bellCurve, tubular: 160 }));
  addPart(g, 'bell', rimAt(bellCurve, 0.087, 0.003, nickel));

  // Coiled bocal and reed
  const bocalPts = [v3(-0.09, 1.215, 0), v3(-0.09, 1.29, 0), v3(-0.11, 1.34, 0.03), v3(-0.15, 1.34, 0.07), v3(-0.17, 1.29, 0.1), v3(-0.15, 1.24, 0.13), v3(-0.12, 1.25, 0.18), v3(-0.11, 1.28, 0.22)];
  const bocal = new THREE.CatmullRomCurve3(bocalPts, false, 'centripetal');
  addPart(g, 'bocal', taperedTube(null, (t) => 0.0065 - 0.0035 * t, nickel, { curve: bocal, tubular: 120, radial: 16 }));
  const reed = bassoonReed(1.35);
  reed.position.copy(bocal.getPointAt(1));
  reed.quaternion.setFromUnitVectors(v3(0, 1, 0), bocal.getTangentAt(1));
  addPart(g, 'reed', reed);

  // Keys on the front of the tubes, long rods, frame braces
  tubes.forEach((t, i) => {
    const tg = tubeGroup(g, t.x);
    for (let k = 0; k < 4; k++) {
      const y = t.y0 + 0.12 + k * ((t.y1 - t.y0 - 0.25) / 3);
      const cup = keyCup(0.007 + i * 0.002, nickel, { padMat });
      mount(tg, cup, t.r, y, FRONT + (k % 2 ? 0.35 : -0.35), 0.0008);
      addPart(tg, 'keys', cup);
    }
    addPart(tg, 'keys', rodWithPosts(t.r, t.y0 + 0.08, t.y1 - 0.08, FRONT + 0.75, nickel, { posts: 3, offset: 0.005, rodR: 0.0014 }));
  });
  [0.55, 0.95].forEach((y) => addPart(g, 'body', cylinderBetween(v3(-0.09, y, -0.02), v3(0.16, y, -0.02), 0.003, nickel, 8)));

  // Endpin
  addPart(g, 'endpin', cylinderBetween(v3(-0.01, 0.24, -0.03), v3(-0.01, 0.015, -0.03), 0.006, nickel, 12));
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 14, 10), rubber());
  tip.position.set(-0.01, 0.012, -0.03);
  addPart(g, 'endpin', tip);
  addPart(g, 'endpin', cylinderBetween(v3(-0.09, 0.3, -0.03), v3(0.084, 0.24, -0.03), 0.004, nickel, 8));
  return g;
}

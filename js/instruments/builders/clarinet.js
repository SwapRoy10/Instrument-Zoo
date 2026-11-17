// Clarinets: soprano (B-flat / E-flat via scale) and bass clarinet. Bodies stand along +Y.
import * as THREE from 'three';
import {
  addPart, v3, cylinderBetween, roundedBox, lathe, mount, keyCup, ringKey, toneHole, rodWithPosts, taperedTube, rimAt, flare, around,
} from '../../lib/helpers.js';
import { metal, wood, pad, cane, plastic, rubber } from '../../lib/materials.js';

const FRONT = Math.PI / 2;
const BACK = -Math.PI / 2;

/** Mouthpiece + ligature + reed, built along +Y from the origin; reed on the -Z side. */
export function mouthpieceSet(R, { silver, ebonite, reedMat, len = 0.085 }) {
  const m = new THREE.Group();
  const mp = lathe([[0, 0], [R * 0.95, 0], [R * 0.95, 0.012], [R * 0.9, 0.03], [R * 0.78, 0.055], [R * 0.6, len - 0.012], [R * 0.32, len], [0, len]], ebonite, 40);
  mp.scale.z = 0.85;
  m.add(mp);
  const reed = roundedBox(R * 1.15, 0.0016, len * 0.82, 0.0006, reedMat);
  reed.rotation.x = Math.PI / 2 - 0.09;
  reed.position.set(0, len * 0.42, -R * 0.75);
  m.userData.reed = reed;
  const lig = new THREE.Group();
  lig.add(cylinderBetween(v3(0, len * 0.18, 0), v3(0, len * 0.36, 0), R * 1.0, silver, 32, R * 0.96));
  [len * 0.22, len * 0.32].forEach((y) => {
    const screw = cylinderBetween(v3(0, y, R * 0.95), v3(0, y, R * 1.45), 0.0012, silver, 8);
    lig.add(screw);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.0028, 0.0028, 0.003, 14), silver);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0, y, R * 1.5);
    lig.add(knob);
  });
  m.userData.ligature = lig;
  return m;
}

export function buildClarinet({ scale = 1 } = {}) {
  const outer = new THREE.Group();
  const g = new THREE.Group();
  g.scale.setScalar(scale);
  outer.add(g);
  const body = wood('grenadilla', { scale: 10, clearcoat: 0.9, clearcoatRoughness: 0.12, roughness: 0.35 });
  const silver = metal('silver');
  const ebonite = plastic(0x0d0d0e, 0.25);
  const padMat = pad();
  const R = 0.0145;

  const yBell = 0.105;
  const yJoint = 0.335;
  const yUpper = 0.565;
  const yBarrel = 0.63;

  // ----- Bell, joints, barrel -----
  const bellProfile = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    bellProfile.push([0.034 - (0.034 - 0.0155) * Math.pow(t, 0.45), t * yBell]);
  }
  addPart(g, 'bell', lathe(bellProfile, body, 48));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.0016, 10, 56), silver);
  rim.rotation.x = Math.PI / 2;
  addPart(g, 'bell', rim);
  const bore = new THREE.Mesh(new THREE.CircleGeometry(0.03, 36), new THREE.MeshStandardMaterial({ color: 0x050403, roughness: 1 }));
  bore.rotation.x = Math.PI / 2;
  bore.position.y = 0.002;
  addPart(g, 'bell', bore);

  addPart(g, 'lowerjoint', cylinderBetween(v3(0, yBell, 0), v3(0, yJoint, 0), R, body, 40));
  addPart(g, 'upperjoint', cylinderBetween(v3(0, yJoint, 0), v3(0, yUpper, 0), R, body, 40));
  const barrel = lathe([[R * 1.06, 0], [R * 1.12, 0.03], [R * 1.06, yBarrel - yUpper]], body, 40);
  barrel.position.y = yUpper;
  addPart(g, 'barrel', barrel);
  [[yBell, 'bell'], [yJoint, 'lowerjoint'], [yUpper, 'upperjoint'], [yBarrel, 'barrel']].forEach(([y, part]) => {
    addPart(g, part, cylinderBetween(v3(0, y - 0.0035, 0), v3(0, y + 0.0035, 0), R * 1.13, silver, 36));
  });

  // ----- Mouthpiece, reed, ligature -----
  const mps = mouthpieceSet(R, { silver, ebonite, reedMat: cane() });
  mps.position.y = yBarrel;
  g.add(mps);
  addPart(mps, 'mouthpiece', mps.children[0]);
  addPart(mps, 'reed', mps.userData.reed);
  addPart(mps, 'reed', mps.userData.ligature);

  // ----- Keys -----
  // Upper joint: open top hole + three rings; lower joint: three rings + bottom hole
  [[0.525, 'hole'], [0.485, 'ring'], [0.445, 'ring'], [0.405, 'ring'], [0.29, 'ring'], [0.25, 'ring'], [0.21, 'ring'], [0.17, 'hole']].forEach(([y, kind]) => {
    const k = kind === 'ring' ? ringKey(0.0052, silver) : toneHole(0.0042);
    mount(g, k, R, y, FRONT, 0);
    addPart(g, 'keys', k);
  });
  // side trill keys and pinky clusters
  [[0.52, 0.8], [0.495, 0.85], [0.47, 0.9], [0.36, -0.75], [0.35, -0.55], [0.15, 0.7], [0.13, 0.55], [0.12, -0.65]].forEach(([y, da]) => {
    const cup = keyCup(0.0045, silver, { padMat });
    mount(g, cup, R, y, FRONT + da, 0.0006);
    addPart(g, 'keys', cup);
  });
  // long rods
  [[FRONT - 0.5, 0.38, 0.54], [FRONT + 0.5, 0.38, 0.54], [FRONT - 0.5, 0.12, 0.31], [FRONT + 0.5, 0.12, 0.31], [FRONT + 1.15, 0.13, 0.5]].forEach(([a, y0, y1]) => {
    addPart(g, 'keys', rodWithPosts(R, y0, y1, a, silver, { posts: 3, offset: 0.0042 }));
  });
  // ring linkages
  [0.485, 0.445, 0.405, 0.29, 0.25, 0.21].forEach((y) => {
    addPart(g, 'keys', cylinderBetween(around(R + 0.0035, y, FRONT + 0.32), around(R + 0.0042, y, FRONT + 0.5), 0.0008, silver, 6));
  });

  // ----- Back: thumb ring, register key, thumb rest -----
  const thumbRing = ringKey(0.0052, silver);
  mount(g, thumbRing, R, 0.5, BACK, 0);
  addPart(g, 'register', thumbRing);
  const reg = keyCup(0.0038, silver, { padMat });
  mount(g, reg, R, 0.535, BACK + 0.25, 0.0006);
  addPart(g, 'register', reg);
  addPart(g, 'register', cylinderBetween(around(R + 0.004, 0.505, BACK + 0.18), around(R + 0.004, 0.535, BACK + 0.25), 0.0012, silver, 8));
  const rest = roundedBox(0.014, 0.004, 0.022, 0.0018, silver);
  mount(g, rest, R, 0.3, BACK, 0.004);
  addPart(g, 'thumbrest', rest);
  const hook = roundedBox(0.012, 0.006, 0.004, 0.0018, silver);
  mount(g, hook, R, 0.289, BACK, 0.008);
  addPart(g, 'thumbrest', hook);

  return outer;
}

export function buildBassClarinet() {
  const g = new THREE.Group();
  const body = wood('grenadilla', { scale: 8, clearcoat: 0.9, clearcoatRoughness: 0.12, roughness: 0.35 });
  const silver = metal('silver');
  const ebonite = plastic(0x0d0d0e, 0.25);
  const padMat = pad();
  const R = 0.0205;
  const y0 = 0.15;
  const yJ = 0.45;
  const y1 = 0.76;

  addPart(g, 'lowerjoint', cylinderBetween(v3(0, y0, 0), v3(0, yJ, 0), R, body, 40));
  addPart(g, 'upperjoint', cylinderBetween(v3(0, yJ, 0), v3(0, y1, 0), R, body, 40));
  [y0, yJ, y1].forEach((y) => addPart(g, y === y1 ? 'upperjoint' : 'lowerjoint', cylinderBetween(v3(0, y - 0.004, 0), v3(0, y + 0.004, 0), R * 1.12, silver, 36)));

  // Metal U-bend and upturned bell
  const bellPts = [v3(0, y0 + 0.002, 0), v3(0, 0.095, 0), v3(0.012, 0.055, 0.012), v3(0.05, 0.05, 0.04), v3(0.075, 0.09, 0.06), v3(0.085, 0.15, 0.07), v3(0.088, 0.2, 0.075)];
  const bellCurve = new THREE.CatmullRomCurve3(bellPts, false, 'centripetal');
  const bellMat = metal('silver', { side: THREE.DoubleSide });
  addPart(g, 'bell', taperedTube(null, (t) => R + 0.042 * Math.pow(Math.max(0, (t - 0.45) / 0.55), 2.6), bellMat, { curve: bellCurve, tubular: 140 }));
  addPart(g, 'bell', rimAt(bellCurve, R + 0.042, 0.0022, silver));

  // Floor peg
  addPart(g, 'peg', cylinderBetween(v3(-0.03, y0 + 0.02, -0.01), v3(-0.03, 0.01, -0.01), 0.004, silver, 12));
  addPart(g, 'peg', cylinderBetween(v3(-0.03, y0 + 0.03, -0.01), v3(-0.0, y0 + 0.03, -0.0), 0.0035, silver, 10));
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.007, 14, 10), rubber());
  tip.position.set(-0.03, 0.008, -0.01);
  addPart(g, 'peg', tip);

  // Metal neck curving back to the player
  const neckPts = [v3(0, y1 - 0.004, 0), v3(0, y1 + 0.06, 0), v3(0, y1 + 0.11, -0.025), v3(0, y1 + 0.13, -0.075), v3(0, y1 + 0.125, -0.12)];
  const neckCurve = new THREE.CatmullRomCurve3(neckPts, false, 'centripetal');
  addPart(g, 'neck', taperedTube(null, (t) => 0.0105 - 0.002 * t, silver, { curve: neckCurve, tubular: 80, radial: 18 }));
  const mps = mouthpieceSet(0.0135, { silver, ebonite, reedMat: cane(), len: 0.1 });
  mps.position.copy(neckCurve.getPointAt(1));
  // mouthpiece points along the neck; reed faces down
  const tan = neckCurve.getTangentAt(1);
  const basis = new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), tan, new THREE.Vector3().crossVectors(new THREE.Vector3(1, 0, 0), tan));
  mps.quaternion.setFromRotationMatrix(basis);
  g.add(mps);
  addPart(mps, 'mouthpiece', mps.children[0]);
  addPart(mps, 'reed', mps.userData.reed);
  addPart(mps, 'reed', mps.userData.ligature);

  // Plateau keys (covered pads) on the front, side keys, rods
  [0.68, 0.64, 0.6, 0.38, 0.34, 0.3].forEach((y) => {
    const cup = keyCup(0.0085, silver, { padMat });
    mount(g, cup, R, y, FRONT, 0.0008);
    addPart(g, 'keys', cup);
  });
  [[0.72, 0.9], [0.66, -0.85], [0.55, 0.85], [0.5, -0.9], [0.26, 0.8], [0.22, -0.8], [0.19, 0.6]].forEach(([y, da]) => {
    const cup = keyCup(0.0075, silver, { padMat });
    mount(g, cup, R, y, FRONT + da, 0.0008);
    addPart(g, 'keys', cup);
  });
  [[FRONT - 0.55, 0.2, 0.74], [FRONT + 0.55, 0.2, 0.74], [FRONT + 1.3, 0.22, 0.7], [BACK + 0.5, 0.25, 0.72]].forEach(([a, ya, yb]) => {
    addPart(g, 'keys', rodWithPosts(R, ya, yb, a, silver, { posts: 4, offset: 0.0055, rodR: 0.0014 }));
  });
  // Register keys: thumb key on the back plus the second vent on the neck
  const thumb = keyCup(0.0065, silver, { padMat });
  mount(g, thumb, R, 0.7, BACK, 0.0008);
  addPart(g, 'register', thumb);
  addPart(g, 'register', cylinderBetween(around(R + 0.005, 0.7, BACK + 0.3), v3(0, y1 + 0.07, -0.013), 0.0013, silver, 8));
  const neckVent = keyCup(0.004, silver, { padMat });
  neckVent.position.set(0, y1 + 0.075, -0.0105);
  neckVent.rotation.x = -Math.PI / 2;
  addPart(g, 'register', neckVent);
  const rest = roundedBox(0.016, 0.005, 0.024, 0.002, silver);
  mount(g, rest, R, 0.43, BACK, 0.005);
  addPart(g, 'thumbrest', rest);
  return g;
}

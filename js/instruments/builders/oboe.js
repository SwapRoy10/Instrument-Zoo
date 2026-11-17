// Oboe & English horn. Conical grenadilla body standing along +Y, bell at the bottom.
import * as THREE from 'three';
import {
  addPart, v3, cylinderBetween, roundedBox, lathe, mount, keyCup, ringKey, rodWithPosts, taperedTube, around,
} from '../../lib/helpers.js';
import { metal, wood, pad, cork, cane, plastic } from '../../lib/materials.js';

/** Double reed: cork-wrapped staple, coloured thread, two cane blades. Built along +Y from origin. */
export function doubleReed({ threadColor = 0x2f7d4f, scale = 1 } = {}) {
  const r = new THREE.Group();
  const s = scale;
  r.add(cylinderBetween(v3(0, 0, 0), v3(0, 0.022 * s, 0), 0.0032 * s, cork(), 16, 0.0028 * s));
  r.add(cylinderBetween(v3(0, 0.022 * s, 0), v3(0, 0.04 * s, 0), 0.0026 * s, plastic(threadColor, 0.6), 16, 0.0022 * s));
  const blades = roundedBox(0.0072 * s, 0.03 * s, 0.0022 * s, 0.0009 * s, cane());
  blades.position.y = 0.054 * s;
  blades.scale.set(1, 1, 1);
  r.add(blades);
  return r;
}

export function buildOboe({ cor = false } = {}) {
  const g = new THREE.Group();
  const grenadilla = wood('grenadilla', { scale: 10, clearcoat: 0.9, clearcoatRoughness: 0.12, roughness: 0.35 });
  const silver = metal('silver');
  const padMat = pad();

  const k = cor ? 1.18 : 1;                 // English horn is longer and wider
  const yBell = 0.08 * k;
  const yJoint = 0.33 * k;
  const yTop = 0.6 * k;
  const rAt = (y) => {
    const t = Math.min(1, Math.max(0, (y - yBell) / (yTop - yBell)));
    return (0.0185 - 0.007 * t) * (cor ? 1.12 : 1);
  };

  // ----- Body sections -----
  addPart(g, 'lowerjoint', cylinderBetween(v3(0, yBell, 0), v3(0, yJoint, 0), rAt(yBell), grenadilla, 40, rAt(yJoint)));
  addPart(g, 'topjoint', cylinderBetween(v3(0, yJoint, 0), v3(0, yTop, 0), rAt(yJoint), grenadilla, 40, rAt(yTop)));
  [yBell, yJoint, yTop].forEach((y, i) => {
    addPart(g, i === 2 ? 'topjoint' : 'lowerjoint', cylinderBetween(v3(0, y - 0.004, 0), v3(0, y + 0.004, 0), rAt(y) * 1.1, silver, 36));
  });

  // Bell: flared (oboe) or bulb "pear" (English horn)
  const bellProfile = cor
    ? [[0.016, 0], [0.024, 0.01], [0.031, 0.035], [0.03, 0.06], [0.024, 0.082], [rAt(yBell), yBell]]
    : [[0.031, 0], [0.026, 0.012], [0.022, 0.035], [0.0195, 0.06], [rAt(yBell), yBell]];
  const bell = lathe([[0.0, 0.0005], ...bellProfile], grenadilla, 48);
  addPart(g, 'bell', bell);
  const bellRim = new THREE.Mesh(new THREE.TorusGeometry(bellProfile[0][0], 0.0018, 10, 48), silver);
  bellRim.rotation.x = Math.PI / 2;
  addPart(g, 'bell', bellRim);
  const bellHole = new THREE.Mesh(new THREE.CircleGeometry(bellProfile[0][0] * 0.88, 32), new THREE.MeshStandardMaterial({ color: 0x050403, roughness: 1 }));
  bellHole.rotation.x = Math.PI / 2;
  bellHole.position.y = 0.001;
  addPart(g, 'bell', bellHole);

  // ----- Keys -----
  const FRONT = Math.PI / 2;
  const front = [0.53, 0.48, 0.43, 0.27, 0.23, 0.19].map((f) => f * k);
  front.forEach((y, i) => {
    const cup = i === 0 ? ringKey(0.0045, silver) : keyCup(0.0058, silver, { padMat, open: true });
    mount(g, cup, rAt, y, FRONT, 0.0006);
    addPart(g, 'keys', cup);
  });
  // half-hole plate for the first finger
  const half = roundedBox(0.009, 0.0016, 0.012, 0.0008, silver);
  mount(g, half, rAt, 0.555 * k, FRONT, 0.0012);
  addPart(g, 'keys', half);

  // side & pinky keys
  [[0.5, 0.9], [0.46, 0.95], [0.4, -0.85], [0.36, 0.9], [0.17, -0.8], [0.14, 0.85], [0.12, -0.75], [0.1, 0.7]].forEach(([f, da]) => {
    const cup = keyCup(0.0046, silver, { padMat });
    mount(g, cup, rAt, f * k, FRONT + da, 0.0006);
    addPart(g, 'keys', cup);
  });
  // octave keys on the back of the top joint
  [0.56, 0.5].forEach((f) => {
    const cup = keyCup(0.0035, silver, { padMat });
    mount(g, cup, rAt, f * k, -Math.PI / 2 + 0.3, 0.0006);
    addPart(g, 'octave', cup);
  });
  const thumbPlate = roundedBox(0.008, 0.0016, 0.016, 0.0008, silver);
  mount(g, thumbPlate, rAt, 0.47 * k, -Math.PI / 2, 0.0025);
  addPart(g, 'octave', thumbPlate);
  addPart(g, 'octave', rodWithPosts(rAt, 0.46 * k, 0.57 * k, -Math.PI / 2 + 0.6, silver, { posts: 2, offset: 0.004 }));

  // rods
  [[FRONT - 0.5, 0.36, 0.58], [FRONT + 0.5, 0.36, 0.58], [FRONT - 0.5, 0.1, 0.32], [FRONT + 0.5, 0.1, 0.32], [FRONT + 1.3, 0.12, 0.52]].forEach(([a, f0, f1]) => {
    addPart(g, 'keys', rodWithPosts(rAt, f0 * k, f1 * k, a, silver, { posts: 3, offset: 0.004 }));
  });
  // arms from front keys to rods
  front.forEach((y) => {
    addPart(g, 'keys', cylinderBetween(around(rAt(y) + 0.0035, y, FRONT + 0.3), around(rAt(y) + 0.004, y, FRONT + 0.5), 0.0008, silver, 6));
  });
  // thumb rest (lower joint, back)
  const rest = roundedBox(0.012, 0.004, 0.02, 0.0018, silver);
  mount(g, rest, rAt, 0.29 * k, -Math.PI / 2, 0.004);
  addPart(g, 'keys', rest);

  // ----- Reed (and bocal for the English horn) -----
  if (cor) {
    const pts = [v3(0, yTop - 0.004, 0), v3(0, yTop + 0.03, 0), v3(0, yTop + 0.058, -0.012), v3(0, yTop + 0.075, -0.033), v3(0, yTop + 0.083, -0.055)];
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    addPart(g, 'bocal', taperedTube(null, (t) => 0.0034 - 0.0012 * t, silver, { curve, tubular: 60, radial: 14 }));
    const reed = doubleReed({ threadColor: 0x8a2d3b });
    reed.position.copy(curve.getPointAt(1));
    reed.quaternion.setFromUnitVectors(v3(0, 1, 0), curve.getTangentAt(1));
    addPart(g, 'reed', reed);
  } else {
    const reed = doubleReed();
    reed.position.y = yTop - 0.004;
    addPart(g, 'reed', reed);
  }
  return g;
}

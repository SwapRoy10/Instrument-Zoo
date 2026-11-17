// Saxophones (alto / tenor / baritone). Profile drawn in the X-Y plane: straight conical
// body, U-shaped bow at the bottom, bell rising at +X, neck curving to the player at -X.
import * as THREE from 'three';
import {
  addPart, v3, cylinderBetween, roundedBox, mount, keyCup, rodWithPosts, taperedSlice, rimAt, around, tube,
} from '../../lib/helpers.js';
import { metal, pad, pearl, plastic, cane } from '../../lib/materials.js';
import { mouthpieceSet } from './clarinet.js';

const FRONT = Math.PI / 2;

const NECKS = {
  alto: [v3(0, 0.596, 0), v3(0, 0.64, 0), v3(-0.012, 0.675, 0), v3(-0.045, 0.69, 0), v3(-0.085, 0.688, 0), v3(-0.105, 0.684, 0)],
  tenor: [v3(0, 0.596, 0), v3(0, 0.63, 0), v3(-0.006, 0.665, 0), v3(-0.03, 0.69, 0), v3(-0.06, 0.688, 0), v3(-0.085, 0.672, 0), v3(-0.11, 0.668, 0)],
  bari: [v3(0, 0.596, 0), v3(0, 0.69, 0), v3(0.035, 0.74, 0.012), v3(0.07, 0.705, 0.024), v3(0.058, 0.655, 0.034), v3(0.02, 0.655, 0.042),
    v3(0, 0.7, 0.046), v3(-0.025, 0.745, 0.044), v3(-0.065, 0.758, 0.036), v3(-0.095, 0.748, 0.028)],
};

export function buildSax({ kind = 'alto', scale = 1 } = {}) {
  const outer = new THREE.Group();
  const g = new THREE.Group();
  g.scale.setScalar(scale);
  outer.add(g);

  const brass = metal('goldBrass');
  const bellMat = metal('goldBrass', { side: THREE.DoubleSide });
  const padMat = pad();
  const pearlMat = pearl();

  // ----- Body / bow / bell from one curve, split into three parts -----
  const path = [v3(0, 0.6, 0), v3(0, 0.45, 0), v3(0, 0.3, 0), v3(0, 0.18, 0), v3(0.008, 0.105, 0), v3(0.04, 0.06, 0),
    v3(0.085, 0.06, 0), v3(0.112, 0.1, 0), v3(0.122, 0.18, 0), v3(0.128, 0.26, 0), v3(0.134, 0.33, 0), v3(0.142, 0.385, 0)];
  const curve = new THREE.CatmullRomCurve3(path, false, 'centripetal');
  const rAt = (t) => 0.0125 + 0.0215 * Math.min(t / 0.78, 1) + 0.031 * Math.pow(Math.max(0, (t - 0.74) / 0.26), 2.8);
  const tStraight = 0.42 / curve.getLength();
  addPart(g, 'body', taperedSlice(curve, 0, tStraight, rAt, brass, 60));
  addPart(g, 'bow', taperedSlice(curve, tStraight, 0.66, rAt, brass, 80));
  addPart(g, 'bell', taperedSlice(curve, 0.66, 1, rAt, bellMat, 90, 40));
  addPart(g, 'bell', rimAt(curve, rAt(1), 0.0028, brass));
  // bow guard ring around the joint between body and bow
  addPart(g, 'bow', cylinderBetween(curve.getPointAt(tStraight - 0.005), curve.getPointAt(tStraight + 0.012), rAt(tStraight) * 1.09, brass, 32));
  // brace from body to bell
  addPart(g, 'bell', cylinderBetween(v3(0.02, 0.22, 0), v3(0.105, 0.24, 0), 0.0028, brass, 10));

  const bodyR = (y) => 0.0125 + ((0.6 - y) / 0.42) * 0.0125;

  // ----- Neck, octave key, mouthpiece -----
  const neckCurve = new THREE.CatmullRomCurve3(NECKS[kind], false, 'centripetal');
  addPart(g, 'neck', taperedSlice(neckCurve, 0, 1, (t) => 0.0122 - 0.0045 * t, brass, kind === 'bari' ? 160 : 80, 22));
  addPart(g, 'neck', cylinderBetween(v3(0, 0.585, 0), v3(0, 0.605, 0), 0.0145, brass, 32)); // receiver
  addPart(g, 'neck', cylinderBetween(v3(0, 0.595, -0.014), v3(0, 0.595, -0.024), 0.0018, brass, 8));
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.004, 14), brass);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(0, 0.595, -0.026);
  addPart(g, 'neck', knob);

  const tOct = kind === 'bari' ? 0.82 : 0.55;
  const octP = neckCurve.getPointAt(tOct);
  const octCup = keyCup(0.0045, brass, { padMat });
  octCup.position.copy(octP).add(v3(0, rAt(0) * 0.75, 0));
  addPart(g, 'octave', octCup);
  addPart(g, 'octave', cylinderBetween(v3(0, 0.6, 0.0135), octP.clone().add(v3(0, 0.008, 0.004)), 0.0012, brass, 8));
  const octRing = new THREE.Mesh(new THREE.TorusGeometry(0.0145, 0.0012, 8, 30), brass);
  octRing.rotation.x = Math.PI / 2;
  octRing.position.set(0, 0.575, 0);
  addPart(g, 'octave', octRing);
  const thumbOct = roundedBox(0.012, 0.0025, 0.016, 0.001, brass);
  mount(g, thumbOct, bodyR, 0.53, -FRONT, 0.004);
  addPart(g, 'octave', thumbOct);
  const thumbPearl = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.002, 18), pearlMat);
  mount(g, thumbPearl, bodyR, 0.53, -FRONT, 0.0065);
  addPart(g, 'octave', thumbPearl);

  const mps = mouthpieceSet(0.0118, { silver: metal('nickel'), ebonite: plastic(0x0d0d0e, 0.25), reedMat: cane(), len: 0.09 });
  const end = neckCurve.getPointAt(1);
  const tan = neckCurve.getTangentAt(1);
  const X = new THREE.Vector3(0, 0, -1);
  X.sub(tan.clone().multiplyScalar(X.dot(tan))).normalize();
  const basis = new THREE.Matrix4().makeBasis(X, tan, new THREE.Vector3().crossVectors(X, tan));
  mps.quaternion.setFromRotationMatrix(basis);
  mps.position.copy(end).addScaledVector(tan, -0.012);
  g.add(mps);
  addPart(mps, 'mouthpiece', mps.children[0]);
  addPart(mps, 'reed', mps.userData.reed);
  addPart(mps, 'reed', mps.userData.ligature);

  // ----- Main pearl keys (front) -----
  const PEARL_A = FRONT + 0.45;
  [0.5, 0.46, 0.42, 0.33, 0.29, 0.25].forEach((y, i) => {
    const r = 0.0105 + (i > 2 ? 0.0025 : 0) + i * 0.0004;
    const cup = keyCup(r, brass, { padMat, pearlMat, height: 0.004 });
    mount(g, cup, bodyR, y, PEARL_A, 0.001);
    addPart(g, 'pearls', cup);
  });
  // Auxiliary pad cups up the bell side of the body
  for (let i = 0; i < 9; i++) {
    const y = 0.55 - i * 0.042;
    const cup = keyCup(0.008 + i * 0.0009, brass, { padMat, height: 0.0045 });
    mount(g, cup, bodyR, y, 0.25, 0.001);
    addPart(g, 'padcups', cup);
  }
  // Palm keys (top, player side) and right-hand side keys
  [0.565, 0.545, 0.525].forEach((y, i) => {
    const s = roundedBox(0.012, 0.0025, 0.02, 0.0012, brass);
    mount(g, s, bodyR, y, Math.PI - 0.35 + i * 0.12, 0.007);
    addPart(g, 'pearls', s);
  });
  [0.4, 0.375, 0.35].forEach((y) => {
    const s = roundedBox(0.01, 0.0025, 0.018, 0.0012, brass);
    mount(g, s, bodyR, y, FRONT - 0.65, 0.007);
    addPart(g, 'pearls', s);
  });
  // Rods
  [[FRONT + 1.05, 0.24, 0.56], [FRONT - 0.2, 0.22, 0.56], [-0.35, 0.2, 0.58]].forEach(([a, y0, y1]) => {
    addPart(g, 'padcups', rodWithPosts(bodyR, y0, y1, a, brass, { posts: 4, offset: 0.006, rodR: 0.0014 }));
  });
  // Pinky table
  [0.215, 0.2].forEach((y, i) => {
    const s = roundedBox(0.014, 0.003, 0.012, 0.0014, brass);
    mount(g, s, bodyR, y, FRONT + 0.55 + i * 0.25, 0.008);
    addPart(g, 'pearls', s);
  });

  // ----- Low keys on the bow & bell with key guards -----
  const lowSpots = [[0.48, FRONT, 0.016], [0.53, FRONT - 0.3, 0.017], [0.74, FRONT, 0.019], [0.8, FRONT + 0.2, 0.02]];
  lowSpots.forEach(([t, a, r]) => {
    const p = curve.getPointAt(t);
    const local = new THREE.Group();
    local.position.set(p.x, 0, p.z);
    g.add(local);
    const cup = keyCup(r, brass, { padMat, height: 0.005 });
    mount(local, cup, rAt(t), p.y, a, 0.001);
    addPart(local, 'padcups', cup);
    // guard: a bent strap arching over the cup
    const g0 = around(rAt(t) + 0.001, p.y - r * 1.4, a);
    const g1 = around(rAt(t) + r * 0.9, p.y, a);
    const g2 = around(rAt(t) + 0.001, p.y + r * 1.4, a);
    addPart(local, 'guards', tube([g0, g1, g2], 0.0016, brass, { segments: 24, radial: 6 }));
  });

  // ----- Thumb rest, strap ring -----
  const rest = roundedBox(0.016, 0.006, 0.02, 0.0025, plastic(0x1a1a1a, 0.4));
  mount(g, rest, bodyR, 0.3, -FRONT, 0.006);
  addPart(g, 'thumbrest', rest);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0055, 0.0014, 8, 20), brass);
  ring.position.copy(around(bodyR(0.47) + 0.006, 0.47, -FRONT));
  ring.rotation.y = Math.PI / 2;
  addPart(g, 'thumbrest', ring);

  return outer;
}

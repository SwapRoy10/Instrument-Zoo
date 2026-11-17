// Flute & piccolo. Authored standing along +Y (head joint at the top), then laid
// horizontally. Angle convention on the body: PI points "up" once laid flat.
import * as THREE from 'three';
import {
  addPart, v3, cylinderBetween, roundedBox, lathe, around, mount, keyCup, rodWithPosts,
} from '../../lib/helpers.js';
import { metal, wood, pad, cork } from '../../lib/materials.js';

/**
 * @param {object} o
 *  L       overall length (m)    R  body radius (m)
 *  foot    include a foot joint (flute) or not (piccolo)
 *  woodBody grenadilla body/head (piccolo)
 */
export function buildFlute({ L = 0.67, R = 0.0095, foot = true, woodBody = false } = {}) {
  const outer = new THREE.Group();
  const g = new THREE.Group();
  g.rotation.z = -Math.PI / 2; // lay flat: head joint points to +X
  outer.add(g);

  const silver = metal('silver');
  const bodyMat = woodBody ? wood('grenadilla', { scale: 12, clearcoat: 0.8, roughness: 0.35 }) : metal('silver');
  const padMat = pad();
  const UPA = Math.PI - 0.25;   // keys face up (and slightly toward the viewer)
  const RODA = UPA - 0.85;      // main rod runs along the front
  const BACKA = 0.15;           // thumb keys underneath

  const yFootTop = foot ? 0.15 * L : 0;
  const yHead = foot ? 0.61 * L : 0.6 * L;
  const yTop = L - 0.012 * (L / 0.67);

  // ----- Tube sections -----
  if (foot) {
    addPart(g, 'footjoint', cylinderBetween(v3(0, 0, 0), v3(0, yFootTop, 0), R, bodyMat, 40));
    addPart(g, 'footjoint', cylinderBetween(v3(0, yFootTop - 0.004, 0), v3(0, yFootTop + 0.002, 0), R * 1.12, silver, 40));
  }
  addPart(g, 'body', cylinderBetween(v3(0, yFootTop, 0), v3(0, yHead, 0), R, bodyMat, 40));
  addPart(g, 'body', cylinderBetween(v3(0, yHead - 0.012, 0), v3(0, yHead + 0.002, 0), R * 1.12, silver, 40)); // socket ring
  addPart(g, 'headjoint', cylinderBetween(v3(0, yHead, 0), v3(0, yTop, 0), R * 0.97, bodyMat, 40, R * 0.93));
  if (woodBody) {
    addPart(g, 'headjoint', cylinderBetween(v3(0, yTop - 0.006, 0), v3(0, yTop, 0), R * 1.0, silver, 32));
  }

  // Crown
  const crown = lathe([[0, 0], [R * 0.98, 0], [R * 1.02, 0.003], [R * 0.95, 0.008], [R * 0.6, 0.012], [0, 0.0135]], silver, 32);
  crown.position.y = yTop;
  addPart(g, 'crown', crown);

  // Lip plate & embouchure hole
  const yLip = yTop - 0.11 * L * (foot ? 0.62 : 1.05);
  const lip = roundedBox(R * 2.3, 0.0014, R * 1.55, R * 0.5, silver);
  mount(g, lip, R, yLip, UPA, 0.0022);
  addPart(g, 'lipplate', lip);
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.42, R * 0.5, 0.0024, 24), silver);
  mount(g, riser, R, yLip, UPA, 0.0006);
  addPart(g, 'lipplate', riser);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.34, R * 0.34, 0.004, 24), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 }));
  hole.scale.set(1.25, 1, 1);
  mount(g, hole, R, yLip, UPA, 0.0014);
  addPart(g, 'lipplate', hole);

  // ----- Main body keys -----
  const nKeys = 13;
  const openSet = foot ? new Set([3, 4, 5, 8, 9]) : new Set();
  const span0 = yFootTop + 0.06 * (yHead - yFootTop);
  const span1 = yFootTop + 0.9 * (yHead - yFootTop);
  for (let i = 0; i < nKeys; i++) {
    const y = span0 + (i / (nKeys - 1)) * (span1 - span0);
    const r = R * (0.78 - 0.016 * i);
    const cup = keyCup(r, silver, { padMat, open: openSet.has(i) });
    mount(g, cup, R, y, UPA, 0.0008);
    addPart(g, 'keys', cup);
    // arm from cup to rod
    addPart(g, 'mechanism', cylinderBetween(around(R + 0.0035, y, UPA - 0.35), around(R + 0.0045, y, RODA), 0.0009, silver, 6));
  }
  addPart(g, 'mechanism', rodWithPosts(R, span0 - 0.01, span1 + 0.01, RODA, silver, { offset: 0.0045, posts: 4 }));
  // trill keys on the far side, thumb keys underneath
  [0.78, 0.84].forEach((f) => {
    const y = yFootTop + f * (yHead - yFootTop);
    const cup = keyCup(R * 0.45, silver, { padMat });
    mount(g, cup, R, y, UPA + 0.85, 0.0006);
    addPart(g, 'keys', cup);
  });
  addPart(g, 'mechanism', rodWithPosts(R, yFootTop + 0.74 * (yHead - yFootTop), yFootTop + 0.88 * (yHead - yFootTop), UPA + 1.3, silver, { posts: 2 }));
  [0.9, 0.95].forEach((f) => {
    const y = yFootTop + f * (yHead - yFootTop);
    const cup = keyCup(R * 0.6, silver, { padMat });
    mount(g, cup, R, y, BACKA, 0.0006);
    addPart(g, 'keys', cup);
  });

  // ----- Foot joint keys with rollers -----
  if (foot) {
    [0.22, 0.5, 0.78].forEach((f) => {
      const y = f * yFootTop;
      const cup = keyCup(R * 0.82, silver, { padMat });
      mount(g, cup, R, y, UPA, 0.0008);
      addPart(g, 'footjoint', cup);
      addPart(g, 'footjoint', cylinderBetween(around(R + 0.0035, y, UPA - 0.35), around(R + 0.0045, y, RODA), 0.0009, silver, 6));
    });
    addPart(g, 'footjoint', rodWithPosts(R, 0.01, yFootTop - 0.008, RODA, silver, { posts: 2 }));
    [0.86, 0.94].forEach((f) => {
      const y = f * yFootTop;
      const roller = cylinderBetween(around(R + 0.006, y - 0.007, UPA + 0.55), around(R + 0.006, y + 0.007, UPA + 0.55), 0.0022, silver, 14);
      addPart(g, 'footjoint', roller);
    });
  }

  // Cork in the head joint is hidden; show its adjustment screw as part of the crown.
  const corkDisc = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.9, R * 0.9, 0.001, 20), cork());
  corkDisc.position.y = yTop - 0.0005;
  addPart(g, 'crown', corkDisc);

  return outer;
}

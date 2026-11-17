// Trombone lying along +X: slide section in the z = 0 plane, bell section beside it at -Z.
import * as THREE from 'three';
import { addPart, v3, cylinderBetween, roundedBox, taperedTube, taperedSlice, rimAt, tube } from '../../lib/helpers.js';
import { metal, rubber, cork } from '../../lib/materials.js';
import { hornMouthpiece } from './horn.js';

export function buildTrombone({ bass = false } = {}) {
  const g = new THREE.Group();
  const brass = metal('brass');
  const bellMat = metal('brass', { side: THREE.DoubleSide });
  const nickel = metal('nickel');
  const silver = metal('silver');

  const bore = bass ? 0.0072 : 0.0064;
  const UP = 0;          // upper slide tube y
  const LO = -0.072;     // lower slide tube y
  const SX0 = 0.02;      // inner slide start
  const SX1 = 0.7;       // inner slide end
  const OUT = 0.14;      // how far the outer slide is pulled out (2nd position-ish)
  const BZ = -0.11;      // bell-section plane

  // ----- Slide: inner (nickel) tubes and outer (brass) tubes with crook -----
  [UP, LO].forEach((y) => {
    addPart(g, 'innerslide', cylinderBetween(v3(SX0, y, 0), v3(SX1, y, 0), bore, nickel, 20));
    addPart(g, 'outerslide', cylinderBetween(v3(SX0 + OUT, y, 0), v3(SX1 + OUT, y, 0), bore + 0.0009, brass, 24));
    addPart(g, 'outerslide', cylinderBetween(v3(SX0 + OUT - 0.002, y, 0), v3(SX0 + OUT + 0.012, y, 0), bore + 0.0018, nickel, 24)); // stocking ring
  });
  const crookPts = [v3(SX1 + OUT, UP, 0), v3(SX1 + OUT + 0.028, UP - 0.004, 0), v3(SX1 + OUT + 0.044, (UP + LO) / 2, 0), v3(SX1 + OUT + 0.028, LO + 0.004, 0), v3(SX1 + OUT, LO, 0)];
  addPart(g, 'crook', taperedTube(crookPts, bore + 0.0009, brass, { tubular: 50, radial: 20 }));
  const bumper = new THREE.Mesh(new THREE.SphereGeometry(0.009, 16, 12), rubber());
  bumper.scale.set(0.7, 1, 1);
  bumper.position.set(SX1 + OUT + 0.053, (UP + LO) / 2, 0);
  addPart(g, 'crook', bumper);
  // water key on the crook
  addPart(g, 'crook', cylinderBetween(v3(SX1 + OUT + 0.02, LO - 0.008, 0), v3(SX1 + OUT - 0.02, LO - 0.012, 0), 0.0015, nickel, 8));
  addPart(g, 'crook', cylinderBetween(v3(SX1 + OUT + 0.025, LO - 0.006, 0), v3(SX1 + OUT + 0.025, LO - 0.011, 0), 0.0038, cork(), 12));
  // outer slide brace (the hand grip)
  const grip = SX1 + OUT - 0.05;
  addPart(g, 'outerslide', cylinderBetween(v3(grip, UP, 0), v3(grip, LO, 0), 0.0045, brass, 14));
  addPart(g, 'outerslide', cylinderBetween(v3(grip + 0.02, UP, 0), v3(grip + 0.02, LO, 0), 0.0025, brass, 10));
  // inner slide brace and slide lock
  addPart(g, 'innerslide', cylinderBetween(v3(0.05, UP, 0), v3(0.05, LO, 0), 0.004, brass, 14));
  addPart(g, 'innerslide', cylinderBetween(v3(0.05, UP - 0.02, 0), v3(0.05, UP - 0.02, BZ), 0.0035, brass, 10));
  addPart(g, 'innerslide', cylinderBetween(v3(0.03, LO, 0.0), v3(0.04, LO, 0.012), 0.0042, nickel, 12)); // lock ring

  // ----- Mouthpiece in the upper tube -----
  const mp = hornMouthpiece(silver, { cup: bass ? 0.0135 : 0.0125, len: 0.095, funnel: false });
  mp.rotation.z = -Math.PI / 2; // local +Y (rim -> shank) points +X into the slide
  mp.position.set(SX0 - 0.09, UP, 0);
  addPart(g, 'mouthpiece', mp);

  // ----- Bell section: gooseneck, tuning slide, bell -----
  const neckPts = [v3(SX0, LO, 0), v3(-0.02, LO, 0), v3(-0.045, LO + 0.02, BZ * 0.5), v3(-0.03, LO + 0.04, BZ), v3(0.0, LO + 0.042, BZ)];
  addPart(g, 'tuningslide', taperedTube(neckPts, bore, brass, { tubular: 50, radial: 18 }));
  const tubeY0 = LO + 0.042;
  const tubeY1 = UP + 0.02;
  // back tube to the tuning slide, U-bend behind the player, forward bell tube
  addPart(g, 'tuningslide', cylinderBetween(v3(0.0, tubeY0, BZ), v3(-0.23, tubeY0, BZ), bore + 0.0004, brass, 18));
  const tsPts = [v3(-0.23, tubeY0, BZ), v3(-0.265, tubeY0 - 0.004, BZ), v3(-0.285, (tubeY0 + tubeY1) / 2, BZ), v3(-0.265, tubeY1 + 0.004, BZ), v3(-0.23, tubeY1, BZ)];
  addPart(g, 'tuningslide', taperedTube(tsPts, bore + 0.0008, brass, { tubular: 40, radial: 18 }));
  addPart(g, 'tuningslide', cylinderBetween(v3(-0.21, tubeY0, BZ), v3(-0.21, tubeY1, BZ), 0.0028, brass, 10)); // slide brace
  // counterweight
  const cw = roundedBox(0.05, 0.012, 0.02, 0.005, brass);
  cw.position.set(-0.17, (tubeY0 + tubeY1) / 2, BZ);
  addPart(g, 'tuningslide', cw);

  const bellR = bass ? 0.127 : 0.108;
  const bellPts = [v3(-0.23, tubeY1, BZ), v3(0.0, tubeY1, BZ), v3(0.2, tubeY1 + 0.002, BZ), v3(0.33, tubeY1 + 0.003, BZ), v3(0.4, tubeY1 + 0.004, BZ)];
  const bellCurve = new THREE.CatmullRomCurve3(bellPts, false, 'centripetal');
  const rAt = (t) => bore + 0.0012 + 0.012 * t + (bellR - bore - 0.013) * Math.pow(Math.max(0, (t - 0.55) / 0.45), 3.4);
  addPart(g, 'bell', taperedSlice(bellCurve, 0, 1, rAt, bellMat, 160, 56));
  addPart(g, 'bell', rimAt(bellCurve, rAt(1), 0.0028, brass));
  addPart(g, 'bell', cylinderBetween(v3(0.12, tubeY1, BZ), v3(0.12, UP, 0), 0.003, brass, 10)); // bell brace to slide

  // ----- Bass trombone: F and G-flat rotary valves with extra tubing -----
  if (bass) {
    const valves = [v3(-0.05, tubeY0 + 0.02, BZ - 0.004), v3(-0.1, tubeY0 + 0.02, BZ - 0.004)];
    valves.forEach((p, i) => {
      addPart(g, 'valves', cylinderBetween(p.clone().add(v3(0, 0, -0.022)), p.clone().add(v3(0, 0, 0.022)), 0.017, brass, 28));
      addPart(g, 'valves', cylinderBetween(p.clone().add(v3(0, 0, 0.022)), p.clone().add(v3(0, 0, 0.028)), 0.0185, nickel, 28));
      // thumb triggers
      addPart(g, 'valves', cylinderBetween(p.clone().add(v3(0, 0.015, 0.028)), v3(0.03 - i * 0.025, UP + 0.03, -0.02), 0.0015, nickel, 6));
      const paddle = roundedBox(0.016, 0.004, 0.022, 0.0015, nickel);
      paddle.position.set(0.035 - i * 0.025, UP + 0.035, -0.02);
      addPart(g, 'valves', paddle);
    });
    // the attachment loop of extra tubing behind the bell section
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.075, bore, 16, 80), brass);
    loop.position.set(-0.13, tubeY0 - 0.06, BZ - 0.03);
    addPart(g, 'valves', loop);
    addPart(g, 'valves', cylinderBetween(v3(-0.05, tubeY0, BZ - 0.004), v3(-0.07, tubeY0 - 0.02, BZ - 0.03), bore, brass, 14));
    addPart(g, 'valves', cylinderBetween(v3(-0.1, tubeY0, BZ - 0.004), v3(-0.19, tubeY0 - 0.04, BZ - 0.03), bore, brass, 14));
  }
  return g;
}

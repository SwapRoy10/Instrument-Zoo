// Double French horn, drawn facing the viewer: coils in the X-Y plane, bell sweeping out to +X.
import * as THREE from 'three';
import { addPart, v3, cylinderBetween, roundedBox, lathe, taperedTube, taperedSlice, rimAt, tube } from '../../lib/helpers.js';
import { metal, pearl } from '../../lib/materials.js';

export function hornMouthpiece(mat, { cup = 0.0085, len = 0.088, funnel = true } = {}) {
  // Along +Y from the rim (y = 0) to the shank.
  const prof = funnel
    ? [[0.002, 0.03], [0.005, 0.015], [cup * 0.95, 0.004], [cup + 0.003, 0], [cup + 0.0045, 0.003], [cup * 0.75, 0.018], [0.0062, 0.04], [0.0058, len * 0.7], [0.0049, len], [0.002, len]]
    : [[0.002, 0.016], [cup * 0.7, 0.01], [cup * 0.95, 0.002], [cup + 0.003, 0], [cup + 0.0045, 0.003], [cup * 0.8, 0.016], [0.0062, 0.03], [0.0058, len * 0.7], [0.0049, len], [0.002, len]];
  return lathe(prof, mat, 40);
}

export function buildHorn() {
  const g = new THREE.Group();
  const brass = metal('brass');
  const bellMat = metal('brass', { side: THREE.DoubleSide });
  const nickel = metal('nickel');
  const silver = metal('silver');

  // ----- Coils: three overlapping loops of the F and B-flat sides -----
  const C = v3(0, 0.22, 0);
  [[0.152, 0.0058, -0.024], [0.139, 0.0062, -0.004], [0.126, 0.0068, 0.016]].forEach(([R, r, z]) => {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(R, r, 18, 120), brass);
    loop.position.set(C.x, C.y, z);
    addPart(g, 'tubing', loop);
  });
  // ferrules and braces tying the coils together
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const p0 = v3(C.x + Math.cos(a) * 0.126, C.y + Math.sin(a) * 0.126, 0.016);
    const p1 = v3(C.x + Math.cos(a) * 0.152, C.y + Math.sin(a) * 0.152, -0.024);
    addPart(g, 'tubing', cylinderBetween(p0, p1, 0.0022, brass, 8));
  }

  // ----- Bell: grows out of the bottom of the coils and sweeps to the right -----
  const bellPts = [v3(-0.1, 0.105, 0.03), v3(-0.02, 0.07, 0.034), v3(0.07, 0.075, 0.038), v3(0.15, 0.11, 0.045), v3(0.215, 0.16, 0.052), v3(0.265, 0.205, 0.058), v3(0.3, 0.24, 0.062)];
  const bellCurve = new THREE.CatmullRomCurve3(bellPts, false, 'centripetal');
  const bellR = (t) => 0.0085 + 0.03 * t + 0.115 * Math.pow(Math.max(0, (t - 0.55) / 0.45), 3.2);
  addPart(g, 'bell', taperedSlice(bellCurve, 0, 1, bellR, bellMat, 160, 48));
  addPart(g, 'bell', rimAt(bellCurve, bellR(1), 0.0032, nickel));
  addPart(g, 'bell', cylinderBetween(bellCurve.getPointAt(0.42), bellCurve.getPointAt(0.46), bellR(0.44) * 1.12, nickel, 32)); // detachable-bell ring

  // ----- Rotary valves (3 finger valves + thumb change valve) -----
  const valvePos = [v3(-0.085, 0.3, 0.035), v3(-0.058, 0.278, 0.035), v3(-0.031, 0.256, 0.035), v3(-0.11, 0.322, 0.035)];
  valvePos.forEach((p, i) => {
    addPart(g, 'valves', cylinderBetween(p.clone().add(v3(0, 0, -0.018)), p.clone().add(v3(0, 0, 0.018)), 0.0145, brass, 28));
    addPart(g, 'valves', cylinderBetween(p.clone().add(v3(0, 0, 0.018)), p.clone().add(v3(0, 0, 0.024)), 0.0155, nickel, 28)); // cap
    addPart(g, 'valves', cylinderBetween(p.clone().add(v3(0, 0, -0.024)), p.clone().add(v3(0, 0, -0.018)), 0.0155, nickel, 28));
    const arm = roundedBox(0.026, 0.004, 0.003, 0.0012, nickel); // stop arm
    arm.position.copy(p).add(v3(-0.012, 0.008, 0.027));
    arm.rotation.z = 0.5;
    addPart(g, 'valves', arm);
    // linkage to the lever
    addPart(g, 'levers', cylinderBetween(p.clone().add(v3(-0.016, 0.012, 0.027)), v3(-0.122, p.y + 0.01, 0.03), 0.0011, nickel, 6));
    if (i < 3) {
      const lever = roundedBox(0.018, 0.003, 0.014, 0.0012, nickel);
      lever.position.set(-0.132, p.y + 0.01, 0.03);
      lever.rotation.x = Math.PI / 2;
      addPart(g, 'levers', lever);
    }
  });
  // thumb trigger (B-flat / F change) behind the levers
  const trigger = roundedBox(0.022, 0.003, 0.018, 0.0012, nickel);
  trigger.position.set(-0.135, 0.345, 0.0);
  trigger.rotation.x = Math.PI / 2;
  addPart(g, 'levers', trigger);
  addPart(g, 'levers', cylinderBetween(v3(-0.11, 0.322, 0.012), v3(-0.135, 0.345, 0.004), 0.0011, nickel, 6));
  // little-finger hook
  addPart(g, 'levers', tube([v3(-0.14, 0.235, 0.034), v3(-0.152, 0.225, 0.04), v3(-0.144, 0.212, 0.04)], 0.0018, brass, { segments: 16, radial: 6 }));

  // ----- Valve & tuning slides -----
  const slide = (a, b, out, r = 0.0055) => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const n = out.clone().normalize();
    const pts = [a, a.clone().addScaledVector(n, 0.05), a.clone().addScaledVector(dir, 0.5).addScaledVector(n, 0.068), b.clone().addScaledVector(n, 0.05), b];
    return taperedTube(pts, r, brass, { tubular: 48, radial: 14 });
  };
  valvePos.slice(0, 3).forEach((p, i) => {
    addPart(g, 'slides', slide(p.clone().add(v3(-0.004, 0.014, -0.01)), p.clone().add(v3(0.012, 0.004, -0.01)), v3(0.3, 1, 0), 0.0052));
    addPart(g, 'slides', slide(p.clone().add(v3(0.008, -0.012, 0.0)), p.clone().add(v3(0.018, -0.002, 0.0)), v3(0.6, -0.4 - i * 0.2, 0), 0.0052));
  });
  addPart(g, 'slides', slide(v3(-0.03, 0.17, 0.03), v3(0.0, 0.15, 0.03), v3(-0.3, -1, 0), 0.0065)); // main tuning slide

  // ----- Leadpipe & mouthpiece -----
  const leadPts = [v3(-0.04, 0.27, 0.05), v3(-0.07, 0.35, 0.052), v3(-0.13, 0.4, 0.05), v3(-0.2, 0.42, 0.046), v3(-0.25, 0.425, 0.044)];
  const lead = new THREE.CatmullRomCurve3(leadPts, false, 'centripetal');
  addPart(g, 'leadpipe', taperedSlice(lead, 0, 1, (t) => 0.0068 - 0.0024 * t, brass, 60, 16));
  addPart(g, 'leadpipe', cylinderBetween(lead.getPointAt(0.93), lead.getPointAt(1), 0.0062, nickel, 18)); // receiver
  const mp = hornMouthpiece(silver);
  const end = lead.getPointAt(1);
  const tan = lead.getTangentAt(1);
  mp.quaternion.setFromUnitVectors(v3(0, 1, 0), tan.clone().negate());
  mp.position.copy(end).addScaledVector(tan, 0.085);
  addPart(g, 'mouthpiece', mp);

  return g;
}

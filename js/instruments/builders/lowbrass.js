// Euphonium and tuba: upright conical brass with the bell pointing up.
// Front view in the X-Y plane; valves face the viewer (+Z).
import * as THREE from 'three';
import { addPart, v3, cylinderBetween, taperedTube, taperedSlice, rimAt } from '../../lib/helpers.js';
import { metal, pearl, cork } from '../../lib/materials.js';
import { hornMouthpiece } from './horn.js';

export function buildLowBrass({ tuba = false } = {}) {
  const outer = new THREE.Group();
  const g = new THREE.Group();
  outer.add(g);
  const s = tuba ? 1.5 : 1;
  g.scale.setScalar(s);

  const lacquer = metal(tuba ? 'silver' : 'brass');
  const bellMat = metal(tuba ? 'silver' : 'brass', { side: THREE.DoubleSide });
  const trim = metal('nickel');
  const pearlMat = pearl();

  // ----- Main branch: valve exit -> bottom bow -> rising bell -----
  const pts = [v3(-0.03, 0.17, 0.05), v3(-0.03, 0.1, 0.05), v3(-0.012, 0.045, 0.042), v3(0.04, 0.03, 0.025), v3(0.095, 0.06, 0.008),
    v3(0.115, 0.15, 0), v3(0.122, 0.28, 0), v3(0.128, 0.42, 0), v3(0.132, 0.52, 0), v3(0.135, 0.6, 0)];
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const bellR = tuba ? 0.135 : 0.15;
  const rAt = (t) => 0.012 + 0.03 * t + (bellR - 0.042) * Math.pow(Math.max(0, (t - 0.68) / 0.32), 3);
  addPart(g, 'bow', taperedSlice(curve, 0, 0.42, rAt, lacquer, 90, 32));
  addPart(g, 'bell', taperedSlice(curve, 0.42, 1, rAt, bellMat, 130, 56));
  addPart(g, 'bell', rimAt(curve, rAt(1), 0.003, trim));
  addPart(g, 'bow', cylinderBetween(curve.getPointAt(0.24), curve.getPointAt(0.29), rAt(0.27) * 1.08, trim, 32)); // bow guard

  // ----- Valve block: 3 top pistons + side 4th (compensating) valve -----
  const valveX = [-0.095, -0.064, -0.033];
  valveX.forEach((x) => {
    addPart(g, 'valves', cylinderBetween(v3(x, 0.17, 0.06), v3(x, 0.33, 0.06), 0.0145, lacquer, 28));
    addPart(g, 'valves', cylinderBetween(v3(x, 0.33, 0.06), v3(x, 0.342, 0.06), 0.016, trim, 28));
    addPart(g, 'valves', cylinderBetween(v3(x, 0.158, 0.06), v3(x, 0.17, 0.06), 0.0158, trim, 28));
    addPart(g, 'valves', cylinderBetween(v3(x, 0.342, 0.06), v3(x, 0.37, 0.06), 0.0028, trim, 10));
    addPart(g, 'valves', cylinderBetween(v3(x, 0.37, 0.06), v3(x, 0.376, 0.06), 0.011, trim, 24));
    addPart(g, 'valves', cylinderBetween(v3(x, 0.376, 0.06), v3(x, 0.3775, 0.06), 0.0095, pearlMat, 24));
  });
  addPart(g, 'valves', cylinderBetween(v3(0.002, 0.15, 0.075), v3(0.002, 0.28, 0.075), 0.0135, lacquer, 28)); // 4th valve
  addPart(g, 'valves', cylinderBetween(v3(0.002, 0.28, 0.075), v3(0.002, 0.29, 0.075), 0.015, trim, 28));
  // ports linking the block
  addPart(g, 'valves', cylinderBetween(v3(-0.11, 0.25, 0.06), v3(0.002, 0.22, 0.075), 0.007, lacquer, 14));
  addPart(g, 'valves', cylinderBetween(v3(-0.033, 0.19, 0.06), v3(-0.03, 0.17, 0.05), 0.012, lacquer, 16));

  // ----- Valve slides hanging below / beside the block -----
  const uSlide = (a, b, depthDir, depth, r) => {
    const mid = a.clone().add(b).multiplyScalar(0.5).addScaledVector(depthDir, depth);
    const pts2 = [a, a.clone().addScaledVector(depthDir, depth * 0.7), mid, b.clone().addScaledVector(depthDir, depth * 0.7), b];
    return taperedTube(pts2, r, lacquer, { tubular: 50, radial: 16 });
  };
  valveX.forEach((x, i) => {
    addPart(g, 'slides', uSlide(v3(x - 0.006, 0.19, 0.072), v3(x + 0.006, 0.19, 0.072), v3(0, -1, 0.15), 0.05 + i * 0.02, 0.0075));
  });
  addPart(g, 'slides', uSlide(v3(0.002, 0.16, 0.088), v3(0.002, 0.2, 0.088), v3(1, 0, 0.3), 0.08, 0.009));

  // ----- Main tuning slide: big loop to the left of the valves -----
  addPart(g, 'tuningslide', uSlide(v3(-0.11, 0.3, 0.05), v3(-0.11, 0.2, 0.05), v3(-1, 0, -0.1), 0.09, 0.0105));
  addPart(g, 'tuningslide', cylinderBetween(v3(-0.178, 0.29, 0.042), v3(-0.178, 0.21, 0.042), 0.003, trim, 10));
  // water key on the tuning slide
  addPart(g, 'tuningslide', cylinderBetween(v3(-0.2, 0.25, 0.04), v3(-0.19, 0.28, 0.045), 0.0018, trim, 8));
  addPart(g, 'tuningslide', cylinderBetween(v3(-0.2, 0.246, 0.04), v3(-0.207, 0.246, 0.04), 0.004, cork(), 12));

  // ----- Wrap: the long coil of tubing behind the valves -----
  const wrapCount = tuba ? 2 : 1;
  for (let i = 0; i < wrapCount; i++) {
    const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.095 - i * 0.018, 0.012 + i * 0.002, 16, 80, Math.PI * 1.6), lacquer);
    wrap.position.set(-0.03, 0.27, -0.03 - i * 0.025);
    wrap.rotation.z = -0.4;
    addPart(g, 'wrap', wrap);
  }
  addPart(g, 'wrap', cylinderBetween(v3(0.06, 0.24, -0.03), v3(0.11, 0.28, 0), 0.004, lacquer, 10)); // brace to bell

  // ----- Leadpipe & mouthpiece -----
  const leadPts = [v3(-0.095, 0.3, 0.07), v3(-0.11, 0.36, 0.08), v3(-0.13, 0.42, 0.075), v3(-0.15, 0.47, 0.065), v3(-0.17, 0.5, 0.055)];
  const lead = new THREE.CatmullRomCurve3(leadPts, false, 'centripetal');
  addPart(g, 'leadpipe', taperedSlice(lead, 0, 1, (t) => 0.009 - 0.0035 * t, lacquer, 60, 18));
  addPart(g, 'leadpipe', cylinderBetween(lead.getPointAt(0.92), lead.getPointAt(1), 0.0075, trim, 18));
  const mp = hornMouthpiece(metal('silver'), { cup: tuba ? 0.016 : 0.0135, len: tuba ? 0.1 : 0.09, funnel: false });
  const end = lead.getPointAt(1);
  const tan = lead.getTangentAt(1);
  mp.quaternion.setFromUnitVectors(v3(0, 1, 0), tan.clone().negate());
  mp.position.copy(end).addScaledVector(tan, tuba ? 0.095 : 0.085);
  addPart(g, 'mouthpiece', mp);

  return outer;
}

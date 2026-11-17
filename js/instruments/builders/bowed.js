// Parametric builder for the violin family (violin, viola, cello, double bass).
// Geometry is authored in "violin units" (a 356 mm violin body) and scaled up;
// rib depth, endpin, machine heads and body outline change per instrument.
import * as THREE from 'three';
import {
  addPart, v3, cylinderBetween, roundedBox, smoothOutline, mirrorOutline, tube,
} from '../../lib/helpers.js';
import { wood, metal, horsehair, stringMat, dark, rubber, pearl } from '../../lib/materials.js';

const BODY_TOP = 0.178;
const NUT_Y = 0.315;
const BRIDGE_Y = -0.03;

const OUTLINE_VIOLIN = [
  [0, -0.178], [0.06, -0.172], [0.094, -0.15], [0.103, -0.11], [0.097, -0.07],
  [0.082, -0.046], [0.06, -0.033], [0.055, 0.0], [0.06, 0.03], [0.077, 0.045],
  [0.083, 0.075], [0.08, 0.12], [0.06, 0.16], [0, BODY_TOP],
];
// Double bass: gamba-style sloping shoulders and gentler C-bouts.
const OUTLINE_BASS = [
  [0, -0.178], [0.062, -0.172], [0.096, -0.15], [0.104, -0.11], [0.098, -0.07],
  [0.084, -0.045], [0.066, -0.028], [0.062, 0.0], [0.066, 0.028], [0.078, 0.05],
  [0.082, 0.08], [0.072, 0.115], [0.048, 0.148], [0.026, 0.17], [0, BODY_TOP],
];

/**
 * @param {object} o
 *  scale        overall size relative to a violin
 *  ribDepth     rib height in violin units (violin 0.03)
 *  varnish      tint for the varnished maple/spruce
 *  chinrest     violin & viola only
 *  endpin       length in violin units (cello/bass), 0 = none
 *  machineHeads geared tuners instead of friction pegs (bass)
 *  bassShape    sloping-shoulder outline
 *  fineTuners   number of fine tuners on the tailpiece
 *  bridgeHeight bridge height in violin units (violin 0.033)
 *  bowLength    bow length in metres
 *  stringKinds  material kinds for the 4 strings (low -> high)
 */
export function buildBowed(o) {
  const {
    scale = 1, ribDepth = 0.03, varnish = 0xffffff, chinrest = false, endpin = 0,
    machineHeads = false, bassShape = false, fineTuners = 1, bridgeHeight = 0.033,
    bowLength = 0.75, stringKinds = ['gut', 'gut', 'gut', 'steel'],
  } = o;

  const outer = new THREE.Group();
  const g = new THREE.Group();
  g.scale.setScalar(scale);
  outer.add(g);

  const triScale = 5;
  const back = wood('maple', { tint: varnish, scale: triScale, clearcoat: 1, clearcoatRoughness: 0.12, roughness: 0.45 });
  const top = wood('spruce', { tint: new THREE.Color(varnish).multiply(new THREE.Color(0xb0602c)), scale: 14, clearcoat: 1, clearcoatRoughness: 0.12, roughness: 0.45 });
  const ebony = wood('ebony', { scale: 8, clearcoat: 0.3, roughness: 0.4 });
  const neckWood = wood('mapleNatural', { scale: triScale, tint: 0xe7c9a0, clearcoat: 0.2, roughness: 0.55 });
  const bridgeWood = wood('mapleNatural', { scale: 12, clearcoat: 0, roughness: 0.7 });
  const blackMat = dark();
  const silver = metal('nickel');
  const brass = metal('brass');

  // ----- Body -----
  const outline = smoothOutline(mirrorOutline(bassShape ? OUTLINE_BASS : OUTLINE_VIOLIN));
  const shape = new THREE.Shape(outline);
  const arch = 0.013;
  const backGeo = new THREE.ExtrudeGeometry(shape, {
    depth: ribDepth, bevelEnabled: true, bevelThickness: bassShape ? 0.004 : arch, bevelSize: 0.003, bevelSegments: 6, curveSegments: 48,
  });
  const backMesh = new THREE.Mesh(backGeo, back);
  backMesh.position.z = -(ribDepth + (bassShape ? 0.004 : arch)) - 0.0005;
  addPart(g, 'ribs', backMesh);

  const topGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.0005, bevelEnabled: true, bevelThickness: arch, bevelSize: 0.0032, bevelSegments: 8, curveSegments: 48,
  });
  const topPlate = new THREE.Mesh(topGeo, top);
  topPlate.position.z = -arch - 0.0005;
  addPart(g, 'top', topPlate);
  const purfPts = outline.filter((_, i) => i % 2 === 0).map((p) => v3(p.x * 0.955, p.y * 0.975, 0.0001));
  const purfling = tube(purfPts, 0.0008, ebony, { closed: true, segments: 220, radial: 4 });
  purfling.scale.z = 0.5;
  addPart(g, 'top', purfling);

  // F-holes
  [-1, 1].forEach((s) => {
    const x = s * 0.036;
    const pts = [
      v3(x + s * 0.004, BRIDGE_Y + 0.045, 0), v3(x + s * 0.001, BRIDGE_Y + 0.03, 0),
      v3(x - s * 0.003, BRIDGE_Y, 0), v3(x + s * 0.001, BRIDGE_Y - 0.03, 0),
      v3(x - s * 0.004, BRIDGE_Y - 0.045, 0),
    ];
    const slot = tube(pts, 0.0016, blackMat, { segments: 40, radial: 6 });
    slot.scale.z = 0.4;
    addPart(g, 'fholes', slot);
    [pts[0], pts[4]].forEach((p) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.0034, 12, 8), blackMat);
      eye.position.copy(p);
      eye.scale.z = 0.4;
      addPart(g, 'fholes', eye);
    });
  });

  // ----- Bridge -----
  const hb = bridgeHeight;
  const k = hb / 0.033;
  const bs = new THREE.Shape();
  bs.moveTo(-0.021, 0);
  bs.lineTo(-0.012, 0);
  bs.quadraticCurveTo(0, 0.01 * k, 0.012, 0);
  bs.lineTo(0.021, 0);
  bs.lineTo(0.019, 0.006 * k);
  bs.quadraticCurveTo(0.012, 0.016 * k, 0.017, 0.026 * k);
  bs.quadraticCurveTo(0, 0.036 * k, -0.017, 0.026 * k);
  bs.quadraticCurveTo(-0.012, 0.016 * k, -0.019, 0.006 * k);
  bs.lineTo(-0.021, 0);
  const heart = new THREE.Path();
  heart.absellipse(0, 0.019 * k, 0.0035, 0.0028 * k, 0, Math.PI * 2, true);
  const kidL = new THREE.Path();
  kidL.absellipse(-0.009, 0.013 * k, 0.0022, 0.004 * k, 0, Math.PI * 2, true);
  const kidR = new THREE.Path();
  kidR.absellipse(0.009, 0.013 * k, 0.0022, 0.004 * k, 0, Math.PI * 2, true);
  bs.holes.push(heart, kidL, kidR);
  const bridge = new THREE.Mesh(new THREE.ExtrudeGeometry(bs, { depth: 0.0035, bevelEnabled: false, curveSegments: 16 }), bridgeWood);
  bridge.rotation.x = Math.PI / 2;
  bridge.position.set(0, BRIDGE_Y + 0.00175, 0);
  addPart(g, 'bridge', bridge);
  const bridgeTop = (x) => {
    const t = (1 - x / 0.017) / 2;
    return k * (0.026 * ((1 - t) ** 2 + t * t) + 0.072 * t * (1 - t)) + 0.0004;
  };

  // ----- Neck & fingerboard -----
  const neck = roundedBox(0.026, NUT_Y - 0.16, 0.022, 0.008, neckWood);
  neck.position.set(0, (NUT_Y + 0.16) / 2, 0);
  addPart(g, 'neck', neck);
  const heel = roundedBox(0.03, 0.03, 0.035, 0.01, back);
  heel.position.set(0, BODY_TOP + 0.005, -0.012);
  addPart(g, 'neck', heel);

  const fbLow = 0.04;
  const fbLen = NUT_Y - fbLow;
  const fbRise = (hb - 0.033) * 0.6; // taller bridges need a more steeply raised fingerboard
  const fbGroup = new THREE.Group();
  const fbTopGeo = new THREE.CylinderGeometry(0.06, 0.06, fbLen, 24, 1, false, -0.21, 0.42);
  const fingerboard = new THREE.Mesh(fbTopGeo, ebony);
  fingerboard.scale.set(1, 1, 0.35);
  fingerboard.position.set(0, fbLen / 2, -0.06 * 0.35 + 0.0005);
  fbGroup.add(fingerboard);
  const fbUnder = new THREE.Mesh(new THREE.BoxGeometry(0.025, fbLen, 0.008), ebony);
  fbUnder.position.set(0, fbLen / 2, -0.0045);
  fbGroup.add(fbUnder);
  fbGroup.position.set(0, fbLow, 0.022 + fbRise);
  fbGroup.rotation.x = -0.025 - fbRise / fbLen;
  addPart(g, 'fingerboard', fbGroup);
  const nut = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.004, 0.004), ebony);
  nut.position.set(0, NUT_Y + 0.002, 0.0145);
  addPart(g, 'fingerboard', nut);

  // ----- Pegbox, pegs or machine heads, scroll -----
  const pegbox = roundedBox(0.026, 0.075, 0.028, 0.006, back);
  pegbox.position.set(0, NUT_Y + 0.04, -0.004);
  addPart(g, 'pegs', pegbox);
  const cavity = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.06, 0.004), blackMat);
  cavity.position.set(0, NUT_Y + 0.04, 0.0105);
  addPart(g, 'pegs', cavity);
  const pegYs = [NUT_Y + 0.016, NUT_Y + 0.032, NUT_Y + 0.05, NUT_Y + 0.066];
  const pegSides = machineHeads ? [1, 1, -1, -1] : [1, -1, 1, -1];
  pegYs.forEach((y, i) => {
    const s = pegSides[i];
    if (machineHeads) {
      const plate = roundedBox(0.0015, 0.036, 0.016, 0.0007, brass);
      plate.position.set(s * 0.0135, (s > 0 ? NUT_Y + 0.024 : NUT_Y + 0.058), -0.004);
      addPart(g, 'pegs', plate);
      addPart(g, 'pegs', cylinderBetween(v3(-s * 0.012, y, -0.004), v3(s * 0.016, y, -0.004), 0.0022, brass, 10));
      addPart(g, 'pegs', cylinderBetween(v3(s * 0.014, y, -0.012), v3(s * 0.026, y, -0.012), 0.0012, brass, 8));
      const key = roundedBox(0.003, 0.012, 0.009, 0.0014, brass);
      key.position.set(s * 0.028, y, -0.012);
      addPart(g, 'pegs', key);
    } else {
      addPart(g, 'pegs', cylinderBetween(v3(-s * 0.016, y, 0), v3(s * 0.03, y, 0), 0.0028, ebony, 12, 0.0038));
      const head = roundedBox(0.004, 0.016, 0.013, 0.0018, ebony);
      head.position.set(s * 0.034, y, 0);
      addPart(g, 'pegs', head);
      const collar = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 10, 8), pearl());
      collar.position.set(s * 0.0365, y, 0);
      addPart(g, 'pegs', collar);
    }
  });

  const cy = NUT_Y + 0.09;
  const cz = -0.004;
  const spiral = [v3(0, NUT_Y + 0.072, 0.005)];
  for (let t = 0; t <= 1.0001; t += 0.02) {
    const ang = -0.4 + t * Math.PI * 2 * 1.7;
    const r = 0.0145 * (1 - 0.65 * t);
    spiral.push(v3(0, cy + Math.sin(ang) * r, cz + Math.cos(ang) * r));
  }
  const scroll = tube(spiral, 0.0072, back, { segments: 160, radial: 14 });
  scroll.scale.x = 1.5;
  addPart(g, 'scroll', scroll);

  // ----- Tailpiece, fine tuners, end button / endpin -----
  const tp = new THREE.Shape();
  tp.moveTo(-0.0085, 0);
  tp.lineTo(0.0085, 0);
  tp.quadraticCurveTo(0.021, 0.05, 0.02, 0.105);
  tp.quadraticCurveTo(0, 0.112, -0.02, 0.105);
  tp.quadraticCurveTo(-0.021, 0.05, -0.0085, 0);
  const tailpiece = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tp, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.0015, bevelSegments: 2 }),
    ebony
  );
  tailpiece.position.set(0, -0.172, 0.006);
  tailpiece.rotation.x = 0.07;
  addPart(g, 'tailpiece', tailpiece);
  const tpTop = -0.172 + 0.105;
  const stringX = (i) => 1 - (i / 3) * 2; // +1 = lowest string (bass side)
  for (let i = 0; i < 4; i++) {
    if (fineTuners === 1 ? i !== 3 : i >= fineTuners) continue;
    const x = stringX(i) * 0.0075;
    addPart(g, 'tailpiece', cylinderBetween(v3(x, tpTop - 0.012, 0.014), v3(x, tpTop - 0.012, 0.024), 0.0024, silver, 14));
    const lever = roundedBox(0.0035, 0.02, 0.003, 0.0012, silver);
    lever.position.set(x, tpTop - 0.022, 0.016);
    addPart(g, 'tailpiece', lever);
  }
  addPart(g, 'tailpiece', tube([v3(-0.006, -0.172, 0.008), v3(0, -0.186, -0.01), v3(0.006, -0.172, 0.008)], 0.0012, blackMat, { segments: 20 }));
  addPart(g, endpin ? 'endpin' : 'tailpiece', cylinderBetween(v3(0, -0.178, -0.026), v3(0, -0.19, -0.026), 0.006, ebony, 16));

  if (endpin) {
    addPart(g, 'endpin', cylinderBetween(v3(0, -0.19, -0.026), v3(0, -0.178 - endpin, -0.026), 0.0018, silver, 10));
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.004, 14, 10), rubber());
    tip.position.set(0, -0.178 - endpin, -0.026);
    addPart(g, 'endpin', tip);
    addPart(g, 'endpin', cylinderBetween(v3(0, -0.196, -0.026), v3(0, -0.2, -0.026), 0.0035, silver, 12)); // collar screw
  }

  if (chinrest) {
    const cr = new THREE.Mesh(new THREE.SphereGeometry(0.035, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), ebony);
    cr.rotation.x = Math.PI / 2;
    cr.scale.set(1.2, 0.32, 0.85);
    cr.position.set(0.045, -0.14, -0.002);
    addPart(g, 'chinrest', cr);
    const crFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 24), ebony);
    crFoot.rotation.x = Math.PI / 2;
    crFoot.scale.set(1.2, 1, 0.85);
    crFoot.position.set(0.045, -0.14, -0.006);
    addPart(g, 'chinrest', crFoot);
  }

  // ----- Strings -----
  const radii = [0.00055, 0.00045, 0.00038, 0.00027];
  const pegForString = machineHeads ? [0, 1, 2, 3] : [3, 1, 0, 2];
  for (let i = 0; i < 4; i++) {
    const s = stringX(i);
    const m = stringMat(stringKinds[i]);
    const tail = v3(s * 0.0075, tpTop - 0.004, 0.016);
    const br = v3(s * 0.0165, BRIDGE_Y, bridgeTop(s * 0.0165));
    const nt = v3(s * 0.0075, NUT_Y + 0.002, 0.0168);
    const peg = v3(s * 0.004, pegYs[pegForString[i]], 0.003);
    addPart(g, 'strings', cylinderBetween(tail, br, radii[i], m, 6));
    addPart(g, 'strings', cylinderBetween(br, nt, radii[i], m, 6));
    addPart(g, 'strings', cylinderBetween(nt, peg, radii[i], m, 6));
  }

  // ----- Bow (absolute metres, standing beside the instrument) -----
  const bow = new THREE.Group();
  const bottom = -0.178 * scale - (endpin ? endpin * scale : 0);
  bow.position.set(0.11 * scale + 0.1, bottom, -0.02 * scale);
  const L = bowLength;
  const stickWood = wood('rosewood', { scale: 20, tint: 0xd07a55, clearcoat: 0.8, roughness: 0.45 });
  const stickPts = [];
  for (let t = 0; t <= 1.0001; t += 0.05) stickPts.push(v3(0.011 * Math.sin(Math.PI * t), t * L, 0));
  addPart(bow, 'bow', tube(stickPts, 0.0042, stickWood, { segments: 80, radial: 10 }));
  const tipHead = roundedBox(0.024, 0.016, 0.008, 0.003, stickWood);
  tipHead.position.set(0.011, L - 0.006, 0);
  addPart(bow, 'bow', tipHead);
  const tipPlate = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.0025, 0.0085), new THREE.MeshStandardMaterial({ color: 0xf4efe3, roughness: 0.4 }));
  tipPlate.position.set(0.019, L - 0.0145, 0);
  addPart(bow, 'bow', tipPlate);
  const frog = roundedBox(0.02, 0.045, 0.011, 0.004, ebony);
  frog.position.set(0.013, 0.07, 0);
  addPart(bow, 'bow', frog);
  const eye = new THREE.Mesh(new THREE.CircleGeometry(0.003, 16), pearl());
  eye.position.set(0.013, 0.07, 0.0057);
  addPart(bow, 'bow', eye);
  addPart(bow, 'bow', cylinderBetween(v3(0, -0.004, 0), v3(0, 0.02, 0), 0.0045, silver, 12));
  addPart(bow, 'bow', cylinderBetween(v3(0, 0.1, 0), v3(0, 0.14, 0), 0.0047, silver, 12));
  const hairStart = 0.09;
  const hairEnd = L - 0.015;
  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.0012, hairEnd - hairStart, 0.009), horsehair());
  hair.position.set(0.021, (hairStart + hairEnd) / 2, 0);
  addPart(bow, 'bow', hair);
  outer.add(bow);

  return outer;
}

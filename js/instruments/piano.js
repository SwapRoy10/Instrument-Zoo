import * as THREE from 'three';
import {
  mat, pmat, addPart, v3, v2, cylinderBetween, instancedCylinders, instancedBoxes, offsetPolygon, tube,
} from '../lib/helpers.js';

// Grand piano. Plan view uses (u, v): u = across the keyboard (bass at -u),
// v = distance back from the keyboard toward the tail. World: x = u, z = -v, y up.
const W = 0.7;             // half-width of the case
const RIM_Y = 0.6;         // bottom of the rim
const RIM_H = 0.3;
const RIM_T = 0.045;       // rim thickness
const SOUNDBOARD_Y = 0.7;
const PLATE_Y = 0.715;
const STRING_Y = 0.745;
const KEY_TOP = 0.7;
const STRING_U = 0.58;     // strings span -STRING_U..STRING_U
const N_STRINGS = 72;      // representative subset of the real ~230

const curveCtrl = [
  [-W, 1.55], [-0.66, 1.71], [-0.52, 1.79], [-0.3, 1.78], [-0.1, 1.66],
  [0.1, 1.4], [0.3, 1.1], [0.5, 0.86], [0.64, 0.68], [W, 0.56],
];

function makeOutline() {
  const curve = new THREE.CatmullRomCurve3(curveCtrl.map(([u, v]) => v3(u, v, 0)), false, 'centripetal');
  const curvePts = curve.getSpacedPoints(120).map((p) => v2(p.x, p.y));
  return { pts: [v2(-W, 0), ...curvePts, v2(W, 0)], curvePts };
}

/** v of the outer case edge at a given u (for u along the curved tail/bentside). */
function makeTopV(curvePts) {
  return (u) => {
    for (let i = 0; i < curvePts.length - 1; i++) {
      const a = curvePts[i];
      const b = curvePts[i + 1];
      if ((u >= a.x && u <= b.x) || (u <= a.x && u >= b.x)) {
        const t = (u - a.x) / (b.x - a.x || 1);
        return a.y + (b.y - a.y) * t;
      }
    }
    return curvePts[curvePts.length - 1].y;
  };
}

/** A flat shape in plan view, laid on the floor plane and raised to `y`. */
function planMesh(geometry, material, y) {
  const m = new THREE.Mesh(geometry, material);
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  return m;
}

export default {
  id: 'piano',
  name: 'Grand Piano',
  emoji: '🎹',
  family: 'Keyboard · Struck strings',
  blurb:
    'A grand piano is a giant harp lying on its side inside a wooden case. Pressing a key flings a felt hammer up at the strings. It is technically a percussion instrument as much as a string instrument, with around 12,000 parts.',
  defaultView: [0.35, 0.75, 1],
  parts: [
    {
      id: 'lid', name: 'Lid & Prop Stick',
      what: 'The large hinged top of the case, held open by a wooden prop stick.',
      why: 'When open, the lid works like a reflector: it bounces sound sideways toward the audience. That is why concert grands are placed with the open lid facing the hall.',
      fact: 'Most lids have two prop sticks: a long one for concerts and a short one for a softer sound at home.',
      view: [1, 0.7, 0.4],
    },
    {
      id: 'rim', name: 'Rim (Case)',
      what: 'The curved outer wall of the piano, made from many layers of hardwood bent around a mould.',
      why: 'The rim is the frame the soundboard is glued into, so its stiffness affects the tone. A heavy, rigid rim keeps energy in the soundboard instead of soaking it up.',
      fact: 'The long curved side is called the “bentside”. Its curve follows the bass strings getting longer as they go down the keyboard.',
      view: [1, 0.3, -0.3],
    },
    {
      id: 'keys', name: 'Keyboard',
      what: '88 keys: 52 white naturals and 36 black sharps and flats, spanning just over seven octaves from A0 to C8.',
      why: 'Each key is a lever. Pressing the front end lifts the back end, which starts the action that throws a hammer at the strings. How fast you press decides how loud the note is.',
      fact: 'Black keys were once made of ebony and white key tops of ivory. Modern keys use plastics for both.',
      view: [0.15, 0.85, 1],
    },
    {
      id: 'hammers', name: 'Hammers',
      what: 'Felt-covered wooden heads that fly up from below and strike the strings.',
      why: 'Each hammer hits its string and instantly bounces away so the string can ring. The hardness of the felt shapes the tone, and technicians “voice” a piano by needling or hardening it.',
      fact: 'The “repetition” action, invented by Sébastien Érard in 1821, lets a note be repeated before the key has fully risen. It made fast repeated notes possible.',
      view: [0.1, 1, 0.55],
      ghost: ['lid', 'musicdesk'],
    },
    {
      id: 'dampers', name: 'Dampers',
      what: 'Felt pads resting on top of the strings, lifted off when a key is pressed.',
      why: 'They silence a string as soon as you release its key. The right-hand (sustain) pedal lifts all of them at once so notes keep ringing.',
      fact: 'The highest strings have no dampers at all. They are so short their sound dies away almost instantly on its own.',
      view: [-0.15, 1, 0.5],
      ghost: ['lid', 'musicdesk'],
    },
    {
      id: 'strings', name: 'Strings',
      what: 'About 230 high-tension steel strings. Most notes have two or three strings in unison, and the bass strings are wound with copper.',
      why: 'They make the vibrations that become the sound. Long, heavy strings play low notes and short, thin ones play high. Using several strings per note makes it louder and gives the tone its shimmer.',
      fact: 'Together the strings pull with roughly 20 tonnes of force. That is why the piano needs a cast-iron plate.',
      view: [0.2, 1, 0.45],
      ghost: ['lid', 'musicdesk'],
    },
    {
      id: 'pins', name: 'Tuning Pins',
      what: 'Rows of steel pins driven into a laminated hardwood block (the pinblock) near the keyboard.',
      why: 'Each string is wound around a pin. A tuner turns the pins with a lever to adjust each string’s tension, and friction in the tight wood holds them in place.',
      fact: 'A full tuning means adjusting roughly 230 pins by ear, often by tiny fractions of a degree.',
      view: [0.1, 1, 0.6],
      ghost: ['lid', 'musicdesk'],
    },
    {
      id: 'plate', name: 'Cast-Iron Plate (Harp)',
      what: 'The heavy gold-painted iron frame bolted over the soundboard. The strings are anchored to it.',
      why: 'It holds the enormous string tension. Before iron frames, wooden pianos could not take tight, heavy strings, so they were quieter and went out of tune quickly.',
      fact: 'A concert grand’s plate weighs around 160–180 kg, often a third of the whole instrument’s weight.',
      view: [-0.2, 1, 0.2],
      ghost: ['lid', 'musicdesk'],
    },
    {
      id: 'soundboard', name: 'Soundboard & Bridge',
      what: 'A huge, thin spruce panel under the strings, with a curved hardwood bridge on top that the strings press down on.',
      why: 'A string alone barely moves any air. The bridge passes its vibration to the soundboard, whose large surface turns it into the sound you hear.',
      fact: 'Soundboards are built with a slight upward arch called “crown”. It pushes back against the strings’ down-pressure on the bridge.',
      view: [-0.3, 1, 0.1],
      ghost: ['lid', 'musicdesk', 'strings', 'plate', 'dampers'],
    },
    {
      id: 'musicdesk', name: 'Music Desk',
      what: 'The angled panel above the keys where the sheet music rests.',
      why: 'It holds scores at reading height. Some pianists remove it entirely so more sound reaches them and the audience can see the hammers.',
      fact: 'It usually slides back and forth on rails so you can change how far the music is from you.',
      view: [0, 0.4, 1],
    },
    {
      id: 'pedals', name: 'Pedals & Lyre',
      what: 'Three brass pedals mounted in a wooden frame called the lyre.',
      why: 'Right: sustain (lifts all dampers). Left: una corda (shifts the action so the hammers strike fewer strings, for a softer, gentler tone). Middle: sostenuto (sustains only the notes already being held down).',
      fact: 'The lyre is named for its shape on older pianos, which looked like the ancient Greek harp.',
      view: [0.3, 0.2, 1],
    },
    {
      id: 'legs', name: 'Legs & Casters',
      what: 'Three sturdy legs, each ending in a brass caster wheel.',
      why: 'They hold up the roughly 400–500 kg instrument at a comfortable playing height and let it be rolled across a stage.',
      fact: 'Movers usually take the legs off and carry a grand on its straight side, strapped to a padded board called a “piano skid”.',
      view: [0.6, 0.1, 1],
    },
  ],

  build() {
    const g = new THREE.Group();

    const lacquer = pmat(0x0b0b0d, { roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 });
    const spruce = mat(0xdcb57c, { roughness: 0.6 });
    const bridgeWood = mat(0xa9744a, { roughness: 0.5 });
    const gold = pmat(0xc9a244, { metalness: 0.85, roughness: 0.35, clearcoat: 0.4 });
    const steel = mat(0xd4d4d4, { metalness: 1, roughness: 0.25 });
    const copper = mat(0xb8743a, { metalness: 1, roughness: 0.3 });
    const nickel = mat(0xdedede, { metalness: 1, roughness: 0.2 });
    const ivory = mat(0xf8f6ef, { roughness: 0.25 });
    const ebony = pmat(0x111113, { roughness: 0.3, clearcoat: 0.6 });
    const felt = mat(0xefe7d3, { roughness: 1 });
    const darkFelt = mat(0x2d2d30, { roughness: 1 });
    const pale = mat(0xc8a274, { roughness: 0.6 });
    const brass = mat(0xd9b04f, { metalness: 1, roughness: 0.2 });
    const rubber = mat(0x1b1b1b, { roughness: 0.8 });
    const redFelt = mat(0x7a1b1b, { roughness: 1 });

    const { pts: outer, curvePts } = makeOutline();
    const topV = makeTopV(curvePts);
    const inner = offsetPolygon(outer, RIM_T);

    // ----- Rim + case bottom -----
    const rimShape = new THREE.Shape(outer);
    rimShape.holes.push(new THREE.Path(inner));
    addPart(g, 'rim', planMesh(new THREE.ExtrudeGeometry(rimShape, { depth: RIM_H, bevelEnabled: false }), lacquer, RIM_Y));
    addPart(g, 'rim', planMesh(new THREE.ExtrudeGeometry(new THREE.Shape(outer), { depth: 0.03, bevelEnabled: false }), lacquer, RIM_Y - 0.03));
    // Keybed, key slip and cheek blocks
    const keybed = new THREE.Mesh(new THREE.BoxGeometry(2 * W, 0.035, 0.18), lacquer);
    keybed.position.set(0, 0.655, 0.09);
    addPart(g, 'rim', keybed);
    const slip = new THREE.Mesh(new THREE.BoxGeometry(2 * W, 0.045, 0.012), lacquer);
    slip.position.set(0, 0.672, 0.176);
    addPart(g, 'rim', slip);
    [-1, 1].forEach((s) => {
      const cheek = new THREE.Mesh(new THREE.BoxGeometry(W - 0.612, 0.085, 0.18), lacquer);
      cheek.position.set(s * (0.612 + (W - 0.612) / 2), 0.68, 0.09);
      addPart(g, 'rim', cheek);
    });

    // ----- Soundboard & bridge -----
    addPart(g, 'soundboard', planMesh(new THREE.ShapeGeometry(new THREE.Shape(inner)), spruce, SOUNDBOARD_Y));
    const vBridge = (u) => topV(u) - 0.2;
    const vHitch = (u) => topV(u) - 0.095;
    const bridgePts = [];
    for (let i = 0; i <= 30; i++) {
      const u = -STRING_U - 0.01 + (i / 30) * (2 * STRING_U + 0.02);
      bridgePts.push(v3(u, 0, -vBridge(u)));
    }
    const bridge = tube(bridgePts, 0.01, bridgeWood, { segments: 120, radial: 8 });
    bridge.scale.y = 2.2;
    bridge.position.y = SOUNDBOARD_Y + 0.022;
    addPart(g, 'soundboard', bridge);

    // ----- Cast-iron plate -----
    const plateOuter = offsetPolygon(outer, RIM_T + 0.002);
    const plateShape = new THREE.Shape(plateOuter);
    const gap = new THREE.Path([v2(-0.62, 0.2), v2(0.62, 0.2), v2(0.62, 0.36), v2(-0.62, 0.36)]);
    const opening = new THREE.Path(offsetPolygon(outer, 0.105).map((p) => v2(p.x, Math.max(p.y, 0.42))));
    plateShape.holes.push(gap, opening);
    addPart(g, 'plate', planMesh(new THREE.ExtrudeGeometry(plateShape, { depth: 0.015, bevelEnabled: false }), gold, PLATE_Y));
    // a few raised struts for character
    [[-0.3, 0.42, -0.42, 1.55], [0.05, 0.42, -0.05, 1.5], [0.35, 0.42, 0.3, 1.0]].forEach(([u1, v1, u2, v2_]) => {
      addPart(g, 'plate', cylinderBetween(v3(u1, PLATE_Y + 0.008, -v1), v3(u2, PLATE_Y + 0.008, -v2_), 0.012, gold, 10));
    });

    // ----- Strings, tuning pins -----
    const steelSegs = [];
    const copperSegs = [];
    const pinSegs = [];
    for (let i = 0; i < N_STRINGS; i++) {
      const u = -STRING_U + (i / (N_STRINGS - 1)) * 2 * STRING_U;
      const vPin = i % 2 ? 0.085 : 0.125;
      const bass = u < -0.28;
      const r = bass ? 0.0016 - (u + STRING_U) * 0.002 : 0.00075 - (u + 0.28) * 0.0003;
      const arr = bass ? copperSegs : steelSegs;
      const pin = v3(u, STRING_Y, -vPin);
      const br = v3(u, STRING_Y, -vBridge(u));
      const hitch = v3(u, STRING_Y - 0.012, -vHitch(u));
      arr.push({ a: pin, b: br, r }, { a: br, b: hitch, r });
      pinSegs.push({ a: v3(u, PLATE_Y + 0.012, -vPin), b: v3(u, STRING_Y + 0.008, -vPin), r: 0.0035 });
    }
    addPart(g, 'strings', instancedCylinders(steelSegs, steel));
    addPart(g, 'strings', instancedCylinders(copperSegs, copper));
    addPart(g, 'pins', instancedCylinders(pinSegs, nickel, 8));
    const pinblockFelt = new THREE.Mesh(new THREE.BoxGeometry(2 * STRING_U + 0.06, 0.004, 0.012), redFelt);
    pinblockFelt.position.set(0, PLATE_Y + 0.016, -0.17);
    addPart(g, 'pins', pinblockFelt);

    // ----- Hammers & dampers -----
    const hammerHeads = [];
    const hammerMolds = [];
    const shanks = [];
    const damperBlocks = [];
    const damperFelts = [];
    const N_ACTION = 60;
    for (let i = 0; i < N_ACTION; i++) {
      const u = -STRING_U + (i / (N_ACTION - 1)) * 2 * STRING_U;
      const vH = 0.25;
      hammerHeads.push({ pos: v3(u, STRING_Y - 0.016, -vH), size: [0.014, 0.02, 0.028] });
      hammerMolds.push({ pos: v3(u, STRING_Y - 0.032, -vH), size: [0.012, 0.014, 0.02] });
      shanks.push({ a: v3(u, STRING_Y - 0.04, -vH), b: v3(u, STRING_Y - 0.052, -0.21), r: 0.0025 });
      if (u < 0.3) {
        damperBlocks.push({ pos: v3(u, STRING_Y + 0.03, -0.31), size: [0.016, 0.035, 0.04] });
        damperFelts.push({ pos: v3(u, STRING_Y + 0.008, -0.31), size: [0.016, 0.012, 0.04] });
      }
    }
    addPart(g, 'hammers', instancedBoxes(hammerHeads, felt));
    addPart(g, 'hammers', instancedBoxes(hammerMolds, pale));
    addPart(g, 'hammers', instancedCylinders(shanks, pale));
    addPart(g, 'dampers', instancedBoxes(damperBlocks, pale));
    addPart(g, 'dampers', instancedBoxes(damperFelts, darkFelt));

    // ----- Keys (A0..C8) -----
    const whiteW = 1.222 / 52;
    const whites = [];
    const blacks = [];
    let w = 0;
    for (let midi = 21; midi <= 108; midi++) {
      const isBlack = [1, 3, 6, 8, 10].includes(midi % 12);
      if (isBlack) {
        const x = -0.611 + w * whiteW;
        blacks.push({ pos: v3(x, KEY_TOP + 0.006, 0.05), size: [0.0115, 0.013, 0.095] });
      } else {
        const x = -0.611 + (w + 0.5) * whiteW;
        whites.push({ pos: v3(x, KEY_TOP - 0.011, 0.085), size: [whiteW - 0.0012, 0.022, 0.15] });
        w++;
      }
    }
    addPart(g, 'keys', instancedBoxes(whites, ivory));
    addPart(g, 'keys', instancedBoxes(blacks, ebony));

    // ----- Music desk -----
    const desk = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.27, 0.014), lacquer);
    desk.position.set(0, RIM_Y + RIM_H + 0.13, -0.17);
    desk.rotation.x = -0.25;
    addPart(g, 'musicdesk', desk);
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.018, 0.05), lacquer);
    ledge.position.set(0, RIM_Y + RIM_H + 0.005, -0.14);
    addPart(g, 'musicdesk', ledge);
    [-1, 1].forEach((s) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.3), lacquer);
      rail.position.set(s * 0.36, RIM_Y + RIM_H - 0.005, -0.17);
      addPart(g, 'musicdesk', rail);
    });

    // ----- Lid on a hinge along the straight (bass) side -----
    const lidAngle = 0.62;
    const pivot = new THREE.Group();
    pivot.position.set(-W, RIM_Y + RIM_H, 0);
    pivot.rotation.z = lidAngle;
    g.add(pivot);
    const lid = planMesh(new THREE.ExtrudeGeometry(new THREE.Shape(outer), { depth: 0.02, bevelEnabled: false }), lacquer, 0);
    lid.position.x = W;
    addPart(pivot, 'lid', lid);
    [0.4, 1.3].forEach((v) => {
      addPart(pivot, 'lid', cylinderBetween(v3(0, 0.005, -v), v3(0, 0.005, -v - 0.08), 0.008, brass, 12)); // hinges
    });
    const propU = 0.5;
    const propV = 0.8;
    const lidLocal = propU + W;
    const propTop = v3(-W + lidLocal * Math.cos(lidAngle), RIM_Y + RIM_H + lidLocal * Math.sin(lidAngle), -propV);
    addPart(g, 'lid', cylinderBetween(v3(propU, RIM_Y + RIM_H, -propV), propTop, 0.011, lacquer, 12));

    // ----- Legs -----
    [[-0.6, 0.12], [0.6, 0.12], [-0.45, 1.55]].forEach(([u, v]) => {
      const z = -v;
      addPart(g, 'legs', cylinderBetween(v3(u, 0.075, z), v3(u, RIM_Y - 0.04, z), 0.035, lacquer, 20, 0.05));
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.05, 0.13), lacquer);
      block.position.set(u, RIM_Y - 0.055, z);
      addPart(g, 'legs', block);
      addPart(g, 'legs', cylinderBetween(v3(u, 0.055, z), v3(u, 0.085, z), 0.037, brass, 20));
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 20), brass);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(u, 0.028, z);
      addPart(g, 'legs', wheel);
      const fork = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.02), brass);
      fork.position.set(u, 0.05, z);
      addPart(g, 'legs', fork);
    });

    // ----- Lyre & pedals -----
    const lyreZ = -0.26;
    [-1, 1].forEach((s) => {
      addPart(g, 'pedals', cylinderBetween(v3(s * 0.08, 0.1, lyreZ), v3(s * 0.11, RIM_Y - 0.03, lyreZ), 0.014, lacquer, 12));
    });
    const pedalBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.14), lacquer);
    pedalBox.position.set(0, 0.075, lyreZ);
    addPart(g, 'pedals', pedalBox);
    [-0.07, 0, 0.07].forEach((x) => {
      const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.012, 0.13), brass);
      pedal.position.set(x, 0.065, lyreZ + 0.11);
      pedal.rotation.x = 0.08;
      addPart(g, 'pedals', pedal);
    });
    addPart(g, 'pedals', cylinderBetween(v3(0, 0.02, lyreZ - 0.04), v3(0, 0.04, lyreZ - 0.04), 0.03, rubber, 16)); // floor stop

    return g;
  },
};

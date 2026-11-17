// Timpani (pedal kettledrum) and concert bass drum on a tilting stand.
import * as THREE from 'three';
import { addPart, v3, cylinderBetween, roundedBox, lathe } from '../lib/helpers.js';
import { wood, metal, felt, rubber, calfskin, dark } from '../lib/materials.js';

const BOTH = ['orchestra', 'wind'];
const TAU = Math.PI * 2;

function mallet(head, handleEnd, headR, headMat, shaftMat, shaftR, squash = 1) {
  const m = new THREE.Group();
  const dir = new THREE.Vector3().subVectors(handleEnd, head).normalize();
  m.add(cylinderBetween(head.clone().addScaledVector(dir, headR * 0.6), handleEnd, shaftR, shaftMat, 12));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(headR, 28, 18), headMat);
  ball.position.copy(head);
  ball.scale.set(1, squash, 1);
  ball.quaternion.setFromUnitVectors(v3(0, 1, 0), dir);
  m.add(ball);
  return m;
}

function caster(steel, tyre) {
  const c = new THREE.Group();
  const fork = roundedBox(0.03, 0.045, 0.03, 0.006, steel);
  fork.position.y = 0.06;
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.026, 24), tyre);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(0, 0.04, 0.012);
  c.add(fork, wheel);
  return c;
}

// ============================================================================
// Timpani
// ============================================================================
const TR = 0.37;       // 29-inch drum
const RIM = 0.8;       // height of the bowl's rim
const DEPTH = 0.47;
const N_RODS = 8;
const bowlR = (y) => {
  const s = THREE.MathUtils.clamp(1 - (RIM - y) / DEPTH, 0, 1);
  return TR * Math.sqrt(1 - Math.pow(1 - s, 2.2));
};

export const timpani = {
  id: 'timpani', name: 'Timpani', section: 'percussion', ensembles: BOTH,
  range: 'F2 – C3 on this 29″ drum (about D2 – A3 across a set of four)', size: '29″ (74 cm) head',
  blurb: 'Kettledrums: a copper bowl with a head stretched over the top. Unlike most drums, timpani play real notes, and a pedal retunes the drum while it is being played. Orchestras usually have a set of four, from about 81 cm down to 58 cm across.',
  defaultView: [0.35, 0.6, 1],
  parts: [
    { id: 'head', name: 'Head', view: [0.1, 1, 0.45],
      what: 'The calfskin (or plastic) membrane stretched over the bowl.',
      why: 'Its tension sets the pitch. Players strike a few centimetres in from the edge: the centre gives only a dead thud.',
      fact: 'Calfskin heads react to humidity, so timpanists retune all evening. Many orchestras still prefer calf for its warmth.' },
    { id: 'bowl', name: 'Copper Bowl', view: [0.4, 0.15, 1],
      what: 'The large hammered-copper kettle that gives the drum its old name.',
      why: 'The air trapped in the bowl pushes back on the head and shifts its overtones into nearly harmonic ratios. That is what turns a thud into a clear, singable note.',
      fact: 'A small hole at the bottom of the bowl lets air escape so the head can move freely.' },
    { id: 'counterhoop', name: 'Counterhoop', view: [0.5, 0.6, 0.8],
      what: 'The steel ring that presses down on the edge of the head.',
      why: 'The tension rods pull it down evenly, stretching the head over the rim of the bowl.',
      fact: 'If the hoop pulls harder on one side, the drum sounds “false”, with a wobbling, unclear pitch.' },
    { id: 'rods', name: 'Tension Rods & Fine Tuner', view: [-0.5, 0.5, 1],
      what: 'Eight threaded rods around the hoop, and a crank handle on one of them for small adjustments.',
      why: 'The rods set the head’s tension evenly all round. The fine tuner lets the player nudge the pitch a tiny amount during a performance.',
      fact: 'Before pedals were invented, changing a note meant turning every rod by hand, which took precious time.' },
    { id: 'pedal', name: 'Pedal', view: [0.6, 0.35, 1], ghost: ['mallets'],
      what: 'The foot pedal at the base, linked to every tension rod at once.',
      why: 'Pressing the toe down tightens the head and raises the pitch; letting it up lowers it. A balancing spring keeps the pedal wherever the foot leaves it.',
      fact: 'Pedals made timpani glissandos possible. Bartók wrote famous ones in his Music for Strings, Percussion and Celesta (1936).' },
    { id: 'gauge', name: 'Tuning Gauge', view: [0.3, 0.45, 1],
      what: 'A pointer moving along a curved scale above the rim.',
      why: 'It shows where each note sits as the pedal moves, so the player can retune quickly in the middle of a piece.',
      fact: 'Timpanists still check by ear, often by humming a note close to the head and listening for it to ring back.' },
    { id: 'frame', name: 'Struts, Base & Casters', view: [1, 0.15, 0.5],
      what: 'The tubular struts that hold the bowl, the base, and three wheels.',
      why: 'They support the bowl without touching the head and carry the pedal’s motion up to the rods.',
      fact: 'In America and Britain the lowest drum usually sits on the player’s left; in Germany and Austria it is on the right.' },
    { id: 'mallets', name: 'Felt Mallets', view: [0.2, 0.9, 1],
      what: 'Wooden or bamboo shafts with felt-covered heads.',
      why: 'Hard mallets give clear, punchy rhythms; soft ones give a smooth roll. Timpanists switch mallets often, even within one piece.',
      fact: 'Many timpanists make or re-cover their own mallets to get exactly the sound they want.' },
  ],
  build() {
    const g = new THREE.Group();
    const copper = metal('copper', { side: THREE.DoubleSide, scale: 3 });
    const chrome = metal('chrome');
    const steel = metal('darkSteel');
    const brass = metal('brass');
    const tyre = rubber(0x262626);

    // ----- Bowl -----
    const prof = [];
    for (let i = 0; i <= 40; i++) {
      const s = i / 40;
      const y = RIM - DEPTH * (1 - s);
      prof.push([Math.max(0.0005, bowlR(y)), y]);
    }
    addPart(g, 'bowl', lathe(prof, copper, 96));
    const edge = new THREE.Mesh(new THREE.TorusGeometry(TR, 0.007, 12, 120), copper);
    edge.rotation.x = Math.PI / 2;
    edge.position.y = RIM;
    addPart(g, 'bowl', edge);
    const vent = new THREE.Mesh(new THREE.CircleGeometry(0.018, 24), dark());
    vent.rotation.x = Math.PI / 2;
    vent.position.y = RIM - DEPTH - 0.002;
    addPart(g, 'bowl', vent);

    // ----- Head (with its collar wrapping over the rim) -----
    const skin = calfskin();
    const head = new THREE.Mesh(new THREE.CylinderGeometry(TR + 0.012, TR + 0.012, 0.002, 120), skin);
    head.position.y = RIM + 0.008;
    addPart(g, 'head', head);
    const collarMat = skin.clone();
    collarMat.side = THREE.DoubleSide;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(TR + 0.013, TR + 0.016, 0.03, 120, 1, true), collarMat);
    collar.position.y = RIM - 0.006;
    addPart(g, 'head', collar);

    // ----- Counterhoop -----
    const hoopMat = metal('chrome', { side: THREE.DoubleSide });
    const hoop = new THREE.Mesh(new THREE.CylinderGeometry(TR + 0.024, TR + 0.024, 0.034, 120, 1, true), hoopMat);
    hoop.position.y = RIM - 0.004;
    addPart(g, 'counterhoop', hoop);
    const roll = new THREE.Mesh(new THREE.TorusGeometry(TR + 0.022, 0.005, 10, 120), chrome);
    roll.rotation.x = Math.PI / 2;
    roll.position.y = RIM + 0.013;
    addPart(g, 'counterhoop', roll);

    // ----- Tension rods, ears, lugs and T-handles -----
    const rodR = TR + 0.048;
    const lugY = RIM - 0.17;
    for (let i = 0; i < N_RODS; i++) {
      const a = ((i + 0.5) / N_RODS) * TAU;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const at = (r, y) => v3(c * r, y, s * r);
      const ear = roundedBox(0.03, 0.022, 0.028, 0.006, chrome);
      ear.position.copy(at(TR + 0.036, RIM + 0.004));
      ear.rotation.y = -a;
      addPart(g, 'counterhoop', ear);
      addPart(g, 'rods', cylinderBetween(at(rodR, RIM + 0.03), at(rodR, lugY - 0.01), 0.0045, steel, 10));
      const tan = v3(-s, 0, c).multiplyScalar(0.026);
      const top = at(rodR, RIM + 0.034);
      addPart(g, 'rods', cylinderBetween(top.clone().sub(tan), top.clone().add(tan), 0.0055, chrome, 10));
      const lug = roundedBox(0.05, 0.04, 0.03, 0.008, chrome);
      lug.position.copy(at((bowlR(lugY) + rodR) / 2, lugY));
      lug.rotation.y = -a;
      addPart(g, 'rods', lug);
    }
    // fine tuner: a crank on the rod nearest the player's left hand
    {
      const ra = (2.5 / N_RODS) * TAU; // the rod in front of the player's left hand (−x, +z)
      const p = v3(Math.cos(ra) * rodR, RIM - 0.07, Math.sin(ra) * rodR);
      const out = v3(Math.cos(ra), 0, Math.sin(ra));
      const box = roundedBox(0.03, 0.05, 0.03, 0.008, chrome);
      box.position.copy(p);
      addPart(g, 'rods', box);
      const arm = p.clone().addScaledVector(out, 0.07);
      addPart(g, 'rods', cylinderBetween(p, arm, 0.005, chrome, 10));
      addPart(g, 'rods', cylinderBetween(arm, arm.clone().add(v3(0, 0.05, 0)), 0.009, tyre, 14));
    }

    // ----- Tuning gauge at the front -----
    {
      const a = Math.PI / 2; // front and centre, between two tension rods
      const gr = TR + 0.075;
      const gy = RIM + 0.05;
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(gr, gr, 0.036, 24, 1, true, Math.PI / 2 - a - 0.22, 0.44),
        metal('brass', { side: THREE.DoubleSide })
      );
      band.position.y = gy;
      addPart(g, 'gauge', band);
      for (let i = 0; i < 6; i++) {
        const aa = a - 0.18 + (i / 5) * 0.36;
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.02, 0.003), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x2f5b8a : 0x9b2b2b, roughness: 0.5 }));
        m.position.set(Math.cos(aa) * (gr + 0.003), gy, Math.sin(aa) * (gr + 0.003));
        m.lookAt(0, gy, 0);
        addPart(g, 'gauge', m);
      }
      const pa = a + 0.04;
      const base = v3(Math.cos(pa) * (gr + 0.008), RIM - 0.12, Math.sin(pa) * (gr + 0.008));
      const tip = v3(Math.cos(pa) * (gr + 0.008), gy + 0.02, Math.sin(pa) * (gr + 0.008));
      addPart(g, 'gauge', cylinderBetween(base, tip, 0.0025, brass, 8));
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.016, 10), brass);
      arrow.position.copy(tip).add(v3(0, 0.006, 0));
      addPart(g, 'gauge', arrow);
      [a - 0.2, a + 0.2].forEach((aa) => {
        addPart(g, 'gauge', cylinderBetween(
          v3(Math.cos(aa) * (TR + 0.03), RIM + 0.01, Math.sin(aa) * (TR + 0.03)),
          v3(Math.cos(aa) * gr, gy - 0.015, Math.sin(aa) * gr), 0.003, brass, 8));
      });
    }

    // ----- Frame: base, legs, casters and struts -----
    const hubY = 0.14;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.06, 24), steel);
    hub.position.y = hubY;
    addPart(g, 'frame', hub);
    [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6].forEach((a) => {
      const c = Math.cos(a);
      const s = Math.sin(a);
      addPart(g, 'frame', cylinderBetween(v3(c * 0.04, hubY, s * 0.04), v3(c * 0.38, 0.1, s * 0.38), 0.016, steel, 14));
      const cs = caster(steel, tyre);
      cs.position.set(c * 0.38, 0, s * 0.38);
      addPart(g, 'frame', cs);
      // strut up to a bracket on the bowl
      const sy = RIM - 0.25;
      const top = v3(c * (bowlR(sy) + 0.02), sy, s * (bowlR(sy) + 0.02));
      addPart(g, 'frame', cylinderBetween(v3(c * 0.3, 0.11, s * 0.3), top, 0.013, chrome, 14));
      const bracket = roundedBox(0.05, 0.06, 0.03, 0.01, chrome);
      bracket.position.copy(v3(c * (bowlR(sy) + 0.008), sy, s * (bowlR(sy) + 0.008)));
      bracket.rotation.y = -a;
      addPart(g, 'frame', bracket);
    });

    // ----- Pedal -----
    const heel = v3(0, 0.085, 0.27);
    const toe = v3(0, 0.18, 0.52);
    const d = new THREE.Vector3().subVectors(toe, heel);
    const plate = roundedBox(0.12, 0.018, d.length(), 0.006, steel);
    plate.position.copy(heel).addScaledVector(d, 0.5);
    plate.rotation.x = -Math.atan2(d.y, d.z);
    addPart(g, 'pedal', plate);
    const pad = roundedBox(0.1, 0.008, d.length() * 0.7, 0.004, tyre);
    pad.position.copy(heel).addScaledVector(d, 0.6).add(v3(0, 0.012, 0));
    pad.rotation.x = plate.rotation.x;
    addPart(g, 'pedal', pad);
    addPart(g, 'pedal', cylinderBetween(v3(0, hubY, 0.03), heel, 0.012, chrome, 12));
    const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.11, 18), steel);
    spring.position.set(0, 0.16, 0.2);
    spring.rotation.x = 0.5;
    addPart(g, 'pedal', spring);
    addPart(g, 'pedal', cylinderBetween(v3(0, hubY, 0), v3(0, RIM - DEPTH + 0.01, 0), 0.01, chrome, 12)); // pull rod to the bowl

    // ----- Mallets resting on the head -----
    const feltHead = felt(0xf1e9d8);
    const shaft = wood('mapleNatural', { scale: 12, clearcoat: 0.3 });
    [[-0.07, -0.21], [0.05, 0.19]].forEach(([x, ex]) => {
      const head = v3(x, RIM + 0.009 + 0.019, 0.2);
      addPart(g, 'mallets', mallet(head, v3(ex, RIM + 0.08, 0.6), 0.019, feltHead, shaft, 0.0055, 0.85));
    });
    return g;
  },
};

// ============================================================================
// Concert bass drum
// ============================================================================
const BR = 0.457;      // 36-inch heads
const BD = 0.46;       // 18 inches deep
const BCY = 0.8;
const N_BRODS = 16;
const TILT = 0.22;

export const bassDrum = {
  id: 'bassdrum', name: 'Bass Drum', section: 'percussion', ensembles: BOTH,
  range: 'Unpitched (very low)', size: '36″ × 18″ drum',
  blurb: 'The biggest drum in the orchestra: two huge heads on a deep wooden shell, hung in a frame that tilts. It can whisper like distant thunder, roll like an earthquake or land a single stroke like a cannon.',
  defaultView: [1, 0.35, 0.65],
  parts: [
    { id: 'batter', name: 'Batter Head', view: [1, 0.15, 0.2],
      what: 'The head the player strikes, usually calfskin or a thick synthetic film.',
      why: 'A stroke a little off-centre gives the deepest, longest boom; the centre gives a short, dry thud.',
      fact: 'Bass drums are tuned low and without a clear pitch, so the sound is felt in the chest as much as heard.' },
    { id: 'reso', name: 'Resonant Head', view: [-1, 0.15, 0.3],
      what: 'The second head, on the far side.',
      why: 'It vibrates in sympathy with the batter head. Tuning it slightly differently from the batter blurs the pitch and makes the boom richer.',
      fact: 'Players can damp either head with a hand or a cloth to shorten the sound.' },
    { id: 'shell', name: 'Shell', view: [0.2, 0.4, 1],
      what: 'The deep, round wooden body between the two heads.',
      why: 'The large volume of air inside is what makes the bass drum so powerful and low.',
      fact: 'Old military bass drums were even deeper than they were wide, to be heard over a marching column.' },
    { id: 'hoops', name: 'Counterhoops', view: [0.9, 0.5, 0.6],
      what: 'The wooden rings at each end that hold the heads on.',
      why: 'The rods pull the hoops toward the shell, stretching each head evenly over the shell’s edge.',
      fact: 'Wooden hoops are traditional on concert bass drums; metal ones would add a clanging ring.' },
    { id: 'rods', name: 'T-Rods & Lugs', view: [0.7, 0.6, 0.8],
      what: 'Sixteen rods per side, each with a T-shaped handle, screwing into lugs on the shell.',
      why: 'The T-handles let the player tune by hand, without a drum key, moving around the drum a little at a time to keep the tension even.',
      fact: 'Concert drums are tuned quite slack, much looser than a snare drum, to get a big, loose boom.' },
    { id: 'stand', name: 'Tilting Stand & Suspension', view: [0.3, 0.3, 1],
      what: 'A ring cradling the drum on elastic straps, pivoting between two posts on a wheeled base.',
      why: 'The suspension lets the drum ring freely, and the pivot sets the heads anywhere from upright to flat.',
      fact: 'Tilted nearly flat, the drum is easier to roll on with two mallets, and objects can even be placed on the head for special effects.' },
    { id: 'beater', name: 'Beater', view: [0.6, 0.3, 1],
      what: 'A large mallet with a soft head of lambswool or felt.',
      why: 'The big, soft head draws out the drum’s low boom without a hard click at the start of the note.',
      fact: 'Mahler sometimes asked for a Rute, a bundle of twigs, to be swished across the bass drum instead.' },
  ],
  build() {
    const g = new THREE.Group();
    const shellMat = wood('mahogany', { scale: 2.5, clearcoat: 1, roughness: 0.4, side: THREE.DoubleSide });
    const hoopMat = wood('mapleNatural', { scale: 3, clearcoat: 0.8, roughness: 0.4, side: THREE.DoubleSide });
    const skin = calfskin(0xeee2c6);
    const chrome = metal('chrome');
    const steel = metal('darkSteel');
    const tyre = rubber(0x262626);
    const strapMat = rubber(0x161616);

    // The drum and its suspension ring tilt together on the trunnions.
    const drum = new THREE.Group();
    drum.position.y = BCY;
    drum.rotation.z = TILT;
    g.add(drum);
    const along = (x, r, a) => v3(x, Math.cos(a) * r, Math.sin(a) * r);

    const shell = new THREE.Mesh(new THREE.CylinderGeometry(BR, BR, BD, 120, 1, true), shellMat);
    shell.rotation.z = Math.PI / 2;
    addPart(drum, 'shell', shell);

    [1, -1].forEach((sd) => {
      const head = new THREE.Mesh(new THREE.CylinderGeometry(BR + 0.004, BR + 0.004, 0.003, 120), skin);
      head.rotation.z = Math.PI / 2;
      head.position.x = sd * (BD / 2 + 0.008);
      addPart(drum, sd > 0 ? 'batter' : 'reso', head);

      const hoop = new THREE.Mesh(new THREE.CylinderGeometry(BR + 0.022, BR + 0.022, 0.06, 120, 1, true), hoopMat);
      hoop.rotation.z = Math.PI / 2;
      hoop.position.x = sd * (BD / 2 + 0.014);
      addPart(drum, 'hoops', hoop);
      [0.03, -0.03].forEach((dx) => {
        const lip = new THREE.Mesh(new THREE.TorusGeometry(BR + 0.012, 0.009, 10, 120), hoopMat);
        lip.rotation.y = Math.PI / 2;
        lip.position.x = sd * (BD / 2 + 0.014) + dx;
        addPart(drum, 'hoops', lip);
      });
      const inlay = new THREE.Mesh(new THREE.TorusGeometry(BR + 0.0225, 0.0035, 8, 120), metal('gold'));
      inlay.rotation.y = Math.PI / 2;
      inlay.position.x = sd * (BD / 2 + 0.014);
      addPart(drum, 'hoops', inlay);

      for (let i = 0; i < N_BRODS; i++) {
        const a = ((i + 0.5) / N_BRODS) * TAU;
        const rr = BR + 0.04;
        const outer = along(sd * (BD / 2 + 0.06), rr, a);
        const inner = along(sd * (BD / 2 - 0.12), rr, a);
        addPart(drum, 'rods', cylinderBetween(outer, inner, 0.0045, steel, 8));
        const tan = v3(0, -Math.sin(a), Math.cos(a)).multiplyScalar(0.028);
        addPart(drum, 'rods', cylinderBetween(outer.clone().sub(tan), outer.clone().add(tan), 0.006, chrome, 10));
        const claw = roundedBox(0.03, 0.03, 0.022, 0.006, chrome);
        claw.position.copy(along(sd * (BD / 2 + 0.036), BR + 0.034, a));
        claw.rotation.x = a;
        addPart(drum, 'rods', claw);
        const lug = roundedBox(0.06, 0.03, 0.026, 0.009, chrome);
        lug.position.copy(along(sd * (BD / 2 - 0.13), BR + 0.02, a));
        lug.rotation.x = a;
        addPart(drum, 'rods', lug);
      }
    });

    // ----- Suspension ring and straps (tilt with the drum) -----
    const ringR = BR + 0.09;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.014, 14, 120), steel);
    ring.rotation.y = Math.PI / 2;
    addPart(drum, 'stand', ring);
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) / 8) * TAU;
      addPart(drum, 'stand', cylinderBetween(along(0, BR + 0.004, a), along(0, ringR - 0.01, a), 0.012, strapMat, 10));
    }

    // ----- Posts, trunnions and wheeled base -----
    const postZ = ringR + 0.045;
    [1, -1].forEach((sz) => {
      addPart(g, 'stand', cylinderBetween(v3(0, 0.1, sz * postZ), v3(0, BCY + 0.03, sz * postZ), 0.017, chrome, 16));
      addPart(g, 'stand', cylinderBetween(v3(0, BCY, sz * (ringR - 0.005)), v3(0, BCY, sz * (postZ + 0.05)), 0.012, steel, 12));
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.025, 20), tyre);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(0, BCY, sz * (postZ + 0.06));
      addPart(g, 'stand', knob);
      addPart(g, 'stand', cylinderBetween(v3(-0.36, 0.1, sz * postZ), v3(0.36, 0.1, sz * postZ), 0.016, steel, 14));
      [-0.36, 0.36].forEach((x) => {
        const c = caster(steel, tyre);
        c.position.set(x, 0, sz * postZ);
        addPart(g, 'stand', c);
      });
    });
    addPart(g, 'stand', cylinderBetween(v3(0, 0.12, -postZ), v3(0, 0.12, postZ), 0.016, steel, 14));

    // ----- Beater, held upright in a clip on the front post -----
    const bx = 0.075;
    const bz = postZ + 0.01;
    const shaft = wood('mapleNatural', { scale: 12, clearcoat: 0.3 });
    const wool = felt(0xf4eee2);
    addPart(g, 'beater', mallet(v3(bx, BCY - 0.02, bz), v3(bx, 0.36, bz), 0.048, wool, shaft, 0.008, 1.15));
    const clip = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 8, 20), chrome);
    clip.rotation.x = Math.PI / 2;
    clip.position.set(bx, 0.55, bz);
    addPart(g, 'beater', clip);
    addPart(g, 'beater', cylinderBetween(v3(bx - 0.014, 0.55, bz), v3(0.017, 0.55, postZ), 0.004, chrome, 8));
    return g;
  },
};

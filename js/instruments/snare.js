import * as THREE from 'three';
import { addPart, v3, cylinderBetween, roundedBox } from '../lib/helpers.js';
import { metal, wood, coatedHead, rubber as rubberMat, dark, matte } from '../lib/materials.js';

const R = 0.1778;        // 14" diameter
const D = 0.14;          // 5.5" deep
const CY = 0.62;         // drum centre height
const TOP = CY + D / 2;
const BOT = CY - D / 2;
const N_LUGS = 10;

export default {
  id: 'snare',
  name: 'Snare Drum',
  section: 'percussion',
  ensembles: ['orchestra', 'wind'],
  range: 'Unpitched', size: '14″ × 5½″ drum',
  blurb:
    'A shallow drum with two heads and a set of springy metal wires stretched across the bottom. The wires buzz against the lower head every time the drum is struck. That crisp “crack” drives marching bands, orchestras and almost every rock and pop beat.',
  defaultView: [0.5, 0.75, 1],
  parts: [
    {
      id: 'batter', name: 'Batter Head',
      what: 'The top drumhead that gets hit. It is a thin sheet of Mylar plastic, usually with a white, slightly rough coating.',
      why: 'It is where the sound starts. Its tension sets the pitch and how much the stick bounces back. The coating gives a warmer tone and a rough surface for brushes to swish across.',
      fact: 'Drumheads were made of calfskin until the 1950s, when plastic heads arrived. Plastic did not sag or stretch in damp weather.',
      view: [0.2, 1, 0.5],
    },
    {
      id: 'shell', name: 'Shell',
      what: 'The cylinder of wood (often maple plies) or metal that forms the body of the drum.',
      why: 'The shell sets the drum’s basic character: thin wooden shells sound warm, and brass or steel shells sound bright and cutting. Its depth also affects how much body the sound has.',
      fact: 'The edges of the shell where the heads sit are cut to a sharp angle called the “bearing edge”. A tiny flaw there can stop a drum from tuning properly.',
      view: [0.6, 0.2, 1],
    },
    {
      id: 'hoops', name: 'Hoops (Rims)',
      what: 'The chrome rings at top and bottom that clamp each head onto the shell.',
      why: 'Tightening the rods pulls the hoops down, which stretches the heads evenly. Drummers also hit the top hoop on purpose for special sounds.',
      fact: 'A “rimshot” hits the head and the hoop at the same moment, for an extra-loud crack. A “cross-stick” lays the stick across the head and taps the rim for a woody click.',
      view: [0.8, 0.5, 0.6],
    },
    {
      id: 'lugs', name: 'Lugs & Tension Rods',
      what: 'The ten metal housings on the shell and the threaded rods that screw into them from each hoop.',
      why: 'Turning the rods with a drum key tunes the drum. Going around in a star pattern and tightening each rod a little at a time keeps the tension even, so the head sounds clean and in tune with itself.',
      fact: 'Some drummers use a small electronic gauge that measures head tension at each rod, so they can repeat their tuning exactly.',
      view: [1, 0.35, 0.3],
    },
    {
      id: 'reso', name: 'Snare-Side (Resonant) Head',
      what: 'A very thin, nearly see-through head on the bottom of the drum.',
      why: 'When the top head is struck, air pressure inside the drum makes this thin head vibrate. That throws the snare wires against it and creates the buzz.',
      fact: 'Snare-side heads are only about 0.075 mm thick, roughly as thin as a sheet of paper.',
      view: [0.3, -1, 0.6],
      ghost: ['stand'],
    },
    {
      id: 'wires', name: 'Snare Wires',
      what: 'A strip of 20 or so coiled steel wires stretched across the bottom head.',
      why: 'They are what makes a snare a snare. Each time the bottom head moves, the wires rattle against it and add a bright burst of noise to the drum’s note.',
      fact: 'Early military snares used strands of gut instead of wire. Those strands are where the name “snare” comes from (an old word for a cord or trap).',
      view: [0.15, -1, 0.35],
      ghost: ['stand'],
    },
    {
      id: 'strainer', name: 'Strainer (Throw-Off) & Butt Plate',
      what: 'The lever on the side of the shell that holds one end of the wires, with a fixed butt plate holding the other end.',
      why: 'Flipping the lever drops the wires away from the head, so the drum sounds like a deep tom. The knob fine-tunes how tight the wires are, which changes the sound from loose and fat to dry and crisp.',
      fact: 'Drummers often turn the snares off during quiet passages, because nearby instruments can make the wires buzz on their own.',
      view: [1, 0.05, 0.35],
    },
    {
      id: 'vent', name: 'Air Vent & Badge',
      what: 'A small hole in the shell with a metal grommet, next to the maker’s badge.',
      why: 'It lets air escape when the head is struck. That lets the head move more freely and increases sustain. Without a vent the trapped air would choke the drum slightly.',
      fact: 'Badges help collectors date vintage drums. Some 1960s badges were stamped with a serial number.',
      view: [0, 0.2, 1],
    },
    {
      id: 'stand', name: 'Snare Stand',
      what: 'A folding tripod with a three-armed basket that cradles the drum by its bottom hoop.',
      why: 'It holds the drum at a comfortable height and angle while letting it vibrate freely. The rubber-tipped arms only touch the hoop, never the shell.',
      fact: 'In marching bands the snare hangs from a shoulder carrier instead, and is often tilted toward the player’s left hand.',
      view: [1, 0.15, 0.8],
    },
    {
      id: 'sticks', name: 'Drumsticks',
      what: 'A pair of hickory sticks with shaped wooden tips.',
      why: 'The tip shape and the stick’s weight change the sound: round tips sound focused, barrel and teardrop tips sound broader. Hickory is used because it is tough and absorbs shock.',
      fact: 'Stick sizes like 7A, 5A and 2B are a century-old code. The number roughly describes thickness (lower is thicker) and the letter the type of music, for example “B” for band.',
      view: [0.4, 1, 0.8],
    },
  ],

  build() {
    const g = new THREE.Group();

    const lacquer = new THREE.MeshPhysicalMaterial({
      color: 0x8f1a1d, roughness: 0.3, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.04,
      iridescence: 0.25, side: THREE.DoubleSide,
    });
    const chrome = metal('chrome');
    const darkChrome = metal('darkSteel');
    const coated = coatedHead();
    const clear = new THREE.MeshPhysicalMaterial({ color: 0xe9e3d6, roughness: 0.25, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    const wireMat = metal('steel');
    const rubber = rubberMat(0x1d1d1d);
    const hickory = wood('hickory', { scale: 20, clearcoat: 0.3, roughness: 0.5 });
    const black = dark();
    const gold = metal('gold');
    const strap = matte(0x222222);

    // ----- Shell -----
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, D, 72, 1, true), lacquer);
    shell.position.y = CY;
    addPart(g, 'shell', shell);
    const badge = roundedBox(0.035, 0.022, 0.003, 0.0015, gold);
    badge.position.set(0.045, CY, R + 0.001);
    badge.rotation.y = Math.atan2(0.045, R);
    addPart(g, 'vent', badge);

    // Air vent at the front
    const grommet = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0018, 10, 24), chrome);
    grommet.position.set(0, CY + 0.005, R + 0.0015);
    addPart(g, 'vent', grommet);
    const ventHole = new THREE.Mesh(new THREE.CircleGeometry(0.0058, 20), black);
    ventHole.position.set(0, CY + 0.005, R + 0.0008);
    addPart(g, 'vent', ventHole);

    // ----- Heads -----
    const batter = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.002, R + 0.002, 0.002, 72), coated);
    batter.position.y = TOP + 0.002;
    addPart(g, 'batter', batter);
    const reso = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.002, R + 0.002, 0.0015, 72), clear);
    reso.position.y = BOT - 0.002;
    addPart(g, 'reso', reso);

    // ----- Hoops -----
    [TOP + 0.006, BOT - 0.006].forEach((y) => {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.008, R + 0.008, 0.022, 72, 1, true), chrome);
      band.material = chrome.clone();
      band.material.side = THREE.DoubleSide;
      band.position.y = y;
      addPart(g, 'hoops', band);
      [0.011, -0.011].forEach((dy) => {
        const lip = new THREE.Mesh(new THREE.TorusGeometry(R + 0.006, 0.0032, 8, 96), chrome);
        lip.rotation.x = Math.PI / 2;
        lip.position.y = y + dy;
        addPart(g, 'hoops', lip);
      });
    });

    // ----- Lugs & tension rods -----
    for (let i = 0; i < N_LUGS; i++) {
      const a = ((i + 0.5) / N_LUGS) * Math.PI * 2;
      const dir = v3(Math.cos(a), 0, Math.sin(a));
      const lug = roundedBox(0.018, 0.055, 0.016, 0.006, chrome);
      lug.position.copy(dir.clone().multiplyScalar(R + 0.009)).setY(CY);
      lug.rotation.y = -a;
      addPart(g, 'lugs', lug);
      const rp = dir.clone().multiplyScalar(R + 0.013);
      // top rod
      addPart(g, 'lugs', cylinderBetween(v3(rp.x, CY + 0.02, rp.z), v3(rp.x, TOP + 0.02, rp.z), 0.0024, darkChrome, 8));
      addPart(g, 'lugs', cylinderBetween(v3(rp.x, TOP + 0.017, rp.z), v3(rp.x, TOP + 0.026, rp.z), 0.0052, chrome, 6));
      // bottom rod
      addPart(g, 'lugs', cylinderBetween(v3(rp.x, BOT - 0.02, rp.z), v3(rp.x, CY - 0.02, rp.z), 0.0024, darkChrome, 8));
      addPart(g, 'lugs', cylinderBetween(v3(rp.x, BOT - 0.026, rp.z), v3(rp.x, BOT - 0.017, rp.z), 0.0052, chrome, 6));
    }

    // ----- Snare wires underneath -----
    const wy = BOT - 0.0045;
    for (let i = 0; i < 20; i++) {
      const z = -0.045 + (i / 19) * 0.09;
      addPart(g, 'wires', cylinderBetween(v3(-0.135, wy, z), v3(0.135, wy, z), 0.0008, wireMat, 5));
    }
    [-1, 1].forEach((s) => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.002, 0.1), chrome);
      plate.position.set(s * 0.141, wy, 0);
      addPart(g, 'wires', plate);
      const cord = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.0015, 0.02), strap);
      cord.position.set(s * 0.17, wy - 0.001, 0);
      cord.rotation.z = s * 0.15;
      addPart(g, 'wires', cord);
    });

    // ----- Strainer (+x side) and butt plate (-x side) -----
    const strainer = roundedBox(0.022, 0.065, 0.03, 0.005, chrome);
    strainer.position.set(R + 0.012, CY - 0.01, 0);
    addPart(g, 'strainer', strainer);
    const lever = roundedBox(0.008, 0.05, 0.012, 0.003, darkChrome);
    lever.position.set(R + 0.026, CY + 0.005, 0);
    lever.rotation.z = -0.15;
    addPart(g, 'strainer', lever);
    addPart(g, 'strainer', cylinderBetween(v3(R + 0.012, CY + 0.022, 0), v3(R + 0.012, CY + 0.04, 0), 0.007, rubber, 16));
    addPart(g, 'strainer', cylinderBetween(v3(R + 0.012, BOT + 0.005, 0), v3(R + 0.012, BOT - 0.008, 0), 0.003, chrome, 8));
    const butt = roundedBox(0.018, 0.04, 0.026, 0.004, chrome);
    butt.position.set(-(R + 0.01), CY - 0.035, 0);
    addPart(g, 'strainer', butt);

    // ----- Stand -----
    const hubY = 0.2;
    const basketY = BOT - 0.02;
    addPart(g, 'stand', cylinderBetween(v3(0, hubY - 0.04, 0), v3(0, basketY - 0.06, 0), 0.011, chrome, 16));
    addPart(g, 'stand', cylinderBetween(v3(0, hubY + 0.05, 0), v3(0, hubY + 0.1, 0), 0.016, darkChrome, 16)); // height clamp
    const basketHub = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), darkChrome);
    basketHub.position.set(0, basketY - 0.06, 0);
    addPart(g, 'stand', basketHub);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
      const c = Math.cos(a);
      const s = Math.sin(a);
      // tripod leg
      addPart(g, 'stand', cylinderBetween(v3(0, hubY, 0), v3(c * 0.3, 0.012, s * 0.3), 0.009, chrome, 10));
      addPart(g, 'stand', cylinderBetween(v3(0, hubY - 0.03, 0), v3(c * 0.13, 0.09, s * 0.13), 0.005, chrome, 8));
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 8), rubber);
      foot.position.set(c * 0.3, 0.012, s * 0.3);
      foot.scale.y = 0.8;
      addPart(g, 'stand', foot);
      // basket arm
      const ba = a + Math.PI / 3;
      const bc = Math.cos(ba);
      const bs = Math.sin(ba);
      addPart(g, 'stand', cylinderBetween(v3(0, basketY - 0.06, 0), v3(bc * (R - 0.02), basketY - 0.015, bs * (R - 0.02)), 0.006, chrome, 10));
      addPart(g, 'stand', cylinderBetween(v3(bc * (R - 0.02), basketY - 0.015, bs * (R - 0.02)), v3(bc * (R + 0.005), basketY + 0.008, bs * (R + 0.005)), 0.0065, rubber, 10));
    }

    // ----- Sticks resting on the head -----
    const stick = (a, b) => {
      const s = new THREE.Group();
      const dir = new THREE.Vector3().subVectors(b, a);
      const tipStart = a.clone().addScaledVector(dir, 0.82);
      const neck = a.clone().addScaledVector(dir, 0.96);
      s.add(cylinderBetween(a, tipStart, 0.0072, hickory, 14, 0.0068));
      s.add(cylinderBetween(tipStart, neck, 0.0068, hickory, 14, 0.0028));
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 14, 10), hickory);
      tip.position.copy(b);
      tip.scale.set(1, 1.4, 1);
      tip.quaternion.setFromUnitVectors(v3(0, 1, 0), dir.clone().normalize());
      s.add(tip);
      return s;
    };
    // Tips touch the head; the shafts rest on the top hoop.
    addPart(g, 'sticks', stick(v3(0.28, TOP + 0.055, 0.17), v3(-0.07, TOP + 0.009, -0.03)));
    addPart(g, 'sticks', stick(v3(0.3, TOP + 0.066, 0.1), v3(-0.05, TOP + 0.009, -0.11)));

    return g;
  },
};

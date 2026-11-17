import * as THREE from 'three';
import {
  mat, pmat, addPart, v3, cylinderBetween, roundedBox, smoothOutline, mirrorOutline, tube,
} from '../lib/helpers.js';

// Violin stands upright, top faces +Z, the front of the top plate is at z = 0.
const BODY_TOP = 0.178;
const NUT_Y = 0.315;
const BRIDGE_Y = -0.03;

export default {
  id: 'violin',
  name: 'Violin',
  emoji: '🎻',
  family: 'Strings · Bowed',
  blurb:
    'The smallest and highest-pitched member of the violin family. Rosin-coated horsehair grips the string, pulls it sideways and lets it snap back hundreds of times a second. The arched wooden body turns that motion into a singing tone.',
  defaultView: [0.6, 0.25, 1],
  parts: [
    {
      id: 'scroll', name: 'Scroll',
      what: 'The carved spiral at the very top of the violin.',
      why: 'It is mostly decorative. It finishes the pegbox and shows off the maker’s carving skill. Experts often identify a maker by the style of the scroll.',
      fact: 'Some old violins and violas have a carved lion’s or human head instead of a scroll.',
      view: [1, 0.3, 0.4],
    },
    {
      id: 'pegs', name: 'Pegbox & Pegs',
      what: 'A hollow box below the scroll, with four tapered ebony pegs pushed through its sides.',
      why: 'Each string winds around a peg. The pegs are held only by friction in their tapered holes, so tuning means turning and gently pushing at the same moment.',
      fact: 'Pegs have no gears at all. A peg that slips in dry winter weather is the classic violinist’s headache.',
      view: [1, 0.2, 0.8],
    },
    {
      id: 'neck', name: 'Neck',
      what: 'The slender maple arm between the pegbox and the body.',
      why: 'The left hand slides along it to change position. Its gentle backward angle sets how high the strings sit above the body, which affects both playability and how hard the strings press on the bridge.',
      fact: 'Most surviving Stradivari violins were given longer, more steeply angled necks in the 1800s so they could project in bigger concert halls.',
      view: [1, 0, 0.3],
    },
    {
      id: 'fingerboard', name: 'Fingerboard',
      what: 'A long, curved strip of ebony glued on top of the neck, overhanging the body.',
      why: 'Players press the strings onto it to change pitch. It has no frets, so the player must place every note by ear, which also makes sliding effects like glissando and vibrato easy.',
      fact: 'The fingerboard is curved across its width so the bow can reach each string separately.',
      view: [0.3, 0.1, 1],
    },
    {
      id: 'top', name: 'Top Plate (Belly)',
      what: 'The arched spruce front of the body, carved by hand from a solid wedge of wood.',
      why: 'Like a drum skin made of wood, it vibrates and radiates most of the sound. How the arch is shaped and how the thickness is graded across it largely decide the violin’s tone.',
      fact: 'A finished violin top weighs only about 60–70 grams.',
      view: [0, 0.05, 1],
    },
    {
      id: 'fholes', name: 'F-holes',
      what: 'The two elegant “f”-shaped openings cut into the top on either side of the bridge.',
      why: 'They let the body’s air resonate and boost low notes. They also loosen the middle of the top so it can rock freely under the bridge. Through the right f-hole you can glimpse the soundpost, a small dowel wedged between top and back.',
      fact: 'In French the soundpost is called âme, meaning “soul”. Moving it by a millimetre noticeably changes the sound.',
      view: [0.1, 0.25, 1],
    },
    {
      id: 'bridge', name: 'Bridge',
      what: 'A thin, intricately cut piece of maple standing on the top. Only string pressure holds it in place.',
      why: 'It carries the vibration of the strings into the body. The cut-outs are not decoration: they tune the bridge so it acts as a filter that shapes the brightness of the sound.',
      fact: 'A mute is a small clip that pushes onto the bridge. It adds weight there and gives the soft, veiled sound marked con sordino in music.',
      view: [0.5, 0.6, 1],
    },
    {
      id: 'strings', name: 'Strings',
      what: 'Four strings tuned in fifths: G–D–A–E, from lowest to highest.',
      why: 'Bowing or plucking them starts the sound. Each string’s core material (gut, synthetic or steel) changes how warm or brilliant it sounds.',
      fact: 'The open A is often tuned to 440 Hz, but many orchestras tune slightly higher, at 442 or even 443 Hz.',
      view: [0.4, 0.25, 1],
    },
    {
      id: 'tailpiece', name: 'Tailpiece & Fine Tuner',
      what: 'The black anchor at the bottom end where the strings attach, with a small metal fine tuner for the E string.',
      why: 'It holds the strings’ far ends. A loop of cord ties it to the end button, so it floats free and does not dampen the body. The fine tuner lets you make tiny pitch changes on the thin steel E string.',
      fact: 'Changing the tailpiece’s weight or length is a real tool luthiers use to tweak a violin’s sound.',
      view: [0.3, 0.6, 1],
    },
    {
      id: 'chinrest', name: 'Chinrest',
      what: 'A curved ebony cup clamped to the lower edge of the body.',
      why: 'The player holds the violin with their jaw here, which frees the left hand to move. It also keeps the player’s face from pressing on and muffling the top.',
      fact: 'The chinrest was invented around 1820 by the composer and violinist Louis Spohr. Before then, violinists held the instrument against the collarbone or chest.',
      view: [-0.6, 0.4, 1],
    },
    {
      id: 'ribs', name: 'Ribs & Back',
      what: 'The thin bent maple sides (ribs) and the arched, often beautifully flamed, maple back.',
      why: 'They form the resonating box with the top. The hard maple back reflects sound and adds its own resonances. The inward “C-bouts” at the waist give the bow room to reach the outer strings.',
      fact: 'The shimmering stripes on many violin backs are called “flame”. They come from maple cut so its wavy grain catches the light.',
      view: [1, 0.25, -1],
    },
    {
      id: 'bow', name: 'Bow',
      what: 'A pernambuco wood stick strung with about 150–200 horsehairs, with a sliding frog at the handle end.',
      why: 'Rosin on the hair grabs the string, pulls it sideways, then lets it slip back, over and over (the “stick-slip” motion). This sustains the note for as long as the bow keeps moving. The stick curves inward (the “camber”) to give it spring.',
      fact: 'The modern bow shape was perfected around 1785 by the Parisian maker François Tourte. It has hardly changed since.',
      view: [1, 0.1, 0.6],
    },
  ],

  build() {
    const g = new THREE.Group();

    const varnish = pmat(0x74290b, { roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15 });
    const varnishBack = pmat(0x652309, { roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15 });
    const ebony = mat(0x15110f, { roughness: 0.35 });
    const maple = mat(0xc99a62, { roughness: 0.55 });   // unvarnished neck
    const bridgeMaple = mat(0xe2c79a, { roughness: 0.6 });
    const dark = mat(0x050302, { roughness: 1 });
    const steel = mat(0xd8d8d8, { metalness: 1, roughness: 0.25 });
    const gutString = mat(0xb9a07a, { metalness: 0.6, roughness: 0.4 });
    const pernambuco = pmat(0x5e2410, { roughness: 0.35, clearcoat: 0.6 });
    const hair = mat(0xf3eee2, { roughness: 0.9 });
    const silver = mat(0xe4e4e4, { metalness: 1, roughness: 0.2 });
    const pearlEye = pmat(0xf2efe8, { roughness: 0.2, iridescence: 1 });

    // ----- Body -----
    const outline = smoothOutline(
      mirrorOutline([
        [0, -0.178], [0.06, -0.172], [0.094, -0.15], [0.103, -0.11], [0.097, -0.07],
        [0.082, -0.046], [0.06, -0.033], [0.055, 0.0], [0.06, 0.03], [0.077, 0.045],
        [0.083, 0.075], [0.08, 0.12], [0.06, 0.16], [0, BODY_TOP],
      ])
    );
    const shape = new THREE.Shape(outline);
    const ribDepth = 0.03;
    const arch = 0.013;

    // Ribs + back: extruded with a deep bevel to suggest the back arching.
    const backGeo = new THREE.ExtrudeGeometry(shape, {
      depth: ribDepth, bevelEnabled: true, bevelThickness: arch, bevelSize: 0.003, bevelSegments: 6, curveSegments: 48,
    });
    const back = new THREE.Mesh(backGeo, varnishBack);
    back.position.z = -(ribDepth + arch) - 0.0005;
    addPart(g, 'ribs', back);

    // Top plate: a separate arched slab sitting on the ribs.
    const topGeo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.0005, bevelEnabled: true, bevelThickness: arch, bevelSize: 0.0032, bevelSegments: 8, curveSegments: 48,
    });
    const topPlate = new THREE.Mesh(topGeo, varnish);
    topPlate.position.z = -arch - 0.0005;
    addPart(g, 'top', topPlate);
    // Purfling: a thin dark line inset from the edge.
    const purfPts = outline.filter((_, i) => i % 2 === 0).map((p) => v3(p.x * 0.955, p.y * 0.975, 0.0001));
    const purfling = tube(purfPts, 0.0008, ebony, { closed: true, segments: 220, radial: 4 });
    purfling.scale.z = 0.5;
    addPart(g, 'top', purfling);

    // F-holes
    [-1, 1].forEach((s) => {
      const x = s * 0.036;
      const pts = [
        v3(x + s * 0.004, BRIDGE_Y + 0.045, 0), v3(x + s * 0.001, BRIDGE_Y + 0.03, 0),
        v3(x - s * 0.003, BRIDGE_Y + 0.0, 0), v3(x + s * 0.001, BRIDGE_Y - 0.03, 0),
        v3(x - s * 0.004, BRIDGE_Y - 0.045, 0),
      ];
      const slot = tube(pts, 0.0016, dark, { segments: 40, radial: 6 });
      slot.scale.z = 0.4;
      addPart(g, 'fholes', slot);
      [pts[0], pts[4]].forEach((p) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.0034, 12, 8), dark);
        eye.position.copy(p);
        eye.scale.z = 0.4;
        addPart(g, 'fholes', eye);
      });
    });

    // ----- Bridge -----
    const bs = new THREE.Shape();
    bs.moveTo(-0.021, 0);
    bs.lineTo(-0.012, 0);
    bs.quadraticCurveTo(0, 0.01, 0.012, 0);
    bs.lineTo(0.021, 0);
    bs.lineTo(0.019, 0.006);
    bs.quadraticCurveTo(0.012, 0.016, 0.017, 0.026);
    bs.quadraticCurveTo(0, 0.036, -0.017, 0.026);
    bs.quadraticCurveTo(-0.012, 0.016, -0.019, 0.006);
    bs.lineTo(-0.021, 0);
    const heart = new THREE.Path();
    heart.absellipse(0, 0.019, 0.0035, 0.0028, 0, Math.PI * 2, true);
    bs.holes.push(heart);
    const kidneyL = new THREE.Path();
    kidneyL.absellipse(-0.009, 0.013, 0.0022, 0.004, 0, Math.PI * 2, true);
    const kidneyR = new THREE.Path();
    kidneyR.absellipse(0.009, 0.013, 0.0022, 0.004, 0, Math.PI * 2, true);
    bs.holes.push(kidneyL, kidneyR);
    const bridge = new THREE.Mesh(
      new THREE.ExtrudeGeometry(bs, { depth: 0.0035, bevelEnabled: false, curveSegments: 16 }),
      bridgeMaple
    );
    bridge.rotation.x = Math.PI / 2;
    bridge.position.set(0, BRIDGE_Y + 0.00175, 0);
    addPart(g, 'bridge', bridge);
    // Height of the bridge's curved top edge at a given x (matches the quadratic curve above).
    const bridgeTop = (x) => {
      const t = (1 - x / 0.017) / 2;
      return 0.026 * ((1 - t) ** 2 + t * t) + 0.072 * t * (1 - t) + 0.0004;
    };

    // ----- Neck, fingerboard -----
    const neck = roundedBox(0.026, NUT_Y - 0.16, 0.022, 0.008, maple);
    neck.position.set(0, (NUT_Y + 0.16) / 2, 0.0);
    addPart(g, 'neck', neck);
    const heel = roundedBox(0.03, 0.03, 0.035, 0.01, varnish);
    heel.position.set(0, BODY_TOP + 0.005, -0.012);
    addPart(g, 'neck', heel);

    const fbLow = 0.04; // y at body end
    const fbLen = NUT_Y - fbLow;
    const fbGeo = new THREE.CylinderGeometry(0.06, 0.06, fbLen, 24, 1, false, -0.21, 0.42);
    const fingerboard = new THREE.Mesh(fbGeo, ebony);
    fingerboard.scale.set(1, 1, 0.35); // shallow curve across width
    const fbGroup = new THREE.Group();
    fbGroup.add(fingerboard);
    fingerboard.position.set(0, fbLen / 2, -0.06 * 0.35 + 0.0005);
    fbGroup.position.set(0, fbLow, 0.022);
    fbGroup.rotation.x = -0.025;
    addPart(g, 'fingerboard', fbGroup);
    const fbUnder = new THREE.Mesh(new THREE.BoxGeometry(0.025, fbLen, 0.008), ebony);
    fbUnder.position.set(0, fbLen / 2, -0.0045);
    addPart(fbGroup, 'fingerboard', fbUnder);
    const nutY = NUT_Y;
    const nut = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.004, 0.004), ebony);
    nut.position.set(0, nutY + 0.002, 0.0145);
    addPart(g, 'fingerboard', nut);

    // ----- Pegbox, pegs, scroll -----
    const pegbox = roundedBox(0.026, 0.075, 0.028, 0.006, varnish);
    pegbox.position.set(0, nutY + 0.04, -0.004);
    addPart(g, 'pegs', pegbox);
    const pegCavity = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.06, 0.004), dark);
    pegCavity.position.set(0, nutY + 0.04, 0.0105);
    addPart(g, 'pegs', pegCavity);
    const pegYs = [nutY + 0.016, nutY + 0.032, nutY + 0.05, nutY + 0.066];
    const pegSides = [1, -1, 1, -1];
    const pegZ = 0.0;
    pegYs.forEach((y, i) => {
      const s = pegSides[i];
      addPart(g, 'pegs', cylinderBetween(v3(-s * 0.016, y, pegZ), v3(s * 0.03, y, pegZ), 0.0028, ebony, 12, 0.0038));
      const head = roundedBox(0.004, 0.016, 0.013, 0.0018, ebony);
      head.position.set(s * 0.034, y, pegZ);
      addPart(g, 'pegs', head);
      const collar = new THREE.Mesh(new THREE.SphereGeometry(0.0022, 10, 8), pearlEye);
      collar.position.set(s * 0.0365, y, pegZ);
      addPart(g, 'pegs', collar);
    });

    // Scroll: a spiral in the y-z plane that rolls up over the top, down the back and curls inward.
    const cy = nutY + 0.09;
    const cz = -0.004;
    const spiral = [v3(0, nutY + 0.072, 0.005)];
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const ang = -0.4 + t * Math.PI * 2 * 1.7;
      const r = 0.0145 * (1 - 0.65 * t);
      spiral.push(v3(0, cy + Math.sin(ang) * r, cz + Math.cos(ang) * r));
    }
    const scroll = tube(spiral, 0.0072, varnish, { segments: 160, radial: 14 });
    scroll.scale.x = 1.5;
    addPart(g, 'scroll', scroll);

    // ----- Tailpiece, fine tuner, end button, chinrest -----
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
    const fine = cylinderBetween(v3(-0.0075, tpTop - 0.012, 0.014), v3(-0.0075, tpTop - 0.012, 0.024), 0.0026, silver, 14);
    addPart(g, 'tailpiece', fine);
    const fineLever = roundedBox(0.004, 0.02, 0.003, 0.0012, silver);
    fineLever.position.set(-0.0075, tpTop - 0.022, 0.016);
    addPart(g, 'tailpiece', fineLever);
    addPart(g, 'tailpiece', cylinderBetween(v3(0, -0.178, -0.026), v3(0, -0.188, -0.026), 0.005, ebony, 16)); // end button
    const tailGut = tube([v3(-0.006, -0.172, 0.008), v3(0, -0.186, -0.01), v3(0.006, -0.172, 0.008)], 0.0012, dark, { segments: 20 });
    addPart(g, 'tailpiece', tailGut);

    // Chinrest sits on the bass (G-string) side of the tailpiece.
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

    // ----- Strings: tailpiece -> bridge -> nut -> peg -----
    const radii = [0.00055, 0.00045, 0.00038, 0.00025];
    const mats = [gutString, gutString, gutString, steel];
    const pegForString = [3, 1, 0, 2]; // G, D, A, E -> peg index (bottom = 0)
    for (let i = 0; i < 4; i++) {
      const s = 1 - (i / 3) * 2; // G on the bass side (+x when facing the violin)
      const tail = v3(s * 0.0075, tpTop - 0.004, 0.016);
      const br = v3(s * 0.0165, BRIDGE_Y, bridgeTop(s * 0.0165));
      const nt = v3(s * 0.0075, nutY + 0.002, 0.0168);
      const peg = v3(s * 0.004, pegYs[pegForString[i]], 0.003);
      const m = mats[i];
      addPart(g, 'strings', cylinderBetween(tail, br, radii[i], m, 6));
      addPart(g, 'strings', cylinderBetween(br, nt, radii[i], m, 6));
      addPart(g, 'strings', cylinderBetween(nt, peg, radii[i], m, 6));
    }

    // ----- Bow (lying beside the violin) -----
    const bow = new THREE.Group();
    bow.position.set(0.2, -0.18, -0.02);
    const L = 0.74;
    const stickPts = [];
    for (let t = 0; t <= 1.0001; t += 0.05) {
      stickPts.push(v3(0.011 * Math.sin(Math.PI * t), t * L, 0)); // camber bends toward the hair
    }
    addPart(bow, 'bow', tube(stickPts, 0.0042, pernambuco, { segments: 80, radial: 8 }));
    const tipHead = roundedBox(0.024, 0.016, 0.008, 0.003, pernambuco);
    tipHead.position.set(0.011, L - 0.006, 0);
    addPart(bow, 'bow', tipHead);
    const tipPlate = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.0025, 0.0085), mat(0xf4efe3));
    tipPlate.position.set(0.019, L - 0.0145, 0);
    addPart(bow, 'bow', tipPlate);
    const frog = roundedBox(0.02, 0.045, 0.011, 0.004, ebony);
    frog.position.set(0.013, 0.07, 0);
    addPart(bow, 'bow', frog);
    const eyeDot = new THREE.Mesh(new THREE.CircleGeometry(0.003, 16), pearlEye);
    eyeDot.position.set(0.013, 0.07, 0.0057);
    addPart(bow, 'bow', eyeDot);
    addPart(bow, 'bow', cylinderBetween(v3(0, -0.004, 0), v3(0, 0.02, 0), 0.0045, silver, 12)); // button
    addPart(bow, 'bow', cylinderBetween(v3(0, 0.1, 0), v3(0, 0.14, 0), 0.0047, silver, 12)); // grip winding
    const hairStart = 0.09;
    const hairEnd = L - 0.015;
    const hairBand = new THREE.Mesh(new THREE.BoxGeometry(0.0012, hairEnd - hairStart, 0.009), hair);
    hairBand.position.set(0.021, (hairStart + hairEnd) / 2, 0);
    addPart(bow, 'bow', hairBand);
    g.add(bow);

    return g;
  },
};

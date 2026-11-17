import * as THREE from 'three';
import {
  addPart, v3, cylinderBetween, roundedBox, smoothOutline, mirrorOutline, outlineTube,
} from '../lib/helpers.js';
import { wood, metal, plastic, pearl as pearlMat, stringMat, dark as darkMat } from '../lib/materials.js';

// Layout (metres): guitar stands upright, soundboard faces +Z, saddle at y = SADDLE.
const SCALE = 0.645;          // scale length: nut to saddle
const SADDLE = -0.08;
const NUT = SADDLE + SCALE;
const fretY = (n) => SADDLE + SCALE / Math.pow(2, n / 12);

export default {
  id: 'guitar',
  name: 'Acoustic Guitar',
  section: 'strings',
  ensembles: [],
  range: 'E2 – B5', size: '1 m long',
  blurb:
    'A hollow wooden box with six steel strings. Plucking a string sends its vibration through the bridge into a thin spruce top, which acts like a loudspeaker cone and pushes the sound out into the room.',
  defaultView: [0.55, 0.2, 1],
  parts: [
    {
      id: 'headstock', name: 'Headstock',
      what: 'The flat paddle at the very end of the neck that holds the tuning machines.',
      why: 'It anchors one end of every string. It is angled backwards a few degrees so the strings press firmly down onto the nut, which keeps notes clear and stops strings from buzzing in their slots.',
      fact: 'Makers often put their logo here. That makes the headstock the easiest way to spot a guitar’s brand from the back of a concert hall.',
      view: [0.35, 0.25, 1],
    },
    {
      id: 'tuners', name: 'Tuning Machines',
      what: 'Geared pegs, three on each side, that wind each string around a metal post.',
      why: 'Turning a button tightens or loosens a string, which raises or lowers its pitch. The worm gear inside means the string cannot slowly unwind under its tension of roughly 7–10 kg.',
      fact: 'A typical gear ratio is 18:1, so the button turns eighteen times for every full turn of the post. That is what makes very fine tuning possible.',
      view: [1, 0.35, 0.5],
    },
    {
      id: 'nut', name: 'Nut',
      what: 'A small slotted strip of bone or plastic where the fretboard meets the headstock.',
      why: 'It sets the spacing and height of the strings at the top of the neck. It is one of the two end points (with the saddle) that define how long each string is allowed to vibrate.',
      fact: 'Bone is a favourite nut material because it is hard and slippery, so strings slide through it smoothly while you tune.',
      view: [0.25, 0.7, 1],
    },
    {
      id: 'neck', name: 'Neck',
      what: 'The long wooden arm, usually mahogany, joining the headstock to the body.',
      why: 'You hold it in your fretting hand, so its thickness and shape decide how comfortable the guitar is to play. A steel rod hidden inside (the truss rod) stops the strings’ pull from bending it forward.',
      fact: 'Steel-string guitars carry around 70 kg of total string tension. Without a truss rod the neck would slowly bow like an archer’s bow.',
      view: [1, 0.1, 0.35],
    },
    {
      id: 'fretboard', name: 'Fretboard',
      what: 'A thin slab of hard dark wood (rosewood or ebony) glued to the front of the neck.',
      why: 'It is the playing surface: pressing a string down against it shortens the vibrating length and raises the pitch. The pearl dots are position markers that help players find frets quickly.',
      fact: 'The 12th fret, marked with a double dot, sits exactly halfway along the string, so it plays the note one octave above the open string.',
      view: [0.15, 0.05, 1],
    },
    {
      id: 'frets', name: 'Frets',
      what: 'Metal wires set across the fretboard at precisely calculated positions.',
      why: 'Each fret is one semitone higher than the last. Frets get closer together toward the body because each one has to shorten the remaining string by the same ratio (the twelfth root of two, about 5.6%).',
      fact: 'The frets are spaced by a formula that was worked out for lutes in the 1500s.',
      view: [0.5, 0.45, 1],
    },
    {
      id: 'soundboard', name: 'Soundboard (Top)',
      what: 'The thin front plate, only 2–3 mm thick, usually made of spruce.',
      why: 'It shapes the guitar’s voice more than any other part. String energy enters through the bridge and makes the large, light top vibrate and move air. Bracing struts glued underneath keep it strong without making it stiff.',
      fact: 'Spruce is prized because it is very stiff for how little it weighs. As a guitar ages and gets played, the top usually “opens up” and sounds richer.',
      view: [0, 0, 1],
    },
    {
      id: 'soundhole', name: 'Sound Hole & Rosette',
      what: 'The round opening in the top, framed by a decorative inlaid ring called the rosette.',
      why: 'The hole lets the air inside the body resonate like blowing across a bottle (a Helmholtz resonator). That reinforces the guitar’s low notes. The rosette also strengthens the wood around the hole.',
      fact: 'The air inside a dreadnought resonates at roughly 100 Hz, close to the G on the low E string.',
      view: [0, 0.1, 1],
    },
    {
      id: 'pickguard', name: 'Pickguard',
      what: 'A thin plastic plate glued to the top beside the sound hole.',
      why: 'It protects the soft spruce from scratches made by picks and fingernails during strumming.',
      fact: 'Old pickguards were made of real tortoiseshell. Today a celluloid imitation gives the same mottled look.',
      view: [-0.25, 0.05, 1],
    },
    {
      id: 'bridge', name: 'Bridge & Bridge Pins',
      what: 'The hardwood block glued to the top that anchors the strings, held in place by six bridge pins.',
      why: 'It is the doorway between strings and soundboard: every vibration passes through it into the top. It also has to resist the strings constantly trying to pull it forward off the guitar.',
      fact: 'A bridge lifting off the top is one of the most common repairs on old acoustic guitars, caused by decades of string tension.',
      view: [0.2, 0.6, 1],
    },
    {
      id: 'saddle', name: 'Saddle',
      what: 'The thin white strip of bone set into the bridge, where the strings cross over.',
      why: 'It is the far end point of each string’s vibrating length. It is set at a slight angle so that notes stay in tune as you play higher up the neck (this is called intonation compensation).',
      fact: 'The saddle sits a few millimetres further away than the “perfect” 64.5 cm, because pressing a string down stretches it and raises its pitch slightly.',
      view: [0.3, 0.5, 1],
    },
    {
      id: 'strings', name: 'Strings',
      what: 'Six steel strings tuned E–A–D–G–B–E, thickest to thinnest. The lower four are wrapped in bronze wire.',
      why: 'They are the source of the sound. A string’s pitch depends on its length, tension and mass. Wrapping the bass strings adds mass without making them too stiff to vibrate freely.',
      fact: 'The low E vibrates about 82 times per second. The high E is two octaves higher, at about 330.',
      view: [0.45, 0.25, 1],
    },
    {
      id: 'body', name: 'Body (Back & Sides)',
      what: 'The hollow box formed by the curved sides and the back, here in dark rosewood with cream binding on the edges.',
      why: 'The back and sides reflect and colour the sound made by the top. The narrow “waist” lets the guitar rest on your leg, and the binding seals the delicate edges.',
      fact: 'The large “dreadnought” shape was named after a famous British battleship (HMS Dreadnought) because the guitar was big and loud.',
      view: [1, 0.25, -0.9],
    },
  ],

  build() {
    const g = new THREE.Group();

    const rosewood = wood('rosewood', { scale: 4, clearcoat: 1, clearcoatRoughness: 0.1, roughness: 0.4 });
    const spruce = wood('spruce', { scale: 11, tint: 0xf4dcb6, clearcoat: 1, clearcoatRoughness: 0.08, roughness: 0.45 });
    const mahogany = wood('mahogany', { scale: 5, clearcoat: 0.8, clearcoatRoughness: 0.15 });
    const ebony = wood('ebony', { scale: 8, clearcoat: 0.2, roughness: 0.45 });
    const bridgeWood = wood('rosewood', { scale: 10, tint: 0x8a6a5a, clearcoat: 0.2, roughness: 0.5 });
    const bone = plastic(0xf1e8d4, 0.35);
    const cream = plastic(0xeee2c4, 0.4);
    const pearl = pearlMat();
    const nickel = metal('nickel');
    const fretMetal = metal('nickel');
    const bronze = stringMat('bronze');
    const dark = darkMat();
    const rosetteMat = wood('ebony', { scale: 30, roughness: 0.5 });
    const tortoise = plastic(0x2a1107, 0.25, { clearcoat: 1 });

    // ----- Body outline -----
    const outline = smoothOutline(
      mirrorOutline([
        [0, -0.25], [0.12, -0.235], [0.18, -0.18], [0.19, -0.1], [0.165, -0.02],
        [0.125, 0.04], [0.13, 0.1], [0.14, 0.16], [0.115, 0.215], [0.06, 0.245], [0, 0.25],
      ])
    );

    // Back & sides
    const depth = 0.095;
    const bodyGeo = new THREE.ExtrudeGeometry(new THREE.Shape(outline), {
      depth, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 3, curveSegments: 48,
    });
    const body = new THREE.Mesh(bodyGeo, rosewood);
    body.position.z = -(depth + 0.004);
    addPart(g, 'body', body);
    addPart(g, 'body', outlineTube(outline, -0.0015, 0.0035, cream)); // binding
    const strapButton = cylinderBetween(v3(0, -0.252, -0.05), v3(0, -0.262, -0.05), 0.004, bone);
    addPart(g, 'body', strapButton);

    // Soundboard with the hole cut out
    const holeY = 0.065;
    const topShape = new THREE.Shape(outline);
    const hole = new THREE.Path();
    hole.absarc(0, holeY, 0.043, 0, Math.PI * 2, true);
    topShape.holes.push(hole);
    const top = new THREE.Mesh(new THREE.ShapeGeometry(topShape, 64), spruce);
    top.position.z = 0.0012;
    addPart(g, 'soundboard', top);

    // Sound hole: dark interior + rosette rings
    const holeDisc = new THREE.Mesh(new THREE.CircleGeometry(0.043, 48), dark);
    holeDisc.position.set(0, holeY, 0.0004);
    addPart(g, 'soundhole', holeDisc);
    const rosette = new THREE.Mesh(new THREE.RingGeometry(0.047, 0.057, 64), rosetteMat);
    rosette.position.set(0, holeY, 0.0019);
    addPart(g, 'soundhole', rosette);
    const rosetteInner = new THREE.Mesh(new THREE.RingGeometry(0.0505, 0.0525, 64), cream);
    rosetteInner.position.set(0, holeY, 0.0021);
    addPart(g, 'soundhole', rosetteInner);

    // Pickguard (treble side of the sound hole)
    const pg = new THREE.Shape();
    pg.absellipse(0, 0, 0.034, 0.06, 0, Math.PI * 2, false, 0.35);
    const pickguard = new THREE.Mesh(new THREE.ShapeGeometry(pg, 48), tortoise);
    pickguard.position.set(-0.088, 0.03, 0.0022);
    addPart(g, 'pickguard', pickguard);

    // ----- Bridge, pins, saddle -----
    const bridge = roundedBox(0.15, 0.028, 0.009, 0.004, bridgeWood);
    bridge.position.set(0, SADDLE - 0.005, 0.0012 + 0.0045);
    addPart(g, 'bridge', bridge);
    const stringXSaddle = (i) => 0.027 - i * 0.0108;
    for (let i = 0; i < 6; i++) {
      const pin = cylinderBetween(v3(stringXSaddle(i), SADDLE - 0.012, 0.009), v3(stringXSaddle(i), SADDLE - 0.012, 0.0125), 0.0028, cream, 12);
      addPart(g, 'bridge', pin);
    }
    const saddle = roundedBox(0.075, 0.003, 0.007, 0.001, bone);
    saddle.position.set(0, SADDLE, 0.0128);
    saddle.rotation.z = -0.04;
    addPart(g, 'saddle', saddle);

    // ----- Neck, fretboard, frets, nut -----
    const neckLen = NUT - 0.2;
    const neck = roundedBox(0.05, neckLen, 0.024, 0.009, mahogany);
    neck.position.set(0, 0.2 + neckLen / 2, -0.009);
    addPart(g, 'neck', neck);
    const heel = roundedBox(0.05, 0.05, 0.05, 0.01, mahogany);
    heel.position.set(0, 0.235, -0.025);
    addPart(g, 'neck', heel);

    const fbStart = fretY(20) - 0.004;
    const fbLen = NUT - fbStart;
    const fretboard = new THREE.Mesh(new THREE.BoxGeometry(0.053, fbLen, 0.006), ebony);
    fretboard.position.set(0, fbStart + fbLen / 2, 0.0046);
    addPart(g, 'fretboard', fretboard);
    const fbTop = 0.0076;

    for (let n = 1; n <= 20; n++) {
      const y = fretY(n);
      const fret = cylinderBetween(v3(-0.0265, y, fbTop), v3(0.0265, y, fbTop), 0.0011, fretMetal, 8);
      addPart(g, 'frets', fret);
    }
    const dotGeo = new THREE.CircleGeometry(0.0032, 20);
    [3, 5, 7, 9, 12, 15, 17, 19].forEach((n) => {
      const y = (fretY(n) + fretY(n - 1)) / 2;
      const xs = n === 12 ? [-0.012, 0.012] : [0];
      xs.forEach((x) => {
        const dot = new THREE.Mesh(dotGeo, pearl);
        dot.position.set(x, y, fbTop + 0.0002);
        addPart(g, 'fretboard', dot);
      });
    });

    const nut = new THREE.Mesh(new THREE.BoxGeometry(0.053, 0.005, 0.006), bone);
    nut.position.set(0, NUT + 0.0025, fbTop + 0.002);
    addPart(g, 'nut', nut);

    // ----- Headstock & tuners (in a tilted group) -----
    const head = new THREE.Group();
    head.position.set(0, NUT + 0.005, 0.001);
    head.rotation.x = -0.24;
    g.add(head);
    const plate = roundedBox(0.08, 0.19, 0.016, 0.006, mahogany);
    plate.position.set(0, 0.095, 0);
    addPart(head, 'headstock', plate);
    const veneer = roundedBox(0.077, 0.186, 0.0015, 0.0007, ebony);
    veneer.position.set(0, 0.095, 0.0082);
    addPart(head, 'headstock', veneer);

    const postYs = [0.045, 0.095, 0.145];
    const postPos = []; // headstock-local post tops, index = string number
    [1, -1].forEach((side) => {
      postYs.forEach((y, k) => {
        const x = side * 0.022;
        addPart(head, 'tuners', cylinderBetween(v3(x, y, 0.008), v3(x, y, 0.019), 0.003, nickel, 12));
        addPart(head, 'tuners', cylinderBetween(v3(x, y, 0.008), v3(x, y, 0.0095), 0.0055, nickel, 16)); // bushing
        const gear = roundedBox(0.018, 0.022, 0.012, 0.003, nickel);
        gear.position.set(side * 0.032, y, -0.014);
        addPart(head, 'tuners', gear);
        addPart(head, 'tuners', cylinderBetween(v3(side * 0.041, y, -0.012), v3(side * 0.06, y, -0.012), 0.0018, nickel, 8));
        const button = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, 0.004, 20), nickel);
        button.scale.set(1, 1, 0.75);
        button.rotation.z = Math.PI / 2;
        button.position.set(side * 0.066, y, -0.012);
        addPart(head, 'tuners', button);
        // bass strings (0..2) on the +x side, nearest-nut post gets the outermost string
        const stringIndex = side === 1 ? k : 5 - k;
        postPos[stringIndex] = v3(x, y, 0.016);
      });
    });

    // ----- Strings -----
    g.updateMatrixWorld(true);
    const radii = [0.00068, 0.00056, 0.00048, 0.0004, 0.00031, 0.00026];
    for (let i = 0; i < 6; i++) {
      const m = i < 4 ? bronze : nickel;
      const xs = stringXSaddle(i);
      const xn = 0.0215 - i * 0.0086;
      const pin = v3(xs, SADDLE - 0.012, 0.0115);
      const sad = v3(xs, SADDLE, 0.0165);
      const nutP = v3(xn, NUT + 0.0025, 0.0127);
      const post = head.localToWorld(postPos[i].clone());
      addPart(g, 'strings', cylinderBetween(pin, sad, radii[i], m, 6));
      addPart(g, 'strings', cylinderBetween(sad, nutP, radii[i], m, 6));
      addPart(g, 'strings', cylinderBetween(nutP, post, radii[i], m, 6));
    }

    return g;
  },
};

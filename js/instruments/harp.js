import * as THREE from 'three';
import { addPart, v3, cylinderBetween, roundedBox, taperedTube, instancedCylinders, lathe } from '../lib/helpers.js';
import { wood, metal, stringMat } from '../lib/materials.js';

// Concert pedal harp in the x-y plane: the player sits at -X behind the soundbox,
// the column stands at +X, strings run vertically between soundboard and neck.
const N_STRINGS = 47;

export default {
  id: 'harp', name: 'Concert Harp', section: 'strings', ensembles: ['orchestra'],
  range: 'C♭1 – G♯7', size: '1.85 m tall · 47 strings',
  blurb: 'A triangle of 47 strings stretched between a resonating soundbox and a curved neck. Seven pedals at the base retune every string of a given note name at once. That lets one diatonic set of strings play in any key.',
  defaultView: [0.55, 0.15, 1],
  parts: [
    { id: 'column', name: 'Column & Crown', view: [1, 0.3, 0.6],
      what: 'The tall pillar at the front of the harp, topped by a carved, gilded crown.',
      why: 'It holds the neck up against the strings’ enormous pull, roughly a tonne in total. Inside it run seven steel rods that link the pedals to the tuning mechanism in the neck.',
      fact: 'The decorative crown and column are often covered in real gold leaf.' },
    { id: 'neck', name: 'Neck', view: [0.3, 0.4, 1],
      what: 'The S-curved top arm that holds the upper end of every string.',
      why: 'Its curve follows the string lengths from long bass strings to tiny treble ones, so each string is the right length for its pitch.',
      fact: 'The neck is laminated from many layers of maple glued together, so it can resist the strings’ pull without warping.' },
    { id: 'pins', name: 'Tuning Pins', view: [0.2, 0.3, 1],
      what: 'A row of metal pins on the side of the neck, one per string.',
      why: 'Harpists tune each string by turning its pin with a tuning key. With 47 strings, this happens before every rehearsal.',
      fact: 'A full tuning can take 15 minutes. Many harpists use a clip-on electronic tuner.' },
    { id: 'discs', name: 'Discs (Action)', view: [0.25, 0.1, 1],
      what: 'Pairs of small brass discs with two prongs, sitting just below each tuning pin.',
      why: 'When a pedal moves, the discs for that note rotate and their prongs grip the string. That shortens it by a semitone, or by two for the lowest pedal setting. This is the “double-action” mechanism.',
      fact: 'The double-action pedal harp was patented by Sébastien Érard in 1810, the same inventor as the piano’s repetition action.' },
    { id: 'soundboard', name: 'Soundboard', view: [-0.3, 0.5, 1],
      what: 'The thin spruce face of the soundbox, with a hardwood strip down its centre where the strings attach.',
      why: 'The strings pull directly on it, so it vibrates and makes the sound. It is thin at the treble end and thicker at the bass, matched to the strings’ tension.',
      fact: 'Harp soundboards slowly bulge upward under the strings’ pull. A gentle belly shape is normal on a well-played harp.' },
    { id: 'soundbox', name: 'Soundbox', view: [-1, 0.2, 0.4],
      what: 'The long, rounded hollow body that leans back against the player’s shoulder.',
      why: 'It encloses the air that resonates with the soundboard. Openings in its back let the sound out and let the harpist reach in to change strings.',
      fact: 'Players tilt the harp back onto their right shoulder, so the soundbox carries much of its weight of about 40 kg.' },
    { id: 'strings', name: 'Strings', view: [0.4, 0.1, 1],
      what: '47 strings: nylon in the treble, gut in the middle and metal-wound wire in the bass.',
      why: 'They are plucked with the fingertips of both hands (never the little fingers). Every C string is dyed red and every F string dark blue or black, so the player can find their place among so many.',
      fact: 'A harp is tuned in C♭ major. With all pedals in the middle position it plays in C major.' },
    { id: 'pedals', name: 'Pedals', view: [-1, 0.4, 0.3],
      what: 'Seven brass pedals in the base: three for the left foot (D, C, B) and four for the right (E, F, G, A).',
      why: 'Each pedal has three notches: flat, natural and sharp. Moving the F pedal, for example, changes every F string on the harp at once.',
      fact: 'Harpists write the pedal settings into their music as a little diagram called a pedal chart.' },
    { id: 'base', name: 'Base', view: [0.6, 0.4, 1],
      what: 'The heavy wooden pedestal the harp stands on.',
      why: 'It joins the column and soundbox, houses the pedal mechanism and keeps the tall instrument stable.',
      fact: 'Harps are moved on padded trolleys, and harpists usually own a car big enough to carry one.' },
  ],

  build() {
    const g = new THREE.Group();
    const maple = wood('harp', { scale: 4, clearcoat: 0.9, clearcoatRoughness: 0.1, roughness: 0.45 });
    const spruce = wood('spruce', { scale: 10, tint: 0xf3d9b0, clearcoat: 0.7, roughness: 0.5 });
    const rib = wood('mahogany', { scale: 10, clearcoat: 0.5 });
    const gold = metal('gold');
    const brass = metal('brass');
    const nickel = metal('nickel');

    // ----- Base & pedals -----
    const base = roundedBox(0.5, 0.11, 0.38, 0.02, maple);
    base.position.set(0, 0.075, 0);
    addPart(g, 'base', base);
    [[-0.2, -0.15], [-0.2, 0.15], [0.2, -0.15], [0.2, 0.15]].forEach(([x, z]) => {
      const foot = roundedBox(0.07, 0.025, 0.06, 0.008, maple);
      foot.position.set(x, 0.0125, z);
      addPart(g, 'base', foot);
    });
    const goldBand = roundedBox(0.505, 0.012, 0.385, 0.005, gold);
    goldBand.position.set(0, 0.125, 0);
    addPart(g, 'base', goldBand);
    // three pedals for the left foot, four for the right
    [-0.15, -0.105, -0.06, 0.03, 0.075, 0.12, 0.165].forEach((z, i) => {
      const pedal = roundedBox(0.09, 0.012, 0.016, 0.004, brass);
      pedal.position.set(-0.29, 0.06 + (i % 3 === 1 ? 0.012 : 0), z);
      addPart(g, 'pedals', pedal);
      const slot = roundedBox(0.006, 0.07, 0.022, 0.002, metal('darkSteel'));
      slot.position.set(-0.25, 0.075, z);
      addPart(g, 'pedals', slot);
    });

    // ----- Soundbox (half round back + flat soundboard), in its own tilted frame -----
    const sbBottom = v3(0.03, 0.15, 0);
    const sbTop = v3(-0.5, 1.5, 0);
    const axis = new THREE.Vector3().subVectors(sbTop, sbBottom);
    const len = axis.length();
    const dir = axis.clone().normalize();
    const normal = new THREE.Vector3(dir.y, -dir.x, 0); // toward the strings
    const rAt = (t) => 0.2 - 0.135 * t;                  // half-width along the box

    const sb = new THREE.Group();
    sb.position.copy(sbBottom).addScaledVector(axis, 0.5);
    sb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    g.add(sb);
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(rAt(1), rAt(0), len, 40, 1, false, Math.PI, Math.PI), maple);
    shell.scale.x = 0.62;
    addPart(sb, 'soundbox', shell);
    // sound holes in the back
    [0.3, 0.55, 0.78].forEach((t) => {
      const hole = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshStandardMaterial({ color: 0x0a0605, roughness: 1 }));
      const r = rAt(t);
      hole.scale.set(r * 0.28, r * 0.5, 1);
      hole.position.set(-r * 0.62 - 0.002, -len / 2 + t * len, 0);
      hole.rotation.y = -Math.PI / 2;
      addPart(sb, 'soundbox', hole);
    });
    // soundboard: trapezoid filling the open face
    const sbGeo = new THREE.BufferGeometry();
    const y0 = -len / 2;
    const y1 = len / 2;
    sbGeo.setAttribute('position', new THREE.Float32BufferAttribute([
      0.002, y0, -rAt(0), 0.002, y0, rAt(0), 0.002, y1, rAt(1),
      0.002, y0, -rAt(0), 0.002, y1, rAt(1), 0.002, y1, -rAt(1),
    ], 3));
    sbGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 2));
    sbGeo.computeVertexNormals();
    const board = new THREE.Mesh(sbGeo, spruce);
    board.material.side = THREE.DoubleSide;
    addPart(sb, 'soundboard', board);
    const ribStrip = roundedBox(0.008, len * 0.92, 0.03, 0.003, rib);
    ribStrip.position.set(0.006, 0.02 * len, 0);
    addPart(sb, 'soundboard', ribStrip);

    // ----- Neck -----
    const neckPts = [v3(-0.53, 1.5, 0), v3(-0.42, 1.56, 0), v3(-0.27, 1.68, 0), v3(-0.1, 1.75, 0), v3(0.06, 1.73, 0), v3(0.19, 1.75, 0), v3(0.29, 1.82, 0)];
    const neckCurve = new THREE.CatmullRomCurve3(neckPts, false, 'centripetal');
    const neck = taperedTube(null, (t) => 0.045 - 0.008 * Math.sin(t * Math.PI), maple, { curve: neckCurve, tubular: 140, radial: 20 });
    neck.scale.z = 0.55;
    addPart(g, 'neck', neck);
    const samples = neckCurve.getSpacedPoints(200);
    const neckY = (x) => {
      for (let i = 0; i < samples.length - 1; i++) {
        const a = samples[i];
        const b = samples[i + 1];
        if (x >= a.x && x <= b.x) return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x || 1);
      }
      return samples[samples.length - 1].y;
    };

    // ----- Column with crown and gilded foot -----
    const colBottom = v3(0.255, 0.13, 0);
    const colTop = v3(0.29, 1.72, 0);
    addPart(g, 'column', cylinderBetween(colBottom, colTop, 0.034, maple, 32, 0.03));
    const crown = lathe([[0, 0], [0.04, 0], [0.05, 0.02], [0.045, 0.05], [0.058, 0.08], [0.05, 0.11], [0.03, 0.13], [0, 0.135]], gold, 40);
    crown.position.copy(colTop).add(v3(0, 0.0, 0));
    addPart(g, 'column', crown);
    const foot = lathe([[0, 0], [0.055, 0], [0.05, 0.03], [0.04, 0.05], [0.036, 0.09], [0, 0.09]], gold, 40);
    foot.position.copy(colBottom).add(v3(0, -0.01, 0));
    addPart(g, 'column', foot);

    // ----- Strings, pins, discs -----
    const groups = { red: [], navy: [], gut: [], wire: [] };
    const pins = [];
    const discs = [];
    for (let i = 0; i < N_STRINGS; i++) {
      const t = 0.07 + (i / (N_STRINGS - 1)) * 0.86;
      const p = sbBottom.clone().addScaledVector(axis, t).addScaledVector(normal, 0.012);
      const topY = neckY(p.x) - 0.045;
      const r = 0.0013 - (i / (N_STRINGS - 1)) * 0.001;
      const note = i % 7; // 0 = C ... 3 = F
      const key = i < 12 ? 'wire' : note === 0 ? 'red' : note === 3 ? 'navy' : 'gut';
      groups[key].push({ a: p, b: v3(p.x, topY, 0), r });
      pins.push({ a: v3(p.x, topY + 0.025, 0), b: v3(p.x, topY + 0.025, 0.035), r: 0.0022 });
      discs.push({ a: v3(p.x, topY + 0.004, 0.006), b: v3(p.x, topY + 0.004, 0.009), r: 0.0055 });
      discs.push({ a: v3(p.x, topY - 0.028, 0.006), b: v3(p.x, topY - 0.028, 0.009), r: 0.0055 });
    }
    addPart(g, 'strings', instancedCylinders(groups.wire, stringMat('copper')));
    addPart(g, 'strings', instancedCylinders(groups.gut, stringMat('gut')));
    addPart(g, 'strings', instancedCylinders(groups.red, stringMat('red')));
    addPart(g, 'strings', instancedCylinders(groups.navy, stringMat('navy')));
    addPart(g, 'pins', instancedCylinders(pins, nickel, 8));
    addPart(g, 'discs', instancedCylinders(discs, brass, 16));
    return g;
  },
};

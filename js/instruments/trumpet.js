import * as THREE from 'three';
import { mat, pmat, addPart, v3, cylinderBetween, tube, lathe } from '../lib/helpers.js';

// Trumpet lies along +X (mouthpiece at -X, bell at +X). Valves stand upright around x = 0.
const R = 0.0058;              // main bore tube radius
const LEAD_Z = -0.024;         // leadpipe side
const BELL_Z = 0.024;          // bell-pipe side
const TOP_Y = 0.036;
const VALVE_X = [-0.035, 0, 0.035];

export default {
  id: 'trumpet',
  name: 'Trumpet',
  emoji: '🎺',
  family: 'Brass · Valved',
  blurb:
    'About 1.4 metres of brass tubing folded into a compact loop. The sound starts at the player’s lips, which buzz into the mouthpiece. Three valves switch in extra lengths of tubing to change which notes the horn can play.',
  defaultView: [0.3, 0.4, 1],
  parts: [
    {
      id: 'mouthpiece', name: 'Mouthpiece',
      what: 'The removable silver-plated cup the player presses their lips against.',
      why: 'The trumpet has no reed or string, so the player’s lips are the vibrating part. The cup’s depth and the rim’s width shape the tone: shallow cups sound bright, deep cups sound darker.',
      fact: 'Professional players often own dozens of mouthpieces and switch between them depending on the music.',
      view: [-0.6, 0.4, 1],
    },
    {
      id: 'leadpipe', name: 'Leadpipe',
      what: 'The first, gently widening length of tubing, running from the mouthpiece receiver toward the front of the horn.',
      why: 'Its gradual taper strongly affects how “free-blowing” or resistant the trumpet feels, and how well the notes lock into tune.',
      fact: 'Your breath is warm and moist, so the leadpipe is where most gunk builds up. Many players wash their trumpet in the bath for exactly this reason.',
      view: [0.1, 0.6, -1],
    },
    {
      id: 'tuningslide', name: 'Main Tuning Slide',
      what: 'The big U-shaped loop at the front, which slides in and out of the tubes it fits into.',
      why: 'Pulling it out makes the whole instrument slightly longer, which lowers its pitch. Players set it before playing so they match the rest of the band.',
      fact: 'Brass gets sharper as it warms up from your breath, so players often pull the slide out a little more during a long concert.',
      view: [0.6, 0.15, -1],
    },
    {
      id: 'valves', name: 'Piston Valves',
      what: 'Three upright cylinders (casings) with pistons inside, drilled with passages that redirect the air.',
      why: 'Pressing a valve sends the air through an extra loop of tubing, which makes the horn longer and the pitch lower. Valve 2 lowers by a semitone, valve 1 by a tone and valve 3 by a tone and a half. Combining them gives seven tube lengths, enough to fill in every note.',
      fact: 'Before valves were invented around 1814, trumpeters could only play the notes of a single harmonic series, like a bugle.',
      view: [0.35, 0.35, 1],
    },
    {
      id: 'buttons', name: 'Finger Buttons',
      what: 'The pearl-topped caps on top of each valve stem, pressed by the right-hand fingers.',
      why: 'They push the pistons down against a spring. Fast, even fingerwork on these buttons is what makes rapid passages possible.',
      fact: 'The traditional pearl inlay is real mother-of-pearl on many professional trumpets.',
      view: [0.2, 1, 0.5],
    },
    {
      id: 'slides', name: '1st & 3rd Valve Slides',
      what: 'The smaller U-shaped loops attached to valves 1 and 3. The 3rd slide has a finger ring.',
      why: 'Some valve combinations play slightly sharp. Players kick the 1st slide out with their thumb or pull the 3rd slide with the ring finger to bring those notes into tune as they play.',
      fact: 'Low D and C♯ are notoriously sharp on trumpet, which is why the 3rd-slide ring exists.',
      view: [0.15, -0.35, 1],
    },
    {
      id: 'waterkey', name: 'Water Key',
      what: 'A small spring lever with a cork pad, at the lowest point of the main tuning slide.',
      why: 'Condensed breath collects in the tubing and makes a gurgling sound. Opening the water key and blowing lets it drain out.',
      fact: 'It is often called the “spit valve”, but it is almost all condensation, not spit.',
      view: [0.6, -0.7, -1],
    },
    {
      id: 'bell', name: 'Bell & Bell Section',
      what: 'The flaring final section of tubing, including the bow that bends behind the valves.',
      why: 'The flare matches the sound waves inside the narrow tube to the open air. That lets the sound radiate out loudly and also helps set the tuning of the upper notes. Its shape and metal are big factors in the trumpet’s brilliance.',
      fact: 'A trumpet bell is often hand-hammered from a single sheet of brass, and its throat flares out to about 12 cm across.',
      view: [1, 0.25, 0.6],
    },
  ],

  build() {
    const g = new THREE.Group();

    const brass = pmat(0xe0b04c, { metalness: 1, roughness: 0.18, clearcoat: 0.6, clearcoatRoughness: 0.1 });
    const brassBell = pmat(0xe0b04c, { metalness: 1, roughness: 0.18, clearcoat: 0.6, side: THREE.DoubleSide });
    const nickelSilver = mat(0xd9d4c8, { metalness: 1, roughness: 0.22 });
    const silver = mat(0xeeeeee, { metalness: 1, roughness: 0.12, side: THREE.DoubleSide });
    const pearl = pmat(0xf6f2ea, { roughness: 0.2, iridescence: 1, iridescenceIOR: 1.5 });
    const cork = mat(0x9b7652, { roughness: 0.9 });

    // ----- Mouthpiece & receiver -----
    const mp = lathe(
      [
        [0.002, 0.014], [0.006, 0.008], [0.0085, 0.0015], [0.0115, 0], [0.0135, 0.003],
        [0.009, 0.014], [0.0062, 0.03], [0.0058, 0.06], [0.0049, 0.088], [0.002, 0.088],
      ],
      silver, 40
    );
    mp.rotation.z = -Math.PI / 2;
    mp.position.set(-0.385, TOP_Y, LEAD_Z);
    addPart(g, 'mouthpiece', mp);

    addPart(g, 'leadpipe', cylinderBetween(v3(-0.305, TOP_Y, LEAD_Z), v3(-0.272, TOP_Y, LEAD_Z), 0.0068, nickelSilver, 20));

    // ----- Leadpipe -----
    addPart(g, 'leadpipe', cylinderBetween(v3(-0.272, TOP_Y, LEAD_Z), v3(0.15, TOP_Y, LEAD_Z), 0.0046, brass, 20, R));
    addPart(g, 'leadpipe', cylinderBetween(v3(0.09, TOP_Y, LEAD_Z), v3(0.09, TOP_Y, BELL_Z), 0.0022, brass, 10)); // brace
    addPart(g, 'leadpipe', cylinderBetween(v3(-0.06, TOP_Y, LEAD_Z), v3(-0.06, TOP_Y, BELL_Z), 0.0022, brass, 10));

    // ----- Main tuning slide (U-bend + outer legs + return to valve 3) -----
    const lowY = -0.045;
    addPart(g, 'tuningslide', cylinderBetween(v3(0.15, TOP_Y, LEAD_Z), v3(0.205, TOP_Y, LEAD_Z), R + 0.0008, nickelSilver, 20));
    addPart(g, 'tuningslide', cylinderBetween(v3(0.15, lowY, LEAD_Z), v3(0.205, lowY, LEAD_Z), R + 0.0008, nickelSilver, 20));
    addPart(g, 'tuningslide', tube([
      v3(0.2, TOP_Y, LEAD_Z), v3(0.228, TOP_Y - 0.003, LEAD_Z), v3(0.245, (TOP_Y + lowY) / 2, LEAD_Z),
      v3(0.228, lowY + 0.003, LEAD_Z), v3(0.2, lowY, LEAD_Z),
    ], R + 0.0008, brass, { segments: 48 }));
    addPart(g, 'tuningslide', tube([
      v3(0.15, lowY, LEAD_Z), v3(0.08, lowY, LEAD_Z), v3(0.055, lowY, LEAD_Z + 0.006), v3(VALVE_X[2], lowY + 0.004, -0.006),
    ], R, brass, { segments: 30 }));

    // Water key on the bottom of the U-bend
    const wkPivot = v3(0.222, lowY - 0.006, LEAD_Z);
    addPart(g, 'waterkey', cylinderBetween(wkPivot, v3(0.19, lowY - 0.011, LEAD_Z), 0.0017, nickelSilver, 8));
    addPart(g, 'waterkey', cylinderBetween(v3(0.233, lowY - 0.004, LEAD_Z), v3(0.236, lowY - 0.008, LEAD_Z), 0.0035, cork, 14));
    addPart(g, 'waterkey', cylinderBetween(wkPivot, v3(0.24, lowY - 0.0055, LEAD_Z), 0.0013, nickelSilver, 8));

    // ----- Valves -----
    VALVE_X.forEach((x) => {
      addPart(g, 'valves', cylinderBetween(v3(x, -0.05, 0), v3(x, 0.05, 0), 0.0115, brass, 28));
      addPart(g, 'valves', cylinderBetween(v3(x, 0.05, 0), v3(x, 0.058, 0), 0.0128, nickelSilver, 28)); // top cap
      addPart(g, 'valves', cylinderBetween(v3(x, -0.06, 0), v3(x, -0.05, 0), 0.0124, nickelSilver, 28)); // bottom cap
      addPart(g, 'valves', cylinderBetween(v3(x, -0.064, 0), v3(x, -0.06, 0), 0.006, nickelSilver, 16));
      addPart(g, 'valves', cylinderBetween(v3(x, 0.03, 0), v3(x, 0.034, 0), 0.0122, nickelSilver, 28)); // ferrule ring
      // stem + button
      addPart(g, 'buttons', cylinderBetween(v3(x, 0.058, 0), v3(x, 0.08, 0), 0.0024, nickelSilver, 10));
      addPart(g, 'buttons', cylinderBetween(v3(x, 0.08, 0), v3(x, 0.085, 0), 0.0088, nickelSilver, 24));
      addPart(g, 'buttons', cylinderBetween(v3(x, 0.085, 0), v3(x, 0.0862, 0), 0.0074, pearl, 24));
    });
    // Short knuckles joining the valve block to the leadpipe/bell sides
    addPart(g, 'valves', cylinderBetween(v3(VALVE_X[0], 0.012, -0.004), v3(VALVE_X[0], 0.012, -0.02), R * 0.9, brass, 14));
    addPart(g, 'valves', cylinderBetween(v3(VALVE_X[1], -0.028, 0.004), v3(VALVE_X[1], -0.028, 0.018), R * 0.9, brass, 14));

    // ----- 1st valve slide (leadpipe side, pointing forward) -----
    const s1a = 0.008;
    const s1b = -0.02;
    const s1z = LEAD_Z;
    addPart(g, 'slides', tube([
      v3(VALVE_X[0], s1a, -0.008), v3(VALVE_X[0] + 0.012, s1a, s1z), v3(0.08, s1a, s1z),
      v3(0.098, (s1a + s1b) / 2, s1z), v3(0.08, s1b, s1z), v3(VALVE_X[0] + 0.012, s1b, s1z), v3(VALVE_X[0], s1b, -0.008),
    ], R * 0.9, brass, { segments: 80 }));
    addPart(g, 'slides', tube([
      v3(0.07, s1a + 0.006, s1z), v3(0.075, s1a + 0.014, s1z - 0.002), v3(0.085, s1a + 0.014, s1z - 0.002), v3(0.09, s1a + 0.006, s1z),
    ], 0.0016, nickelSilver, { segments: 16 })); // thumb saddle

    // ----- 3rd valve slide (bell side, pointing back) with finger ring -----
    const s3a = -0.005;
    const s3b = -0.022;
    const s3z = BELL_Z + 0.002;
    addPart(g, 'slides', tube([
      v3(VALVE_X[2], s3a, 0.008), v3(VALVE_X[2] - 0.012, s3a, s3z), v3(-0.06, s3a, s3z),
      v3(-0.076, (s3a + s3b) / 2, s3z), v3(-0.06, s3b, s3z), v3(VALVE_X[2] - 0.012, s3b, s3z), v3(VALVE_X[2], s3b, 0.008),
    ], R * 0.9, brass, { segments: 80 }));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.009, 0.0016, 10, 28), nickelSilver);
    ring.position.set(-0.055, s3a + 0.012, s3z + 0.004);
    ring.rotation.y = Math.PI / 2;
    addPart(g, 'slides', ring);

    // ----- Bell section: bottom bow behind the valves, bell pipe, flare -----
    addPart(g, 'bell', tube([
      v3(VALVE_X[0], -0.036, 0.006), v3(-0.05, -0.04, BELL_Z), v3(-0.1, -0.04, BELL_Z),
      v3(-0.122, -0.02, BELL_Z), v3(-0.122, 0.016, BELL_Z), v3(-0.1, TOP_Y, BELL_Z), v3(-0.06, TOP_Y, BELL_Z),
    ], R, brass, { segments: 80 }));
    addPart(g, 'bell', cylinderBetween(v3(-0.061, TOP_Y, BELL_Z), v3(0.131, TOP_Y, BELL_Z), R, brass, 20, R * 1.06));

    const len = 0.2;
    const profile = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      profile.push([R * 1.06 + 0.056 * Math.pow(t, 4.2), t * len]);
    }
    const flare = lathe(profile, brassBell, 64);
    flare.rotation.z = -Math.PI / 2;
    flare.position.set(0.13, TOP_Y, BELL_Z);
    addPart(g, 'bell', flare);
    const rimR = R * 1.06 + 0.056;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(rimR, 0.0022, 12, 72), brass);
    rim.rotation.y = Math.PI / 2;
    rim.position.set(0.13 + len, TOP_Y, BELL_Z);
    addPart(g, 'bell', rim);
    // bell brace to the tuning slide
    addPart(g, 'bell', cylinderBetween(v3(0.2, lowY + 0.006, LEAD_Z + 0.004), v3(0.2, TOP_Y - 0.0085, BELL_Z - 0.004), 0.002, brass, 8));

    return g;
  },
};

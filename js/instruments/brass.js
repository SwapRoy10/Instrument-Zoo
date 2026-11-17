import { buildHorn } from './builders/horn.js';
import { buildTrombone } from './builders/trombone.js';
import { buildLowBrass } from './builders/lowbrass.js';

const BOTH = ['orchestra', 'wind'];

const mouthpiecePart = (extra) => ({
  id: 'mouthpiece', name: 'Mouthpiece', view: [-0.6, 0.3, 1],
  what: 'The silver-plated cup the player buzzes their lips into.',
  why: 'Brass instruments have no reed: the lips are the vibrating part. The cup’s size and depth shape both tone and comfort.',
  fact: extra,
});

export const frenchHorn = {
  id: 'horn', name: 'French Horn', section: 'brass', ensembles: BOTH,
  range: 'B1 – F5 (in F, sounds a fifth lower)', size: '3.7 m of tubing, coiled',
  blurb: 'Nearly four metres of tubing coiled into a circle and ending in a wide bell. The player’s right hand rests inside the bell. Its warm, round tone blends with both brass and woodwinds, so it belongs to both worlds.',
  defaultView: [0.2, 0.25, 1],
  parts: [
    mouthpiecePart('The horn mouthpiece has a deep, funnel-shaped cup, unlike the bowl-shaped cups of the trumpet and trombone.'),
    { id: 'leadpipe', name: 'Leadpipe', view: [-0.4, 0.5, 1], what: 'The first tapered tube, from the mouthpiece to the valves.',
      why: 'Its gradual taper sets much of the horn’s resistance and intonation.', fact: 'Horn players can choose from many interchangeable leadpipes.' },
    { id: 'valves', name: 'Rotary Valves', view: [-0.3, 0.3, 1], what: 'Four rotary valves: three for the fingers and one for the thumb.',
      why: 'Rotary valves turn a drilled rotor instead of pushing a piston. They are quick and smooth for the horn’s legato style.', fact: 'Most orchestral brass outside the trumpets and euphonium uses rotary valves in Germany and Austria.' },
    { id: 'levers', name: 'Levers & Thumb Trigger', view: [-0.8, 0.3, 0.8], what: 'The left-hand finger levers and the thumb trigger that switches the horn between its F and B♭ sides.',
      why: 'A double horn is really two horns sharing one bell: the long F horn for warmth down low, and the shorter B♭ horn for security up high.', fact: 'The double horn was invented in 1897 by Fritz Kruspe and Edmund Gumpert.' },
    { id: 'slides', name: 'Tuning Slides', view: [0.1, 0.8, 1], what: 'U-shaped slides on every valve loop and the main tubing.',
      why: 'Each must be tuned separately because the F and B♭ sides have their own slides.', fact: 'Horn players often remove a slide to empty water mid-concert, sometimes with a dramatic spin of the whole horn.' },
    { id: 'tubing', name: 'Coiled Tubing', view: [0, 0, 1], what: 'The circular wraps of narrow, mostly conical tubing.',
      why: 'The horn’s long, narrow tube lets it play high in its harmonic series, where notes sit close together. That makes it famously slippery to play accurately.', fact: 'The horn descends from hunting horns, coiled so riders could carry them over their shoulder.' },
    { id: 'bell', name: 'Bell', view: [1, 0.2, 0.3], what: 'The wide flare (about 31 cm) that faces backward, away from the audience.',
      why: 'The player’s right hand in the bell adjusts pitch and softens the tone. Pushing the hand fully in creates a buzzy “stopped” sound.', fact: 'Because the bell points backward, horn sections are often placed in front of a wall to reflect the sound.' },
  ],
  build: () => buildHorn(),
};

function tromboneParts(bass) {
  const p = [
    mouthpiecePart(bass ? 'Bass trombone mouthpieces have big, deep cups to fill the larger bore.' : 'Trombone mouthpieces sit between trumpet and tuba sizes in cup diameter.'),
    { id: 'innerslide', name: 'Inner Slide', view: [-0.3, 0.3, 1], what: 'Two fixed nickel tubes on which the outer slide glides.',
      why: 'They must be perfectly straight and parallel. The tiniest dent makes the slide stick.', fact: 'The ends of the inner tubes have slightly wider “stockings” so only a small area touches the outer slide.' },
    { id: 'outerslide', name: 'Outer Slide & Hand Grip', view: [0.2, 0.3, 1], what: 'The moving U-shaped section that the right hand pushes in and out.',
      why: 'Extending the slide lengthens the tube to lower the pitch. There are seven standard positions, each a semitone lower than the last.', fact: 'The trombone can play perfect glissandos because the slide changes pitch continuously.' },
    { id: 'crook', name: 'Slide Crook, Bumper & Water Key', view: [1, 0.2, 0.6], what: 'The U-bend at the far end of the slide, with a rubber bumper and a spit valve.',
      why: 'It turns the air around inside the slide. The water key lets condensation out from its lowest point.', fact: 'The bumper protects the crook if the player bumps the floor or a stand.' },
    { id: 'tuningslide', name: 'Bell Section & Tuning Slide', view: [-1, 0.4, 0.5], what: 'The gooseneck and the tubes running back over the shoulder to the tuning slide.',
      why: 'Pulling the tuning slide adjusts the overall pitch. The counterweight balances the long slide in front.', fact: 'A trombone has roughly 2.7 m of tubing.' },
    { id: 'bell', name: 'Bell', view: [1, 0.3, -0.6], what: `A ${bass ? '9½–10' : '8–8½'}-inch flared bell beside the player’s head.`,
      why: 'It radiates the sound forward and helps set the tone colour.', fact: 'The trombone has existed in nearly its modern form since the 1400s, when it was called the sackbut.' },
  ];
  if (bass) {
    p.push({ id: 'valves', name: 'F & G♭ Valves', view: [-0.4, -0.3, -1], what: 'Two rotary valves with thumb triggers and loops of extra tubing.',
      why: 'They add tube length to fill the gap between the lowest slide position and the pedal notes, and give easier alternative positions.', fact: 'With both valves pressed, the bass trombone can reach a low D below the bass clef.' });
  }
  return p;
}

export const trombone = {
  id: 'trombone', name: 'Trombone', section: 'brass', ensembles: BOTH,
  range: 'E2 – F5', size: '2.7 m of tubing',
  blurb: 'The brass instrument with a slide instead of valves. Moving the slide changes the tube length smoothly, so the trombone can glide between notes. It sounds noble when soft and thunderous at full power.',
  defaultView: [0.25, 0.35, 1],
  parts: tromboneParts(false),
  build: () => buildTrombone({ bass: false }),
};

export const bassTrombone = {
  id: 'basstrombone', name: 'Bass Trombone', section: 'brass', ensembles: BOTH,
  range: 'B♭0 – B♭4 (lowest notes are pedals)', size: '2.7 m of tubing + valve loops',
  blurb: 'A trombone with a wider bore, a bigger bell and two rotary valves that unlock the deep bottom range. It anchors the trombone section and adds weight under the tuba.',
  defaultView: [0.25, 0.35, 1],
  parts: tromboneParts(true),
  build: () => buildTrombone({ bass: true }),
};

function lowBrassParts(tuba) {
  return [
    mouthpiecePart(tuba ? 'A tuba mouthpiece cup can be over 3 cm across, big enough to fit a coin standing on edge.' : 'Euphonium mouthpieces are deep, which helps its famously warm, singing tone.'),
    { id: 'leadpipe', name: 'Leadpipe', view: [-0.6, 0.6, 1], what: 'The tapered tube from mouthpiece to valves.',
      why: 'It shapes how the instrument “slots” onto notes.', fact: 'The leadpipe is the first place corrosion builds up from breath moisture.' },
    { id: 'valves', name: tuba ? 'Valves (4)' : 'Valves & Compensating 4th Valve', view: [-0.2, 0.5, 1],
      what: tuba ? 'Four piston valves: three top-action and a fourth on the side.' : 'Three top pistons plus a fourth valve on the side.',
      why: 'The fourth valve lowers the pitch by a fourth, extending the range down and fixing out-of-tune valve combinations.', fact: tuba ? 'Orchestral tubas are often pitched in C or B♭. Many players own several in different keys.' : 'Compensating systems on professional euphoniums reroute air through extra loops to keep low notes in tune.' },
    { id: 'slides', name: 'Valve Slides', view: [0.2, -0.3, 1], what: 'U-shaped loops of extra tubing attached to each valve.',
      why: 'Each valve sends the air through its slide, making the instrument longer and the note lower.', fact: 'Valve 1 lowers by a tone, 2 by a semitone, 3 by a minor third and 4 by a fourth.' },
    { id: 'tuningslide', name: 'Main Tuning Slide', view: [-1, 0.2, 0.6], what: 'The largest U-shaped slide, usually with a water key.',
      why: 'It adjusts the instrument’s overall pitch.', fact: 'Players warm the instrument with their breath before tuning, because cold brass plays flat.' },
    { id: 'wrap', name: 'Main Tubing (Wrap)', view: [0.3, 0.3, -1], what: 'The long coils of tubing wrapped behind the valves.',
      why: `They fold ${tuba ? 'about 5.5 m' : 'about 2.7 m'} of steadily widening conical tube into a compact shape.`, fact: 'The widening (conical) bore is what gives low brass their round, mellow sound.' },
    { id: 'bow', name: 'Bottom Bow', view: [0.4, -0.5, 1], what: 'The big U-shaped bend at the bottom of the instrument.',
      why: 'It turns the air column up toward the bell. The wide tube here carries the low notes.', fact: 'The guard band around the bow protects it from dents when the instrument is set on the floor.' },
    { id: 'bell', name: 'Bell', view: [0.4, 1, 0.5], what: `A large upward-pointing bell, about ${tuba ? '45–50' : '30'} cm across.`,
      why: 'Pointing up spreads the sound around the hall instead of straight at the audience, which helps it blend.', fact: tuba ? 'The sousaphone is a marching tuba with the bell wrapped around the player to point forward.' : 'In British brass bands the euphonium is a star solo instrument.' },
  ];
}

export const euphonium = {
  id: 'euphonium', name: 'Euphonium', section: 'brass', ensembles: ['wind'],
  range: 'B♭1 – B♭4', size: '2.7 m of tubing',
  blurb: 'The “tenor tuba”: the same pitch as a trombone but with a wide conical bore and valves. Its name means “well-sounding” in Greek, and its rich, singing tone is a highlight of every wind ensemble.',
  defaultView: [0.3, 0.3, 1],
  parts: lowBrassParts(false),
  build: () => buildLowBrass({ tuba: false }),
};

export const tuba = {
  id: 'tuba', name: 'Tuba', section: 'brass', ensembles: BOTH,
  range: 'D1 – F4', size: '5.5 m of tubing (BB♭)',
  blurb: 'The largest and lowest brass instrument: over five metres of tubing ending in a giant upturned bell. It is the bass voice of both the orchestra’s brass section and the wind ensemble.',
  defaultView: [0.3, 0.3, 1],
  parts: lowBrassParts(true),
  build: () => buildLowBrass({ tuba: true }),
};

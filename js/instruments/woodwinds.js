import { buildFlute } from './builders/flute.js';
import { buildOboe } from './builders/oboe.js';
import { buildBassoon, buildContrabassoon } from './builders/bassoon.js';

const BOTH = ['orchestra', 'wind'];

// ---------------------------------------------------------------- Flutes
function fluteParts(piccolo) {
  const p = [
    { id: 'crown', name: 'Crown & Head Cork', view: [1, 0.3, 0.5],
      what: 'The decorative cap at the closed end of the head joint, with a cork stopper hidden just inside.',
      why: 'The cork’s exact position tunes the high register. If it creeps even a few millimetres, the top notes go out of tune with the low ones.',
      fact: 'Flutists check the cork using the line marked on the end of their cleaning rod.' },
    { id: 'headjoint', name: 'Head Joint', view: [0.3, 0.5, 1],
      what: piccolo ? 'The top section, with a slightly conical bore that narrows toward the crown.' : 'The top section holding the embouchure hole. Its bore tapers gently toward the crown.',
      why: 'It is where the sound is made, so it has the biggest effect on tone. Many professionals pair their flute with a separately bought, hand-cut head joint.',
      fact: piccolo ? 'Piccolo head joints come in silver or wood. Wood gives a sweeter sound and silver projects better outdoors.' : 'A handmade head joint can cost more than an entire student flute.' },
    { id: 'lipplate', name: 'Lip Plate & Embouchure Hole', view: [0.2, 1, 0.5],
      what: 'The curved plate the lower lip rests on, with an oval hole cut through to the tube.',
      why: 'The flute has no reed. The player blows a thin stream of air across the hole’s far edge, and the air flips in and out of the tube hundreds of times per second, like blowing across a bottle.',
      fact: 'This makes the flute an “edge-tone” or “air-reed” instrument, and the oldest family of instruments: bone flutes over 40,000 years old have been found.' },
    { id: 'body', name: 'Body', view: [0, 0.4, 1],
      what: piccolo ? 'The main section, often made of dense grenadilla wood.' : 'The long central tube holding most of the tone holes, usually solid or plated silver.',
      why: 'The tone holes along it change the effective length of the air column. Opening holes shortens the column and raises the pitch.',
      fact: piccolo ? 'At about 32 cm, the piccolo is half the length of the flute and plays an octave higher.' : 'Even though it is made of metal, the flute counts as a woodwind because of how it makes sound, not what it is made of.' },
    { id: 'keys', name: 'Keys & Pads', view: [0, 1, 0.6],
      what: piccolo ? 'Closed key cups with soft pads that seal the tone holes.' : 'Key cups with soft pads. Five of them are “open-hole” keys with a ring the finger also covers.',
      why: 'The Boehm key system lets ten fingers control about 16 tone holes, each placed at the acoustically correct spot rather than where a finger happens to reach.',
      fact: piccolo ? 'Piccolos use the same fingerings as the flute, so flutists can switch between them in one concert.' : 'Open holes let advanced players bend pitch and play quarter-tones by half-covering the ring.' },
    { id: 'mechanism', name: 'Rods, Posts & Springs', view: [0, 0.2, 1],
      what: 'Steel rods running along the body on small soldered posts, with needle springs that return each key.',
      why: 'The rods link keys together, so one finger can close several holes at once. The springs keep everything quick and light under the fingers.',
      fact: 'Theobald Boehm, a goldsmith and flutist, designed this system in 1847, and it is still the standard.' },
  ];
  if (!piccolo) {
    p.push({ id: 'footjoint', name: 'Foot Joint', view: [-0.6, 0.5, 1],
      what: 'The short bottom section with keys and rollers for the right little finger.',
      why: 'It extends the range down to low C (or B on a “B foot”). The rollers let the little finger slide quickly between keys.',
      fact: 'A B foot adds a key that also helps the very highest note, C7, come out more easily.' });
  }
  return p;
}

export const piccolo = {
  id: 'piccolo', name: 'Piccolo', section: 'woodwinds', ensembles: BOTH,
  range: 'D5 – C8 (sounds an octave above written)', size: '32 cm long',
  blurb: 'The highest voice of the orchestra and band: a half-sized flute pitched an octave higher. It can glitter above the full ensemble or pipe like a bird, and it cuts through any texture.',
  defaultView: [0.25, 0.55, 1],
  parts: fluteParts(true),
  build: () => buildFlute({ L: 0.32, R: 0.0078, foot: false, woodBody: true }),
};

export const flute = {
  id: 'flute', name: 'Flute', section: 'woodwinds', ensembles: BOTH,
  range: 'C4 – D7', size: '67 cm long',
  blurb: 'A silver tube held sideways and played by blowing across a hole. There is no reed: the player’s airstream splitting on an edge creates the tone. That gives it an agile, airy voice, often the woodwind section’s melody leader.',
  defaultView: [0.25, 0.55, 1],
  parts: fluteParts(false),
  build: () => buildFlute({ L: 0.67, R: 0.0095, foot: true }),
};

// ---------------------------------------------------------------- Oboes
function oboeParts(cor) {
  const p = [
    { id: 'reed', name: 'Double Reed', view: [0.4, 0.3, 1],
      what: 'Two thin blades of cane tied onto a cork-covered metal tube (the staple) with coloured thread.',
      why: 'The blades vibrate against each other like lips buzzing, opening and closing hundreds of times a second. The reed shapes the sound more than anything else.',
      fact: 'Most professional oboists make their own reeds by hand, often spending hours each week shaving cane with a knife.' },
    { id: 'topjoint', name: 'Top Joint', view: [0.3, 0, 1],
      what: 'The upper section of the conical grenadilla body, played by the left hand.',
      why: 'The narrow, cone-shaped bore makes the oboe overblow at the octave and gives its rich, reedy overtones.',
      fact: 'The bore at the top is only about 3 mm wide, narrower than a drinking straw.' },
    { id: 'lowerjoint', name: 'Lower Joint', view: [0.3, 0, 1],
      what: 'The middle section, played by the right hand.',
      why: 'It holds the right-hand tone holes and the long rods for the low notes.',
      fact: 'Grenadilla (African blackwood) is so dense it sinks in water.' },
    { id: 'bell', name: cor ? 'Bulb Bell (Liebesfuss)' : 'Bell', view: [0.4, 0.4, 1],
      what: cor ? 'A pear-shaped bell with a narrow opening.' : 'The gently flared bottom section.',
      why: cor ? 'The bulb gives the English horn its veiled, melancholy tone and softens its lowest notes.' : 'It helps project the lowest notes and evens out the tone between registers.',
      fact: cor ? 'The bulb is called Liebesfuss, “love foot”. The same shape appears on the oboe d’amore.' : 'The orchestra tunes to the oboe’s A because its pitch is stable and its tone easy to hear.' },
    { id: 'keys', name: 'Keys & Rods', view: [0.5, 0.1, 1],
      what: 'A dense web of silver keys, rings and rods, with a half-hole plate for the first finger.',
      why: 'The oboe needs many alternate fingerings to play smoothly and in tune. Its keywork is one of the most complex of any woodwind.',
      fact: 'A professional “full conservatoire” oboe has around 45 separate pieces of keywork.' },
    { id: 'octave', name: 'Octave Keys & Thumb Plate', view: [-0.3, 0.2, -1],
      what: 'Small vent keys on the back of the top joint, worked by the left thumb.',
      why: 'Opening a tiny vent makes the air column jump to its next harmonic, so the same fingering plays an octave higher.',
      fact: 'Some oboes have automatic octave keys that switch vents for you.' },
  ];
  if (cor) {
    p.push({ id: 'bocal', name: 'Bocal', view: [1, 0.3, 0.2],
      what: 'A curved metal tube between the reed and the top of the body.',
      why: 'The English horn is too long to hold straight up to the mouth. The bent bocal angles the reed comfortably to the lips and forms part of the bore.',
      fact: 'Players own several bocals of slightly different lengths to fine-tune pitch and response.' });
  }
  return p;
}

export const oboe = {
  id: 'oboe', name: 'Oboe', section: 'woodwinds', ensembles: BOTH,
  range: 'B♭3 – A6', size: '65 cm long',
  blurb: 'A conical wooden tube sounded by a double reed. Its piercing, plaintive tone carries over the whole orchestra, which is why the oboe gives the A that everyone tunes to.',
  defaultView: [0.5, 0.15, 1],
  parts: oboeParts(false),
  build: () => buildOboe({ cor: false }),
};

export const englishHorn = {
  id: 'englishhorn', name: 'English Horn', section: 'woodwinds', ensembles: BOTH,
  range: 'E3 – C6 (in F, sounds a fifth lower)', size: '81 cm long',
  blurb: 'The alto oboe: longer, lower and darker, with a pear-shaped bell and a bent metal bocal. Despite the name, it is neither English nor a horn. It is famous for slow, haunting solos.',
  defaultView: [0.5, 0.15, 1],
  parts: oboeParts(true),
  build: () => buildOboe({ cor: true }),
};

// ---------------------------------------------------------------- Bassoons
export const bassoon = {
  id: 'bassoon', name: 'Bassoon', section: 'woodwinds', ensembles: BOTH,
  range: 'B♭1 – E5', size: '1.34 m tall (2.5 m of tube)',
  blurb: 'Two and a half metres of conical maple tube folded in half. It is the bass of the woodwind family, capable of noble melodies, gruff humour and surprisingly high, singing notes.',
  defaultView: [0.6, 0.2, 1],
  parts: [
    { id: 'reed', name: 'Double Reed', view: [0.3, 0.3, 1],
      what: 'A wide double reed bound with thread and three brass wires.',
      why: 'Its two cane blades vibrate together to start the sound. The wires let the player adjust how open the tip is.',
      fact: 'A bassoon reed is about 5.5 cm long, much larger than an oboe’s.' },
    { id: 'bocal', name: 'Bocal', view: [0.6, 0.4, 1],
      what: 'The thin, S-shaped metal crook that carries the reed.',
      why: 'It is the narrowest part of the bore and affects pitch and response a lot. A tiny “whisper key” vent on it helps low notes speak softly.',
      fact: 'Bocals are numbered by length (0 to 3). Players choose one to match the hall’s pitch.' },
    { id: 'wingjoint', name: 'Wing Joint', view: [0.3, 0.1, 1],
      what: 'The thinner upward tube with a thickened “wing” of wood where the left-hand finger holes are drilled.',
      why: 'The holes are drilled at a steep angle through the thick wing, so they can sit where the fingers reach but open into the bore at the right acoustic spot.',
      fact: 'Bassoons still use open finger holes for several notes, an old-fashioned feature most woodwinds have replaced with keys.' },
    { id: 'bootjoint', name: 'Boot Joint', view: [0.6, 0.2, 1],
      what: 'The heavy bottom section, containing two parallel bores joined by a metal U-tube.',
      why: 'This is where the air column turns around and heads back up, folding the long instrument in half.',
      fact: 'The U-bend collects condensation, and players drain it often during rehearsals.' },
    { id: 'longjoint', name: 'Long (Bass) Joint', view: [0.6, 0.1, -0.6],
      what: 'The tall tube rising behind the wing joint.',
      why: 'It holds the left-thumb keys for the lowest notes. The thumbs work about 13 keys between them on the bassoon.',
      fact: 'The left thumb alone operates nine keys on a modern Heckel-system bassoon.' },
    { id: 'belljoint', name: 'Bell Joint', view: [0.3, 0.4, 1],
      what: 'The top section with its light-coloured ring, ending in an open bell that points up.',
      why: 'It completes the long bore down to low B♭, the lowest note.',
      fact: 'Players sometimes play low A by stuffing a cardboard tube into the bell.' },
    { id: 'keys', name: 'Keys & Rods', view: [-0.6, 0.2, -1],
      what: 'Nickel-plated keys and long rods spread over all four joints.',
      why: 'They let the hands reach tone holes spread over a very long tube.',
      fact: 'There are two main systems: Heckel (German), used almost everywhere, and Buffet (French), now rare.' },
    { id: 'handrest', name: 'Hand Rest & Seat Strap', view: [-0.5, 0.2, 1],
      what: 'A small crutch for the right hand and a ring for the seat strap that takes the instrument’s weight.',
      why: 'They let the player hold a heavy, awkward instrument while keeping the fingers free.',
      fact: 'Bassoonists can also play standing with a harness and neck strap.' },
  ],
  build: () => buildBassoon(),
};

export const contrabassoon = {
  id: 'contrabassoon', name: 'Contrabassoon', section: 'woodwinds', ensembles: BOTH,
  range: 'B♭0 – G4 (sounds an octave lower)', size: '1.45 m tall (5.5 m of tube)',
  blurb: 'An octave below the bassoon, with over five metres of tube folded four times. It reaches some of the lowest notes in the orchestra, a deep rumble you often feel more than hear.',
  defaultView: [0.45, 0.25, 1],
  parts: [
    { id: 'reed', name: 'Double Reed', view: [0.3, 0.3, 1], what: 'An extra-large bassoon-style double reed.',
      why: 'Wide blades are needed to set such a long air column vibrating.', fact: 'A contra reed is so big that the player’s whole lips cover it like a small mouthpiece.' },
    { id: 'bocal', name: 'Bocal', view: [0.5, 0.6, 1], what: 'A long, coiled metal crook.',
      why: 'It brings the reed down to a playable height and angle for a seated player.', fact: 'Contrabassoonists usually sit, and the instrument rests on an endpin.' },
    { id: 'body', name: 'Wooden Body Tubes', view: [0, 0.2, 1], what: 'Four parallel maple tubes that widen as the bore grows.',
      why: 'Folding the 5.5 m bore into parallel sections makes the instrument compact enough to hold.', fact: 'The design comes from Wilhelm Heckel in the 1870s. Earlier contras were notoriously unreliable.' },
    { id: 'bends', name: 'U-Bends', view: [0.3, -0.5, 1], what: 'Metal U-shaped joints connecting each wooden tube to the next.',
      why: 'They turn the air column around at each fold without leaks.', fact: 'Each bend also works as a drainage point for condensation.' },
    { id: 'bell', name: 'Metal Bell', view: [1, 0.2, 0.6], what: 'A metal bell that turns down toward the floor.',
      why: 'Pointing the bell down lets the low notes radiate off the stage floor.', fact: 'Some older contras had the bell pointing up, like a bassoon’s.' },
    { id: 'keys', name: 'Keys & Rods', view: [0, 0.3, 1], what: 'Large keys and long rods that cover holes the fingers could never reach.',
      why: 'Tone holes on such a long tube are spread far apart, so most are worked by mechanical linkages.', fact: 'The contra has relatively few keys for its size, so it is lighter than it looks.' },
    { id: 'endpin', name: 'Endpin', view: [0.4, -0.4, 1], what: 'An adjustable spike under the instrument.',
      why: 'It carries the instrument’s weight so the player can sit comfortably.', fact: 'Beethoven used the contrabassoon to double the basses in his Fifth and Ninth Symphonies.' },
  ],
  build: () => buildContrabassoon(),
};

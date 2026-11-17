import { buildClarinet, buildBassClarinet } from './builders/clarinet.js';
import { buildSax } from './builders/sax.js';

// ---------------------------------------------------------------- Clarinets
function clarinetParts(kind) {
  const bass = kind === 'bass';
  const p = [
    { id: 'mouthpiece', name: 'Mouthpiece', view: bass ? [0.5, 0.5, -1] : [0.4, 0.3, 1],
      what: 'A tapered beak of hard black rubber with a flat “table” where the reed sits.',
      why: 'The gap between the reed and the mouthpiece’s curved “facing” sets how resistant and how bright the clarinet feels.',
      fact: 'Mouthpiece facings are finished by hand to hundredths of a millimetre.' },
    { id: 'reed', name: 'Reed & Ligature', view: bass ? [0.4, -0.6, -1] : [0.2, 0.3, -1],
      what: 'A single thin cane reed, clamped to the mouthpiece by a metal ligature with two screws.',
      why: 'The reed beats against the mouthpiece like a valve, letting puffs of air into the tube. The ligature must hold it firmly without choking its vibration.',
      fact: 'Reeds are cut from Arundo donax, a giant cane grown mostly in southern France.' },
  ];
  if (bass) {
    p.push(
      { id: 'neck', name: 'Neck', view: [1, 0.4, 0.2], what: 'A curved metal tube joining the mouthpiece to the body.',
        why: 'It angles the mouthpiece to the player’s mouth while the long body rests on the floor.', fact: 'Its curve lets the player sit upright with the instrument in front.' },
      { id: 'upperjoint', name: 'Upper Body', view: [0.3, 0, 1], what: 'The upper half of the long grenadilla body.',
        why: 'It holds the left-hand plateau keys. The bore is about twice as wide as a soprano clarinet’s.', fact: 'Most bass clarinets are pitched in B♭, an octave below the regular clarinet.' },
      { id: 'lowerjoint', name: 'Lower Body', view: [0.3, 0, 1], what: 'The lower half, worked by the right hand.',
        why: 'It holds the right-hand keys and the long rods to the low-note keys.', fact: 'Professional models extend down to low C, sounding B♭1.' },
      { id: 'bell', name: 'Upturned Bell', view: [0.7, 0.4, 1], what: 'A metal U-bend and flared bell that curves up and forward, like a saxophone’s.',
        why: 'Turning the bell up keeps a long instrument short enough to play seated and sends the sound out to the audience.', fact: 'Players sometimes rest the bell against their leg to adjust its angle.' },
      { id: 'keys', name: 'Plateau Keys', view: [0.4, 0.1, 1], what: 'Large covered key cups instead of open rings.',
        why: 'The tone holes are too big for fingertips to seal, so padded cups cover them.', fact: 'The bass clarinet has two register vents that switch automatically or by thumb.' },
      { id: 'register', name: 'Register Keys', view: [-0.2, 0.3, -1], what: 'Thumb-operated vent keys on the back and on the neck.',
        why: 'Opening a vent makes the clarinet jump up a twelfth, an octave plus a fifth, into its upper register.', fact: 'The clarinet overblows at the twelfth, not the octave, because its cylindrical bore acts like a pipe closed at one end.' },
      { id: 'thumbrest', name: 'Thumb Rest', view: [-0.3, 0.2, -1], what: 'A metal rest for the right thumb.',
        why: 'It steadies the instrument while the fingers move.', fact: 'Most of the weight sits on the floor peg instead.' },
      { id: 'peg', name: 'Floor Peg', view: [0.6, -0.3, 1], what: 'An adjustable spike that rests on the floor.',
        why: 'It carries the weight so the player can sit and play comfortably.', fact: 'Some players use a neck strap instead, or as well.' }
    );
    return p;
  }
  p.push(
    { id: 'barrel', name: 'Barrel', view: [0.4, 0.2, 1], what: 'A short, slightly bulging wooden section between mouthpiece and upper joint.',
      why: 'Pulling it out a little lowers the pitch. Players swap barrels of different lengths to match the band’s tuning.', fact: 'Barrel shapes vary a lot, and many players carry two or three.' },
    { id: 'upperjoint', name: 'Upper Joint', view: [0.3, 0, 1], what: 'The section played by the left hand.',
      why: 'It holds the left-hand rings, the trill keys and the register key.', fact: 'The clarinet’s cylindrical bore makes it overblow at the twelfth instead of the octave.' },
    { id: 'lowerjoint', name: 'Lower Joint', view: [0.3, 0, 1], what: 'The section played by the right hand.',
      why: 'It holds the right-hand rings, the pinky keys and the thumb rest.', fact: 'The tenon corks between joints are greased so the joints slide apart easily.' },
    { id: 'bell', name: 'Bell', view: [0.3, 0.4, 1], what: 'The flared bottom section.',
      why: 'It helps the lowest notes speak and evens the tone across registers.', fact: 'Only the very lowest notes actually come out of the bell. Most sound leaves through the open tone holes.' },
    { id: 'keys', name: 'Rings & Keys', view: [0.4, 0.1, 1], what: 'Metal rings around open tone holes, plus side and pinky keys linked by rods.',
      why: 'The rings close extra holes automatically when the finger covers the main hole (the Boehm system adapted to the clarinet).', fact: 'The standard clarinet key system was developed in Paris around 1840 by Klosé and Buffet.' },
    { id: 'register', name: 'Thumb Hole & Register Key', view: [-0.2, 0.3, -1], what: 'The left-thumb ring on the back and the small register key just above it.',
      why: 'Pressing the register key opens a tiny vent that shifts the clarinet up a twelfth into its brighter upper range.', fact: 'Moving smoothly between registers is called “crossing the break”, a classic challenge for beginners.' },
    { id: 'thumbrest', name: 'Thumb Rest', view: [-0.3, 0.1, -1], what: 'The metal hook for the right thumb on the back of the lower joint.',
      why: 'It carries the weight of the instrument so the fingers can move freely.', fact: 'Many players add a neck strap here to save their thumb.' }
  );
  return p;
}

export const ebClarinet = {
  id: 'ebclarinet', name: 'E♭ Clarinet', section: 'woodwinds', ensembles: ['wind'],
  range: 'G3 – B♭6 (in E♭, sounds a minor third higher)', size: '49 cm long',
  blurb: 'The small, high soprano clarinet: about three quarters the size of the regular B♭. It is a fixture of wind bands and appears in big orchestral works by Berlioz, Mahler and Stravinsky. Its bright, piercing voice cuts through anything.',
  defaultView: [0.5, 0.15, 1],
  parts: clarinetParts('eb'),
  build: () => buildClarinet({ scale: 0.74 }),
};

export const clarinet = {
  id: 'clarinet', name: 'B♭ Clarinet', section: 'woodwinds', ensembles: ['orchestra', 'wind'],
  range: 'D3 – B♭6 (in B♭, sounds a tone lower)', size: '66 cm long',
  blurb: 'A cylindrical tube of African blackwood sounded by a single cane reed. It has the widest range of the woodwinds, from a dark, woody low register to a brilliant top. It forms the backbone of the wind ensemble, like violins in an orchestra.',
  defaultView: [0.5, 0.15, 1],
  parts: clarinetParts('bb'),
  build: () => buildClarinet({ scale: 1 }),
};

export const bassClarinet = {
  id: 'bassclarinet', name: 'Bass Clarinet', section: 'woodwinds', ensembles: ['orchestra', 'wind'],
  range: 'B♭1 – F5 (sounding, low-C model)', size: '1 m tall',
  blurb: 'An octave below the B♭ clarinet, with a curved metal neck and an upturned bell. It has a velvety, mysterious low register and a surprising agility.',
  defaultView: [0.6, 0.2, 1],
  parts: clarinetParts('bass'),
  build: () => buildBassClarinet(),
};

// ---------------------------------------------------------------- Saxophones
function saxParts(kind) {
  return [
    { id: 'mouthpiece', name: 'Mouthpiece', view: [-0.6, 0.3, 1],
      what: 'A black rubber or metal mouthpiece similar to a clarinet’s.',
      why: 'Its inner shape (chamber and baffle) changes the sound dramatically, from mellow classical to bright, edgy jazz.',
      fact: 'Jazz players often use metal mouthpieces for a louder, brighter sound.' },
    { id: 'reed', name: 'Reed & Ligature', view: [-0.6, -0.4, 1],
      what: 'A single cane reed held on with a ligature.',
      why: 'Like the clarinet’s, the reed sets the air column vibrating. Reed strength (thickness) is matched to the player and the mouthpiece.',
      fact: kind === 'bari' ? 'Baritone reeds are so wide they look like small paddles.' : 'Reed strengths are numbered from about 1.5 (soft) to 5 (hard).' },
    { id: 'neck', name: kind === 'bari' ? 'Neck & Loop' : 'Neck', view: [0.2, 0.6, 1],
      what: kind === 'bari' ? 'A curved neck preceded by the bari’s famous loop of tubing at the top.' : 'The detachable curved tube at the top of the body.',
      why: kind === 'bari' ? 'The loop folds extra tube length so the bari stays playable at its size.' : 'It brings the mouthpiece to the player and has a big effect on tone and tuning.',
      fact: kind === 'tenor' ? 'The tenor’s neck has a characteristic hump that alto necks lack.' : 'Necks are made in different metals (brass, silver, even gold-plated) to vary the tone.' },
    { id: 'octave', name: 'Octave Key', view: [-0.4, 0.5, 0.6],
      what: 'A thumb key on the back linked to vents on the neck and upper body.',
      why: 'It opens a small vent that makes the sax jump up an octave, using the same fingerings.',
      fact: 'The mechanism switches automatically between two vents depending on the note.' },
    { id: 'body', name: 'Body', view: [0.4, 0.1, 1],
      what: 'The long conical brass tube, widening steadily from top to bottom.',
      why: 'Its conical bore makes the saxophone overblow at the octave like an oboe, with a powerful, flexible tone.',
      fact: 'Adolphe Sax patented the saxophone in 1846, aiming to bridge woodwinds and brass.' },
    { id: 'pearls', name: 'Pearl Keys & Touches', view: [0.4, 0.2, 1],
      what: 'The main finger buttons inlaid with mother-of-pearl, plus palm, side and pinky keys.',
      why: 'The fingers rest on the pearls, which close large pad cups through a linkage. The extra touches reach high and low notes.',
      fact: 'Fingerings are nearly identical across all saxophones, so players switch easily between alto, tenor and bari.' },
    { id: 'padcups', name: 'Pad Cups & Tone Holes', view: [0.7, 0.1, 0.8],
      what: 'Large leather-padded cups covering tone holes all the way down the body.',
      why: 'Saxophone tone holes are huge, so every one needs a key. This is why the sax has over 20 tone holes but very few fingered directly.',
      fact: 'Many pads have a metal or plastic disc in the centre (a resonator) to brighten the sound.' },
    { id: 'bow', name: 'Bow', view: [0.4, -0.3, 1],
      what: 'The U-shaped bend at the bottom.',
      why: 'It turns the conical tube back up so the instrument stays a manageable length.',
      fact: kind === 'bari' ? 'Even folded, a bari sax weighs about 6–7 kg.' : 'The bow is a separate piece soldered on, often reinforced with a ring guard.' },
    { id: 'bell', name: 'Bell', view: [0.8, 0.4, 0.6],
      what: 'The flared top of the upward-turned tube, often richly engraved.',
      why: 'It projects the lowest notes. The low B and B♭ keys sit on the bell itself.',
      fact: 'Engraving on the bell is decorative, but makers argue about whether it changes the tone.' },
    { id: 'guards', name: 'Key Guards', view: [0.6, -0.2, 1],
      what: 'Metal straps arching over the big low keys.',
      why: 'They protect the large key cups from knocks and bending.',
      fact: 'Bending a key guard can stop a low note from sounding at all, a common band-room accident.' },
    { id: 'thumbrest', name: 'Thumb Rest & Strap Ring', view: [-0.3, 0.2, -1],
      what: 'A rest for the right thumb and a ring on the back for the neck strap.',
      why: 'The strap carries the weight, and the thumb rest steadies the instrument.',
      fact: kind === 'bari' ? 'Many bari players use a harness or a floor stand.' : 'Strap height changes the angle of the mouthpiece and so the sound.' },
  ];
}

export const altoSax = {
  id: 'altosax', name: 'Alto Saxophone', section: 'woodwinds', ensembles: ['wind'],
  range: 'D♭3 – A♭5 (in E♭, sounds a sixth lower)', size: '70 cm tall',
  blurb: 'A brass body with woodwind keys and a single reed. It blends the warmth of a clarinet with the power of brass. The alto is the most common saxophone and leads the sax section in wind ensembles.',
  defaultView: [0.4, 0.15, 1],
  parts: saxParts('alto'),
  build: () => buildSax({ kind: 'alto', scale: 1 }),
};

export const tenorSax = {
  id: 'tenorsax', name: 'Tenor Saxophone', section: 'woodwinds', ensembles: ['wind'],
  range: 'A♭2 – E5 (in B♭, sounds a ninth lower)', size: '85 cm tall',
  blurb: 'Larger and lower than the alto, with a humped neck. Its husky, vocal tone made it the voice of jazz legends, and in wind ensembles it sits between the altos and the bari.',
  defaultView: [0.4, 0.15, 1],
  parts: saxParts('tenor'),
  build: () => buildSax({ kind: 'tenor', scale: 1.27 }),
};

export const bariSax = {
  id: 'barisax', name: 'Baritone Saxophone', section: 'woodwinds', ensembles: ['wind'],
  range: 'C2 – A♭4 (in E♭, low-A model)', size: '1.1 m tall',
  blurb: 'The big bass of the saxophone family, with a distinctive loop of tubing at its top. It gives the wind ensemble a punchy, buzzing low end.',
  defaultView: [0.4, 0.15, 1],
  parts: saxParts('bari'),
  build: () => buildSax({ kind: 'bari', scale: 1.62 }),
};

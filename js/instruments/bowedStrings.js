import { buildBowed } from './builders/bowed.js';

// Shared anatomy text for the violin family, with per-instrument overrides.
function bowedParts(kind) {
  const isLow = kind === 'cello' || kind === 'bass';
  const tuning = {
    violin: 'Four strings tuned in fifths: G–D–A–E, from lowest to highest.',
    viola: 'Four strings tuned in fifths: C–G–D–A. That is a fifth below the violin, sharing three of its strings.',
    cello: 'Four strings tuned in fifths: C–G–D–A, exactly an octave below the viola.',
    bass: 'Four (sometimes five) thick steel strings tuned in fourths: E–A–D–G, the lowest of the string section.',
  }[kind];
  const stringFact = {
    violin: 'The open A is the note the whole orchestra tunes to, usually 440–443 Hz.',
    viola: 'Viola music is written mostly in alto clef, a clef almost no other instrument uses.',
    cello: 'The cello’s C string vibrates about 65 times per second, two octaves below middle C.',
    bass: 'Tuning in fourths instead of fifths means less stretching for the hand across the bass’s huge fingerboard.',
  }[kind];

  const parts = [
    { id: 'scroll', name: 'Scroll', view: [1, 0.3, 0.4],
      what: 'The carved spiral at the very top of the instrument.',
      why: 'It is mostly decorative. It finishes the pegbox and shows off the maker’s carving skill. Experts can often identify a maker from the style of the scroll alone.',
      fact: kind === 'bass' ? 'Some old basses have a carved lion’s head instead of a scroll.' : 'The scroll is carved from the same block of maple as the neck and pegbox.' },
    { id: 'pegs', name: kind === 'bass' ? 'Machine Heads' : 'Pegbox & Pegs', view: [1, 0.2, 0.8],
      what: kind === 'bass'
        ? 'Brass worm-gear tuners mounted on the sides of the pegbox, like a guitar’s.'
        : 'A hollow box below the scroll, with four tapered ebony pegs pushed through its sides.',
      why: kind === 'bass'
        ? 'Bass strings are so thick and tight that friction pegs could not hold them. The gears let a player tune precisely with a small twist.'
        : 'Each string winds around a peg. The pegs are held only by friction in their tapered holes, so tuning means turning and gently pushing at the same moment.',
      fact: kind === 'bass' ? 'The bass is the only member of the violin family that normally uses geared tuners.' : 'A peg that slips in dry winter weather is a classic string player’s headache.' },
    { id: 'neck', name: 'Neck', view: [1, 0, 0.3],
      what: 'The slender maple arm between the pegbox and the body.',
      why: 'The left hand slides along it to change position. Its backward angle sets how high the strings sit above the body, which affects both playability and tone.',
      fact: isLow ? 'Players use their thumb in “thumb position” high up the neck to reach the highest notes.' : 'Most old Italian violins were given longer, more steeply angled necks in the 1800s to project in bigger halls.' },
    { id: 'fingerboard', name: 'Fingerboard', view: [0.3, 0.1, 1],
      what: 'A long, curved strip of ebony glued on top of the neck.',
      why: 'Players press the strings onto it to change pitch. It has no frets, so every note is placed by ear. That also makes slides and expressive vibrato easy.',
      fact: 'It is curved across its width so the bow can play each string on its own.' },
    { id: 'top', name: 'Top Plate (Belly)', view: [0, 0.05, 1],
      what: 'The arched spruce front of the body, carved by hand.',
      why: 'Like a wooden drum skin, it vibrates and radiates most of the sound. The shape of the arch and the thickness graduations largely decide the tone.',
      fact: kind === 'violin' ? 'A finished violin top weighs only about 60–70 grams.' : 'Under the top, a long spruce bar (the bass bar) runs beneath the lowest string’s bridge foot to spread its vibrations.' },
    { id: 'fholes', name: 'F-holes', view: [0.1, 0.25, 1],
      what: 'The two “f”-shaped openings cut into the top on either side of the bridge.',
      why: 'They let the body’s air resonate to boost the low notes, and free the centre of the top so it can rock under the bridge. Through one you can glimpse the soundpost, a small dowel wedged between top and back.',
      fact: 'In French the soundpost is called âme, meaning “soul”. Moving it by a millimetre noticeably changes the sound.' },
    { id: 'bridge', name: 'Bridge', view: [0.5, 0.6, 1],
      what: 'A thin, carved piece of maple standing on the top. Only string pressure holds it there.',
      why: 'It carries the strings’ vibration into the body. Its cut-outs tune it to act as a filter that shapes the brightness of the sound.',
      fact: 'A mute clipped onto the bridge adds weight and produces the soft, veiled sound marked con sordino.' },
    { id: 'strings', name: 'Strings', view: [0.4, 0.25, 1], what: tuning,
      why: 'Bowing or plucking them starts the sound. The core material (gut, synthetic or steel) and the metal winding decide how warm or brilliant they sound.',
      fact: stringFact },
    { id: 'tailpiece', name: kind === 'violin' || kind === 'viola' ? 'Tailpiece & Fine Tuner' : 'Tailpiece & Fine Tuners', view: [0.3, 0.6, 1],
      what: 'The black anchor at the bottom where the strings attach, sometimes with small metal fine tuners.',
      why: 'It holds the far ends of the strings, tied by a loop to the end button so it floats freely. Fine tuners allow tiny pitch adjustments without touching the pegs.',
      fact: 'Changing the tailpiece’s weight is a real tool luthiers use to adjust an instrument’s sound.' },
  ];

  if (isLow) {
    parts.push({ id: 'endpin', name: 'Endpin', view: [0.6, -0.2, 1],
      what: 'A retractable metal spike that slides out of the bottom of the body.',
      why: kind === 'cello'
        ? 'It rests the cello on the floor at the right height, so the seated player can lean it against their body.'
        : 'It holds the bass at the right height whether the player stands or sits on a tall stool.',
      fact: kind === 'cello' ? 'Cellists held the instrument between their calves until the endpin became standard in the late 1800s.' : 'Players put the spike in a small rubber “stop” or a rock-stop strap so it does not slide on a polished stage.' });
  } else {
    parts.push({ id: 'chinrest', name: 'Chinrest', view: [-0.6, 0.4, 1],
      what: 'A curved ebony cup clamped to the lower edge of the body.',
      why: 'The player holds the instrument with their jaw here, freeing the left hand to move, without muffling the top.',
      fact: 'The chinrest was invented around 1820 by the violinist and composer Louis Spohr.' });
  }

  parts.push(
    { id: 'ribs', name: 'Ribs & Back', view: [1, 0.25, -1],
      what: 'The thin bent maple sides (ribs) and the flamed maple back.',
      why: 'Together with the top they form the resonating box. The inward “C-bouts” at the waist give the bow room to reach the outer strings.',
      fact: kind === 'bass' ? 'Many basses have a flat back and sloping shoulders inherited from the viol family, not the violin.' : 'The shimmering stripes on the back are called “flame”, from maple cut so its wavy grain catches the light.' },
    { id: 'bow', name: 'Bow', view: [1, 0.1, 0.6],
      what: `A pernambuco stick strung with ${isLow ? 'about 200–250' : 'about 150–200'} horsehairs, with a sliding frog at the handle.`,
      why: 'Rosin on the hair grabs the string, drags it sideways, then lets it slip back, hundreds of times a second (“stick-slip”). That sustains the note as long as the bow keeps moving.',
      fact: kind === 'bass'
        ? 'Bassists choose between two bow styles: the French bow (held like a cello bow) and the German bow, with a taller frog held like a saw.'
        : 'The modern bow was perfected around 1785 by the Parisian maker François Tourte.' }
  );
  return parts;
}

export const violin = {
  id: 'violin', name: 'Violin', section: 'strings', ensembles: ['orchestra'],
  range: 'G3 – A7', size: '60 cm long',
  blurb: 'The smallest and highest voice of the string section. Rosin-coated horsehair grips the string and makes it sing, and the arched wooden body turns that motion into a bright, expressive tone. Orchestras usually have a large section split into firsts and seconds.',
  defaultView: [0.6, 0.25, 1],
  parts: bowedParts('violin'),
  build: () => buildBowed({ scale: 1, chinrest: true, fineTuners: 1, bowLength: 0.75, varnish: 0xeab08c }),
};

export const viola = {
  id: 'viola', name: 'Viola', section: 'strings', ensembles: ['orchestra'],
  range: 'C3 – E6', size: '66–72 cm long',
  blurb: 'Slightly larger than the violin and tuned a fifth lower. Its darker, husky voice fills the middle of the string section and often carries the inner harmony. Violas are not standardised in size: players pick one that fits their arms.',
  defaultView: [0.6, 0.25, 1],
  parts: bowedParts('viola'),
  build: () => buildBowed({ scale: 1.16, ribDepth: 0.034, chinrest: true, fineTuners: 1, bowLength: 0.74, varnish: 0xe0a07e, stringKinds: ['silverWound', 'silverWound', 'gut', 'gut'] }),
};

export const cello = {
  id: 'cello', name: 'Cello', section: 'strings', ensembles: ['orchestra'],
  range: 'C2 – C6', size: '1.2 m tall',
  blurb: 'Played seated, with the instrument resting on an endpin between the knees. Its range is close to the human voice, from a deep bass to a singing tenor. That makes it a favourite for both basslines and soaring melodies.',
  defaultView: [0.6, 0.2, 1],
  parts: bowedParts('cello'),
  build: () => buildBowed({ scale: 2.12, ribDepth: 0.057, endpin: 0.14, fineTuners: 4, bridgeHeight: 0.043, bowLength: 0.71, varnish: 0xc9806a, stringKinds: ['silverWound', 'silverWound', 'steel', 'steel'] }),
};

export const doubleBass = {
  id: 'bass', name: 'Double Bass', section: 'strings', ensembles: ['orchestra', 'wind'],
  range: 'E1 – G4 (sounds an octave lower than written)', size: '1.8 m tall',
  blurb: 'The giant of the string family and the foundation of the orchestra’s harmony. It is also the one string instrument in a standard wind ensemble. With sloping shoulders and geared tuners, it keeps traits of the older viol family.',
  defaultView: [0.6, 0.2, 1],
  parts: bowedParts('bass'),
  build: () => buildBowed({ scale: 3.12, ribDepth: 0.064, endpin: 0.08, fineTuners: 0, bridgeHeight: 0.05, machineHeads: true, bassShape: true, bowLength: 0.7, varnish: 0xa86a52, stringKinds: ['silverWound', 'silverWound', 'steel', 'steel'] }),
};

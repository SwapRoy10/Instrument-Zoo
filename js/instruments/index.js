// Registry of every animal in the zoo.
// Each instrument module exports { id, name, section, ensembles, range, size, blurb, parts[], build() }.
import { violin, viola, cello, doubleBass } from './bowedStrings.js';
import harp from './harp.js';
import guitar from './guitar.js';
import { piccolo, flute, oboe, englishHorn, bassoon, contrabassoon } from './woodwinds.js';
import { ebClarinet, clarinet, bassClarinet, altoSax, tenorSax, bariSax } from './singleReeds.js';
import { frenchHorn, trombone, bassTrombone, euphonium, tuba } from './brass.js';
import trumpet from './trumpet.js';
import snare from './snare.js';
import piano from './piano.js';

export const SECTIONS = [
  { id: 'strings', name: 'Strings' },
  { id: 'woodwinds', name: 'Woodwinds' },
  { id: 'brass', name: 'Brass' },
  { id: 'percussion', name: 'Percussion' },
  { id: 'keyboards', name: 'Keyboards' },
];

export const ENSEMBLES = {
  all: 'All Instruments',
  orchestra: 'Orchestra',
  wind: 'Wind Ensemble',
};

// Listed in score order within each section.
export const instruments = [
  violin, viola, cello, doubleBass, harp, guitar,
  piccolo, flute, oboe, englishHorn, ebClarinet, clarinet, bassClarinet, bassoon, contrabassoon, altoSax, tenorSax, bariSax,
  frenchHorn, trumpet, trombone, bassTrombone, euphonium, tuba,
  snare,
  piano,
];

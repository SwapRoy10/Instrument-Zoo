// Registry of every animal in the zoo. To add an instrument, create a module
// exporting { id, name, emoji, family, blurb, parts[], build() } and list it here.
import guitar from './guitar.js';
import violin from './violin.js';
import trumpet from './trumpet.js';
import piano from './piano.js';
import snare from './snare.js';

export const instruments = [guitar, violin, trumpet, piano, snare];

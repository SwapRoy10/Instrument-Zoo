# Instrument Zoo

Interactive website featuring 3D models of various instruments for education purposes.

**Live site:** https://swaproy10.github.io/Instrument-Zoo/

Explore every instrument of the **symphony orchestra** and the **wind ensemble** in 3D. Pick an instrument, rotate and zoom it freely, or choose a part from the **Anatomy** panel. The camera flies to that part, highlights it, and explains what it is, why it matters, and a fun fact.

## The exhibits (31)

| Section | Instruments |
| --- | --- |
| Strings | Violin, Viola, Cello, Double Bass, Concert Harp, Acoustic Guitar (guest exhibit) |
| Woodwinds | Piccolo, Flute, Oboe, English Horn, E♭ Clarinet, B♭ Clarinet, Bass Clarinet, Bassoon, Contrabassoon, Alto / Tenor / Baritone Saxophone |
| Brass | French Horn, Trumpet, Trombone, Bass Trombone, Euphonium, Tuba |
| Percussion | Timpani, Snare Drum, Bass Drum, Glockenspiel, Xylophone, Marimba |
| Keyboards | Grand Piano |

Use the tabs at the top (**All Instruments**, or a single family: **Strings**, **Woodwinds**, **Brass**, **Percussion**, **Keyboards**) to choose a line-up, then move through it with the faded preview cards on either side of the stage (or the ← / → keys). The clicked preview grows into the spotlight while the current instrument shrinks into the opposite slot, then the live 3D model fades in over the picture. The **Catalogue** lists the whole line-up for jumping straight to an instrument.

## Run it locally

```sh
npm start          # or: node server.js
```

Then open http://localhost:5173. There is nothing to install. Three.js (r170) loads from a CDN, and the page has to be served over HTTP because it uses ES modules.

## Controls

| Action | How |
| --- | --- |
| Rotate / zoom / pan | Drag / scroll or pinch / right-drag |
| Select a part | Click it in 3D or in the Anatomy panel |
| Step through parts | ↑ / ↓ |
| Previous / next instrument | ← / → or the side previews |
| Open the catalogue | C |
| Back to overview | Esc |
| Fade everything else | **Isolate** (or I) |

Every view has a shareable link, such as `#/bassoon/bocal` or `#/piano/hammers`.

## How it's built

```
index.html                  page shell + import map for three.js
css/style.css               classical paper theme, section colours, transitions, responsive layouts
js/main.js                  ensemble tabs, carousel transitions, previews, catalogue, notes, deep links
js/viewer.js                3D stage: studio lighting, framing, camera flights, picking, thumbnails
js/lib/helpers.js           geometry helpers (tapered tubes, bells, keywork, outlines, instancing)
js/lib/textures.js          procedural tileable textures (wood grain, flamed maple, metal smudges, felt)
js/lib/materials.js         PBR material library with triplanar mapping
js/instruments/builders/    parametric model builders (bowed strings, flute, oboe, clarinet, bassoon, sax, horn, trombone, low brass)
js/instruments/*.js         instrument definitions and anatomy text
```

The models are built entirely in code, with no model files to download. Realism comes from:

- physically based materials: clear-coated lacquer, polished and brushed metals, iridescent pearl, felt sheen;
- procedural textures painted at load time and mapped triplanar in object space, so grain always runs along each part;
- environment lighting with Khronos PBR Neutral tone mapping;
- soft shadows plus a contact shadow under each instrument.

The preview and catalogue thumbnails are rendered on the fly by a second off-screen renderer and cached in the browser.

## Adding an instrument

Create a module exporting:

```js
export default {
  id: 'celesta', name: 'Celesta', section: 'keyboards', ensembles: ['orchestra'],
  range: 'C4 – C8', size: '1 m wide',
  blurb: 'One-paragraph intro…',
  defaultView: [0.5, 0.3, 1],          // camera direction for the overview
  parts: [
    {
      id: 'hammers', name: 'Hammers',
      what: '…', why: '…', fact: '…',
      view: [0.3, 0.4, 1],             // camera direction when focused (optional)
      ghost: ['case'],                 // parts to fade while this one is selected (optional)
    },
  ],
  build() {
    const g = new THREE.Group();
    addPart(g, 'hammers', someMesh);   // tag meshes with their part id
    return g;
  },
};
```

Then add it to `js/instruments/index.js`. Model in metres; the viewer centres and frames the model automatically.

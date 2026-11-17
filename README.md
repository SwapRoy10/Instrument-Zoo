# Instrument Zoo

Interactive website featuring 3D models of various instruments for education purposes.

**Live site:** https://swaproy10.github.io/Instrument-Zoo/

Explore musical instruments in 3D. Pick an instrument, then rotate and zoom it freely, or choose a part from the **Anatomy** sidebar. The camera flies to that part, highlights it, and shows what it is, why it matters, and a fun fact.

Current exhibits: acoustic guitar, violin (with bow), trumpet, grand piano and snare drum.

## Run it

The page uses ES modules, so it has to be served over HTTP (opening `index.html` directly won't work).

```sh
npm start          # or: node server.js
```

Then open http://localhost:5173. There is nothing to install. Three.js loads from a CDN, so you need an internet connection.

## Controls

| Action | How |
| --- | --- |
| Rotate | Drag |
| Zoom | Scroll / pinch |
| Pan | Right-drag (or two-finger drag) |
| Select a part | Click it in 3D or in the sidebar |
| Step through parts | ↑ / ↓ |
| Back to overview | Esc or **Overview** |
| Fade everything else | **Isolate** (or press I) |

Every view has a shareable link, e.g. `#/violin/bridge` or `#/piano/hammers`.

## How it's built

```
index.html             page shell + import map for three.js
css/style.css          layout and theme (light & dark)
js/main.js             sidebar, tabs, deep links, keyboard
js/viewer.js           3D stage: lighting, orbit controls, camera flights, picking, highlighting
js/lib/helpers.js      geometry helpers (tubes, lathes, instanced strings, outlines…)
js/instruments/*.js    one module per instrument
```

The models are built in code from simple shapes, so there are no model files to download. Each mesh is tagged with the anatomy part it belongs to.

## Adding an instrument

Create `js/instruments/<name>.js` exporting:

```js
export default {
  id: 'flute', name: 'Flute', emoji: '🪈', family: 'Woodwind · Edge-blown',
  blurb: 'One-paragraph intro…',
  defaultView: [0.5, 0.3, 1],          // camera direction for the overview
  parts: [
    {
      id: 'headjoint', name: 'Head Joint',
      what: '…', why: '…', fact: '…',
      view: [0.3, 0.4, 1],             // camera direction when focused (optional)
      ghost: ['otherPartId'],          // parts to fade while this one is selected (optional)
    },
  ],
  build() {
    const g = new THREE.Group();
    addPart(g, 'headjoint', someMesh); // tag meshes with their part id
    return g;
  },
};
```

Then add it to `js/instruments/index.js`. Model in metres; the viewer centres and frames the model automatically.

To use a real `.glb` model instead, load it with three.js's `GLTFLoader` and tag its meshes by name the same way. `build()` is synchronous today, so `Viewer.load` would need a small change to `await` it.

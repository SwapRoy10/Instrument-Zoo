// Procedural, tileable textures painted on a canvas: wood grain, metal smudges, felt.
// Everything is generated once and cached, so models can share them freely.
import * as THREE from 'three';

const cache = new Map();

// ---- Tileable value noise -------------------------------------------------
function hash(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
const smooth = (t) => t * t * (3 - 2 * t);

/** Value noise on a lattice that wraps every (periodX, periodY) cells, so the result tiles. */
function noise(x, y, periodX, periodY, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const wx = (i) => ((i % periodX) + periodX) % periodX;
  const wy = (i) => ((i % periodY) + periodY) % periodY;
  const a = hash(wx(xi), wy(yi), seed);
  const b = hash(wx(xi + 1), wy(yi), seed);
  const c = hash(wx(xi), wy(yi + 1), seed);
  const d = hash(wx(xi + 1), wy(yi + 1), seed);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

/** Fractal noise in [0,1] with separate integer frequencies per axis; u,v in [0,1) tile seamlessly. */
function fbm2(u, v, fx, fy, octaves, seed) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const ax = fx << o;
    const ay = fy << o;
    sum += noise(u * ax, v * ay, ax, ay, seed + o * 17) * amp;
    norm += amp;
    amp *= 0.5;
  }
  return sum / norm;
}
const fbm = (u, v, freq, octaves, seed) => fbm2(u, v, freq, freq, octaves, seed);

function makeCanvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function toTexture(canvas, color) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

const hex = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const mix = (a, b, t) => a + (b - a) * t;

/**
 * Wood: grain lines run along the texture's V axis (so along an object's local Y
 * when applied triplanar). Returns { map, roughnessMap }.
 *  light/dark   colours of early/late wood
 *  rings        grain lines across one tile (integer keeps it tileable)
 *  wobble       how much the lines meander
 *  sharp        how crisp the dark late-wood lines are
 *  flame        strength of cross-grain "flame" stripes (maple)
 *  pores        density of dark pore flecks (open-grain woods)
 */
export function woodTexture(key, opts) {
  if (cache.has(key)) return cache.get(key);
  const {
    light = 0xd9a865, dark = 0x8a5a2b, rings = 18, wobble = 0.35, sharp = 3,
    flame = 0, flameFreq = 22, pores = 0, seed = 1, size = 512,
  } = opts;
  const L = hex(light);
  const D = hex(dark);
  const color = makeCanvas(size);
  const rough = makeCanvas(size);
  const cctx = color.getContext('2d');
  const rctx = rough.getContext('2d');
  const cimg = cctx.createImageData(size, size);
  const rimg = rctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const warp = (fbm(u, v, 3, 3, seed) - 0.5) * wobble;
      // jitter scaled to the grain spacing so straight-grained woods stay straight
      const fine = ((fbm2(u, v, 24, 6, 2, seed + 5) - 0.5) * 0.6) / rings;
      const g = (u + warp + fine) * rings;
      const ring = Math.pow(0.5 + 0.5 * Math.cos((g - Math.floor(g)) * Math.PI * 2), sharp);
      let t = ring * 0.85 + fbm(u, v, 8, 2, seed + 9) * 0.15;
      let bright = 1;
      if (flame) {
        const fl = Math.sin((v * flameFreq + fbm(u, v, 4, 2, seed + 3) * 2.5) * Math.PI * 2);
        bright += fl * flame * 0.22;
      }
      let pore = 0;
      if (pores) {
        const p = hash(x, y, seed + 77);
        if (p < pores * (0.4 + ring)) pore = 0.35;
      }
      t = Math.min(1, t + pore);
      const i = (y * size + x) * 4;
      for (let k = 0; k < 3; k++) cimg.data[i + k] = Math.max(0, Math.min(255, mix(L[k], D[k], t) * bright));
      cimg.data[i + 3] = 255;
      const r = 150 + t * 70 + pore * 120;
      rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = Math.min(255, r);
      rimg.data[i + 3] = 255;
    }
  }
  cctx.putImageData(cimg, 0, 0);
  rctx.putImageData(rimg, 0, 0);
  const out = { map: toTexture(color, true), roughnessMap: toTexture(rough, false) };
  cache.set(key, out);
  return out;
}

/** Roughness variation for polished metal: soft smudges + fine hairline scratches. */
export function smudgeTexture(key = 'smudge', { brushed = false, size = 512, seed = 4 } = {}) {
  if (cache.has(key)) return cache.get(key);
  const c = makeCanvas(size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      let n = brushed
        ? fbm2(u, v, 64, 1, 2, seed) * 0.6 + fbm(u, v, 4, 3, seed + 1) * 0.4
        : fbm(u, v, 3, 4, seed) * 0.75 + fbm(u, v, 32, 2, seed + 2) * 0.25;
      n = Math.pow(n, 1.6);
      const val = 150 + n * 105;
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = val;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // hairline scratches
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = '#fff';
  for (let s = 0; s < 140; s++) {
    const x = hash(s, 1, seed) * size;
    const y = hash(s, 2, seed) * size;
    const a = brushed ? Math.PI / 2 + (hash(s, 3, seed) - 0.5) * 0.05 : hash(s, 3, seed) * Math.PI;
    const len = 10 + hash(s, 4, seed) * 60;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  const out = toTexture(c, false);
  cache.set(key, out);
  return out;
}

/** Fine fibrous noise for felt, cork, drum-head coating, cane. Returns { map, roughnessMap }. */
export function grainNoiseTexture(key, { base = 0xffffff, contrast = 0.12, freq = 48, streak = 1, seed = 11, size = 256 } = {}) {
  if (cache.has(key)) return cache.get(key);
  const B = hex(base);
  const c = makeCanvas(size);
  const r = makeCanvas(size);
  const cctx = c.getContext('2d');
  const rctx = r.getContext('2d');
  const cimg = cctx.createImageData(size, size);
  const rimg = rctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const n = fbm2(u, v, freq, Math.max(1, Math.round(freq / streak)), 3, seed) * 0.7 + hash(x, y, seed) * 0.3;
      const f = 1 + (n - 0.5) * 2 * contrast;
      const i = (y * size + x) * 4;
      for (let k = 0; k < 3; k++) cimg.data[i + k] = Math.min(255, B[k] * f);
      cimg.data[i + 3] = 255;
      rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = 200 + n * 55;
      rimg.data[i + 3] = 255;
    }
  }
  cctx.putImageData(cimg, 0, 0);
  rctx.putImageData(rimg, 0, 0);
  const out = { map: toTexture(c, true), roughnessMap: toTexture(r, false) };
  cache.set(key, out);
  return out;
}

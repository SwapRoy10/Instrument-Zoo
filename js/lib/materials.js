// Physically based material library. Wood and metal use procedural textures mapped
// *triplanar* in object space, so wood grain runs along each part's local Y axis and
// keeps a consistent real-world scale regardless of the geometry's own UVs.
import * as THREE from 'three';
import { woodTexture, smudgeTexture, grainNoiseTexture } from './textures.js';

// ---- Triplanar patch --------------------------------------------------------
const TRI_COMMON = /* glsl */ `
uniform float uTriScale;
varying vec3 vTriPos;
varying vec3 vTriNormal;
vec4 triSample(sampler2D t) {
  vec3 w = pow(abs(normalize(vTriNormal)), vec3(4.0));
  w /= (w.x + w.y + w.z + 1e-5);
  vec3 p = vTriPos * uTriScale;
  return texture2D(t, p.zy) * w.x + texture2D(t, p.xz) * w.y + texture2D(t, p.xy) * w.z;
}`;

/** (Re)attach the triplanar shader patch described by material.userData.triplanar. */
export function applyTriplanar(m) {
  const tri = m.userData?.triplanar;
  if (!tri) return m;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTriScale = { value: tri.scale };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTriPos;\nvarying vec3 vTriNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTriPos = position;\nvTriNormal = normal;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${TRI_COMMON}`)
      .replace('#include <map_fragment>', '#ifdef USE_MAP\n  diffuseColor *= triSample( map );\n#endif')
      .replace(
        '#include <roughnessmap_fragment>',
        'float roughnessFactor = roughness;\n#ifdef USE_ROUGHNESSMAP\n  roughnessFactor *= triSample( roughnessMap ).g;\n#endif'
      );
  };
  m.customProgramCacheKey = () => 'triplanar-v1';
  return m;
}

function physical(params, triScale) {
  const m = new THREE.MeshPhysicalMaterial(params);
  if (triScale) {
    m.userData.triplanar = { scale: triScale };
    applyTriplanar(m);
  }
  return m;
}

// ---- Woods ----------------------------------------------------------------------
const WOODS = {
  spruce: { light: 0xe6bf80, dark: 0xb88446, rings: 44, wobble: 0.012, sharp: 7, seed: 3 },
  maple: { light: 0xd59a5c, dark: 0x8c5426, rings: 14, wobble: 0.22, sharp: 2, flame: 1, flameFreq: 16, seed: 5 },
  mapleNatural: { light: 0xead3a6, dark: 0xcfa874, rings: 14, wobble: 0.28, sharp: 2, flame: 0.55, flameFreq: 18, seed: 6 },
  rosewood: { light: 0x74361b, dark: 0x2b130a, rings: 22, wobble: 0.45, sharp: 1.6, pores: 0.02, seed: 7 },
  mahogany: { light: 0x93492a, dark: 0x5c2611, rings: 16, wobble: 0.14, sharp: 2, pores: 0.03, seed: 8 },
  ebony: { light: 0x2e2724, dark: 0x0d0a09, rings: 26, wobble: 0.3, sharp: 2, seed: 9 },
  grenadilla: { light: 0x3d2b22, dark: 0x110b09, rings: 36, wobble: 0.18, sharp: 2.4, seed: 10 },
  bassoon: { light: 0x9c4a24, dark: 0x5a210e, rings: 10, wobble: 0.2, sharp: 1.6, flame: 0.45, flameFreq: 14, seed: 12 },
  hickory: { light: 0xeed6a8, dark: 0xc79c63, rings: 20, wobble: 0.15, sharp: 3, pores: 0.01, seed: 13 },
  harp: { light: 0xe6bf86, dark: 0xb07c42, rings: 12, wobble: 0.3, sharp: 2, flame: 0.4, seed: 14 },
  cane: { light: 0xead09a, dark: 0xd2ae6a, rings: 60, wobble: 0.04, sharp: 4, seed: 15 },
};

/**
 * Wood material. `tint` multiplies the texture (use it for varnish colour).
 * `scale` = texture tiles per metre in object space.
 */
export function wood(kind, { scale = 5, tint = 0xffffff, roughness = 0.6, clearcoat = 0.5, clearcoatRoughness = 0.18, side } = {}) {
  const tex = woodTexture(`wood-${kind}`, WOODS[kind] || WOODS.maple);
  return physical({
    color: tint, map: tex.map, roughnessMap: tex.roughnessMap, roughness,
    clearcoat, clearcoatRoughness, side: side ?? THREE.FrontSide,
  }, scale);
}

// ---- Metals -----------------------------------------------------------------------
const METALS = {
  brass: { color: 0xe9bd62, roughness: 0.2, clearcoat: 0.7 },          // lacquered yellow brass
  goldBrass: { color: 0xf0c978, roughness: 0.2, clearcoat: 0.7 },
  rawBrass: { color: 0xc99a4b, roughness: 0.38, clearcoat: 0 },
  silver: { color: 0xf3f3f1, roughness: 0.14, clearcoat: 0 },
  nickel: { color: 0xdcd9d2, roughness: 0.22, clearcoat: 0 },
  chrome: { color: 0xffffff, roughness: 0.08, clearcoat: 0 },
  gold: { color: 0xf4c55a, roughness: 0.26, clearcoat: 0.3 },
  copper: { color: 0xd0804a, roughness: 0.32, clearcoat: 0 },
  steel: { color: 0xc9ccd0, roughness: 0.3, clearcoat: 0 },
  darkSteel: { color: 0x8f9298, roughness: 0.35, clearcoat: 0 },
};

export function metal(kind = 'brass', { side, brushed = false, scale = 6 } = {}) {
  const p = METALS[kind] || METALS.brass;
  const m = physical({
    color: p.color, metalness: 1, roughness: p.roughness * 1.35,
    roughnessMap: smudgeTexture(brushed ? 'brushed' : 'smudge', { brushed }),
    clearcoat: p.clearcoat, clearcoatRoughness: 0.06,
    anisotropy: brushed ? 0.6 : 0,
    side: side ?? THREE.FrontSide,
  }, scale);
  return m;
}

// ---- Finishes, plastics, soft goods -----------------------------------------------
export const lacquer = (color, { roughness = 0.3, side } = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness, clearcoat: 1, clearcoatRoughness: 0.03, side: side ?? THREE.FrontSide });

export const plastic = (color, roughness = 0.35, extra = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness, clearcoat: 0.3, clearcoatRoughness: 0.2, ...extra });

export const rubber = (color = 0x1b1b1b) => new THREE.MeshStandardMaterial({ color, roughness: 0.85 });

export const matte = (color, roughness = 0.9) => new THREE.MeshStandardMaterial({ color, roughness });

export function felt(color = 0xf0e8d6) {
  const tex = grainNoiseTexture('felt', { base: 0xffffff, contrast: 0.18, freq: 64 });
  return physical({ color, map: tex.map, roughness: 1, sheen: 1, sheenRoughness: 0.8, sheenColor: new THREE.Color(color).multiplyScalar(0.6) }, 40);
}

export function cork() {
  const tex = grainNoiseTexture('cork', { base: 0xb48a5c, contrast: 0.35, freq: 32 });
  return physical({ color: 0xffffff, map: tex.map, roughness: 0.95 }, 30);
}

/** Leather key pads (woodwinds). */
export function pad() {
  const tex = grainNoiseTexture('pad', { base: 0xd8b98a, contrast: 0.12, freq: 48 });
  return physical({ color: 0xffffff, map: tex.map, roughness: 0.75 }, 60);
}

export function coatedHead() {
  const tex = grainNoiseTexture('coated', { base: 0xf3efe6, contrast: 0.08, freq: 96 });
  return physical({ color: 0xffffff, map: tex.map, roughnessMap: tex.roughnessMap, roughness: 0.85 }, 8);
}

export function cane() {
  return wood('cane', { scale: 30, roughness: 0.55, clearcoat: 0.2 });
}

export const pearl = () =>
  new THREE.MeshPhysicalMaterial({ color: 0xf6f2ea, roughness: 0.18, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 600], clearcoat: 1 });

export const horsehair = () =>
  new THREE.MeshPhysicalMaterial({ color: 0xf2ede2, roughness: 0.7, sheen: 1, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.4 });

/** Strings: wound (metallic) or gut/synthetic. */
export const stringMat = (kind = 'steel') => {
  const map = {
    steel: { color: 0xd6d8da, metalness: 1, roughness: 0.22 },
    bronze: { color: 0xcf9a5c, metalness: 1, roughness: 0.3 },
    copper: { color: 0xc27842, metalness: 1, roughness: 0.3 },
    silverWound: { color: 0xc8c8c8, metalness: 1, roughness: 0.32 },
    gut: { color: 0xd8c7a0, metalness: 0, roughness: 0.45 },
    red: { color: 0xb3242b, metalness: 0, roughness: 0.4 },
    navy: { color: 0x1d2a55, metalness: 0, roughness: 0.4 },
  };
  return new THREE.MeshPhysicalMaterial(map[kind] || map.steel);
};

export const dark = () => new THREE.MeshStandardMaterial({ color: 0x050403, roughness: 1 });

// Small geometry helpers shared by every instrument model.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const UP = new THREE.Vector3(0, 1, 0);

/** Standard PBR material with sensible defaults. */
export function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...opts });
}

/** Physical material (clearcoat etc.) for lacquered wood and polished brass. */
export function pmat(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.4, metalness: 0, ...opts });
}

/** Tag every mesh inside `obj` as belonging to anatomy part `partId`. */
export function tag(obj, partId) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.userData.partId = partId;
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return obj;
}

/** Add `obj` to `parent`, tagged as `partId`. Returns obj. */
export function addPart(parent, partId, obj) {
  parent.add(tag(obj, partId));
  return obj;
}

export const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const v2 = (x, y) => new THREE.Vector2(x, y);

/** Cylinder spanning point a -> b. rA is the radius at a, rB at b. */
export function cylinderBetween(a, b, rA, material, segments = 12, rB = rA) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(rB, rA, len, segments, 1);
  const m = new THREE.Mesh(geo, material);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(UP, dir.normalize());
  return m;
}

/** Many thin cylinders in one draw call. segs: [{a, b, r}] */
export function instancedCylinders(segs, material, radialSegments = 6) {
  const geo = new THREE.CylinderGeometry(1, 1, 1, radialSegments, 1);
  const mesh = new THREE.InstancedMesh(geo, material, segs.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  segs.forEach(({ a, b, r }, i) => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    pos.copy(a).addScaledVector(dir, 0.5);
    q.setFromUnitVectors(UP, dir.normalize());
    scl.set(r, len, r);
    m4.compose(pos, q, scl);
    mesh.setMatrixAt(i, m4);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  return mesh;
}

/** Many boxes in one draw call. items: [{pos: Vector3, size: [w,h,d], rotX?}] */
export function instancedBoxes(items, material) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.InstancedMesh(geo, material, items.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  items.forEach(({ pos, size, rotX = 0 }, i) => {
    q.setFromEuler(e.set(rotX, 0, 0));
    m4.compose(pos, q, new THREE.Vector3(...size));
    mesh.setMatrixAt(i, m4);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  return mesh;
}

/** Tube through a list of Vector3 points. */
export function tube(points, radius, material, { closed = false, segments = 64, radial = 12 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal');
  return new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, radial, closed), material);
}

/** Surface of revolution around local +Y from a [radius, y] profile. */
export function lathe(profile, material, segments = 48) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.Mesh(new THREE.LatheGeometry(pts, segments), material);
}

export function roundedBox(w, h, d, radius, material, segments = 3) {
  const r = Math.min(radius, w / 2, h / 2, d / 2) * 0.999;
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, segments, r), material);
}

/** Smooth closed outline through 2D control points ([x,y] pairs). */
export function smoothOutline(points, samples = 220) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y]) => new THREE.Vector3(x, y, 0)),
    true,
    'centripetal'
  );
  return curve.getSpacedPoints(samples).slice(0, -1).map((p) => new THREE.Vector2(p.x, p.y));
}

/** Mirror the right half of a symmetric outline (bottom -> top, x >= 0) into a full CCW loop. */
export function mirrorOutline(rightHalf) {
  const left = rightHalf
    .slice(1, -1)
    .reverse()
    .map(([x, y]) => [-x, y]);
  return [...rightHalf, ...left];
}

/** Offset a closed polygon inward by distance d. */
export function offsetPolygon(pts, d) {
  const n = pts.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    area += p.x * q.y - q.x * p.y;
  }
  const sign = area > 0 ? 1 : -1;
  return pts.map((p, i) => {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const t = new THREE.Vector2().subVectors(next, prev).normalize();
    return new THREE.Vector2(p.x - t.y * d * sign, p.y + t.x * d * sign);
  });
}

/** A closed tube tracing a 2D outline at height z (good for bindings and edges). */
export function outlineTube(pts2, z, radius, material) {
  const pts = pts2.filter((_, i) => i % 2 === 0).map((p) => new THREE.Vector3(p.x, p.y, z));
  return tube(pts, radius, material, { closed: true, segments: 240, radial: 6 });
}

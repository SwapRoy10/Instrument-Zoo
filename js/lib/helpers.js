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

/**
 * Tube whose radius varies along a curve: radiusAt(t) with t in [0,1].
 * Normals account for the taper so flaring bells shade correctly.
 */
export function taperedTubeGeometry(curve, radiusAt, tubular = 120, radial = 24) {
  const frames = curve.computeFrenetFrames(tubular, false);
  const length = curve.getLength();
  const pos = [];
  const nor = [];
  const uvs = [];
  const idx = [];
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  const T = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    curve.getPointAt(t, P);
    const r = radiusAt(t);
    const e = 0.5 / tubular;
    const slope = (radiusAt(Math.min(1, t + e)) - radiusAt(Math.max(0, t - e))) / (((Math.min(1, t + e) - Math.max(0, t - e)) * length) || 1);
    const cosA = 1 / Math.sqrt(1 + slope * slope);
    const sinA = slope * cosA;
    const n = frames.normals[i];
    const b = frames.binormals[i];
    T.copy(frames.tangents[i]);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const s = Math.sin(a);
      const c = -Math.cos(a);
      N.set(c * n.x + s * b.x, c * n.y + s * b.y, c * n.z + s * b.z).normalize();
      pos.push(P.x + r * N.x, P.y + r * N.y, P.z + r * N.z);
      nor.push(N.x * cosA - T.x * sinA, N.y * cosA - T.y * sinA, N.z * cosA - T.z * sinA);
      uvs.push(t, j / radial);
    }
  }
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = (i + 1) * (radial + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  return g;
}

/** The [t0, t1] arc-length slice of another curve, re-parameterised to [0, 1]. */
export class SubCurve extends THREE.Curve {
  constructor(curve, t0, t1) {
    super();
    this.curve = curve;
    this.t0 = t0;
    this.t1 = t1;
  }
  getPoint(u, target = new THREE.Vector3()) {
    return this.curve.getPointAt(this.t0 + u * (this.t1 - this.t0), target);
  }
}

/** Tapered tube over a slice of a curve; radiusAt takes the *global* t of the parent curve. */
export function taperedSlice(curve, t0, t1, radiusAt, material, tubular = 80, radial = 24) {
  const sub = new SubCurve(curve, t0, t1);
  return new THREE.Mesh(taperedTubeGeometry(sub, (u) => radiusAt(t0 + u * (t1 - t0)), tubular, radial), material);
}

/** Convenience: tapered tube mesh through points. */
export function taperedTube(points, radiusAt, material, { tubular = 120, radial = 24, curve } = {}) {
  const c = curve || new THREE.CatmullRomCurve3(points, false, 'centripetal');
  return new THREE.Mesh(taperedTubeGeometry(c, typeof radiusAt === 'number' ? () => radiusAt : radiusAt, tubular, radial), material);
}

/** Bell flare radius: narrow r0 widening to r1 with an exponential-ish flare (higher p = later flare). */
export const flare = (r0, r1, p = 4) => (t) => r0 + (r1 - r0) * Math.pow(t, p);

/** A torus rim placed at the end of a curve, facing along its tangent. */
export function rimAt(curve, radius, tubeR, material, t = 1) {
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, tubeR, 12, 72), material);
  rim.position.copy(curve.getPointAt(t));
  rim.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), curve.getTangentAt(t));
  return rim;
}

// ---- Woodwind keywork (bodies stand along +Y; angle 0 = +X, PI/2 = +Z / front) ----

/** Point on the surface of a vertical body of radius r at height y and angle a. */
export const around = (r, y, a) => new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);

/**
 * Orient an object on a vertical body at angle a: local +Y points radially outward,
 * local +X runs around the body (tangent) and local +Z runs up the body (+Y world).
 */
export function faceOut(obj, a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const m = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(-s, 0, c),
    new THREE.Vector3(c, 0, s),
    new THREE.Vector3(0, 1, 0)
  );
  obj.quaternion.setFromRotationMatrix(m);
  return obj;
}

/** Domed key cup with a leather pad; optional open ring (French flute style) or pearl touch. */
export function keyCup(radius, metalMat, { padMat, open = false, pearlMat, height = 0.0035 } = {}) {
  const g = new THREE.Group();
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.02, height, 28), metalMat);
  cup.position.y = height / 2;
  g.add(cup);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), metalMat);
  dome.scale.y = 0.28;
  dome.position.y = height;
  g.add(dome);
  if (padMat) {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.96, radius * 0.96, 0.0012, 24), padMat);
    pad.position.y = -0.0004;
    g.add(pad);
  }
  if (open) {
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.38, radius * 0.38, height * 3, 20), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 }));
    hole.position.y = height;
    g.add(hole);
  }
  if (pearlMat) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.55, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), pearlMat);
    p.scale.y = 0.35;
    p.position.y = height + radius * 0.27;
    g.add(p);
  }
  return g;
}

/** Ring key: a metal ring around an open tone hole (clarinet/oboe). */
export function ringKey(radius, metalMat) {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.16, 8, 28), metalMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.002;
  g.add(ring);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.8, 20), new THREE.MeshStandardMaterial({ color: 0x050403, roughness: 1 }));
  hole.rotation.x = -Math.PI / 2;
  hole.position.y = 0.0003;
  g.add(hole);
  return g;
}

/** A tone hole (dark disc) flush on the body. */
export function toneHole(radius) {
  const hole = new THREE.Mesh(new THREE.CircleGeometry(radius, 20), new THREE.MeshStandardMaterial({ color: 0x050403, roughness: 1 }));
  hole.rotation.x = -Math.PI / 2;
  hole.position.y = 0.0004;
  const g = new THREE.Group();
  g.add(hole);
  return g;
}

/** Place a keywork piece on a vertical body: radius r(y) function or number. */
export function mount(parent, obj, bodyR, y, a, lift = 0) {
  const r = typeof bodyR === 'function' ? bodyR(y) : bodyR;
  obj.position.copy(around(r + lift, y, a));
  faceOut(obj, a);
  parent.add(obj);
  return obj;
}

/** Key rod running parallel to a vertical body from y0 to y1 at angle a, with posts at both ends. */
export function rodWithPosts(bodyR, y0, y1, a, metalMat, { offset = 0.0045, rodR = 0.0011, posts = 2 } = {}) {
  const g = new THREE.Group();
  const r0 = typeof bodyR === 'function' ? bodyR(y0) : bodyR;
  const r1 = typeof bodyR === 'function' ? bodyR(y1) : bodyR;
  g.add(cylinderBetween(around(r0 + offset, y0, a), around(r1 + offset, y1, a), rodR, metalMat, 8));
  for (let i = 0; i < posts; i++) {
    const y = posts === 1 ? (y0 + y1) / 2 : y0 + ((y1 - y0) * i) / (posts - 1);
    const r = typeof bodyR === 'function' ? bodyR(y) : bodyR;
    g.add(cylinderBetween(around(r, y, a), around(r + offset + rodR, y, a), rodR * 1.3, metalMat, 8));
    const ball = new THREE.Mesh(new THREE.SphereGeometry(rodR * 2, 10, 8), metalMat);
    ball.position.copy(around(r + offset, y, a));
    g.add(ball);
  }
  return g;
}

/** Flat spatula touch (for pinky/side keys) as a rounded slab facing outward at angle a. */
export function spatula(w, h, metalMat) {
  return roundedBox(w, 0.002, h, 0.0009, metalMat);
}

/** A closed tube tracing a 2D outline at height z (good for bindings and edges). */
export function outlineTube(pts2, z, radius, material) {
  const pts = pts2.filter((_, i) => i % 2 === 0).map((p) => new THREE.Vector3(p.x, p.y, z));
  return tube(pts, radius, material, { closed: true, segments: 240, radial: 6 });
}
